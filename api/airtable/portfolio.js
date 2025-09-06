// Vercel serverless function to fetch Airtable portfolio data
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get environment variables
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_PORTFOLIO;
    
    if (!apiKey || !baseId) {
      console.error('Missing Airtable environment variables');
      return res.status(500).json({ error: 'Airtable configuration missing' });
    }

    // Fetch data from Airtable
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/Portfolio`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Airtable records to expected format
    const portfolioItems = data.records.map(record => ({
      Title: record.fields.Title || '',
      Description: record.fields.Description || '',
      Category: record.fields.Category || 'Video Production',
      'Thumbnail Image': record.fields['Thumbnail Image']?.[0]?.url || '',
      playbackUrl: record.fields.playbackUrl || '',
      UploadDate: record.fields.UploadDate || '',
      URL: record.fields.URL || '',
      ServiceCategory: record.fields.ServiceCategory || record.fields.Category || 'Video Production',
      'Is Featured': record.fields['Is Featured'] || false
    }));

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return res.status(200).json(portfolioItems);

  } catch (error) {
    console.error('Airtable API error:', error);
    return res.status(500).json({ error: 'Failed to fetch portfolio data' });
  }
}
