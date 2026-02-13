const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { appointmentValidation, uuidParamValidation } = require('../utils/validation');

/**
 * @route   GET /api/appointments/slots/:doctorId
 * @desc    Get available slots for a doctor
 * @access  Public
 */
router.get('/slots/:doctorId', uuidParamValidation('doctorId'), appointmentController.getAvailableSlots);

/**
 * @route   POST /api/appointments
 * @desc    Book appointment
 * @access  Private (PATIENT role)
 */
router.post('/', verifyToken, requireRole('PATIENT'), appointmentValidation, appointmentController.bookAppointment);

/**
 * @route   GET /api/appointments
 * @desc    Get appointments
 * @access  Private
 */
router.get('/', verifyToken, appointmentController.getAppointments);

/**
 * @route   GET /api/appointments/:id
 * @desc    Get appointment by ID
 * @access  Private
 */
router.get('/:id', verifyToken, uuidParamValidation('id'), appointmentController.getAppointmentById);

/**
 * @route   PUT /api/appointments/:id/cancel
 * @desc    Cancel appointment
 * @access  Private
 */
router.put('/:id/cancel', verifyToken, uuidParamValidation('id'), appointmentController.cancelAppointment);

/**
 * @route   PUT /api/appointments/:id/status
 * @desc    Update appointment status
 * @access  Private (DOCTOR role)
 */
router.put('/:id/status', verifyToken, requireRole('DOCTOR'), uuidParamValidation('id'), appointmentController.updateAppointmentStatus);

module.exports = router;
