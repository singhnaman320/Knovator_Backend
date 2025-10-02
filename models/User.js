const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema Definition
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters long'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters long'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  return userObject;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

// Static method to create user
userSchema.statics.createUser = async function(userData) {
  try {
    const user = new this(userData);
    await user.save();
    return user;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('User with this email already exists');
    }
    throw error;
  }
};

// Index for email for faster queries
userSchema.index({ email: 1 });

// In-memory storage fallback for development (when MongoDB is not available)
class UserMemoryModel {
  constructor() {
    this.users = [];
    this.nextId = 1;
  }

  async create(userData) {
    // Check if user already exists
    const existingUser = this.users.find(user => user.email === userData.email.toLowerCase());
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create user object
    const user = {
      _id: this.nextId++,
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      role: userData.role || 'customer',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Methods
      comparePassword: async function(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
      },
      
      getPublicProfile: function() {
        const { password, resetPasswordToken, resetPasswordExpire, ...publicProfile } = this;
        return publicProfile;
      },

      get fullName() {
        return `${this.firstName} ${this.lastName}`;
      }
    };

    this.users.push(user);
    return user;
  }

  async findByEmail(email) {
    return this.users.find(user => user.email === email.toLowerCase());
  }

  async findById(id) {
    return this.users.find(user => user._id === parseInt(id));
  }

  async findAll() {
    return this.users.map(user => user.getPublicProfile());
  }

  async updateById(id, updateData) {
    const userIndex = this.users.findIndex(user => user._id === parseInt(id));
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    this.users[userIndex] = { ...this.users[userIndex], ...updateData, updatedAt: new Date() };
    return this.users[userIndex];
  }

  async deleteById(id) {
    const userIndex = this.users.findIndex(user => user._id === parseInt(id));
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    return this.users.splice(userIndex, 1)[0];
  }
}

// Export both Mongoose model and in-memory model
let User;

try {
  // Try to use Mongoose model if MongoDB is connected
  User = mongoose.model('User', userSchema);
} catch (error) {
  // Fallback to in-memory model for development
  User = new UserMemoryModel();
}

module.exports = {
  User,
  UserMemoryModel,
  userSchema
};
