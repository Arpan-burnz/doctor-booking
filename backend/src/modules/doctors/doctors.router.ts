import { Router } from 'express';
import * as DoctorController from './doctors.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

export const doctorsRouter = Router();

// Doctor only (placed before /:id so 'me' is not captured as :id)
doctorsRouter.get('/me/profile',         authenticate, authorize('DOCTOR'), DoctorController.getMyProfile);
doctorsRouter.put('/me/profile',         authenticate, authorize('DOCTOR'), DoctorController.updateMyProfile);
doctorsRouter.get('/me/dashboard-stats', authenticate, authorize('DOCTOR'), DoctorController.getDashboardStats);

// Public routes
doctorsRouter.get('/',           DoctorController.getAllDoctors);
doctorsRouter.get('/:id',        DoctorController.getDoctorById);
doctorsRouter.get('/:id/slots',  DoctorController.getDoctorSlots);

// Admin only
doctorsRouter.patch('/:id/verify', authenticate, authorize('ADMIN'), DoctorController.verifyDoctor);
