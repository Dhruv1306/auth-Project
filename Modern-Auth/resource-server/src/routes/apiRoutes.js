const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/tokenMiddleware');
const userController = require('../controllers/userController');

router.get('/user/profile', authenticateToken, userController.getProfile);

module.exports = router;