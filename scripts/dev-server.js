import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env if exists
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.pathname;

  // 1. API Route Dispatcher
  if (pathname.startsWith('/api/')) {
    const apiRel = pathname.replace(/^\/api\//, '').replace(/\/$/, '');
    const apiFile = path.join(ROOT_DIR, 'api', `${apiRel}.js`);

    if (fs.existsSync(apiFile)) {
      try {
        // Collect request body
        let body = {};
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          const buffers = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          const rawBody = Buffer.concat(buffers).toString('utf-8');
          if (rawBody) {
            try {
              body = JSON.parse(rawBody);
            } catch (e) {
              body = {};
            }
          }
        }

        // Mock Vercel res helper
        const vercelRes = {
          statusCode: 200,
          status(code) {
            this.statusCode = code;
            res.statusCode = code;
            return this;
          },
          setHeader(k, v) {
            res.setHeader(k, v);
            return this;
          },
          json(data) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(data));
          },
          end(data) {
            res.end(data);
          }
        };

        const vercelReq = {
          method: req.method,
          headers: req.headers,
          query: Object.fromEntries(parsedUrl.searchParams.entries()),
          body
        };

        const module = await import(`file://${apiFile}?t=${Date.now()}`);
        const handler = module.default || module;
        return await handler(vercelReq, vercelRes);
      } catch (apiErr) {
        console.error(`API Error in ${pathname}:`, apiErr);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: false, error: 'Internal Server Error: ' + apiErr.message }));
      }
    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: `API route not found: ${pathname}` }));
    }
  }

  // 2. Static File Serving
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(ROOT_DIR, pathname);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🎰 Grand Slot Club full-stack server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints active with Neon DB support.`);
});
