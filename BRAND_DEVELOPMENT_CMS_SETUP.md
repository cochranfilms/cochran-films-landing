# Brand Development CMS Integration

This document explains how the Brand Development collection from Airtable has been integrated into your website's CMS system.

## Overview

Your Brand Development collection from Airtable (Base ID: `app9HS0yNn6uyFmJF`, Table: `Brand`) is now fully integrated into your website's portfolio system alongside Video Production, Web Development, and Photography.

## What Was Added

### 1. API Endpoint
- **File**: `api/airtable/brand-development.js`
- **Route**: `/api/airtable/brand-development`
- **Purpose**: Fetches brand development data from your Airtable base

### 2. Updated Unified Portfolio API
- **File**: `api/airtable/portfolio.js`
- **Changes**: Added Brand Development to the unified portfolio endpoint
- **Benefit**: Single API call now returns all four categories

### 3. Enhanced Airtable CMS JavaScript
- **File**: `js/airtable-cms.js`
- **Changes**: 
  - Added Brand Development base configuration
  - Updated cache TTL settings (60 minutes for brand assets)
  - Enhanced portfolio rendering for brand items
  - Added brand-specific click handlers

### 4. Updated HTML
- **File**: `index2.html`
- **Changes**:
  - Added Airtable CMS initialization script
  - Enhanced CSS styling for brand development items
  - Portfolio section already had the brand development grid

## How It Works

### Data Flow
1. **Airtable** → Your Brand Development base (`app9HS0yNn6uyFmJF`)
2. **API Endpoint** → `/api/airtable/brand-development` fetches data
3. **Unified API** → `/api/airtable/portfolio` combines all categories
4. **Frontend** → Airtable CMS renders items in the `brandDevelopmentGrid`

### Field Mapping
The system automatically maps these Airtable fields:
- `Title` → Portfolio item title
- `Description` → Project description
- `Category` → Project category/type
- `Image` or `Thumbnail` → Thumbnail image
- `URL` or `Link` → External link (if available)
- `Client` → Client name
- `Role` → Your role in the project
- `Tech Stack` → Tools/technologies used
- `Is Featured` → Featured project flag
- `Created Date` → Upload/project date

### Rendering Features
- **Brand-specific styling** with gold accents
- **Interactive elements** (external link icon or view icon)
- **Rich metadata display** (client, role, tools)
- **Responsive design** matching other portfolio categories
- **Click handlers** for external links or image viewing

## Environment Setup

### Required Environment Variables
```bash
# Add to your Vercel project environment variables
AIRTABLE_API_KEY=your_global_airtable_api_key_here
```

### API Key Permissions
Your Airtable API key must have access to:
- Base ID: `app9HS0yNn6uyFmJF`
- Table: `Brand`
- Read permissions for all fields

## Testing

### Test the API Endpoint
```bash
# Run the test script
node test-brand-api.js
```

### Expected Response
```json
{
  "success": true,
  "category": "Brand Development",
  "recordCount": 5,
  "fetchTime": "150ms",
  "data": {
    "records": [...]
  }
}
```

## Troubleshooting

### Common Issues

1. **API Key Not Set**
   - Error: "AIRTABLE_API_KEY environment variable not set"
   - Solution: Set the environment variable in Vercel

2. **Permission Denied**
   - Error: "HTTP 403: Forbidden"
   - Solution: Check API key permissions for the Brand Development base

3. **Base Not Found**
   - Error: "HTTP 404: Not Found"
   - Solution: Verify the base ID and table name

4. **No Data Displayed**
   - Check browser console for errors
   - Verify the `brandDevelopmentGrid` element exists
   - Check if Airtable CMS is properly initialized

### Debug Commands
```javascript
// In browser console
console.log('Airtable CMS:', window.airtableCMS);
console.log('Portfolio data:', window.airtableCMS?.portfolioData);
console.log('Cache status:', window.airtableCMS?.getCacheStatus());
```

## Performance Features

### Caching
- **TTL**: 60 minutes for brand development items
- **Storage**: Local browser storage with automatic cleanup
- **Fallback**: Serves stale cache if API fails

### Optimization
- **Unified API**: Single request for all portfolio data
- **Lazy loading**: Images load only when visible
- **Background refresh**: Cache warms up in background

## Customization

### Styling
Brand development items use these CSS classes:
- `.portfolio-item.brand-development` - Main container
- `.portfolio-brand-details` - Metadata section
- Custom gold color scheme (`rgba(255,178,0,...)`)

### Adding New Fields
To display additional Airtable fields:
1. Update the `transformAirtableData` function in `js/airtable-cms.js`
2. Modify the `createPortfolioItem` function
3. Add corresponding CSS styling

## Next Steps

1. **Set Environment Variable**: Add `AIRTABLE_API_KEY` to Vercel
2. **Test Integration**: Run the test script
3. **Add Content**: Populate your Brand Development Airtable base
4. **Customize**: Adjust styling and field mappings as needed

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Airtable API key and permissions
3. Test the API endpoint directly
4. Check the cache status and performance metrics

The integration is designed to be robust with fallbacks and graceful degradation, so your site will continue to work even if there are temporary Airtable API issues.
