const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get all doctors with filters
 * GET /api/doctors
 */
const getDoctors = async (req, res) => {
    try {
        const {
            specialization,
            city,
            minRating,
            maxFee,
            minExperience,
            search,
            page = 1,
            limit = 10,
            sortBy = 'averageRating',
            sortOrder = 'desc',
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        // Build where clause
        const where = {
            verificationStatus: 'verified',
            isAvailable: true,
        };

        if (specialization) {
            // Handle multiple specializations (comma-separated)
            const specializations = specialization.split(',');
            if (specializations.length === 1) {
                where.specializationId = specialization;
            } else {
                where.specializationId = { in: specializations };
            }
        }

        if (minRating) {
            where.averageRating = { gte: parseFloat(minRating) };
        }

        if (maxFee) {
            where.consultationFee = { lte: parseFloat(maxFee) };
        }

        if (minExperience) {
            where.experienceYears = { gte: parseInt(minExperience) };
        }

        // Search in user profile and specialization
        if (search) {
            where.OR = [
                {
                    user: {
                        profile: {
                            OR: [
                                { firstName: { contains: search, mode: 'insensitive' } },
                                { lastName: { contains: search, mode: 'insensitive' } },
                            ],
                        },
                    },
                },
                {
                    specializationId: { contains: search, mode: 'insensitive' },
                },
            ];
        }

        // City filter
        if (city) {
            where.clinics = {
                some: {
                    city: { contains: city, mode: 'insensitive' },
                },
            };
        }

        // Get doctors with pagination
        const [doctors, total] = await Promise.all([
            prisma.doctor.findMany({
                where,
                skip,
                take,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            profile: true,
                        },
                    },
                    clinics: {
                        where: { isPrimary: true },
                    },
                },
            }),
            prisma.doctor.count({ where }),
        ]);

        return successResponse(res, {
            doctors,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        }, 'Doctors retrieved successfully');
    } catch (error) {
        console.error('Get doctors error:', error);
        return errorResponse(res, 'Failed to retrieve doctors', 500);
    }
};

/**
 * Get doctor by ID
 * GET /api/doctors/:id
 */
const getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await prisma.doctor.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        profile: true,
                    },
                },
                clinics: true,
                reviews: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        patient: {
                            select: {
                                profile: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        profilePicture: true,
                                    },
                                },
                            },
                        },
                    },
                },
                availabilitySlots: {
                    where: { isAvailable: true },
                    orderBy: { dayOfWeek: 'asc' },
                },
            },
        });

        if (!doctor) {
            return errorResponse(res, 'Doctor not found', 404);
        }

        return successResponse(res, doctor, 'Doctor retrieved successfully');
    } catch (error) {
        console.error('Get doctor by ID error:', error);
        return errorResponse(res, 'Failed to retrieve doctor', 500);
    }
};

/**
 * Register as doctor
 * POST /api/doctors/register
 */
const registerDoctor = async (req, res) => {
    try {
        const {
            specializationId,
            qualification,
            experienceYears,
            licenseNumber,
            consultationFee,
            about,
        } = req.body;

        // Check if user already has a doctor profile
        const existingDoctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id },
        });

        if (existingDoctor) {
            return errorResponse(res, 'Doctor profile already exists', 400);
        }

        // Check if license number is already used
        const licenseExists = await prisma.doctor.findUnique({
            where: { licenseNumber },
        });

        if (licenseExists) {
            return errorResponse(res, 'License number already registered', 400);
        }

        // Create doctor profile
        const doctor = await prisma.doctor.create({
            data: {
                userId: req.user.id,
                specializationId,
                qualification,
                experienceYears: parseInt(experienceYears),
                licenseNumber,
                consultationFee: parseFloat(consultationFee),
                about,
                verificationStatus: 'pending',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        profile: true,
                    },
                },
            },
        });

        return successResponse(
            res,
            doctor,
            'Doctor profile created successfully. Pending admin verification.',
            201
        );
    } catch (error) {
        console.error('Register doctor error:', error);
        return errorResponse(res, 'Failed to register doctor', 500);
    }
};

/**
 * Update doctor profile
 * PUT /api/doctors/profile
 */
const updateDoctorProfile = async (req, res) => {
    try {
        const {
            specializationId,
            qualification,
            experienceYears,
            consultationFee,
            about,
            isAvailable,
        } = req.body;

        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id },
        });

        if (!doctor) {
            return errorResponse(res, 'Doctor profile not found', 404);
        }

        const updatedDoctor = await prisma.doctor.update({
            where: { userId: req.user.id },
            data: {
                ...(specializationId && { specializationId }),
                ...(qualification && { qualification }),
                ...(experienceYears && { experienceYears: parseInt(experienceYears) }),
                ...(consultationFee && { consultationFee: parseFloat(consultationFee) }),
                ...(about && { about }),
                ...(isAvailable !== undefined && { isAvailable }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        profile: true,
                    },
                },
                clinics: true,
            },
        });

        return successResponse(res, updatedDoctor, 'Doctor profile updated successfully');
    } catch (error) {
        console.error('Update doctor profile error:', error);
        return errorResponse(res, 'Failed to update doctor profile', 500);
    }
};

/**
 * Add clinic
 * POST /api/doctors/clinic
 */
const addClinic = async (req, res) => {
    try {
        const { name, address, city, state, phone, isPrimary } = req.body;

        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id },
        });

        if (!doctor) {
            return errorResponse(res, 'Doctor profile not found', 404);
        }

        // If this is set as primary, unset other primary clinics
        if (isPrimary) {
            await prisma.clinic.updateMany({
                where: { doctorId: doctor.id },
                data: { isPrimary: false },
            });
        }

        const clinic = await prisma.clinic.create({
            data: {
                doctorId: doctor.id,
                name,
                address,
                city,
                state,
                phone,
                isPrimary: isPrimary || false,
            },
        });

        return successResponse(res, clinic, 'Clinic added successfully', 201);
    } catch (error) {
        console.error('Add clinic error:', error);
        return errorResponse(res, 'Failed to add clinic', 500);
    }
};

/**
 * Set availability slots
 * POST /api/doctors/availability
 */
const setAvailability = async (req, res) => {
    try {
        const { slots } = req.body; // Array of { dayOfWeek, startTime, endTime }

        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id },
        });

        if (!doctor) {
            return errorResponse(res, 'Doctor profile not found', 404);
        }

        if (!Array.isArray(slots) || slots.length === 0) {
            return errorResponse(res, 'Slots array is required', 400);
        }

        // Delete existing slots for the doctor
        await prisma.availabilitySlot.deleteMany({
            where: { doctorId: doctor.id },
        });

        // Create new slots
        const availabilitySlots = await prisma.availabilitySlot.createMany({
            data: slots.map(slot => ({
                doctorId: doctor.id,
                dayOfWeek: parseInt(slot.dayOfWeek),
                startTime: new Date(`1970-01-01T${slot.startTime}`),
                endTime: new Date(`1970-01-01T${slot.endTime}`),
                isAvailable: slot.isAvailable !== undefined ? slot.isAvailable : true,
            })),
        });

        return successResponse(res, availabilitySlots, 'Availability updated successfully');
    } catch (error) {
        console.error('Set availability error:', error);
        return errorResponse(res, 'Failed to set availability', 500);
    }
};

/**
 * Verify doctor (Admin only)
 * POST /api/doctors/:id/verify
 */
const verifyDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await prisma.doctor.findUnique({
            where: { id },
        });

        if (!doctor) {
            return errorResponse(res, 'Doctor not found', 404);
        }

        const updatedDoctor = await prisma.doctor.update({
            where: { id },
            data: {
                verificationStatus: 'verified',
                isAvailable: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        profile: true,
                    },
                },
                clinics: true,
            },
        });

        return successResponse(res, updatedDoctor, 'Doctor verified successfully');
    } catch (error) {
        console.error('Verify doctor error:', error);
        return errorResponse(res, 'Failed to verify doctor', 500);
    }
};

module.exports = {
    getDoctors,
    getDoctorById,
    registerDoctor,
    updateDoctorProfile,
    addClinic,
    setAvailability,
    verifyDoctor,
};
