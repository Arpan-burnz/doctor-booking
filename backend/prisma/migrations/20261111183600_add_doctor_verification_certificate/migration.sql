-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "medicalCouncil" TEXT;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "certificateUrl" TEXT;

