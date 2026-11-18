export function escapeText(text) { return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export function renderQuestionText(text) { text = text.replace(/^(\d+)\/(\d+)(L|m|kg)?$/, '[FRACTION:$1/$2]$3'); text = text.replace(/(?<![\w:/])(\d+)\s*(?:와|과)\s*(\d+)\/(\d+)/g, '[FRACTION:$1 $2/$3]'); const regex = /\[FRACTION:(?:(\d+) )?(\d+)\/(\d+)\]/g; let output = '', cursor = 0; for (const match of text.matchAll(regex)) {
    output += escapeText(text.slice(cursor, match.index)).replace(/\n/g, '<br>');
    output += '<span class="fraction" aria-label="' + (match[1] ? match[1] + '과 ' : '') + match[3] + '분의 ' + match[2] + '">' + (match[1] ? '<span class="fraction-whole">' + match[1] + '</span>' : '') + '<span class="fraction-stack"><span>' + match[2] + '</span><span>' + match[3] + '</span></span></span>';
    cursor = match.index + match[0].length;
} return output + escapeText(text.slice(cursor)).replace(/\n/g, '<br>'); }
/** Authored self-contained SVG only, rendered as an inert image. */
export function safeDiagram(svg) { return svg.length < 60000 && /^<svg\s/i.test(svg) && /<\/svg>\s*$/i.test(svg) && !/<\s*(?:script|image|foreignObject|iframe|object|embed|use|style|animate|set)\b|\bon\w+\s*=|\b(?:href|src)\s*=|url\s*\(|<!/i.test(svg); }
/** Approved bank arrows/clipping use local fragment markers. Validate without altering original SVG bytes. */
export function safeCommonDiagram(svg) { if (safeDiagram(svg))
    return true; const ids = new Set([...svg.matchAll(/\bid\s*=\s*(['"])([^'"]+)\1/g)].map(m => m[2])); let invalid = false; const checked = svg.replace(/url\(\s*(['"]?)#([A-Za-z_][\w:.-]*)\1\s*\)/gi, (_all, _quote, id) => { if (!ids.has(id))
    invalid = true; return 'approved-local-fragment'; }); return !invalid && safeDiagram(checked); }
export function renderDiagram(svg, label = '도형', allowLocalRefs = false) { if (!svg || !(safeDiagram(svg) || allowLocalRefs && safeCommonDiagram(svg)))
    return ''; const alt = /<title>([^<]+)<\/title>/.exec(svg)?.[1] ?? '문제에 제시된 도형'; const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); return '<figure class="question-diagram"><img src="' + escapeText(src) + '" alt="' + escapeText(alt) + '"><details><summary>' + escapeText(label) + ' 확대 / 접기</summary><div class="diagram-scroll"><img src="' + escapeText(src) + '" alt="' + escapeText(alt) + ' · 확대"></div></details></figure>'; }
/** Lossless display-only compaction; originals and security limits remain unchanged. */
export function compactCommonDiagram(svg) {
    if (!svg || svg.length < 60000)
        return svg;
    let result = svg.replace(/\sdata-[\w-]+\s*=\s*(?:"[^"]*"|'[^']*')/g, '');
    result = result.replace(/(?:<polygon\b[^>]*\/>\s*){2,}/g, run => {
        const shapes = [...run.matchAll(/<polygon\b[^>]*\/>/g)].map(m => m[0]);
        const attr = (s, name) => [...s.matchAll(/\s(stroke(?:-width)?)\s*=\s*(["'])([^"']*)\2/g)].find(m => m[1] === name)?.[3];
        const stroke = attr(shapes[0], 'stroke'), width = attr(shapes[0], 'stroke-width');
        if (!stroke || !width || !/^#[0-9a-f]{3,8}$/i.test(stroke) || !/^\d+(?:\.\d+)?$/.test(width) || shapes.some(s => attr(s, 'stroke') !== stroke || attr(s, 'stroke-width') !== width))
            return run;
        return '<g stroke="' + stroke + '" stroke-width="' + width + '">' + run.replace(/\sstroke(?:-width)?\s*=\s*(?:"[^"]*"|'[^']*')/g, '') + '</g>';
    });
    result = result.replace(/<polygon\b[^>]*\/>/g, node => {
        const match = /\bpoints\s*=\s*(["'])([^"']+)\1/.exec(node);
        if (!match)
            return node;
        const values = match[2].trim().split(/[\s,]+/);
        if (values.length !== 6 || values.some(v => !/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(v)))
            return node;
        let d = 'M' + values[0] + ' ' + values[1];
        for (let i = 2; i < 6; i += 2)
            d += values[i] === values[i - 2] ? 'V' + values[i + 1] : values[i + 1] === values[i - 1] ? 'H' + values[i] : 'L' + values[i] + ' ' + values[i + 1];
        d += 'Z';
        return node.replace('<polygon', '<path').replace(match[0], 'd="' + d + '"');
    });
    return result;
}
