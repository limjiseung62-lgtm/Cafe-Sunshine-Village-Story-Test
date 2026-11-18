// Use after canonical RC row verification. This sidecar never mutates row.render.svg.
// The host's unchanged SVG safety gate is mandatory; no alternative sanitizer is used.
export function createSVGDisplayResolver({pins,baseURL,safeCommonDiagram,fetchImpl=fetch,cacheLimit=4*1024*1024}){
 if(typeof safeCommonDiagram!=='function'||!pins||!baseURL)throw Error('SVG_DISPLAY_RESOLVER_CONFIGURATION');
 const cache=new Map();let bytes=0,requests=0;const digest=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const cachePut=(key,value)=>{const size=new TextEncoder().encode(value).byteLength;while(bytes+size>cacheLimit&&cache.size){const [id,v]=cache.entries().next().value;cache.delete(id);bytes-=v.bytes;}if(size<=cacheLimit){cache.set(key,{value,bytes:size});bytes+=size;}};
 return {async resolve(row,{signal}={}){
  const source=row?.render?.svg;if(!source)return source;
  const pin=pins[row.questionId];if(!pin)return source; // unknown conditions never acquire replacement authority
  if(await digest(source)!==pin.sourceSVG_SHA256)throw Error('SVG_DISPLAY_SOURCE_HASH_MISMATCH');
  signal?.throwIfAborted();const old=cache.get(row.questionId);if(old){cache.delete(row.questionId);cache.set(row.questionId,old);return old.value;}
  requests++;const response=await fetchImpl(new URL(pin.file,baseURL),{signal});if(!response.ok)throw Error('SVG_DISPLAY_LOAD_FAILED');
  const display=await response.text();if(await digest(display)!==pin.displaySVG_SHA256)throw Error('SVG_DISPLAY_HASH_MISMATCH');
  if(!safeCommonDiagram(display))throw Error('SVG_DISPLAY_SAFETY_REJECTED');signal?.throwIfAborted();cachePut(row.questionId,display);return display;
 },clear(){cache.clear();bytes=0;},stats(){return{entries:cache.size,serializedCacheBytes:bytes,cacheLimit,requests};}};
}
