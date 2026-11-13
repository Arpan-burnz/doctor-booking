import { prisma } from '../config/db';

/**
 * Checks whether a doctor is suspended by querying the database directly.
 * Handles querying by doctor ID or user ID.
 */
export async function isDoctorSuspended(params: { doctorId?: string; userId?: string }): Promise<boolean> {
  try {
    if (params.doctorId) {
      const doctor = await prisma.doctor.findUnique({
        where: { id: params.doctorId },
        select: { isSuspended: true },
      });
      return doctor?.isSuspended === true;
    }
    if (params.userId) {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: params.userId },
        select: { isSuspended: true },
      });
      return doctor?.isSuspended === true;
    }
    return false;
  } catch (err) {
    console.error('Error checking doctor suspension status:', err);
    return false;
  }
}

