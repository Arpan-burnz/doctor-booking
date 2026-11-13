import type { Request, Response, NextFunction } from 'express';
import { bulkCreateSlotSchema } from './slots.schema';
import * as SlotService from './slots.service';

export const createSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const data = bulkCreateSlotSchema.parse(req.body);
    const slots = await SlotService.createSlots(userId, data);
    res.status(201).json({ success: true, data: slots });
  } catch (err) { next(err); }
};

export const getMySlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { date, filter } = req.query as any;
    const slots = await SlotService.getMySlots(userId, date, filter);
    res.json({ success: true, data: slots });
  } catch (err) { next(err); }
};

export const reopenSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { slotId, targetDate, startTime, endTime } = req.body;
    if (!slotId || !targetDate) {
      res.status(400).json({ success: false, error: 'slotId and targetDate are required' });
      return;
    }
    const newSlot = await SlotService.reopenSlot(userId, slotId, targetDate, startTime, endTime);
    res.status(201).json({ success: true, data: newSlot, message: 'Slot reopened successfully' });
  } catch (err) { next(err); }
};

export const deleteSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    await SlotService.deleteSlot(req.params.id as string, userId);
    res.json({ success: true, message: 'Slot deleted' });
  } catch (err) { next(err); }
};

export const blockDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { date, reason } = req.body;
    if (!date) {
      res.status(400).json({ success: false, error: 'Date is required' });
      return;
    }
    const result = await SlotService.blockDate(userId, date, reason);
    res.json(result);
  } catch (err) { next(err); }
};
