const TABLE_NAME = 'Imported table'

const CATEGORY_META = {
  'Video Production': { api: '/api/airtable/video-production' },
  'Web Development': { api: '/api/airtable/web-development' },
  'Photography': { api: '/api/airtable/photography' },
  'Brand Development': { api: '/api/airtable/brand-development' },
}

export async function fetchCategoryItems(category, limit = 6){
  const meta = CATEGORY_META[category]
  if (!meta) return []
  const resp = await fetch(`${meta.api}?limit=${encodeURIComponent(limit)}`, { cache: 'no-store' })
  if (!resp.ok) return []
  const data = await resp.json()
  const items = (data.records||[]).map(r => ({ ...r.fields, ServiceCategory: category }))
  return items
}

// 2025 Enhanced Normalization for AI-driven B2B CMS grids
function pickField(source, names){
  for (const name of names){
    if (source[name] !== undefined && source[name] !== null && String(source[name]).length>0) return source[name]
  }
  return undefined
}

function coerceArray(value){
  if (!value) return []
  if (Array.isArray(value)) return value
  return String(value).split(',').map(s=>s.trim()).filter(Boolean)
}

function deriveThumbnail(fields){
  const firstUrlFrom = (val) => {
    if (!val) return undefined
    if (typeof val === 'string') return val
    if (Array.isArray(val) && val.length){
      const first = val[0]
      if (typeof first === 'string') return first
      if (first && typeof first === 'object' && first.url) return first.url
    }
    if (typeof val === 'object' && val.url) return val.url
    return undefined
  }
  const directCandidates = [
    'Thumbnail Image','thumbnailUrl','Thumbnail','Preview','Poster','Cover','Image','image','Still','Attachments'
  ]
  for (const name of directCandidates){
    const u = firstUrlFrom(fields[name])
    if (u) return u
  }
  const muxPlaybackId = pickField(fields, ['Mux Playback ID','muxPlaybackId'])
  if (muxPlaybackId) return `https://image.mux.com/${muxPlaybackId}/thumbnail.jpg?width=1200&fit_mode=preserve` 
  const vimeo = pickField(fields, ['Vimeo','vimeo'])
  if (vimeo && typeof vimeo === 'string') return `https://vumbnail.com/${vimeo.replace(/.*\/([0-9]+).*/, '$1')}.jpg`
  return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&fit=crop'
}

function derivePlaybackUrl(fields){
  const url = pickField(fields, ['Playback URL','Video URL','Mux URL','muxUrl','playbackUrl'])
  if (url) return url
  const muxId = pickField(fields, ['Mux Playback ID','muxPlaybackId'])
  if (muxId) return `https://stream.mux.com/${muxId}.m3u8`
  const yt = pickField(fields, ['YouTube','youtube'])
  if (yt) return yt
  const vimeo = pickField(fields, ['Vimeo','vimeo'])
  if (vimeo) return vimeo
  return undefined
}

export function normalizeRecord(category, record){
  const f = record?.fields || {}
  const title = pickField(f, ['Title','Name','Project Title','Label']) || 'Untitled'
  const description = pickField(f, ['Description','Summary','Notes','About'])
  const url = pickField(f, ['URL','Link','Project URL','Live URL','Website'])
  const playbackUrl = pickField(f, ['Playback URL','Video URL','Video','Mux URL','Mux Playback URL'])
    || derivePlaybackUrl(f)
  const client = pickField(f, ['Client','Company','Brand'])
  const techStack = pickField(f, ['Tech Stack','Stack','Technologies'])
  const uploadDate = pickField(f, ['UploadDate','Date','Published','Created'])
  const featured = (f['Is Featured'] === true || f['Is Featured'] === 'true' || f['Featured'] === true)
  const tags = coerceArray(pickField(f, ['Tags','Category Tags','Keywords']))
  const realCategory = pickField(f, ['RealCategory','Category','Service Category','ServiceCategory']) || category
  const price = pickField(f, ['Price','MSRP','Budget'])

  return {
    id: record.id,
    Title: title,
    Description: description,
    URL: url,
    playbackUrl,
    Client: client,
    'Tech Stack': techStack,
    UploadDate: uploadDate,
    'Is Featured': featured,
    RealCategory: realCategory,
    Tags: tags,
    Price: price,
    thumbnailUrl: deriveThumbnail(f),
    ServiceCategory: category
  }
}

export async function fetchCategoryItemsNormalized(category, limit = 12){
  const meta = CATEGORY_META[category]
  if (!meta) return []
  const resp = await fetch(`${meta.api}?limit=${encodeURIComponent(limit)}`, { cache: 'no-store' })
  if (!resp.ok) return []
  const data = await resp.json()
  const items = (data.records||[]).map(r => normalizeRecord(category, r))
  return items
}

export async function fetchAllCategoriesNormalized(limits = { 'Video Production': 6, 'Web Development': 6, 'Photography': 6, 'Brand Development': 6 }){
  const entries = Object.keys(CATEGORY_META).map(async cat => [cat, await fetchCategoryItemsNormalized(cat, limits[cat]||6)])
  const resolved = await Promise.all(entries)
  return Object.fromEntries(resolved)
}


