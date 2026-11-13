import cron from 'node-cron';
import { prisma } from '../config/db';
import { isSlotExpired } from '../modules/slots/slots.service';

export const startCleanupJob = () => {
  // Runs every 15 minutes — marks past unattended appointments as NO_SHOW and prunes stale unbooked slots
  cron.schedule('*/15 * * * *', async () => {
    console.log('🧹 Running cleanup job...');

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    try {
      // 1. Find candidate booked slots that might have already ended (past dates or today)
      const candidateSlots = await prisma.availabilitySlot.findMany({
        where: {
          slotDate: { lte: endOfToday },
          isBooked: true,
          appointment: {
            status: { in: ['CONFIRMED', 'PENDING'] },
          },
        },
        include: { appointment: true },
      });

      for (const slot of candidateSlots) {
        if (!slot.appointment) continue;

        if (isSlotExpired(slot.slotDate, slot.endTime, now)) {
          await prisma.appointment.update({
            where: { id: slot.appointment.id },
            data: { status: 'NO_SHOW' },
          });
          console.log(`🔴 Marked expired unattended appointment ${slot.appointment.id} as NO_SHOW`);
        }
      }

      // 2. Prune unbooked slots from prior days to avoid database bloat
      const pruned = await prisma.availabilitySlot.deleteMany({
        where: {
          slotDate: { lt: startOfToday },
          isBooked: false,
        },
      });
      if (pruned.count > 0) {
        console.log(`🧹 Pruned ${pruned.count} stale unbooked past slot(s)`);
      }

      console.log('✅ Cleanup job completed');
    } catch (err) {
      console.error('❌ Cleanup job failed:', err);
    }
  });

  console.log('🧹 Cleanup cron job scheduled (every 15 minutes)');
};
