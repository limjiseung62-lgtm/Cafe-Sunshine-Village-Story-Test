import{dimensions}from'./village-art-data.mjs';
export const villageVisualVersion=1;
const branchIds=['garden','bakery','dessert'];
export function visualCafeSnapshot(save){const run=save?.campaign?.run;return run&&!run.closed?{...save,...run.cafe,growthBranch:run.growthBranch??save.growthBranch}:save??{};}
const ownsStyle=(a,slot,style)=>style==='wood'||a?.owned?.includes(slot+':'+style)&&a?.receipts?.some(r=>r.item===slot+':'+style&&r.cost>0);
export function deriveVillageView(save,story){
 const cafe=visualCafeSnapshot(save),mega=cafe.mega??{},level=Math.max(1,Math.min(30,Number.isInteger(cafe.cafeLevel)?cafe.cafeLevel:1));
 const rawSpace=mega.paid?.spaceLevel,space=Number.isInteger(rawSpace)&&rawSpace>=1&&rawSpace<=30?rawSpace:1;
 const floor=[1,4,10,20,30].filter(n=>n<=space).at(-1),b=cafe.growthBranch;
 const branch=branchIds.includes(b?.active)?b.active:'basic',pendingBranch=branchIds.includes(b?.selected)&&b.selected!==b.active?b.selected:null;
 const spec=mega.finalGrowth?.specialization,path=['mass','brand'].includes(spec?.path)?spec.path:null,stage=path?Math.max(1,Math.min(4,spec.renewal?.stage??1)):0;
 const a=mega.finalGrowth?.renewal?.appearance,appearance={};for(const slot of['wall','window','door','floor','sign','light']){const style=a?.selected?.[slot];appearance[slot]=['wood','brick','glass','brand'].includes(style)&&ownsStyle(a,slot,style)?style:'wood';}
 const receipts=mega.finalGrowth?.renewal?.facilities?.receipts??[];const owned=k=>receipts.some(r=>r.kind===k&&r.cost>0);
 const facilities={terrace:space>=20&&owned('terrace'),vip:space>=30&&owned('vip'),landmark:space>=30&&owned('landmark')};
 const seen=Array.isArray(story?.viewed)?story.viewed:[],last=Math.max(0,...seen.filter(id=>/^story_lv\d{2}$/.test(id)).map(id=>Number(id.slice(-2))));
 const summary=story?.autoFlow?.mode==='summary'?Math.max(0,Math.min(30,story.autoFlow.summaryThrough??0)):0,worldLevel=Math.min(level,Math.max(last,summary));
 const world={level:worldLevel,lit:worldLevel>=1,bakery:worldLevel>=12?'open':worldLevel>=5?'repair':'closed',bookshop:worldLevel>=15?'open':'closed',festival:worldLevel>=20&&worldLevel<21,preparing:worldLevel>=18&&worldLevel<20,ending:worldLevel>=30,northUnfinished:true,residents:worldLevel>=14?3:worldLevel>=3?2:worldLevel>=2?1:0};
 const crewCount=Array.isArray(cafe.roster?.active)?cafe.roster.active.length:0;
 return{version:villageVisualVersion,level,space,dimensions:[...dimensions[space-1]],floor,branch,pendingBranch,specialization:path,specializationStage:stage,appearance,facilities,crewCount,world,warnings:last>level?['현재 카페보다 앞선 이야기 배경은 표시하지 않았어요.']:[]};
}
export const villageViewKey=v=>JSON.stringify(v);
