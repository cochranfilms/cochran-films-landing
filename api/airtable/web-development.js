// Vercel API route for Web Development Airtable data
const fetch = global.fetch || require('node-fetch');

module.exports = async function handler(req, res) {
  // Enable CORS for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const baseId = 'appV5l9kZ5vAxcz4e';
    const tableName = 'Web';
    
    // Get Airtable API key from environment variables
    // Prefer base-specific token if provided, then fall back to global
    const apiKey = process.env.AIRTABLE_API_KEY_WEB || process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
    
    if (!apiKey) {
      console.error('AIRTABLE_API_KEY environment variable not set');
      return res.status(500).json({ 
        error: 'Airtable API key not configured',
        message: 'Please check your Vercel environment variables',
        details: 'Set AIRTABLE_API_KEY in your Vercel project settings',
        requestInfo: { baseId, tableName },
        expectedEnvVars: ['AIRTABLE_API_KEY_WEB', 'AIRTABLE_API_KEY', 'AIRTABLE_TOKEN']
      });
    }

    const tokenType = apiKey.startsWith('pat') ? 'PAT' : (apiKey.startsWith('key') ? 'legacy' : 'unknown');
    const keySource = process.env.AIRTABLE_API_KEY_WEB ? 'AIRTABLE_API_KEY_WEB' : (process.env.AIRTABLE_API_KEY ? 'AIRTABLE_API_KEY' : 'AIRTABLE_TOKEN');
    console.log(`Fetching data from Airtable: ${baseId}/${tableName} (tokenType=${tokenType}, source=${keySource})`);
    const requestInfo = { baseId, tableName, tokenType, keySource };

    // Fetch data from Airtable
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Airtable API error: ${response.status} ${response.statusText}`, errorText);
      let parsed;
      try { parsed = JSON.parse(errorText); } catch (_) { parsed = null; }
      return res.status(response.status).json({
        error: 'Airtable request failed',
        status: response.status,
        statusText: response.statusText,
        airtableError: parsed || errorText,
        endpoint: '/api/airtable/web-development',
        requestInfo
      });
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.records?.length || 0} records from Airtable`);
    
    // Return the data
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Error fetching Web Development data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data from Airtable',
      message: error.message,
      timestamp: new Date().toISOString(),
      endpoint: '/api/airtable/web-development'
    });
  }
}
