// Utilitários compartilhados pelas funções em /api.

const UA = 'Mozilla/5.0 (compatible; site-apagao/1.0)';

export async function fetchWithTimeout(url, { timeout = 15000, headers = {} } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': UA, ...headers } });
    if (!r.ok) throw new Error(`HTTP ${r.status} em ${new URL(url).host}`);
    return r;
  } finally {
    clearTimeout(t);
  }
}

// Envia JSON com cache na borda da Vercel (s-maxage) e serve a versão antiga enquanto revalida.
export function sendJSON(res, status, body, maxAge = 300) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (status === 200) res.setHeader('Cache-Control', `s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 3}`);
  else res.setHeader('Cache-Control', 'no-store');
  res.status(status).send(JSON.stringify(body));
}

export function ioda24h(entityType, limit) {
  const until = Math.floor(Date.now() / 1000);
  const from = until - 86400;
  return `https://api.ioda.inetintel.cc.gatech.edu/v2/outages/summary?from=${from}&until=${until}&entityType=${entityType}&limit=${limit}`;
}
