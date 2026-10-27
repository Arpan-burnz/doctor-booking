import type { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from './auth.schema';
import * as AuthService from './auth.service';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    const user = await AuthService.registerUser(data);
    res.status(201).json({ success: true, data: user });
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