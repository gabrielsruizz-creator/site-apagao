# Monitor de Apagões de Internet

Globo 3D interativo com as quedas de conectividade detectadas nas últimas 24 h, por país.
Os dados vêm do [IODA](https://ioda.inetintel.cc.gatech.edu/) (Georgia Tech) e a página se atualiza sozinha a cada 5 minutos.

- `public/index.html`: página com o globo (globe.gl)
- `api/outages.js`: função serverless da Vercel que busca o IODA, com cache de 5 min na borda

## Deploy na Vercel
Importe o repositório na Vercel. Não precisa configurar nada: não há build e o diretório de saída é `public`.
