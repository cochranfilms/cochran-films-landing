// Field Mapping Utility - Shows all available fields from Airtable
// This helps understand what fields exist in each table

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const { base, table } = req.query;

  if (!apiKey || !base || !table) {
    return res.status(400).json({ error: 'Missing required parameters: base, table' });
  }

  try {
    // Fetch a single record to see all available fields
    const response = await fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}?maxRecords=1`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract all field names from the first record
    const fields = data.records.length > 0 
      ? Object.keys(data.records[0].fields)
      : [];
    
    // Get field types by examining values
    const fieldInfo = fields.map(fieldName => {
      const value = data.records[0]?.fields[fieldName];
      let type = 'text';
      let sample = null;
      
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          type = 'array';
          sample = value.length > 0 ? value[0] : null;
        } else if (typeof value === 'string') {
          if (value.match(/^https?:\/\//)) {
            type = 'url';
          } else if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
            type = 'date';
          } else {
            type = 'text';
          }
          sample = value.substring(0, 100);
        } else if (typeof value === 'number') {
          type = 'number';
          sample = value;
        } else if (typeof value === 'boolean') {
          type = 'boolean';
          sample = value;
        }
      }
      
      return {
        name: fieldName,
        type: type,
        sample: sample
      };
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return res.status(200).json({
      base: base,
      table: table,
      totalRecords: data.records.length,
      fields: fieldInfo,
      sampleRecord: data.records[0] || null
    });

  } catch (error) {
    console.error('Error fetching field mapping:', error);
    return res.status(500).json({ error: 'Failed to fetch field mapping' });
  }
}

