const express = require('express');
const router = express.Router();
const { register, login, me, getUserDetails, updateProfile, sendOTP, verifyOTPAndRegister, sendForgotPasswordOTP, resetPassword } = require('../controller/auth.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

// Auth routes
router.post('/send-otp', sendOTP);
router.post('/send-forget-password-otp', sendForgotPasswordOTP)
router.post('/verify-otp-register', verifyOTPAndRegister);
router.post('/reset-password', resetPassword)
router.post('/login', login);
router.get('/me', authenticateUser, me);

// Profile routes
router.get('/profile', authenticateUser, getUserDetails);
router.put('/profile', authenticateUser, updateProfile);

// router.get('/counsellor-only', authenticateUser, authorizeRoles('counsellor'), (req, res) => {
//     Response(res, 200, 'Counsellor access granted');
// });

module.exports = router;