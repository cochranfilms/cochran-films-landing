// Unified portfolio API endpoint for AirtableCMS
const AIRTABLE_CONFIG = require('../../../../airtable.config.js');

const CATEGORY_META = {
  'Video Production': { 
    baseId: AIRTABLE_CONFIG.BASES['Video Production'], 
    keyEnv: ['AIRTABLE_API_KEY_VIDEO','AIRTABLE_API_KEY','AIRTABLE_TOKEN'] 
  },
  'Web Development': { 
    baseId: AIRTABLE_CONFIG.BASES['Web Development'], 
    keyEnv: ['AIRTABLE_API_KEY_WEB','AIRTABLE_API_KEY','AIRTABLE_TOKEN'] 
  },
  'Photography': { 
    baseId: AIRTABLE_CONFIG.BASES['Photography'], 
    keyEnv: ['AIRTABLE_API_KEY_PHOTOGRAPHY','AIRTABLE_API_KEY','AIRTABLE_TOKEN'] 
  },
  'Brand Development': { 
    baseId: AIRTABLE_CONFIG.BASES['Brand Development'], 
    keyEnv: ['AIRTABLE_API_KEY_BRAND','AIRTABLE_API_KEY','AIRTABLE_TOKEN'] 
  },
};

function resolveApiKey(keys) {
  for (const name of keys) {
    if (process.env[name]) return process.env[name];
  }
  return null;
}

async function fetchCategoryData(category, limit = 100) {
  const meta = CATEGORY_META[category];
  if (!meta) return { records: [] };
  
  const token = resolveApiKey(meta.keyEnv);
  if (!token) return { records: [] };
  
  const url = `https://api.airtable.com/v0/${meta.baseId}/${encodeURIComponent(AIRTABLE_CONFIG.TABLE_NAME)}?pageSize=${limit}`;
  
  try {
    const resp = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!resp.ok) {
      console.error(`Failed to fetch ${category}:`, resp.status, resp.statusText);
      return { records: [] };
    }
    
    const data = await resp.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${category}:`, error);
    return { records: [] };
  }
}

export async function GET() {
  try {
    // Fetch all categories in parallel
    const [videoData, webData, photoData, brandData] = await Promise.all([
      fetchCategoryData('Video Production'),
      fetchCategoryData('Web Development'), 
      fetchCategoryData('Photography'),
      fetchCategoryData('Brand Development')
    ]);

    const response = {
      data: {
        'Video Production': videoData,
        'Web Development': webData,
        'Photography': photoData,
        'Brand Development': brandData
      },
      errors: []
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('Portfolio API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch portfolio data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
