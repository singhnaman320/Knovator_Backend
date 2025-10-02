const { sendSuccessResponse, sendErrorResponse } = require('../utils/helpers');
const { Cart, Product } = require('../models/modelSelector');

// Get User Cart Controller
const getUserCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    let cart;
    if (Cart.findOrCreateCart) {
      // MongoDB model
      cart = await Cart.findOrCreateCart(userId);
    } else {
      // In-memory model
      cart = await Cart.findOrCreateCart(userId);
    }
    
    sendSuccessResponse(res, 200, 'Cart retrieved successfully', cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    sendErrorResponse(res, 500, 'Failed to fetch cart', error.message);
  }
};

// Add Item to Cart Controller
const addToCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId, quantity = 1 } = req.body;
    
    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return sendErrorResponse(res, 404, 'Product not found');
    }
    
    // Check stock availability
    if (product.stockQuantity && product.stockQuantity < quantity) {
      return sendErrorResponse(res, 400, `Insufficient stock. Available: ${product.stockQuantity}`);
    }
    
    let cart;
    if (Cart.findOrCreateCart) {
      // MongoDB model
      cart = await Cart.findOrCreateCart(userId);
      await cart.addItem(product, quantity);
    } else {
      cart = await Cart.addItem(userId, product, quantity);
    }
    
    sendSuccessResponse(res, 200, 'Item added to cart successfully', cart);
  } catch (error) {
    console.error('Error adding to cart:', error);
    sendErrorResponse(res, 500, 'Failed to add item to cart', error.message);
  }
};

// Update Cart Item Quantity Controller
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (quantity < 0) {
      return sendErrorResponse(res, 400, 'Quantity cannot be negative');
    }
    
    let cart;
    if (Cart.findOrCreateCart) {
      // MongoDB model
      cart = await Cart.findOrCreateCart(userId);
      cart = await cart.updateItemQuantity(productId, quantity);
    } else {
      // In-memory model
      cart = await Cart.updateItemQuantity(userId, productId, quantity);
    }
    
    sendSuccessResponse(res, 200, 'Cart item updated successfully', cart);
  } catch (error) {
    console.error('Error updating cart item:', error);
    sendErrorResponse(res, 500, 'Failed to update cart item', error.message);
  }
};

// Remove Item from Cart Controller
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId } = req.params;
    
    let cart;
    if (Cart.findOrCreateCart) {
      // MongoDB model
      cart = await Cart.findOrCreateCart(userId);
      cart = await cart.removeItem(productId);
    } else {
      // In-memory model
      cart = await Cart.removeItem(userId, productId);
    }
    
    sendSuccessResponse(res, 200, 'Item removed from cart successfully', cart);
  } catch (error) {
    console.error('Error removing from cart:', error);
    sendErrorResponse(res, 500, 'Failed to remove item from cart', error.message);
  }
};

// Clear Cart Controller
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    let cart;
    if (Cart.findOrCreateCart) {
      // MongoDB model
      cart = await Cart.findOrCreateCart(userId);
      await cart.clearCart();
    } else {
      // In-memory model
      cart = await Cart.clearCart(userId);
    }
    
    sendSuccessResponse(res, 200, 'Cart cleared successfully', cart);
  } catch (error) {
    console.error('Error clearing cart:', error);
    sendErrorResponse(res, 500, 'Failed to clear cart', error.message);
  }
};

module.exports = {
  getUserCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
