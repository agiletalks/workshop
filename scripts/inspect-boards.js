const https = require('https');

const BASE = 'https://firestore.googleapis.com/v1/projects/marshmallow-agile-3b4b/databases/(default)/documents';

function get(path) {
  return new Promise((resolve) => {
    https.get(BASE + '/' + path, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
    });
  });
}

function decodeValue(val) {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in val) {
    const res = {};
    for (const k of Object.keys(val.mapValue.fields || {})) {
      res[k] = decodeValue(val.mapValue.fields[k]);
    }
    return res;
  }
  return val;
}

(async () => {
  const classes = ['202609-split-uuu', '2026-09-split-uuu', 'qa-split-test-01'];
  for (const cid of classes) {
    console.log(`\n==============================================`);
    console.log(`Checking Class: ${cid}`);
    console.log(`==============================================`);

    // 1. Check Class Metadata
    const classMeta = await get(`split_classes/${cid}`);
    if (classMeta.status === 200 && classMeta.data.fields) {
      console.log(`Class Info: Name="${decodeValue(classMeta.data.fields.name)}", CurrentGen=${decodeValue(classMeta.data.fields.currentGeneration)}, LastClearedAt=${decodeValue(classMeta.data.fields.lastClearedAt)}`);
    } else {
      console.log(`Class Meta status: ${classMeta.status}`);
    }

    // 2. Check all generations
    for (let gen = 1; gen <= 4; gen++) {
      const res = await get(`split_data/${cid}/generations/${gen}/boards`);
      if (res.status === 200 && res.data.documents) {
        console.log(`\n--- Generation ${gen} Boards (${res.data.documents.length} docs) ---`);
        for (const doc of res.data.documents) {
          const docId = doc.name.split('/').pop();
          const updateTime = doc.updateTime;
          const createTime = doc.createTime;
          const decoded = {};
          for (const k of Object.keys(doc.fields || {})) {
            decoded[k] = decodeValue(doc.fields[k]);
          }
          console.log(`\n  Board ID: ${docId}`);
          console.log(`    CreateTime: ${createTime}`);
          console.log(`    UpdateTime: ${updateTime}`);
          console.log(`    Fields:`, Object.keys(decoded));
          if (decoded.notes) {
            console.log(`    Notes count:`, Array.isArray(decoded.notes) ? decoded.notes.length : typeof decoded.notes);
            if (Array.isArray(decoded.notes)) {
              decoded.notes.forEach((n, idx) => {
                console.log(`      [Note ${idx + 1}] ID=${n.id}, Text="${(n.text || n.content || '').slice(0, 50)}", Color=${n.color}, Author=${n.author || n.userName || 'N/A'}, Pos=(${n.x}, ${n.y})`);
              });
            } else if (typeof decoded.notes === 'object') {
              console.log(`    Notes keys:`, Object.keys(decoded.notes));
              console.log(`    Notes dump:`, JSON.stringify(decoded.notes));
            }
          }
        }
      }
    }
  }
})();
