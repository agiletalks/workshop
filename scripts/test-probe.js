const https = require('https');

const PROJECT_ID = 'marshmallow-agile-3b4b';
const DATABASE_ID = '(default)';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

const taskId = 'test_probe_' + Date.now();
const classId = '202609-split-uuu';
const url = `${BASE}/split_classes/${classId}/custom_tasks/${taskId}`;

const payload = JSON.stringify({
  fields: {
    id: { stringValue: taskId },
    title: { stringValue: '測試任務' },
    classId: { stringValue: classId }
  }
});

const req = https.request(url, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Response body:', body);
  });
});

req.on('error', (err) => {
  console.error('Request error:', err);
});

req.write(payload);
req.end();
