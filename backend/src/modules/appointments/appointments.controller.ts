import type { Request, Response, NextFunction } from 'express';
import { bookAppointmentSchema } from './appointments.schema';
import * as AppointmentService from './appointments.service';

export const bookAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const data = bookAppointmentSchema.parse(req.body);
    const appointment = await AppointmentService.bookAppointment(userId, data);
    res.status(201).json({ success: true, data: appointment });
  } catch (err) { next(err); }
};

export const getMyAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, role } = (req as any).user;
    const appointments = await AppointmentService.getMyAppointments(userId, role);
    res.json({ success: true, data: appointments });
  } catch (err) { next(err); }
};

export const getAppointmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, role } = (req as any).user;
    const appointment = await AppointmentService.getAppointmentById(req.params.id as string, userId, role);
    res.json({ success: true, data: appointment });
  } catch (err) { next(err); }
};

export const cancelAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const appointment = await AppointmentService.cancelAppointment(req.params.id as string, userId);
    res.json({ success: true, data: appointment });
  } catch (err) { next(err); }
};

export const completeAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const appointment = await AppointmentService.completeAppointment(req.params.id as string, userId);
    res.json({ success: true, data: appointment });
  } catch (err) { next(err); }
};

export const rescheduleAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { slotId } = req.body;
    const appointment = await AppointmentService.rescheduleAppointment(req.params.id as string, slotId, userId);
    res.json({ success: true, data: appointment });
  } catch (err) { next(err); }
};

export const updateAppointmentNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { notes } = req.body;
    const appointment = await AppointmentService.updateAppointmentNotes(req.params.id as string, notes, userId);
    res.json({ success: true, data: appointment });
  } catch (err) { next(err); }
};

export const createAppointmentReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { rating, comment } = req.body;
    const review = await AppointmentService.createAppointmentReview(req.params.id as string, Number(rating), comment, userId);
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
};

export const resendAppointmentReminder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const result = await AppointmentService.resendAppointmentReminder(req.params.id as string, userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};


 