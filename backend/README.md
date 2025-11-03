# ID Verification Backend API

A simple backend service for ID/Certificate verification with admin management and MongoDB integration.

## 🚀 Features

- **Certificate Verification**: Public API for verifying certificates by ID or email
- **Admin Authentication**: JWT-based authentication system
- **User Management**: Complete CRUD operations for certificate holders
- **File Upload**: Secure file upload functionality
- **MongoDB Integration**: Database connection and operations
- **Security**: Helmet.js, CORS, input validation, and password hashing

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [MongoDB Setup](#mongodb-setup)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB installed and running

### Installation

1. **Clone and Install Dependencies**
```bash
git clone <your-repo>
cd backend
npm install
```

2. **Set Up Environment Variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start the Server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

## 🗄️ MongoDB Setup

### Install MongoDB (Ubuntu/Debian)

1. **Import MongoDB GPG Key**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
```

2. **Add MongoDB Repository**
```bash
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

3. **Install MongoDB**
```bash
sudo apt update
sudo apt install -y mongodb-org
```

4. **Start MongoDB Service**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

5. **Verify Installation**
```bash
sudo systemctl status mongod
mongo --version
```

### MongoDB Connection

The application connects to MongoDB using the connection string in your `.env` file:

```bash
MONGO_URI=mongodb://localhost:27017/id_verification
```

### Create Database and Initial Admin

1. **Connect to MongoDB**
```bash
mongosh
```

2. **Create Database**
```javascript
use id_verification
```

3. **Create Initial Admin (Optional)**
```javascript
db.admins.insertOne({
  email: "admin@example.com",
  password: "$2b$12$hash...", // Use bcrypt to hash your password
  role: "superadmin",
  isActive: true,
  createdAt: new Date(),
  lastLogin: null
})
```

## 📋 Environment Variables

Create a `.env` file in the backend directory:

```bash
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/id_verification

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Admin Configuration (for initial setup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=AdminPass123!

# AWS S3 (Optional - uses local storage if not provided)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔐 Authentication

### Admin Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@nextcoreai.com",
  "password": "AdminPass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@nextcoreai.com",
    "role": "admin",
    "lastLogin": "2024-01-15T10:30:00.000Z"
  }
}
```

## 📖 API Documentation

### 👥 User Management

#### Get All Users
```http
GET /api/users?page=1&limit=10&search=john
Authorization: Bearer <token>
```

#### Create New User
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "certificateId": "CERT123456",
  "certificateUrl": "https://example.com/cert.pdf",
  "issueDate": "2024-01-15",
  "expiryDate": "2025-01-15"
}
```

### ✅ Verification

#### Verify Certificate by ID
```http
GET /api/verify/certificate/CERT123456
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "certificate": {
    "name": "John Doe",
    "email": "john@example.com",
    "certificateId": "CERT123456",
    "issueDate": "2024-01-15T00:00:00.000Z",
    "expiryDate": "2025-01-15T00:00:00.000Z"
  }
}
```

#### Verify by Email
```http
GET /api/verify/email/john@example.com
```

### 📤 File Upload
```http
POST /api/upload/certificate
Authorization: Bearer <token>
Content-Type: multipart/form-data

certificate: <file>
```

##  Project Structure

```
backend/
├── config/
│   ├── aws.js              # AWS S3 configuration
│   └── db.js               # MongoDB connection
├── controllers/
│   ├── admins.controller.js  # Admin management
│   ├── auth.controller.js    # Authentication
│   ├── upload.controller.js  # File uploads
│   ├── users.controller.js   # User CRUD
│   └── verify.controller.js  # Verification
├── middleware/
│   ├── auth.js             # JWT authentication
│   ├── errorHandler.js     # Error handling
│   └── validate.js         # Input validation
├── models/
│   ├── Admin.js            # Admin schema
│   ├── Log.js              # Audit logs
│   └── User.js             # User schema
├── routes/
│   ├── admins.js           # Admin routes
│   ├── auth.js             # Auth routes
│   ├── upload.js           # Upload routes
│   ├── users.js            # User routes
│   └── verify.js           # Verification routes
├── package.json           # Dependencies
└── server.js             # Main application
```

## � Development

### Start Development Server
```bash
npm run dev
```

### API Health Check
```bash
curl http://localhost:5000/api/health
```

##  Support

For support, email support@example.com