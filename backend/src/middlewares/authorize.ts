import type { Request, Response, NextFunction } from 'express';
import { isDoctorSuspended } from '../lib/suspension';

export const authorize = (...roles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) { res.status(401).json({ error: 'Not authenticated' }); return; }
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: `Access denied. Required: ${roles.join(', ')}` });
      return;
    }

    // If the authenticated user is a doctor performing modifying actions, check suspension
    if (user.role === 'DOCTOR' && !req.path.includes('/me/profile')) {
      const userId = user.userId || user.id;
      if (userId && (req.method === 'POST' || req.method === 'PATCH' || req.method === 'DELETE')) {
        const suspended = await isDoctorSuspended({ userId });
        if (suspended) {
          res.status(403).json({ error: 'Doctor account is currently suspended. You are prohibited from booking slots and other features.' });
          return;
        }
      }
    }

    next();
  };