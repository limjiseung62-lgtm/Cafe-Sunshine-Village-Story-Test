import{availableUiFeatures}from'./featureVisibility.js';
import { mountRewardWallet } from './renewalRewardUi.js';
import { newTutorialPause, beginTutorialPause, endTutorialPause } from './tutorialPause.js';
import { newRenewalTutorials, pendingTutorials, tutorialLevels, tutorialTitles } from './renewalTutorialState.js?v=20261119-3';
import { tutorialGuideSteps } from './tutorialGuideSteps.js';
import{unlocked}from'./progressiveFeatures.js';
import { activeMini } from './miniGames.js';
let current, flush = () => false, dialog;
function progress(g) { if (g.mega?.finalGrowth?.renewal)
    return g.mega.finalGrowth.renewal.tutorials ??= newRenewalTutorials(); g.tutorialPause ??= newTutorialPause(); return g.tutorialPause.progress ??= newRenewalTutorials(); }
const enabled = (g) => !!g.mega?.finalGrowth?.renewal;
export function beginRenewalTutorials(g, save, flow) { dialog?.remove(); dialog = undefined; current = g; flush = save; mountRewardWallet(g, save); document.getElementById('renewal-help')?.remove(); if (!enabled(g))
    return; const b = document.createElement('button'); b.id = 'renewal-help'; b.textContent = '카페 이용 안내'; b.style.minHeight = '48px'; b.onclick = () => help(g); document.getElementById('playing')?.append(b); }
export function pollRenewalTutorials(g) { if(g===current && enabled(g) && unlocked(g,'missions') && !document.getElementById('renewal-reward-wallet'))mountRewardWallet(g,flush); if (g !== current || !enabled(g) || dialog || g.status !== 'RUNNING' || activeMini(g) || document.querySelector('dialog[open]') || !document.getElementById('problem-panel')?.hidden)
    return; const active = g.tutorialPause?.active?.reasons[0], level = active ? Number(active.slice(9)) : pendingTutorials(progress(g), g.cafeLevel).find(level=>guideAvailable(g,level)); if (level)
    void open(g, level); }
function help(g) { if (dialog || document.querySelector('dialog[open]'))
    return; const d = document.createElement('dialog'); d.style.cssText = 'max-height:85vh;overflow:auto;width:min(600px,92vw)'; const h = document.createElement('h2'); h.textContent = '필요한 안내를 다시 읽어요'; d.append(h); for (const [i, level] of tutorialLevels.entries()) {
    if (level > g.cafeLevel || !guideAvailable(g,level)) continue;
    const b = document.createElement('button');
    b.textContent = 'Lv.' + level + ' ' + tutorialTitles[i] + ' · ' + (progress(g).states[level] === 'complete' ? '완료' : progress(g).states[level] === 'skipped' ? '건너뜀' : '미시청');
    b.style.cssText = 'display:block;min-height:48px;margin:6px';
    b.disabled = level > g.cafeLevel;
    b.onclick = () => { d.remove(); void open(g, level); };
    d.append(b);
} const back = document.createElement('button'); back.textContent = '닫기'; back.onclick = () => d.remove(); d.append(back); document.body.append(d); d.showModal(); }
async function open(g, level) {
    if (dialog || g.status !== 'RUNNING')
        return;
    const reason = 'tutorial-' + level;
    g.tutorialPause ??= newTutorialPause();
    if (!beginTutorialPause(g.tutorialPause, reason))
        return;
    const d = document.createElement('dialog');
    dialog = d;
    d.className = 'renewal-tutorial';
    d.style.cssText = 'width:min(760px,94vw);max-height:90vh;overflow:auto;background:#fff8ed;color:#24382d;border-radius:20px';
    document.body.append(d);
    const h = document.createElement('h2');
    h.textContent = '새 기능 안내 · ' + tutorialTitles[tutorialLevels.indexOf(level)];
    const frozen = document.createElement('p');
    frozen.textContent = '영업 시간이 잠시 멈췄어요. 안내를 읽어도 돈이나 재고는 바뀌지 않아요. 실제 구매와 선택은 카페 화면에서 직접 해요.';
    const area = document.createElement('section'), status = document.createElement('p');
    status.setAttribute('role', 'status');
    d.append(h, frozen, area, status);
    const finish = (outcome, all = false) => { const before = structuredClone(g.tutorialPause), states = structuredClone(progress(g)); if (all)
        for (const l of pendingTutorials(progress(g), g.cafeLevel))
            progress(g).states[l] = 'skipped';
    else
        progress(g).states[level] = outcome; endTutorialPause(g.tutorialPause, reason); if (!flush()) {
        g.tutorialPause = before;
        if (g.mega?.finalGrowth?.renewal)
            g.mega.finalGrowth.renewal.tutorials = states;
        status.textContent = '안내 확인을 저장하지 못했어요. 다시 눌러 주세요.';
        return;
    } d.remove(); dialog = undefined; };
    const done = document.createElement('button');
    done.textContent = '안내 완료 · 카페로 돌아가기';
    done.disabled = true;
    const skip = document.createElement('button');
    skip.textContent = '이번 안내 건너뛰기';
    skip.onclick = () => finish('skipped');
    const skipAll = document.createElement('button');
    skipAll.textContent = '지금 열린 안내 모두 건너뛰기';
    skipAll.onclick = () => finish('skipped', true);
    for (const b of [done, skip, skipAll])
        b.style.cssText = 'min-height:48px;margin:5px';
    done.onclick = () => finish('complete');
    d.append(done, skip, skipAll);
    d.oncancel = e => { e.preventDefault(); finish('skipped'); };
    d.showModal();
    if (!flush()) {
        status.textContent = '튜토리얼 일시정지를 저장하지 못했어요. 저장 공간을 확인해 주세요.';
        return;
    }
    const steps = tutorialGuideSteps[level];
    const instructions = document.createElement('p');
    instructions.id = level === 1 ? 'first-cafe-guide' : 'cafe-guide';
    instructions.style.cssText = 'font-size:20px;line-height:1.7;padding:16px';
    area.append(instructions);
    let step = 0;
    const show = () => {
        instructions.textContent = steps[step];
        done.textContent = step < steps.length - 1 ? '다음' : '안내 완료 · 카페로 돌아가기';
        done.disabled = false;
    };
    done.onclick = () => { if (step < steps.length - 1) { step++; show(); } else finish('complete'); };
    show();
}

function guideAvailable(g,level){const f=availableUiFeatures(g);return level===11?f.specialization:level===14?f.supply:level===30?f.franchise:level===3?f.recruitment:level===9?f.education:true;}
