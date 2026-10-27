import { prisma } from './db';
import bcrypt from 'bcryptjs';

export const ensureDemoUsersExist = async () => {
  try {
    const demoPatientEmail = 'patient@doc4u.com';
    const password = 'Patient@123';
    const passwordHash = await bcrypt.hash(password, 10);

    const patientUser = await prisma.user.upsert({
      where: { email: demoPatientEmail },
      update: { passwordHash, role: 'PATIENT' },
      create: {
        email: demoPatientEmail,
        passwordHash,
        role: 'PATIENT',
        phone: '+91 98765 43210',
      },
    });

    const patientRecord = await prisma.patient.findUnique({
      where: { userId: patientUser.id },
    });
    if (!patientRecord) {
      await prisma.patient.create({
        data: { userId: patientUser.id },
      });
    }

    console.log(`✅ Auto-seeded/reset demo patient: ${demoPatientEmail} / ${password}`);

    const demoAdminEmail = 'admin@doc4u.com';
    const adminPassword = 'Admin@123';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
      where: { email: demoAdminEmail },
      update: { passwordHash: adminPasswordHash, role: 'ADMIN' },
      create: {
        email: demoAdminEmail,
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        phone: '+91 00000 00000',
        emailVerified: true,
      },
    });

    console.log(`✅ Auto-seeded/reset demo admin: ${demoAdminEmail} / ${adminPassword}`);
  } catch (err) {
    console.error('Error ensuring demo users exist:', err);
  }
};
