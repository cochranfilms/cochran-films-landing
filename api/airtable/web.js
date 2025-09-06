// Vercel serverless function to fetch Airtable web development data
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_WEB || 'appV5l9kZ5vAxcz4e'; // Web base ID

  if (!apiKey) {
    console.error('AIRTABLE_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/Web`, {
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
    const webItems = data.records.map(record => {
      let thumbnailUrl = record.fields['Thumbnail Image'] || '';
      
      // Convert GitHub blob URLs to raw URLs for proper image display
      if (thumbnailUrl.includes('github.com') && thumbnailUrl.includes('/blob/')) {
        thumbnailUrl = thumbnailUrl.replace('/blob/', '/raw/');
      }
      
      return {
        Title: record.fields.Title || '',
        Description: record.fields.Description || '',
        Category: record.fields.Category || 'Web Development',
        'Thumbnail Image': thumbnailUrl,
        URL: record.fields.URL || '',
        'Tech Stack': record.fields['Tech Stack'] || '',
        Role: record.fields.Role || '',
        'Client/Company': record.fields['Client/Company'] || '',
        Timeline: record.fields.Timeline || '',
        Challenges: record.fields.Challenges || '',
        Results: record.fields.Results || '',
        'Is Featured': record.fields['Is Featured'] === 'TRUE' || false,
        UploadDate: record.fields.UploadDate || ''
      };
    });

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.status(200).json(webItems);
  } catch (error) {
    console.error('Error fetching web data from Airtable:', error);
    res.status(500).json({ error: 'Failed to fetch web data' });
  }
}
