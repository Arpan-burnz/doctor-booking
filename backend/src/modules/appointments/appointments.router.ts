import { Router } from 'express';
import * as AppointmentController from './appointments.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

export const appointmentsRouter = Router();

// Patient — book and view
appointmentsRouter.post('/',
  authenticate, authorize('PATIENT'), AppointmentController.bookAppointment);

// Patient + Doctor — view their own
appointmentsRouter.get('/mine',
  authenticate, authorize('PATIENT', 'DOCTOR'), AppointmentController.getMyAppointments);

// Any authenticated user
appointmentsRouter.get('/:id',
  authenticate, AppointmentController.getAppointmentById);

// Cancel — patient or doctor
appointmentsRouter.patch('/:id/cancel',
  authenticate, authorize('PATIENT', 'DOCTOR'), AppointmentController.cancelAppointment);

// Complete — doctor only
appointmentsRouter.patch('/:id/complete',
  authenticate, authorize('DOCTOR'), AppointmentController.completeAppointment);

// Reschedule — patient
appointmentsRouter.patch('/:id/reschedule',
  authenticate, authorize('PATIENT'), AppointmentController.rescheduleAppointment);

// Notes — patient
appointmentsRouter.patch('/:id/notes',
  authenticate, authorize('PATIENT'), AppointmentController.updateAppointmentNotes);

// Review — patient
appointmentsRouter.post('/:id/review',
  authenticate, authorize('PATIENT'), AppointmentController.createAppointmentReview);

// Resend Reminder — patient
appointmentsRouter.post('/:id/resend-reminder',
  authenticate, authorize('PATIENT'), AppointmentController.resendAppointmentReminder);

