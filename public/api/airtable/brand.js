// Vercel serverless function to fetch Airtable brand development data
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_BRAND;

  if (!apiKey) {
    console.error('AIRTABLE_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!baseId) {
    console.error('AIRTABLE_BASE_BRAND environment variable is not set');
    return res.status(500).json({ error: 'Brand base configuration missing' });
  }

  try {
    // Try common table names for brand data
    let brandItems = [];
    const possibleTableNames = ['Brand', 'Brand Development', 'Brands', 'Portfolio'];
    
    for (const tableName of possibleTableNames) {
      try {
        const response = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Transform Airtable records to expected format
          brandItems = data.records.map(record => {
            let thumbnailUrl = record.fields['Thumbnail Image'] || record.fields.thumbnailUrl || record.fields.imageUrl || '';
            
            // Convert GitHub blob URLs to raw URLs for proper image display
            if (thumbnailUrl.includes('github.com') && thumbnailUrl.includes('/blob/')) {
              thumbnailUrl = thumbnailUrl.replace('/blob/', '/raw/');
            }
            
            return {
              Title: record.fields.Title || record.fields.Name || '',
              Description: record.fields.Description || '',
              Category: 'Brand Development',
              ServiceCategory: 'Brand Development',
              'Thumbnail Image': thumbnailUrl,
              imageUrl: thumbnailUrl,
              URL: record.fields.URL || record.fields['Portfolio URL'] || '',
              playbackUrl: record.fields.playbackUrl || record.fields['Video URL'] || '',
              'Tech Stack': record.fields['Tech Stack'] || '',
              Role: record.fields.Role || '',
              'Client/Company': record.fields['Client/Company'] || record.fields.Client || '',
              Timeline: record.fields.Timeline || '',
              Challenges: record.fields.Challenges || '',
              Results: record.fields.Results || '',
              'Is Featured': record.fields['Is Featured'] === 'TRUE' || record.fields['Is Featured'] === true || false,
              UploadDate: record.fields.UploadDate || record.fields['Created Date'] || ''
            };
          });
          
          // Found the table, break out of loop
          break;
        }
      } catch (tableError) {
        // Continue to next table name if this one fails
        console.log(`Table "${tableName}" not found, trying next...`);
      }
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.status(200).json(brandItems);
  } catch (error) {
    console.error('Error fetching brand data from Airtable:', error);
    res.status(500).json({ error: 'Failed to fetch brand data' });
  }
}

