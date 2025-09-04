# FastAPI Vercel Deployment Guide

## Prerequisites
1. Vercel account (signup at vercel.com)
2. GitHub repository with your FastAPI code
3. Supabase project setup

## Step-by-Step Deployment

### 1. Prepare Your Repository
- Ensure all files are committed to your GitHub repository
- The following files have been created/updated for Vercel compatibility:
  - `vercel.json` (Vercel configuration)
  - `api/index.py` (Vercel handler)
  - `main.py` (updated with handler)
  - `.env.example` (environment variables template)

### 2. Deploy to Vercel

#### Option A: Using Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Select the "Server - FastApi + Supabase" folder as the root directory
5. Vercel will automatically detect it as a Python project

#### Option B: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to your server directory
cd "Server - FastApi + Supabase"

# Deploy
vercel --prod
```

### 3. Configure Environment Variables in Vercel
In your Vercel project dashboard:
1. Go to "Settings" → "Environment Variables"
2. Add the following variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET_KEY=your_jwt_secret_key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=https://your-frontend-domain.vercel.app
DATABASE_URL=your_supabase_database_url
SUPABASE_STORAGE_BUCKET=your_storage_bucket_name
APP_NAME=ShopZone Ecommerce API
APP_VERSION=1.0.0
```

### 4. Update Frontend API URLs
After deployment, update your frontend to use the Vercel API URL:
- Replace `http://localhost:8000` with your Vercel API URL
- Example: `https://your-api-project.vercel.app`

### 5. Test Your Deployment
- Visit `https://your-api-project.vercel.app` (should show welcome message)
- Test `/docs` endpoint for API documentation
- Test `/health` endpoint to verify database connection

### 6. CORS Configuration
Your API is configured to accept requests from:
- localhost (for development)
- *.vercel.app domains
- Your custom frontend URL (set in FRONTEND_URL env var)

## Important Notes
- Vercel functions have a 10-second timeout limit
- For long-running operations, consider using background jobs
- Static files should be served from Vercel's edge network
- Database connections are created per request (serverless)

## Troubleshooting
- Check Vercel function logs for errors
- Ensure all environment variables are set correctly
- Verify Supabase connection strings
- Check CORS settings if frontend requests fail