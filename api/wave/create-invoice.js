// Vercel serverless function to create Wave invoice
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customer, items, memo } = req.body;
    
    // Get Wave API credentials
    const waveApiKey = process.env.WAVE_API_KEY;
    const waveBusinessId = process.env.WAVE_BUSINESS_ID;
    
    if (!waveApiKey || !waveBusinessId) {
      console.error('Missing Wave environment variables');
      return res.status(500).json({ error: 'Wave configuration missing' });
    }

    // Create invoice in Wave
    const invoiceData = {
      business: { id: waveBusinessId },
      customer: {
        name: customer.name || 'Client',
        email: customer.email || 'client@example.com',
        phone: customer.phone || ''
      },
      items: items.map(item => ({
        description: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity
      })),
      memo: memo || 'Cochran Films Service',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    };

    const response = await fetch('https://gql.waveapps.com/graphql/public', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${waveApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
          mutation CreateInvoice($input: InvoiceCreateInput!) {
            invoiceCreate(input: $input) {
              didSucceed
              inputErrors {
                field
                message
              }
              invoice {
                id
                invoiceNumber
                invoiceUrl
              }
            }
          }
        `,
        variables: { input: invoiceData }
      })
    });

    if (!response.ok) {
      throw new Error(`Wave API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors || !result.data?.invoiceCreate?.didSucceed) {
      throw new Error('Wave invoice creation failed');
    }

    const invoice = result.data.invoiceCreate.invoice;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return res.status(200).json({
      invoiceId: invoice.id,
      checkoutUrl: invoice.invoiceUrl
    });

  } catch (error) {
    console.error('Wave API error:', error);
    return res.status(500).json({ error: 'Failed to create invoice' });
  }
}
