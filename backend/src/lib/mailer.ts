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

export const sendVerificationEmail = async (
  toEmail: string,
  verificationUrl: string,
  userName?: string
) => {
  const recipientName = userName || 'there';
  console.log(`📧 [Verification Link] For ${toEmail}: ${verificationUrl}`);

  if (!resend) {
    console.log('📧 Email sending skipped — RESEND_API_KEY not configured or is placeholder');
    return;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: toEmail,
      subject: 'Verify your email address — DOC4U Care Portal',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="margin-bottom: 20px;">
            <span style="font-size: 20px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px;">DOC<span style="color: #10b981;">4U</span></span>
          </div>
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 8px;">Verify your email address</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
            Hi ${recipientName}, thanks for creating an account with DOC4U! Please click the button below to verify your email address and activate your account.
          </p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${verificationUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            If you did not create an account on DOC4U, you can safely ignore this email. This link will expire in 24 hours.<br/>
            Direct link: <a href="${verificationUrl}" style="color: #0284c7;">${verificationUrl}</a>
          </p>
        </div>
      `,
    });
    console.log(`📧 Verification email sent to ${toEmail}`);
  } catch (err) {
    console.error(`❌ Failed to send verification email to ${toEmail}:`, err);
  }
};