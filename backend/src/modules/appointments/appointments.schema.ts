import { z } from 'zod';

export const bookAppointmentSchema = z.object({
  doctorId: z.string().uuid(),
  slotId:   z.string().uuid(),
  notes:    z.string().optional(),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;