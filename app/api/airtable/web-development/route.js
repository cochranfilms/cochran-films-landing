export async function GET(request) {
  const baseId = 'appV5l9kZ5vAxcz4e';
  const tableName = 'Imported table';
  const apiKey = process.env.AIRTABLE_API_KEY_WEB || process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Airtable API key not configured' }), { status: 500 });
  }
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit')||'0')
  const qs = limit ? `?pageSize=${limit}` : ''
  const resp = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}${qs}`, { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } });
  const text = await resp.text();
  if (!resp.ok) return new Response(text, { status: resp.status });
  return new Response(text, { headers: { 'content-type': 'application/json', 'cache-control': 's-maxage=600, stale-while-revalidate=86400' } });
}
