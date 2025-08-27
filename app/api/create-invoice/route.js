import Stripe from 'stripe'

export async function POST(req){
  try {
    const { customer, items, metadata } = await req.json()
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    // Create or reuse customer
    const cust = await stripe.customers.create({ name: customer?.name, email: customer?.email })
    // Create invoice items
    for (const it of (items || [])) {
      await stripe.invoiceItems.create({ customer: cust.id, description: it.name, currency: 'usd', unit_amount: Math.round(it.price * 100), quantity: it.quantity || 1 })
    }
    // Create invoice
    const invoice = await stripe.invoices.create({ customer: cust.id, collection_method: 'send_invoice', days_until_due: 7, metadata })
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id)
    return new Response(JSON.stringify({ id: finalized.id, hostedInvoiceUrl: finalized.hosted_invoice_url }), { headers: { 'content-type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}


