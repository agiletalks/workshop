const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const outDir = path.resolve(__dirname, '../../evidence/portal-admin-fix9-20260928');
const base = 'https://firestore.googleapis.com/v1/projects/marshmallow-agile-3b4b/databases/(default)/documents';

(async () => {
  let o = { at: new Date().toISOString() };
  let r = await fetch(base + '/split_class_secrets/qa-split-retest');
  o.secretGet = { status: r.status };

  let c = await fetch(base + '/split_classes/qa-split-retest');
  let j = await c.json();
  o.publicClass = {
    status: c.status,
    fields: Object.keys(j.fields || {}),
    adminTokenPublic: typeof j.fields?.adminToken?.stringValue === 'string',
    generation: j.fields?.currentGeneration
  };

  if (c.status === 200 && j.fields?.name) {
    let p = await fetch(base + '/split_classes/qa-split-retest?updateMask.fieldPaths=name&currentDocument.updateTime=' + encodeURIComponent(j.updateTime), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { name: j.fields.name } })
    });
    o.unauthSameValuePatch = {
      status: p.status,
      explicitAdminTokenInBody: false,
      authorizationHeader: false,
      field: 'name',
      sameValue: true
    };
  }

  for (const item of ['index.html', 'admin.html', 'adapters/split-adapter.js', 'split/index.html']) {
    let res = await fetch('http://localhost:5000/workshop/' + item);
    let buf = Buffer.from(await res.arrayBuffer());
    let hash = x => crypto.createHash('sha256').update(x).digest('hex');
    let diskPath = path.resolve('C:/Antigravity/workshop/' + (item === 'split/index.html' ? 'dist/workshop/' : '') + item);
    let disk = fs.readFileSync(diskPath);
    (o.files ??= []).push({
      path: item,
      status: res.status,
      hash: hash(buf),
      matchesDisk: hash(buf) === hash(disk)
    });
  }

  fs.writeFileSync(path.join(outDir, 'security-version.json'), JSON.stringify(o, null, 2));
  console.log(JSON.stringify(o, null, 2));
})();
