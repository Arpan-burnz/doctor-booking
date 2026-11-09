import { prisma } from './db';
import bcrypt from 'bcryptjs';

/**
 * Ensures a system administrator exists for initial access to the admin dashboard.
 * Does not overwrite existing admin passwords upon server reboot.
 */
export const ensureDemoUsersExist = async () => {
  try {
    const demoAdminEmail = 'admin@doc4u.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: demoAdminEmail },
    });

    if (!existingAdmin) {
      const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
      await prisma.user.create({
        data: {
          email: demoAdminEmail,
          passwordHash: adminPasswordHash,
          role: 'ADMIN',
          phone: '+91 00000 00000',
          emailVerified: true,
        },
      });
      console.log(`✅ Initial system admin created: ${demoAdminEmail}`);
    } else {
      console.log(`✅ System admin ready: ${demoAdminEmail}`);
    }
  } catch (err) {
    console.error('Error ensuring admin user exists:', err);
  }
};
