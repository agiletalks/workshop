const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ID = 'marshmallow-agile-3b4b';
const DATABASE_ID = '(default)';

function restoreDoc(collectionId, docId, fields) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ fields });
    const reqPath = `/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${collectionId}/${encodeURIComponent(docId)}`;
    
    const req = https.request({
      hostname: 'firestore.googleapis.com',
      path: reqPath,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          reject(new Error(`Status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runRestore() {
  const targetDirArg = process.argv[2];
  let backupDir;

  if (targetDirArg) {
    backupDir = path.resolve(targetDirArg);
  } else {
    const latestFile = path.join(__dirname, '..', 'backups', 'LATEST_BACKUP.json');
    if (!fs.existsSync(latestFile)) {
      console.error('No backup directory specified and LATEST_BACKUP.json not found.');
      process.exit(1);
    }
    const latestInfo = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    backupDir = path.join(__dirname, '..', 'backups', latestInfo.latestDir);
  }

  const manifestFile = path.join(backupDir, 'manifest.json');
  if (!fs.existsSync(manifestFile)) {
    console.error(`Invalid backup directory (missing manifest.json): ${backupDir}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  console.log(`========================================`);
  console.log(`Firestore Restore Tool`);
  console.log(`Source:    ${backupDir}`);
  console.log(`Timestamp: ${manifest.timestamp}`);
  console.log(`Documents: ${manifest.totalDocuments}`);
  console.log(`========================================\n`);

  for (const [col, colInfo] of Object.entries(manifest.collections)) {
    if (colInfo.error || colInfo.count === 0) continue;
    const rawFile = path.join(backupDir, colInfo.rawFile);
    if (!fs.existsSync(rawFile)) {
      console.warn(`[WARN] Raw file missing for ${col}: ${rawFile}`);
      continue;
    }

    const rawDocs = JSON.parse(fs.readFileSync(rawFile, 'utf8'));
    console.log(`Restoring collection [${col}] (${rawDocs.length} docs)...`);

    let restoredCount = 0;
    for (const doc of rawDocs) {
      const docId = doc.name.split('/').pop();
      try {
        await restoreDoc(col, docId, doc.fields || {});
        restoredCount++;
        if (restoredCount % 50 === 0) process.stdout.write(`.`);
      } catch (err) {
        console.error(`\n[ERROR] Failed to restore ${col}/${docId}:`, err.message);
      }
    }
    console.log(`\n✓ Restored ${restoredCount}/${rawDocs.length} in [${col}]`);
  }

  console.log(`\nRestore process finished!`);
}

runRestore().catch(err => {
  console.error('Fatal restore error:', err);
  process.exit(1);
});
