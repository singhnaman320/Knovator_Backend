const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateOrderPlacement,
  validateOrderCancellation
} = require('../middleware/validation');
const {
  placeOrder,
  getUserOrders,
  cancelOrder
} = require('../controllers/orderController');

const router = express.Router();

// Customer Routes (Protected)
router.get('/', authenticateToken, getUserOrders); // Get user orders
router.post('/', authenticateToken, validateOrderPlacement, placeOrder); // Place new order
router.patch('/:orderId/cancel', authenticateToken, validateOrderCancellation, cancelOrder);

module.exports = router;
