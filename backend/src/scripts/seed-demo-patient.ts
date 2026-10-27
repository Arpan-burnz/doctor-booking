import { prisma } from '../config/db';
import bcrypt from 'bcryptjs';

async function seedDemoPatient() {
  const email = 'patient@doc4u.com';
  const password = 'Patient@123';
  const role = 'PATIENT';

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`Demo patient already exists: ${email}`);
      const isMatch = await bcrypt.compare(password, existing.passwordHash);
      if (!isMatch) {
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { email },
          data: { passwordHash },
        });
        console.log(`Updated demo patient password to: ${password}`);
      }
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'PATIENT',
        phone: '+91 98765 43210',
      },
    });

    await prisma.patient.create({
      data: { userId: user.id },
    });

    console.log('✅ Demo patient user created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding demo patient:', err);
    process.exit(1);
  }
}

seedDemoPatient();
