export async function GET() {
  const cfg = await import('../../../../airtable.config.js');
  const baseId = cfg.default?.BASES?.['Video Production'] || 'appjQxcRoClnZzghj';
  const tableName = cfg.default?.TABLE_NAME || 'Imported table';
  const apiKey = process.env.AIRTABLE_API_KEY_VIDEO || process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Airtable API key not configured' }), { status: 500 });
  }
  const resp = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,( { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }));
  const text = await resp.text();
  if (!resp.ok) return new Response(text, { status: resp.status });
  return new Response(text, { headers: { 'content-type': 'application/json', 'cache-control': 's-maxage=600, stale-while-revalidate=86400' } });
}
