// Database configuration f
const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    if (process.env.MONGODB_URI) {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
    } else {
      console.log('📊 Database: Using in-memory storage (MongoDB URI not configured)');
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDatabase;
