# Contact Form — EmailJS Setup

The **Project Inquiry Form** (`#bookingForm`) sends via `POST /api/contact/send-inquiry`.

## Vercel environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EMAILJS_SERVICE_ID` | Yes | Same service as package invoices |
| `EMAILJS_PUBLIC_KEY` | Yes | EmailJS public key |
| `EMAILJS_PRIVATE_KEY` | Yes | Required for server-side send |
| **`EMAILJS_CONTACT_TEMPLATE_ID`** | **Yes** | New template — paste HTML from `docs/emailjs-contact-inquiry-template.html` |
| **`EMAILJS_CONTACT_TO_EMAIL`** | **Yes** | Your inbox for new inquiries (e.g. `info@cochranfilms.com`) |
| `EMAILJS_ADMIN_EMAIL` | Fallback | Used if `EMAILJS_CONTACT_TO_EMAIL` is unset |
| `EMAILJS_CONTACT_SEND_CLIENT_COPY` | No | Set to `false` to skip auto-reply to the submitter (default: send copy) |

Shared with invoices: `EMAILJS_SERVICE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY`, `ALLOWED_ORIGINS`.

## Recommended email subjects (EmailJS template settings)

Use one template; subject applies to both admin and client sends unless you create two templates.

**Best single subject (works for admin + client):**

```
Cochran Films — {{email_heading}}
```

**Or use separate templates later:**

| Recipient | Subject |
|-----------|---------|
| **You (admin)** | `New Cochran Films Inquiry — {{customer_name}} · {{service_interest}}` |
| **Client auto-reply** | `We received your message — Cochran Films` |

## EmailJS template settings

- **To Email:** `{{to_email}}`
- **From Name:** Cochran Films
- **Reply To:** `{{reply_to}}` (customer email — use Reply on admin emails)

## Template variables

`to_email`, `reply_to`, `email_heading`, `email_intro`, `customer_name`, `customer_email`, `service_interest`, `inquiry_id`, `submitted_date`, `project_details_html`, `project_details`

For project details HTML use **`{{{project_details_html}}}`** (triple braces).

## Flow

1. Visitor submits the contact form.
2. API emails **you** at `EMAILJS_CONTACT_TO_EMAIL` with inquiry details.
3. API emails the **client** a confirmation (unless `EMAILJS_CONTACT_SEND_CLIENT_COPY=false`).
4. Success modal appears on the site.
