import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { isDoctorSuspended } from '../../lib/suspension';
import { sendVerificationEmail } from '../../lib/mailer';
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
  if (existing) {
    // Anti-enumeration: do not reveal whether the account already exists
    throw new Error('Unable to complete registration. If you already have an account, please sign in.');
  }

  const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: normalizedEmail,
        name: data.name.trim(),
        passwordHash,
        role: data.role,
        phone: data.phone.trim(),
        emailVerified: true, // Auto-verified for the time being
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });

    if (data.role === 'DOCTOR') {
      if (!data.specialization || !data.licenseNumber || !data.consultationFee) {
        throw new Error('Doctor credentials (specialization, license, fee) required');
      }
      await tx.doctor.create({
        data: {
          userId: newUser.id,
          name: data.name.trim(),
          specialization: data.specialization,
          licenseNumber: data.licenseNumber,
          medicalCouncil: data.medicalCouncil?.trim() || null,
          certificateUrl: data.certificateUrl || null,
          consultationFee: data.consultationFee,
          experience: data.experienceYears,
          bio: data.bio,
        },
      });
    } else {
      await tx.patient.create({
        data: {
          userId: newUser.id,
          gender: data.gender || undefined,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        },
      });
    }

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      emailVerified: true,
    };
  });

  // Verification email link dispatch temporarily bypassed
  // const verificationToken = crypto.randomBytes(32).toString('hex');
  // const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${verificationToken}`;
  // await sendVerificationEmail(normalizedEmail, verificationUrl, data.name.trim());

  return {
    ...user,
    message: 'Account created successfully! You can now sign in.',
  };
};

export const loginUser = async (data: LoginInput) => {
  const normalizedEmail = data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  // Temporarily bypass email verification check
  // if (!user.emailVerified) {
  //   throw new Error('Please verify your email address before logging in. Check your inbox for the verification link.');
  // }

  if (user.isActive === false) {
    throw new Error('Account is deactivated');
  }

  if (user.role === 'DOCTOR') {
    const suspended = await isDoctorSuspended({ userId: user.id });
    if (suspended) {
      throw new Error('Doctor account is currently suspended');
    }
  }

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = await signRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified },
  };
};

export const verifyEmailToken = async (token: string) => {
  if (!token) {
    throw new Error('Verification token is required');
  }

  const user = await prisma.user.findUnique({
    where: { verificationToken: token },
  });

  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
    throw new Error('Verification link has expired. Please request a new verification email.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    },
  });

  return { message: 'Email verified successfully. You can now log in to your account.' };
};

export const resendVerificationToken = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Anti-enumeration: don't disclose whether email exists or is already verified
  if (!user || user.emailVerified) {
    return { message: 'If an unverified account exists with that email, a verification link has been sent.' };
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken,
      verificationTokenExpiresAt,
    },
  });

  const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${verificationToken}`;
  await sendVerificationEmail(normalizedEmail, verificationUrl, user.name || undefined);

  return { message: 'If an unverified account exists with that email, a verification link has been sent.' };
};

export const refreshAccessToken = async (token: string) => {
  const existing = await prisma.refreshToken.findUnique({ where: { token } });
  if (!existing || existing.expiresAt < new Date())
    throw new Error('Invalid or expired refresh token');

  const user = await prisma.user.findUnique({ where: { id: existing.userId } });
  if (!user) throw new Error('User not found');

  if (user.isActive === false) {
    throw new Error('Account is deactivated');
  }

  if (user.role === 'DOCTOR') {
    const suspended = await isDoctorSuspended({ userId: user.id });
    if (suspended) {
      throw new Error('Doctor account is currently suspended');
    }
  }

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