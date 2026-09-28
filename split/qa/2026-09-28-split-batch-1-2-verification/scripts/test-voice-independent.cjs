// Offline behavioral regression harness. No microphone, network, browser mutation or Firestore writes.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const root=process.env.WORKSHOP_ROOT||'C:/Antigravity/workshop';
const ts=require(root+'/split/node_modules/typescript');
const serviceSource=fs.readFileSync(root+'/split/src/services/voiceRecorder.ts','utf8');
const hookSource=fs.readFileSync(root+'/split/src/hooks/useVoiceNote.ts','utf8');
const panelSource=fs.readFileSync(root+'/split/src/components/WorkbookPanel.tsx','utf8');
const callbackSource=panelSource.match(/const handleAppendVoiceText = \(text: string\) => \{([\s\S]*?)\n  \};/)[1];
const results=[];
function setup(){
 const instances=[],timers=new Map();let timerId=0,slots=[],effects=[],cursor=0,api;
 class Recognition {constructor(){instances.push(this);this.starts=0;this.stops=0;} start(){this.starts++;} stop(){this.stops++;} abort(){this.stops++;} result(text,isFinal=true){this.onresult({resultIndex:0,results:[Object.assign([{transcript:text}],{isFinal})]});}}
 const globals={window:{SpeechRecognition:Recognition},console,setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)};
 function load(source,requireFn){const module={exports:{}};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{...globals,module,exports:module.exports,require:requireFn});return module.exports;}
 const service=load(serviceSource,()=>{throw Error('unexpected import');});
 const equal=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const react={useState(init){const i=cursor++;if(!(i in slots))slots[i]=init;return[slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useCallback(fn,deps){const i=cursor++;if(!slots[i]||!equal(slots[i].deps,deps))slots[i]={fn,deps};return slots[i].fn;},useEffect(fn,deps){const i=cursor++;if(!slots[i]||!equal(slots[i].deps,deps)){effects.push(()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};});}}};
 const hook=load(hookSource,n=>n==='react'?react:service);
 return {instances,timers,service,render(cb){cursor=0;api=hook.useVoiceNote(cb);effects.splice(0).forEach(f=>f());return api;},flushTimers(){const batch=[...timers.values()];timers.clear();batch.forEach(f=>f());},unmount(){slots.forEach(s=>s?.cleanup?.());}};
}
function test(id,fn){try{const evidence=fn();results.push({id,result:'PASS',evidence});}catch(e){results.push({id,result:'FAIL',error:e.message});}}
test('V01 recognition config',()=>{const h=setup();h.render(()=>{}).startRecording();const r=h.instances[0];assert.equal(r.lang,'zh-TW');assert.equal(r.continuous,true);assert.equal(r.interimResults,true);return {lang:r.lang,continuous:r.continuous,interimResults:r.interimResults};});
test('V02 interim and finalized chunk',()=>{const h=setup(),got=[];const cb=t=>got.push(t);h.render(cb).startRecording();const r=h.instances[0];r.result('辨識中',false);assert.equal(h.render(cb).interimText,'辨識中');r.result('完整一句');assert.deepEqual(got,['完整一句']);return {chunks:got};});
test('V03 stop must not append already-finalized text again',()=>{const h=setup(),got=[];const cb=t=>got.push(t);h.render(cb).startRecording();h.render(cb);h.instances[0].result('敏捷需求分解');h.render(cb).stopRecording();assert.deepEqual(got,['敏捷需求分解'],'actual append calls: '+JSON.stringify(got));});
test('V04 successive finals preserve both chunks',()=>{const h=setup(),writes=[];let memo='原筆記';function callback(){const captured={memo};return new Function('teamNote','response','isInputDisabled','slide','updateNote','text',callbackSource).bind(null,captured,{personalNote:''},false,{id:'slide-3'},(id,text)=>{memo=text;writes.push({id,text});});}h.render(callback()).startRecording();h.render(callback());h.instances[0].result('第一句');h.render(callback());h.instances[0].result('第二句');assert(memo.includes('第一句')&&memo.includes('第二句'),'actual writes: '+JSON.stringify(writes));});
test('V05 page switch must not append prior-page aggregate into new page on stop',()=>{const h=setup(),writes=[];const cb3=t=>writes.push({page:3,text:t}),cb4=t=>writes.push({page:4,text:t});h.render(cb3).startRecording();h.render(cb3);h.instances[0].result('第三頁講述');const newPage=h.render(cb4);newPage.stopRecording();assert(!writes.some(x=>x.page===4),'actual writes: '+JSON.stringify(writes));});
test('V06 active recording must respect new readonly callback',()=>{const h=setup(),writes=[];const editable=t=>writes.push(t),readonly=()=>{};h.render(editable).startRecording();h.render(editable);h.render(readonly);h.instances[0].result('切成唯讀後才完成辨識');assert.equal(writes.length,0,'actual old callback still invoked: '+JSON.stringify(writes));});
test('V07 onend restart and explicit stop cancel restart',()=>{const h=setup();h.render(()=>{}).startRecording();h.instances[0].onend();h.flushTimers();assert.equal(h.instances.length,2);h.service.voiceRecorder.stop();h.instances[1].onend();h.flushTimers();assert.equal(h.instances.length,2);return {recognizers:2,noRestartAfterStop:true};});
test('V08 unmount stops recorder',()=>{const h=setup();h.render(()=>{}).startRecording();h.render(()=>{});h.unmount();assert.equal(h.instances[0].stops,1);return {stopCalls:1};});
test('V09 retriable no-speech/audio-capture/network create new recognizer',()=>{for(const error of ['no-speech','audio-capture','network']){const h=setup();h.render(()=>{}).startRecording();h.instances[0].onerror({error});h.flushTimers();assert.equal(h.instances.length,2,error);}return {events:['no-speech','audio-capture','network'],timing:'fake timers; not real elapsed time'};});
const out={at:new Date().toISOString(),method:'actual TS service and hook transpiled into VM; minimal deterministic hook lifecycle + fake SpeechRecognition; not real browser/audio/React integration',hashes:Object.fromEntries([['service',serviceSource],['hook',hookSource],['panel',panelSource]].map(([k,s])=>[k,crypto.createHash('sha256').update(s).digest('hex')])),results};
const output=process.argv[2]||path.join(__dirname,'voice-behavior-results.json');fs.writeFileSync(output,JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));process.exitCode=results.some(r=>r.result==='FAIL')?1:0;
