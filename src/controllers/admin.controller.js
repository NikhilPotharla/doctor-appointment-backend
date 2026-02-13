const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get all users (admin only)
 * GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {};

        if (role) {
            where.role = role;
        }

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                {
                    profile: {
                        OR: [
                            { firstName: { contains: search, mode: 'insensitive' } },
                            { lastName: { contains: search, mode: 'insensitive' } },
                        ],
                    },
                },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isVerified: true,
                    isActive: true,
                    createdAt: true,
                    profile: true,
                    doctor: {
                        select: {
                            verificationStatus: true,
                            specializationId: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

        return successResponse(res, {
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        }, 'Users retrieved successfully');
    } catch (error) {
        console.error('Get all users error:', error);
        return errorResponse(res, 'Failed to retrieve users', 500);
    }
};

/**
 * Verify doctor
 * PUT /api/admin/doctors/:id/verify
 */
const verifyDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'verified' or 'rejected'

        if (!['verified', 'rejected'].includes(status)) {
            return errorResponse(res, 'Invalid verification status', 400);
        }

        const doctor = await prisma.doctor.update({
            where: { id },
            data: {
                verificationStatus: status,
                ...(status === 'verified' && { isAvailable: true }),
            },
            include: {
                user: {
                    select: {
                        email: true,
                        profile: true,
                    },
                },
            },
        });

        // TODO: Send notification email to doctor

        return successResponse(res, doctor, `Doctor ${status} successfully`);
    } catch (error) {
        console.error('Verify doctor error:', error);
        return errorResponse(res, 'Failed to verify doctor', 500);
    }
};

/**
 * Block/unblock user
 * PUT /api/admin/users/:id/block
 */
const toggleUserBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: { isActive },
            select: {
                id: true,
                email: true,
                isActive: true,
                profile: true,
            },
        });

        return successResponse(
            res,
            user,
            `User ${isActive ? 'activated' : 'deactivated'} successfully`
        );
    } catch (error) {
        console.error('Toggle user block error:', error);
        return errorResponse(res, 'Failed to update user status', 500);
    }
};

/**
 * Get platform statistics
 * GET /api/admin/statistics
 */
const getStatistics = async (req, res) => {
    try {
        const [
            totalUsers,
            totalPatients,
            totalDoctors,
            verifiedDoctors,
            pendingDoctors,
            totalAppointments,
            completedAppointments,
            totalRevenue,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'PATIENT' } }),
            prisma.user.count({ where: { role: 'DOCTOR' } }),
            prisma.doctor.count({ where: { verificationStatus: 'verified' } }),
            prisma.doctor.count({ where: { verificationStatus: 'pending' } }),
            prisma.appointment.count(),
            prisma.appointment.count({ where: { status: 'completed' } }),
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'completed' },
            }),
        ]);

        const statistics = {
            users: {
                total: totalUsers,
                patients: totalPatients,
                doctors: totalDoctors,
            },
            doctors: {
                verified: verifiedDoctors,
                pending: pendingDoctors,
            },
            appointments: {
                total: totalAppointments,
                completed: completedAppointments,
            },
            revenue: {
                total: totalRevenue._sum.amount || 0,
            },
        };

        return successResponse(res, statistics, 'Statistics retrieved successfully');
    } catch (error) {
        console.error('Get statistics error:', error);
        return errorResponse(res, 'Failed to retrieve statistics', 500);
    }
};

/**
 * Get all appointments (admin view)
 * GET /api/admin/appointments
 */
const getAllAppointments = async (req, res) => {
    try {
        const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {};

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
                    payment: true,
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
        console.error('Get all appointments error:', error);
        return errorResponse(res, 'Failed to retrieve appointments', 500);
    }
};

module.exports = {
    getAllUsers,
    verifyDoctor,
    toggleUserBlock,
    getStatistics,
    getAllAppointments,
};
