const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ID = 'marshmallow-agile-3b4b';
const DATABASE_ID = '(default)';
const COLLECTIONS = [
  'ai_arm_classes',
  'aigile_boards',
  'ai_arm_presence',
  'ai_arm_board_presence',
  'classes'
];

function fetchCollectionDocs(collectionId) {
  return new Promise((resolve, reject) => {
    let allDocs = [];
    function fetchPage(pageToken) {
      let reqPath = `/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${collectionId}?pageSize=300`;
      if (pageToken) reqPath += `&pageToken=${encodeURIComponent(pageToken)}`;

      https.get({
        hostname: 'firestore.googleapis.com',
        path: reqPath,
        headers: { 'Accept': 'application/json' }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 400) {
            return reject(new Error(`Failed to fetch ${collectionId} (status ${res.statusCode}): ${body}`));
          }
          try {
            const json = JSON.parse(body);
            if (json.documents && json.documents.length > 0) {
              allDocs = allDocs.concat(json.documents);
              process.stdout.write(`.`);
            }
            if (json.nextPageToken) {
              fetchPage(json.nextPageToken);
            } else {
              resolve(allDocs);
            }
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    }
    fetchPage();
  });
}

function decodeFirestoreValue(val) {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(decodeFirestoreValue);
  }
  if ('mapValue' in val) {
    const res = {};
    const fields = val.mapValue.fields || {};
    for (const k of Object.keys(fields)) {
      res[k] = decodeFirestoreValue(fields[k]);
    }
    return res;
  }
  return val;
}

function decodeFirestoreDoc(doc) {
  const docId = doc.name.split('/').pop();
  const fields = doc.fields || {};
  const data = {};
  for (const k of Object.keys(fields)) {
    data[k] = decodeFirestoreValue(fields[k]);
  }
  return {
    _id: docId,
    _createTime: doc.createTime,
    _updateTime: doc.updateTime,
    data
  };
}

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDirName = `firestore-backup-${timestamp}`;
  const backupDir = path.join(__dirname, '..', 'backups', backupDirName);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`========================================`);
  console.log(`Firestore Backup Initiated`);
  console.log(`Project:   ${PROJECT_ID}`);
  console.log(`Target:    ${backupDir}`);
  console.log(`Time:      ${new Date().toLocaleString()}`);
  console.log(`========================================\n`);

  const manifest = {
    projectId: PROJECT_ID,
    timestamp: new Date().toISOString(),
    collections: {},
    totalDocuments: 0
  };

  for (const col of COLLECTIONS) {
    process.stdout.write(`Backing up [${col}] `);
    try {
      const rawDocs = await fetchCollectionDocs(col);
      const decodedDocs = rawDocs.map(decodeFirestoreDoc);

      const rawFile = path.join(backupDir, `${col}.raw.json`);
      const decodedFile = path.join(backupDir, `${col}.json`);

      fs.writeFileSync(rawFile, JSON.stringify(rawDocs, null, 2), 'utf8');
      fs.writeFileSync(decodedFile, JSON.stringify(decodedDocs, null, 2), 'utf8');

      manifest.collections[col] = {
        count: rawDocs.length,
        rawFile: `${col}.raw.json`,
        decodedFile: `${col}.json`
      };
      manifest.totalDocuments += rawDocs.length;
      console.log(` Done! (${rawDocs.length} docs)`);
    } catch (err) {
      console.error(`\n[ERROR] Failed to back up ${col}:`, err.message);
      manifest.collections[col] = { error: err.message };
    }
  }

  const manifestFile = path.join(backupDir, 'manifest.json');
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), 'utf8');

  // Also create a "latest" pointer
  const latestFile = path.join(__dirname, '..', 'backups', 'LATEST_BACKUP.json');
  fs.writeFileSync(latestFile, JSON.stringify({
    latestDir: backupDirName,
    timestamp: manifest.timestamp,
    totalDocuments: manifest.totalDocuments
  }, null, 2), 'utf8');

  console.log(`\n========================================`);
  console.log(`Backup Completed Successfully!`);
  console.log(`Total Documents Saved: ${manifest.totalDocuments}`);
  console.log(`Manifest Location:     ${manifestFile}`);
  console.log(`========================================\n`);
}

runBackup().catch(err => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
