import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import * as AuthController from './auth.controller';
import { authenticate } from '../../middlewares/authenticate';

const uploadCertificate = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = /pdf|jpg|jpeg|png|webp/i.test(file.mimetype) ||
      /\.(pdf|jpg|jpeg|png|webp)$/i.test(file.originalname);
    if (allowed) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, PNG or WEBP certificate files are allowed'));
    }
  },
});

const handleRegisterUpload = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    uploadCertificate.single('certificate')(req, res, (err: any) => {
      if (err) {
        res.status(400).json({ error: err.message || 'Error processing uploaded certificate file' });
        return;
      }
      next();
    });
  } else {
    next();
  }
};

// Dedicated rate limiter wired to registration endpoint
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 registration attempts per IP per window
  message: { error: 'Too many registration attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many verification email requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRouter = Router();

authRouter.post('/register', registerLimiter, handleRegisterUpload, AuthController.register);
authRouter.get('/verify-email', AuthController.verifyEmail);
authRouter.post('/resend-verification', resendVerificationLimiter, AuthController.resendVerification);
authRouter.post('/login', loginLimiter, AuthController.login);
authRouter.post('/refresh',  AuthController.refresh);
authRouter.post('/logout',   AuthController.logout);
authRouter.get('/me',        authenticate, AuthController.me);
authRouter.delete('/me',     authenticate, AuthController.deleteAccount);