import { Router } from 'express';
import * as SlotController from './slots.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

export const slotsRouter = Router();

// Doctor only
slotsRouter.post('/',        authenticate, authorize('DOCTOR'), SlotController.createSlots);
slotsRouter.get('/my-slots', authenticate, authorize('DOCTOR'), SlotController.getMySlots);
slotsRouter.delete('/:id',   authenticate, authorize('DOCTOR'), SlotController.deleteSlot);