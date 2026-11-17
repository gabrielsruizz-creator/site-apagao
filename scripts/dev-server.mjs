// Servidor local que imita a Vercel: serve /public e executa as funções de /api.
// Uso: node scripts/dev-server.mjs  (abre em http://localhost:3000)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '../..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const port = Number(process.env.PORT) || 3000;

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^a-z-]/g, '');
    try {
      const mod = await import(pathToFileURL(join(root, 'api', name + '.js')).href);
      res.status = (c) => { res.statusCode = c; return res; };
      res.send = (b) => res.end(b);
      res.json = (b) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(b)); };
      req.query = Object.fromEntries(url.searchParams);
      return await mod.default(req, res);
    } catch (e) {
      res.statusCode = 404; return res.end(String(e));
    }
  }
  const file = join(root, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
  try {
    const body = await readFile(file);
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch {
    res.statusCode = 404; res.end('não encontrado');
  }
}).listen(port, () => console.log(`http://localhost:${port}`));
