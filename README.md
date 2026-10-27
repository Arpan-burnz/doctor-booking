# 🏥 Doctor Booking System

A full-stack doctor appointment booking platform built with **Next.js** (frontend) and **Express + Prisma** (backend).

## 🚀 Tech Stack

### Frontend
- **Next.js 15** (App Router) — React framework
- **TypeScript** — Type-safe development
- **Tailwind CSS** — Utility-first styling

### Backend
- **Express 5** — Node.js web framework
- **Prisma 5** — ORM with PostgreSQL
- **JWT** — Authentication (access + refresh tokens)
- **Zod** — Schema validation
- **Resend** — Transactional email
- **Twilio** — SMS notifications
- **AWS S3** — File/prescription uploads
- **bcryptjs** — Password hashing

## 📁 Project Structure

```
doctor-booking/
├── backend/          # Express API server
│   ├── prisma/       # Database schema & migrations
│   ├── src/          # Source code
│   └── .env.example  # Environment variable template
├── frontend/         # Next.js web application
│   ├── app/          # App Router pages & layouts
│   ├── components/   # Reusable UI components
│   ├── lib/          # Utilities & API clients
│   └── .env.example  # Environment variable template
└── package.json
```

## ⚡ Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- (Optional) AWS S3 bucket, Twilio account, Resend account

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/doctor-booking.git
cd doctor-booking
```

### 2. Setup the Backend

```bash
cd backend
npm install

# Copy the environment template and fill in your values
cp .env.example .env

# Run database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Start development server
npm run dev
```

The backend runs on **http://localhost:5000**

### 3. Setup the Frontend

```bash
cd frontend
npm install

# Copy the environment template and fill in your values
cp .env.example .env.local

# Start development server
npm run dev
```

The frontend runs on **http://localhost:3000**

## 🔒 Environment Variables

### Backend (`backend/.env`)
See [`backend/.env.example`](./backend/.env.example) for all required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing JWT refresh tokens |
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key |
| `AWS_BUCKET_NAME` | S3 bucket name |

### Frontend (`frontend/.env.local`)
See [`frontend/.env.example`](./frontend/.env.example) for all required variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

## 📄 License

MIT
