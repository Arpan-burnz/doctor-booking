import { prisma } from '../../config/db';
import type { BookAppointmentInput } from './appointments.schema';
import { sendAppointmentConfirmation, sendCancellationEmail, sendAppointmentReminder } from '../../lib/mailer';
import { sendBookingConfirmationSMS } from '../../lib/sms';
import { isDoctorSuspended } from '../../lib/suspension';

export const bookAppointment = async (userId: string, data: BookAppointmentInput) => {
  const userObj = await prisma.user.findUnique({ where: { id: userId } });
  if (!userObj) throw new Error('User not found');
  // Temporarily bypass email verification check for booking
  // if (!userObj.emailVerified) {
  //   throw new Error('Please verify your email address before booking an appointment. Check your inbox for the activation link.');
  // }

  let patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) {
    patient = await prisma.patient.create({ data: { userId } });
  }

  const slot = await prisma.availabilitySlot.findUnique({
    where: { id: data.slotId },
  });
  if (!slot) throw new Error('Selected slot is no longer available. Please select another slot.');

  // Check if an appointment already exists for this slotId or if slot is flagged booked
  const existingApptForSlot = await prisma.appointment.findUnique({
    where: { slotId: data.slotId },
  });
  if (existingApptForSlot || slot.isBooked) {
    if (!slot.isBooked) {
      await prisma.availabilitySlot.update({
        where: { id: data.slotId },
        data: { isBooked: true },
      }).catch(() => {});
    }
    throw new Error('Selected slot was already booked by another patient. Please select a different time slot.');
  }

  if (slot.doctorId !== data.doctorId) throw new Error('Slot does not belong to this doctor');

  const suspended = await isDoctorSuspended({ doctorId: data.doctorId });
  if (suspended) {
    throw new Error('This doctor is currently suspended and cannot accept appointments.');
  }

  // Double booking check: same patient, same doctor, same slot date
  const existingSameDayAppt = await prisma.appointment.findFirst({
    where: {
      patientId: patient.id,
      doctorId: data.doctorId,
      status: { in: ['CONFIRMED', 'PENDING'] },
      slot: {
        slotDate: slot.slotDate,
      },
    },
  });
  if (existingSameDayAppt) {
    throw new Error('You already have an active appointment with this doctor on the selected date.');
  }

  try {
    const [, appointment] = await prisma.$transaction([
      prisma.availabilitySlot.update({
        where: { id: data.slotId },
        data: { isBooked: true },
      }),
      prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId:  data.doctorId,
          slotId:    data.slotId,
          notes:     data.notes,
          status:    'CONFIRMED',
        },
        include: {
          slot:   true,
          doctor: {
            select: {
              name: true,
              specialization: true,
              user: { select: { email: true } },
            },
          },
        },
      }),
    ]);

    // Send confirmation email + SMS (non-blocking)
    try {
      const patientUser = await prisma.user.findUnique({ where: { id: userId } });
      if (patientUser) {
        await sendAppointmentConfirmation(patientUser.email, {
          patientName: patientUser.email.split('@')[0],
          doctorName: `Dr. ${appointment.doctor.name || appointment.doctor.user.email.split('@')[0]}`,
          date: appointment.slot.slotDate.toDateString(),
          startTime: appointment.slot.startTime,
          endTime: appointment.slot.endTime,
        });
        if (patientUser.phone) {
          await sendBookingConfirmationSMS(
            patientUser.phone,
            `Dr. ${appointment.doctor.name || appointment.doctor.user.email.split('@')[0]}`,
            appointment.slot.slotDate.toDateString(),
            appointment.slot.startTime
          );
        }
      }
    } catch (emailErr) {
      console.error('Email/SMS failed (non-blocking):', emailErr);
    }

    return appointment;
  } catch (trxErr: any) {
    if (
      trxErr.code === 'P2002' ||
      trxErr.code === 'P2025' ||
      trxErr.message?.includes('Unique constraint failed') ||
      trxErr.message?.includes('Record to update not found')
    ) {
      await prisma.availabilitySlot.update({
        where: { id: data.slotId },
        data: { isBooked: true },
      }).catch(() => {});
      throw new Error('Selected slot was already booked by another patient. Please select a different time slot.');
    }
    throw trxErr;
  }
};

export const getMyAppointments = async (userId: string, role: string) => {
  if (role === 'PATIENT') {
    let patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      patient = await prisma.patient.create({ data: { userId } });
    }
    return prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        slot:   true,
        doctor: { include: { user: { select: { email: true, phone: true } } } },
        prescriptions: true,
        review: true,
      },
      orderBy: { bookedAt: 'desc' },
    });
  } else {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new Error('Doctor profile not found');
    return prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: {
        slot:    true,
        patient: { include: { user: { select: { email: true, phone: true } } } },
        prescriptions: true,
        review: true,
      },
      orderBy: { bookedAt: 'desc' },
    });
  }
};

export const getAppointmentById = async (appointmentId: string, userId: string, role?: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      slot:    true,
      doctor:  { include: { user: { select: { email: true } } } },
      patient: { include: { user: { select: { email: true } } } },
    },
  });
  if (!appointment) throw new Error('Appointment not found');

  if (role !== 'ADMIN') {
    const isPatient = appointment.patient?.userId === userId;
    const isDoctor = appointment.doctor?.userId === userId;
    if (!isPatient && !isDoctor) {
      throw new Error('Not authorized');
    }
  }

  return appointment;
};

export const cancelAppointment = async (appointmentId: string, userId: string, role?: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: true, doctor: true },
  });
  if (!appointment) throw new Error('Appointment not found');
  if (appointment.status === 'CANCELLED') throw new Error('Already cancelled');

  if (role !== 'ADMIN') {
    const isPatient = appointment.patient?.userId === userId;
    const isDoctor = appointment.doctor?.userId === userId;
    if (!isPatient && !isDoctor) {
      throw new Error('Not authorized');
    }
  }

  // Enforce 2-hour cancellation window for patients/doctors (admin can always cancel)
  if (role !== 'ADMIN') {
    const slot = await prisma.availabilitySlot.findUnique({ where: { id: appointment.slotId } });
    if (slot) {
      const slotDateTime = new Date(slot.slotDate);
      const [h, m] = slot.startTime.split(':').map(Number);
      slotDateTime.setHours(h, m, 0, 0);
      const cutoff = new Date(slotDateTime.getTime() - 2 * 60 * 60 * 1000);
      if (new Date() > cutoff) {
        throw new Error('Cancellations must be made at least 2 hours before the appointment start time.');
      }
    }
  }

  const [, updated] = await prisma.$transaction([
    prisma.availabilitySlot.update({
      where: { id: appointment.slotId },
      data: { isBooked: false },
    }),
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' },
    }),
  ]);

  return updated;
};

export const completeAppointment = async (appointmentId: string, userId: string) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new Error('Doctor profile not found');

  const suspended = await isDoctorSuspended({ doctorId: doctor.id });
  if (suspended) {
    throw new Error('Doctor account is currently suspended');
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!appointment) throw new Error('Appointment not found');
  if (appointment.doctorId !== doctor.id) throw new Error('Not authorized');

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'COMPLETED' },
  });
};

export const rescheduleAppointment = async (appointmentId: string, newSlotId: string, userId: string) => {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) throw new Error('Patient profile not found');

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { slot: true },
  });
  if (!appointment) throw new Error('Appointment not found');
  if (appointment.patientId !== patient.id) throw new Error('Not authorized');
  if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
    throw new Error('Cannot reschedule inactive appointment');
  }

  const newSlot = await prisma.availabilitySlot.findUnique({
    where: { id: newSlotId },
  });
  if (!newSlot) throw new Error('New slot not found');
  if (newSlot.isBooked) throw new Error('Slot is already booked');
  if (newSlot.doctorId !== appointment.doctorId) throw new Error('Slot does not belong to the same doctor');

  const suspended = await isDoctorSuspended({ doctorId: appointment.doctorId });
  if (suspended) {
    throw new Error('This doctor is currently suspended and cannot accept appointments.');
  }

  const [,, updated] = await prisma.$transaction([
    // Free old slot
    prisma.availabilitySlot.update({
      where: { id: appointment.slotId },
      data: { isBooked: false },
    }),
    // Reserve new slot
    prisma.availabilitySlot.update({
      where: { id: newSlotId },
      data: { isBooked: true },
    }),
    // Update appointment
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { slotId: newSlotId },
      include: {
        slot: true,
        doctor: { include: { user: { select: { email: true, phone: true } } } },
      },
    }),
  ]);

  return updated;
};

export const updateAppointmentNotes = async (appointmentId: string, notes: string, userId: string) => {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) throw new Error('Patient profile not found');

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!appointment) throw new Error('Appointment not found');
  if (appointment.patientId !== patient.id) throw new Error('Not authorized');

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { notes },
    include: {
      slot: true,
      doctor: { include: { user: { select: { email: true, phone: true } } } },
      prescriptions: true,
      review: true,
    },
  });
};

export const createAppointmentReview = async (
  appointmentId: string,
  rating: number,
  comment: string | undefined,
  userId: string
) => {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) throw new Error('Patient profile not found');

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { review: true },
  });
  if (!appointment) throw new Error('Appointment not found');
  if (appointment.patientId !== patient.id) throw new Error('Not authorized');
  if (appointment.status !== 'COMPLETED') {
    throw new Error('Can only review completed appointments');
  }

  if (appointment.review) {
    return prisma.review.update({
      where: { id: appointment.review.id },
      data: { rating, comment },
    });
  }

  return prisma.review.create({
    data: {
      appointmentId,
      patientId: patient.id,
      doctorId: appointment.doctorId,
      rating,
      comment,
    },
  });
};

export const resendAppointmentReminder = async (appointmentId: string, userId: string) => {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) throw new Error('Patient profile not found');

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      slot: true,
      doctor: { select: { name: true, specialization: true, user: { select: { email: true } } } },
      patient: { include: { user: { select: { email: true, phone: true } } } },
    },
  });
  if (!appointment) throw new Error('Appointment not found');
  if (appointment.patientId !== patient.id) throw new Error('Not authorized');

  const patientEmail = appointment.patient?.user?.email;
  const patientPhone = appointment.patient?.user?.phone;

  if (patientEmail) {
    try {
      await sendAppointmentReminder(patientEmail, {
        patientName: patientEmail.split('@')[0],
        doctorName: `Dr. ${appointment.doctor.name || appointment.doctor.user.email.split('@')[0]}`,
        date: appointment.slot.slotDate.toDateString(),
        startTime: appointment.slot.startTime,
      });
    } catch (e) {
      console.error('Failed to resend email reminder', e);
    }
  }

  if (patientPhone) {
    try {
      await sendBookingConfirmationSMS(
        patientPhone,
        `Dr. ${appointment.doctor.name || appointment.doctor.user.email.split('@')[0]}`,
        appointment.slot.slotDate.toDateString(),
        appointment.slot.startTime
      );
    } catch (e) {
      console.error('Failed to resend SMS reminder', e);
    }
  }

  return { success: true, message: 'Reminder sent successfully' };
};

