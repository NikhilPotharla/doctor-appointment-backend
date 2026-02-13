const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');
const { sendAppointmentConfirmation } = require('../services/email.service');

/**
 * Get available slots for a doctor
 * GET /api/appointments/slots/:doctorId
 */
const getAvailableSlots = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;

        if (!date) {
            return errorResponse(res, 'Date is required', 400);
        }

        const doctor = await prisma.doctor.findUnique({
            where: { id: doctorId },
            include: {
                availabilitySlots: {
                    where: { isAvailable: true },
                },
            },
        });

        if (!doctor) {
            return errorResponse(res, 'Doctor not found', 404);
        }

        const requestedDate = new Date(date);
        const dayOfWeek = requestedDate.getDay();

        // Get availability slots for the day
        const daySlots = doctor.availabilitySlots.filter(
            slot => slot.dayOfWeek === dayOfWeek
        );

        if (daySlots.length === 0) {
            return successResponse(res, { slots: [] }, 'No availability for this day');
        }

        // Get existing appointments for the date
        const existingAppointments = await prisma.appointment.findMany({
            where: {
                doctorId,
                appointmentDate: requestedDate,
                status: { not: 'cancelled' },
            },
            select: {
                startTime: true,
                endTime: true,
            },
        });

        // Generate available time slots (30-minute intervals)
        const availableSlots = [];

        for (const slot of daySlots) {
            const slotStart = new Date(slot.startTime);
            const slotEnd = new Date(slot.endTime);

            let currentTime = new Date(requestedDate);
            currentTime.setHours(slotStart.getHours(), slotStart.getMinutes(), 0, 0);

            const endTime = new Date(requestedDate);
            endTime.setHours(slotEnd.getHours(), slotEnd.getMinutes(), 0, 0);

            while (currentTime < endTime) {
                const slotEndTime = new Date(currentTime.getTime() + 30 * 60000); // 30 minutes

                // Check if slot is not booked
                const isBooked = existingAppointments.some(apt => {
                    const aptStart = new Date(apt.startTime);
                    const aptEnd = new Date(apt.endTime);
                    return (
                        (currentTime >= aptStart && currentTime < aptEnd) ||
                        (slotEndTime > aptStart && slotEndTime <= aptEnd)
                    );
                });

                if (!isBooked && currentTime > new Date()) {
                    availableSlots.push({
                        startTime: currentTime.toISOString(),
                        endTime: slotEndTime.toISOString(),
                    });
                }

                currentTime = slotEndTime;
            }
        }

        return successResponse(res, { slots: availableSlots }, 'Available slots retrieved successfully');
    } catch (error) {
        console.error('Get available slots error:', error);
        return errorResponse(res, 'Failed to retrieve available slots', 500);
    }
};

/**
 * Book appointment
 * POST /api/appointments
 */
const bookAppointment = async (req, res) => {
    try {
        const { doctorId, appointmentDate, startTime, endTime, type, clinicId, symptoms, notes } = req.body;

        // Verify doctor exists and is available
        const doctor = await prisma.doctor.findUnique({
            where: { id: doctorId },
            include: {
                user: {
                    select: {
                        profile: true,
                    },
                },
            },
        });

        if (!doctor) {
            return errorResponse(res, 'Doctor not found', 404);
        }

        if (!doctor.isAvailable) {
            return errorResponse(res, 'Doctor is not available for appointments', 400);
        }

        // Check if slot is available
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                doctorId,
                appointmentDate: new Date(appointmentDate),
                status: { not: 'cancelled' },
                OR: [
                    {
                        AND: [
                            { startTime: { lte: new Date(startTime) } },
                            { endTime: { gt: new Date(startTime) } },
                        ],
                    },
                    {
                        AND: [
                            { startTime: { lt: new Date(endTime) } },
                            { endTime: { gte: new Date(endTime) } },
                        ],
                    },
                ],
            },
        });

        if (existingAppointment) {
            return errorResponse(res, 'This time slot is already booked', 400);
        }

        // Create appointment
        const appointment = await prisma.appointment.create({
            data: {
                patientId: req.user.id,
                doctorId,
                clinicId,
                appointmentDate: new Date(appointmentDate),
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                type,
                symptoms,
                notes,
                status: 'pending',
            },
            include: {
                doctor: {
                    include: {
                        user: {
                            select: {
                                profile: true,
                            },
                        },
                    },
                },
                clinic: true,
                patient: {
                    select: {
                        email: true,
                        profile: true,
                    },
                },
            },
        });

        // Send confirmation email
        const doctorName = `Dr. ${doctor.user.profile.firstName} ${doctor.user.profile.lastName}`;
        await sendAppointmentConfirmation(appointment.patient.email, {
            doctorName,
            date: new Date(appointmentDate).toLocaleDateString(),
            time: new Date(startTime).toLocaleTimeString(),
            type,
            clinicAddress: appointment.clinic?.address || 'Online',
        });

        return successResponse(res, appointment, 'Appointment booked successfully', 201);
    } catch (error) {
        console.error('Book appointment error:', error);
        return errorResponse(res, 'Failed to book appointment', 500);
    }
};

/**
 * Get appointments
 * GET /api/appointments
 */
const getAppointments = async (req, res) => {
    try {
        const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {};

        // Filter by user role
        if (req.user.role === 'PATIENT') {
            where.patientId = req.user.id;
        } else if (req.user.role === 'DOCTOR') {
            const doctor = await prisma.doctor.findUnique({
                where: { userId: req.user.id },
            });
            if (doctor) {
                where.doctorId = doctor.id;
            }
        }

        if (status) {
            where.status = status;
        }

        if (startDate || endDate) {
            where.appointmentDate = {};
            if (startDate) where.appointmentDate.gte = new Date(startDate);
            if (endDate) where.appointmentDate.lte = new Date(endDate);
        }

        const [appointments, total] = await Promise.all([
            prisma.appointment.findMany({
                where,
                skip,
                take,
                orderBy: { appointmentDate: 'desc' },
                include: {
                    doctor: {
                        include: {
                            user: {
                                select: {
                                    profile: true,
                                },
                            },
                        },
                    },
                    patient: {
                        select: {
                            profile: true,
                        },
                    },
                    clinic: true,
                },
            }),
            prisma.appointment.count({ where }),
        ]);

        return successResponse(res, {
            appointments,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        }, 'Appointments retrieved successfully');
    } catch (error) {
        console.error('Get appointments error:', error);
        return errorResponse(res, 'Failed to retrieve appointments', 500);
    }
};

/**
 * Get appointment by ID
 * GET /api/appointments/:id
 */
const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: {
                doctor: {
                    include: {
                        user: {
                            select: {
                                profile: true,
                            },
                        },
                    },
                },
                patient: {
                    select: {
                        profile: true,
                    },
                },
                clinic: true,
                payment: true,
                medicalRecords: true,
            },
        });

        if (!appointment) {
            return errorResponse(res, 'Appointment not found', 404);
        }

        // Check authorization
        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id },
        });

        const isAuthorized =
            appointment.patientId === req.user.id ||
            (doctor && appointment.doctorId === doctor.id) ||
            req.user.role === 'ADMIN';

        if (!isAuthorized) {
            return errorResponse(res, 'Unauthorized access', 403);
        }

        return successResponse(res, appointment, 'Appointment retrieved successfully');
    } catch (error) {
        console.error('Get appointment by ID error:', error);
        return errorResponse(res, 'Failed to retrieve appointment', 500);
    }
};

/**
 * Cancel appointment
 * PUT /api/appointments/:id/cancel
 */
const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await prisma.appointment.findUnique({
            where: { id },
        });

        if (!appointment) {
            return errorResponse(res, 'Appointment not found', 404);
        }

        // Check authorization
        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id },
        });

        const isAuthorized =
            appointment.patientId === req.user.id ||
            (doctor && appointment.doctorId === doctor.id);

        if (!isAuthorized) {
            return errorResponse(res, 'Unauthorized to cancel this appointment', 403);
        }

        if (appointment.status === 'cancelled') {
            return errorResponse(res, 'Appointment is already cancelled', 400);
        }

        if (appointment.status === 'completed') {
            return errorResponse(res, 'Cannot cancel completed appointment', 400);
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: { status: 'cancelled' },
            include: {
                doctor: {
                    include: {
                        user: {
                            select: {
                                profile: true,
                            },
                        },
                    },
                },
                patient: {
                    select: {
                        profile: true,
                    },
                },
            },
        });

        return successResponse(res, updatedAppointment, 'Appointment cancelled successfully');
    } catch (error) {
        console.error('Cancel appointment error:', error);
        return errorResponse(res, 'Failed to cancel appointment', 500);
    }
};

/**
 * Update appointment status (doctor only)
 * PUT /api/appointments/:id/status
 */
const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return errorResponse(res, 'Invalid status', 400);
        }

        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id },
        });

        if (!doctor) {
            return errorResponse(res, 'Doctor profile not found', 404);
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id },
        });

        if (!appointment) {
            return errorResponse(res, 'Appointment not found', 404);
        }

        if (appointment.doctorId !== doctor.id) {
            return errorResponse(res, 'Unauthorized to update this appointment', 403);
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: { status },
            include: {
                doctor: {
                    include: {
                        user: {
                            select: {
                                profile: true,
                            },
                        },
                    },
                },
                patient: {
                    select: {
                        profile: true,
                    },
                },
            },
        });

        return successResponse(res, updatedAppointment, 'Appointment status updated successfully');
    } catch (error) {
        console.error('Update appointment status error:', error);
        return errorResponse(res, 'Failed to update appointment status', 500);
    }
};

module.exports = {
    getAvailableSlots,
    bookAppointment,
    getAppointments,
    getAppointmentById,
    cancelAppointment,
    updateAppointmentStatus,
};
