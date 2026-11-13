import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as DoctorService from './doctors.service';

export const getAllDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { specialization } = req.query as any;
    const doctors = await DoctorService.getAllDoctors(specialization);
    res.json({ success: true, data: doctors });
  } catch (err) { next(err); }
};

export const getDoctorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await DoctorService.getDoctorById(req.params.id as string);
    res.json({ success: true, data: doctor });
  } catch (err) { next(err); }
};

export const getDoctorSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query as any;
    const slots = await DoctorService.getDoctorSlots(req.params.id as string, date);
    res.json({ success: true, data: slots });
  } catch (err) { next(err); }
};

export const verifyDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await DoctorService.verifyDoctor(req.params.id as string);
    res.json({ success: true, data: doctor });
  } catch (err) { next(err); }
};

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const doctor = await DoctorService.getDoctorProfile(userId);
    res.json({ success: true, data: doctor });
  } catch (err) { next(err); }
};

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const stats = await DoctorService.getDoctorDashboardStats(userId);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const updateProfileSchema = z.object({
      name: z.string().min(2).max(100).optional(),
      bio: z.string().max(1000).optional().nullable(),
      experience: z.number().int().min(0).max(60).optional().nullable(),
      consultationFee: z.number().int().min(1).max(100000).optional(),
    });
    const data = updateProfileSchema.parse(req.body);
    const doctor = await DoctorService.updateDoctorProfile(userId, data);
    res.json({ success: true, data: doctor });
  } catch (err) { next(err); }
};
