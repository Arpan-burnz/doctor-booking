import { z } from 'zod';

export const createSlotSchema = z.object({
  slotDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: 'Invalid date format. Use YYYY-MM-DD',
  }),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
});

export const bulkCreateSlotSchema = z.object({
  slots: z.array(createSlotSchema).min(1, 'At least one slot required'),
});

export type CreateSlotInput = z.infer<typeof createSlotSchema>;
export type BulkCreateSlotInput = z.infer<typeof bulkCreateSlotSchema>;