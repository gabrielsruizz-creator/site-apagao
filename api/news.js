// Notícias das últimas 24 h (Google News RSS) sobre ciberataques e sobre apagões/quedas de serviço.
// O local de cada notícia é estimado pelo primeiro país ou cidade citado na manchete.
import { fetchWithTimeout, sendJSON } from '../lib/http.js';
import PLACES from '../lib/places.js';

const FEEDS = {
  cyber: [
    ['(ciberataque OR "ataque hacker" OR ransomware OR "vazamento de dados" OR hackers) when:1d', 'pt-BR', 'BR', 'BR:pt-419'],
    ['(cyberattack OR ransomware OR "data breach" OR hackers OR "cyber attack") when:1d', 'en-US', 'US', 'US:en'],
  ],
  outage: [
    ['(apagão OR "falta de energia" OR "queda de energia" OR "sem energia" OR "fora do ar") when:1d', 'pt-BR', 'BR', 'BR:pt-419'],
    ['("power outage" OR blackout OR "internet outage" OR "service outage" OR "power cut") when:1d', 'en-US', 'US', 'US:en'],
  ],
};

const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Uma única regex com todos os nomes (mais longos primeiro, para "El Salvador" vencer "Salvador").
const byName = new Map();
for (const p of PLACES) byName.set(strip(p[0]), p);
const names = [...byName.keys()].sort((a, b) => b.length - a.length);
const PLACE_RE = new RegExp(`(?<![\\w])(${names.map(esc).join('|')})(?![\\w])`, 'g');

function locate(title) {
  const text = strip(title.replace(/\s+-\s+[^-]+$/, '')); // ignora o " - Veículo" do fim
  PLACE_RE.lastIndex = 0;
  const m = PLACE_RE.exec(text);
  if (!m) return null;
  const [name, lat, lng, cc, type] = byName.get(m[1]);
  return { name, lat, lng, cc, type: type === 'c' ? 'country' : 'city' };
}

const decode = (s) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)); return m ? decode(m[1]).trim() : ''; };

async function readFeed([q, hl, gl, ceid]) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
  const xml = await (await fetchWithTimeout(url)).text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, it]) => {
    const source = tag(it, 'source');
    let title = tag(it, 'title');
    if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
    return { title, source, url: tag(it, 'link'), date: new Date(tag(it, 'pubDate')).toISOString(), lang: hl.slice(0, 2) };
  });
}

export default async function handler(req, res) {
  const out = {};
  const errors = [];
  const since = Date.now() - 36 * 3600 * 1000;
  for (const [topic, feeds] of Object.entries(FEEDS)) {
    const results = await Promise.allSettled(feeds.map(readFeed));
    const seen = new Set();
    out[topic] = [];
    for (const r of results) {
      if (r.status !== 'fulfilled') { errors.push(String(r.reason && r.reason.message || r.reason)); continue; }
      for (const item of r.value) {
        const key = strip(item.title).toLowerCase().replace(/\W+/g, ' ').trim();
        if (seen.has(key) || Date.parse(item.date) < since) continue;
        seen.add(key);
        out[topic].push({ ...item, place: locate(item.title) });
      }
    }
    out[topic].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  }
  if (!out.cyber.length && !out.outage.length && errors.length) return sendJSON(res, 502, { error: errors.join('; ') });
  sendJSON(res, 200, { updated: new Date().toISOString(), ...out, errors }, 600);
}
