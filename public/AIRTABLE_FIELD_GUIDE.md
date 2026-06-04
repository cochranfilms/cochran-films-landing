# 📋 Airtable Field Mapping Guide for Cochran Films Portfolio

## 🎯 Purpose
This guide shows **exactly** what fields to use in Airtable for each portfolio category. Follow this guide to ensure all your data displays beautifully on the website.

---

## 🔍 How to Show Me Your Airtable Structure

### Method 1: Field Mapper API (Recommended)
Use this endpoint to see all available fields in your Airtable:

```
/api/airtable/field-mapper?base=YOUR_BASE_ID&table=YOUR_TABLE_NAME
```

**Example:**
```javascript
// Open browser console and run:
fetch('/api/airtable/field-mapper?base=app9HS0yNn6uyFmJF&table=Brand')
  .then(r => r.json())
  .then(data => {
    console.log('Available Fields:', data.fields);
    console.log('Sample Record:', data.sampleRecord);
  });
```

### Method 2: Screenshot Your Airtable
Take a screenshot showing:
- Table name
- Column headers (field names)
- At least one row of data

### Method 3: Export Field List
In Airtable:
1. Go to your table
2. Click "Hide fields" dropdown
3. Take screenshot showing all field names

---

## 📹 Video Production Fields

**Table:** `Portfolio`  
**Base:** `AIRTABLE_BASE_PORTFOLIO`

| Field Name | Type | Required | Display Location | Notes |
|------------|------|----------|------------------|-------|
| `Title` | Text | ✅ Yes | Card Title | Main project name |
| `Description` | Text | ✅ Yes | Card Description | Brief project description |
| `Category` | Text | ✅ Yes | Category Badge | Should be "Video Production" |
| `Thumbnail Image` | URL/Attachment | ✅ Yes | Card Thumbnail | Main image for card |
| `playbackUrl` | URL | ⚠️ If video | Video Popup | YouTube/Vimeo/direct video URL |
| `Portfolio (Item)` | URL | ❌ No | External Link | Link to full portfolio |
| `Client/Company` | Text | ❌ No | Metadata Grid | Client name |
| `Role` | Text | ❌ No | Metadata Grid | Your role (e.g., "Director", "Producer") |
| `Timeline` | Text | ❌ No | Metadata Grid | Project duration |
| `Tech Stack` | Text | ❌ No | Expandable Details | Technologies used |
| `Challenges` | Long Text | ❌ No | Expandable Details | Project challenges |
| `Results` | Long Text | ❌ No | Expandable Details | Project results |
| `Is Featured` | Checkbox | ❌ No | Featured Badge | Shows "Featured" badge |
| `UploadDate` | Date | ❌ No | Metadata | Upload/creation date |

---

## 🌐 Web Development Fields

**Table:** `Web`  
**Base:** `AIRTABLE_BASE_WEB`

| Field Name | Type | Required | Display Location | Notes |
|------------|------|----------|------------------|-------|
| `Title` | Text | ✅ Yes | Card Title | Project name |
| `Description` | Text | ✅ Yes | Card Description | Project description |
| `Category` | Text | ✅ Yes | Category Badge | Should be "Web Development" |
| `Thumbnail Image` | URL/Attachment | ✅ Yes | Card Thumbnail | Screenshot/image |
| `URL` | URL | ⚠️ If live | External Link | Live project URL |
| `Tech Stack` | Text | ❌ No | Tech Tags | Comma-separated (e.g., "React, Node.js, MongoDB") |
| `Role` | Text | ❌ No | Metadata Grid | Your role |
| `Client/Company` | Text | ❌ No | Metadata Grid | Client name |
| `Timeline` | Text | ❌ No | Metadata Grid | Project timeline |
| `Challenges` | Long Text | ❌ No | Expandable Details | Challenges faced |
| `Results` | Long Text | ❌ No | Expandable Details | Project results |
| `Is Featured` | Checkbox | ❌ No | Featured Badge | Featured flag |
| `UploadDate` | Date | ❌ No | Metadata | Upload date |

---

## 🎨 Brand Development Fields

**Table:** `Brand` (or `Brand Development`, `Brands`)  
**Base:** `AIRTABLE_BASE_BRAND`

| Field Name | Type | Required | Display Location | Notes |
|------------|------|----------|------------------|-------|
| `Title` | Text | ✅ Yes | Card Title | Brand/project name |
| `Description` | Text | ✅ Yes | Card Description | Project description |
| `Thumbnail / Cover...` | URL/Attachment | ✅ Yes | Card Thumbnail | Main image |
| `Video URLs` | URL | ❌ No | Video Badge + Popup | YouTube/Vimeo URL |
| `Client/Brand Name` | Text | ❌ No | Metadata Grid | Client or brand name |
| `Project URL` | URL | ❌ No | External Link | Live project URL |
| `Services Provided` | Text | ❌ No | Expandable Details | Services list (use dashes or bullets) |
| `Deliverables` | Text | ❌ No | Expandable Details | What was delivered |
| `Industry` | Text | ❌ No | Industry Badge | Industry category |
| `Timeline` | Text | ❌ No | Metadata Grid | Project timeline |
| `Results/Impact` | Long Text | ❌ No | Expandable Details | Results or impact |
| `Tech Stack` | Text | ❌ No | Tech Tags | Technologies (comma-separated) |
| `Role` | Text | ❌ No | Metadata Grid | Your role |
| `Is Featured` | Checkbox | ❌ No | Featured Badge | Featured flag |
| `UploadDate` | Date | ❌ No | Metadata | Upload date |

### Alternative Field Names (Auto-detected):
- **Thumbnail:** `Thumbnail Image`, `Thumbnail`, `Logo URL`
- **Video:** `Video URL`, `playbackUrl`, `YouTube URL`
- **Client:** `Client/Company`, `Client`, `Brand Name`
- **URL:** `URL`, `Portfolio URL`, `Website URL`
- **Results:** `Results`, `Impact`

---

## 📸 Photography Fields

**Table:** `Photos`  
**Base:** `AIRTABLE_BASE_PHOTOS`

| Field Name | Type | Required | Display Location | Notes |
|------------|------|----------|------------------|-------|
| `Title` | Text | ✅ Yes | Card Title | Photo title |
| `Description` | Text | ❌ No | Card Description | Photo description |
| `image_url` | URL/Attachment | ✅ Yes | Card Image | Photo URL |
| `Category` | Text | ❌ No | Category Badge | Photo category |
| `UploadDate` | Date | ❌ No | Metadata | Upload date |

---

## 🎨 Enhanced Display Features

### What Gets Displayed:

#### **Always Visible:**
- ✅ Title
- ✅ Description
- ✅ Category badge
- ✅ Thumbnail image
- ✅ Video badge (if video exists)
- ✅ Featured badge (if featured)
- ✅ Industry badge (Brand only)
- ✅ Metadata grid (Client, Industry, Timeline, Role)

#### **Expandable Details (Click "View Full Details"):**
- 📋 Services Provided (as bullet list)
- 📦 Deliverables
- 💻 Tech Stack (as tags)
- 📊 Results & Impact
- 💡 Challenges

#### **Action Buttons:**
- ▶️ Watch Video (if video URL exists)
- 🔗 View Project (if project URL exists)
- 🔍 View Image (if image only)

---

## 💡 Best Practices

### Field Naming:
1. **Use exact field names** from this guide
2. **Case-sensitive** - match capitalization exactly
3. **No trailing spaces** in field names
4. **Use consistent naming** across tables

### Data Quality:
1. **Always fill Title and Description** - these are required
2. **Use full URLs** - not shortened links
3. **For YouTube videos:**
   - Full URL: `https://www.youtube.com/watch?v=VIDEO_ID`
   - Short URL: `https://youtu.be/VIDEO_ID`
   - Both work!
4. **For Services Provided:**
   - Use dashes: `- Service 1\n- Service 2`
   - Or bullets: `• Service 1\n• Service 2`
   - Or commas: `Service 1, Service 2`
5. **For Tech Stack:**
   - Comma-separated: `React, Node.js, MongoDB`
   - Will display as tags

### Testing:
1. Use the field mapper API to verify fields
2. Check browser console for field mapping errors
3. Test with one record first, then add more

---

## 🚀 Quick Setup Checklist

### For Brand Development:
- [ ] Table name is `Brand` (or one of the alternatives)
- [ ] `Title` field exists
- [ ] `Description` field exists
- [ ] `Thumbnail / Cover...` field exists
- [ ] `Client/Brand Name` field exists
- [ ] `Video URLs` field exists (if you have videos)
- [ ] `Project URL` field exists (if you have live projects)
- [ ] `Services Provided` field exists (optional but recommended)
- [ ] `Deliverables` field exists (optional but recommended)
- [ ] `Industry` field exists (optional but recommended)
- [ ] `Results/Impact` field exists (optional but recommended)

### For Video Production:
- [ ] Table name is `Portfolio`
- [ ] `Title` field exists
- [ ] `Description` field exists
- [ ] `Category` field exists (set to "Video Production")
- [ ] `Thumbnail Image` field exists
- [ ] `playbackUrl` field exists (if you have videos)

### For Web Development:
- [ ] Table name is `Web`
- [ ] `Title` field exists
- [ ] `Description` field exists
- [ ] `Category` field exists (set to "Web Development")
- [ ] `Thumbnail Image` field exists
- [ ] `URL` field exists (if you have live projects)
- [ ] `Tech Stack` field exists (optional but recommended)

---

## 🔧 Troubleshooting

### Fields Not Showing?
1. Check field names match exactly (case-sensitive)
2. Use field mapper API to see actual field names
3. Check browser console for errors

### Videos Not Playing?
1. Ensure `Video URLs` or `playbackUrl` field has full YouTube URL
2. Check URL format (youtube.com/watch?v= or youtu.be/)
3. Verify video is public/unlisted

### Images Not Loading?
1. Check `Thumbnail Image` or `Thumbnail / Cover...` field
2. Ensure URLs are full (not relative)
3. Check image URLs are accessible

### Expandable Details Not Working?
1. Ensure you have data in: Services, Deliverables, Results, Tech Stack, or Challenges
2. Check browser console for JavaScript errors
3. Verify CSS file `portfolio-enhanced.css` is loaded

---

## 📞 Need Help?

1. **Use Field Mapper:** `/api/airtable/field-mapper?base=BASE_ID&table=TABLE_NAME`
2. **Check Console:** Browser console shows field mapping
3. **Screenshot:** Share Airtable screenshot showing field names

---

## ✨ What Makes This Portfolio Stand Out

1. **Comprehensive Data Display** - Shows ALL your Airtable fields
2. **Expandable Details** - Clean card with expandable full details
3. **Smart Field Detection** - Automatically finds fields even if names vary
4. **Beautiful UI** - Premium 2026 design with glassmorphism
5. **Interactive Elements** - Videos, links, images all clickable
6. **Metadata Grid** - Key info at a glance
7. **Tech Tags** - Visual tech stack display
8. **Featured Badges** - Highlight your best work
9. **Industry Badges** - Show industry categories
10. **Action Buttons** - Clear CTAs for videos/projects

This portfolio showcases EVERYTHING from your Airtable - nothing gets hidden!

