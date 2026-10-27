import { Router } from 'express';
import * as AuthController from './auth.controller';
import { authenticate } from '../../middlewares/authenticate';

export const authRouter = Router();

authRouter.post('/register', AuthController.register);
authRouter.post('/login',    AuthController.login);
authRouter.post('/refresh',  AuthController.refresh);
authRouter.post('/logout',   AuthController.logout);
authRouter.get('/me',        authenticate, AuthController.me);
authRouter.delete('/me',     authenticate, AuthController.deleteAccount);