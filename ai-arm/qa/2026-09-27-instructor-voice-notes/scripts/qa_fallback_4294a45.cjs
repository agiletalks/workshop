const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync('C:/Antigravity/workshop/ai-arm/index.html','utf8');
const start = src.indexOf('if (!parsedData || !Array.isArray(parsedData.stickies))');
const end = src.indexOf('// 標準化 stickies',start);
if(start<0||end<0) throw Error('fallback source not found');
const block = src.slice(start,end);
const cases = [
 ['single','今天只驗證付款逾時'],
 ['multi','付款逾時必須保留訂單。重送請求使用相同交易代碼。完成付款後寄送收據。'],
 ['short_fragments','甲。乙。丙。']
];
const result = cases.map(([name,input])=>{
 const context={parsedData:null,safeTranscript:input,slideTitle:'QA付款流程',STICKY_PALETTES:['yellow','blue','pink','green','purple'].map(id=>({id})),Date};
 vm.runInNewContext(block,context);
 const d=context.parsedData;
 return {name,input,output:d,pointsAllFromTranscript:d.stickies.every(s=>s.points.every(p=>input.includes(p))),containsUnsourcedProse:d.textbookArticle.includes('依課堂講授核心脈絡落實實務敏捷實踐。')};
});
fs.writeFileSync('C:/VIBE/ai-arm/QA_4294a45_fallback-evidence.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
