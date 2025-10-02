# E-commerce Backend API

A robust Node.js/Express.js backend API for an e-commerce application with MongoDB integration and fallback in-memory storage.

## 🚀 Features

- **Authentication & Authorization** - JWT-based user authentication
- **Product Management** - Product catalog with categories and inventory
- **Shopping Cart** - Persistent cart functionality with real-time updates
- **Order Management** - Complete order lifecycle with cancellation support
- **Dual Storage** - MongoDB with in-memory fallback for development
- **Input Validation** - Comprehensive request validation middleware
- **Error Handling** - Centralized error handling with proper HTTP status codes

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (optional - uses in-memory storage if not available)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the server root:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://your-connection-string
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

## 📁 Project Structure

```
server/
├── controllers/          # Route handlers and business logic
│   ├── authController.js     # User authentication
│   ├── cartController.js     # Shopping cart operations
│   ├── orderController.js    # Order management
│   └── productController.js  # Product catalog
├── middleware/          # Custom middleware functions
│   ├── auth.js              # JWT authentication middleware
│   └── validation.js        # Request validation schemas
├── models/             # Database models and schemas
│   ├── User.js              # User model (MongoDB + Memory)
│   ├── Product.js           # Product model (MongoDB + Memory)
│   ├── Cart.js              # Cart model (MongoDB + Memory)
│   ├── Order.js             # Order model (MongoDB + Memory)
│   └── modelSelector.js     # Automatic model selection
├── routes/             # API route definitions
│   ├── auth.js              # Authentication routes
│   ├── cart.js              # Cart routes
│   ├── orders.js            # Order routes
│   └── products.js          # Product routes
├── utils/              # Utility functions
│   └── helpers.js           # Response helpers and utilities
├── config/             # Configuration files
│   └── database.js          # Database connection setup
├── data/               # Seed data
│   └── products.js          # Sample product data
├── scripts/            # Utility scripts
│   └── seedDatabase.js      # Database seeding script
├── .env                # Environment variables
├── server.js           # Application entry point
└── package.json        # Dependencies and scripts
```

## 🔌 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /signup` - User registration
- `POST /login` - User login
- `GET /profile` - Get user profile (protected)

### Product Routes (`/api/products`)
- `GET /` - Get all products

### Cart Routes (`/api/cart`)
- `GET /` - Get user's cart (protected)
- `POST /add` - Add item to cart (protected)
- `PUT /item/:productId` - Update cart item quantity (protected)
- `DELETE /item/:productId` - Remove item from cart (protected)
- `DELETE /clear` - Clear entire cart (protected)

### Order Routes (`/api/orders`)
- `GET /` - Get user's orders (protected)
- `POST /` - Place new order (protected)
- `PATCH /:orderId/cancel` - Cancel order (protected)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Models

### User Model
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: String (default: 'customer'),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Product Model
```javascript
{
  name: String,
  description: String,
  price: Number,
  category: String,
  image: String,
  stockQuantity: Number,
  inStock: Boolean,
  brand: String,
  tags: [String],
  ratings: { average: Number, count: Number },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Cart Model
```javascript
{
  user: ObjectId (ref: User),
  items: [{
    product: ObjectId (ref: Product),
    productName: String,
    price: Number,
    image: String,
    quantity: Number,
    subtotal: Number
  }],
  totalItems: Number,
  totalAmount: Number,
  lastUpdated: Date
}
```

### Order Model
```javascript
{
  orderId: String (auto-generated: KNV + YYMMDD + XXXX),
  user: ObjectId (ref: User),
  items: [OrderItem],
  customerInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String
  },
  shippingAddress: {
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  totalAmount: Number,
  status: String (pending, confirmed, shipped, delivered, cancelled),
  createdAt: Date,
  updatedAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}
```

## 🛡️ Input Validation

All endpoints include comprehensive input validation:

- **User Registration**: Name, email format, password requirements
- **Cart Operations**: Product ID validation, quantity limits
- **Order Placement**: Customer info, shipping address validation
- **Order Cancellation**: Reason length limits

## 🔄 Dual Storage System

The application automatically switches between MongoDB and in-memory storage:

- **MongoDB**: Used when `MONGODB_URI` is provided
- **In-Memory**: Fallback for development when MongoDB is unavailable
- **Automatic Selection**: Handled by `modelSelector.js`

## 🌱 Database Seeding

Populate the database with sample data:

```bash
node scripts/seedDatabase.js
```

## 🚦 Error Handling

Standardized error responses:

```javascript
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information" // Only in development
}
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port number | No (default: 5000) |
| `MONGODB_URI` | MongoDB connection string | No (uses in-memory if not provided) |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## 🧪 Development

### Available Scripts

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Seed database with sample data
npm run seed
```

### Adding New Features

1. **Models**: Add to `models/` directory with both MongoDB and memory implementations
2. **Controllers**: Create in `controllers/` with proper error handling
3. **Routes**: Define in `routes/` with validation middleware
4. **Validation**: Add schemas to `middleware/validation.js`

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check `MONGODB_URI` in `.env`
   - Verify network connectivity
   - Application will fallback to in-memory storage

2. **JWT Authentication Errors**
   - Ensure `JWT_SECRET` is set in `.env`
   - Check token format in Authorization header

3. **Validation Errors**
   - Review request body format
   - Check required fields in API documentation

## 📦 Dependencies

### Core Dependencies
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **jsonwebtoken** - JWT implementation
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Development Dependencies
- **nodemon** - Development auto-reload

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
#   K n o v a t o r _ B a c k e n d  
 