import { env } from '../config/env';

let client: any = null;

const initTwilio = () => {
  if (
    env.TWILIO_ACCOUNT_SID && env.TWILIO_ACCOUNT_SID !== 'ACxxxxxxxxxxxxxxxx' &&
    env.TWILIO_AUTH_TOKEN && env.TWILIO_AUTH_TOKEN !== 'xxxxxxxxxxxxxxxx'
  ) {
    try {
      const twilio = require('twilio');
      client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    } catch {
      console.log('📱 Twilio not available');
    }
  }
};

initTwilio();

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
    console.error(`📱 SMS failed:`, err);
  }
};

export const sendAppointmentSMSReminder = async (
  phone: string,
  doctorName: string,
  date: string,
  time: string
) => {
  await sendSMS(phone, `Reminder: Appointment with ${doctorName} on ${date} at ${time}.`);
};

export const sendBookingConfirmationSMS = async (
  phone: string,
  doctorName: string,
  date: string,
  time: string
) => {
  await sendSMS(phone, `Booking confirmed! Appointment with ${doctorName} on ${date} at ${time}.`);
};