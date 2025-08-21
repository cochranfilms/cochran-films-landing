// Vercel API route for Brand Development data from Airtable
// This endpoint fetches brand development portfolio items

const fetch = global.fetch || require('node-fetch');

module.exports = async function handler(req, res) {
  // Enable CORS for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=1800'); // 30 minutes cache

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🚀 Brand Development API called - fetching from Airtable...');
    const startTime = Date.now();

    // Airtable configuration for Brand Development base
    const airtableConfig = {
      name: 'Brand Development',
      baseId: 'app9HS0yNn6uyFmJF',
      tableName: 'Brand',
      category: 'Brand Development'
    };

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

    console.log(`🔑 Using API key: ${apiKey.substring(0, 8)}...`);
    console.log(`📥 Fetching ${airtableConfig.name} data from base ${airtableConfig.baseId}...`);
    console.log(`🔗 API URL: https://api.airtable.com/v0/${airtableConfig.baseId}/${encodeURIComponent(airtableConfig.tableName)}`);
    
    const response = await fetch(`https://api.airtable.com/v0/${airtableConfig.baseId}/${encodeURIComponent(airtableConfig.tableName)}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ${airtableConfig.name} API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`${airtableConfig.name} failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    
    console.log(`✅ ${airtableConfig.name}: ${data.records?.length || 0} records fetched in ${totalTime}ms`);
    
    // Build response with metadata
    const responseData = {
      success: true,
      timestamp: new Date().toISOString(),
      category: airtableConfig.category,
      recordCount: data.records?.length || 0,
      fetchTime: `${totalTime}ms`,
      data: data
    };

    // Return brand development data
    res.status(200).json(responseData);
    
  } catch (error) {
    console.error('❌ Brand Development API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch brand development data',
      message: error.message,
      timestamp: new Date().toISOString(),
      endpoint: '/api/airtable/brand-development'
    });
  }
};
