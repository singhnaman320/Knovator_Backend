const mongoose = require('mongoose');

// Product Schema Definition
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [1000, 'Product description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(value) {
        return value > 0;
      },
      message: 'Price must be greater than 0'
    }
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: ['Electronics', 'Wearables', 'Accessories', 'Peripherals', 'Audio', 'Computing'],
      message: 'Please select a valid category'
    }
  },
  image: {
    type: String,
    required: [true, 'Product image is required'],
    validate: {
      validator: function(value) {
        // More flexible URL validation that accepts query parameters
        return /^https?:\/\/.+/i.test(value);
      },
      message: 'Please provide a valid image URL'
    }
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity cannot be negative'],
    default: 0
  },
  inStock: {
    type: Boolean,
    default: function() {
      return this.stockQuantity > 0;
    }
  },
  sku: {
    type: String,
    unique: true,
    sparse: true // Allow multiple null values
  },
  brand: {
    type: String,
    trim: true
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative']
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  tags: [{
    type: String,
    trim: true
  }],
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return `₹${this.price.toLocaleString('en-IN')}`;
});

// Virtual for availability status
productSchema.virtual('availabilityStatus').get(function() {
  if (this.stockQuantity === 0) return 'Out of Stock';
  if (this.stockQuantity <= 5) return 'Low Stock';
  return 'In Stock';
});

productSchema.pre('save', function(next) {
  this.inStock = this.stockQuantity > 0;
  next();
});

// Static method to get all products
productSchema.statics.findAll = function() {
  // Get all products without filtering for debugging
  return this.find({});
};


// Static method to get products in stock
productSchema.statics.getInStockProducts = function() {
  return this.find({ 
    inStock: true, 
    isActive: true,
    stockQuantity: { $gt: 0 }
  });
};

// Instance method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'decrease') {
  if (operation === 'decrease') {
    this.stockQuantity = Math.max(0, this.stockQuantity - quantity);
  } else if (operation === 'increase') {
    this.stockQuantity += quantity;
  }
  this.inStock = this.stockQuantity > 0;
  return this.save();
};

// Index for better query performance
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ inStock: 1 });
productSchema.index({ createdAt: -1 });

// Import static product data for in-memory model
const staticProducts = require('../data/products');

// Fallback in-memory storage for development (when MongoDB is not available)
class ProductMemoryModel {
  constructor() {
    // Load products from static data
    this.products = staticProducts.map(product => ({
      _id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      stockQuantity: product.stockQuantity || 50,
      inStock: product.inStock !== false,
      brand: this.getBrandFromName(product.name),
      tags: this.generateTags(product.name, product.category),
      ratings: { average: this.generateRating(), count: this.generateRatingCount() },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    this.nextId = Math.max(...this.products.map(p => p._id)) + 1;
  }

  // Helper methods
  getBrandFromName(name) {
    const brandMap = {
      'Wireless Bluetooth Headphones': 'AudioTech',
      'Smart Fitness Watch': 'FitTech', 
      'Portable Laptop Stand': 'ErgoDesk',
      'Wireless Charging Pad': 'ChargeTech',
      'USB-C Hub': 'ConnectPro',
      'Mechanical Keyboard': 'KeyMaster',
      '4K Webcam': 'VisionPro',
      'Bluetooth Speaker': 'SoundWave'
    };
    return brandMap[name] || 'Generic';
  }

  generateTags(name, category) {
    const nameWords = name.toLowerCase().split(' ');
    const categoryTag = category.toLowerCase();
    return [...nameWords.slice(0, 3), categoryTag].filter(tag => tag.length > 2);
  }

  generateRating() {
    return Math.round((Math.random() * 1.5 + 3.5) * 10) / 10; // 3.5 to 5.0
  }

  generateRatingCount() {
    return Math.floor(Math.random() * 200) + 50; // 50 to 250
  }

  async findAll() {
    return this.products.filter(product => product.isActive);
  }

  async findById(id) {
    return this.products.find(product => product._id === parseInt(id) && product.isActive);
  }


  async getInStockProducts() {
    return this.products.filter(product => product.inStock && product.isActive);
  }

  async create(productData) {
    const product = {
      _id: this.nextId++,
      ...productData,
      inStock: productData.stockQuantity > 0,
      ratings: { average: 0, count: 0 },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.products.push(product);
    return product;
  }

  async updateById(id, updateData) {
    const productIndex = this.products.findIndex(product => product._id === parseInt(id));
    if (productIndex === -1) {
      throw new Error('Product not found');
    }

    this.products[productIndex] = {
      ...this.products[productIndex],
      ...updateData,
      updatedAt: new Date()
    };

    // Update inStock status
    if (updateData.stockQuantity !== undefined) {
      this.products[productIndex].inStock = updateData.stockQuantity > 0;
    }

    return this.products[productIndex];
  }

  async deleteById(id) {
    const productIndex = this.products.findIndex(product => product._id === parseInt(id));
    if (productIndex === -1) {
      throw new Error('Product not found');
    }

    // Soft delete
    this.products[productIndex].isActive = false;
    this.products[productIndex].updatedAt = new Date();
    return this.products[productIndex];
  }

  async updateStock(id, quantity, operation = 'decrease') {
    const product = await this.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    if (operation === 'decrease') {
      product.stockQuantity = Math.max(0, product.stockQuantity - quantity);
    } else if (operation === 'increase') {
      product.stockQuantity += quantity;
    }

    product.inStock = product.stockQuantity > 0;
    product.updatedAt = new Date();
    return product;
  }
}

// Export both Mongoose model and in-memory model
let Product;

try {
  // Try to use Mongoose model if MongoDB is connected
  Product = mongoose.model('Product', productSchema);
} catch (error) {
  // Fallback to in-memory model for development
  Product = new ProductMemoryModel();
}

module.exports = {
  Product,
  ProductMemoryModel,
  productSchema
};
