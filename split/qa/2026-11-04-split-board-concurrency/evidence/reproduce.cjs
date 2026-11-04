const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('C:/Antigravity/workshop/split/public/board.html','utf8');
function extract(name,next){const start=source.indexOf('    function '+name+'(');const end=source.indexOf('    function '+next+'(',start);if(start<0||end<0)throw Error('function missing');return source.slice(start,end);}
const merge=extract('mergeRemoteNotes','mergeRemoteLines');
const write=extract('doFirestoreWrite','saveLocalViewportOnly');
const copy=x=>JSON.parse(JSON.stringify(x));
const old=new Date(Date.now()-60000).toISOString();const now=new Date().toISOString();
let server={};const writes=[];
function client(notes){const c={boardState:{notes:copy(notes),lines:[],boardName:'QA isolated'},activeModalMode:null,activeEditingNoteId:null,selectedNoteIds:new Set(),isUserDraggingNote:false,console,APP_ID:'qa',CURRENT_ROOM_ID:'isolated',localStorage:{setItem(){}},setSyncStatus(){},roomDocRef:{set(data){server={...server,...copy(data)};writes.push(copy(data));return Promise.resolve();}}};vm.createContext(c);vm.runInContext(merge+'\n'+write,c);return c;}
const results=[];
const base=[{id:'A',text:'original A',x:0,y:0,createdAt:old,updatedAt:old},{id:'B',text:'original B',x:200,y:0,createdAt:old,updatedAt:old}];
const a=client(base),b=client(base);a.boardState.notes[0].text='A edited by user 1';a.boardState.notes[0].updatedAt=now;b.boardState.notes[1].text='B edited by user 2';b.boardState.notes[1].updatedAt=now;
a.doFirestoreWrite();b.doFirestoreWrite();assert.equal(server.notes[0].text,'original A');results.push({case:'different cards concurrent write',reproduced:true,expected:'both edits retained',actual:copy(server.notes),reason:'set merge true replaces notes array as a field'});
const d=client([{id:'fresh',text:'new note',x:0,y:0,createdAt:now,updatedAt:now}]);d.mergeRemoteNotes([]);assert.equal(d.boardState.notes.length,1);d.doFirestoreWrite();assert.equal(server.notes[0].id,'fresh');results.push({case:'remote deletion resurrected',reproduced:true,expected:'deleted note absent',actual:copy(server.notes),reason:'15 second local retention plus subsequent full array write'});
const drag=client([base[0]]);drag.boardState.notes[0].x=500;drag.doFirestoreWrite();drag.mergeRemoteNotes([base[0]]);assert.equal(drag.boardState.notes[0].x,0);results.push({case:'drag release with pending stale snapshot',reproduced:true,expected:'x=500',actualX:drag.boardState.notes[0].x,reason:'drag does not update note timestamp; equal timestamp remote wins after save'});
const result={date:new Date().toISOString(),scope:'Local VM executes extracted current production-source functions; Firestore top-level merge emulated, not live cloud/browser test; no cloud writes.',source:'split/public/board.html',results};fs.writeFileSync('C:/VIBE/QA/split-board-concurrency-20261104/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
