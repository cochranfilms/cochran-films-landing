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
| Client subscription started | `emailjs-service-package-subscription-client-template.html` | `Your Cochran Films Monthly Retainer — {{subscription_name}} · Invoice #{{invoice_number}}` |
| Admin subscription started | `emailjs-service-package-subscription-admin-template.html` | `New Retainer Subscription — {{customer_name}} · {{subscription_name}} · #{{invoice_number}}` |

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

### Local Stripe product setup (script)

There is **no committed `.env`** (gitignored). Use `.env.example` as the template:

```bash
cp .env.example .env
# Edit .env — set STRIPE_SECRET_KEY=sk_test_... (use test mode first)
npm run stripe:setup-retainers
```

The script creates (or reuses) three Products + monthly Prices, prints Price IDs, and appends them to `.env`:

| Variable | Retainer |
|----------|----------|
| `STRIPE_PRICE_FAST_FRAME` | Fast Frame (1 Month) — $2,500/mo |
| `STRIPE_PRICE_CINEMATIC_SPOTLIGHT` | Cinematic Spotlight (2 Months) — $4,800/mo |
| `STRIPE_PRICE_MASTERPIECE` | Masterpiece Collection (3 Months) — $7,000/mo |

Copy the same Price IDs into **Vercel** env when subscriptions go live.

### EmailJS — retainer subscription templates

Paste into EmailJS and set env vars:

| Template | File | Env var |
|----------|------|---------|
| Client subscription started | `emailjs-service-package-subscription-client-template.html` | `EMAILJS_PACKAGE_SUBSCRIPTION_CLIENT_TEMPLATE_ID` |
| Admin subscription started | `emailjs-service-package-subscription-admin-template.html` | `EMAILJS_PACKAGE_SUBSCRIPTION_ADMIN_TEMPLATE_ID` |

Key variables: `subscription_name`, `subscription_id`, `commitment_term`, `next_billing_date`, `billing_note`, plus standard invoice fields.

One-time package emails still use `EMAILJS_PACKAGE_TEMPLATE_ID` / `EMAILJS_PACKAGE_ADMIN_TEMPLATE_ID` (now with `{{email_intro}}` on the client template).

### Dashboard setup (webhooks)

1. **Webhook →** add events (in addition to invoice events):
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.finalized` (subscription renewal invoices)

### Subscription flow (implemented)

1. `services-catalog.json` — each retainer has `billing.type: "subscription"` and `envPriceKey`.
2. `create-invoice.js` — retainer-only carts call `stripe.subscriptions.create()` with `collection_method: send_invoice`, `cancel_at` for the commitment term, and optional future **billing start date** (invoice modal date field).
3. Subscription + first invoice metadata include `invoice_number`, `source`, `subscription_id`, `catalog_id`.
4. `webhook.js` — `invoice.finalized` with `billing_reason: subscription_cycle` sends the subscription client EmailJS template for renewals.
5. Builder UI — retainer-only checkout copy, client-side validation (one retainer, no mixed cart).

### Manual fallback

If API subscription create fails, you can still create a subscription in Stripe Dashboard using the monthly Price ID and the same customer.

### Env vars (when subscriptions ship)

| Variable | Purpose |
|----------|---------|
| `STRIPE_PRICE_FAST_FRAME` | Monthly price ID |
| `STRIPE_PRICE_CINEMATIC_SPOTLIGHT` | Monthly price ID |
| `STRIPE_PRICE_MASTERPIECE` | Monthly price ID |
