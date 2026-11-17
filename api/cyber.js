// Ataques de ransomware reivindicados recentemente (ransomware.live), agregados por país.
// De propósito, não repassamos o nome das vítimas: o mapa mostra onde e em que setor, sem
// amplificar a lista de extorsão dos grupos criminosos.
import { fetchWithTimeout, sendJSON } from '../lib/http.js';

const SECTORS = {
  Healthcare: 'Saúde', 'Financial Services': 'Serviços financeiros', Manufacturing: 'Indústria',
  Technology: 'Tecnologia', Education: 'Educação', Government: 'Governo', 'Public Sector': 'Setor público',
  'Business Services': 'Serviços', Construction: 'Construção', Transportation: 'Transporte',
  'Transportation/Logistics': 'Transporte e logística', Energy: 'Energia', Telecommunication: 'Telecom',
  Retail: 'Varejo', Hospitality: 'Hotelaria e turismo', Agriculture: 'Agronegócio',
  'Consumer Services': 'Serviços ao consumidor', 'Not Found': 'Setor não informado',
  'Agriculture and Food Production': 'Agro e alimentos', 'Retail & E-Commerce': 'Varejo e e-commerce',
  'Energy & Utilities': 'Energia e saneamento', 'Professional Services': 'Serviços profissionais',
  'Media & Entertainment': 'Mídia e entretenimento', 'Real Estate': 'Imobiliário', Legal: 'Jurídico',
  'Government & Public Sector': 'Governo e setor público', Insurance: 'Seguros', 'Food & Beverage': 'Alimentos e bebidas',
  'Hospitality and Tourism': 'Hotelaria e turismo', 'Telecommunications': 'Telecom', Logistics: 'Logística', 'Government & Defense': 'Governo e defesa', Other: 'Outros',
};

export default async function handler(req, res) {
  try {
    const get = () => fetchWithTimeout('https://api.ransomware.live/v2/recentvictims', {
      timeout: 20000, headers: { accept: 'application/json' },
    });
    // a API às vezes derruba a conexão; uma nova tentativa costuma resolver
    const r = await get().catch(() => new Promise((ok) => setTimeout(ok, 1500)).then(get));
    const list = await r.json();
    const since = Date.now() - 72 * 3600 * 1000;
    const attacks = [];
    const byCountry = {};
    for (const v of Array.isArray(list) ? list : []) {
      const when = Date.parse(v.discovered || v.attackdate || '');
      if (!when || when < since) continue;
      const cc = (v.country || '').toUpperCase();
      const sector = SECTORS[v.activity] || v.activity || 'Setor não informado';
      attacks.push({ cc, group: v.group || '?', sector, date: new Date(when).toISOString() });
      if (!cc) continue;
      const c = (byCountry[cc] ||= { count: 0, groups: {}, sectors: {} });
      c.count++;
      c.groups[v.group] = (c.groups[v.group] || 0) + 1;
      c.sectors[sector] = (c.sectors[sector] || 0) + 1;
    }
    sendJSON(res, 200, { updated: new Date().toISOString(), windowHours: 72, attacks, byCountry }, 900);
  } catch (e) {
    sendJSON(res, 502, { error: String(e.message || e) });
  }
}
