# Service Package Builder — Stripe + EmailJS

> **Production site:** [https://www.cochranfilms.com](https://www.cochranfilms.com)  
> **Contact form:** [EMAILJS-CONTACT-INQUIRY-SETUP.md](./EMAILJS-CONTACT-INQUIRY-SETUP.md)

## Flow

1. Visitor builds a package on the site and clicks **Create My Invoice**.
2. They enter name, email, and optional phone / project details.
3. `POST /api/stripe/create-invoice` validates prices against `data/services-catalog.json`, creates a Stripe invoice, finalizes it (no `sendInvoice`), and sends branded EmailJS emails.
4. Client pays via the Stripe hosted invoice link.
5. Stripe webhooks → client/admin emails: **paid**, **payment failed**, **overdue** (when configured).

---

## Stripe webhook (required for payment emails)

| Setting | Value |
|---------|--------|
| **Endpoint URL (Live)** | `https://www.cochranfilms.com/api/stripe/webhook` |
| **Events** | `invoice.paid`, `invoice.payment_failed`, `invoice.overdue` (subscribe to all three for full client lifecycle emails) |
| **Signing secret** | `STRIPE_WEBHOOK_SECRET` (`whsec_...` — separate for Test vs Live) |

Use Stripe CLI for local testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Dashboard:** Disable automatic Stripe invoice emails to customers (Settings → Customer emails). You send branded EmailJS on create and on paid via webhook.

**Idempotency** uses in-memory dedupe in the API (no KV required). Fine for low volume; duplicate webhook retries on the same warm instance are still suppressed. Cold starts may reset the cache.

---

## Vercel environment variables

Set in the **cochran-films-landing** project. Root Directory: `public`.

### Stripe

| Variable | Required | Notes |
|----------|----------|--------|
| `STRIPE_SECRET_KEY` | Yes | `sk_live_...` (prod) / `sk_test_...` (preview) |
| `STRIPE_WEBHOOK_SECRET` | Yes | From webhook endpoint (`whsec_...`) |
| `STRIPE_INVOICE_DAYS_UNTIL_DUE` | No | Default `30` |

### EmailJS

| Variable | Required | Purpose |
|----------|----------|---------|
| `EMAILJS_SERVICE_ID` | Yes | |
| `EMAILJS_PUBLIC_KEY` | Yes | |
| `EMAILJS_PRIVATE_KEY` | Yes | Server-side send |
| `EMAILJS_PACKAGE_TEMPLATE_ID` | Yes | Client — invoice created |
| `EMAILJS_PACKAGE_ADMIN_TEMPLATE_ID` | Yes | Admin — new package (pending payment) |
| `EMAILJS_PACKAGE_PAID_ADMIN_TEMPLATE_ID` | Yes | Admin — `invoice.paid` |
| `EMAILJS_PACKAGE_PAID_CLIENT_TEMPLATE_ID` | Yes | Client — `invoice.paid` |
| `EMAILJS_PACKAGE_PAYMENT_FAILED_CLIENT_TEMPLATE_ID` | Yes | Client — `invoice.payment_failed` |
| `EMAILJS_PACKAGE_OVERDUE_CLIENT_TEMPLATE_ID` | Yes | Client — `invoice.overdue` |
| `EMAILJS_ADMIN_EMAIL` | Yes | Admin inbox for package + paid notifications |

### Site / CORS

| Variable | Required | Notes |
|----------|----------|--------|
| `ALLOWED_ORIGINS` | No | Default includes `https://www.cochranfilms.com` |
| `SITE_URL` | No | Default `https://www.cochranfilms.com` (paid client CTA) |

---

## EmailJS templates (paste from `docs/`)

| Template | HTML file | Subject |
|----------|-----------|---------|
| Client package | `emailjs-service-package-invoice-template.html` | `Your Cochran Films Project Package & Invoice #{{invoice_number}}` |
| Admin new package | `emailjs-service-package-admin-template.html` | `New Service Package — {{customer_name}} · {{total_amount}} · #{{invoice_number}}` |
| Admin paid | `emailjs-service-package-paid-admin-template.html` | `PAID — {{customer_name}} · {{total_amount}} · Invoice #{{invoice_number}}` |
| Client paid | `emailjs-service-package-paid-client-template.html` | `Payment received — Cochran Films Invoice #{{invoice_number}}` |
| Client payment failed | `emailjs-service-package-payment-failed-client-template.html` | `Payment failed — Cochran Films Invoice #{{invoice_number}}` |
| Client overdue | `emailjs-service-package-invoice-overdue-client-template.html` | `Invoice overdue — Cochran Films Invoice #{{invoice_number}}` |

**Client failed / overdue template variables:** `to_email`, `reply_to`, `email_heading`, `email_intro`, `customer_name`, `customer_email`, `customer_phone`, `invoice_number`, `stripe_invoice_number`, `total_amount`, `due_date`, `invoice_url`, `services_list`, `cta_label`, `cta_url`, `cta_subtext`

Use triple braces for HTML line items where applicable: `{{{services_html}}}`.

---

## API routes

| Route | File |
|-------|------|
| `POST /api/stripe/create-invoice` | `public/api/stripe/create-invoice.js` |
| `POST /api/stripe/webhook` | `public/api/stripe/webhook.js` |
| Catalog (client + server) | `public/data/services-catalog.json` |

---

## Local test

```bash
cd public && npm install
vercel dev
```

Example POST (include service `id` from catalog):

```json
{
  "customer": { "name": "Jane Doe", "email": "jane@example.com", "phone": "555-0100" },
  "services": [{ "id": "brand-builder-site", "name": "Brand Builder Site", "price": 2500, "duration": "6–10 pages", "quantity": 1 }],
  "invoiceNumber": "CF-TEST-001",
  "total": 2500
}
```

Send header `X-Idempotency-Key: CF-TEST-001` to avoid duplicate submissions.

---

## Retainer packages — monthly invoices on the same date

The Service Package Builder today creates **one-time** Stripe invoices (`collection_method: send_invoice`). Retainers (Fast Frame, Cinematic Spotlight, Masterpiece Collection) need **Stripe Subscriptions** so Stripe generates a new invoice on the same calendar day each month.

### Recommended Stripe model

| Catalog item | Billing model | Stripe approach |
|--------------|---------------|-----------------|
| Fast Frame (1 Month) | True monthly retainer | Subscription, interval `month`, cancel after 1 month or ongoing |
| Cinematic Spotlight (2 Months) | 2-month commitment | Subscription `month` × 2, then cancel, **or** one invoice + manual renewal |
| Masterpiece Collection (3 Months) | 3-month commitment | Subscription `month` × 3, then cancel, **or** one invoice + manual renewal |

For **same date each month**, use a Subscription with:

- `collection_method: 'send_invoice'` (EmailJS still owns the branded first touch; Stripe emails should stay off)
- `days_until_due` (e.g. 7)
- `billing_cycle_anchor` = Unix timestamp of the anchor day (e.g. day client signs)
- `proration_behavior: 'none'` on create (optional)
- `cancel_at` or `cancel_at_period_end` when the package is a fixed term (2 or 3 months)

### Dashboard setup (one-time)

1. **Products →** create products for each retainer (Fast Frame, Cinematic Spotlight, Masterpiece Collection).
2. **Prices →** add recurring prices (`monthly`, amount = catalog price).
3. Copy each **Price ID** (`price_...`) for env or catalog metadata.
4. **Webhook →** add events (in addition to invoice events):
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.finalized` (subscription renewal invoices)

### Code changes needed (not built yet)

1. Add to `services-catalog.json` per retainer:
   ```json
   "fast-frame-monthly": {
     "name": "Fast Frame (1 Month)",
     "price": 2500,
     "category": "retainer",
     "billing": { "type": "subscription", "interval": "month", "intervalCount": 1, "stripePriceId": "price_xxx" }
   }
   ```
2. In `create-invoice.js`, if cart contains only retainer subscription items → `stripe.subscriptions.create(...)` instead of a one-off invoice.
3. Store `subscription_id` in invoice/subscription metadata (`invoice_number`, `source`).
4. Extend `webhook.js` to send EmailJS on **subscription renewal** `invoice.finalized` (not only first package create).
5. UI copy on retainer cards: “Billed monthly on the same date” + optional **billing start date** in the invoice modal.

### Manual workaround (no code)

Until subscriptions are implemented: create the first invoice in the builder, then in Stripe Dashboard → **Subscriptions → Create** using the same customer, monthly price, and **billing cycle anchor** set to the paid date. Cancel after the committed term (1/2/3 months).

### Env vars (when subscriptions ship)

| Variable | Purpose |
|----------|---------|
| `STRIPE_PRICE_FAST_FRAME` | Monthly price ID |
| `STRIPE_PRICE_CINEMATIC_SPOTLIGHT` | Monthly price ID |
| `STRIPE_PRICE_MASTERPIECE` | Monthly price ID |
