import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import * as PrescriptionController from './prescriptions.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const prescriptionsRouter = Router();

prescriptionsRouter.post(
  '/',
  authenticate,
  authorize('DOCTOR'),
  (req, res, next) => {
    console.log('📁 Prescription upload request received');
    console.log('Headers:', req.headers['content-type']);
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('❌ Multer error:', err.message);
        res.status(400).json({ error: err.message });
        return;
      }
      console.log('✅ Multer processed file:', req.file ? req.file.originalname : 'NO FILE');
      console.log('Body fields:', req.body);
      next();
    });
  },
  PrescriptionController.uploadPrescription
);

prescriptionsRouter.get(
  '/patient/mine',
  authenticate,
  authorize('PATIENT'),
  PrescriptionController.getMyPrescriptions
);

prescriptionsRouter.post(
  '/patient/upload',
  authenticate,
  authorize('PATIENT'),
  (req, res, next) => {
    console.log('📁 Patient Prescription upload request received');
    upload.single('file')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  },
  PrescriptionController.patientUploadPrescription
);

prescriptionsRouter.get(
  '/:appointmentId',
  authenticate,
  PrescriptionController.getPrescriptions
);