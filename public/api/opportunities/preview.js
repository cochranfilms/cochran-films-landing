const UPSTREAM = 'https://www.creatorcollective.media/api/opportunities/list?limit=4';
const BOARD = 'https://www.creatorcollective.media/opportunities';
const ID_OK = /^[A-Za-z0-9_-]{1,128}$/;

function clean(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function dollars(cents) {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function payLabel(job) {
  if (job.compensationType === 'range') {
    const min = dollars(job.compensationRangeMin);
    const max = dollars(job.compensationRangeMax);
    if (min && max) return `${min} to ${max}`;
  }
  if (job.compensationType === 'hourly') {
    const hourly = dollars(job.compensationHourly);
    if (hourly) return `${hourly} an hour`;
  }
  if (job.compensationType === 'total') {
    const total = dollars(job.compensationTotal);
    if (total) return total;
  }
  return dollars(job.amount);
}

function postedLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function toPreview(job) {
  const id = clean(job && job.id, 128);
  const title = clean(job && job.title, 140);
  if (!ID_OK.test(id) || !title) return null;
  return {
    id,
    title,
    location: clean(job.location, 120),
    type: clean(job.type, 40),
    pay: payLabel(job),
    postedLabel: postedLabel(job.posted),
    href: `${BOARD}/${encodeURIComponent(id)}`,
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, jobs: [], board: BOARD });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(UPSTREAM, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CochranFilmsCareers/1.0',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return res.status(502).json({ ok: false, jobs: [], board: BOARD });
    }

    const body = await response.json();
    const jobs = Array.isArray(body.jobs) ? body.jobs.map(toPreview).filter(Boolean).slice(0, 4) : [];
    return res.status(200).json({ ok: true, jobs, board: BOARD });
  } catch (error) {
    console.error('Creator Collective opportunities preview failed:', error);
    return res.status(502).json({ ok: false, jobs: [], board: BOARD });
  } finally {
    clearTimeout(timer);
  }
}
