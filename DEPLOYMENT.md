# Deployment Guide

This guide explains how to deploy the DELLTA Arbitrage Scanner to Railway and Vercel.

## Option 1: Railway (Recommended - Full Stack)

Railway is the recommended platform for this full-stack application as it supports both the Express backend and React frontend seamlessly.

### Steps:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect the configuration from `railway.json`

3. **Set Environment Variables**
   In Railway dashboard, add these variables:
   - `NODE_ENV` = `production`
   - `ODDS_API_KEY` = your API key from [the-odds-api.com](https://the-odds-api.com/)
   - `MOCK_ODDS` = `false` (set to `true` for testing without API)
   - `PORT` = Railway will set this automatically
   - `DATABASE_URL` = (optional, for future database features)

4. **Deploy**
   - Railway will automatically build and deploy
   - Your app will be available at the generated Railway URL

### Railway Configuration Files
- `railway.json` - Main configuration
- `Procfile` - Alternative start command definition
- `package.json` - Build and start scripts already configured

---

## Option 2: Vercel (Frontend Only)

**Note**: Vercel is optimized for frontend deployments. For this full-stack app, you'll need to:
1. Deploy the frontend to Vercel
2. Deploy the backend separately (Railway recommended)
3. Update the frontend to point to the backend API URL

### Frontend Deployment to Vercel:

1. **Push to GitHub** (same as above)

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will use the `vercel.json` configuration

3. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

4. **Set Environment Variables** (if needed for frontend)
   - `VITE_API_URL` = your backend URL (from Railway)
   - Note: You'll need to modify the frontend to use this environment variable

### Backend Deployment:
Deploy the backend to Railway (see Option 1) and use the Railway URL in your Vercel frontend configuration.

---

## Option 3: Railway (Split Frontend + Backend)

For advanced users who want separate deployments:

### Backend Service:
1. Create a Railway service for the backend
2. Set environment variables
3. Deploy using the main repository

### Frontend Service:
1. Create another Railway service for the frontend
2. Build command: `vite build`
3. Start command: Serve the `dist/public` directory with a static server

---

## Environment Variables Reference

### Required:
- `NODE_ENV` - Set to `production` for deployment
- `ODDS_API_KEY` - Your API key from The Odds API
- `PORT` - Server port (auto-set by platforms)

### Optional:
- `MOCK_ODDS` - Set to `true` for testing without API key
- `CACHE_TTL` - Cache timeout in seconds (default: 60)
- `DATABASE_URL` - PostgreSQL connection string (future feature)

---

## Recommended Approach

**For most users**: Deploy the entire application to Railway (Option 1)
- ✅ Simple one-click deployment
- ✅ Both frontend and backend work out of the box
- ✅ Automatic HTTPS and custom domains
- ✅ Easy environment variable management
- ✅ Auto-scaling and monitoring included

---

## Post-Deployment Checklist

- [ ] Verify the application loads correctly
- [ ] Check that API endpoints respond (`/api/odds`)
- [ ] Test the settings dialog and configure auto-refresh
- [ ] Add your Odds API key in the settings
- [ ] Verify data is loading (check for "Live" badge)
- [ ] Test the investment calculator in opportunity details
- [ ] Monitor API usage to stay within rate limits

---

## Troubleshooting

### Build Fails:
- Ensure all dependencies are in `package.json`
- Check that Node.js version is compatible (16+)
- Verify build scripts in `package.json` are correct

### App Not Loading:
- Check environment variables are set correctly
- Verify `PORT` is being read from environment
- Check logs in Railway/Vercel dashboard

### No Data Showing:
- Verify `ODDS_API_KEY` is set correctly
- Check API quota hasn't been exceeded
- Enable `MOCK_ODDS=true` to test with mock data
- Check browser console for API errors

### API Errors:
- Ensure backend URL is correct (if split deployment)
- Verify CORS settings if frontend/backend are separate
- Check that API endpoints are accessible

---

## Support

For issues with deployment:
- Railway: [railway.app/help](https://railway.app/help)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- The Odds API: [the-odds-api.com/support](https://the-odds-api.com/support)
