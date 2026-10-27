import cron from 'node-cron';
import { prisma } from '../config/db';

export const startCleanupJob = () => {
  // Runs every hour — marks past unattended appointments as NO_SHOW
  cron.schedule('0 * * * *', async () => {
    console.log('🧹 Running cleanup job...');

    const now = new Date();

    try {
      const pastSlots = await prisma.availabilitySlot.findMany({
        where: {
          slotDate: { lt: now },
          isBooked: true,
        },
        include: { appointment: true },
      });

      for (const slot of pastSlots) {
        if (slot.appointment && slot.appointment.status === 'CONFIRMED') {
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