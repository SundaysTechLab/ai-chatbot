// routes/auth.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

// Authentication routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

module.exports = router;
