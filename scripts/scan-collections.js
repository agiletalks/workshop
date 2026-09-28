const fs = require('fs');
const path = require('path');

const found = new Map();

function searchDir(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (['node_modules', '.git', 'dist', 'qa', '__qa__', 'archive'].includes(file)) continue;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchDir(full);
    } else if (/\.(html|js|ts|jsx|tsx)$/.test(file)) {
      const content = fs.readFileSync(full, 'utf-8');
      const regex = /\.collection\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
      let m;
      while ((m = regex.exec(content)) !== null) {
        const coll = m[1];
        const rel = path.relative('C:/Antigravity/workshop', full);
        if (!found.has(coll)) found.set(coll, []);
        found.get(coll).push(rel);
      }
    }
  }
}

searchDir('C:/Antigravity/workshop');

console.log('=== Firestore Collections Found in Repository ===');
for (const [coll, files] of found.entries()) {
  console.log(`Collection: "${coll}"`);
  console.log(`  Files (${files.length}):`, [...new Set(files)]);
}
