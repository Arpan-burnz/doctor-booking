import { prisma } from '../../config/db';
import type { BulkCreateSlotInput } from './slots.schema';

export const createSlots = async (userId: string, data: BulkCreateSlotInput) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new Error('Doctor profile not found');
  if (!doctor.isVerified) {
    throw new Error('wait untill u get verified');
  }

  const slots = await prisma.$transaction(
    data.slots.map((slot) =>
      prisma.availabilitySlot.create({
        data: {
          doctorId: doctor.id,
          slotDate: new Date(slot.slotDate),
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
      })
    )
  );
  return slots;
};

export const getMySlots = async (userId: string, date?: string) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new Error('Doctor profile not found');

  return prisma.availabilitySlot.findMany({
    where: {
      doctorId: doctor.id,
      ...(date ? { slotDate: new Date(date) } : {}),
    },
    orderBy: [{ slotDate: 'asc' }, { startTime: 'asc' }],
    include: { appointment: true },
  });
};

export const deleteSlot = async (slotId: string, userId: string) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new Error('Doctor profile not found');

  const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } });
  if (!slot) throw new Error('Slot not found');
  if (slot.doctorId !== doctor.id) throw new Error('Not authorized');
  if (slot.isBooked) throw new Error('Cannot delete a booked slot');

  return prisma.availabilitySlot.delete({ where: { id: slotId } });
};

export const blockDate = async (userId: string, date: string, reason?: string) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new Error('Doctor profile not found');
  if (!doctor.isVerified) {
    throw new Error('wait untill u get verified');
  }

  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

  const deleteResult = await prisma.availabilitySlot.deleteMany({
    where: {
      doctorId: doctor.id,
      slotDate: { gte: startOfDay, lte: endOfDay },
      isBooked: false,
    },
  });

  return {
    success: true,
    message: `Date blocked. Removed ${deleteResult.count} unbooked availability slot(s).`,
    removedSlots: deleteResult.count,
  };
};
