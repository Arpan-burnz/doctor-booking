import { Router } from 'express';
import * as DoctorController from './doctors.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

export const doctorsRouter = Router();

// Public routes
doctorsRouter.get('/',           DoctorController.getAllDoctors);
doctorsRouter.get('/:id',        DoctorController.getDoctorById);
doctorsRouter.get('/:id/slots',  DoctorController.getDoctorSlots);

// Doctor only
doctorsRouter.get('/me/profile',    authenticate, authorize('DOCTOR'), DoctorController.getMyProfile);
doctorsRouter.put('/me/profile',    authenticate, authorize('DOCTOR'), DoctorController.updateMyProfile);

// Admin only
doctorsRouter.patch('/:id/verify', authenticate, authorize('ADMIN'), DoctorController.verifyDoctor);