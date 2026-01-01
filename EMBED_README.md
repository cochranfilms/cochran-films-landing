# Service Package Builder - Embeddable Widget

This is an iframe-embeddable version of the Cochran Films Service Package Builder that clients can easily integrate into their own websites.

## 🚀 Quick Start

### Basic Embed
```html
<iframe src="https://landing.cochranfilms.com/service-builder-iframe.html" 
        width="100%" 
        height="600" 
        frameborder="0">
</iframe>
```

### Responsive Embed
```html
<div style="position: relative; width: 100%; height: 0; padding-bottom: 75%;">
    <iframe src="https://landing.cochranfilms.com/service-builder-iframe.html" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
            frameborder="0">
    </iframe>
</div>
```

## 📋 Features

- ✅ **Complete Service Selection** - All 42+ services across 6 categories
- ✅ **Real-time Package Building** - Add/remove services with live total calculation
- ✅ **Contact Form Integration** - Collect client information for quotes
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Event Handling** - JavaScript callbacks for quote submissions
- ✅ **Professional Styling** - Matches Cochran Films brand identity

## 🎯 Use Cases

- **Agency Websites** - Let clients build their own service packages
- **Partner Sites** - Integrate with referral partners' websites
- **Landing Pages** - Standalone service selection pages
- **Client Portals** - Internal tools for existing clients

## 🔧 Customization

### Dimensions
- **Width**: Change `width="100%"` to any pixel value or percentage
- **Height**: Adjust `height="600"` to fit your content area
- **Responsive**: Use the responsive embed option for mobile-friendly layouts

### Event Handling
```javascript
// Listen for quote submissions
window.addEventListener('message', function(event) {
    if (event.data.type === 'COCHRAN_QUOTE_SUBMITTED') {
        const quoteData = event.data.data;
        console.log('Quote submitted:', quoteData);
        
        // Handle the quote data
        // - Send to your CRM
        // - Show notification
        // - Redirect to payment
        // - etc.
    }
});
```

## 📊 Quote Data Structure

When a quote is submitted, the iframe sends this data structure:

```javascript
{
    type: 'COCHRAN_QUOTE_SUBMITTED',
    data: {
        services: [
            {
                id: 'starter-site',
                name: 'Starter Site',
                price: 2500,
                quantity: 1
            }
        ],
        total: 2500,
        client: {
            clientName: 'John Doe',
            clientEmail: 'john@example.com',
            clientPhone: '555-1234',
            projectDetails: 'Project description...',
            budget: '5k-10k',
            timeline: '1-month'
        }
    }
}
```

## 🌐 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📱 Mobile Responsive

The iframe automatically adapts to different screen sizes:
- **Desktop**: Full-width layout with side-by-side service selection
- **Tablet**: Responsive grid layout
- **Mobile**: Single-column layout with optimized touch interactions

## 🔒 Security

- **CORS Enabled**: Safe to embed on any domain
- **No External Dependencies**: All resources served from Cochran Films domain
- **Data Privacy**: Client data only sent to parent window, not stored

## 🚀 Deployment

1. **Upload Files**: Place `service-builder-iframe.html` on your web server
2. **Update URL**: Change the iframe `src` to point to your domain
3. **Test Integration**: Verify the iframe loads and functions correctly
4. **Customize Styling**: Modify CSS if needed to match your brand

## 📞 Support

For technical support or customization requests:
- **Email**: support@cochranfilms.com
- **Website**: https://cochranfilms.com
- **Documentation**: This README file

## 🔄 Updates

The iframe widget will automatically receive updates when deployed. No action required from clients using the embed.

---

**Powered by Cochran Films** - Professional video production, web development, and creative services.
