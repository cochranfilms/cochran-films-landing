export async function GET() {
  // Match the server.js implementation exactly
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';
  
  return new Response(JSON.stringify({ publishableKey }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=600'
    }
  });
}


