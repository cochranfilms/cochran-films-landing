# Airtable Field Mapping Documentation

This document shows the expected field structure for each portfolio category in Airtable.

## How to Use This Document

1. **For Each Category**: Check the "Expected Fields" section
2. **Field Names**: Use exact field names as shown (case-sensitive)
3. **Field Types**: Follow the type guidelines
4. **Testing**: Use `/api/airtable/field-mapper?base=BASE_ID&table=TABLE_NAME` to see actual fields

---

## 📹 Video Production

**Table Name**: `Portfolio`  
**Base ID**: `AIRTABLE_BASE_PORTFOLIO`

### Expected Fields:
- `Title` (text) - Project title
- `Description` (text) - Project description
- `Category` (text) - Should be "Video Production" or related
- `Thumbnail Image` (url/text) - Thumbnail image URL
- `playbackUrl` (url/text) - Video URL (YouTube, Vimeo, or direct)
- `UploadDate` (date/text) - Upload/creation date
- `Portfolio (Item)` (url) - Link to full portfolio item
- `Is Featured` (checkbox/boolean) - Featured flag

### Optional Fields:
- `Client/Company` (text) - Client name
- `Role` (text) - Your role in the project
- `Timeline` (text) - Project timeline
- `Tech Stack` (text) - Technologies used
- `Challenges` (text) - Project challenges
- `Results` (text) - Project results

---

## 🌐 Web Development

**Table Name**: `Web`  
**Base ID**: `AIRTABLE_BASE_WEB`

### Expected Fields:
- `Title` (text) - Project title
- `Description` (text) - Project description
- `Category` (text) - Should be "Web Development" or related
- `Thumbnail Image` (url/text) - Thumbnail image URL
- `URL` (url) - Live project URL
- `Tech Stack` (text) - Technologies used
- `Role` (text) - Your role
- `Client/Company` (text) - Client name
- `Timeline` (text) - Project timeline
- `Challenges` (text) - Project challenges
- `Results` (text) - Project results
- `Is Featured` (checkbox/boolean) - Featured flag
- `UploadDate` (date/text) - Upload date

---

## 📸 Photography

**Table Name**: `Photos`  
**Base ID**: `AIRTABLE_BASE_PHOTOS`

### Expected Fields:
- `Title` (text) - Photo title
- `Description` (text) - Photo description
- `image_url` (url/text) - Image URL
- `UploadDate` (date/text) - Upload date

### Optional Fields:
- `Category` (text) - Photo category
- `Tags` (text/array) - Photo tags

---

## 🎨 Brand Development

**Table Name**: `Brand` (or `Brand Development`, `Brands`, `Portfolio`)  
**Base ID**: `AIRTABLE_BASE_BRAND`

### Expected Fields:
- `Title` (text) - Brand/project title
- `Description` (text) - Project description
- `Thumbnail / Cover...` (url/text) - Thumbnail image URL
- `Video URLs` (url/text) - YouTube or video URL
- `Client/Brand Name` (text) - Client or brand name
- `Project URL` (url) - Live project URL
- `Services Provided` (text) - Services rendered
- `Deliverables` (text) - What was delivered
- `Industry` (text) - Industry category
- `Timeline` (text) - Project timeline
- `Results/Impact` (text) - Results or impact

### Alternative Field Names (will be checked):
- Thumbnail: `Thumbnail Image`, `Thumbnail`, `Logo URL`
- Video: `Video URL`, `playbackUrl`, `YouTube URL`
- Client: `Client/Company`, `Client`, `Brand Name`
- URL: `URL`, `Portfolio URL`, `Website URL`

---

## 🎯 Best Practices

### Field Naming:
- Use consistent naming across tables
- Avoid special characters in field names when possible
- Use descriptive names (e.g., "Client/Brand Name" not "Client")

### Data Quality:
- Always include `Title` and `Description`
- Use full URLs (not shortened) for images and videos
- For YouTube videos, use full URL or just video ID
- Dates should be in ISO format (YYYY-MM-DD) or readable format

### Testing Your Fields:
```javascript
// Test endpoint to see actual fields
fetch('/api/airtable/field-mapper?base=YOUR_BASE_ID&table=YOUR_TABLE_NAME')
  .then(r => r.json())
  .then(data => console.log('Available fields:', data.fields));
```

---

## 🔄 Field Mapping Priority

The system checks fields in this order:

1. **Primary field name** (exact match)
2. **Alternative field names** (common variations)
3. **Fallback** (empty string if not found)

This ensures flexibility if field names vary slightly.

---

## 📊 Current Display Fields

### Portfolio Cards Show:
- ✅ Title
- ✅ Description
- ✅ Category
- ✅ Thumbnail Image
- ✅ Video URL (if available)
- ✅ Project URL (if available)
- ✅ Client/Company (Brand & Web)
- ✅ Tech Stack (Web & Brand)
- ✅ Role (Web & Brand)
- ✅ Timeline (Web & Brand)
- ⚠️ Results/Impact (Brand only - needs enhancement)
- ⚠️ Challenges (Web only - needs enhancement)
- ⚠️ Services Provided (Brand only - needs enhancement)
- ⚠️ Deliverables (Brand only - needs enhancement)

### Fields NOT Currently Displayed (but available):
- Industry (Brand)
- Tags (Photography)
- Additional metadata

---

## 🚀 Enhancement Recommendations

1. **Add expandable details section** to show all fields
2. **Create category-specific layouts** for better data display
3. **Add filtering** by Industry, Tags, etc.
4. **Show multiple images** if available
5. **Display video thumbnails** with play overlay
6. **Add metadata badges** (Featured, New, etc.)

