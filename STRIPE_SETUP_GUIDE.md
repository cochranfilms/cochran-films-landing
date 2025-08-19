# 🚀 Stripe Integration Setup Guide for Cochran Films

This guide will walk you through setting up the complete Stripe payment integration for your services.

## 📋 What's Been Implemented

### ✅ Frontend Features
- **Shopping Cart System** - Add multiple services to cart
- **Service Detail Modals** - Click service cards to see details and pricing
- **Stripe Checkout Integration** - Direct checkout for individual services
- **Cart Management** - Add, remove, and clear items
- **Responsive Design** - Works on all devices

### ✅ Backend Features
- **Express.js Server** - Handles Stripe API calls
- **Checkout Session Creation** - Creates Stripe checkout sessions
- **Webhook Handling** - Processes successful payments
- **Error Handling** - Graceful fallbacks for failed payments

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Stripe Keys

**IMPORTANT**: Replace the placeholder keys in the code with your actual Stripe keys.

#### In `server.js` (Line 2):
```javascript
const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY_HERE');
```

#### In `index2.html` (Line 27):
```javascript
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY_HERE');
```

### 3. Start the Server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## 🔑 Stripe Dashboard Configuration

### 1. Webhook Setup
1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL: `https://yourdomain.com/api/webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret
6. Update `server.js` line 67:
   ```javascript
   const endpointSecret = 'whsec_YOUR_WEBHOOK_SECRET_HERE';
   ```

### 2. Product Configuration
1. Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Create products for each service category
3. Set pricing and descriptions
4. Note: The frontend creates dynamic products, so this is optional

## 💳 How It Works

### User Flow
1. **Browse Services** - Users see service cards in the services section
2. **Click Service Card** - Opens detailed modal with pricing and features
3. **Add to Cart** - Service added to shopping cart
4. **Checkout** - Redirected to Stripe Checkout
5. **Payment** - Secure payment processing
6. **Success/Cancel** - Redirected back to your site

### Technical Flow
1. **Frontend** - Collects service selections and creates cart
2. **Backend** - Creates Stripe checkout session
3. **Stripe** - Handles payment processing
4. **Webhook** - Notifies your server of payment status
5. **Database** - Store order details (implement as needed)

## 🎯 Service Pricing Structure

The system is configured with your current pricing:

### Video Production
- **Hourly Rate**: $250/hour
- **Event Coverage**: $500 - $2,200
- **Live Production**: $2,000 - $4,000
- **Podcasts**: $750 - $1,500
- **Commercials**: $750 - $5,500

### Photography
- **Flash Start**: $350
- **Prime Exposure**: $600
- **Legacy Capture**: $900
- **Printing Services**: $500 - $1,400

### Web Development
- **Starter Site**: $750
- **Business Pro**: $1,250
- **Brand Builder**: $2,500
- **Maintenance**: $45 - $195/month

### Brand Development
- **Ignite Package**: $900
- **Collaborate Package**: $1,800
- **Transform Package**: $3,500

## 🔧 Customization Options

### 1. Add New Services
Edit the `stripeServiceDatabase` in `index2.html`:

```javascript
'new-service': {
  name: 'New Service Name',
  price: 999,
  description: 'Service description',
  icon: 'fas fa-icon-name',
  features: [
    'Feature 1',
    'Feature 2',
    'Feature 3'
  ],
  category: 'category-name'
}
```

### 2. Modify Pricing
Update the `price` field in the service database.

### 3. Customize Features
Modify the `features` array for each service.

### 4. Add Service Categories
Update the `category` field and add new category tabs.

## 🚨 Security Considerations

### 1. Environment Variables
Move Stripe keys to environment variables:

```bash
# .env file
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
WEBHOOK_SECRET=whsec_...
```

### 2. HTTPS Required
Stripe requires HTTPS in production. Use:
- Vercel, Netlify, or Railway for hosting
- SSL certificates for custom domains

### 3. Webhook Verification
Always verify webhook signatures to prevent fraud.

## 📱 Testing

### 1. Test Cards
Use Stripe's test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

### 2. Test Mode
- All transactions are in test mode
- No real charges will be made
- Switch to live mode in production

## 🚀 Production Deployment

### 1. Update Keys
- Replace test keys with live keys
- Update webhook endpoints
- Test thoroughly before going live

### 2. Monitoring
- Set up Stripe Dashboard alerts
- Monitor webhook delivery
- Track payment success rates

### 3. Customer Support
- Prepare for payment issues
- Set up refund processes
- Document common problems

## 🆘 Troubleshooting

### Common Issues

#### 1. "Stripe is not defined"
- Check if Stripe.js is loaded
- Verify publishable key is correct

#### 2. "Failed to create checkout session"
- Check server logs
- Verify secret key is correct
- Check Stripe account status

#### 3. Webhooks not working
- Verify endpoint URL is correct
- Check webhook secret
- Ensure HTTPS is enabled

#### 4. Cart not updating
- Check browser console for errors
- Verify JavaScript is enabled
- Clear browser cache

### Debug Mode
Enable debug logging in the browser console:

```javascript
// Add this to index2.html for debugging
console.log('Stripe Cart State:', window.stripeCart);
console.log('Service Database:', stripeServiceDatabase);
```

## 📞 Support

### Stripe Support
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Stripe Community](https://community.stripe.com)

### Technical Issues
- Check browser console for errors
- Review server logs
- Test with Stripe's test mode

## 🔄 Updates & Maintenance

### Regular Tasks
1. **Monitor Stripe Dashboard** - Check for failed payments
2. **Update Dependencies** - Keep Node.js packages current
3. **Review Webhooks** - Ensure delivery success
4. **Test Checkout Flow** - Verify everything works

### Future Enhancements
- **Subscription Billing** - For recurring services
- **Payment Plans** - Split payments over time
- **Multi-Currency** - Support international clients
- **Advanced Analytics** - Track conversion rates

---

## 🎉 You're All Set!

Your Stripe integration is now ready to accept payments for all your services. Users can:

- Browse your services
- Add items to cart
- Checkout securely with Stripe
- Receive confirmation emails
- Get redirected to success/cancel pages

The system handles everything automatically and provides a professional checkout experience for your clients.

**Next Steps:**
1. Test the integration thoroughly
2. Set up webhooks in Stripe Dashboard
3. Deploy to production
4. Start accepting payments!

---

*Need help? Check the troubleshooting section or contact Stripe support.*
