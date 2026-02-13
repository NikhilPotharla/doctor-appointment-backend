const nodemailer = require('nodemailer');

/**
 * Create email transporter
 */
const createTransporter = () => {
    // For development, use ethereal email (fake SMTP service)
    // For production, use real SMTP service (Gmail, SendGrid, etc.)

    if (process.env.NODE_ENV === 'production' && process.env.EMAIL_HOST) {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    // Development fallback - logs to console
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: process.env.EMAIL_USER || 'test@example.com',
            pass: process.env.EMAIL_PASS || 'test',
        },
    });
};

/**
 * Send verification email
 * @param {String} email - Recipient email
 * @param {String} token - Verification token
 */
const sendVerificationEmail = async (email, token) => {
    try {
        const transporter = createTransporter();
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'Doctor Appointment <noreply@doctorappointment.com>',
            to: email,
            subject: 'Verify Your Email - Doctor Appointment',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Welcome to Doctor Appointment!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Verify Email
          </a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="color: #6B7280; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.messageId);

        // Log preview URL for development
        if (process.env.NODE_ENV !== 'production') {
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        }

        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
};

/**
 * Send password reset email
 * @param {String} email - Recipient email
 * @param {String} token - Reset token
 */
const sendPasswordResetEmail = async (email, token) => {
    try {
        const transporter = createTransporter();
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'Doctor Appointment <noreply@doctorappointment.com>',
            to: email,
            subject: 'Reset Your Password - Doctor Appointment',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Password Reset Request</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Reset Password
          </a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="color: #6B7280; word-break: break-all;">${resetUrl}</p>
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);

        if (process.env.NODE_ENV !== 'production') {
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        }

        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
};

/**
 * Send appointment confirmation email
 * @param {String} email - Recipient email
 * @param {Object} appointmentDetails - Appointment information
 */
const sendAppointmentConfirmation = async (email, appointmentDetails) => {
    try {
        const transporter = createTransporter();
        const { doctorName, date, time, type, clinicAddress } = appointmentDetails;

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'Doctor Appointment <noreply@doctorappointment.com>',
            to: email,
            subject: 'Appointment Confirmation - Doctor Appointment',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Appointment Confirmed!</h2>
          <p>Your appointment has been successfully booked.</p>
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Doctor:</strong> ${doctorName}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 8px 0;"><strong>Time:</strong> ${time}</p>
            <p style="margin: 8px 0;"><strong>Type:</strong> ${type}</p>
            ${clinicAddress ? `<p style="margin: 8px 0;"><strong>Location:</strong> ${clinicAddress}</p>` : ''}
          </div>
          <p style="color: #6B7280; font-size: 14px;">
            Please arrive 10 minutes before your scheduled time. If you need to cancel or reschedule, please do so at least 24 hours in advance.
          </p>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Appointment confirmation email sent:', info.messageId);

        if (process.env.NODE_ENV !== 'production') {
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        }

        return true;
    } catch (error) {
        console.error('Error sending appointment confirmation email:', error);
        return false;
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendAppointmentConfirmation,
};
