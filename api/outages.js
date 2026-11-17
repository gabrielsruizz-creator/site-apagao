// Quedas de internet por país nas últimas 24 h (IODA / Georgia Tech).
import { fetchWithTimeout, sendJSON, ioda24h } from '../lib/http.js';

export default async function handler(req, res) {
  try {
    const r = await fetchWithTimeout(ioda24h('country', 300), { timeout: 20000 });
    const j = await r.json();
    sendJSON(res, 200, j, 300);
  } catch (e) {
    sendJSON(res, 502, { error: String(e.message || e) });
  }
}
