import config from '../../airtable.config.js'

const TABLE_NAME = config?.TABLE_NAME || 'Imported table'

const CATEGORY_META = Object.entries(config?.BASES || {}).reduce((acc, [category, baseId]) => {
  const envKeyMap = {
    'Video Production': ['AIRTABLE_API_KEY_VIDEO','AIRTABLE_API_KEY','AIRTABLE_TOKEN'],
    'Web Development': ['AIRTABLE_API_KEY_WEB','AIRTABLE_API_KEY','AIRTABLE_TOKEN'],
    'Photography': ['AIRTABLE_API_KEY_PHOTOGRAPHY','AIRTABLE_API_KEY','AIRTABLE_TOKEN'],
    'Brand Development': ['AIRTABLE_API_KEY_BRAND','AIRTABLE_API_KEY','AIRTABLE_TOKEN']
  }
  acc[category] = { baseId, keyEnv: envKeyMap[category] || ['AIRTABLE_API_KEY','AIRTABLE_TOKEN'] }
  return acc
}, {})

function resolveApiKey(keys){
  for (const name of keys){ if (process.env[name]) return process.env[name] }
  return null
}

export async function fetchCategoryItems(category, limit = 6){
  const meta = CATEGORY_META[category]
  if (!meta) return []
  const token = resolveApiKey(meta.keyEnv)
  if (!token) return []
  const url = `https://api.airtable.com/v0/${meta.baseId}/${encodeURIComponent(TABLE_NAME)}?pageSize=${limit}`
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, cache: 'no-store' })
  if (!resp.ok) return []
  const data = await resp.json()
  const items = (data.records||[]).map(r => ({ ...r.fields, ServiceCategory: category }))
  return items
}


