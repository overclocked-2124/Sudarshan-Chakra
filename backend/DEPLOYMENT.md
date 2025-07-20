# Sudarshan Chakra Backend - Render Deployment

## Deployment Steps for Render

### 1. Prepare Your Repository
- Push your backend code to GitHub
- Ensure all files are committed including package.json

### 2. Create Render Account
- Go to [render.com](https://render.com)
- Sign up with your GitHub account

### 3. Deploy on Render
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select the backend folder or root if backend is in root
4. Configure the following:

**Basic Settings:**
- Name: `sudarshan-chakra-backend`
- Environment: `Node`
- Region: Choose closest to your users
- Branch: `main`

**Build & Deploy:**
- Build Command: `npm install`
- Start Command: `npm start`

**Environment Variables:**
Add these in Render dashboard:
- `MONGODB_URI`: `mongodb+srv://snehalreddy:S0OcbrCRXJmAZrAd@sudarshan-chakra-cluste.0hokvj0.mongodb.net/radarDB`
- `NODE_ENV`: `production`

### 4. Update Frontend API URL
After deployment, update your frontend to use the Render URL:
- Your backend will be available at: `https://your-service-name.onrender.com`
- Update the API base URL in your frontend code

### 5. Update CORS Settings
Once you have your frontend deployed, update the CORS settings in server.js:
```javascript
origin: process.env.NODE_ENV === 'production' 
  ? ['https://your-frontend-domain.com'] // Replace with actual frontend URL
  : ['http://localhost:5173', 'http://localhost:3000']
```

## Testing
- Health check: `https://your-backend-url.onrender.com/api/health`
- Latest data: `https://your-backend-url.onrender.com/api/radar/latest`

## Notes
- Free tier may have cold starts (30-60 seconds delay after inactivity)
- Consider upgrading to paid tier for production use
- MongoDB Atlas connection should work automatically
