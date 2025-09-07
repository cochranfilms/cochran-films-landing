// Vercel serverless function to fetch Airtable photography data
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_PHOTOS || 'appP1uFoRWjxPkQ5b'; // Photos base ID

  if (!apiKey) {
    console.error('AIRTABLE_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/Photos`, {
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
    const photoItems = data.records.map(record => {
      const imageUrl = record.fields.image_url || '';
      let title = record.fields.Title || '';
      
      // Generate title from filename if no title provided
      if (!title && imageUrl) {
        const filename = imageUrl.split('/').pop().split('.')[0];
        // Clean up filename and make it title case
        title = filename
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      }
      
      return {
        Title: title || 'Untitled Photo',
        Description: record.fields.Description || '',
        Category: 'Photography',
        'Thumbnail Image': imageUrl,
        imageUrl: imageUrl,
        UploadDate: record.fields.UploadDate || '',
        ServiceCategory: 'Photography'
      };
    });

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.status(200).json(photoItems);
  } catch (error) {
    console.error('Error fetching photos from Airtable:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
}
