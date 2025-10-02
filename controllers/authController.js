const { 
  generateToken,
  sendSuccessResponse,
  sendErrorResponse,
  logUserRegistration,
  logUserLogin
} = require('../utils/helpers');
const { User } = require('../models/modelSelector');

// User Registration Controller
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Create new user using model
    const newUser = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      password
    });

    // Generate JWT token
    const token = generateToken(newUser._id || newUser.id);

    // Get public profile
    const userResponse = newUser.getPublicProfile ? newUser.getPublicProfile() : {
      id: newUser._id || newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      createdAt: newUser.createdAt
    };

    // Log registration
    logUserRegistration(newUser);

    sendSuccessResponse(res, 201, 'User registered successfully', {
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Error during user registration:', error);
    
    // Handle duplicate email error
    if (error.message.includes('already exists')) {
      return sendErrorResponse(res, 409, error.message);
    }
    
    sendErrorResponse(res, 500, 'Failed to register user', error.message);
  }
};

// User Login Controller
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email using model
    const user = await User.findByEmail(email);
    if (!user) {
      return sendErrorResponse(res, 401, 'Invalid email or password');
    }

    // Verify password using model method
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return sendErrorResponse(res, 401, 'Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(user._id || user.id);

    // Get profile
    const userResponse = user.getPublicProfile ? user.getPublicProfile() : {
      id: user._id || user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: user.createdAt
    };

    // Update last login
    if (user.updateById) {
      await user.updateById(user._id || user.id, { lastLogin: new Date() });
    } else if (user.save) {
      user.lastLogin = new Date();
      await user.save();
    }

    // Log login
    logUserLogin(user);

    sendSuccessResponse(res, 200, 'Login successful', {
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Error during user login:', error);
    sendErrorResponse(res, 500, 'Failed to login user', error.message);
  }
};

// Get User Profile Controller
const getUserProfile = async (req, res) => {
  try {
    // Get user from database
    const user = req.user;
    
    const userResponse = user.getPublicProfile ? user.getPublicProfile() : {
      id: user._id || user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    sendSuccessResponse(res, 200, 'User profile retrieved successfully', userResponse);

  } catch (error) {
    console.error('Error retrieving user profile:', error);
    sendErrorResponse(res, 500, 'Failed to retrieve user profile', error.message);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};
