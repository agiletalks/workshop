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
  const [rawPath, rawQuery] = req.url.split('?');
  const queryString = rawQuery ? `?${rawQuery}` : '';
  let reqPath = decodeURIComponent(rawPath);

  // 1. 根目錄重定向至 /workshop/
  if (reqPath === '/' || reqPath === '') {
    res.writeHead(302, { 'Location': `/workshop/${queryString}` });
    res.end();
    return;
  }

  // 2. 短路徑相容別名自動重定向 (例如 /ai-arm/, /ai-align/, /marshmallow/, /hook/, /split/)
  const workshopAliases = ['ai-arm', 'ai-align', 'marshmallow', 'hook'];
  for (const name of workshopAliases) {
    if (reqPath === `/${name}` || reqPath.startsWith(`/${name}/`)) {
      const rest = reqPath.slice(name.length + 1);
      const target = `/workshop/${name}${rest}${queryString}`;
      res.writeHead(302, { 'Location': target });
      res.end();
      return;
    }
  }

  if (reqPath === '/split' || reqPath.startsWith('/split/')) {
    const rest = reqPath.slice(6);
    const target = `/hangout/split${rest}${queryString}`;
    res.writeHead(302, { 'Location': target });
    res.end();
    return;
  }

  let filePath = path.join(ROOT_DIR, reqPath);

  // 3. 若為目錄但 URL 缺少結尾斜線，規範化 301 重定向至帶結尾斜線路徑，避免相對路徑解析錯誤
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    if (!reqPath.endsWith('/')) {
      res.writeHead(301, { 'Location': `${reqPath}/${queryString}` });
      res.end();
      return;
    }
    filePath = path.join(filePath, 'index.html');
  }

  // 4. SPA fallback (marshmallow 與 split)
  if (!fs.existsSync(filePath) && reqPath.startsWith('/workshop/marshmallow')) {
    filePath = path.join(ROOT_DIR, 'workshop', 'marshmallow', 'index.html');
  }

  if (!fs.existsSync(filePath) && reqPath.startsWith('/hangout/split')) {
    filePath = path.join(ROOT_DIR, 'hangout', 'split', 'index.html');
  }

  // 5. 檔案回應
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
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
