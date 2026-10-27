import { Resend } from 'resend';
import { env } from '../config/env';

const resend = env.RESEND_API_KEY && env.RESEND_API_KEY !== 're_xxxxxxxxxxxxxxxx' ? new Resend(env.RESEND_API_KEY) : null;

const FROM = env.EMAIL_FROM || 'onboarding@resend.dev';

export const sendAppointmentConfirmation = async (
  toEmail: string,
  data: {
    patientName: string;
    doctorName: string;
    date: string;
    startTime: string;
    endTime: string;
  }
) => {
  if (!resend) {
    console.log('📧 Email skipped — no RESEND_API_KEY set');
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: 'Appointment Confirmed',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#1D9E75">Appointment Confirmed ✅</h2>
        <p>Hi <strong>${data.patientName}</strong>,</p>
        <p>Your appointment has been booked successfully.</p>
        <div style="background:#f4f4f4;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Doctor:</strong> ${data.doctorName}</p>
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.startTime} – ${data.endTime}</p>
        </div>
        <p>Please arrive 10 minutes early.</p>
      </div>
    `,
  });

  console.log(`📧 Confirmation email sent to ${toEmail}`);
};

export const sendAppointmentReminder = async (
  toEmail: string,
  data: {
    patientName: string;
    doctorName: string;
    date: string;
    startTime: string;
  }
) => {
  if (!resend) {
    console.log('📧 Email skipped — no RESEND_API_KEY set');
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: 'Appointment Reminder — Tomorrow',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#F59E0B">Reminder: Appointment Tomorrow ⏰</h2>
        <p>Hi <strong>${data.patientName}</strong>,</p>
        <p>This is a reminder for your appointment tomorrow.</p>
        <div style="background:#f4f4f4;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Doctor:</strong> ${data.doctorName}</p>
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.startTime}</p>
        </div>
      </div>
    `,
  });

  console.log(`📧 Reminder email sent to ${toEmail}`);
};

export const sendCancellationEmail = async (
  toEmail: string,
  data: { patientName: string; doctorName: string; date: string }
) => {
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: 'Appointment Cancelled',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#EF4444">Appointment Cancelled</h2>
        <p>Hi <strong>${data.patientName}</strong>,</p>
        <p>Your appointment with <strong>${data.doctorName}</strong> on <strong>${data.date}</strong> has been cancelled.</p>
        <p>Please rebook at your convenience.</p>
      </div>
    `,
  });

  console.log(`📧 Cancellation email sent to ${toEmail}`);
};