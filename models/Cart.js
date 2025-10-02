const mongoose = require('mongoose');

// Cart Item Schema
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  subtotal: {
    type: Number,
    required: true
  }
}, { _id: false });

// Cart Schema
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One cart per user
  },
  items: [cartItemSchema],
  totalItems: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted total amount
cartSchema.virtual('formattedTotal').get(function() {
  return `₹${this.totalAmount.toLocaleString('en-IN')}`;
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  this.totalAmount = this.items.reduce((total, item) => total + item.subtotal, 0);
  this.lastUpdated = new Date();
  next();
});

// Static method to find or create cart for user
cartSchema.statics.findOrCreateCart = async function(userId) {
  let cart = await this.findOne({ user: userId }).populate('items.product');
  if (!cart) {
    cart = new this({
      user: userId,
      items: [],
      totalItems: 0,
      totalAmount: 0
    });
    await cart.save();
  }
  return cart;
};

// Instance method to add item to cart
cartSchema.methods.addItem = function(productData, quantity = 1) {
  const existingItemIndex = this.items.findIndex(
    item => item.product.toString() === productData._id.toString()
  );

  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].subtotal = 
      this.items[existingItemIndex].price * this.items[existingItemIndex].quantity;
  } else {
    // Add new item
    this.items.push({
      product: productData._id,
      productName: productData.name,
      price: productData.price,
      image: productData.image,
      quantity: quantity,
      subtotal: productData.price * quantity
    });
  }
  
  return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const itemIndex = this.items.findIndex(item => {
    const itemProductId = typeof item.product === 'object' ? item.product._id.toString() : item.product.toString();
    return itemProductId === productId.toString();
  });

  if (itemIndex > -1) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      this.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      this.items[itemIndex].quantity = quantity;
      this.items[itemIndex].subtotal = this.items[itemIndex].price * quantity;
    }
  }
  
  return this.save();
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => {
    const itemProductId = typeof item.product === 'object' ? item.product._id.toString() : item.product.toString();
    return itemProductId !== productId.toString();
  });
  
  return this.save();
};

// Instance method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// Fallback in-memory storage for development (when MongoDB is not available)
class CartMemoryModel {
  constructor() {
    this.carts = new Map(); // userId -> cart data
  }

  async findOrCreateCart(userId) {
    if (!this.carts.has(userId)) {
      this.carts.set(userId, {
        user: userId,
        items: [],
        totalItems: 0,
        totalAmount: 0,
        lastUpdated: new Date()
      });
    }
    return this.carts.get(userId);
  }

  async addItem(userId, productData, quantity = 1) {
    const cart = await this.findOrCreateCart(userId);
    
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productData._id.toString()
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].subtotal = 
        cart.items[existingItemIndex].price * cart.items[existingItemIndex].quantity;
    } else {
      cart.items.push({
        product: productData._id,
        productName: productData.name,
        price: productData.price,
        image: productData.image,
        quantity: quantity,
        subtotal: productData.price * quantity
      });
    }

    this.updateTotals(cart);
    return cart;
  }

  async updateItemQuantity(userId, productId, quantity) {
    const cart = await this.findOrCreateCart(userId);
    
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId.toString()
    );

    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].subtotal = cart.items[itemIndex].price * quantity;
      }
    }

    this.updateTotals(cart);
    return cart;
  }

  async removeItem(userId, productId) {
    const cart = await this.findOrCreateCart(userId);
    cart.items = cart.items.filter(
      item => item.product.toString() !== productId.toString()
    );
    
    this.updateTotals(cart);
    return cart;
  }

  async clearCart(userId) {
    const cart = await this.findOrCreateCart(userId);
    cart.items = [];
    this.updateTotals(cart);
    return cart;
  }

  updateTotals(cart) {
    cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((total, item) => total + item.subtotal, 0);
    cart.lastUpdated = new Date();
  }
}

// Export Mongoose model for modelSelector
const Cart = mongoose.model('Cart', cartSchema);

module.exports = {
  Cart,
  CartMemoryModel,
  cartSchema,
  cartItemSchema
};
