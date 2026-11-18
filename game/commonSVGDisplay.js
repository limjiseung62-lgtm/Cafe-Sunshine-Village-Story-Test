import { safeCommonDiagram } from './questionRenderer.js';
const manifestSHA = "fe92d41f0d9fc772e88eee3e41e58cc1b9a390735e8e408af7d5768a997fc945";
let prepared;
async function digest(b) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function load() { const base = new URL('assets/qb3-svg-display/', document.baseURI); const get = async (name, sha) => { const r = await fetch(new URL(name, base)); if (!r.ok)
    throw Error('SVG_DISPLAY_METADATA_LOAD_FAILED'); const b = await r.arrayBuffer(); if (await digest(b) !== sha)
    throw Error('SVG_DISPLAY_METADATA_HASH_MISMATCH'); return b; }; const mb = await get('manifest.json', manifestSHA), m = JSON.parse(new TextDecoder().decode(mb)); if (m.parentManifestSHA256 !== '2947f91645686b9fc3b13bae9aa4c7f26e6180e1c623c91da5f935efe4a361fb' || m.displayConditionsChanged !== 1077 || m.sourcePackRowsChanged !== 0)
    throw Error('SVG_DISPLAY_CONTRACT_MISMATCH'); const file = (n) => { const f = m.files.find((f) => f.path === n); if (!f)
    throw Error('SVG_DISPLAY_UNPINNED_METADATA'); return f.sha256; }; const pins = JSON.parse(new TextDecoder().decode(await get('display-pins.json', file('display-pins.json')))); await get('display-resolver.mjs', file('display-resolver.mjs')); const module = await import(new URL('display-resolver.mjs', base).href); return module.createSVGDisplayResolver({ pins, baseURL: base, safeCommonDiagram }); }
export async function prepareCommonDisplay(q, signal) { if (!q.render?.svg || q.metadata?.subject !== 'math')
    return q.render?.svg; prepared ??= load().catch(e => { prepared = undefined; throw e; }); return (await prepared).resolve(q, { signal }); }
