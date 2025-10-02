const { sendSuccessResponse, sendErrorResponse } = require('../utils/helpers');
const { Product } = require('../models/modelSelector');

// Get All Products Controller
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    
    sendSuccessResponse(res, 200, 'Products retrieved successfully', {
      products,
      count: products.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    sendErrorResponse(res, 500, 'Failed to fetch products', error.message);
  }
};

module.exports = {
  getAllProducts
};
