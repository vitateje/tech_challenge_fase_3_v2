const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.getCurrentUser);
router.get('/session', authController.getSessionInfo);
router.get('/sessions', authController.getActiveSessions);

module.exports = router;
