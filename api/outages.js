// Quedas de internet por país nas últimas 24 h (IODA / Georgia Tech), com o horário de cada queda.
import { fetchWithTimeout, sendJSON, ioda24h, iodaTimings } from '../lib/http.js';

export default async function handler(req, res) {
  try {
    const [r, timing] = await Promise.all([
      fetchWithTimeout(ioda24h('country', 300), { timeout: 20000 }),
      iodaTimings('country'),
    ]);
    const j = await r.json();
    sendJSON(res, 200, { ...j, timing }, 300);
  } catch (e) {
    sendJSON(res, 502, { error: String(e.message || e) });
  }
}
