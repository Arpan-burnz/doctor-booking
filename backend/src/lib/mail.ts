import twilio from 'twilio';
import { env } from '../config/env';

const client =
  env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN
    ? twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
    : null;

export const sendSMS = async (to: string, message: string) => {
  if (!client || !env.TWILIO_PHONE_NUMBER) {
    console.log(`📱 SMS skipped (no Twilio keys) → ${to}: ${message}`);
    return;
  }

  try {
    await client.messages.create({
      body: message,
      from: env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log(`📱 SMS sent to ${to}`);
  } catch (err) {
    console.error(`📱 SMS failed to ${to}:`, err);
  }
};

export const sendAppointmentSMSReminder = async (
  phone: string,
  doctorName: string,
  date: string,
  time: string
) => {
  const message = `Reminder: You have an appointment with ${doctorName} on ${date} at ${time}. Please arrive 10 mins early.`;
  await sendSMS(phone, message);
};

export const sendBookingConfirmationSMS = async (
  phone: string,
  doctorName: string,
  date: string,
  time: string
) => {
  const message = `Booking confirmed! Appointment with ${doctorName} on ${date} at ${time}.`;
  await sendSMS(phone, message);
};