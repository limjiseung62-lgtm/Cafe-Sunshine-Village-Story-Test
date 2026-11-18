import{PLAYER,entries,newPlayer,atomicRestore}from'./transactions.mjs?v=20261119-1';
import{emptyProgress}from'./src/story-state.mjs';
import{validateRows,NS}from'./storage-engine.mjs?v=20261119-1';
export const RESTART_BACKUP='sunshine-restart-backup/1';
const digest=async rows=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(rows))))].map(n=>n.toString(16).padStart(2,'0')).join('');
export async function restartStoryCafe(s){
 const rows=entries(s).filter(([k])=>k!==RESTART_BACKUP),player=newPlayer();
 validateRows(rows.map(([k,v])=>[NS+k,v]));
 const archive={format:'sunshine-before-restart/1',savedAt:new Date().toISOString(),rows,sha256:await digest(rows)};
 await atomicRestore(s,()=>{
  for(const[k]of entries(s))s.removeItem(k);
  s.setItem(RESTART_BACKUP,JSON.stringify(archive));
  s.setItem(PLAYER,JSON.stringify(player));
  s.setItem('sunshine-story-v1/'+player.id,JSON.stringify(emptyProgress(player.id)));
 });
 return player;
}
export async function restoreBeforeRestart(s){
 const archive=JSON.parse(s.getItem(RESTART_BACKUP)??'null');
 if(archive?.format!=='sunshine-before-restart/1'||!Array.isArray(archive.rows)||archive.sha256!==await digest(archive.rows))throw Error('이전 카페 보관본을 확인하지 못했어요. 현재 기록은 그대로예요.');
 validateRows(archive.rows.map(([k,v])=>[NS+k,v]));
 const current=entries(s).filter(([k])=>k!==RESTART_BACKUP),backup={format:archive.format,savedAt:new Date().toISOString(),rows:current,sha256:await digest(current)};
 const internal=globalThis.__SUNSHINE_STORAGE_INTERNAL;
 if(!internal)throw Error('안전한 저장 기능을 준비하지 못했어요.');
 await atomicRestore(s,()=>{for(const[k]of entries(s))s.removeItem(k);for(const[k,v]of archive.rows)internal.set(s,k,v);s.setItem(RESTART_BACKUP,JSON.stringify(backup));});
}
export function installRestartUI({prepare,block,unblock,backup,say}){
 const d=document.createElement('dialog');d.id='restart-dialog';d.style.cssText='width:min(560px,94vw);max-height:85vh;overflow:auto';
 d.innerHTML='<h2>처음부터 새로 시작할까요?</h2><p>지금 카페와 이야기를 멈추고 Lv.1 새 카페와 프롤로그부터 시작해요. 현금·가구·직원·학습·이야기는 새 기록으로 분리돼요.</p><p>직전 카페는 이 기기에 한 개 자동 보관해요. 오래 보관하려면 먼저 통합 JSON을 받아 주세요. 사이트 데이터를 지우면 기기 보관본도 사라져요.</p><p>영업 중이라면 먼저 카페 메뉴에서 저장하고 나가기를 눌러 주세요.</p><button id="restart-export">먼저 통합 백업하기</button><button id="restart-confirm">확인 · Lv.1부터 새로 시작하기</button><button id="restart-cancel">취소 · 지금 카페 유지</button><p role="status" id="restart-status"></p>';
 for(const b of d.querySelectorAll('button'))b.style.cssText='display:block;min-height:48px;margin:10px 0;width:100%';document.body.append(d);
 let processing=false;d.oncancel=e=>{if(processing)e.preventDefault()};
 const open=()=>{if(document.querySelector('dialog[open]')){say('열린 안내나 설정을 닫은 뒤 새로 시작하기를 눌러 주세요.');return}d.querySelector('#restart-status').textContent='';d.showModal()};
 const b=document.createElement('button');b.id='restart-cafe';b.textContent='새로 시작하기 · Lv.1';b.style.minHeight='48px';document.getElementById('enter-game').after(b);
 b.onclick=open;const settings=document.createElement('button');settings.id='restart-in-settings';settings.textContent='새로 시작하기 · Lv.1';settings.style.minHeight='48px';settings.onclick=()=>{document.getElementById('settings-dialog').close();open()};document.getElementById('settings-dialog').append(settings);
 d.querySelector('#restart-cancel').onclick=()=>d.close();
 d.querySelector('#restart-export').onclick=async()=>{try{d.close();await backup()}catch(e){say(e.message)}};
 const transact=async(fn)=>{await prepare();try{await block();await fn(localStorage);await globalThis.__SUNSHINE_STORAGE_FLUSH();location.reload()}catch(e){unblock();throw e}};
 d.querySelector('#restart-confirm').onclick=async()=>{const yes=d.querySelector('#restart-confirm');processing=true;d.querySelectorAll('button').forEach(b=>b.disabled=true);d.querySelector('#restart-status').textContent='기존 기록을 보관하고 새 카페를 준비하고 있어요.';try{await transact(restartStoryCafe)}catch(e){processing=false;d.querySelectorAll('button').forEach(b=>b.disabled=false);d.querySelector('#restart-status').textContent='새로 시작하지 못했어요. 기존 정상 기록을 보존했어요. '+e.message;yes.disabled=false}};
 if(localStorage.getItem(RESTART_BACKUP)){const restore=document.createElement('button');restore.id='restore-before-restart';restore.textContent='직전 카페로 되돌아가기';restore.style.minHeight='48px';restore.onclick=async()=>{if(!confirm('현재 카페 대신 직전 카페와 이야기로 되돌아갈까요? 현재 기록은 직전 보관본으로 교환해요.'))return;restore.disabled=true;try{await transact(restoreBeforeRestart)}catch(e){say(e.message);restore.disabled=false}};document.getElementById('settings-dialog').append(restore)}
}
