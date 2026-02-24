const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const tokenController = require('../controllers/tokenController');

// Login page
router.get('/authorize', authController.showLogin);
router.post('/login', authController.handleLogin);

// Registration page
router.get('/register', authController.showRegister);
router.post('/register', authController.handleRegister);

// Handling consent form POST
router.post('/consent', authController.handleConsent);

// Handling the token exchange POST
router.post('/token', tokenController.handleToken);

module.exports = router;