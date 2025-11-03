# ID Verification System

A full-stack web application for verifying and managing official documents and IDs. This system provides a secure platform for document verification with admin management capabilities.

## 🌟 Features

- **Document Verification**
  - Public API for verifying certificates and IDs
  - Secure file upload and storage
  - Real-time verification status updates

- **Admin Dashboard**
  - Comprehensive admin panel for document management
  - Analytics and verification statistics
  - User activity monitoring

- **Security**
  - JWT-based authentication
  - Role-based access control
  - Secure file handling with AWS S3
  - Input validation and sanitization

## 🏗️ Technology Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- AWS S3 for file storage

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS

## 📦 Project Structure

```
├── backend/              # Express.js server
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   └── utils/          # Utility functions
│
├── frontend/            # React.js client
│   ├── src/
│   │   ├── api/        # API integration
│   │   ├── components/ # Reusable components
│   │   └── pages/      # Page components
│   └── public/         # Static assets
│
└── render.yaml         # Deployment configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- MongoDB
- AWS account (for production file storage)

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the server:
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:5173

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - Admin login
- `POST /api/auth/verify` - Verify JWT token

### Document Verification
- `POST /api/verify` - Verify a document
- `GET /api/verify/:id` - Get verification status

### Admin Routes
- `GET /api/analytics` - Get verification statistics
- `POST /api/users` - Create new user
- `GET /api/users` - List all users
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🔐 Security

- All API endpoints are protected with JWT authentication
- File uploads are validated and scanned
- Sensitive data is encrypted
- CORS is configured for security

## 🚀 Deployment

The project is configured for deployment on Render.com using the `render.yaml` configuration file.

1. Backend API automatically deploys from main branch
2. Frontend is deployed to Firebase hosting

## 💡 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.