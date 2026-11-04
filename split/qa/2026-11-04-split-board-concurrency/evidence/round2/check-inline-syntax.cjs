const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, 'deployed-board.html'), 'utf8');
const results = [];
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (/\bsrc\s*=/.test(match[1]) || !match[2].trim()) continue;
  const line = html.slice(0, match.index).split('\n').length;
  try { new vm.Script(match[2]); results.push({line, result:'PASS'}); }
  catch (error) { results.push({line, result:'FAIL', error:String(error)}); }
}
fs.writeFileSync(path.join(__dirname, 'inline-syntax-results.json'), JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
process.exitCode = results.some(x => x.result === 'FAIL') ? 1 : 0;
