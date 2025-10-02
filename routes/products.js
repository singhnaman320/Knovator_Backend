const express = require('express');
const { getAllProducts } = require('../controllers/productController');

const router = express.Router();

// Public Routes - Products are read-only for customers
router.get('/', getAllProducts);

module.exports = router;
