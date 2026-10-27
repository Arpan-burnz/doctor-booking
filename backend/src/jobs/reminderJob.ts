import cron from 'node-cron';
import { prisma } from '../config/db';
import { sendAppointmentReminder } from '../lib/mailer';
import { sendAppointmentSMSReminder } from '../lib/sms';

export const startReminderJob = () => {
  // Runs every day at 9:00 AM — sends reminders for tomorrow's appointments
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running appointment reminder job...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          status: 'CONFIRMED',
          slot: {
            slotDate: { gte: tomorrow, lt: dayAfter },
          },
        },
        include: {
          slot: true,
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
        },
      });

      console.log(`📋 Found ${appointments.length} appointments for tomorrow`);

      for (const appt of appointments) {
        const patientEmail = appt.patient.user.email;
        const patientPhone = appt.patient.user.phone;
        const doctorName = `Dr. ${appt.doctor.specialization}`;
        const date = appt.slot.slotDate.toDateString();
        const time = appt.slot.startTime;

        // Send email reminder
        await sendAppointmentReminder(patientEmail, {
          patientName: patientEmail.split('@')[0],
          doctorName,
          date,
          startTime: time,
        });

        // Send SMS if phone exists
        if (patientPhone) {
          await sendAppointmentSMSReminder(patientPhone, doctorName, date, time);
        }
      }

      console.log('✅ Reminder job completed');
    } catch (err) {
      console.error('❌ Reminder job failed:', err);
    }
  });

  console.log('⏰ Reminder cron job scheduled (daily at 9:00 AM)');
};