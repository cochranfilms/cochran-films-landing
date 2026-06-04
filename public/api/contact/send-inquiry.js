const SERVICE_LABELS = {
  'video-production': 'Video Production',
  photography: 'Photography',
  'real-estate-media': 'Real Estate Media',
  'web-development': 'Web Development',
  'brand-development': 'Brand Development',
  'white-label': 'White-Label Services',
  'strategy-session': 'Strategy Session',
  other: 'Other',
};

function setCors(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || 'https://landing.cochranfilms.com,https://www.cochranfilms.com,https://cochranfilms.com,http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', allowed[0] || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMessageHtml(message) {
  return escapeHtml(message).replace(/\r?\n/g, '<br />');
}

function resolveServiceLabel(value) {
  if (!value) return 'Not specified';
  return SERVICE_LABELS[value] || value.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

async function sendEmail(templateId, templateParams) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('EmailJS is not configured for contact inquiries.');
  }

  const body = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: templateParams,
  };

  if (privateKey) {
    body.accessToken = privateKey;
  }

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EmailJS failed (${response.status}): ${text}`);
  }
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const templateId = process.env.EMAILJS_CONTACT_TEMPLATE_ID;
  const notifyEmail = process.env.EMAILJS_CONTACT_TO_EMAIL || process.env.EMAILJS_ADMIN_EMAIL;

  if (!templateId) {
    console.error('EMAILJS_CONTACT_TEMPLATE_ID is not configured');
    return res.status(500).json({ error: 'Contact form is not configured. Please email info@cochranfilms.com directly.' });
  }

  if (!notifyEmail) {
    console.error('EMAILJS_CONTACT_TO_EMAIL / EMAILJS_ADMIN_EMAIL is not configured');
    return res.status(500).json({ error: 'Contact form is not configured. Please email info@cochranfilms.com directly.' });
  }

  try {
    const { name, email, service, message } = req.body || {};

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Name, email, and project details are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const inquiryId = `CF-INQ-${Date.now()}`;
    const submittedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const serviceLabel = resolveServiceLabel(service);
    const projectDetailsHtml = formatMessageHtml(message.trim());
    const projectDetailsText = message.trim();

    const baseParams = {
      customer_name: name.trim(),
      customer_email: email.trim(),
      service_interest: serviceLabel,
      project_details_html: projectDetailsHtml,
      project_details: projectDetailsText,
      inquiry_id: inquiryId,
      submitted_date: submittedDate,
      reply_to: email.trim(),
    };

    await sendEmail(templateId, {
      ...baseParams,
      to_email: notifyEmail,
      email_heading: 'New Project Inquiry',
      email_intro: 'A new message was submitted through the Cochran Films contact form.',
    });

    const sendClientCopy = process.env.EMAILJS_CONTACT_SEND_CLIENT_COPY !== 'false';
    if (sendClientCopy) {
      try {
        await sendEmail(templateId, {
          ...baseParams,
          to_email: email.trim(),
          email_heading: 'We Received Your Message',
          email_intro: 'Thank you for contacting Cochran Films. We have your inquiry and will respond within 24 hours.',
        });
      } catch (clientError) {
        console.error('Client confirmation email failed:', clientError);
      }
    }

    return res.status(200).json({ success: true, inquiryId });
  } catch (error) {
    console.error('Contact inquiry error:', error);
    return res.status(500).json({
      error: 'Unable to send your message right now. Please email info@cochranfilms.com or call (470) 420-2169.',
    });
  }
}
