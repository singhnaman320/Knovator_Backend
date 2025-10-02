const mongoose = require('mongoose');

// Order Item Schema
const orderItemSchema = new mongoose.Schema({
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
    required: true,
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  }
});

// Shipping Address Schema
const shippingAddressSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    minlength: [5, 'Address must be at least 5 characters long']
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    default: 'United States'
  }
});

// Order Schema Definition
const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    type: shippingAddressSchema,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      message: 'Please select a valid order status'
    },
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'paid', 'failed', 'refunded'],
      message: 'Please select a valid payment status'
    },
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'cash_on_delivery'],
    default: 'credit_card'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  trackingNumber: {
    type: String,
    sparse: true
  },
  estimatedDelivery: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for customer full name
orderSchema.virtual('customerName').get(function() {
  return `${this.shippingAddress.firstName} ${this.shippingAddress.lastName}`;
});

// Virtual for formatted total amount
orderSchema.virtual('formattedTotal').get(function() {
  return `₹${this.totalAmount.toLocaleString('en-IN')}`;
});

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Pre-save middleware to calculate total amount and generate orderId
orderSchema.pre('save', function(next) {
  // Generate orderId if not exists
  if (!this.orderId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    this.orderId = `KNV${year}${month}${day}${randomNum}`;
  }
  
  // Calculate total amount
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((total, item) => total + item.subtotal, 0);
  }
  
  next();
});

// Static method to create order
orderSchema.statics.create = function(orderData) {
  const order = new this(orderData);
  return order.save();
};

// Static method to find orders by user
orderSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).populate('user', 'firstName lastName email').sort({ createdAt: -1 });
};

orderSchema.statics.findByOrderId = function(orderId) {
  return this.findOne({ orderId: orderId });
};

// Instance method to cancel order
orderSchema.methods.cancelOrder = function(reason) {
  if (this.status === 'shipped' || this.status === 'delivered') {
    throw new Error('Cannot cancel shipped or delivered orders');
  }
  
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  if (reason) this.cancellationReason = reason;
  
  return this.save();
};

// Index for better query performance
orderSchema.index({ user: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// In-memory storage fallback for development
class OrderMemoryModel {
  constructor() {
    this.orders = [];
    this.nextId = 1;
  }

  async create(orderData) {
    const order = {
      _id: this.nextId++,
      orderId: (() => {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        return `KNV${year}${month}${day}${randomNum}`;
      })(),
      user: orderData.user,
      items: orderData.items,
      shippingAddress: orderData.shippingAddress,
      totalAmount: orderData.items.reduce((total, item) => total + item.subtotal, 0),
      status: 'confirmed',
      paymentStatus: 'pending',
      paymentMethod: 'credit_card',
      notes: orderData.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Methods
      updateStatus: function(newStatus, notes) {
        this.status = newStatus;
        if (notes) this.notes = notes;
        
        if (newStatus === 'delivered') {
          this.deliveredAt = new Date();
        } else if (newStatus === 'cancelled') {
          this.cancelledAt = new Date();
        }
        
        this.updatedAt = new Date();
        return this;
      },
      
      cancelOrder: function(reason) {
        if (this.status === 'shipped' || this.status === 'delivered') {
          throw new Error('Cannot cancel shipped or delivered orders');
        }
        
        this.status = 'cancelled';
        this.cancelledAt = new Date();
        if (reason) this.cancellationReason = reason;
        this.updatedAt = new Date();
        
        return this;
      },

      get customerName() {
        return `${this.shippingAddress.firstName} ${this.shippingAddress.lastName}`;
      },

      get formattedTotal() {
        return `₹${this.totalAmount.toLocaleString('en-IN')}`;
      }
    };

    this.orders.push(order);
    return order;
  }

  async findByUser(userId) {
    return this.orders
      .filter(order => order.user === parseInt(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async findById(id) {
    return this.orders.find(order => order._id === parseInt(id));
  }

  async findByOrderId(orderId) {
    return this.orders.find(order => order.orderId === orderId);
  }

}

// Export Mongoose model for modelSelector
const Order = mongoose.model('Order', orderSchema);

module.exports = {
  Order,
  OrderMemoryModel,
  orderSchema,
  orderItemSchema,
  shippingAddressSchema
};
