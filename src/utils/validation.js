const { body, param, query, validationResult } = require('express-validator');
const { errorResponse } = require('./response');

/**
 * Validation middleware to check for validation errors
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation failed', 400, errors.array());
    }
    next();
};

/**
 * User registration validation rules
 */
const registerValidation = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and number'),
    body('role')
        .optional()
        .isIn(['PATIENT', 'DOCTOR'])
        .withMessage('Role must be PATIENT or DOCTOR'),
    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('First name must be 2-100 characters'),
    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Last name must be 2-100 characters'),
    body('phone')
        .optional()
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
        .withMessage('Invalid phone number format'),
    validate,
];

/**
 * Login validation rules
 */
const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    validate,
];

/**
 * Profile update validation rules
 */
const profileUpdateValidation = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('First name must be 2-100 characters'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Last name must be 2-100 characters'),
    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format'),
    body('gender')
        .optional()
        .isIn(['Male', 'Female', 'Other'])
        .withMessage('Gender must be Male, Female, or Other'),
    body('bloodGroup')
        .optional()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood group'),
    body('phone')
        .optional()
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
        .withMessage('Invalid phone number format'),
    validate,
];

/**
 * Appointment booking validation rules
 */
const appointmentValidation = [
    body('doctorId')
        .notEmpty()
        .withMessage('Doctor ID is required')
        .isUUID()
        .withMessage('Invalid doctor ID'),
    body('appointmentDate')
        .notEmpty()
        .withMessage('Appointment date is required')
        .isISO8601()
        .withMessage('Invalid date format'),
    body('startTime')
        .notEmpty()
        .withMessage('Start time is required')
        .isISO8601()
        .withMessage('Invalid time format'),
    body('endTime')
        .notEmpty()
        .withMessage('End time is required')
        .isISO8601()
        .withMessage('Invalid time format'),
    body('type')
        .notEmpty()
        .withMessage('Appointment type is required')
        .isIn(['VIDEO', 'CLINIC', 'HOME'])
        .withMessage('Type must be VIDEO, CLINIC, or HOME'),
    body('clinicId')
        .optional()
        .isUUID()
        .withMessage('Invalid clinic ID'),
    body('symptoms')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Symptoms must not exceed 1000 characters'),
    validate,
];

/**
 * Email validation
 */
const emailValidation = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    validate,
];

/**
 * Password reset validation
 */
const passwordResetValidation = [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and number'),
    validate,
];

/**
 * UUID parameter validation
 */
const uuidParamValidation = (paramName = 'id') => [
    param(paramName)
        .isUUID()
        .withMessage(`Invalid ${paramName}`),
    validate,
];

module.exports = {
    validate,
    registerValidation,
    loginValidation,
    profileUpdateValidation,
    appointmentValidation,
    emailValidation,
    passwordResetValidation,
    uuidParamValidation,
};
