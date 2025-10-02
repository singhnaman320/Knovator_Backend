const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateUserRegistration,
  validateUserLogin
} = require('../middleware/validation');
const { 
  registerUser, 
  loginUser, 
  getUserProfile
} = require('../controllers/authController');

const router = express.Router();

// Public Routes
router.post('/signup', validateUserRegistration, registerUser);
router.post('/login', validateUserLogin, loginUser);

// Protected Routes
router.get('/profile', authenticateToken, getUserProfile);

module.exports = router;
