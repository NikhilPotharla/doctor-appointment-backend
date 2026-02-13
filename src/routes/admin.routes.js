const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { uuidParamValidation } = require('../utils/validation');
const { body } = require('express-validator');
const { validate } = require('../utils/validation');

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private (ADMIN role)
 */
router.get('/users', verifyToken, requireRole('ADMIN'), adminController.getAllUsers);

/**
 * @route   PUT /api/admin/doctors/:id/verify
 * @desc    Verify doctor
 * @access  Private (ADMIN role)
 */
router.put(
    '/doctors/:id/verify',
    verifyToken,
    requireRole('ADMIN'),
    uuidParamValidation('id'),
    [
        body('status').isIn(['verified', 'rejected']).withMessage('Status must be verified or rejected'),
        validate,
    ],
    adminController.verifyDoctor
);

/**
 * @route   PUT /api/admin/users/:id/block
 * @desc    Block/unblock user
 * @access  Private (ADMIN role)
 */
router.put(
    '/users/:id/block',
    verifyToken,
    requireRole('ADMIN'),
    uuidParamValidation('id'),
    [
        body('isActive').isBoolean().withMessage('isActive must be boolean'),
        validate,
    ],
    adminController.toggleUserBlock
);

/**
 * @route   GET /api/admin/statistics
 * @desc    Get platform statistics
 * @access  Private (ADMIN role)
 */
router.get('/statistics', verifyToken, requireRole('ADMIN'), adminController.getStatistics);

/**
 * @route   GET /api/admin/appointments
 * @desc    Get all appointments
 * @access  Private (ADMIN role)
 */
router.get('/appointments', verifyToken, requireRole('ADMIN'), adminController.getAllAppointments);

module.exports = router;
