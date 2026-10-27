import type { Request, Response, NextFunction } from 'express';
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

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const doctor = await DoctorService.updateDoctorProfile(userId, req.body);
    res.json({ success: true, data: doctor });
  } catch (err) { next(err); }
};