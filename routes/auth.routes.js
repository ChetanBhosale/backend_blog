const express = require('express');
const router = express.Router();
const { register, login, me, getUserDetails, updateProfile } = require('../controller/auth.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateUser, me);

// Profile routes
router.get('/profile', authenticateUser, getUserDetails);
router.put('/profile', authenticateUser, updateProfile);

// router.get('/counsellor-only', authenticateUser, authorizeRoles('counsellor'), (req, res) => {
//     Response(res, 200, 'Counsellor access granted');
// });

module.exports = router;