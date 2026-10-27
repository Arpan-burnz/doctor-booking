import type { Request, Response, NextFunction } from 'express';
import { uploadFile } from '../../lib/storage';
import { prisma } from '../../config/db';

export const uploadPrescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { appointmentId, diagnosis } = req.body;
    if (!appointmentId) {
      res.status(400).json({ error: 'appointmentId is required' });
      return;
    }

    const fileUrl = await uploadFile(req.file, 'prescriptions');

    const prescription = await prisma.prescription.create({
      data: { appointmentId, fileUrl, diagnosis },
    });

    res.status(201).json({ success: true, data: prescription });
  } catch (err) { next(err); }
};

export const getPrescriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { appointmentId: req.params.appointmentId as string },
    });
    res.json({ success: true, data: prescriptions });
  } catch (err) { next(err); }
};

export const getMyPrescriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      res.status(404).json({ error: 'Patient profile not found' });
      return;
    }

    const prescriptions = await prisma.prescription.findMany({
      where: {
        appointment: {
          patientId: patient.id,
        },
      },
      include: {
        appointment: {
          include: {
            doctor: {
              include: {
                user: {
                  select: {
                    email: true,
                    phone: true,
                  },
                },
              },
            },
            slot: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    res.json({ success: true, data: prescriptions });
  } catch (err) { next(err); }
};

export const patientUploadPrescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { appointmentId, diagnosis } = req.body;
    if (!appointmentId) {
      res.status(400).json({ error: 'appointmentId is required' });
      return;
    }

    const userId = (req as any).user.userId;
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      res.status(404).json({ error: 'Patient profile not found' });
      return;
    }

    // Verify appointment belongs to this patient
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });
    if (!appointment || appointment.patientId !== patient.id) {
      res.status(403).json({ error: 'Unauthorized to add prescription to this appointment' });
      return;
    }

    const fileUrl = await uploadFile(req.file, 'prescriptions');

    const prescription = await prisma.prescription.create({
      data: { appointmentId, fileUrl, diagnosis },
    });

    res.status(201).json({ success: true, data: prescription });
  } catch (err) { next(err); }
};