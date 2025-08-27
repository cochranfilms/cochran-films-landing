import Stripe from 'stripe'

export async function POST(req){
  try {
    const { items } = await req.json()
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const line_items = (items||[]).map(it => ({
      price_data: { currency: 'usd', product_data: { name: it.name }, unit_amount: Math.round(it.price * 100) },
      quantity: it.quantity || 1
    }))
    const session = await stripe.checkout.sessions.create({ mode: 'payment', line_items, success_url: `${origin}/success.html`, cancel_url: `${origin}/cancel.html` })
    return new Response(JSON.stringify({ id: session.id, url: session.url }), { headers: { 'content-type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}


