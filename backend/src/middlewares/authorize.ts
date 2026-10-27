import type { Request, Response, NextFunction } from 'express';

export const authorize = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) { res.status(401).json({ error: 'Not authenticated' }); return; }
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: `Access denied. Required: ${roles.join(', ')}` });
      return;
    }
    next();
  };