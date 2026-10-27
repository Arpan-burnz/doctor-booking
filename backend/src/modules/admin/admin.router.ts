import { Router } from 'express';
import * as AdminController from './admin.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

export const adminRouter = Router();

adminRouter.use(authenticate, authorize('ADMIN'));

adminRouter.get('/stats', AdminController.getStats);
adminRouter.get('/doctors', AdminController.getAllDoctors);
adminRouter.patch('/doctors/:id/verify', AdminController.verifyDoctor);
adminRouter.delete('/doctors/:id/reject', AdminController.rejectDoctor);
adminRouter.patch('/doctors/:id/suspend', AdminController.suspendDoctor);
adminRouter.patch('/doctors/:id/reinstate', AdminController.reinstateDoctor);
adminRouter.get('/users', AdminController.getUsers);
adminRouter.get('/users/stats', AdminController.getUserStats);
adminRouter.patch('/users/:id/deactivate', AdminController.deactivateUser);
adminRouter.patch('/users/:id/restore', AdminController.restoreUser);
adminRouter.get('/appointments', AdminController.getAllAppointments);
adminRouter.get('/analytics', AdminController.getAnalytics);
adminRouter.get('/alerts', AdminController.getAlerts);
adminRouter.get('/settings', AdminController.getSettings);
adminRouter.patch('/settings', AdminController.updateSettings);
