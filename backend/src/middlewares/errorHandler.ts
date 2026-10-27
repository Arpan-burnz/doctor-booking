import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

const STATUS_MAP: Record<string, number> = {
  'Email already registered': 409,
  'Invalid credentials': 401,
  'Invalid or expired refresh token': 401,
  'User not found': 404,
  'Doctor fields required': 400,
};

export const errorHandler = (
  err: Error, req: Request, res: Response, _next: NextFunction
) => {
  console.error(`[${req.method}] ${req.path} —`, err.message);
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.flatten().fieldErrors });
    return;
  }
  const STATUS_MAP: Record<string, number> = {
    'Email already registered': 409,
    'Invalid credentials': 401,
    'Invalid or expired refresh token': 401,
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
  };

  const status = STATUS_MAP[err.message] || 400;
  res.status(status).json({ error: err.message });
};