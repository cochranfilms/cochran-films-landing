const TABLE_NAME = 'Imported table'

const CATEGORY_META = {
  'Video Production': { baseId: 'appjQxcRoClnZzghj', keyEnv: ['AIRTABLE_API_KEY_VIDEO','AIRTABLE_API_KEY','AIRTABLE_TOKEN'] },
  'Web Development': { baseId: 'appV5l9kZ5vAxcz4e', keyEnv: ['AIRTABLE_API_KEY_WEB','AIRTABLE_API_KEY','AIRTABLE_TOKEN'] },
  'Photography': { baseId: 'appP1uFoRWjxPkQ5b', keyEnv: ['AIRTABLE_API_KEY_PHOTOGRAPHY','AIRTABLE_API_KEY','AIRTABLE_TOKEN'] },
  'Brand Development': { baseId: 'appk9HCj1kWzK1JzQ', keyEnv: ['AIRTABLE_API_KEY_BRAND','AIRTABLE_API_KEY','AIRTABLE_TOKEN'] },
}

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


