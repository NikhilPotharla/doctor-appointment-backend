const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Submit review
 * POST /api/reviews
 */
const submitReview = async (req, res) => {
    try {
        const { appointmentId, rating, comment } = req.body;

        // Verify appointment exists and is completed
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                review: true,
            },
        });

        if (!appointment) {
            return errorResponse(res, 'Appointment not found', 404);
        }

        if (appointment.patientId !== req.user.id) {
            return errorResponse(res, 'Unauthorized to review this appointment', 403);
        }

        if (appointment.status !== 'completed') {
            return errorResponse(res, 'Can only review completed appointments', 400);
        }

        if (appointment.review) {
            return errorResponse(res, 'Review already submitted for this appointment', 400);
        }

        // Create review in a transaction to update doctor rating
        const review = await prisma.$transaction(async (tx) => {
            // Create review
            const newReview = await tx.review.create({
                data: {
                    appointmentId,
                    patientId: req.user.id,
                    doctorId: appointment.doctorId,
                    rating: parseInt(rating),
                    comment,
                },
                include: {
                    patient: {
                        select: {
                            profile: true,
                        },
                    },
                },
            });

            // Update doctor's average rating
            const doctor = await tx.doctor.findUnique({
                where: { id: appointment.doctorId },
            });

            const totalReviews = doctor.totalReviews + 1;
            const newAverageRating =
                (doctor.averageRating * doctor.totalReviews + parseInt(rating)) / totalReviews;

            await tx.doctor.update({
                where: { id: appointment.doctorId },
                data: {
                    averageRating: newAverageRating,
                    totalReviews,
                },
            });

            return newReview;
        });

        return successResponse(res, review, 'Review submitted successfully', 201);
    } catch (error) {
        console.error('Submit review error:', error);
        return errorResponse(res, 'Failed to submit review', 500);
    }
};

/**
 * Get doctor reviews
 * GET /api/reviews/doctor/:doctorId
 */
const getDoctorReviews = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: { doctorId },
                skip,
                take,
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
            }),
            prisma.review.count({ where: { doctorId } }),
        ]);

        return successResponse(res, {
            reviews,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        }, 'Reviews retrieved successfully');
    } catch (error) {
        console.error('Get doctor reviews error:', error);
        return errorResponse(res, 'Failed to retrieve reviews', 500);
    }
};

module.exports = {
    submitReview,
    getDoctorReviews,
};
