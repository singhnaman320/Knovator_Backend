const { sendSuccessResponse, sendErrorResponse, logOrderPlacement } = require('../utils/helpers');
const { Order, Product } = require('../models/modelSelector');

// Place Order Controller
const placeOrder = async (req, res) => {
  try {
    const { firstName, lastName, address, cartItems } = req.body;
    
    // Additional validation
    if (!firstName || !lastName || !address) {
      return sendErrorResponse(res, 400, 'First name, last name, and address are required');
    }
    
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return sendErrorResponse(res, 400, 'Cart items are required');
    }
    
    // Calculate total amount and validate products
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of cartItems) {
      const product = await Product.findById(item.id);
      if (!product) {
        throw new Error(`Product with ID ${item.id} not found`);
      }
      
      // Check stock availability
      if (product.stockQuantity && product.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`);
      }
      
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        product: product._id || product.id,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemTotal
      });
      
      // Update product stock (if using memory model)
      if (Product.updateStock) {
        await Product.updateStock(item.id, item.quantity, 'decrease');
      }
    }
    
    // Create order object
    const orderData = {
      user: req.user._id || req.user.id,
      items: orderItems,
      shippingAddress: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim()
      },
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: 'confirmed'
    };
    
    // Create order using model
    const order = await Order.create(orderData);
    
    // Log order details
    logOrderPlacement(order);
    
    sendSuccessResponse(res, 201, 'Order placed successfully', order);
    
  } catch (error) {
    console.error('Error placing order:', error);
    sendErrorResponse(res, 500, 'Failed to place order', error.message);
  }
};

// Get User Orders Controller
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userOrders = await Order.findByUser(userId);
    
    sendSuccessResponse(res, 200, 'Orders retrieved successfully', {
      orders: userOrders,
      count: userOrders.length
    });
    
  } catch (error) {
    console.error('Error fetching user orders:', error);
    sendErrorResponse(res, 500, 'Failed to fetch orders', error.message);
  }
};


// Cancel Order Controller
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id || req.user.id;
    
    
    // Find order by the ID passed (could be _id or orderId)
    let order;
    
    // Check if it's a MongoDB ObjectId format (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    
    if (isObjectId) {
      // It's a MongoDB ObjectId, find by _id
      order = await Order.findById(orderId);
    } else {
      // It's a custom orderId, find by orderId
      order = await Order.findByOrderId(orderId);
    }
    
    // If still not found, try the other method as fallback
    if (!order) {
      if (isObjectId) {
        order = await Order.findByOrderId(orderId);
      } else {
        order = await Order.findById(orderId);
      }
    }
    
    // Check if user owns this order (handle both string and ObjectId comparison)
    const orderUserId = order?.user?.toString() || order?.userId?.toString();
    const currentUserId = userId?.toString();
    
    if (!order || (orderUserId !== currentUserId)) {
      return sendErrorResponse(res, 404, 'Order not found or access denied');
    }
    
    if (order.status === 'cancelled') {
      return sendErrorResponse(res, 400, 'Order is already cancelled');
    }
    
    if (order.status === 'shipped' || order.status === 'delivered') {
      return sendErrorResponse(res, 400, 'Cannot cancel shipped or delivered orders');
    }
    
    // Cancel order using model method
    if (order.cancelOrder) {
      // In-memory model
      order.cancelOrder(reason);
      var cancelledOrder = order;
    } else {
      // MongoDB model
      order.status = 'cancelled';
      order.cancelledAt = new Date();
      order.cancellationReason = reason;
      var cancelledOrder = await order.save();
    }
    
    console.log(`=== ORDER CANCELLED ===`);
    console.log('Order ID:', orderId);
    console.log('User ID:', userId);
    console.log('Cancelled At:', new Date().toISOString());
    console.log('Reason:', reason || 'No reason provided');
    console.log('=======================');
    
    sendSuccessResponse(res, 200, 'Order cancelled successfully', cancelledOrder);
    
  } catch (error) {
    console.error('Error cancelling order:', error);
    sendErrorResponse(res, 500, 'Failed to cancel order', error.message);
  }
};

module.exports = {
  placeOrder,
  getUserOrders,
  cancelOrder
};
