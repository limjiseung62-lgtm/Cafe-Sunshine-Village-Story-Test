import{encodeStored,decodeStored}from'./storage-codec.mjs';
export const NAMESPACE='sunshine-independent-test-v1/';
export function installStorage(){
 if(globalThis.__SUNSHINE_ISOLATED)return;const p=Storage.prototype,read=p.getItem,write=p.setItem,remove=p.removeItem,key=p.key,len=Object.getOwnPropertyDescriptor(p,'length').get;
 const keyCache=new WeakMap(),ownerCache=new WeakMap(),nativeKey='cafe-v30-mega-common-rc1/cafe-learning-tycoon.growth.v1',invalidate=s=>{keyCache.delete(s);ownerCache.delete(s)};
 const all=s=>Array.from({length:len.call(s)},(_,i)=>key.call(s,i)).filter(k=>k?.startsWith(NAMESPACE));
 const owner=s=>{if(globalThis.__SUNSHINE_ARCHIVE_CREATED_AT)return globalThis.__SUNSHINE_ARCHIVE_CREATED_AT;if(ownerCache.has(s))return ownerCache.get(s);let value='unbound';try{value=JSON.parse(decodeStored(read.call(s,NAMESPACE+nativeKey))??'null')?.createdAt??'unbound'}catch{}ownerCache.set(s,value);return value};
 const archive=s=>'learning/'+encodeURIComponent(owner(s))+'/',isRecord=k=>/^cafe-v30-mega-common-rc1\/common-record(?:\/|-index$)/.test(k),physical=(s,k)=>NAMESPACE+(isRecord(k)?archive(s):'')+k;
 const visible=s=>{const prefix=archive(s),cached=keyCache.get(s);if(cached?.prefix===prefix)return cached.keys;const keys=all(s).map(k=>k.slice(NAMESPACE.length)).filter(k=>!k.startsWith('learning/')||k.startsWith(prefix)).map(k=>k.startsWith(prefix)?k.slice(prefix.length):k);keyCache.set(s,{prefix,keys});return keys};
 p.getItem=function(k){return decodeStored(read.call(this,physical(this,String(k))))};p.setItem=function(k,v){const target=physical(this,String(k)),encoded=encodeStored(String(v));const value=write.call(this,target,encoded);if(read.call(this,target)!==encoded){const error=Error('저장 후 읽기 확인 실패');error.code='SUNSHINE_SAVE_READBACK';throw error;}keyCache.delete(this);if(String(k)===nativeKey)ownerCache.delete(this);return value};p.removeItem=function(k){remove.call(this,physical(this,String(k)));keyCache.delete(this);if(String(k)===nativeKey)ownerCache.delete(this)};p.key=function(i){return visible(this)[i]??null};p.clear=function(){for(const k of visible(this))remove.call(this,physical(this,k));invalidate(this)};
 Object.defineProperty(p,'length',{configurable:true,get(){return visible(this).length}});
 globalThis.__SUNSHINE_STORAGE_INTERNAL={compactExistingCafe(){const target=NAMESPACE+nativeKey,raw=read.call(localStorage,target);if(!raw||raw.startsWith('~sunshine-z1|'))return{rewritten:false};let value;try{value=JSON.parse(raw)}catch{return{rewritten:false}}if(value?.schemaVersion!==1)return{rewritten:false};const encoded=encodeStored(raw);if(encoded===raw)return{rewritten:false};if(decodeStored(encoded,true)!==raw)throw Error('기존 카페의 무손실 압축을 확인하지 못했어요.');write.call(localStorage,target,encoded);if(read.call(localStorage,target)!==encoded){const e=Error('저장 확인 실패');e.code='SUNSHINE_SAVE_READBACK';throw e}invalidate(localStorage);return{rewritten:true,beforeCharacters:raw.length,afterCharacters:encoded.length}},entries:s=>all(s).map(k=>[k.slice(NAMESPACE.length),read.call(s,k)]).sort((a,b)=>a[0].localeCompare(b[0])),set:(s,k,v)=>{write.call(s,NAMESPACE+k,v);invalidate(s)},remove:(s,k)=>{remove.call(s,NAMESPACE+k);invalidate(s)}};
 addEventListener('storage',e=>{if(e.key===null||e.key.startsWith(NAMESPACE)){invalidate(localStorage);invalidate(sessionStorage)}});
 if(globalThis.indexedDB){const open=indexedDB.open.bind(indexedDB),del=indexedDB.deleteDatabase.bind(indexedDB);indexedDB.open=(n,v)=>open(NAMESPACE+n,v);indexedDB.deleteDatabase=n=>del(NAMESPACE+n)}
 if(navigator.locks){const request=navigator.locks.request.bind(navigator.locks);navigator.locks.request=(name,...args)=>request(NAMESPACE+name,...args)}
 globalThis.__SUNSHINE_ISOLATED=true;
}


export const compactExistingCafe=()=>globalThis.__SUNSHINE_STORAGE_INTERNAL?.compactExistingCafe?.();
