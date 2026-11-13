import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import { authRouter } from './modules/auth/auth.router';
import { doctorsRouter } from './modules/doctors/doctors.router';
import { slotsRouter } from './modules/slots/slots.router';
import { appointmentsRouter } from './modules/appointments/appointments.router';
import { prescriptionsRouter } from './modules/prescriptions/prescriptions.router';
import { adminRouter } from './modules/admin/admin.router';
import { errorHandler } from './middlewares/errorHandler';
import { startReminderJob } from './jobs/reminderJob';
import { startCleanupJob } from './jobs/cleanupJob';
import { ensureDemoUsersExist } from './config/seedDemoUsers';

import rateLimit from 'express-rate-limit';

const app = express();
app.set('trust proxy', 1);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow localhost, localtunnel, and devtunnels
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('.loca.lt') || origin.endsWith('.devtunnels.ms')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth',          authLimiter, authRouter);
app.use('/api/doctors',       doctorsRouter);
app.use('/api/slots',         slotsRouter);
app.use('/api/appointments',  appointmentsRouter);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/admin',         adminRouter);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(errorHandler);

import { prisma } from './config/db';

app.listen(Number(env.PORT), async () => {
  console.log(`✅ Server running on http://localhost:${env.PORT}`);

  try {
    await prisma.$executeRawUnsafe(`UPDATE "User" SET "emailVerified" = true WHERE "emailVerified" = false;`);
  } catch (err: any) {
    // Ignore
  }

  ensureDemoUsersExist().catch((err) => console.error('Auto seed error:', err));
  startReminderJob();
  startCleanupJob();
});
