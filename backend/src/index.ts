import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

const app = express();

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth',          authRouter);
app.use('/api/doctors',       doctorsRouter);
app.use('/api/slots',         slotsRouter);
app.use('/api/appointments',  appointmentsRouter);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/admin',         adminRouter);

app.use(errorHandler);

import { prisma } from './config/db';

app.listen(Number(env.PORT), async () => {
  console.log(`✅ Server running on http://localhost:${env.PORT}`);
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Doctor" ADD COLUMN "isSuspended" BOOLEAN DEFAULT false;`);
    console.log('✅ Added isSuspended column to Doctor table');
  } catch (err: any) {
    if (err.message && err.message.includes('already exists')) {
      // Ignore
    } else if (err.code === '42701') {
      // Ignore postgres error code for column already exists
    } else {
      console.error('Migration error (Doctor):', err);
    }
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN DEFAULT true;`);
    console.log('✅ Added isActive column to User table');
  } catch (err: any) {
    if (err.message && err.message.includes('already exists')) {
      // Ignore
    } else if (err.code === '42701') {
      // Ignore
    } else {
      console.error('Migration error (User):', err);
    }
  }
  ensureDemoUsersExist().catch((err) => console.error('Auto seed error:', err));
  startReminderJob();
  startCleanupJob();
});
// Nodemon trigger