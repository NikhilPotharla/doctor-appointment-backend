const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');
const prisma = require('../config/prisma');

/**
 * Verify JWT token and attach user to request
 */
const verifyToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(res, 'No token provided', 401);
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                isVerified: true,
                isActive: true,
            },
        });

        if (!user) {
            return errorResponse(res, 'User not found', 401);
        }

        if (!user.isActive) {
            return errorResponse(res, 'Account is deactivated', 403);
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return errorResponse(res, 'Invalid token', 401);
        }
        if (error.name === 'TokenExpiredError') {
            return errorResponse(res, 'Token expired', 401);
        }
        return errorResponse(res, 'Authentication failed', 401);
    }
};

/**
 * Middleware factory to check user role
 * @param {...string} roles - Allowed roles
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 'Authentication required', 401);
        }

        if (!roles.includes(req.user.role)) {
            return errorResponse(res, 'Insufficient permissions', 403);
        }

        next();
    };
};

/**
 * Optional authentication - attach user if token exists but don't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                isVerified: true,
                isActive: true,
            },
        });

        if (user && user.isActive) {
            req.user = user;
        }
    } catch (error) {
        // Silently fail for optional auth
    }

    next();
};

module.exports = {
    verifyToken,
    requireRole,
    optionalAuth,
};
