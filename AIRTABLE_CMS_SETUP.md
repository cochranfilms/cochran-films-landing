# Airtable CMS Integration Setup Guide

## Overview
This integration replaces the hardcoded CSV system with a dynamic Airtable CMS that allows you to update your portfolio content directly from the Airtable dashboard. The styling, layout, and functionality remain exactly the same - only the data source changes.

## What's Been Added

### 1. New JavaScript File
- `js/airtable-cms.js` - Main Airtable integration logic

### 2. Vercel API Routes
- `api/airtable/video-production.js` - Fetches Video Production data
- `api/airtable/web-development.js` - Fetches Web Development data  
- `api/airtable/photography.js` - Fetches Photography data

### 3. Updated HTML
- `index2.html` now includes the Airtable CMS script
- Old CSV loading system is disabled (commented out)

## Setup Steps

### Step 1: Get Your Airtable API Key
1. Go to [Airtable.com](https://airtable.com) and sign in
2. Click on your account icon → "Account"
3. Go to "API" section
4. Generate a new API key
5. Copy the API key

### Step 2: Set Vercel Environment Variables
1. Go to your Vercel dashboard
2. Select your `cochran-films-landing` project
3. Go to "Settings" → "Environment Variables"
4. Add a new variable:
   - **Name**: `AIRTABLE_API_KEY`
   - **Value**: Your Airtable API key
   - **Environment**: Production (and Preview if you want)
5. Click "Save"

### Step 3: Verify Your Airtable Base Structure
Your Airtable bases should have these field names (or similar):

#### Video Production Base (appjQxcRoClnZzghj)
- **Table Name**: `Portfolio`
- **Fields**:
  - `Title` (or `Name`, `Project Name`)
  - `Description` (or `Summary`, `Project Description`)
  - `Category` (or `Type`)
  - `Thumbnail Image` (or `Image`, `Thumbnail`)
  - `Is Featured` (or `Featured`)
  - `Video URL` (or `Playback URL`, `URL`)
  - `Created Date` (or `Upload Date`, `Date`)

#### Web Development Base (appV5l9kZ5vAxcz4e)
- **Table Name**: `Web`
- **Fields**:
  - `Title` (or `Name`, `Project Name`)
  - `Description` (or `Summary`, `Project Description`)
  - `Category` (or `Type`)
  - `Thumbnail Image` (or `Image`, `Thumbnail`)
  - `Is Featured` (or `Featured`)
  - `Website URL` (or `URL`, `Link`)
  - `Tech Stack` (or `Technology`, `Tools`)
  - `Role` (or `Position`, `My Role`)
  - `Client` (or `Client Name`, `Company`)
  - `Timeline` (or `Duration`, `Project Timeline`)
  - `Created Date` (or `Upload Date`, `Date`)

#### Photography Base (appP1uFoRWjxPkQ5b)
- **Table Name**: `Photos`
- **Fields**:
  - `Title` (or `Name`, `Photo Name`)
  - `Description` (or `Caption`)
  - `Category` (or `Type`)
  - `Thumbnail Image` (or `Image`, `Photo URL`)
  - `Is Featured` (or `Featured`)
  - `Created Date` (or `Upload Date`, `Date`)

### Step 4: Deploy to Vercel
1. Commit and push your changes to GitHub
2. Vercel will automatically deploy
3. Check the deployment logs for any errors

### Step 5: Test the Integration
1. Visit your deployed site
2. Open browser developer tools (F12)
3. Check the console for Airtable CMS initialization messages
4. Navigate to the Portfolio section
5. Verify that data is loading from Airtable

## How It Works

### Data Flow
1. **User visits portfolio page** → Airtable CMS initializes
2. **CMS fetches data** → Calls Vercel API routes
3. **API routes call Airtable** → Using your API key
4. **Data transforms** → Maps Airtable fields to portfolio structure
5. **Portfolio renders** → Same styling, same layout, dynamic data

### Fallback System
- If Airtable fails, the system will fall back to the existing CSV system
- This ensures your site always works, even if there are API issues

## Troubleshooting

### Common Issues

#### 1. "AIRTABLE_API_KEY environment variable not set"
- **Solution**: Check your Vercel environment variables
- Make sure the variable name is exactly `AIRTABLE_API_KEY`
- Redeploy after adding the variable

#### 2. "Airtable API error: 401 Unauthorized"
- **Solution**: Check your API key
- Make sure the key has access to all three bases
- Verify the key hasn't expired

#### 3. "Airtable API error: 404 Not Found"
- **Solution**: Check your base IDs and table names
- Verify the bases exist and are accessible
- Check that the table names match exactly

#### 4. Portfolio not loading
- **Solution**: Check browser console for errors
- Verify the API routes are working
- Check Vercel function logs

### Debug Mode
The Airtable CMS includes extensive logging. Check your browser console for:
- 🚀 Initialization messages
- 📊 Data loading progress
- 🎨 Portfolio rendering details
- ❌ Any error messages

## Updating Content

### Adding New Portfolio Items
1. Go to your Airtable dashboard
2. Navigate to the appropriate base (Video, Web, or Photo)
3. Add a new row with the required fields
4. Save the row
5. Refresh your website - the new item will appear automatically

### Editing Existing Items
1. Find the item in Airtable
2. Edit any field
3. Save the changes
4. Refresh your website - changes appear immediately

### Featured Items
- Set the `Is Featured` field to `true` in Airtable
- The item will automatically show a featured badge on your site

## Performance Notes

- **Caching**: Data is fetched fresh on each page load
- **Image Optimization**: Thumbnails are loaded with lazy loading
- **Fallback Images**: If Airtable images fail, Unsplash fallbacks are used
- **Error Handling**: Graceful fallbacks ensure the site always works

## Security

- **API Key**: Stored securely in Vercel environment variables
- **No Client Exposure**: API key never appears in frontend code
- **Rate Limiting**: Airtable handles API rate limits
- **Access Control**: Only your API key can access your bases

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Vercel environment variables
3. Test your Airtable API key manually
4. Check Vercel function logs for API errors

The integration is designed to be robust and will automatically fall back to CSV if needed, ensuring your site always works.
