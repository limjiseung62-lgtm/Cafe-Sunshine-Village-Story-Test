// Display serialization only. No question, answer, semantic key or approval mutation.
// Security gates belong to the host and MUST run on the resulting string unchanged.
function attrs(node){const a={};for(const m of node.matchAll(/\s([\w:-]+)\s*=\s*(["'])(.*?)\2/g))a[m[1]]=m[3];return a;}
const esc=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
const xml=a=>Object.entries(a).map(([k,v])=>' '+k+'="'+esc(v)+'"').join('');
const numeric=s=>/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s);
function difference(a,b){const count=s=>(s.split('.')[1]??'').length,n=Math.max(count(a),count(b)),integer=s=>{const neg=s.startsWith('-');s=s.replace(/^[-+]/,'');const [i,f='']=s.split('.');return BigInt((i||'0')+f.padEnd(n,'0'))*(neg?-1n:1n);};let v=integer(a)-integer(b),negative=v<0n;if(negative)v=-v;let s=v.toString().padStart(n+1,'0');if(n)s=s.slice(0,-n)+'.'+s.slice(-n);s=s.replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,'');return(negative?'-':'')+s;}
const shorter=(a,b)=>a.length<=b.length?a:b;
function pointStep(x,y,px,py){return x===px?shorter('V'+y,'v'+difference(y,py)):y===py?shorter('H'+x,'h'+difference(x,px)):shorter('L'+x+' '+y,'l'+difference(x,px)+' '+difference(y,py));}
function linePath(a){if(!['x1','y1','x2','y2'].every(k=>numeric(a[k]??'')))return null;return 'M'+a.x1+' '+a.y1+pointStep(a.x2,a.y2,a.x1,a.y1);}
export function compactSVGDisplay(source){
 if(typeof source!=='string'||!source.startsWith('<svg ')||source.length<60000)return source;
 // Never sanitize forbidden executable/resource content into an apparently safe payload.
 if(/<\s*(?:script|image|foreignObject|iframe|object|embed|use|style|animate|set)\b|\bon\w+\s*=|\b(?:href|src)\s*=|<!/i.test(source))return source;
 let s=source.replace(/\sdata-[\w-]+\s*=\s*(?:"[^"]*"|'[^']*')/g,'');
 // Keep each tick as its own painted path; do not batch independent strokes.
 s=s.replace(/(?:<line\b[^>]*\/>\s*){2,}/g,run=>{
  const nodes=[...run.matchAll(/<line\b[^>]*\/>/g)].map(m=>m[0]);let out='',group=[],signature=null,common=null;
  const flush=()=>{if(group.length)out+=group.length===1?group[0].node:'<g'+xml(common)+'>'+group.map(x=>'<path d="'+x.d+'"/>').join('')+'</g>';group=[];};
  for(const node of nodes){const a=attrs(node),d=linePath(a);for(const k of['x1','y1','x2','y2'])delete a[k];const key=JSON.stringify(a);if(!d||a.id||a.transform||a.opacity||a['stroke-dasharray']||a['stroke-linecap']||a['marker-start']||a['marker-end']){flush();out+=node;signature=null;continue;}if(key!==signature){flush();signature=key;common=a;}group.push({d,node});}flush();return out;
 });
 // Hoist identical inherited polygon paint into a group, preserving drawing order.
 s=s.replace(/(?:<polygon\b[^>]*\/>\s*){2,}/g,run=>{
  const nodes=[...run.matchAll(/<polygon\b[^>]*\/>/g)].map(m=>m[0]),aa=nodes.map(attrs),common={};
  for(const k of['stroke','stroke-width','stroke-linejoin','stroke-linecap'])if(aa[0][k]&&aa.every(a=>a[k]===aa[0][k]))common[k]=aa[0][k];
  const fills=new Map();for(const a of aa)if(a.fill)fills.set(a.fill,(fills.get(a.fill)??0)+1);const most=[...fills].sort((a,b)=>b[1]-a[1])[0];if(most&&most[1]>1)common.fill=most[0];
  if(!Object.keys(common).length)return run;
  return '<g'+xml(common)+'>'+nodes.map((node,i)=>{for(const k of Object.keys(common))if(aa[i][k]===common[k])delete aa[i][k];return '<polygon'+xml(aa[i])+'/>';}).join('')+'</g>';
 });
 s=s.replace(/<polygon\b[^>]*\/>/g,node=>{const a=attrs(node),v=(a.points??'').trim().split(/[\s,]+/);if(v.length!==6||v.some(x=>!numeric(x)))return node;let d='M'+v[0]+' '+v[1];for(let i=2;i<6;i+=2)d+=pointStep(v[i],v[i+1],v[i-2],v[i-1]);d+='Z';delete a.points;return '<path d="'+d+'"'+xml(a)+'/>';});
 // Four-decimal SVG-unit serialization precision; angle/length/label values are not rounded.
 // Coordinates are checked against the original and raster-compared in the release QA.
 s=s.replace(/\bd="([^"]+)"/g,(all,d)=>'d="'+d.replace(/[-+]?(?:\d+\.\d+|\.\d+)/g,n=>{const value=Number(n);return Number.isFinite(value)?String(Number(value.toFixed(4))):n;})+'"');
 return s;
}
