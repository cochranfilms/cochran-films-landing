// API endpoint for managing user preferences with Airtable
// Handles CRUD operations for SMS compliance and opt-in/opt-out management

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { baseId, tableName } = req.body || req.query;
    
    if (!baseId || !tableName) {
      return res.status(400).json({ 
        error: 'Missing required parameters: baseId and tableName' 
      });
    }

    // Airtable API configuration
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_URL = 'https://api.airtable.com/v0';

    if (!AIRTABLE_API_KEY) {
      return res.status(500).json({ 
        error: 'Airtable API key not configured' 
      });
    }

    switch (req.method) {
      case 'POST':
        return await handleCreate(req, res, baseId, tableName, AIRTABLE_API_KEY, AIRTABLE_BASE_URL);
      
      case 'GET':
        return await handleRead(req, res, baseId, tableName, AIRTABLE_API_KEY, AIRTABLE_BASE_URL);
      
      case 'PATCH':
        return await handleUpdate(req, res, baseId, tableName, AIRTABLE_API_KEY, AIRTABLE_BASE_URL);
      
      case 'DELETE':
        return await handleDelete(req, res, baseId, tableName, AIRTABLE_API_KEY, AIRTABLE_BASE_URL);
      
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('User preferences API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// Create new user preferences
async function handleCreate(req, res, baseId, tableName, apiKey, baseUrl) {
  try {
    const { preferences } = req.body;
    
    if (!preferences || !preferences.email) {
      return res.status(400).json({ 
        error: 'Missing preferences data or email' 
      });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(baseId, tableName, preferences.email, apiKey, baseUrl);
    
    if (existingUser) {
      // Update existing user
      return await updateExistingUser(res, baseId, tableName, existingUser.id, preferences, apiKey, baseUrl);
    }

    // Create new user
    const airtableData = {
      records: [{
        fields: {
          'Email': preferences.email,
          'Name': preferences.name || '',
          'Phone': preferences.phone || '',
          'Opt Email': preferences.opt_email || false,
          'Opt Calls': preferences.opt_calls || false,
          'Opt Texts': preferences.opt_texts || false,
          'SMS Consent': preferences.sms_consent || 'no',
          'Source Form': preferences.source_form || '',
          'Status': preferences.status || 'active',
          'Submitted At': preferences.submitted_at || new Date().toISOString(),
          'Last Updated': new Date().toISOString()
        }
      }]
    };

    const response = await fetch(`${baseUrl}/${baseId}/${encodeURIComponent(tableName)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(airtableData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Airtable API error: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    
    return res.status(201).json({
      success: true,
      message: 'User preferences created successfully',
      recordId: result.records[0].id,
      preferences: preferences
    });

  } catch (error) {
    console.error('Create preferences error:', error);
    return res.status(500).json({ 
      error: 'Failed to create preferences',
      details: error.message 
    });
  }
}

// Read user preferences
async function handleRead(req, res, baseId, tableName, apiKey, baseUrl) {
  try {
    const { email, type } = req.query;
    
    if (email) {
      // Get specific user preferences
      const userPrefs = await findUserByEmail(baseId, tableName, email, apiKey, baseUrl);
      
      if (!userPrefs) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }
      
      return res.status(200).json({
        success: true,
        preferences: userPrefs
      });
    }
    
    if (type) {
      // Get all active subscribers for a specific communication type
      const subscribers = await getActiveSubscribers(baseId, tableName, type, apiKey, baseUrl);
      
      return res.status(200).json({
        success: true,
        subscribers: subscribers,
        count: subscribers.length
      });
    }
    
    // Get all users (with pagination)
    const allUsers = await getAllUsers(baseId, tableName, apiKey, baseUrl);
    
    return res.status(200).json({
      success: true,
      users: allUsers,
      count: allUsers.length
    });

  } catch (error) {
    console.error('Read preferences error:', error);
    return res.status(500).json({ 
      error: 'Failed to read preferences',
      details: error.message 
    });
  }
}

// Update user preferences
async function handleUpdate(req, res, baseId, tableName, apiKey, baseUrl) {
  try {
    const { email, updates } = req.body;
    
    if (!email || !updates) {
      return res.status(400).json({ 
        error: 'Missing email or updates' 
      });
    }

    const existingUser = await findUserByEmail(baseId, tableName, email, apiKey, baseUrl);
    
    if (!existingUser) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    const result = await updateExistingUser(res, baseId, tableName, existingUser.id, updates, apiKey, baseUrl);
    return result;

  } catch (error) {
    console.error('Update preferences error:', error);
    return res.status(500).json({ 
      error: 'Failed to update preferences',
      details: error.message 
    });
  }
}

// Delete user preferences
async function handleDelete(req, res, baseId, tableName, apiKey, baseUrl) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Missing email' 
      });
    }

    const existingUser = await findUserByEmail(baseId, tableName, email, apiKey, baseUrl);
    
    if (!existingUser) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    const response = await fetch(`${baseUrl}/${baseId}/${encodeURIComponent(tableName)}/${existingUser.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.statusText}`);
    }

    return res.status(200).json({
      success: true,
      message: 'User preferences deleted successfully'
    });

  } catch (error) {
    console.error('Delete preferences error:', error);
    return res.status(500).json({ 
      error: 'Failed to delete preferences',
      details: error.message 
    });
  }
}

// Helper functions
async function findUserByEmail(baseId, tableName, email, apiKey, baseUrl) {
  const filterFormula = `{Email} = '${email}'`;
  const url = `${baseUrl}/${baseId}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(filterFormula)}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to search user: ${response.statusText}`);
  }

  const data = await response.json();
  return data.records.length > 0 ? data.records[0] : null;
}

async function updateExistingUser(res, baseId, tableName, recordId, updates, apiKey, baseUrl) {
  const airtableData = {
    fields: {
      ...updates,
      'Last Updated': new Date().toISOString()
    }
  };

  const response = await fetch(`${baseUrl}/${baseId}/${encodeURIComponent(tableName)}/${recordId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(airtableData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to update user: ${errorData.error?.message || response.statusText}`);
  }

  const result = await response.json();
  
  return res.status(200).json({
    success: true,
    message: 'User preferences updated successfully',
    recordId: result.id,
    updates: updates
  });
}

async function getActiveSubscribers(baseId, tableName, type, apiKey, baseUrl) {
  let filterFormula = `{Status} = 'active'`;
  
  switch (type) {
    case 'email':
      filterFormula += ` AND {Opt Email} = 1`;
      break;
    case 'calls':
      filterFormula += ` AND {Opt Calls} = 1`;
      break;
    case 'texts':
      filterFormula += ` AND {Opt Texts} = 1 AND {SMS Consent} = 'yes'`;
      break;
  }

  const url = `${baseUrl}/${baseId}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(filterFormula)}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get subscribers: ${response.statusText}`);
  }

  const data = await response.json();
  return data.records || [];
}

async function getAllUsers(baseId, tableName, apiKey, baseUrl) {
  const url = `${baseUrl}/${baseId}/${encodeURIComponent(tableName)}?maxRecords=100`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get users: ${response.statusText}`);
  }

  const data = await response.json();
  return data.records || [];
}
