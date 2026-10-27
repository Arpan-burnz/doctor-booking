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
    },
  });
  if (!doctor) throw new Error('Doctor profile not found');
  return doctor;
};

export const updateDoctorProfile = async (userId: string, data: any) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new Error('Doctor profile not found');
  return prisma.doctor.update({
    where: { userId },
    data: {
      bio: data.bio,
      experience: data.experience,
      consultationFee: data.consultationFee,
    },
  });
};