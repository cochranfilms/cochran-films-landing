// Vercel API route for unified Portfolio data from all Airtable bases
// This endpoint consolidates 3 separate API calls into 1 for better performance

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
    console.log('🚀 Unified Portfolio API called - fetching from all Airtable bases...');
    const startTime = Date.now();

    // Airtable configuration for all four bases
    const airtableConfigs = [
      {
        name: 'Video Production',
        baseId: 'appjQxcRoClnZzghj',
        tableName: 'Imported table',
        category: 'Video Production'
      },
      {
        name: 'Web Development',
        baseId: 'appV5l9kZ5vAxcz4e',
        tableName: 'Imported table',
        category: 'Web Development'
      },
      {
        name: 'Photography',
        baseId: 'appP1uFoRWjxPkQ5b',
        tableName: 'Imported table',
        category: 'Photography'
      },
      {
        name: 'Brand Development',
        baseId: 'app9HS0yNn6uyFmJF',
        tableName: 'Imported table',  // Changed from 'Brand' to match pattern
        category: 'Brand Development'
      }
    ];

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

    // Fetch data from all Airtable bases in parallel
    const fetchPromises = airtableConfigs.map(async (config) => {
      try {
        console.log(`📥 Fetching ${config.name} data from base ${config.baseId}...`);
        
        const response = await fetch(`https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableName)}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ ${config.name} API error: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`${config.name} failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ ${config.name}: ${data.records?.length || 0} records fetched`);
        
        return {
          category: config.category,
          data: data,
          recordCount: data.records?.length || 0,
          success: true
        };

      } catch (error) {
        console.error(`❌ Error fetching ${config.name} data:`, error);
        return {
          category: config.category,
          error: error.message,
          success: false
        };
      }
    });

    // Wait for all fetches to complete
    const results = await Promise.all(fetchPromises);
    
    // Process results and build unified response
    const unifiedData = {};
    const errors = [];
    let totalRecords = 0;
    
    results.forEach(result => {
      console.log(`📊 Processing result for ${result.category}:`, {
        success: result.success,
        recordCount: result.recordCount,
        error: result.error
      });
      
      if (result.success) {
        unifiedData[result.category] = result.data;
        totalRecords += result.recordCount;
      } else {
        errors.push(`${result.category}: ${result.error}`);
        console.error(`❌ Failed to fetch ${result.category}:`, result.error);
      }
    });

    const totalTime = Date.now() - startTime;
    
    // Build response with metadata
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      totalRecords: totalRecords,
      categories: Object.keys(unifiedData),
      fetchTime: `${totalTime}ms`,
      data: unifiedData,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log(`🎉 Unified Portfolio API completed in ${totalTime}ms`);
    console.log(`   Total records: ${totalRecords}`);
    console.log(`   Categories: ${Object.keys(unifiedData).join(', ')}`);
    if (errors.length > 0) {
      console.log(`   Errors: ${errors.join('; ')}`);
    }

    // Return unified data
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Unified Portfolio API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch unified portfolio data',
      message: error.message,
      timestamp: new Date().toISOString(),
      endpoint: '/api/airtable/portfolio'
    });
  }
};
