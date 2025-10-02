const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  validateAddToCart,
  validateUpdateCartItem,
  validateRemoveCartItem
} = require('../middleware/validation');
const {
  getUserCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');

const router = express.Router();

// All cart routes require authentication
router.use(authenticateToken);

// Get user's cart
router.get('/', getUserCart);

// Add item to cart
router.post('/add', validateAddToCart, addToCart);

// Update cart item quantity
router.put('/item/:productId', validateUpdateCartItem, updateCartItem);

// Remove item from cart
router.delete('/item/:productId', validateRemoveCartItem, removeFromCart);

// Clear entire cart
router.delete('/clear', clearCart);

module.exports = router;
