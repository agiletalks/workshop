const fs=require('fs'),{spawn}=require('child_process');
const out='C:/VIBE/QA/split-production-20261104';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const child=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--disable-extensions','--remote-debugging-port=9467','--no-first-run','--no-default-browser-check','--user-data-dir='+out+'/retest-timing-profile','about:blank'],{windowsHide:true,stdio:'ignore'});
let ws,id=0;const pending=new Map();
function send(method,params={},sessionId){return new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(Error('timeout '+method))},25000);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));})}
const results=[];
(async()=>{try{
let info;for(let i=0;i<30;i++){try{info=await(await fetch('http://127.0.0.1:9467/json/version')).json();break}catch{await sleep(200)}}
ws=new WebSocket(info.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});ws.onmessage=e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}};
for(const [label,width,height] of [['desktop',1366,768],['mobile-emulated',390,844]])for(let trial=1;trial<=3;trial++){
 const {browserContextId}=await send('Target.createBrowserContext');const {targetId}=await send('Target.createTarget',{url:'about:blank',browserContextId});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 const cmd=(m,p)=>send(m,p,sessionId);const ev=async expression=>{const r=await cmd('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
 await cmd('Page.enable');await cmd('Runtime.enable');await cmd('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await cmd('Page.navigate',{url:'https://agiletalks-workshop.web.app/workshop/split/?c=202611-split'});
 for(let n=0;n<80;n++){if(await ev(`!!document.querySelector('input[placeholder="例如：Alex"]')`))break;await sleep(250)}
 await sleep(3000);
 const before=await ev(`({url:location.href,groups:[...document.querySelectorAll('select option')].map(e=>e.textContent),ua:navigator.userAgent,scripts:[...document.scripts].map(e=>e.src).filter(Boolean)})`);
 await ev(`(()=>{const inputs=[...document.querySelectorAll('input')];const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;for(const [i,value] of [[0,'QA-Retest-${label}-${trial}'],[1,'split-2026']]){set.call(inputs[i],value);inputs[i].dispatchEvent(new Event('input',{bubbles:true}));inputs[i].dispatchEvent(new Event('change',{bubbles:true}));}return inputs.length})()`);
 const measured=await ev(`new Promise(resolve=>{const b=document.querySelector('button[type="submit"]');let start;const observer=new MutationObserver(()=>{const top=document.querySelector('header');if(start!==undefined&&top&&top.getBoundingClientRect().height>0&&top.textContent.includes('SPLIT')){const domMs=performance.now()-start;observer.disconnect();requestAnimationFrame(()=>requestAnimationFrame(()=>resolve({domMs,twoRafMs:performance.now()-start,header:top.textContent,viewport:{width:innerWidth,height:innerHeight}})));}});observer.observe(document.body,{childList:true,subtree:true,attributes:true});b.addEventListener('click',()=>{start=performance.now()},{capture:true,once:true});b.click();setTimeout(()=>{observer.disconnect();resolve({timeout:true,text:document.body.innerText.slice(0,700)})},15000);})`);
 const item={label,trial,prewarmWaitMs:3000,...before,...measured};results.push(item);console.log(JSON.stringify(item));
 const snap=await cmd('Page.captureScreenshot',{format:'jpeg',quality:85});fs.writeFileSync(out+'/retest-timing-'+label+'-'+trial+'.jpg',Buffer.from(snap.data,'base64'));
 await send('Target.disposeBrowserContext',{browserContextId});
}
}catch(e){results.push({error:e.stack});console.error(e.stack);process.exitCode=1}finally{fs.writeFileSync(out+'/retest-login-timing.json',JSON.stringify({date:new Date().toISOString(),method:'Browser performance.now click capture to visible header MutationObserver; two requestAnimationFrame paint opportunity; isolated headless Edge contexts; 3s prewarm; no network throttle',results},null,2));if(ws){try{await send('Browser.close')}catch{}ws.close()}child.kill();}})();
