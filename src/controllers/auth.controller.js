const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');

/**
 * Generate JWT token
 * @param {String} userId - User ID
 * @returns {String} JWT token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { 
            email, 
            password, 
            role = 'PATIENT', 
            firstName, 
            lastName, 
            phone,
            // Doctor-specific fields
            specializationId,
            qualification,
            experienceYears,
            licenseNumber,
            consultationFee,
            about
        } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return errorResponse(res, 'Email already registered', 400);
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user and profile in a transaction
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    phone,
                    role,
                    profile: {
                        create: {
                            firstName,
                            lastName,
                        },
                    },
                },
                include: {
                    profile: true,
                },
            });

            // If role is DOCTOR, automatically create doctor profile
            if (role === 'DOCTOR') {
                // Validate required doctor fields
                if (!specializationId || !qualification || !experienceYears || !licenseNumber || !consultationFee) {
                    throw new Error('Doctor registration requires specialization, qualification, experience, license number, and consultation fee');
                }

                await tx.doctor.create({
                    data: {
                        userId: newUser.id,
                        specializationId,
                        qualification: Array.isArray(qualification) ? qualification : [qualification],
                        experienceYears: parseInt(experienceYears),
                        licenseNumber,
                        consultationFee: parseFloat(consultationFee),
                        about: about || '',
                        verificationStatus: 'pending', // Doctors start as pending verification
                        isAvailable: false, // Doctors start as unavailable until verified
                    },
                });
            }

            // Store verification token (you might want to create a separate table for tokens)
            // For now, we'll send it directly
            return newUser;
        });

        // Send verification email
        await sendVerificationEmail(email, verificationToken);

        // Generate JWT token
        const token = generateToken(user.id);

        const responseMessage = role === 'DOCTOR' 
            ? 'Doctor registration successful. Your profile is pending verification. Please check your email to verify your account.'
            : 'Registration successful. Please check your email to verify your account.';

        return successResponse(
            res,
            {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    profile: user.profile,
                },
                token,
            },
            responseMessage,
            201
        );
    } catch (error) {
        console.error('Registration error:', error);
        
        // Provide specific error messages for doctor registration
        if (error.message.includes('Doctor registration requires')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Registration failed', 500);
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user with profile
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                profile: true,
                doctor: true,
            },
        });

        if (!user) {
            return errorResponse(res, 'Invalid email or password', 401);
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return errorResponse(res, 'Invalid email or password', 401);
        }

        // Check if user is active
        if (!user.isActive) {
            return errorResponse(res, 'Account is deactivated. Please contact support.', 403);
        }

        // Generate JWT token
        const token = generateToken(user.id);

        // Remove sensitive data
        delete user.passwordHash;

        return successResponse(res, {
            user,
            token,
        }, 'Login successful');
    } catch (error) {
        console.error('Login error:', error);
        return errorResponse(res, 'Login failed', 500);
    }
};

/**
 * Get current user
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
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

        // Remove sensitive data
        delete user.passwordHash;

        return successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
        console.error('Get current user error:', error);
        return errorResponse(res, 'Failed to retrieve user', 500);
    }
};

/**
 * Verify email
 * POST /api/auth/verify-email
 */
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        // In a real implementation, you would:
        // 1. Look up the token in a tokens table
        // 2. Check if it's expired
        // 3. Get the associated user ID
        // For now, we'll use a simplified approach

        if (!token) {
            return errorResponse(res, 'Verification token is required', 400);
        }

        // This is a placeholder - implement proper token verification
        // You should store tokens in database with expiry

        return successResponse(res, null, 'Email verified successfully');
    } catch (error) {
        console.error('Email verification error:', error);
        return errorResponse(res, 'Email verification failed', 500);
    }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Don't reveal if user exists or not for security
        if (!user) {
            return successResponse(
                res,
                null,
                'If an account exists with this email, you will receive a password reset link.'
            );
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        // Store reset token (you should create a separate table for this)
        // For now, we'll just send the email

        await sendPasswordResetEmail(email, resetToken);

        return successResponse(
            res,
            null,
            'If an account exists with this email, you will receive a password reset link.'
        );
    } catch (error) {
        console.error('Forgot password error:', error);
        return errorResponse(res, 'Failed to process request', 500);
    }
};

/**
 * Reset password
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // In a real implementation:
        // 1. Verify token exists and is not expired
        // 2. Get associated user ID
        // 3. Update password
        // 4. Invalidate token

        if (!token) {
            return errorResponse(res, 'Reset token is required', 400);
        }

        // This is a placeholder - implement proper token verification
        // Hash new password
        const passwordHash = await bcrypt.hash(password, 10);

        // Update user password (you need to get userId from token)
        // await prisma.user.update({
        //   where: { id: userId },
        //   data: { passwordHash },
        // });

        return successResponse(res, null, 'Password reset successful. You can now login with your new password.');
    } catch (error) {
        console.error('Reset password error:', error);
        return errorResponse(res, 'Password reset failed', 500);
    }
};

/**
 * Logout user (client-side token removal)
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
    try {
        // With JWT, logout is handled client-side by removing the token
        // You could implement token blacklisting here if needed

        return successResponse(res, null, 'Logout successful');
    } catch (error) {
        console.error('Logout error:', error);
        return errorResponse(res, 'Logout failed', 500);
    }
};

module.exports = {
    register,
    login,
    getCurrentUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
    logout,
};
