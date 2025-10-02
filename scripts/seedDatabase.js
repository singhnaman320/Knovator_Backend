// Load environment variables first
require('dotenv').config();

const mongoose = require('mongoose');
const connectDatabase = require('../config/database');
const { Product } = require('../models/modelSelector');
const productsData = require('../data/products');

// Seed Database Script
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDatabase();
    
    // Wait a moment for connection to be established
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if we're using MongoDB
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  No MongoDB URI configured. Using in-memory storage.');
      console.log('💡 To use MongoDB, set MONGODB_URI in your .env file');
    }
    
    // Clear existing product data only
    console.log('🗑️  Clearing existing product data...');
    if (mongoose.connection.readyState === 1) {
      await Product.deleteMany({});
      console.log('   ✅ MongoDB product data cleared');
    } else {
      // For in-memory models, we need to clear differently
      if (Product.products) {
        Product.products.length = 0;
        console.log('   ✅ In-memory product data cleared');
      }
    }
    
    // Seed Products
    console.log('📦 Seeding products...');
    const seededProducts = [];
    
    for (const productData of productsData) {
      const product = await Product.create({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        image: productData.image,
        category: productData.category,
        stockQuantity: productData.stockQuantity || 50,
        inStock: productData.inStock !== false,
        brand: getBrandFromName(productData.name),
        tags: generateTags(productData.name, productData.category),
        ratings: {
          average: generateRating(),
          count: generateRatingCount()
        }
      });
      
      seededProducts.push(product);
      console.log(`   ✅ Created: ${product.name}`);
    }
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📦 Products created: ${seededProducts.length}`);
    console.log('\n📋 Next Steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Register users via: POST /api/auth/signup');
    console.log('3. Login via: POST /api/auth/login');
    console.log('4. Browse products via: GET /api/products');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
};

// Helper functions
function getBrandFromName(name) {
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

function generateTags(name, category) {
  const nameWords = name.toLowerCase().split(' ');
  const categoryTag = category.toLowerCase();
  return [...nameWords.slice(0, 3), categoryTag].filter(tag => tag.length > 2);
}

function generateRating() {
  return Math.round((Math.random() * 1.5 + 3.5) * 10) / 10; // 3.5 to 5.0
}

function generateRatingCount() {
  return Math.floor(Math.random() * 200) + 50; // 50 to 250
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
