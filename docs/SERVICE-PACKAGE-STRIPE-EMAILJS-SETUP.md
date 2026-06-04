# Service Package Builder — Stripe + EmailJS Setup

## Flow

1. Visitor builds a package on the landing page and clicks **Create Project Request**.
2. They enter name, email, and phone.
3. `POST /api/stripe/create-invoice` creates a **real Stripe Invoice**, finalizes it, and calls `sendInvoice` (Stripe emails the client from your Stripe account).
4. The same API sends your branded **EmailJS** summary with line items and the hosted invoice link.
5. You see the invoice in **Stripe Dashboard → Invoices**.

---

## Vercel environment variables (all)

Set these in the **cochran-films-landing** Vercel project (Production + Preview if you test there).

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | **Yes** | Secret key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_PUBLISHABLE_KEY` | No | Only needed for future Stripe.js on the client |
| `STRIPE_WEBHOOK_SECRET` | No | For `invoice.paid` webhooks later (`whsec_...`) |
| `STRIPE_INVOICE_DAYS_UNTIL_DUE` | No | Default `30` |
| `EMAILJS_SERVICE_ID` | **Yes** | e.g. `service_t11yvru` |
| `EMAILJS_PUBLIC_KEY` | **Yes** | Public key from EmailJS |
| `EMAILJS_PRIVATE_KEY` | **Yes** | Private key (server-side send) |
| `EMAILJS_PACKAGE_TEMPLATE_ID` | **Yes** | New template ID after you create it |
| `EMAILJS_ADMIN_EMAIL` | No | Your email for a copy of each submission |
| `ALLOWED_ORIGINS` | No | Comma-separated site origins for CORS |

### Recommended email subject (EmailJS template settings)

```
Your Cochran Films Project Package & Invoice #{{invoice_number}}
```

### Template variables (must exist in EmailJS)

`to_email`, `reply_to`, `email_heading`, `customer_name`, `customer_email`, `customer_phone`, `invoice_number`, `project_date`, `services_html`, `services_list`, `total_amount`, `invoice_url`

- **To Email:** `{{to_email}}`
- **Reply To:** `{{customer_email}}` or `{{reply_to}}`
- For HTML line items use **triple braces:** `{{{services_html}}}` inside the services table `<tbody>`.

HTML to paste: `docs/emailjs-service-package-invoice-template.html`

---

## Stripe Dashboard checklist

1. **Settings → Customer emails** — enable invoice emails if you want Stripe’s own message in addition to EmailJS.
2. **Settings → Business details** — logo, support email, and address appear on invoices.
3. Use **test mode** keys in Preview deployments; **live** keys in Production.
4. Invoicing must be enabled on your Stripe account (default for most businesses).

---

## Deploy notes

- Vercel project **Root Directory** should be `public` for the landing site.
- API route: `public/api/stripe/create-invoice.js`
- `public/package.json` includes the `stripe` dependency (required when Vercel Root Directory is `public`).

---

## Local test

```bash
npm install
# Add vars to .env.local in Vercel CLI or export them, then:
vercel dev
```

POST body example:

```json
{
  "customer": { "name": "Jane Doe", "email": "jane@example.com", "phone": "555-0100" },
  "services": [{ "name": "Brand Builder Site", "price": 2500, "duration": "6–10 pages", "quantity": 1 }],
  "invoiceNumber": "CF-TEST-001",
  "total": 2500
}
```
