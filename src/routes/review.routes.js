const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { uuidParamValidation } = require('../utils/validation');
const { body } = require('express-validator');
const { validate } = require('../utils/validation');

/**
 * @route   POST /api/reviews
 * @desc    Submit review
 * @access  Private (PATIENT role)
 */
router.post(
    '/',
    verifyToken,
    requireRole('PATIENT'),
    [
        body('appointmentId').isUUID().withMessage('Invalid appointment ID'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('comment').optional().trim(),
        validate,
    ],
    reviewController.submitReview
);

/**
 * @route   GET /api/reviews/doctor/:doctorId
 * @desc    Get doctor reviews
 * @access  Public
 */
router.get('/doctor/:doctorId', uuidParamValidation('doctorId'), reviewController.getDoctorReviews);

module.exports = router;
