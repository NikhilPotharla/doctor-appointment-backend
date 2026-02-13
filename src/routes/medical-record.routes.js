const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medical-record.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { uuidParamValidation } = require('../utils/validation');

/**
 * @route   POST /api/medical-records
 * @desc    Create medical record
 * @access  Private (DOCTOR role)
 */
router.post('/', verifyToken, requireRole('DOCTOR'), medicalRecordController.createMedicalRecord);

/**
 * @route   GET /api/medical-records/patient/:patientId
 * @desc    Get patient medical records
 * @access  Private
 */
router.get('/patient/:patientId', verifyToken, uuidParamValidation('patientId'), medicalRecordController.getPatientMedicalRecords);

/**
 * @route   GET /api/medical-records/:id
 * @desc    Get medical record by ID
 * @access  Private
 */
router.get('/:id', verifyToken, uuidParamValidation('id'), medicalRecordController.getMedicalRecordById);

module.exports = router;
