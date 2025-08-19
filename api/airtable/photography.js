// Vercel API route for Photography Airtable data
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
    const baseId = 'appP1uFoRWjxPkQ5b';
    const tableName = 'Photos';
    
    // Get Airtable API key from environment variables
    const apiKey = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
    
    if (!apiKey) {
      console.error('AIRTABLE_API_KEY environment variable not set');
      return res.status(500).json({ 
        error: 'Airtable API key not configured',
        message: 'Please check your Vercel environment variables',
        details: 'Set AIRTABLE_API_KEY in your Vercel project settings'
      });
    }

    console.log(`Fetching data from Airtable: ${baseId}/${tableName}`);

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
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.records?.length || 0} records from Airtable`);
    
    // Return the data
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Error fetching Photography data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data from Airtable',
      message: error.message,
      timestamp: new Date().toISOString(),
      endpoint: '/api/airtable/photography'
    });
  }
}
