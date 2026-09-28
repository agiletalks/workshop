const fs = require('node:fs');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const path = require('node:path');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const normalize = b => b.toString('utf8').replace(/\r\n/g, '\n');
(async () => {
  const results = [];
  for (const file of ['index.html', 'board.html', 'admin.html']) {
    const url = 'https://agiletalks-workshop.web.app/workshop/ai-arm/' + file;
    const response = await fetch(url);
    const live = Buffer.from(await response.arrayBuffer());
    const commit = cp.execFileSync('git', ['-c', 'safe.directory=C:/Antigravity/workshop', '-C', 'C:/Antigravity/workshop', 'show', '48ac84e:ai-arm/' + file]);
    results.push({file, url, status: response.status, liveSha256: sha(live), commitSha256: sha(commit), normalizedLiveSha256: sha(normalize(live)), normalizedCommitSha256: sha(normalize(commit)), equalIgnoringCRLF: normalize(live) === normalize(commit)});
  }
  const result = {checkedAt: new Date().toISOString(), targetCommit: '48ac84e', scope: 'Three entry HTML files only; not proof of complete deployment provenance.', results};
  const outputDir = process.argv[2] || path.resolve(__dirname, '../evidence');
  fs.mkdirSync(outputDir, {recursive: true});
  fs.writeFileSync(path.join(outputDir, 'version-evidence.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
})().catch(e => {console.error(e); process.exitCode = 1;});
