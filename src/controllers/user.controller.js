const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get user profile
 * GET /api/users/profile
 */
const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                profile: true,
                doctor: {
                    include: {
                        clinics: true,
                    },
                },
            },
        });

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        delete user.passwordHash;

        return successResponse(res, user, 'Profile retrieved successfully');
    } catch (error) {
        console.error('Get profile error:', error);
        return errorResponse(res, 'Failed to retrieve profile', 500);
    }
};

/**
 * Update user profile
 * PUT /api/users/profile
 */
const updateProfile = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            dateOfBirth,
            gender,
            bloodGroup,
            phone,
            address,
            city,
            state,
            country,
            postalCode,
        } = req.body;

        // Update user phone if provided
        const updateData = {};
        if (phone) {
            await prisma.user.update({
                where: { id: req.user.id },
                data: { phone },
            });
        }

        // Update profile
        const profile = await prisma.profile.update({
            where: { userId: req.user.id },
            data: {
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
                ...(gender && { gender }),
                ...(bloodGroup && { bloodGroup }),
                ...(address && { address }),
                ...(city && { city }),
                ...(state && { state }),
                ...(country && { country }),
                ...(postalCode && { postalCode }),
            },
        });

        return successResponse(res, profile, 'Profile updated successfully');
    } catch (error) {
        console.error('Update profile error:', error);
        return errorResponse(res, 'Failed to update profile', 500);
    }
};

/**
 * Upload profile picture
 * POST /api/users/profile/picture
 */
const uploadProfilePicture = async (req, res) => {
    try {
        // This would integrate with Multer and cloud storage (Cloudinary/S3)
        // For now, we'll accept a URL
        const { profilePicture } = req.body;

        if (!profilePicture) {
            return errorResponse(res, 'Profile picture URL is required', 400);
        }

        const profile = await prisma.profile.update({
            where: { userId: req.user.id },
            data: { profilePicture },
        });

        return successResponse(res, profile, 'Profile picture updated successfully');
    } catch (error) {
        console.error('Upload profile picture error:', error);
        return errorResponse(res, 'Failed to upload profile picture', 500);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadProfilePicture,
};
