import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error, req: Request, res: Response, _next: NextFunction
) => {
  console.error(`[${req.method}] ${req.path} —`, err.message);
  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    const firstMessage = Object.values(fieldErrors).flat()[0] || 'Validation failed';
    res.status(400).json({ error: firstMessage, details: fieldErrors });
    return;
  }
  const STATUS_MAP: Record<string, number> = {
    'Invalid email or password': 401,
    'Invalid credentials': 401,
    'Invalid or expired refresh token': 401,
    'Please verify your email address before logging in. Check your inbox for the verification link.': 403,
    'Please verify your email address before booking an appointment. Check your inbox for the activation link.': 403,
    'Invalid or expired verification token': 400,
    'Verification link has expired. Please request a new verification email.': 400,
    'Email already registered': 409,
    'User not found': 404,
    'Doctor fields required': 400,
    'Doctor not found': 404,
    'Doctor profile not found': 404,
    'Patient profile not found': 404,
    'Slot not found': 404,
    'Slot already booked': 409,
    'Slot does not belong to this doctor': 400,
    'Cannot delete a booked slot': 400,
    'Appointment not found': 404,
    'Already cancelled': 400,
    'Not authorized': 403,
    'wait untill u get verified': 403,
    'Account is deactivated': 403,
    'Doctor account is currently suspended': 403,
    'Doctor account is currently suspended. You are prohibited from booking slots and other features.': 403,
    'This doctor is currently suspended and cannot accept appointments.': 403,
  };

  const status = STATUS_MAP[err.message] || 400;
  res.status(status).json({ error: err.message });
};
