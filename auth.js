const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// ============================================================
//  ROUTES
// ============================================================

// Login admin
router.post('/login', authController.login);

// Verify token
router.get('/verify', auth.verifyToken, authController.verify);

// Logout
router.post('/logout', auth.verifyToken, authController.logout);

// Change password (admin only)
router.put('/change-password', auth.verifyAdmin, authController.changePassword);

// Get admin profile
router.get('/profile', auth.verifyToken, authController.getProfile);

module.exports = router;
