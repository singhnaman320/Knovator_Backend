const { body, param } = require('express-validator');
const { handleValidationErrors } = require('../utils/helpers');

// User Registration Validation
const validateUserRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),
  body('lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

// User Login Validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];


// Order Placement Validation
const validateOrderPlacement = [
  body('firstName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name is required'),
  body('address')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Address must be at least 5 characters long'),
  body('cartItems')
    .isArray({ min: 1 })
    .withMessage('Cart items are required and must be an array with at least one item'),
  handleValidationErrors
];

// Order Cancellation Validation
const validateOrderCancellation = [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Cancellation reason cannot exceed 200 characters'),
  handleValidationErrors
];

// Cart Item Addition Validation
const validateAddToCart = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  handleValidationErrors
];

// Cart Item Update Validation
const validateUpdateCartItem = [
  param('productId')
    .notEmpty()
    .withMessage('Product ID is required'),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  handleValidationErrors
];

// Cart Item Removal Validation
const validateRemoveCartItem = [
  param('productId')
    .notEmpty()
    .withMessage('Product ID is required'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateOrderPlacement,
  validateOrderCancellation,
  validateAddToCart,
  validateUpdateCartItem,
  validateRemoveCartItem
};
