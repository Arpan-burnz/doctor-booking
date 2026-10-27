import { prisma } from '../../config/db';
import type { BulkCreateSlotInput } from './slots.schema';

export const createSlots = async (userId: string, data: BulkCreateSlotInput) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new Error('Doctor profile not found');

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