const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const emailService = require('../services/emailService');
const Email = require('../models/Email');
const auth = require('../middleware/auth');

// Protected routes - require authentication
router.use(auth); // Apply auth middleware to all routes

router.post('/send', emailController.sendEmails);
router.get('/status', emailController.getEmailStatus);
router.get('/analytics', emailController.getEmailAnalytics);
router.post('/provider/config', emailController.updateProviderConfig);
router.get('/provider/status', emailController.getProviderStatus);

module.exports = router; 