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

const MIN_FORM_TIME_MS = 3000;
const MAX_FORM_TIME_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_MESSAGE_LENGTH = 12;

function logSpam(reason, details = {}) {
  console.warn('[contact-spam]', reason, details);
}

function fakeInquiryId() {
  return `CF-INQ-${Date.now()}`;
}

function looksLikeGibberish(text) {
  const value = String(text || '').trim();
  if (!value) return false;

  const letters = value.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 5) return false;

  const vowels = (letters.match(/[aeiouAEIOU]/g) || []).length;
  const vowelRatio = vowels / letters.length;

  if (letters.length >= 8 && vowelRatio < 0.15) return true;
  if (letters.length >= 5 && vowels === 0) return true;

  let caseTransitions = 0;
  for (let i = 1; i < letters.length; i += 1) {
    const prevUpper = letters[i - 1] === letters[i - 1].toUpperCase() && letters[i - 1] !== letters[i - 1].toLowerCase();
    const currUpper = letters[i] === letters[i].toUpperCase() && letters[i] !== letters[i].toLowerCase();
    if (prevUpper !== currUpper) caseTransitions += 1;
  }

  const transitionRatio = caseTransitions / Math.max(letters.length - 1, 1);
  if (letters.length >= 12 && transitionRatio > 0.35 && vowelRatio < 0.35) return true;
  if (value.length >= 12 && !/\s/.test(value) && vowelRatio < 0.32) return true;

  return false;
}

function isSubmitTimingValid(formLoadedAt) {
  const loaded = Number(formLoadedAt);
  if (!Number.isFinite(loaded) || loaded <= 0) return false;
  const elapsed = Date.now() - loaded;
  return elapsed >= MIN_FORM_TIME_MS && elapsed <= MAX_FORM_TIME_MS;
}

function assessContactSpam({ companyWebsite, formLoadedAt, customerFirst, customerLast, customerName, message }) {
  if (String(companyWebsite || '').trim()) {
    return { silent: true, reason: 'honeypot' };
  }

  if (!isSubmitTimingValid(formLoadedAt)) {
    return { silent: true, reason: 'timing' };
  }

  const nameFields = [customerFirst, customerLast, customerName].filter(Boolean);
  if (nameFields.some((name) => looksLikeGibberish(name))) {
    return { silent: true, reason: 'gibberish-name' };
  }

  const trimmedMessage = String(message || '').trim();
  if (looksLikeGibberish(trimmedMessage)) {
    return { silent: true, reason: 'gibberish-message' };
  }

  if (trimmedMessage.length < MIN_MESSAGE_LENGTH) {
    return {
      silent: false,
      reason: 'short-message',
      error: 'Please share a bit more detail about your project (at least a sentence or two).',
    };
  }

  if (trimmedMessage.length >= 20 && !/\s/.test(trimmedMessage)) {
    return { silent: true, reason: 'message-no-spaces' };
  }

  return null;
}

function allowedOrigins() {
  const allowed = (process.env.ALLOWED_ORIGINS || 'https://www.cochranfilms.com,https://cochranfilms.com,https://landing.cochranfilms.com,http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (process.env.VERCEL_ENV !== 'production') {
    ['http://localhost:4008', 'http://127.0.0.1:4008'].forEach((origin) => {
      if (!allowed.includes(origin)) allowed.push(origin);
    });
  }
  return allowed;
}

function setCors(req, res) {
  const allowed = allowedOrigins();
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
  const rosterAdminTemplateId = process.env.EMAILJS_ROSTER_ADMIN_TEMPLATE_ID;
  const rosterClientTemplateId = process.env.EMAILJS_ROSTER_CLIENT_TEMPLATE_ID;
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
    const {
      name,
      firstName,
      lastName,
      email,
      service,
      message,
      companyWebsite,
      formLoadedAt,
      source,
      city,
      role,
      portfolioUrl,
      availability,
    } = req.body || {};

    const customerFirst = String(firstName || '').trim();
    const customerLast = String(lastName || '').trim();
    const customerName =
      String(name || '').trim() ||
      [customerFirst, customerLast].filter(Boolean).join(' ');

    const isRoster = source === 'careers-roster';
    const isJournal = source === 'journal' || /journal list/i.test(String(message || ''));
    const recordSource = isRoster ? 'roster' : isJournal ? 'journal' : 'contact';
    const rosterRole = String(role || '').trim();
    const rosterCity = String(city || '').trim();
    const rosterPortfolio = String(portfolioUrl || '').trim();
    const rosterAvailability = String(availability || '').trim();
    const rosterRoles = ['Videographer', 'Editor', 'Photographer', 'Developer'];

    let outboundMessage = String(message || '').trim();
    if (isRoster) {
      outboundMessage = [
        'Crew roster request from the careers page.',
        rosterCity ? `City: ${rosterCity}` : '',
        rosterRole ? `Role: ${rosterRole}` : '',
        rosterPortfolio ? `Portfolio: ${rosterPortfolio}` : '',
        rosterAvailability ? `Availability: ${rosterAvailability}` : '',
      ].filter(Boolean).join('\n');
    }

    const spamCheck = assessContactSpam({
      companyWebsite,
      formLoadedAt,
      customerFirst,
      customerLast,
      customerName,
      message: outboundMessage,
    });

    if (spamCheck) {
      logSpam(spamCheck.reason, {
        email: email?.trim(),
        customerName,
      });
      if (spamCheck.silent) {
        return res.status(200).json({ success: true, inquiryId: fakeInquiryId() });
      }
      return res.status(400).json({ error: spamCheck.error });
    }

    if (isRoster) {
      if (!rosterCity || !rosterRole || !rosterPortfolio || !rosterAvailability) {
        return res.status(400).json({ error: 'City, role, portfolio, and availability are required.' });
      }
      if (!rosterRoles.includes(rosterRole)) {
        return res.status(400).json({ error: 'Choose a role from the list.' });
      }
    }

    if (!customerName || !email?.trim() || !outboundMessage) {
      return res.status(400).json({ error: 'First name, last name, email, and project details are required.' });
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
    const serviceLabel = isRoster ? rosterRole : resolveServiceLabel(service);
    const projectDetailsHtml = formatMessageHtml(outboundMessage);
    const projectDetailsText = outboundMessage;

    const baseParams = {
      customer_name: customerName,
      customer_first_name: customerFirst,
      customer_last_name: customerLast,
      customer_email: email.trim(),
      service_interest: serviceLabel,
      project_details_html: projectDetailsHtml,
      project_details: projectDetailsText,
      inquiry_id: inquiryId,
      submitted_date: submittedDate,
      reply_to: email.trim(),
    };

    const replyMailto = `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(`Re: Cochran Films Inquiry ${inquiryId}`)}`;
    const rosterParams = isRoster
      ? {
          roster_role: rosterRole,
          roster_city: rosterCity,
          roster_portfolio: rosterPortfolio,
          roster_availability: rosterAvailability,
        }
      : {};

    await sendEmail(isRoster && rosterAdminTemplateId ? rosterAdminTemplateId : templateId, {
      ...baseParams,
      ...rosterParams,
      to_email: notifyEmail,
      email_heading: isRoster ? 'Crew Roster Request' : 'New Project Inquiry',
      email_intro: isRoster
        ? 'A creator asked to join the Cochran Films freelance roster from the careers page.'
        : 'A new message was submitted through the Cochran Films contact form.',
      cta_label: `Reply to ${customerName}`,
      cta_url: replyMailto,
      cta_subtext: 'Average response time: within 24 hours',
    });

    const sendClientCopy = process.env.EMAILJS_CONTACT_SEND_CLIENT_COPY !== 'false';
    if (sendClientCopy) {
      try {
        await sendEmail(isRoster && rosterClientTemplateId ? rosterClientTemplateId : templateId, {
          ...baseParams,
          ...rosterParams,
          to_email: email.trim(),
          ...(isRoster ? { reply_to: 'info@cochranfilms.com' } : {}),
          email_heading: isRoster ? 'You are on the roster' : 'We Received Your Message',
          email_intro: isRoster
            ? 'You are on the Cochran Films roster. Every open role, including work with the studio, is posted on Creator Collective. Create your account so the job board can notify you when a role is available.'
            : 'Thank you for contacting Cochran Films. We have your inquiry and will respond within 24 hours.',
          cta_label: isRoster ? 'Join Creator Collective' : 'Explore Our Services',
          cta_url: isRoster
            ? 'https://www.creatorcollective.media/signup?utm_source=cochranfilms&utm_medium=email&utm_campaign=roster-client'
            : 'https://www.cochranfilms.com/#services',
          cta_subtext: isRoster
            ? 'The live job board is on Creator Collective.'
            : 'Questions? Call (470) 420-2169 or email info@cochranfilms.com',
        });
      } catch (clientError) {
        console.error('Client confirmation email failed:', clientError);
      }
    }

    try {
      const { appendInquiry } = require('../admin/lib/store');
      await appendInquiry({
        id: inquiryId,
        source: recordSource,
        name: customerName,
        email: email.trim(),
        phone: '',
        service: serviceLabel,
        message: outboundMessage,
        city: isRoster ? rosterCity : '',
        role: isRoster ? rosterRole : '',
        portfolio: isRoster ? rosterPortfolio : '',
        availability: isRoster ? rosterAvailability : '',
        status: 'new',
        submittedAt: new Date().toISOString(),
      });
    } catch (storeError) {
      console.error('Inquiry log failed:', storeError);
    }

    return res.status(200).json({ success: true, inquiryId });
  } catch (error) {
    console.error('Contact inquiry error:', error);
    return res.status(500).json({
      error: 'Unable to send your message right now. Please email info@cochranfilms.com or call (470) 420-2169.',
    });
  }
}
