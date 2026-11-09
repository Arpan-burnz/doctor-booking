---
name: doctor-booking-specialist
description: >
  Activate this skill when working on the doctor-booking project.
  This skill applies whenever the user asks about the backend (Express/TypeScript/Prisma),
  frontend (Next.js), database schema, API routes, features, or any part of this
  full-stack doctor appointment booking platform.
---

# Doctor Booking — Specialist Agent Context

You are a specialist agent for the **Doctor Booking** full-stack application.
This document gives you complete, authoritative context about the codebase so you can
work confidently without re-exploring files on every task.

---

## Project Overview

A full-stack doctor appointment booking platform with three user roles:
- **Patients** — browse doctors, book slots, view prescriptions & history
- **Doctors** — manage slots, view appointments, issue prescriptions, track earnings
- **Admins** — manage users, verify doctors, view platform analytics

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 5, TypeScript, ts-node |
| ORM | Prisma 5 with PostgreSQL |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Email | Resend |
| SMS | Twilio |
| File Storage | AWS S3 |
| Frontend | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS |
| Background Jobs | node-cron |

---

## Repository Structure

```
doctor-booking/
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Express app entry point (port 5000)
│   │   ├── config/
│   │   │   ├── db.ts                 # Prisma client singleton
│   │   │   ├── env.ts                # Zod-validated env config
│   │   │   └── seedDemoUsers.ts      # Auto-seeds demo users on startup
│   │   ├── modules/
│   │   │   ├── auth/                 # Registration, login, refresh, email verify
│   │   │   ├── doctors/              # Doctor profiles, search, reviews
│   │   │   ├── slots/                # Availability slot CRUD
│   │   │   ├── appointments/         # Booking, status updates, video links
│   │   │   ├── prescriptions/        # File upload & retrieval
│   │   │   ├── admin/                # User management, analytics, doctor verification
│   │   │   └── patients/             # Patient profile
│   │   ├── middlewares/
│   │   │   ├── errorHandler.ts       # Global Express error handler
│   │   │   ├── auth.middleware.ts    # JWT verification middleware
│   │   │   └── validate.ts           # Zod request validation middleware
│   │   ├── jobs/
│   │   │   ├── reminderJob.ts        # Cron: sends appointment reminders
│   │   │   └── cleanupJob.ts         # Cron: cleans expired tokens/slots
│   │   └── lib/
│   │       ├── email.ts              # Resend email helpers
│   │       ├── sms.ts                # Twilio SMS helpers
│   │       └── s3.ts                 # AWS S3 upload helpers
│   ├── prisma/
│   │   └── schema.prisma             # Database schema (see below)
│   └── .env                          # Local environment variables
└── frontend/
    ├── app/
    │   ├── (auth)/                   # Login, register pages
    │   ├── (patient)/patient/        # Patient dashboard, appointments, prescriptions
    │   ├── (doctor)/doctor/          # Doctor dashboard, slots, earnings, prescriptions
    │   ├── (admin)/admin/            # Admin panel pages
    │   ├── page.tsx                  # Landing page
    │   └── layout.tsx                # Root layout
    ├── components/                   # Reusable React components
    ├── lib/                          # API helpers, auth utilities
    └── .env.local                    # NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Database Schema (Prisma)

### Enums
```prisma
enum Role { PATIENT | DOCTOR | ADMIN }
enum AppointmentStatus { PENDING | CONFIRMED | COMPLETED | CANCELLED | NO_SHOW }
```

### Models

| Model | Key Fields |
|---|---|
| `User` | id, email, passwordHash, role (Role), phone, emailVerified |
| `RefreshToken` | id, token, userId, expiresAt |
| `Doctor` | id, userId, specialization, licenseNumber, consultationFee (Int), bio, isVerified, experience, isSuspended (raw ALTER) |
| `Patient` | id, userId, dateOfBirth, bloodGroup, address |
| `AvailabilitySlot` | id, doctorId, slotDate, startTime, endTime, isBooked |
| `Appointment` | id, patientId, doctorId, slotId (unique), status, notes, videoLink |
| `Prescription` | id, appointmentId, fileUrl, diagnosis, issuedAt |
| `Review` | id, appointmentId, patientId, doctorId, rating (Int), comment |
| `Notification` | id, userId, type, message, isRead, sentAt |

### Relations
- `User` → `Doctor` (one-to-one), `Patient` (one-to-one)
- `Doctor` → `AvailabilitySlot[]`, `Appointment[]`, `Review[]`
- `Patient` → `Appointment[]`, `Review[]`
- `Appointment` → `Prescription[]`, `Review` (one-to-one)
- `AvailabilitySlot` → `Appointment` (one-to-one)

> **Note**: `isSuspended` on `Doctor` and `isActive` on `User` are added via raw `ALTER TABLE` at startup (not yet in schema.prisma). Always account for these fields.

---

## API Routes (Base URL: `http://localhost:5000`)

| Module | Prefix | Key Endpoints |
|---|---|---|
| Auth | `/api/auth` | POST /register, /login, /refresh, /logout, /verify-email |
| Doctors | `/api/doctors` | GET / (search/list), GET /:id, GET /:id/reviews, POST /reviews |
| Slots | `/api/slots` | GET / (doctor's slots), POST / (create), PATCH /:id, DELETE /:id |
| Appointments | `/api/appointments` | POST / (book), GET / (list), PATCH /:id/status, PATCH /:id/video-link |
| Prescriptions | `/api/prescriptions` | POST / (upload), GET / (list), GET /:id |
| Admin | `/api/admin` | GET /users, PATCH /users/:id, GET /doctors, PATCH /doctors/:id/verify, GET /analytics |
| Health | `/health` | GET (status check) |

---

## Environment Variables

### Backend (`.env`)
```
DATABASE_URL=postgresql://postgres:arpan@localhost:5432/doctor_booking
PORT=5000
NODE_ENV=development
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN=24h
REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
CLIENT_URL=http://localhost:3000
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Key Patterns & Conventions

### Backend Patterns
1. **Module structure**: Each module has `*.controller.ts`, `*.router.ts`, `*.service.ts` (and sometimes `*.schema.ts` for Zod validation).
2. **Auth middleware**: Applied per-router using `authenticate` + `authorize(Role[])`.
3. **Error handling**: All errors flow through the global `errorHandler` middleware. Throw `new AppError(message, statusCode)`.
4. **Validation**: Use Zod schemas via the `validate` middleware before controllers.
5. **Prisma access**: Always import from `../../config/db` — single shared client instance.

### Frontend Patterns
1. **App Router**: Uses Next.js App Router with route groups `(auth)`, `(patient)`, `(doctor)`, `(admin)`.
2. **API calls**: Centralized in `lib/` folder with fetch-based helpers.
3. **Auth state**: Managed via JWT tokens stored in cookies/localStorage.

---

## Dev Commands

```bash
# Backend (from /backend)
npm run dev           # nodemon + ts-node, auto-restarts on change
npm run db:migrate    # prisma migrate dev
npm run db:studio     # Prisma Studio (DB GUI)

# Frontend (from /frontend)
npm run dev           # Next.js dev server on port 3000
npm run build         # Production build
```

---

## Known Quirks & Important Notes

1. **Express 5** is used (not Express 4) — async error handling is automatic, no need for `next(err)` wrapping in async route handlers.
2. **`isSuspended` / `isActive`** fields are applied via raw ALTER TABLE at startup — not in schema. Prisma won't know about them unless schema is updated. Use `$queryRaw` or `$executeRaw` carefully.
3. **Prisma version is 5.x** — use `prisma.model.findFirst`, `findMany`, `create`, `update`, `upsert`, `delete`. No legacy v4 APIs.
4. **File uploads** go to AWS S3 via `multer` (in-memory storage) → S3 upload. Returns a presigned URL or direct S3 URL.
5. **Cron jobs** run in the same process — `reminderJob` for appointment reminders, `cleanupJob` for expired refresh tokens and past slots.
6. **Demo users** are auto-seeded via `ensureDemoUsersExist()` on every startup.

---

## References

- See `e:\Projects\doctor-booking\backend\prisma\schema.prisma` for the full DB schema.
- See `e:\Projects\doctor-booking\backend\src\index.ts` for the Express app setup.
- See `e:\Projects\doctor-booking\frontend\app\` for all frontend pages.
