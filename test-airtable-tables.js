// Test script to discover Airtable table names
const fetch = require('node-fetch');

async function testAirtableTables() {
  const bases = {
    'Video Production': 'appjQxcRoClnZzghj',
    'Web Development': 'appV5l9kZ5vAxcz4e',
    'Photography': 'appP1uFoRWjxPkQ5b'
  };

  // You'll need to set this environment variable
  const apiKey = process.env.AIRTABLE_API_KEY;
  
  if (!apiKey) {
    console.log('❌ Please set AIRTABLE_API_KEY environment variable');
    console.log('Example: export AIRTABLE_API_KEY="your_pat_token_here"');
    return;
  }

  for (const [category, baseId] of Object.entries(bases)) {
    console.log(`\n🔍 Testing ${category} base: ${baseId}`);
    
    try {
      // First, try to get the base schema to see available tables
      const schemaResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (schemaResponse.ok) {
        const schemaData = await schemaResponse.json();
        console.log(`✅ Found ${schemaData.tables?.length || 0} tables:`);
        schemaData.tables?.forEach(table => {
          console.log(`   📋 ${table.name} (ID: ${table.id})`);
        });
      } else {
        console.log(`❌ Could not get schema: ${schemaResponse.status} ${schemaResponse.statusText}`);
        
        // Try some common table names as fallback
        const commonNames = ['Portfolio', 'Web', 'Photos', 'Projects', 'Items', 'Content', 'Data'];
        for (const tableName of commonNames) {
          try {
            const testResponse = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=1`, {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (testResponse.ok) {
              console.log(`✅ Table "${tableName}" exists and is accessible`);
            } else if (testResponse.status === 404) {
              console.log(`❌ Table "${tableName}" not found`);
            } else {
              console.log(`⚠️ Table "${tableName}" returned ${testResponse.status}: ${testResponse.statusText}`);
            }
          } catch (error) {
            console.log(`❌ Error testing table "${tableName}":`, error.message);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Error testing ${category}:`, error.message);
    }
  }
}

testAirtableTables().catch(console.error);
