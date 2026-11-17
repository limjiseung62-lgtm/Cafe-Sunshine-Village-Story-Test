import{BrowserGrowthRepository}from'./game/saveRepository.js';import{deploymentLocalStorage}from'./game/deploymentStorage.js';import{checkedGrowthBackup,prepareGrowthRestore}from'./game/backupRecovery.js';import{ensureGrowthWriteLock,releaseGrowthWriteLock}from'./game/growthWriteLock.js';
const repo=new BrowserGrowthRepository(deploymentLocalStorage),prepared=new Map();const active=()=>{const el=document.getElementById('playing');return!!el&&!el.hidden};
addEventListener('message',async e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='sunshine-native-backup/1')return;const{id,action,text}=e.data;let result;
 try{if(active())throw Error('영업을 마치거나 저장하고 나간 뒤 백업·복원을 해 주세요.');
  if(action==='export'){const s=repo.read();if(s.status!=='ready')throw Error('먼저 새 카페를 시작해 저장해 주세요.');result={text:checkedGrowthBackup(s.save),save:s.save};}
  else if(action==='inspect'){const p=await prepareGrowthRestore(text,repo);prepared.clear();prepared.set(id,p);result={token:id,save:p.save};}
  else if(action==='commit'){const p=prepared.get(e.data.token);if(!p)throw Error('다시 파일을 선택해 주세요.');if(!await ensureGrowthWriteLock())throw Error('다른 테스트 카페 창이 열려 있어요.');try{globalThis.__SUNSHINE_ARCHIVE_CREATED_AT=p.save.createdAt;const r=await p.restore();if(!r.ok)throw Error(r.message);prepared.delete(e.data.token);result={ok:true}}finally{delete globalThis.__SUNSHINE_ARCHIVE_CREATED_AT;releaseGrowthWriteLock()}}
  else throw Error('지원하지 않는 요청이에요.');parent.postMessage({type:'sunshine-native-backup-result/1',id,result},location.origin);
 }catch(err){parent.postMessage({type:'sunshine-native-backup-result/1',id,error:err.message},location.origin)}
});parent.postMessage({type:'sunshine-native-ready/1'},location.origin);
document.addEventListener('click',e=>{const b=e.target?.closest?.('[data-backup-restore]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();parent.postMessage({type:'sunshine-open-backups/1'},location.origin)},true);
