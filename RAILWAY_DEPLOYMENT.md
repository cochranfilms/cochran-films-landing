# 🚂 Deploy to Railway (Alternative to Vercel)

Since Vercel requires authentication for API endpoints, Railway is a great alternative that provides public API access.

## Quick Deploy Steps:

### 1. Go to Railway
- Visit [railway.app](https://railway.app)
- Sign up/Login with GitHub

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your repository

### 3. Railway will automatically:
- Detect it's a Node.js app
- Install dependencies
- Deploy your server
- Give you a public URL

### 4. Get Your Public URL
- Railway will provide a URL like: `https://your-app-name.railway.app`
- Your API endpoints will be:
  - `https://your-app-name.railway.app/api/preferences`
  - `https://your-app-name.railway.app/api/unsubscribes`
  - `https://your-app-name.railway.app/api/users`
  - etc.

### 5. Update Your Frontend URLs
Replace all instances of the Vercel URL with your Railway URL in:
- `preferences.html`
- `unsubscribe.html`
- `admin-dashboard.html`
- `index.html`

## Why Railway?
- ✅ **No authentication required** for API endpoints
- ✅ **Public access** to your APIs
- ✅ **Automatic HTTPS**
- ✅ **Free tier available**
- ✅ **Easy deployment**

## Alternative: Use Render
If Railway doesn't work, try [render.com](https://render.com) - they also provide public API access without authentication requirements.
