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


