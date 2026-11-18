export const DISPLAY_LABEL_VERSION='0.1.0-candidate';
export const EXPECTED_CATALOG_SHA256='0527dedb852d4ccdc0cb305b2a27dda316b32634aa349d1f190b01e1d8cada09';
const required=(ok,reason)=>{if(!ok)throw Error(reason);};
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const scoped=(a,s)=>s.subject===a.subject&&s.grade===a.grade&&s.semester===a.semester&&s.unitId===a.unitId;
const rawID=s=>typeof s==='string'&&(/sem[12]_unit\d\//.test(s)||/^(?:G4[A-Z]*-[TF]-|qb3-display:)/.test(s)||/^[a-f0-9]{64}$/.test(s));
export function validateLabelCatalog(c){
 required(c?.schemaVersion==='school-quest-display-labels/1'&&c.version===DISPLAY_LABEL_VERSION,'LABEL_SCHEMA_OR_VERSION_MISMATCH');required(c.namespace.subject==='math'&&c.namespace.grade===4,'LABEL_NAMESPACE_MISMATCH');required(c.policy.idsAreImmutable&&c.policy.storedLabelsAndScopeDigestsAreImmutable&&c.policy.neverMergeScopesOrTwinsBySameLabel,'LABEL_POLICY_MISSING');
 for(const[id,n]of Object.entries(c.displayNodes)){required(n.id===id&&typeof n.label==='string'&&n.label.length>0&&n.label.length<=200&&!rawID(n.label)&&/[가-힣]/.test(n.label),'LABEL_NODE_INVALID');required(n.subject==='math'&&n.grade===4&&[1,2].includes(n.semester)&&n.officialCurriculumElement===false,'LABEL_NODE_SCOPE_INVALID');}
 for(const[id,a]of Object.entries(c.taskAliases)){required(a.id===id&&a.kind==='question-task-alias'&&a.unitId===id.split('/')[0],'TASK_ALIAS_INVALID');required(c.units[a.unitId]?.semester===a.semester,'ALIAS_UNIT_MISMATCH');if(a.labelRef)required(scoped(c.displayNodes[a.labelRef],a),'ALIAS_DISPLAY_SCOPE_MISMATCH');required((a.status==='connected-existing-name')===!!a.labelRef,'ALIAS_STATUS_MISMATCH');}
 for(const[id,p]of Object.entries(c.equivalenceProfiles)){required(p.id===id&&c.taskAliases[p.taskId]&&id.startsWith(p.taskId+'|'),'PROFILE_ALIAS_MISMATCH');if(p.labelRef)required(scoped(c.displayNodes[p.labelRef],c.taskAliases[p.taskId]),'PROFILE_DISPLAY_SCOPE_MISMATCH');}
 return true;
}
export function createLabelResolver(input){validateLabelCatalog(input);const catalog=freeze(structuredClone(input));
 function resolve({subject,grade,semester,unitId,skillId,groupId=null,existingLabel=null}){
  const scope={subject,grade,semester,unitId};
  if(subject!=='math'||grade!==4)return freeze({id:skillId,label:existingLabel,status:'unmanaged-preserve-existing',catalogVersion:null});
  if(typeof skillId!=='string'||!catalog.taskAliases[skillId])return freeze({id:skillId,label:rawID(skillId)?null:existingLabel,status:rawID(skillId)?'internal-or-unknown-id':'unmanaged-preserve-existing',catalogVersion:catalog.version});
  const alias=catalog.taskAliases[skillId];
  if(!scoped(alias,scope))return freeze({id:skillId,label:rawID(existingLabel)||existingLabel===skillId?'학습 범위 확인 필요':existingLabel,status:'scope-mismatch',catalogVersion:catalog.version});
  let profile=null;if(groupId){profile=catalog.equivalenceProfiles[groupId];if(!profile||profile.taskId!==skillId)return freeze({id:skillId,label:'학습 범위 확인 필요',status:'profile-mismatch',catalogVersion:catalog.version});}
  const ref=profile?.labelRef??(!profile?alias.labelRef:null),node=ref?catalog.displayNodes[ref]:null;
  return freeze({id:skillId,label:node?.label??(catalog.units[unitId].label+' · 세부 유형 확인 중'),status:node?'connected-existing-name':'name-review-pending',displayNodeId:node?.id??null,catalogVersion:catalog.version,officialCurriculumElement:false});
 }
 return freeze({version:catalog.version,catalog,resolve,objectiveView(objective,scope){const display=resolve({...scope,skillId:objective.id,existingLabel:objective.label});return freeze({id:objective.id,label:display.label??(rawID(objective.label)||rawID(objective.id)?'학습 내용 · 명칭 확인 중':objective.label),status:display.status});},questionView(question,scope={}){const m=question.metadata??{},skillId=question.skillId??m.skillIds?.[0]??m.learningObjectiveId;return resolve({subject:m.subject??scope.subject,grade:m.grade??scope.grade,semester:m.semester??scope.semester,unitId:m.unitId??scope.unitId,skillId,groupId:question.equivalenceKey??m.groupId??m.equivalenceKey,existingLabel:scope.existingLabel});}});
}
let loading;
export async function loadSharedLabels({fetcher=fetch,catalogURL=new URL('./catalog.json',import.meta.url),expectedSHA256=EXPECTED_CATALOG_SHA256}={}){
 const response=await fetcher(catalogURL);required(response.ok,'LABEL_CATALOG_LOAD_FAILED');const bytes=new Uint8Array(await response.arrayBuffer()),actual=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');required(actual===expectedSHA256,'LABEL_CATALOG_HASH_MISMATCH');return createLabelResolver(JSON.parse(new TextDecoder().decode(bytes)));
}
export const sharedLabels=()=>loading??=loadSharedLabels().catch(e=>{loading=null;throw e;});
let reportLabelLoad;
// Rendering extension only. Original reports, stored labels, digests, IDs and numeric results remain untouched.
export async function displayReportLabel(row,report){
 const id=row.skillId??row.id,scope={subject:report.subject,grade:row.grade??report.grade,semester:row.semester??report.semester,unitId:row.unitId??report.unitId,skillId:id,existingLabel:row.label};
 if(scope.subject!=='math'||scope.grade!==4)return row.label;
 let view;try{const resolver=await(reportLabelLoad??=sharedLabels());view=resolver.resolve(scope);}catch(error){view={label:typeof row.label==='string'&&/[가-힣]/.test(row.label)?row.label:'학습 내용 · 명칭 불러오기 대기',status:'label-load-pending',error:error.message};}
 const label=view.label??(rawID(row.label)?'학습 내용 · 명칭 확인 중':row.label);
 globalThis.__SQ_LABEL_RENDER_AUDIT?.push({id,unitId:scope.unitId,label,status:view.status,version:DISPLAY_LABEL_VERSION,...view.error?{warning:view.error}:{}});return label;
}
