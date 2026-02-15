const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { uuidParamValidation } = require('../utils/validation');

/**
 * @route   GET /api/doctors
 * @desc    Get all doctors with filters
 * @access  Public
 */
router.get('/', doctorController.getDoctors);

/**
 * @route   GET /api/doctors/:id
 * @desc    Get doctor by ID
 * @access  Public
 */
router.get('/:id', uuidParamValidation('id'), doctorController.getDoctorById);

/**
 * @route   POST /api/doctors/register
 * @desc    Register as doctor
 * @access  Private (DOCTOR role)
 */
router.post('/register', verifyToken, requireRole('DOCTOR'), doctorController.registerDoctor);

/**
 * @route   PUT /api/doctors/profile
 * @desc    Update doctor profile
 * @access  Private (DOCTOR role)
 */
router.put('/profile', verifyToken, requireRole('DOCTOR'), doctorController.updateDoctorProfile);

/**
 * @route   POST /api/doctors/clinic
 * @desc    Add clinic
 * @access  Private (DOCTOR role)
 */
router.post('/clinic', verifyToken, requireRole('DOCTOR'), doctorController.addClinic);

/**
 * @route   POST /api/doctors/availability
 * @desc    Set availability slots
 * @access  Private (DOCTOR role)
 */
router.post('/availability', verifyToken, requireRole('DOCTOR'), doctorController.setAvailability);

/**
 * @route   POST /api/doctors/:id/verify
 * @desc    Verify doctor (Admin only)
 * @access  Private (ADMIN role)
 */
router.post('/:id/verify', verifyToken, requireRole('ADMIN'), doctorController.verifyDoctor);

module.exports = router;
