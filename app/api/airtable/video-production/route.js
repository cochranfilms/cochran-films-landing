const AIRTABLE_CONFIG = require('../../../../airtable.config.js');

export async function GET() {
  const baseId = AIRTABLE_CONFIG.BASES['Video Production'];
  const tableName = AIRTABLE_CONFIG.TABLE_NAME;
  const apiKey = process.env.AIRTABLE_API_KEY_VIDEO || process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Airtable API key not configured' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const resp = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch from Airtable' }), {
        status: resp.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('Video Production API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}