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
            // Handle thumbnail - check multiple possible field names
            let thumbnailUrl = record.fields['Thumbnail / Cover...'] || 
                              record.fields['Thumbnail Image'] || 
                              record.fields['Thumbnail'] ||
                              record.fields.thumbnailUrl || 
                              record.fields.imageUrl || 
                              record.fields['Logo URL'] || '';
            
            // Handle video URLs - check multiple possible field names
            let videoUrl = record.fields['Video URLs'] || 
                          record.fields['Video URL'] ||
                          record.fields.playbackUrl || 
                          record.fields['YouTube URL'] || '';
            
            // Extract YouTube video ID if it's a full URL
            if (videoUrl && videoUrl.includes('youtu.be/')) {
              videoUrl = videoUrl.split('youtu.be/')[1].split('?')[0];
              videoUrl = `https://www.youtube.com/embed/${videoUrl}`;
            } else if (videoUrl && videoUrl.includes('youtube.com/watch?v=')) {
              videoUrl = videoUrl.split('v=')[1].split('&')[0];
              videoUrl = `https://www.youtube.com/embed/${videoUrl}`;
            }
            
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
              URL: record.fields['Project URL'] || 
                   record.fields.URL || 
                   record.fields['Portfolio URL'] || 
                   record.fields['Website URL'] || '',
              playbackUrl: videoUrl,
              'Tech Stack': record.fields['Tech Stack'] || '',
              Role: record.fields.Role || '',
              'Client/Company': record.fields['Client/Brand Name'] || 
                               record.fields['Client/Company'] || 
                               record.fields.Client || 
                               record.fields['Brand Name'] || '',
              Timeline: record.fields.Timeline || '',
              Challenges: record.fields.Challenges || '',
              Results: record.fields['Results/Impact'] || 
                      record.fields.Results || 
                      record.fields.Impact || '',
              'Services Provided': record.fields['Services Provided'] || '',
              'Deliverables': record.fields.Deliverables || '',
              'Industry': record.fields.Industry || '',
              'Is Featured': record.fields['Is Featured'] === 'TRUE' || record.fields['Is Featured'] === true || false,
              UploadDate: record.fields.UploadDate || record.fields['Created Date'] || '',
              // Include ALL fields for comprehensive display
              _allFields: record.fields
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

