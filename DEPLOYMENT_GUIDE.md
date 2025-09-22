# Mixed Deployment Guide: Backend on Render + Frontend on Firebase

## Architecture Overview
- **Backend**: Node.js API deployed on Render (Free tier)
- **Frontend**: React/Vite app deployed on Firebase Hosting (Free tier)
- **Database**: MongoDB Atlas (Free tier)
- **File Storage**: AWS S3 or Firebase Storage (Optional)

## Pre-Deployment Preparation

### 1. MongoDB Atlas Setup (Required)
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a free cluster
- Create a database user
- Whitelist IP addresses (0.0.0.0/0 for all IPs)
- Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/id_verification`

### 2. AWS S3 Setup (Optional but Recommended)
- Create an AWS account
- Create an S3 bucket for file storage
- Create IAM user with S3 permissions
- Get Access Key ID and Secret Access Key

### 3. Firebase Setup (Required for Frontend)
- Install Firebase CLI: `npm install -g firebase-tools`
- Create a [Firebase project](https://console.firebase.google.com)
- Enable Firebase Hosting
- Get your Firebase config values

### 4. Generate JWT Secret
```bash
# Run this command to generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Deployment Steps

### Method 1: GitHub + Render (Backend) + Firebase (Frontend)

#### Step 1: Prepare Your Repository
1. Create a GitHub repository
2. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit for mixed deployment"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

#### Step 2: Deploy Backend on Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the backend service:
   - **Name**: `id-verification-backend`
   - **Runtime**: `Node`
   - **Root Directory**: `backend` (Important!)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/id_verification
   JWT_SECRET=your-generated-jwt-secret
   JWT_EXPIRES_IN=8h
   CORS_ORIGINS=https://your-project-id.web.app,https://your-project-id.firebaseapp.com
   AWS_ACCESS_KEY_ID=your-aws-access-key (optional)
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key (optional)
   S3_BUCKET=your-s3-bucket-name (optional)
   AWS_REGION=us-east-1 (optional)
   SEED_ADMIN_EMAIL=admin@yourcompany.com
   SEED_ADMIN_PASS=YourSecurePassword123!
   VERIFY_RATE_LIMIT=60
   AUTH_RATE_LIMIT=5
   MAX_FILE_SIZE=5242880
   ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
   LOG_LEVEL=info
   ```

6. Click "Create Web Service"
7. **Note the backend URL** (e.g., `https://id-verification-backend.onrender.com`)

#### Step 3: Setup Firebase for Frontend
1. Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

2. Navigate to frontend directory:
```bash
cd frontend
```

3. Login to Firebase:
```bash
firebase login
```

4. Initialize Firebase project:
```bash
firebase init hosting
```
   - Select "Use an existing project" and choose your Firebase project
   - Set public directory to `dist`
   - Configure as single-page app: Yes
   - Set up automatic builds: No (we'll do manual deployment)

5. Update `.firebaserc` with your project ID:
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

#### Step 4: Configure Frontend Environment
1. Create `.env` file in frontend directory:
```bash
VITE_API_URL=https://your-backend-app.onrender.com/api
```

2. Build and deploy frontend:
```bash
npm run build
firebase deploy
```

#### Step 5: Update Backend CORS
1. Go to your Render backend service settings
2. Update `CORS_ORIGINS` environment variable with your Firebase URLs:
```
CORS_ORIGINS=https://your-project-id.web.app,https://your-project-id.firebaseapp.com
```

### Method 2: Using GitHub Actions (Automated)

Create GitHub Actions workflow for automated deployment:

1. Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Firebase and Render

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        VITE_API_URL: ${{ secrets.VITE_API_URL }}
    
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: ${{ secrets.GITHUB_TOKEN }}
        firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
        projectId: your-project-id
        entryPoint: './frontend'
```

2. Add secrets in GitHub repository settings:
   - `VITE_API_URL`: Your Render backend URL
   - `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON

Note: Backend will auto-deploy via Render when you push to GitHub.

## Post-Deployment Steps

### 1. Seed Super Admin (Important!)
After backend deployment, create the super admin:
```bash
# Method 1: Using the seeding script (if you have terminal access)
npm run seed:superadmin

# Method 2: Direct API call
curl -X POST https://your-backend-app.onrender.com/api/auth/seed-admin
```

### 2. Test the Application
1. Visit your Firebase hosting URL
2. Try logging in with the admin credentials you set
3. Test document upload functionality
4. Check admin dashboard features
5. Verify API calls are working between Firebase frontend and Render backend

### 3. Monitor Logs
- **Backend**: Check Render dashboard for backend logs
- **Frontend**: Use Firebase console for hosting logs
- **Database**: Monitor MongoDB Atlas logs

## Environment Variables Checklist

### Backend (.env)
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000`
- [ ] `MONGO_URI` (MongoDB Atlas connection string)
- [ ] `JWT_SECRET` (64-character random string)
- [ ] `JWT_EXPIRES_IN=8h`
- [ ] `CORS_ORIGINS` (Frontend URL)
- [ ] `SEED_ADMIN_EMAIL`
- [ ] `SEED_ADMIN_PASS`
- [ ] AWS credentials (if using S3)

### Frontend (.env)
- [ ] `VITE_API_URL` (Render Backend API URL)
- [ ] Firebase config variables (if needed)

## Troubleshooting Common Issues

### 1. CORS Errors
- Ensure `CORS_ORIGINS` includes your Firebase hosting URLs
- Use both `.web.app` and `.firebaseapp.com` domains
- No trailing slash in URLs

### 2. Database Connection Issues
- Verify MongoDB Atlas connection string
- Check IP whitelist (use 0.0.0.0/0 for all IPs)
- Ensure database user has proper permissions

### 3. Firebase Build Failures
- Check Node.js version compatibility (use Node 18+)
- Ensure all dependencies are in `package.json`
- Review Firebase hosting logs
- Verify `dist` folder is created after build

### 4. Backend Build Failures on Render
- Check if `backend` is set as root directory
- Verify all backend dependencies are in `backend/package.json`
- Review Render build logs for specific errors

### 5. API Connection Issues
- Verify `VITE_API_URL` points to correct Render backend URL
- Check if backend service is running
- Ensure environment variables are properly set
- Test API endpoints directly using tools like Postman

## Cost Optimization Tips

### Free Tier Limitations
- **Render**: Free tier sleeps after 15 minutes of inactivity, 750 hours/month limit
- **Firebase**: 125K total reads per day, 10 GB storage
- **MongoDB Atlas**: 512 MB storage, no backups
- Consider upgrading to paid tiers for production use

### Performance Tips
- Use S3 or Firebase Storage for file storage instead of local storage
- Implement proper caching strategies  
- Optimize build sizes
- Use CDN for static assets (Firebase provides this automatically)
- Enable gzip compression

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to Git
2. **JWT Secret**: Use a strong, randomly generated secret
3. **Database**: Use MongoDB Atlas with proper authentication
4. **CORS**: Restrict to specific domains in production
5. **Rate Limiting**: Configure appropriate rate limits
6. **File Upload**: Validate file types and sizes
7. **HTTPS**: Render provides HTTPS by default

## Maintenance

### Regular Updates
- Keep dependencies updated
- Monitor security vulnerabilities
- Review logs regularly
- Backup database regularly

### Scaling Considerations
- Monitor resource usage
- Consider upgrading plans based on usage
- Implement proper logging and monitoring
- Set up alerts for critical issues

## Support Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)

---

**Note**: Replace all placeholder values (like `your-username`, `your-password`, etc.) with your actual values before deployment.