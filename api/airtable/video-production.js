// Vercel API route for Video Production Airtable data
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const baseId = 'appjQxcRoClnZzghj';
    const tableName = 'Portfolio';
    
    // Get Airtable API key from environment variables
    const apiKey = process.env.AIRTABLE_API_KEY;
    
    if (!apiKey) {
      console.error('AIRTABLE_API_KEY environment variable not set');
      return res.status(500).json({ 
        error: 'Airtable API key not configured',
        message: 'Please check your Vercel environment variables'
      });
    }

    // Fetch data from Airtable
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Return the data
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Error fetching Video Production data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data from Airtable',
      message: error.message 
    });
  }
}
