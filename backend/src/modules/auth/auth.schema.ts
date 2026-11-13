import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(7, 'Please enter a valid mobile number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
  role: z.enum(['PATIENT', 'DOCTOR']).default('PATIENT'),
  // Optional patient fields (as shown in UI)
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  termsAccepted: z.boolean().optional(),
  // Optional doctor credentials
  specialization: z.string().optional(),
  experienceYears: z.preprocess((val) => (val === '' || val === undefined || val === null ? undefined : Number(val)), z.number().optional()),
  licenseNumber: z.string().optional(),
  medicalCouncil: z.string().optional(),
  certificateUrl: z.string().optional(),
  consultationFee: z.preprocess((val) => (val === '' || val === undefined || val === null ? undefined : Number(val)), z.number().optional()),
  bio: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;