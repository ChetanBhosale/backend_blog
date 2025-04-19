const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controller/auth.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateUser, me);

// router.get('/counsellor-only', authenticateUser, authorizeRoles('counsellor'), (req, res) => {
//     Response(res, 200, 'Counsellor access granted');
// });

module.exports = router;