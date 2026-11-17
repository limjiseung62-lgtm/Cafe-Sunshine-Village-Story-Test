export const NAMESPACE='sunshine-independent-test-v1/';
export function installStorage(){
 if(globalThis.__SUNSHINE_ISOLATED)return;const p=Storage.prototype,read=p.getItem,write=p.setItem,remove=p.removeItem,key=p.key,len=Object.getOwnPropertyDescriptor(p,'length').get;
 const all=s=>Array.from({length:len.call(s)},(_,i)=>key.call(s,i)).filter(k=>k?.startsWith(NAMESPACE));
 const owner=s=>{if(globalThis.__SUNSHINE_ARCHIVE_CREATED_AT)return globalThis.__SUNSHINE_ARCHIVE_CREATED_AT;try{return JSON.parse(read.call(s,NAMESPACE+'cafe-v30-mega-common-rc1/cafe-learning-tycoon.growth.v1')??'null')?.createdAt??'unbound'}catch{return'unbound'}};
 const archive=s=>'learning/'+encodeURIComponent(owner(s))+'/',isRecord=k=>/^cafe-v30-mega-common-rc1\/common-record(?:\/|-index$)/.test(k),physical=(s,k)=>NAMESPACE+(isRecord(k)?archive(s):'')+k;
 const visible=s=>all(s).map(k=>k.slice(NAMESPACE.length)).filter(k=>!k.startsWith('learning/')||k.startsWith(archive(s))).map(k=>k.startsWith(archive(s))?k.slice(archive(s).length):k);
 p.getItem=function(k){return read.call(this,physical(this,String(k)))};p.setItem=function(k,v){return write.call(this,physical(this,String(k)),String(v))};p.removeItem=function(k){remove.call(this,physical(this,String(k)))};p.key=function(i){return visible(this)[i]??null};p.clear=function(){for(const k of visible(this))remove.call(this,physical(this,k))};
 Object.defineProperty(p,'length',{configurable:true,get(){return visible(this).length}});
 globalThis.__SUNSHINE_STORAGE_INTERNAL={entries:s=>all(s).map(k=>[k.slice(NAMESPACE.length),read.call(s,k)]).sort((a,b)=>a[0].localeCompare(b[0])),set:(s,k,v)=>write.call(s,NAMESPACE+k,v),remove:(s,k)=>remove.call(s,NAMESPACE+k)};
 if(globalThis.indexedDB){const open=indexedDB.open.bind(indexedDB),del=indexedDB.deleteDatabase.bind(indexedDB);indexedDB.open=(n,v)=>open(NAMESPACE+n,v);indexedDB.deleteDatabase=n=>del(NAMESPACE+n)}
 if(navigator.locks){const request=navigator.locks.request.bind(navigator.locks);navigator.locks.request=(name,...args)=>request(NAMESPACE+name,...args)}
 globalThis.__SUNSHINE_ISOLATED=true;
}
