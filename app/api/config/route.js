export async function GET(){
  return new Response(JSON.stringify({ publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_abc' }), { headers: { 'content-type': 'application/json' } })
}


