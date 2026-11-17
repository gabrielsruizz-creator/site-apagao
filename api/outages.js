// Vercel serverless function: proxies the IODA outage summary (last 24h, per country)
// so the browser never depends on IODA's CORS settings, and caches it at the edge.
export default async function handler(req, res) {
  const until = Math.floor(Date.now() / 1000);
  const from = until - 86400;
  const url = `https://api.ioda.inetintel.cc.gatech.edu/v2/outages/summary?from=${from}&until=${until}&entityType=country&limit=300`;
  try {
    const r = await fetch(url, { headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error(`IODA HTTP ${r.status}`);
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
}
