#!/usr/bin/env node
/**
 * Generates Cochran Films EmailJS HTML templates (editorial white + black outline).
 * Run: node docs/build-email-templates.js
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname);

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const TEXT = '#1d1d1f';
const BODY = '#333336';
const MUTED = '#424245';
const BORDER = '1px solid rgba(0,0,0,0.14)';
const BORDER_CSS = `border:${BORDER}`;
const LOGO = 'https://www.cochranfilms.studio/reference/logo.png';
const SITE = 'https://www.cochranfilms.studio';

const HEAD = `<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>{{email_heading}}</title>
  <style type="text/css">
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; display: block; }
    a { color: ${TEXT}; }
    @media only screen and (max-width: 620px) {
      .shell { width: 100% !important; }
      .pad { padding-left: 20px !important; padding-right: 20px !important; }
      .pad-head { padding: 28px 20px 22px !important; }
      .pad-body { padding: 28px 20px !important; }
      .meta-col { display: block !important; width: 100% !important; max-width: 100% !important; padding: 0 0 10px 0 !important; }
      .meta-gap { display: none !important; width: 0 !important; height: 0 !important; font-size: 0 !important; line-height: 0 !important; }
      .headline { font-size: 22px !important; line-height: 1.25 !important; }
      .amount { font-size: 28px !important; }
      .cta-btn a { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
      .svc-table th, .svc-table td { font-size: 12px !important; padding: 10px 10px !important; }
      .admin-row td { display: block !important; width: 100% !important; box-sizing: border-box !important; border-bottom: ${BORDER} !important; }
    }
  </style>
</head>`;

function preheader(text) {
  return `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;color:transparent;">${text}</div>`;
}

function shellStart(preheaderText) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
${HEAD}
<body style="margin:0;padding:0;width:100%;background-color:#ffffff;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
${preheaderText ? preheader(preheaderText) : ''}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="shell" width="600" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background-color:#ffffff;${BORDER_CSS};">`;
}

function shellEnd(footerNote) {
  return `          <tr>
            <td class="pad" align="center" style="padding:24px 28px 28px;border-top:${BORDER};">
              <p style="margin:0 0 6px;font-family:${FONT};font-size:14px;font-weight:600;color:${TEXT};">Cochran Films</p>
              <p style="margin:0 0 12px;font-family:${FONT};font-size:12px;line-height:1.55;color:${MUTED};">Full-stack media &amp; production · Atlanta, GA</p>
              <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;">
                <a href="${SITE}" target="_blank" style="color:${TEXT};text-decoration:underline;font-weight:600;">cochranfilms.studio</a>
              </p>
              <p style="margin:14px 0 0;font-family:${FONT};font-size:11px;line-height:1.6;color:${MUTED};">
                <a href="tel:+14704202169" style="color:${MUTED};text-decoration:none;">(470) 420-2169</a>
                &nbsp;·&nbsp;
                <a href="mailto:info@cochranfilms.com" style="color:${MUTED};text-decoration:underline;">info@cochranfilms.com</a>
              </p>
              ${footerNote ? `<p style="margin:14px 0 0;font-family:${FONT};font-size:11px;line-height:1.5;color:${MUTED};">${footerNote}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function headerBlock(eyebrow) {
  return `          <tr>
            <td class="pad-head" style="padding:32px 28px 24px;border-bottom:${BORDER};">
              <img src="${LOGO}" alt="Cochran Films" width="200" style="width:100%;max-width:200px;height:auto;margin:0 0 22px;" />
              <p style="margin:0 0 10px;font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${MUTED};">${eyebrow}</p>
              <h1 class="headline" style="margin:0;font-family:${FONT};font-size:26px;line-height:1.2;font-weight:600;color:${TEXT};letter-spacing:-0.02em;">{{email_heading}}</h1>
            </td>
          </tr>`;
}

function introBlock(extra) {
  return `          <tr>
            <td class="pad-body pad" style="padding:28px 28px 8px;">
              ${extra || ''}
              <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.7;color:${BODY};">{{email_intro}}</p>
            </td>
          </tr>`;
}

function kicker(label) {
  return `<p style="margin:0 0 8px;font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${MUTED};">${label}</p>`;
}

function outlineBox(content, extraStyle) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="${BORDER_CSS};${extraStyle || ''}">
                <tr>
                  <td style="padding:16px 18px;">${content}</td>
                </tr>
              </table>`;
}

function metaRow(cells) {
  const tds = cells
    .map(
      (cell, i) =>
        `<td class="meta-col" width="${Math.floor(100 / cells.length)}%" valign="top" style="padding:${i === 0 ? '0 8px 0 0' : i === cells.length - 1 ? '0 0 0 8px' : '0 8px'};">${outlineBox(cell)}</td>`
    )
    .join('<td class="meta-gap" width="0" style="font-size:0;line-height:0;">&nbsp;</td>');
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr class="admin-row">${tds}</tr></table>`;
}

function metaField(label, value) {
  return `${kicker(label)}<p style="margin:0;font-family:${FONT};font-size:16px;font-weight:600;color:${TEXT};line-height:1.35;">${value}</p>`;
}

function ctaBlock(labelVar, urlVar, subtextVar) {
  const label = labelVar || '{{cta_label}}';
  const url = urlVar || '{{cta_url}}';
  const sub = subtextVar || '{{cta_subtext}}';
  return `          <tr>
            <td class="pad cta-btn" align="center" style="padding:8px 28px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
                <tr>
                  <td align="center" style="background-color:${TEXT};">
                    <a href="${url}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.04em;">${label}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-family:${FONT};font-size:12px;line-height:1.5;color:${MUTED};">${sub}</p>
            </td>
          </tr>`;
}

function servicesTable() {
  return `${kicker('Selected services')}
              <table role="presentation" class="svc-table" width="100%" cellspacing="0" cellpadding="0" border="0" style="${BORDER_CSS};">
                <thead>
                  <tr>
                    <th align="left" style="padding:12px 14px;font-family:${FONT};font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};border-bottom:${BORDER};">Service</th>
                    <th align="left" style="padding:12px 10px;font-family:${FONT};font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};border-bottom:${BORDER};">Details</th>
                    <th align="right" style="padding:12px 14px;font-family:${FONT};font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};border-bottom:${BORDER};">Amount</th>
                  </tr>
                </thead>
                <tbody>{{{services_html}}}</tbody>
              </table>`;
}

function amountBox(label, amountVar, subline) {
  return outlineBox(
    `<p style="margin:0 0 6px;font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};">${label}</p>
     <p class="amount" style="margin:0;font-family:${FONT};font-size:32px;font-weight:600;color:${TEXT};line-height:1;">${amountVar}</p>
     ${subline ? `<p style="margin:10px 0 0;font-family:${FONT};font-size:14px;line-height:1.5;color:${BODY};">${subline}</p>` : ''}`
  );
}

const templates = {
  'emailjs-contact-inquiry-template.html': `<!--
  Cochran Films: Contact / Project Inquiry (EmailJS)
  Paste into EmailJS → Email Templates → Content (HTML)

  Variables: {{to_email}}, {{reply_to}}, {{email_heading}}, {{email_intro}},
  {{customer_name}}, {{customer_first_name}}, {{customer_last_name}}, {{customer_email}},
  {{service_interest}}, {{inquiry_id}}, {{submitted_date}}, {{project_details_html}},
  {{cta_label}}, {{cta_url}}, {{cta_subtext}}

  Settings: To {{to_email}} · From Cochran Films · Reply To {{reply_to}}
-->` + shellStart('Cochran Films project inquiry from {{customer_name}}') + headerBlock('Project inquiry') + introBlock() + `
          <tr><td class="pad-body pad" style="padding:16px 28px 8px;">
              ${kicker('From')}
              <p style="margin:0 0 16px;font-family:${FONT};font-size:22px;font-weight:600;color:${TEXT};line-height:1.3;">{{customer_name}}</p>
              ${kicker('Email')}
              <p style="margin:0 0 20px;font-family:${FONT};font-size:15px;"><a href="mailto:{{customer_email}}" style="color:${TEXT};text-decoration:underline;font-weight:600;">{{customer_email}}</a></p>
              ${metaRow([
                metaField('Inquiry ID', '#{{inquiry_id}}'),
                metaField('Submitted', '{{submitted_date}}'),
              ])}
            </td></tr>
          <tr><td class="pad-body pad" style="padding:20px 28px 8px;">
              ${kicker('Service interest')}
              ${outlineBox('<p style="margin:0;font-family:' + FONT + ';font-size:17px;font-weight:600;color:' + TEXT + ';">{{service_interest}}</p>')}
            </td></tr>
          <tr><td class="pad-body pad" style="padding:16px 28px 24px;">
              ${kicker('Project details')}
              ${outlineBox('<p style="margin:0;font-family:' + FONT + ';font-size:15px;line-height:1.75;color:' + BODY + ';">{{{project_details_html}}}</p>')}
            </td></tr>` + ctaBlock() + shellEnd(),

  'emailjs-service-package-invoice-template.html': `<!--
  Cochran Films: Service Package Invoice (EmailJS)
  Variables: {{to_email}}, {{reply_to}}, {{email_heading}}, {{email_intro}}, {{customer_name}},
  {{customer_email}}, {{customer_phone}}, {{invoice_number}}, {{project_date}}, {{payment_due_date}},
  {{services_html}}, {{total_amount}}, {{invoice_url}}
  Line items: {{{services_html}}} in tbody below.
-->` + shellStart('Your Cochran Films project package and secure payment link are ready.') + headerBlock('Project package &amp; invoice') + `
          <tr><td class="pad-body pad" style="padding:28px 28px 8px;">
              ${kicker('Bill to')}
              <p style="margin:0 0 20px;font-family:${FONT};font-size:22px;font-weight:600;color:${TEXT};line-height:1.3;">{{customer_name}}</p>
              <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.7;color:${BODY};">{{email_intro}}</p>
            </td></tr>
          <tr><td class="pad-body pad" style="padding:16px 28px 8px;">
              ${metaRow([
                metaField('Invoice', '#{{invoice_number}}'),
                metaField('Date', '{{project_date}}'),
              ])}
            </td></tr>
          <tr><td class="pad-body pad" style="padding:16px 28px 8px;">${servicesTable()}</td></tr>
          <tr><td class="pad-body pad" style="padding:20px 28px;">${amountBox('Amount due', '{{total_amount}}')}</td></tr>
          <tr><td class="pad cta-btn" align="center" style="padding:4px 28px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"><tr><td style="background-color:${TEXT};"><a href="{{invoice_url}}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;">View &amp; Pay Invoice</a></td></tr></table>
              <p style="margin:14px 0 0;font-family:${FONT};font-size:12px;color:${MUTED};">Secure checkout · Stripe</p>
              <p style="margin:8px 0 0;font-family:${FONT};font-size:11px;line-height:1.5;"><a href="{{invoice_url}}" target="_blank" style="color:${TEXT};text-decoration:underline;word-break:break-all;">{{invoice_url}}</a></p>
            </td></tr>
          <tr><td class="pad-body pad" style="padding:0 28px 24px;border-top:${BORDER};">
              ${kicker('Contact information')}
              <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.75;color:${BODY};"><strong style="color:${TEXT};">{{customer_name}}</strong><br /><a href="mailto:{{customer_email}}" style="color:${TEXT};text-decoration:underline;">{{customer_email}}</a><br /><span style="color:${MUTED};">{{customer_phone}}</span></p>
            </td></tr>` + shellEnd('Questions? Reply to this email or write to info@cochranfilms.com.'),

  'emailjs-service-package-paid-client-template.html': `<!--
  Cochran Films: Client Payment Confirmed (EmailJS)
  Env: EMAILJS_PACKAGE_PAID_CLIENT_TEMPLATE_ID
-->` + shellStart('Payment received for Cochran Films Invoice #{{invoice_number}}') + headerBlock('Payment confirmed') + `
          <tr><td class="pad-body pad" style="padding:28px 28px 8px;">
              <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.7;color:${BODY};">Hi {{customer_name}},</p>
              <p style="margin:0 0 20px;font-family:${FONT};font-size:15px;line-height:1.7;color:${BODY};">{{email_intro}}</p>
              ${amountBox('Amount paid', '{{total_amount}}', 'Invoice #{{invoice_number}} · {{payment_date}}')}
              <p style="margin:18px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${MUTED};white-space:pre-line;">{{services_list}}</p>
            </td></tr>` + ctaBlock() + shellEnd(),

  'emailjs-service-package-admin-template.html': `<!--
  Cochran Films: Admin New Service Package (EmailJS)
  Env: EMAILJS_PACKAGE_ADMIN_TEMPLATE_ID
-->` + shellStart('New service package: {{customer_name}} · {{total_amount}}') + headerBlock('Internal · new package') + `
          <tr><td class="pad-body pad" style="padding:28px 28px 8px;">
              <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.7;color:${BODY};">{{email_intro}}</p>
              <p style="margin:0 0 20px;font-family:${FONT};font-size:14px;line-height:1.6;color:${MUTED};">{{billing_note}}</p>
              ${kicker('Client')}
              <p style="margin:0;font-family:${FONT};font-size:20px;font-weight:600;color:${TEXT};">{{customer_name}}</p>
              <p style="margin:8px 0 20px;font-family:${FONT};font-size:14px;"><a href="mailto:{{customer_email}}" style="color:${TEXT};text-decoration:underline;">{{customer_email}}</a> · {{customer_phone}}</p>
              ${metaRow([
                metaField('Ref #', '{{invoice_number}}'),
                metaField('Stripe #', '{{stripe_invoice_number}}'),
                metaField('Total', '{{total_amount}}'),
              ])}
            </td></tr>
          <tr><td class="pad-body pad" style="padding:16px 28px 8px;">${servicesTable()}</td></tr>
          <tr><td class="pad-body pad" style="padding:8px 28px 20px;"><p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.6;color:${MUTED};white-space:pre-line;">{{services_list}}</p></td></tr>
          <tr><td class="pad cta-btn" align="center" style="padding:4px 28px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"><tr><td style="background-color:${TEXT};"><a href="{{cta_url}}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;">{{cta_label}}</a></td></tr></table>
              <p style="margin:12px 0 0;font-family:${FONT};font-size:12px;color:${MUTED};">{{cta_subtext}}</p>
              <p style="margin:14px 0 0;font-family:${FONT};font-size:12px;"><a href="{{invoice_url}}" style="color:${TEXT};text-decoration:underline;">Hosted invoice (client pay link)</a></p>
              <p style="margin:8px 0 0;font-family:${FONT};font-size:11px;color:${MUTED};">{{dashboard_hint}}</p>
            </td></tr>` + shellEnd(),

  'emailjs-service-package-subscription-client-template.html': `<!--
  Cochran Films: Client Retainer Subscription (EmailJS)
  Env: EMAILJS_PACKAGE_SUBSCRIPTION_CLIENT_TEMPLATE_ID
-->` + shellStart('Your Cochran Films monthly retainer · {{subscription_name}}') + headerBlock('Monthly retainer') + `
          <tr><td class="pad-body pad" style="padding:28px 28px 8px;">
              <p style="margin:0 0 20px;font-family:${FONT};font-size:15px;line-height:1.7;color:${BODY};">{{email_intro}}</p>
              ${outlineBox('<p style="margin:0;font-family:' + FONT + ';font-size:14px;line-height:1.6;color:' + BODY + ';">{{billing_note}}</p>')}
            </td></tr>
          <tr><td class="pad-body pad" style="padding:20px 28px 8px;">
              ${kicker('Bill to')}
              <p style="margin:0 0 8px;font-family:${FONT};font-size:20px;font-weight:600;color:${TEXT};">{{customer_name}}</p>
              <p style="margin:0 0 20px;font-family:${FONT};font-size:14px;color:${MUTED};">{{customer_email}} · {{customer_phone}}</p>
              ${metaRow([
                metaField('Ref #', '{{invoice_number}}'),
                metaField('Retainer', '{{subscription_name}}'),
                metaField('Term', '{{commitment_term}}'),
              ])}
            </td></tr>
          <tr><td class="pad-body pad" style="padding:16px 28px 8px;">
              ${metaRow([
                metaField('This invoice', '{{total_amount}}'),
                metaField('Due', '{{payment_due_date}}'),
                metaField('Next billing', '{{next_billing_date}}'),
              ])}
            </td></tr>
          <tr><td class="pad-body pad" style="padding:16px 28px 20px;">${servicesTable()}</td></tr>` + ctaBlock('{{cta_label}}', '{{invoice_url}}') + shellEnd(),

  'emailjs-service-package-subscription-admin-template.html': `<!--
  Cochran Films: Admin Retainer Subscription (EmailJS)
  Env: EMAILJS_PACKAGE_SUBSCRIPTION_ADMIN_TEMPLATE_ID
-->` + shellStart('New retainer subscription: {{customer_name}}') + headerBlock('Internal · retainer subscription') + `
          <tr><td class="pad-body pad" style="padding:28px 28px 8px;">
              <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.7;color:${BODY};">{{email_intro}}</p>
              <p style="margin:0 0 20px;font-family:${FONT};font-size:14px;line-height:1.6;color:${MUTED};">{{billing_note}}</p>
              ${kicker('Client')}
              <p style="margin:0;font-family:${FONT};font-size:20px;font-weight:600;color:${TEXT};">{{customer_name}}</p>
              <p style="margin:8px 0 20px;font-family:${FONT};font-size:14px;"><a href="mailto:{{customer_email}}" style="color:${TEXT};text-decoration:underline;">{{customer_email}}</a> · {{customer_phone}}</p>
              ${metaRow([
                metaField('Subscription', '{{subscription_id}}'),
                metaField('Package', '{{subscription_name}}'),
                metaField('Term', '{{commitment_term}}'),
              ])}
              <p style="margin:16px 0 0;font-family:${FONT};font-size:13px;color:${MUTED};">Next billing: {{next_billing_date}} · Total: {{total_amount}}</p>
            </td></tr>
          <tr><td class="pad-body pad" style="padding:8px 28px 20px;">${servicesTable()}</td></tr>
          <tr><td class="pad cta-btn" align="center" style="padding:4px 28px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"><tr><td style="background-color:${TEXT};"><a href="{{cta_url}}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;">{{cta_label}}</a></td></tr></table>
              <p style="margin:12px 0 0;font-family:${FONT};font-size:12px;"><a href="{{invoice_url}}" style="color:${TEXT};text-decoration:underline;">Hosted invoice</a></p>
              <p style="margin:8px 0 0;font-family:${FONT};font-size:11px;color:${MUTED};">{{dashboard_hint}}</p>
            </td></tr>` + shellEnd(),

  'emailjs-service-package-invoice-overdue-client-template.html': `<!--
  Cochran Films: Client Invoice Overdue (EmailJS)
  Env: EMAILJS_PACKAGE_OVERDUE_CLIENT_TEMPLATE_ID
-->` + shellStart('Invoice overdue: Cochran Films #{{invoice_number}}') + headerBlock('Invoice overdue') + `
          <tr><td class="pad-body pad" style="padding:28px 28px 8px;">
              <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.7;color:${BODY};">Hi {{customer_name}},</p>
              <p style="margin:0 0 20px;font-family:${FONT};font-size:15px;line-height:1.7;color:${BODY};">{{email_intro}}</p>
              ${amountBox('Balance due', '{{total_amount}}', 'Invoice #{{invoice_number}} · Was due {{due_date}}')}
              <p style="margin:18px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${MUTED};white-space:pre-line;">{{services_list}}</p>
              <p style="margin:16px 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:${BODY};">Please complete payment at your earliest convenience so we can reserve your production dates.</p>
            </td></tr>` + ctaBlock() + `
          <tr><td class="pad" align="center" style="padding:0 28px 24px;"><p style="margin:0;font-family:${FONT};font-size:11px;line-height:1.5;"><a href="{{invoice_url}}" style="color:${TEXT};text-decoration:underline;word-break:break-all;">{{invoice_url}}</a></p></td></tr>` + shellEnd(),

  'emailjs-service-package-payment-failed-client-template.html': `<!--
  Cochran Films: Client Payment Failed (EmailJS)
  Env: EMAILJS_PACKAGE_PAYMENT_FAILED_CLIENT_TEMPLATE_ID
-->` + shellStart('Payment failed: Cochran Films Invoice #{{invoice_number}}') + headerBlock('Payment failed') + `
          <tr><td class="pad-body pad" style="padding:28px 28px 8px;">
              <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.7;color:${BODY};">Hi {{customer_name}},</p>
              <p style="margin:0 0 20px;font-family:${FONT};font-size:15px;line-height:1.7;color:${BODY};">{{email_intro}}</p>
              ${amountBox('Amount due', '{{total_amount}}', 'Invoice #{{invoice_number}} · Due {{due_date}}')}
              <p style="margin:18px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${MUTED};white-space:pre-line;">{{services_list}}</p>
              <p style="margin:16px 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:${BODY};">Your card or bank payment did not go through. Try again using the secure link below. No need to rebuild your package.</p>
            </td></tr>` + ctaBlock() + `
          <tr><td class="pad" align="center" style="padding:0 28px 24px;"><p style="margin:0;font-family:${FONT};font-size:11px;line-height:1.5;"><a href="{{invoice_url}}" style="color:${TEXT};text-decoration:underline;word-break:break-all;">{{invoice_url}}</a></p></td></tr>` + shellEnd('Questions? Reply or email info@cochranfilms.com.'),

  'emailjs-service-package-paid-admin-template.html': `<!--
  Cochran Films: Admin Payment Received (EmailJS)
  Env: EMAILJS_PACKAGE_PAID_ADMIN_TEMPLATE_ID
-->` + shellStart('PAID: {{customer_name}} · {{total_amount}}') + headerBlock('Internal · payment received') + `
          <tr><td class="pad-body pad" style="padding:28px 28px 8px;">
              <p style="margin:0 0 20px;font-family:${FONT};font-size:15px;line-height:1.7;color:${BODY};">{{email_intro}}</p>
              ${kicker('Client')}
              <p style="margin:0;font-family:${FONT};font-size:20px;font-weight:600;color:${TEXT};">{{customer_name}}</p>
              <p style="margin:8px 0 20px;font-family:${FONT};font-size:14px;color:${MUTED};">{{customer_email}} · {{customer_phone}}</p>
              ${amountBox('Amount received', '{{total_amount}}', 'Ref {{invoice_number}} · Stripe {{stripe_invoice_number}} · Paid {{payment_date}}')}
              <p style="margin:18px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${MUTED};white-space:pre-line;">{{services_list}}</p>
            </td></tr>
          <tr><td class="pad cta-btn" align="center" style="padding:8px 28px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"><tr><td style="background-color:${TEXT};"><a href="{{cta_url}}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;">{{cta_label}}</a></td></tr></table>
              <p style="margin:10px 0 0;font-family:${FONT};font-size:12px;color:${MUTED};">{{cta_subtext}}</p>
            </td></tr>` + shellEnd(),
};

for (const [filename, html] of Object.entries(templates)) {
  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, html);
  console.log('Wrote', filename);
}
