import type { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema, resendVerificationSchema } from './auth.schema';
import * as AuthService from './auth.service';
import { uploadFile } from '../../lib/storage';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let certificateUrl: string | undefined;
    if (req.file) {
      certificateUrl = await uploadFile(req.file, 'certificates');
    }

    const payload: any = { ...req.body };
    if (certificateUrl) {
      payload.certificateUrl = certificateUrl;
    }
    if (typeof payload.termsAccepted === 'string') {
      payload.termsAccepted = payload.termsAccepted === 'true';
    }

    const data = registerSchema.parse(payload);
    const user = await AuthService.registerUser(data);
    res.status(201).json({ success: true, data: user });
  } catch (err) { next(err); }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = (req.query.token as string) || (req.body?.token as string);
    if (!token) {
      res.status(400).json({ error: 'Verification token is required' });
      return;
    }
    const result = await AuthService.verifyEmailToken(token);
    res.json({ success: true, message: result.message });
  } catch (err) { next(err); }
};

export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = resendVerificationSchema.parse(req.body);
    const result = await AuthService.resendVerificationToken(email);
    res.json({ success: true, message: result.message });
  } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await AuthService.loginUser(data);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(400).json({ error: 'refreshToken required' }); return; }
    const tokens = await AuthService.refreshAccessToken(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) { next(err); }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await AuthService.logoutUser(refreshToken);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
};

export const me = (req: Request, res: Response) => {
  res.json({ success: true, data: (req as any).user });
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload?.userId || userPayload?.id || userPayload?.sub;
    if (!userId) {
      res.status(400).json({ error: 'User ID missing from token' });
      return;
    }
    const result = await AuthService.deleteUserAccount(userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('❌ Account deletion error:', err);
    res.status(400).json({ error: err?.message || 'Failed to delete account from server' });
  }
};