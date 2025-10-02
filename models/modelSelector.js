// Model Selector - Automatically chooses between MongoDB and in-memory models
const mongoose = require('mongoose');

// Determine which models to use based on MongoDB URI
const useDatabase = process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '';

let User, Product, Order, Cart;

if (useDatabase) {
  // Use MongoDB models
  const { User: MongoUser } = require('./User');
  const { Product: MongoProduct } = require('./Product');
  const { Order: MongoOrder } = require('./Order');
  const { Cart: MongoCart } = require('./Cart');
  
  User = MongoUser;
  Product = MongoProduct;
  Order = MongoOrder;
  Cart = MongoCart;
  
  console.log('📊 Using MongoDB models');
} else {
  const { UserMemoryModel } = require('./User');
  const { ProductMemoryModel } = require('./Product');
  const { OrderMemoryModel } = require('./Order');
  const { CartMemoryModel } = require('./Cart');
  
  User = new UserMemoryModel();
  Product = new ProductMemoryModel();
  Order = new OrderMemoryModel();
  Cart = new CartMemoryModel();
  
  console.log('📊 Using in-memory models');
}

// Utility function to check connection status
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  User,
  Product,
  Order,
  Cart,
  isMongoConnected
};
