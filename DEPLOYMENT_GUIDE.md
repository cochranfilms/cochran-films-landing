# 🚀 Deployment Guide for Node.js Server

## Quick Deploy Options

### Option 1: Deploy to Vercel (Recommended - Easiest)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Link to existing project or create new
   - Set project name (e.g., "cochran-films-api")
   - Confirm deployment

4. **Your API will be available at:**
   - `https://your-project.vercel.app/api/preferences`
   - `https://your-project.vercel.app/api/unsubscribes`
   - etc.

### Option 2: Deploy to Railway

1. **Go to [railway.app](https://railway.app)**
2. **Sign up/Login with GitHub**
3. **Click "New Project" → "Deploy from GitHub repo"**
4. **Select your repository**
5. **Railway will automatically detect Node.js and deploy**

### Option 3: Deploy to Render

1. **Go to [render.com](https://render.com)**
2. **Sign up/Login**
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repo**
5. **Set build command: `npm install`**
6. **Set start command: `npm start`**

## Environment Variables

Set these in your hosting platform:

```bash
PORT=3001
NODE_ENV=production
```

## Database Files

The server creates these JSON files automatically:
- `users.json` - User data
- `unsubscribes.json` - Unsubscribe list
- `preferences.json` - User preferences

## Update Your Frontend URLs

After deployment, update these files to use your new API URL:

1. **preferences.html** - Update fetch URL
2. **unsubscribe.html** - Update fetch URL
3. **admin-dashboard.html** - Update fetch URL

## Testing Your Deployed API

Test your endpoints:
```bash
# Test preferences endpoint
curl https://your-domain.com/api/preferences

# Test unsubscribe endpoint
curl -X POST https://your-domain.com/api/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","token":"test123"}'
```

## Troubleshooting

- **405 Method Not Allowed**: Check if your hosting supports POST requests
- **404 Not Found**: Ensure routes are properly configured
- **CORS Issues**: The server already includes CORS middleware

## Support

If you encounter issues:
1. Check the hosting platform's logs
2. Verify environment variables are set
3. Ensure all dependencies are in package.json
