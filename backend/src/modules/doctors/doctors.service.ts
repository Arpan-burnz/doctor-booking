import { prisma } from '../../config/db';

export const getAllDoctors = async (specialization?: string) => {
  return prisma.doctor.findMany({
    where: {
      isVerified: true,
      ...(specialization ? { specialization } : {}),
    },
    include: {
      user: { select: { email: true, phone: true } },
      reviews: { select: { rating: true } },
    },
  });
};

export const getDoctorById = async (id: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, phone: true } },
      reviews: { select: { rating: true, comment: true, createdAt: true } },
    },
  });
  if (!doctor) throw new Error('Doctor not found');
  return doctor;
};

export const getDoctorSlots = async (doctorId: string, date?: string) => {
  return prisma.availabilitySlot.findMany({
    where: {
      doctorId,
      isBooked: false,
      appointment: null,
      ...(date ? { slotDate: new Date(date) } : {}),
    },
    orderBy: { startTime: 'asc' },
  });
};

export const verifyDoctor = async (doctorId: string) => {
  return prisma.doctor.update({
    where: { id: doctorId },
    data: { isVerified: true },
  });
};

export const getDoctorProfile = async (userId: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    include: {
      user: { select: { email: true, phone: true } },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          patient: {
            include: {
              user: { select: { email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!doctor) throw new Error('Doctor profile not found');
  return doctor;
};

export const getDoctorDashboardStats = async (userId: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    include: {
      user: { select: { email: true, phone: true } },
      reviews: {
        include: {
          patient: {
            include: {
              user: { select: { email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!doctor) throw new Error('Doctor profile not found');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Query actual doctor appointments directly from database
  const allAppointments = await prisma.appointment.findMany({
    where: { doctorId: doctor.id },
    include: {
      slot: true,
      patient: {
        include: {
          user: { select: { email: true, phone: true } },
        },
      },
      prescriptions: true,
      review: true,
    },
    orderBy: { slot: { startTime: 'asc' } },
  });

  const todayAppointments = allAppointments.filter(a => {
    if (!a.slot?.slotDate) return false;
    const d = new Date(a.slot.slotDate);
    return d >= startOfToday && d <= endOfToday;
  });

  const weekAppointments = allAppointments.filter(a => {
    if (!a.slot?.slotDate) return false;
    const d = new Date(a.slot.slotDate);
    return d >= startOfWeek && d <= endOfWeek;
  });

  const distinctPatientIds = new Set(allAppointments.map(a => a.patientId));
  const totalPatientsCount = distinctPatientIds.size;

  const totalReviews = doctor.reviews.length;
  const avgRating = totalReviews > 0
    ? Number((doctor.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
    : 0;

  return {
    todayCount: todayAppointments.length,
    weekCount: weekAppointments.length,
    totalPatients: totalPatientsCount,
    rating: avgRating,
    reviewCount: totalReviews,
    todaySchedule: todayAppointments,
    recentReviews: doctor.reviews.slice(0, 5),
    doctor: {
      id: doctor.id,
      email: doctor.user.email,
      name: doctor.name || null,
      isVerified: doctor.isVerified,
      specialization: doctor.specialization,
      bio: doctor.bio,
      consultationFee: doctor.consultationFee,
      experience: doctor.experience,
      licenseNumber: doctor.licenseNumber,
    },
  };
};

export const updateDoctorProfile = async (userId: string, data: any) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new Error('Doctor profile not found');
  return prisma.doctor.update({
    where: { userId },
    data: {
      name: data.name !== undefined ? (data.name?.trim() || null) : undefined,
      bio: data.bio,
      experience: data.experience,
      consultationFee: data.consultationFee,
    },
    include: {
      user: { select: { email: true, phone: true } },
    },
  });
};
