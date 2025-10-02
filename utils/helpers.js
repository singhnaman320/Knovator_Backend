const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// JWT Utility Functions
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Password Utility Functions
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Validation Middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Response Utility Functions
const sendSuccessResponse = (res, statusCode = 200, message, data = null) => {
  const response = {
    success: true,
    message
  };
  
  if (data) {
    response.data = data;
  }
  
  res.status(statusCode).json(response);
};

const sendErrorResponse = (res, statusCode = 500, message, error = null) => {
  const response = {
    success: false,
    message
  };
  
  if (error && process.env.NODE_ENV === 'development') {
    response.error = error;
  }
  
  res.status(statusCode).json(response);
};

// Logging Utility Functions
const logUserRegistration = (user) => {
  console.log('=== NEW USER REGISTERED ===');
  console.log('User ID:', user.id);
  console.log('Name:', `${user.firstName} ${user.lastName}`);
  console.log('Email:', user.email);
  console.log('Registration Date:', user.createdAt);
  console.log('===========================');
};

const logUserLogin = (user) => {
  console.log('=== USER LOGIN ===');
  console.log('User ID:', user.id);
  console.log('Name:', `${user.firstName} ${user.lastName}`);
  console.log('Email:', user.email);
  console.log('Login Time:', new Date().toISOString());
  console.log('==================');
};

const logOrderPlacement = (order) => {
  console.log('=== NEW ORDER PLACED ===');
  console.log('Order ID:', order.orderId || order._id);
  console.log('User ID:', order.user);
  console.log('Customer:', `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`);
  console.log('Address:', order.shippingAddress.address);
  console.log('Order Date:', order.createdAt || new Date());
  console.log('Items:');
  order.items.forEach(item => {
    console.log(`  - ${item.productName} x${item.quantity} = ₹${item.subtotal.toLocaleString('en-IN')}`);
  });
  console.log('Total Amount: ₹', order.totalAmount.toLocaleString('en-IN'));
  console.log('Status:', order.status);
  console.log('========================');
};

module.exports = {
  generateToken,
  hashPassword,
  comparePassword,
  handleValidationErrors,
  sendSuccessResponse,
  sendErrorResponse,
  logUserRegistration,
  logUserLogin,
  logOrderPlacement
};
