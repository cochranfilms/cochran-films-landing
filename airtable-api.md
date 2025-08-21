# Airtable API Integration Guide for Cochran Films

## Overview
This document outlines the complete process for integrating Airtable with your Vercel-deployed application, including API key management, table name configuration, and troubleshooting common issues.

## The Problem We Solved
The original implementation was failing with **403 Forbidden** errors because of a critical mismatch between the table names in your code and the actual table names in Airtable.

### Root Cause
Your Airtable bases all have tables named **"Imported table"** (which is Airtable's default name when importing CSV data), but your API routes were looking for specific names:
- ❌ `"Portfolio"` (Video Production)
- ❌ `"Web"` (Web Development)  
- ❌ `"Photos"` (Photography)

## Complete Setup Process

### 1. Airtable Personal Access Token (PAT) Setup

#### Create PAT in Airtable
1. Go to [Airtable Account Settings](https://airtable.com/account)
2. Navigate to **Personal Access Tokens**
3. Click **Create new token**
4. **Name**: `Vercel – Portfolio CMS` (or your preferred name)
5. **Scopes**: 
   - `data.records: read` - See the data in records
   - `schema.bases: read` - See the structure of a base
6. **Access**: Grant access to your specific bases:
   - Portfolio (Video Production)
   - Web (Web Development)
   - Photos (Photography)
7. Click **Save changes**

#### Copy the PAT
- The token will start with `patb...`
- Copy the entire token (it's only shown once)

### 2. Vercel Environment Variables

#### Set Environment Variable
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`cochran-films-landing`)
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `AIRTABLE_API_KEY`
   - **Value**: Your PAT token (e.g., `patbHKeHNkbE1ANHR.f92ad6cbd42d5a35bf7cc9bce5494c830016b8b62cb4655e16137a0f4d39e2e2`)
   - **Environment**: Production (and Preview if desired)
5. Click **Save**

#### Alternative: Vercel CLI
```bash
vercel env add AIRTABLE_API_KEY
# Enter your PAT when prompted
# Select Production environment
```

### 3. API Route Configuration

#### File Structure
```
api/
├── airtable/
│   ├── video-production.js
│   ├── web-development.js
│   └── photography.js
```

#### Base IDs and Table Names
```javascript
// Video Production
const baseId = 'appjQxcRoClnZzghj';
const tableName = 'Imported table';  // ← This was the key fix!

// Web Development  
const baseId = 'appV5l9kZ5vAxcz4e';
const tableName = 'Imported table';  // ← This was the key fix!

// Photography
const baseId = 'appP1uFoRWjxPkQ5b';
const tableName = 'Imported table';  // ← This was the key fix!
```

#### Environment Variable Access
```javascript
// Get Airtable API key from environment variables
const apiKey = process.env.AIRTABLE_API_KEY_VIDEO || 
               process.env.AIRTABLE_API_KEY || 
               process.env.AIRTABLE_TOKEN;

if (!apiKey) {
  return res.status(500).json({ 
    error: 'Airtable API key not configured',
    message: 'Please check your Vercel environment variables'
  });
}
```

### 4. Frontend JavaScript Configuration

#### Airtable CMS Configuration
```javascript
// js/airtable-cms.js
this.tables = {
  'Video Production': 'Imported table',    // ← Must match Airtable exactly
  'Web Development': 'Imported table',     // ← Must match Airtable exactly  
  'Photography': 'Imported table'          // ← Must match Airtable exactly
};
```

#### API Base URL
```javascript
// Set API base for Airtable proxy to the same origin
window.API_BASE_URL = window.location.origin;
```

## Critical Configuration Points

### 1. Table Names Must Match Exactly
- **Never assume** table names based on CSV filenames
- **Always verify** actual table names in Airtable
- Use the **exact string** as it appears in Airtable

### 2. Environment Variable Naming
- Use `AIRTABLE_API_KEY` as the primary variable name
- The API routes will automatically detect and use this variable
- No need for base-specific variables unless you have different PATs per base

### 3. Base ID Verification
- Base IDs are visible in Airtable URLs
- Format: `https://airtable.com/appXXXXXXXXXXXXXX`
- The `appXXXXXXXXXXXXXX` part is your base ID

## Troubleshooting Guide

### 403 Forbidden Errors
**Symptoms**: API endpoints return 403 with "Invalid permissions, or the requested model was not found"

**Common Causes**:
1. **Wrong table name** (most common)
2. **Missing environment variable**
3. **Invalid PAT token**
4. **PAT doesn't have access to the base**

**Debugging Steps**:
1. Verify table names in Airtable
2. Check environment variables in Vercel
3. Test PAT permissions
4. Use the test script to discover actual table names

### Test Script for Table Discovery
```javascript
// test-airtable-tables.js
const fetch = require('node-fetch');

async function testAirtableTables() {
  const bases = {
    'Video Production': 'appjQxcRoClnZzghj',
    'Web Development': 'appV5l9kZ5vAxcz4e', 
    'Photography': 'appP1uFoRWjxPkQ5b'
  };

  const apiKey = process.env.AIRTABLE_API_KEY;
  
  for (const [category, baseId] of Object.entries(bases)) {
    // Test schema access
    const schemaResponse = await fetch(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (schemaResponse.ok) {
      const schemaData = await schemaResponse.json();
      console.log(`✅ ${category}: Found ${schemaData.tables?.length || 0} tables`);
      schemaData.tables?.forEach(table => {
        console.log(`   📋 ${table.name} (ID: ${table.id})`);
      });
    }
  }
}
```

## Deployment Checklist

### Before Deploying
- [ ] PAT token created with correct scopes
- [ ] Environment variable set in Vercel
- [ ] Table names verified in Airtable
- [ ] Base IDs confirmed
- [ ] API routes updated with correct table names

### After Deploying
- [ ] Test all three API endpoints
- [ ] Verify data is loading in frontend
- [ ] Check browser console for errors
- [ ] Confirm portfolio items are displaying

## Security Best Practices

### 1. PAT Token Security
- **Never commit** PAT tokens to Git
- Use environment variables exclusively
- Rotate tokens periodically
- Limit token scopes to minimum required

### 2. Base Access Control
- Only grant access to bases you need
- Use separate PATs for different environments if needed
- Monitor token usage in Airtable

### 3. API Endpoint Security
- CORS headers configured for production
- Rate limiting considerations
- Error messages don't expose sensitive information

## Common Pitfalls

### 1. Table Name Assumptions
- **Don't assume** `"Portfolio"` based on CSV filename
- **Don't assume** `"Web"` based on base purpose
- **Always verify** actual table names in Airtable

### 2. Environment Variable Issues
- Variables must be set in Vercel, not just locally
- Variable names are case-sensitive
- Redeployment required after environment variable changes

### 3. Base ID Confusion
- Base IDs are different from table IDs
- Base IDs are in the URL: `appXXXXXXXXXXXXXX`
- Table IDs are internal Airtable identifiers

## Success Indicators

When everything is working correctly, you should see:
- ✅ API endpoints return 200 status
- ✅ JSON data with `records` array
- ✅ Portfolio items loading in frontend
- ✅ No 403 errors in browser console
- ✅ Airtable CMS initialization success

## Support Resources

- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Personal Access Tokens Guide](https://airtable.com/developers/web/api/personal-access-tokens)

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: ✅ Working Solution Documented
