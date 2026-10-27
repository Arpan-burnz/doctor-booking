import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import type { RegisterInput, LoginInput } from './auth.schema';

export const signAccessToken = (userId: string, role: string) =>
  jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });

export const signRefreshToken = async (userId: string) => {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  return token;
};

export const registerUser = async (data: RegisterInput) => {
  const normalizedEmail = data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) throw new Error('Email already registered');

  const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      role: data.role,
      phone: data.phone,
    },
  });

  if (data.role === 'DOCTOR') {
    if (!data.specialization || !data.licenseNumber || !data.consultationFee)
      throw new Error('Doctor fields required');
    await prisma.doctor.create({
      data: {
        userId: user.id,
        specialization: data.specialization,
        licenseNumber: data.licenseNumber,
        consultationFee: data.consultationFee,
      },
    });
  } else {
    await prisma.patient.create({ data: { userId: user.id } });
  }

  return { id: user.id, email: user.email, role: user.role };
};

export const loginUser = async (data: LoginInput) => {
  const normalizedEmail = data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    console.log(`❌ Login failed — No user account found for: "${normalizedEmail}"`);
    throw new Error('Invalid email or password');
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    console.log(`❌ Login failed — Password mismatch for user: "${normalizedEmail}"`);
    throw new Error('Invalid email or password');
  }

  console.log(`✅ Login successful for: "${normalizedEmail}" (${user.role})`);

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = await signRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role },
  };
};

export const refreshAccessToken = async (token: string) => {
  const existing = await prisma.refreshToken.findUnique({ where: { token } });
  if (!existing || existing.expiresAt < new Date())
    throw new Error('Invalid or expired refresh token');

  const user = await prisma.user.findUnique({ where: { id: existing.userId } });
  if (!user) throw new Error('User not found');

  await prisma.refreshToken.delete({ where: { token } });

  const accessToken = signAccessToken(user.id, user.role);
  const newRefreshToken = await signRefreshToken(user.id);
  return { accessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

export const deleteUserAccount = async (userId: string) => {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!user) {
      throw new Error('User account not found');
    }

    const patientId = user.patient?.id;
    const doctorId = user.doctor?.id;

    // 1. Find all appointments linked to patient or doctor
    const appointments = await tx.appointment.findMany({
      where: {
        OR: [
          ...(patientId ? [{ patientId }] : []),
          ...(doctorId ? [{ doctorId }] : []),
        ],
      },
      select: { id: true, slotId: true },
    });

    const apptIds = appointments.map((a) => a.id);
    const slotIds = appointments.map((a) => a.slotId);

    // 2. Delete all prescriptions linked to these appointments
    if (apptIds.length > 0) {
      await tx.prescription.deleteMany({
        where: { appointmentId: { in: apptIds } },
      });
    }

    // 3. Delete all reviews linked to patient, doctor, or appointments
    await tx.review.deleteMany({
      where: {
        OR: [
          ...(patientId ? [{ patientId }] : []),
          ...(doctorId ? [{ doctorId }] : []),
          ...(apptIds.length > 0 ? [{ appointmentId: { in: apptIds } }] : []),
        ],
      },
    });

    // 4. Delete all appointments
    if (apptIds.length > 0) {
      await tx.appointment.deleteMany({
        where: { id: { in: apptIds } },
      });
    }

    // 5. Clean up slots
    if (slotIds.length > 0) {
      await tx.availabilitySlot.updateMany({
        where: { id: { in: slotIds } },
        data: { isBooked: false },
      });
    }

    if (doctorId) {
      await tx.availabilitySlot.deleteMany({
        where: { doctorId },
      });
    }

    // 6. Delete profile records
    if (patientId) {
      await tx.patient.delete({
        where: { id: patientId },
      });
    }

    if (doctorId) {
      await tx.doctor.delete({
        where: { id: doctorId },
      });
    }

    // 7. Delete user notifications and refresh tokens
    await tx.notification.deleteMany({
      where: { userId },
    });

    await tx.refreshToken.deleteMany({
      where: { userId },
    });

    // 8. Delete user record
    await tx.user.delete({
      where: { id: userId },
    });

    return { message: 'Account and all associated records permanently deleted' };
  });
};