const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const ROOT_DIR = path.join(__dirname, '..', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  if (reqPath === '/' || reqPath === '') {
    reqPath = '/workshop/';
  }

  let filePath = path.join(ROOT_DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath) && reqPath.startsWith('/workshop/marshmallow')) {
    filePath = path.join(ROOT_DIR, 'workshop', 'marshmallow', 'index.html');
  }

  if (!fs.existsSync(filePath) && reqPath.startsWith('/hangout/split')) {
    filePath = path.join(ROOT_DIR, 'hangout', 'split', 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>404 Not Found</h1><p>Requested path <code>${reqPath}</code> was not found.</p><p><a href="/workshop/">Back to Workshop Portal</a></p>`);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 本地服務已啟動！`);
  console.log(`👉 網站首頁（傳送門）: http://localhost:${PORT}/workshop/`);
  console.log(`👉 AI-Align 工作坊:    http://localhost:${PORT}/workshop/ai-align/`);
  console.log(`👉 AI-ARM 工作坊:      http://localhost:${PORT}/workshop/ai-arm/`);
  console.log(`👉 棉花糖挑戰:         http://localhost:${PORT}/workshop/marshmallow/`);
  console.log(`👉 需求拆解 (Split):   http://localhost:${PORT}/hangout/split/`);
  console.log(`👉 HOOK 模組:          http://localhost:${PORT}/workshop/hook/`);
  console.log(`======================================================\n`);
});
