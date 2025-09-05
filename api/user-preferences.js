// Vercel API route for User Preferences CMS Collection
const fetch = global.fetch || require('node-fetch');

module.exports = async function handler(req, res) {
  // Enable CORS for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    return handleUserPreferenceSubmission(req, res);
  }

  if (req.method === 'GET') {
    return handleUserPreferenceRetrieval(req, res);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleUserPreferenceSubmission(req, res) {
  try {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.email || !userData.name) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and name are required',
        required: ['email', 'name']
      });
    }

    // Get Airtable API key from environment variables
    const apiKey = process.env.AIRTABLE_API_KEY;
    
    if (!apiKey) {
      console.error('AIRTABLE_API_KEY environment variable not set');
      return res.status(500).json({ 
        error: 'Airtable API key not configured',
        message: 'Please check your Vercel environment variables'
      });
    }

    // User Preferences base ID and table name
    const baseId = process.env.AIRTABLE_BASE_USER_PREFERENCES || 'appXjhRWId71m6xGe';
    const tableName = 'User Preferences';
    
    // Prepare data for Airtable
    const airtableRecord = {
      fields: {
        'Name': userData.name,
        'Email': userData.email,
        'Phone': userData.phone || '',
        'Company': userData.company || '',
        'Service Interest': userData.serviceInterest || '',
        'Project Details': userData.projectDetails || '',
        'Budget Range': userData.budgetRange || '',
        'Timeline': userData.timeline || '',
        'Source': userData.source || 'Website Form',
        'Form Type': userData.formType || 'General Contact',
        'Submission Date': new Date().toISOString(),
        'Status': 'New Lead',
        'Notes': userData.notes || '',
        'Marketing Consent': userData.marketingConsent || false,
        'Preferred Contact Method': userData.preferredContact || 'Email'
      }
    };

    // Add to Airtable
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [airtableRecord]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Airtable API error: ${response.status} ${response.statusText}`, errorText);
      
      return res.status(response.status).json({
        error: 'Failed to save user preference',
        status: response.status,
        statusText: response.statusText,
        airtableError: errorText
      });
    }

    const result = await response.json();
    console.log(`✅ User preference saved to Airtable: ${userData.email}`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'User preference saved successfully',
      recordId: result.records?.[0]?.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error saving user preference:', error);
    res.status(500).json({ 
      error: 'Failed to save user preference',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function handleUserPreferenceRetrieval(req, res) {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email parameter required',
        message: 'Please provide an email address to retrieve preferences'
      });
    }

    // Get Airtable API key from environment variables
    const apiKey = process.env.AIRTABLE_API_KEY;
    
    if (!apiKey) {
      console.error('AIRTABLE_API_KEY environment variable not set');
      return res.status(500).json({ 
        error: 'Airtable API key not configured',
        message: 'Please check your Vercel environment variables'
      });
    }

    // User Preferences base ID and table name
    const baseId = process.env.AIRTABLE_BASE_USER_PREFERENCES || 'appXjhRWId71m6xGe';
    const tableName = 'User Preferences';
    
    // Query Airtable for user preferences
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(`{Email}='${email}'`)}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Airtable API error: ${response.status} ${response.statusText}`, errorText);
      
      return res.status(response.status).json({
        error: 'Failed to retrieve user preferences',
        status: response.status,
        statusText: response.statusText,
        airtableError: errorText
      });
    }

    const result = await response.json();
    const userPreferences = result.records?.[0]?.fields || null;

    if (!userPreferences) {
      return res.status(404).json({
        message: 'No preferences found for this email',
        email: email
      });
    }

    console.log(`✅ User preferences retrieved: ${email}`);

    // Return user preferences
    res.status(200).json({
      success: true,
      preferences: userPreferences,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error retrieving user preferences:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve user preferences',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
