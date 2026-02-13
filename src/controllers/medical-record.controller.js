const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Create medical record
 * POST /api/medical-records
 */
const createMedicalRecord = async (req, res) => {
    try {
        const { patientId, appointmentId, diagnosis, prescription, tests, notes, fileUrls } = req.body;

        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id },
        });

        if (!doctor) {
            return errorResponse(res, 'Doctor profile not found', 404);
        }

        // Verify appointment exists and belongs to this doctor
        if (appointmentId) {
            const appointment = await prisma.appointment.findUnique({
                where: { id: appointmentId },
            });

            if (!appointment || appointment.doctorId !== doctor.id) {
                return errorResponse(res, 'Invalid appointment', 400);
            }
        }

        const medicalRecord = await prisma.medicalRecord.create({
            data: {
                patientId,
                doctorId: doctor.id,
                appointmentId,
                diagnosis,
                prescription: prescription || [],
                tests: tests || [],
                notes,
                fileUrls: fileUrls || [],
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
                patient: {
                    select: {
                        profile: true,
                    },
                },
            },
        });

        return successResponse(res, medicalRecord, 'Medical record created successfully', 201);
    } catch (error) {
        console.error('Create medical record error:', error);
        return errorResponse(res, 'Failed to create medical record', 500);
    }
};

/**
 * Get patient medical records
 * GET /api/medical-records/patient/:patientId
 */
const getPatientMedicalRecords = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Check authorization
        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id },
        });

        const isAuthorized =
            req.user.id === patientId ||
            doctor ||
            req.user.role === 'ADMIN';

        if (!isAuthorized) {
            return errorResponse(res, 'Unauthorized access', 403);
        }

        const medicalRecords = await prisma.medicalRecord.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
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
                appointment: {
                    select: {
                        appointmentDate: true,
                        type: true,
                    },
                },
            },
        });

        return successResponse(res, medicalRecords, 'Medical records retrieved successfully');
    } catch (error) {
        console.error('Get patient medical records error:', error);
        return errorResponse(res, 'Failed to retrieve medical records', 500);
    }
};

/**
 * Get medical record by ID
 * GET /api/medical-records/:id
 */
const getMedicalRecordById = async (req, res) => {
    try {
        const { id } = req.params;

        const medicalRecord = await prisma.medicalRecord.findUnique({
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
                appointment: true,
            },
        });

        if (!medicalRecord) {
            return errorResponse(res, 'Medical record not found', 404);
        }

        // Check authorization
        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id },
        });

        const isAuthorized =
            medicalRecord.patientId === req.user.id ||
            (doctor && medicalRecord.doctorId === doctor.id) ||
            req.user.role === 'ADMIN';

        if (!isAuthorized) {
            return errorResponse(res, 'Unauthorized access', 403);
        }

        return successResponse(res, medicalRecord, 'Medical record retrieved successfully');
    } catch (error) {
        console.error('Get medical record by ID error:', error);
        return errorResponse(res, 'Failed to retrieve medical record', 500);
    }
};

module.exports = {
    createMedicalRecord,
    getPatientMedicalRecords,
    getMedicalRecordById,
};
