import { prisma } from '../../config/db';
import type { BulkCreateSlotInput } from './slots.schema';
import { isDoctorSuspended } from '../../lib/suspension';

export const isSlotExpired = (slotDate: Date, endTime: string, now: Date = new Date()): boolean => {
  const slotD = new Date(slotDate);
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const nowDate = now.getDate();

  const slotYear = slotD.getFullYear();
  const slotMonth = slotD.getMonth();
  const slotDay = slotD.getDate();

  // If slot calendar day is before today
  if (
    slotYear < nowYear ||
    (slotYear === nowYear && slotMonth < nowMonth) ||
    (slotYear === nowYear && slotMonth === nowMonth && slotDay < nowDate)
  ) {
    return true;
  }

  // If slot calendar day is today, check if endTime has passed
  if (slotYear === nowYear && slotMonth === nowMonth && slotDay === nowDate) {
    const [endH, endM] = (endTime || '00:00').split(':').map(Number);
    const nowH = now.getHours();
    const nowM = now.getMinutes();
    return nowH > endH || (nowH === endH && nowM >= endM);
  }

  // Future date
  return false;
};

export const createSlots = async (userId: string, data: BulkCreateSlotInput) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new Error('Doctor profile not found');
  if (!doctor.isVerified) {
    throw new Error('wait untill u get verified');
  }
  const suspended = await isDoctorSuspended({ doctorId: doctor.id });
  if (suspended) {
    throw new Error('Doctor account is currently suspended');
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

export const getMySlots = async (
  userId: string,
  date?: string,
  filter: 'active' | 'expired' | 'all' = 'active'
) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new Error('Doctor profile not found');

  const allSlots = await prisma.availabilitySlot.findMany({
    where: {
      doctorId: doctor.id,
      ...(date ? { slotDate: new Date(date) } : {}),
    },
    orderBy: [{ slotDate: 'asc' }, { startTime: 'asc' }],
    include: {
      appointment: {
        include: {
          patient: {
            include: {
              user: { select: { name: true, email: true, phone: true } },
            },
          },
        },
      },
    },
  });

  const now = new Date();

  const enrichedSlots = allSlots.map((slot) => ({
    ...slot,
    isExpired: isSlotExpired(slot.slotDate, slot.endTime, now),
  }));

  if (filter === 'all') {
    return enrichedSlots;
  }

  if (filter === 'expired') {
    return enrichedSlots.filter((s) => s.isExpired);
  }

  // Default 'active': Once a slot is booked (or unbooked) and its time expires, remove it from active slots!
  return enrichedSlots.filter((s) => !s.isExpired);
};

export const reopenSlot = async (
  userId: string,
  slotId: string,
  targetDate: string,
  startTime?: string,
  endTime?: string
) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new Error('Doctor profile not found');
  if (!doctor.isVerified) {
    throw new Error('wait untill u get verified');
  }
  const suspended = await isDoctorSuspended({ doctorId: doctor.id });
  if (suspended) {
    throw new Error('Doctor account is currently suspended');
  }

  const existingSlot = await prisma.availabilitySlot.findUnique({
    where: { id: slotId },
  });
  if (!existingSlot || existingSlot.doctorId !== doctor.id) {
    throw new Error('Slot not found or unauthorized');
  }

  const finalStartTime = startTime || existingSlot.startTime;
  const finalEndTime = endTime || existingSlot.endTime;
  const finalSlotDate = new Date(targetDate);

  // Validate that the target date and time is in the future
  const now = new Date();
  if (isSlotExpired(finalSlotDate, finalStartTime, now)) {
    throw new Error('Cannot reopen slot in the past. Please select a future date and time.');
  }

  // Check if a slot already exists for this doctor at the exact date and time
  const startOfDay = new Date(finalSlotDate.getFullYear(), finalSlotDate.getMonth(), finalSlotDate.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(finalSlotDate.getFullYear(), finalSlotDate.getMonth(), finalSlotDate.getDate(), 23, 59, 59, 999);

  const duplicate = await prisma.availabilitySlot.findFirst({
    where: {
      doctorId: doctor.id,
      slotDate: { gte: startOfDay, lte: endOfDay },
      startTime: finalStartTime,
    },
  });

  if (duplicate) {
    throw new Error(`A slot already exists at ${finalStartTime} on ${finalSlotDate.toDateString()}`);
  }

  const newSlot = await prisma.availabilitySlot.create({
    data: {
      doctorId: doctor.id,
      slotDate: finalSlotDate,
      startTime: finalStartTime,
      endTime: finalEndTime,
      isBooked: false,
    },
    include: { appointment: true },
  });

  return newSlot;
};

export const deleteSlot = async (slotId: string, userId: string) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new Error('Doctor profile not found');

  const suspended = await isDoctorSuspended({ doctorId: doctor.id });
  if (suspended) {
    throw new Error('Doctor account is currently suspended');
  }

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

  const suspended = await isDoctorSuspended({ doctorId: doctor.id });
  if (suspended) {
    throw new Error('Doctor account is currently suspended');
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
