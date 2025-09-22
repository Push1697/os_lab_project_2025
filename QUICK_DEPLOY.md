# Quick Deployment Guide: Backend (Render) + Frontend (Firebase)

## 🚀 Quick Steps

### 1. Prerequisites Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. MongoDB Atlas Setup
- Create free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/id_verification`

### 3. Firebase Project Setup
- Create project at [Firebase Console](https://console.firebase.google.com)
- Enable Firebase Hosting
- Note your project ID

### 4. GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

### 5. Deploy Backend on Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. New → Web Service → Connect GitHub repo
3. Settings:
   - **Name**: `id-verification-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables:
```
NODE_ENV=production
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-64-char-secret
CORS_ORIGINS=https://your-project-id.web.app,https://your-project-id.firebaseapp.com
SEED_ADMIN_EMAIL=admin@yourcompany.com
SEED_ADMIN_PASS=YourSecurePassword123!
```

### 6. Deploy Frontend on Firebase
```bash
cd frontend

# Login to Firebase
firebase login

# Initialize (choose existing project)
firebase init hosting

# Update .env file
echo "VITE_API_URL=https://your-backend-app.onrender.com/api" > .env

# Build and deploy
npm run build
firebase deploy
```

### 7. Final Steps
1. Update backend CORS with Firebase URLs
2. Seed super admin: Visit `https://your-backend-app.onrender.com/api/auth/seed-admin`
3. Test your app at Firebase hosting URL

## 🔧 Commands Quick Reference

```bash
# Backend deployment (Render handles this via GitHub)
git push origin main

# Frontend deployment
cd frontend
npm run build
firebase deploy

# Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Firebase CLI commands
firebase login
firebase init hosting
firebase deploy
firebase serve  # Local testing
```

## 📋 Environment Variables Template

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/id_verification
JWT_SECRET=your-64-character-random-string
CORS_ORIGINS=https://your-project-id.web.app,https://your-project-id.firebaseapp.com
SEED_ADMIN_EMAIL=admin@yourcompany.com
SEED_ADMIN_PASS=YourSecurePassword123!
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-app.onrender.com/api
```

## 🎯 URLs After Deployment
- **Frontend**: `https://your-project-id.web.app`
- **Backend**: `https://your-backend-app.onrender.com`
- **API Base**: `https://your-backend-app.onrender.com/api`
- **Health Check**: `https://your-backend-app.onrender.com/health`

## ⚠️ Common Issues
- **CORS Error**: Update backend CORS_ORIGINS with exact Firebase URLs
- **API Not Working**: Check VITE_API_URL in frontend .env
- **Build Fails**: Ensure Node.js 18+ and correct root directories
- **Backend Sleeps**: Render free tier sleeps after 15 min inactivity

## 🔄 Update Process
```bash
# Code changes
git add .
git commit -m "Update message"
git push origin main

# Backend updates automatically via Render
# Frontend manual deploy:
cd frontend && npm run build && firebase deploy
```