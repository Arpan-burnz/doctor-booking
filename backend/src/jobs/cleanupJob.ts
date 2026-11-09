import cron from 'node-cron';
import { prisma } from '../config/db';

export const startCleanupJob = () => {
  // Runs every hour — marks past unattended appointments as NO_SHOW
  cron.schedule('0 * * * *', async () => {
    console.log('🧹 Running cleanup job...');

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    try {
      // Find candidate booked slots that might have already ended (past dates or today)
      const candidateSlots = await prisma.availabilitySlot.findMany({
        where: {
          slotDate: { lte: endOfToday },
          isBooked: true,
          appointment: {
            status: 'CONFIRMED',
          },
        },
        include: { appointment: true },
      });

      for (const slot of candidateSlots) {
        if (!slot.appointment) continue;

        const slotDate = new Date(slot.slotDate);
        let isPast = false;

        if (slotDate < startOfToday) {
          // Appointment was on a prior calendar day
          isPast = true;
        } else {
          // Appointment is today: check if slot.endTime has passed
          const timeParts = slot.endTime.split(':').map(Number);
          const endHours = timeParts[0] || 0;
          const endMins = timeParts[1] || 0;

          const slotEndDateTime = new Date(
            slotDate.getFullYear(),
            slotDate.getMonth(),
            slotDate.getDate(),
            endHours,
            endMins,
            0,
            0
          );

          if (slotEndDateTime < now) {
            isPast = true;
          }
        }

        if (isPast) {
          await prisma.appointment.update({
            where: { id: slot.appointment.id },
            data: { status: 'NO_SHOW' },
          });
          console.log(`🔴 Marked appointment ${slot.appointment.id} as NO_SHOW`);
        }
      }

      console.log('✅ Cleanup job completed');
    } catch (err) {
      console.error('❌ Cleanup job failed:', err);
    }
  });

  console.log('🧹 Cleanup cron job scheduled (every hour)');
};
