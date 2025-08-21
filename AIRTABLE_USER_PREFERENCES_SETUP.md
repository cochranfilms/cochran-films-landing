# Airtable User Preferences Setup Guide

This guide will help you set up the functional opt-in/opt-out system using your Airtable base for SMS compliance.

## 🗄️ **Airtable Base Setup**

### **1. Create User Preferences Table**
In your Airtable base `appXjhRWId71m6xGe`, create a new table called **"User Preferences"** with the following fields:

| Field Name | Field Type | Description | Required |
|------------|------------|-------------|----------|
| `Email` | Email | User's email address (Primary Key) | ✅ Yes |
| `Name` | Single line text | User's full name | ❌ No |
| `Phone` | Phone number | User's mobile number | ❌ No |
| `Opt Email` | Checkbox | Email communication preference | ❌ No |
| `Opt Calls` | Checkbox | Phone call preference | ❌ No |
| `Opt Texts` | Checkbox | Text message preference | ❌ No |
| `SMS Consent` | Single select | SMS consent: "yes" or "no" | ❌ No |
| `Source Form` | Single line text | Which form was submitted | ❌ No |
| `Status` | Single select | User status: "active", "unsubscribed", "bounced" | ❌ No |
| `Submitted At` | Date | When preferences were first submitted | ❌ No |
| `Last Updated` | Date | Last modification timestamp | ❌ No |

### **2. Field Options for Status**
- `active` - User is subscribed and active
- `unsubscribed` - User has opted out
- `bounced` - Email bounces or invalid

### **3. Field Options for SMS Consent**
- `yes` - User agreed to receive texts
- `no` - User declined text messages

## 🔑 **Environment Variables**

### **Vercel Deployment**
Add this environment variable to your Vercel project:

```bash
AIRTABLE_API_KEY=your_airtable_api_key_here
```

### **Local Development**
Create a `.env.local` file in your project root:

```bash
AIRTABLE_API_KEY=your_airtable_api_key_here
```

## 📋 **How to Get Your Airtable API Key**

1. Go to [airtable.com/account](https://airtable.com/account)
2. Click on **"API"** in the left sidebar
3. Click **"Generate API key"**
4. Copy the generated key
5. Add it to your environment variables

## 🚀 **Deployment Steps**

### **1. Deploy API Endpoint**
The `api/user-preferences.js` file will automatically be deployed as a Vercel serverless function.

### **2. Update Your Forms**
The forms in `index2.html` and `forms-hub.html` will automatically:
- Capture user preferences
- Save to Airtable
- Store locally as backup
- Enforce opt-in/opt-out settings

### **3. Test the Integration**
1. Submit a form with preferences
2. Check your Airtable base for new records
3. Verify the data is being saved correctly

## 🔧 **API Endpoints**

### **Create/Update Preferences**
```http
POST /api/user-preferences
Content-Type: application/json

{
  "baseId": "appXjhRWId71m6xGe",
  "tableName": "User Preferences",
  "preferences": {
    "email": "user@example.com",
    "name": "John Doe",
    "opt_email": true,
    "opt_calls": false,
    "opt_texts": true,
    "sms_consent": "yes"
  }
}
```

### **Get User Preferences**
```http
GET /api/user-preferences?baseId=appXjhRWId71m6xGe&tableName=User%20Preferences&email=user@example.com
```

### **Update Preferences**
```http
PATCH /api/user-preferences
Content-Type: application/json

{
  "baseId": "appXjhRWId71m6xGe",
  "tableName": "User Preferences",
  "email": "user@example.com",
  "updates": {
    "opt_email": false,
    "status": "unsubscribed"
  }
}
```

### **Get Active Subscribers**
```http
GET /api/user-preferences?baseId=appXjhRWId71m6xGe&tableName=User%20Preferences&type=email
```

## 📱 **Usage Examples**

### **Check if User Should Receive Emails**
```javascript
const shouldEmail = await preferencesManager.shouldReceiveCommunication('user@example.com', 'email');
if (shouldEmail) {
  // Send email
}
```

### **Unsubscribe User**
```javascript
await preferencesManager.unsubscribe('user@example.com');
```

### **Get All Email Subscribers**
```javascript
const emailSubscribers = await preferencesManager.getActiveSubscribers('email');
```

## 🛡️ **SMS Compliance Features**

### **What's Automatically Handled**
- ✅ Explicit SMS consent capture
- ✅ Opt-in/opt-out preference storage
- ✅ Communication type preferences
- ✅ Unsubscribe functionality
- ✅ Preference enforcement
- ✅ Audit trail (timestamps)

### **Compliance Requirements Met**
- ✅ STOP instructions in emails
- ✅ HELP instructions in emails
- ✅ Message frequency disclosure
- ✅ Message and data rates disclosure
- ✅ Privacy policy links
- ✅ Opt-out mechanisms

## 🔍 **Troubleshooting**

### **Common Issues**

1. **"Airtable API key not configured"**
   - Check your environment variables
   - Ensure `AIRTABLE_API_KEY` is set

2. **"User not found"**
   - Verify the email exists in your Airtable base
   - Check field names match exactly

3. **"Failed to create preferences"**
   - Verify Airtable permissions
   - Check field types match your schema

### **Debug Mode**
Enable console logging by checking the browser console for:
- 🚀 Initialization messages
- ✅ Success confirmations
- ❌ Error details

## 📊 **Monitoring & Analytics**

### **Airtable Views to Create**
1. **Active Subscribers** - Filter: `{Status} = 'active'`
2. **Email Opt-ins** - Filter: `{Opt Email} = 1`
3. **SMS Opt-ins** - Filter: `{Opt Texts} = 1 AND {SMS Consent} = 'yes'`
4. **Recent Submissions** - Sort by: `Submitted At` (descending)

### **Key Metrics to Track**
- Total subscribers
- Opt-in rates by communication type
- Unsubscribe rates
- Form submission sources
- SMS consent rates

## 🎯 **Next Steps**

1. **Set up your Airtable base** with the fields above
2. **Deploy to Vercel** with your API key
3. **Test the forms** to ensure data is being saved
4. **Create Airtable views** for monitoring
5. **Integrate with email marketing tools** using the API endpoints

## 📞 **Support**

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Airtable field names match exactly
3. Ensure your API key has proper permissions
4. Check the Vercel function logs for API errors

---

**Your SMS compliance system is now fully functional!** Users can opt-in/opt-out, and you can enforce their preferences across all communications.
