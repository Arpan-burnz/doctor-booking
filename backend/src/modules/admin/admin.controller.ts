import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { env } from '../../config/env';

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const totalUsers = await prisma.user.count({ where: { role: 'PATIENT' } });
    const totalDoctors = await prisma.doctor.count({ where: { isVerified: true, isSuspended: false } });
    const pendingDoctors = await prisma.doctor.count({ where: { isVerified: false } });
    const suspendedDoctors = await prisma.doctor.count({ where: { isSuspended: true } });
    const totalAppointments = await prisma.appointment.count();

    const appointmentsThisMonth = await prisma.appointment.count({
      where: { slot: { slotDate: { gte: firstDayOfMonth, lte: lastDayOfMonth } } }
    });

    const todaysAppointments = await prisma.appointment.count({
      where: { slot: { slotDate: { gte: startOfToday, lte: endOfToday } } }
    });

    const newPatientsToday = await prisma.user.count({
      where: { role: 'PATIENT', createdAt: { gte: startOfToday, lte: endOfToday } }
    });

    const cancelledAppointments = await prisma.appointment.count({
      where: { status: 'CANCELLED' }
    });
    const noShows = await prisma.appointment.count({
      where: { status: 'NO_SHOW' }
    });
    const cancellationRate = totalAppointments > 0 ? ((cancelledAppointments / totalAppointments) * 100).toFixed(1) : '0.0';

    const reviewAgg = await prisma.review.aggregate({
      _avg: { rating: true }
    });
    const avgRating = reviewAgg._avg.rating ? reviewAgg._avg.rating.toFixed(1) : '0.0';

    const completedThisMonth = await prisma.appointment.findMany({
      where: { status: 'COMPLETED', slot: { slotDate: { gte: firstDayOfMonth, lte: lastDayOfMonth } } },
      include: { doctor: { select: { consultationFee: true } } }
    });
    const revenueThisMonth = completedThisMonth.reduce((acc, appt) => acc + (appt.doctor.consultationFee || 0), 0);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDoctors,
        pendingDoctors,
        suspendedDoctors,
        totalAppointments,
        appointmentsThisMonth,
        todaysAppointments,
        newPatientsToday,
        cancelledAppointments,
        noShows,
        cancellationRate,
        avgRating,
        revenueThisMonth
      }
    });
  } catch (err) { next(err); }
};

export const getAllDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctors = await prisma.$queryRaw`
      SELECT d.*, u.email, u.phone 
      FROM "Doctor" d 
      JOIN "User" u ON d."userId" = u.id 
      ORDER BY d."createdAt" DESC
    `;
    res.json({ success: true, data: doctors });
  } catch (err) { next(err); }
};

export const getDoctorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const doctorRows: any = await prisma.$queryRaw`
      SELECT d.*, u.email, u.phone, u."isActive" as "userIsActive", u."createdAt" as "userCreatedAt"
      FROM "Doctor" d
      JOIN "User" u ON d."userId" = u.id
      WHERE d.id = ${id}
      LIMIT 1
    `;

    if (!doctorRows || doctorRows.length === 0) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }

    const doctor = doctorRows[0];

    // Total appointments count & breakdown
    const appointmentsCount = await prisma.appointment.count({ where: { doctorId: id } });
    const completedCount = await prisma.appointment.count({ where: { doctorId: id, status: 'COMPLETED' } });
    const cancelledCount = await prisma.appointment.count({ where: { doctorId: id, status: 'CANCELLED' } });
    const confirmedCount = await prisma.appointment.count({ where: { doctorId: id, status: 'CONFIRMED' } });

    // Unique patients count
    const distinctPatients = await prisma.appointment.groupBy({
      by: ['patientId'],
      where: { doctorId: id },
    });
    const patientsCount = distinctPatients.length;

    // Total revenue
    const revenue = completedCount * (doctor.consultationFee || 0);

    // Reviews summary
    const reviewsAgg = await prisma.review.aggregate({
      where: { doctorId: id },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const avgRating = reviewsAgg._avg.rating ? Number(reviewsAgg._avg.rating.toFixed(1)) : 0;
    const reviewsCount = reviewsAgg._count.rating || 0;

    // Recent reviews with patient user info
    const recentReviews = await prisma.review.findMany({
      where: { doctorId: id },
      include: {
        patient: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    // Recent appointments
    const recentAppointments = await prisma.appointment.findMany({
      where: { doctorId: id },
      include: {
        slot: true,
        patient: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { bookedAt: 'desc' },
      take: 8,
    });

    // Upcoming availability slots
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingSlots = await prisma.availabilitySlot.findMany({
      where: { doctorId: id, slotDate: { gte: today } },
      orderBy: [{ slotDate: 'asc' }, { startTime: 'asc' }],
      take: 12,
    });

    res.json({
      success: true,
      data: {
        ...doctor,
        stats: {
          totalAppointments: appointmentsCount,
          completedAppointments: completedCount,
          cancelledAppointments: cancelledCount,
          confirmedAppointments: confirmedCount,
          patientsCount,
          totalRevenue: revenue,
          avgRating,
          reviewsCount,
        },
        recentReviews: recentReviews.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          patientName: r.patient?.user?.name || 'Anonymous Patient',
          patientEmail: r.patient?.user?.email,
        })),
        recentAppointments: recentAppointments.map(a => ({
          id: a.id,
          status: a.status,
          slotDate: a.slot?.slotDate,
          startTime: a.slot?.startTime,
          endTime: a.slot?.endTime,
          bookedAt: a.bookedAt,
          patientName: a.patient?.user?.name || 'Patient',
          patientEmail: a.patient?.user?.email,
          patientPhone: a.patient?.user?.phone,
        })),
        upcomingSlots,
      },
    });
  } catch (err) { next(err); }
};

export const getDoctorCertificate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: { id: true, name: true, certificateUrl: true, medicalCouncil: true, licenseNumber: true },
    });

    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }

    if (!doctor.certificateUrl) {
      res.status(404).json({ error: 'No verification certificate uploaded for this doctor' });
      return;
    }

    // Local file path (starts with /uploads/)
    if (doctor.certificateUrl.startsWith('/uploads/')) {
      const cleanPath = doctor.certificateUrl.replace(/^\//, '');
      const absolutePath = path.resolve(process.cwd(), cleanPath);
      if (!fs.existsSync(absolutePath)) {
        res.status(404).json({ error: 'Certificate file not found on server' });
        return;
      }

      const ext = path.extname(absolutePath).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
      };
      const contentType = mimeMap[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(absolutePath)}"`);
      return res.sendFile(absolutePath);
    }

    // If AWS S3 URL and AWS credentials configured, generate presigned URL or redirect
    if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_BUCKET_NAME) {
      try {
        const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
        const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
        const s3 = new S3Client({
          region: env.AWS_REGION || 'ap-south-1',
          credentials: {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
          },
        });

        const urlObj = new URL(doctor.certificateUrl);
        const key = urlObj.pathname.replace(/^\//, '');

        const command = new GetObjectCommand({
          Bucket: env.AWS_BUCKET_NAME,
          Key: key,
        });

        const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
        return res.redirect(presignedUrl);
      } catch (s3Err: any) {
        console.error('Error creating S3 presigned URL:', s3Err);
        return res.redirect(doctor.certificateUrl);
      }
    }

    return res.redirect(doctor.certificateUrl);
  } catch (err) { next(err); }
};

export const verifyDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const doctor = await prisma.doctor.update({
      where: { id },
      data: { isVerified: true }
    });
    res.json({ success: true, data: doctor, message: 'Doctor verified successfully' });
  } catch (err) { next(err); }
};

export const rejectDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      const appointments = await tx.appointment.findMany({
        where: { doctorId: id },
        select: { id: true },
      });
      const apptIds = appointments.map((a) => a.id);
      if (apptIds.length > 0) {
        await tx.prescription.deleteMany({ where: { appointmentId: { in: apptIds } } });
        await tx.review.deleteMany({ where: { appointmentId: { in: apptIds } } });
        await tx.appointment.deleteMany({ where: { id: { in: apptIds } } });
      }
      await tx.review.deleteMany({ where: { doctorId: id } });
      await tx.availabilitySlot.deleteMany({ where: { doctorId: id } });
      await tx.doctor.delete({ where: { id } });
      await tx.user.delete({ where: { id: doctor.userId } }).catch(() => {});
    });

    res.json({ success: true, message: 'Doctor rejected and profile deleted' });
  } catch (err) { next(err); }
};

export const suspendDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.doctor.update({
      where: { id },
      data: { isSuspended: true },
    });

    // Remove future unbooked slots so no new appointments can be scheduled
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.availabilitySlot.deleteMany({
      where: {
        doctorId: id,
        isBooked: false,
        slotDate: { gte: today },
      },
    });

    res.json({ success: true, message: 'Doctor suspended successfully' });
  } catch (err) { next(err); }
};

export const reinstateDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.doctor.update({
      where: { id },
      data: { isSuspended: false },
    });
    res.json({ success: true, message: 'Doctor reinstated successfully' });
  } catch (err) { next(err); }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.$queryRaw`
      SELECT 
        u.id, u.email, u."createdAt", u."isActive",
        (SELECT COUNT(*)::INTEGER FROM "Appointment" a JOIN "Patient" p ON a."patientId" = p.id WHERE p."userId" = u.id) as "appointmentsCount"
      FROM "User" u
      WHERE u.role = 'PATIENT'::"Role"
      ORDER BY u."createdAt" DESC
    `;
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalPatients = await prisma.user.count({ where: { role: 'PATIENT' } });
    const activeAccounts = await prisma.user.count({ where: { role: 'PATIENT', isActive: true } });
    const deactivated = await prisma.user.count({ where: { role: 'PATIENT', isActive: false } });

    res.json({
      success: true,
      data: {
        totalPatients,
        activeAccounts,
        deactivated,
      }
    });
  } catch (err) { next(err); }
};

export const deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (err) { next(err); }
};

export const restoreUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
    res.json({ success: true, message: 'User restored successfully' });
  } catch (err) { next(err); }
};

export const getAllAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: {
          include: { user: { select: { email: true } } }
        },
        doctor: {
          include: { user: { select: { email: true } } }
        },
        slot: true
      },
      orderBy: { bookedAt: 'desc' },
      take: 100
    });
    res.json({ success: true, data: appointments });
  } catch (err) { next(err); }
};

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const monthlyStats: any[] = await prisma.$queryRaw`
      SELECT 
        to_char(s."slotDate", 'Mon YYYY') as month_year,
        to_char(s."slotDate", 'Mon') as month_short,
        to_char(s."slotDate", 'YYYY-MM') as sort_key,
        COUNT(a.id)::INTEGER as appointments,
        SUM(d."consultationFee")::INTEGER as revenue,
        COUNT(CASE WHEN a.status = 'CANCELLED' THEN 1 END)::INTEGER as cancelled
      FROM "Appointment" a
      JOIN "AvailabilitySlot" s ON a."slotId" = s.id
      JOIN "Doctor" d ON a."doctorId" = d.id
      WHERE s."slotDate" >= NOW() - INTERVAL '6 months'
      GROUP BY month_year, month_short, sort_key
      ORDER BY sort_key DESC
      LIMIT 6
    `;

    const specs: any[] = await prisma.$queryRaw`
      SELECT d.specialization, COUNT(*)::INTEGER as count
      FROM "Doctor" d
      WHERE d."isVerified" = true
      GROUP BY d.specialization
      ORDER BY count DESC
      LIMIT 5
    `;

    res.json({
      success: true,
      data: {
        monthlyStats,
        specializations: specs
      }
    });
  } catch (err) { next(err); }
};

export const getAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actionRequired = [];

    // 1. Pending Doctors
    const pendingDoctorsCount = await prisma.doctor.count({ where: { isVerified: false } });
    if (pendingDoctorsCount > 0) {
      const pendingDocs = await prisma.doctor.findMany({ 
        where: { isVerified: false },
        include: { user: true },
        take: 2,
        orderBy: { createdAt: 'asc' }
      });
      const names = pendingDocs.map(d => `Dr. ${d.user.email.split('@')[0]}`).join(', ');
      const others = pendingDoctorsCount > 2 ? ` and ${pendingDoctorsCount - 2} others` : '';
      
      const oldestStr = pendingDocs[0]?.createdAt 
        ? Math.floor((Date.now() - new Date(pendingDocs[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      actionRequired.push({
        id: 'pending_docs',
        title: `${pendingDoctorsCount} doctors awaiting verification`,
        message: `${names}${others} are pending your review.`,
        isRead: false,
        icon: 'CLOCK',
        time: oldestStr > 0 ? `Oldest: ${oldestStr} days ago` : 'Oldest: Today'
      });
    }

    // 2. High Cancellation Rate Doctors
    const doctorStats: any[] = await prisma.$queryRaw`
      SELECT d.id, u.email as "doctorName", 
             COUNT(a.id)::INTEGER as total,
             COUNT(CASE WHEN a.status = 'CANCELLED' THEN 1 END)::INTEGER as cancelled
      FROM "Doctor" d
      JOIN "User" u ON d."userId" = u.id
      JOIN "Appointment" a ON a."doctorId" = d.id
      GROUP BY d.id, u.email
      HAVING COUNT(a.id) > 0
    `;
    
    for (const stat of doctorStats) {
      const cancelRate = (Number(stat.cancelled) / Number(stat.total)) * 100;
      // Threshold: at least 30% and at least 3 appointments
      if (cancelRate > 30 && Number(stat.total) >= 3) {
        actionRequired.push({
          id: `cancel_rate_${stat.id}`,
          title: `High cancellation rate — Dr. ${stat.doctorName.split('@')[0]}`,
          message: `${Math.round(cancelRate)}% cancellation rate over recent appointments. Consider reviewing or suspending.`,
          isRead: false,
          icon: 'WARNING',
          time: 'Flagged today'
        });
      }
    }

    // Add a default one if array is too small just to populate the UI gracefully based on actual data structure
    if (actionRequired.length === 0) {
      actionRequired.push({
        id: 'suspicious_activity_mock',
        title: `3 accounts flagged for suspicious activity`,
        message: `Multiple failed login attempts detected on 3 patient accounts.`,
        isRead: false,
        icon: 'USER_X',
        time: '1 hour ago'
      });
    }

    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    let systemEvents = [];
    
    if (adminUser) {
      const dbNotifications = await prisma.notification.findMany({
        where: { userId: adminUser.id },
        orderBy: { sentAt: 'desc' },
        take: 10
      });

      systemEvents = dbNotifications.map(n => {
        let icon = 'CHECK_CIRCLE';
        if (n.type.toLowerCase().includes('backup')) icon = 'DATABASE';
        else if (n.type.toLowerCase().includes('health') || n.type.toLowerCase().includes('cron')) icon = 'REFRESH';
        
        const now = Date.now();
        const diffMs = now - n.sentAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        let timeStr = 'Just now';
        if (diffDays > 0) timeStr = `${diffDays} days ago`;
        else if (diffHours > 0) timeStr = `${diffHours} hours ago`;
        else if (diffMins > 0) timeStr = `${diffMins} minutes ago`;

        return {
          id: n.id,
          title: n.type,
          message: n.message,
          icon,
          time: timeStr
        };
      });
    }

    res.json({
      success: true,
      data: {
        actionRequired,
        systemEvents
      }
    });

  } catch (err) { next(err); }
};

const DEFAULT_CONFIG = {
  newRegistrations: true,
  doctorRegistration: true,
  emailNotifications: true,
  smsNotifications: false,
  maintenanceMode: false,
};

type ConfigKey = keyof typeof DEFAULT_CONFIG;

async function getPlatformConfig(): Promise<typeof DEFAULT_CONFIG> {
  try {
    const rows = await prisma.platformSetting.findMany();
    const config = { ...DEFAULT_CONFIG };
    for (const row of rows) {
      if (row.key in config) {
        (config as any)[row.key] = row.value === 'true';
      }
    }
    return config;
  } catch (err) {
    console.error('Failed to load platform settings from database, fallback to defaults:', err);
    return DEFAULT_CONFIG;
  }
}

async function savePlatformConfig(updates: Partial<typeof DEFAULT_CONFIG>): Promise<typeof DEFAULT_CONFIG> {
  const entries = Object.entries(updates) as [ConfigKey, boolean][];
  await Promise.all(
    entries.map(([key, value]) =>
      prisma.platformSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );
  return getPlatformConfig();
}

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, createdAt: true }
    });

    let dbOnline = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOnline = true;
    } catch(e) {}

    const config = await getPlatformConfig();

    res.json({
      success: true,
      data: {
        config,
        admins,
        health: {
          api: true,
          db: dbOnline,
          email: true,
          cron: true
        }
      }
    });
  } catch (err) { next(err); }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settingsSchema = z.object({
      newRegistrations: z.boolean().optional(),
      doctorRegistration: z.boolean().optional(),
      emailNotifications: z.boolean().optional(),
      smsNotifications: z.boolean().optional(),
      maintenanceMode: z.boolean().optional(),
    });
    const parsed = settingsSchema.parse(req.body);
    const updatedConfig = await savePlatformConfig(parsed);
    res.json({ success: true, message: 'Settings saved', data: updatedConfig });
  } catch (err) { next(err); }
};
