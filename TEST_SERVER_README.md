# 🧪 Cochran Films Test Server

This test server allows you to test your EmailJS email functionality multiple times with a specific test email address, while maintaining normal duplicate prevention for other users.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Test Server
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### 3. Access the Test Interface
Open your browser and go to: `http://localhost:3000`

## 📧 Test Mode Features

### **Test Email Configuration**
- **Test Email**: `codylcochran89@gmail.com`
- **Test Mode**: Enabled by default
- **Multiple Submissions**: Allowed for test email only

### **How It Works**
1. **Normal Users**: Standard duplicate prevention applies
2. **Test Email**: Can submit multiple times (for testing purposes)
3. **Reset Function**: Clear test email restrictions when needed

## 🎯 Testing Workflow

### **Step 1: Submit Form**
1. Fill out the form with `codylcochran89@gmail.com`
2. Click "Send Toolkit"
3. Email will be sent via EmailJS
4. Success message appears

### **Step 2: Reset Test Email**
1. Click "Reset Test Email" button
2. Test email restrictions are cleared
3. You can submit again with the same email

### **Step 3: Repeat Testing**
- Submit form again
- Test different form data
- Verify email delivery
- Check email template rendering

## 🔧 Configuration

### **Test Server Settings** (`test-server.js`)
```javascript
const TEST_EMAIL = 'codylcochran89@gmail.com';
const TEST_MODE = true; // Set to false to disable test mode
const PORT = process.env.PORT || 3000;
```

### **EmailJS Configuration** (`test-index.html`)
```javascript
const SERVICE_ID = 'service_t11yvru';
const TEMPLATE_ID = 'template_by61n6o';
const KEY = 'p4pF3OWvh-DXtae4c';
```

## 📁 Files Overview

- **`test-server.js`** - Express server with test endpoints
- **`test-index.html`** - Test interface with form and controls
- **`package.json`** - Dependencies and scripts
- **`emailjs-template.html`** - Your redesigned email template

## 🌐 API Endpoints

### **Health Check**
```
GET /health
```
Returns server status and test mode information.

### **Test Status**
```
GET /test/status/:email
```
Check if an email address is in test mode.

### **Reset Test Email**
```
GET /test/reset/:email
```
Clear test email restrictions (only works for configured test email).

## 🎨 Test Interface Features

- **Real-time Status**: Shows whether current email is in test mode
- **Visual Indicators**: Different colors for test vs. normal mode
- **Form Validation**: Ensures required fields are filled
- **Success Messages**: Clear feedback on email delivery
- **Reset Controls**: Easy way to clear test restrictions

## ⚠️ Important Notes

### **Production Use**
- **DO NOT** use this test server in production
- **DO NOT** expose test endpoints publicly
- Test server is for development/testing only

### **EmailJS Limits**
- Be mindful of EmailJS rate limits
- Test emails count toward your monthly quota
- Consider using EmailJS sandbox for extensive testing

### **Security**
- Test server runs on localhost only
- No authentication required (development only)
- Test email is hardcoded for security

## 🐛 Troubleshooting

### **Server Won't Start**
```bash
# Check if port 3000 is available
lsof -i :3000

# Use different port
PORT=3001 npm start
```

### **EmailJS Not Working**
```bash
# Check browser console for errors
# Verify EmailJS key is correct
# Ensure EmailJS service is active
```

### **Form Not Submitting**
```bash
# Check browser console for JavaScript errors
# Verify all required fields are filled
# Check network tab for failed requests
```

## 🔄 Development Workflow

1. **Start Test Server**: `npm run dev`
2. **Open Test Interface**: `http://localhost:3000`
3. **Submit Test Emails**: Use test email address
4. **Reset When Needed**: Clear restrictions for more testing
5. **Check Results**: Verify emails in your inbox
6. **Iterate**: Make changes and test again

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify EmailJS configuration
3. Check server logs in terminal
4. Ensure test email is correctly configured

---

**Happy Testing! 🎬✨**
