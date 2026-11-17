# Monitor de Apagões

Globo 3D interativo (estilo pontilhado, preto e branco, com tema claro e escuro) que mostra o que aconteceu nas últimas 24 h:

| Camada | O que mostra | Fonte |
| --- | --- | --- |
| ● Internet | Quedas de conectividade por país e por estado/província | [IODA](https://ioda.inetintel.cc.gatech.edu/) (Georgia Tech) |
| ◆ Ciberataques | Ataques de ransomware reivindicados (72 h, por país, sem o nome das vítimas) e notícias de ciberataques | [ransomware.live](https://www.ransomware.live/) e Google News |
| ▲ Apagões | Notícias de falta de energia e de quedas de serviço | Google News |

O local das notícias é estimado pelo país ou cidade citado na manchete, então é aproximado.

## Estrutura

- `public/index.html`: a página (globe.gl + topojson pelo CDN jsDelivr)
- `api/outages.js`, `api/regions.js`, `api/cyber.js`, `api/news.js`: funções serverless da Vercel que buscam as fontes, com cache na borda
- `lib/`: utilitários e dados embutidos (coordenadas das regiões do IODA e lista de países e cidades)
- `scripts/`: servidor local e scripts que geraram os dados de `lib/`

## Deploy na Vercel

Importe o repositório na Vercel. Não precisa configurar nada: não há build, o diretório de saída é `public` e as funções em `api/` são detectadas automaticamente.

## Rodar localmente

```bash
node scripts/dev-server.mjs
```

Depois abra http://localhost:3000.
