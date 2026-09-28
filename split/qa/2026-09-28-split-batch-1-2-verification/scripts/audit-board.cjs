const fs = require('fs');
const crypto = require('crypto');
const vm = require('vm');
const {execFileSync} = require('child_process');
const root = 'C:/Antigravity/workshop';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
(async () => {
  const source = fs.readFileSync(root+'/split/public/board.html');
  const html = source.toString('utf8');
  const results = {at:new Date().toISOString(),head:execFileSync('git',['-c','safe.directory='+root,'-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceSha256:sha(source),distSha256:sha(fs.readFileSync(root+'/dist/workshop/split/board.html')),scripts:[],served:[]};
  for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if(/\bsrc\s*=/.test(m[1])) continue;
    const line = html.slice(0,m.index).split('\n').length;
    try {new vm.Script(m[2],{filename:'split/public/board.html',lineOffset:line-1});results.scripts.push({startLine:line,result:'PARSE PASS'});}
    catch(e) {results.scripts.push({startLine:line,result:'PARSE FAIL',message:e.message,stack:e.stack});}
  }
  for(const url of ['http://localhost:5000/workshop/split/board.html?c=qa-split-test-01&team=team-1&type=wbs','http://localhost:5173/board.html?c=qa-split-test-01&team=team-1&type=wbs']) {
    const r = await fetch(url); const text=await r.text();
    results.served.push({url,status:r.status,sha256:sha(Buffer.from(text)),matchesSource:text===html});
  }
  results.contract = {expectedBoardId:'wbs_team_1',actualExpressionResult:'wbs'+'_'+'team-1',legacyCollectionNamePresent:html.includes('aigile_boards'),initialGenerationLiteral:html.includes('let currentGen = 1;')};
  fs.writeFileSync(__dirname+'/syntax-and-version.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
})();
