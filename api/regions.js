// Quedas de internet por estado/província nas últimas 24 h (IODA), já com coordenadas e horários.
import { fetchWithTimeout, sendJSON, ioda24h, iodaTimings } from '../lib/http.js';
import REGIONS from '../lib/regions.js';

export default async function handler(req, res) {
  try {
    const [r, timing] = await Promise.all([
      fetchWithTimeout(ioda24h('region', 1000), { timeout: 25000 }),
      iodaTimings('region'),
    ]);
    const j = await r.json();
    const rows = Array.isArray(j.data) ? j.data : [];
    const regions = [];
    for (const row of rows) {
      const e = row.entity || {};
      const ll = REGIONS[e.code];
      if (!ll) continue;
      const scores = row.scores || {};
      const parts = {};
      for (const [k, v] of Object.entries(scores)) if (k !== 'overall') parts[k.split('.')[0]] = v;
      regions.push({
        code: e.code,
        name: e.name,
        cc: (e.attrs && e.attrs.country_code) || '',
        lat: ll[0],
        lng: ll[1],
        score: Number(scores.overall) || 0,
        events: Number(row.event_cnt) || 0,
        parts,
        ...(timing[e.code] || {}),
      });
    }
    sendJSON(res, 200, { updated: new Date().toISOString(), regions }, 300);
  } catch (e) {
    sendJSON(res, 502, { error: String(e.message || e) });
  }
}
