// qb-g4-s2-last-11/dynamic/browser-hash.mjs
function hash(value) {
  const input = new TextEncoder().encode(typeof value === "string" ? value : JSON.stringify(value)), K = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298], h = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225], n = Math.ceil((input.length + 9) / 64) * 64, b = new Uint8Array(n);
  b.set(input);
  b[input.length] = 128;
  const v = new DataView(b.buffer);
  v.setUint32(n - 8, Math.floor(input.length / 536870912));
  v.setUint32(n - 4, input.length * 8);
  const R = (x, n2) => x >>> n2 | x << 32 - n2, w = new Int32Array(64);
  for (let at = 0; at < n; at += 64) {
    for (let i = 0; i < 16; i++) w[i] = v.getInt32(at + 4 * i);
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15], y = w[i - 2];
      w[i] = w[i - 16] + (R(x, 7) ^ R(x, 18) ^ x >>> 3) + w[i - 7] + (R(y, 17) ^ R(y, 19) ^ y >>> 10) | 0;
    }
    let [a, c, d, e, f, g, j, k] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = k + (R(f, 6) ^ R(f, 11) ^ R(f, 25)) + (f & g ^ ~f & j) + K[i] + w[i] | 0, t2 = (R(a, 2) ^ R(a, 13) ^ R(a, 22)) + (a & c ^ a & d ^ c & d) | 0;
      k = j;
      j = g;
      g = f;
      f = e + t1 | 0;
      e = d;
      d = c;
      c = a;
      a = t1 + t2 | 0;
    }
    [a, c, d, e, f, g, j, k].forEach((x, i) => h[i] = h[i] + x | 0);
  }
  return h.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
}

// qb-g4-s2-rich-01/src/rows.mjs
var hash2 = hash;

// qb-g4-3.0-real-generator-coverage/quad-network-identity.mjs
var sort = (a) => a.map(JSON.stringify).sort().map((s) => JSON.parse(s));
function quadNetworkIdentity(m) {
  const orbits = [], square = m.metric.every((v) => v === 1);
  for (const flip of [false, true]) for (let turn = 0; turn < (square ? 4 : 6); turn++) {
    let ps;
    if (square) {
      ps = m.points.map(([x, y]) => [flip ? -x : x, y]);
      for (let j = 0; j < turn; j++) ps = ps.map(([x, y]) => [-y, x]);
    } else {
      const t = turn * Math.PI / 3;
      ps = m.points.map(([x, y]) => {
        x *= Math.sqrt(m.metric[0]);
        y *= Math.sqrt(m.metric[1]);
        if (flip) x = -x;
        return [x * Math.cos(t) - y * Math.sin(t), x * Math.sin(t) + y * Math.cos(t)];
      });
    }
    const lx = Math.min(...ps.map((p) => p[0])), ly = Math.min(...ps.map((p) => p[1]));
    ps = ps.map(([x, y]) => [Math.round((x - lx) * 1e6) / 1e6, Math.round((y - ly) * 1e6) / 1e6]);
    orbits.push(JSON.stringify(sort(m.segments.map(([a, b]) => sort([ps[a], ps[b]])))));
  }
  return orbits.sort()[0];
}

// qb-g4-3.0-real-generator-coverage/occlusion-content-geometry.mjs
function canonicalVisible(visible, side) {
  let current = visible.map((r) => r.slice()), keys = [];
  for (let t = 0; t < 4; t++) {
    for (const flip of [false, true]) {
      const rows = flip ? current.map((r) => r.slice().reverse()) : current, labels = /* @__PURE__ */ new Map();
      let next = 1;
      const canonical = rows.map((row) => row.map((v) => {
        if (!v) return 0;
        if (!labels.has(v)) labels.set(v, next++);
        return labels.get(v);
      }));
      keys.push(JSON.stringify({ side, visible: canonical }));
    }
    current = Array.from({ length: current[0].length }, (_, x) => Array.from({ length: current.length }, (_2, y) => current[current.length - 1 - y][x]));
  }
  return keys.sort()[0];
}

// qb-g4-3.0-real-generator-coverage/identity.mjs
var clean = (n) => Math.round(n * 1e6) / 1e6;
var sort2 = (a) => a.map((v) => JSON.stringify(v)).sort().map((v) => JSON.parse(v));
function shapeMeaning(p) {
  const ds = p.map((a) => p.map((b) => a.reduce((s, v, j) => s + (v - b[j]) ** 2, 0))), scale = Math.max(...ds.flat());
  if (!scale) return ["degenerate"];
  const seqs = [];
  for (const dir of [1, -1]) for (let offset = 0; offset < p.length; offset++) {
    const ids = p.map((_, i) => (offset + dir * i + p.length * 3) % p.length);
    seqs.push(ids.map((i) => ids.map((j) => clean(ds[i][j] / scale))));
  }
  return seqs.map(JSON.stringify).sort()[0];
}
var cellMeaning = (p) => quadNetworkIdentity({ points: p, segments: p.map((_, i) => [i, i]), metric: [1, 1] });
function meaning(model) {
  const m = structuredClone(model);
  delete m.profileKey;
  if (m.kind === "real-quad-equal-square-occlusion-bottom") return { kind: m.kind, condition: canonicalVisible(m.visible, m.side) };
  if (m.kind.startsWith("real-division-card-minimum-")) return { kind: m.kind, cards: [...m.cards].sort((a, b) => a - b) };
  if (m.kind === "real-polygon-joined-regular-extension-claims") return { kind: m.kind, n: m.leftSides, m: m.rightSides, claims: [...m.claims].sort() };
  if (m.kind === "real-polygon-regular-two-corner-chord-claims") return { kind: m.kind, n: m.n, claims: [...m.claims].sort() };
  if (["real-polygon-angle-sum-from-triangulation", "real-polygon-inverse-total-angle-to-sides", "real-polygon-diagonals-to-regular-angle"].includes(m.kind)) return { kind: m.kind, n: m.n, total: m.total, diagonals: m.diagonals };
  if (m.kind.startsWith("real-polygon-regular-given-")) return { kind: m.kind, n: m.n, total: m.total, known: m.known, side: m.side, claims: m.claims ? [...m.claims].sort() : void 0 };
  if (m.kind === "real-polygon-integer-dot-grid-impossible-class") return { kind: m.kind, grid: [m.columns, m.rows].sort((a, b) => a - b), choices: [...m.choices].sort() };
  if (m.kind === "real-polygon-select-three-pentominoes") return { kind: m.kind, target: cellMeaning(m.target), pieces: m.pieces.map(cellMeaning).sort() };
  if (m.kind === "real-polygon-count-repeated-piece-targets") return { kind: m.kind, piece: cellMeaning(m.piece), copies: m.copies, targets: m.targets.map(cellMeaning).sort() };
  if (m.kind === "real-polygon-catalog-piece-mosaic") return { kind: m.kind, pieces: sort2(m.polygons.map(shapeMeaning)), catalog: sort2(m.catalog.map(shapeMeaning)) };
  if (["real-polygon-mosaic-piece-classification", "real-polygon-mosaic-tiling-description"].includes(m.kind)) {
    const points = [], segments = [];
    for (const p of m.polygons) {
      const ids = p.map((q) => {
        let n = points.findIndex((t) => t[0] === q[0] && t[1] === q[1]);
        if (n < 0) {
          n = points.length;
          points.push(q);
        }
        return n;
      });
      ids.forEach((a, i) => segments.push([a, ids[(i + 1) % ids.length]]));
    }
    return { kind: m.kind, mode: m.mode, network: quadNetworkIdentity({ points, segments, metric: m.metric }) };
  }
  if (m.kind === "real-polygon-rhombus-thirty-half-diagonal-side") return { kind: m.kind, halfDiagonal: m.halfDiagonal, halfAngle: 30 };
  if (m.kind === "real-polygon-classification-table-error") return { kind: m.kind, assignments: sort2(m.polygons.map((q, i) => ({ shape: shapeMeaning(q), assigned: m.assignedCategories[i] }))) };
  if (m.kind === "real-polygon-rhombus-parallel-square-property") return { kind: m.kind, heightCm: m.heightCm, givenLengths: m.givenLengths, claim: "square-diagonals-unequal-false" };
  if (m.kind === "real-polygon-diagonal-property-picture-selection") m.polygons = m.polygons.map(shapeMeaning).sort();
  if (m.kind === "real-polygon-right-trapezoid-pair-rectangle-tiling") return { kind: m.kind, unit: { top: m.top, bottom: m.bottom, height: m.height }, target: [m.target[1][0], m.target[2][1]].sort((a, b) => a - b) };
  if (m.kind === "real-line-universal-property-claim-set") m.ids.sort();
  if (m.kind === "real-quad-cross-family-universal-claims") m.claims = sort2(m.claims);
  if (m.kind === "real-quad-square-rectangle-property-comparison") m.ids.sort();
  if (m.kind === "real-quad-parallel-offset-construction-order") m.actions.sort();
  if (m.kind === "real-quad-universal-property-claim-set") {
    m.claims = sort2(m.claims.map((c) => ({ ...c, id: m.shape === "rhombus" && ["adjacentAngles", "square"].includes(c.id) ? "allAngles" : c.id })));
  }
  if (m.kind === "real-quad-cut-rectangle-piece-claims") {
    const points = [], segments = [], seen = /* @__PURE__ */ new Set();
    for (const poly of m.pieces) {
      const ids = poly.map((p) => {
        let i = points.findIndex((q) => q[0] === p[0] && q[1] === p[1]);
        if (i < 0) {
          i = points.length;
          points.push(p);
        }
        return i;
      });
      for (let j = 0; j < ids.length; j++) {
        const e = [ids[j], ids[(j + 1) % ids.length]].sort((a, b) => a - b), key = e.join(",");
        if (!seen.has(key)) {
          seen.add(key);
          segments.push(e);
        }
      }
    }
    return { kind: m.kind, claimed: m.claimed, network: quadNetworkIdentity({ points, segments, metric: [1, 1] }) };
  }
  if (m.kind === "real-quad-lattice-network-count") return { kind: m.kind, predicate: m.predicate, network: quadNetworkIdentity(m) };
  if (m.kind === "real-quad-dual-rectangle-square-classification") m.polygons = m.polygons.map(shapeMeaning).sort();
  if (m.kind === "real-triangle-compass-false-property") m.claims = sort2(m.claims);
  if (m.kind === "real-triangle-compass-order") m.actions.sort();
  if (["real-angle-polygon-interior-count", "real-angle-object-without-right-corner", "real-angle-two-triangle-sums"].includes(m.kind)) m.polygons = m.polygons.map(shapeMeaning).sort();
  if (["real-large-universal-template-maximum", "real-large-universal-template-order"].includes(m.kind)) m.templates.sort();
  if (m.kind === "real-large-odd-zero-count-readings") {
    m.values.sort();
    delete m.readings;
  }
  if (m.kind === "real-large-impossible-card-reading") {
    m.digits.sort((a, b) => a - b);
    m.readings.sort();
  }
  if (m.kind === "real-large-nearest-card-query") {
    m.digits.sort((a, b) => a - b);
    delete m.nearestWitness;
  }
  if (m.kind === "real-large-pack-total-difference") delete m.role;
  if (m.kind === "real-large-ten-thousand-representation-claims") m.claims = sort2(m.claims);
  if (m.kind === "real-large-mixed-place-claims") m.claims = sort2(m.claims);
  if (m.kind === "real-large-fixed-step-sequence-filter") m.sequences = sort2(m.sequences);
  if (m.kind === "real-large-digit-value-options") m.values.sort();
  if (m.kind === "real-large-product-representation-match") m.pairs = sort2(m.pairs);
  if (m.kind === "real-large-mixed-representations") m.options = sort2(m.options);
  if (m.kind === "real-large-odd-place-digit") m.values.sort();
  if (m.kind === "real-large-readings-zero-count") {
    m.values.sort();
    delete m.readings;
  }
  if (["real-five-angle-diagram-query", "real-count-acute-degree-list"].includes(m.kind)) m.values.sort((a, b) => a - b);
  if (m.kind === "real-exact-hour-acute-selection") m.hours.sort((a, b) => a - b);
  if (m.kind === "real-point-placement-angle-query") {
    const w = m.pivot[0] - m.fixed[0], h = m.pivot[1];
    m.points = m.points.map(([x, y]) => [clean((x - m.pivot[0]) / w), clean((y - h) / w)]);
    delete m.pivot;
    delete m.fixed;
  }
  if (m.kind === "real-protractor-placement-query") m.figures = sort2(m.figures.map((f) => ({ center: f.center, base: f.base, theta: f.theta, rays: f.rays, reported: f.reported })));
  if (m.kind === "real-angle-statement-facts") m.claims = sort2(m.claims);
  if (m.kind === "real-protractor-target-angle-pair") m.pairs = sort2(m.pairs);
  if (m.kind === "real-triangle-visible-angle-order") {
    m.points = shapeMeaning(m.points);
    delete m.angles;
  }
  if (m.kind === "real-equal-sector-angle-comparison") return { kind: m.kind, sectors: m.sectors, referenceUnits: m.reference[1] - m.reference[0], optionUnits: m.pairs.map(([a, b]) => b - a).sort((a, b) => a - b) };
  if (m.kind === "real-division-blank-table-claims") delete m.claims;
  if (m.kind === "real-odd-division-quotient") m.pairs = sort2(m.pairs);
  if (m.kind === "real-division-table-total-ceiling") m.values.sort((a, b) => a - b);
  if (m.kind === "real-complete-division-groups-remainder") delete m.unit;
  if (m.kind === "real-multiply-equal-group-context") {
    delete m.situation;
    delete m.scale;
  }
  if (m.kind === "real-odd-product-zero-count") m.pairs = sort2(m.pairs);
  if (m.kind === "real-multiply-question-choice") delete m.questions;
  if (["real-trapezoid-isosceles-diagonal-angle", "real-rectangle-inner-parallelogram-angle", "real-rhombus-opposite-isosceles-angle", "real-crossed-rectangle-strip-angle"].includes(m.kind)) return { kind: m.kind, given: m.given ?? m.theta };
  if (m.kind === "real-polygon-diagonal-endpoints") {
    m.points = shapeMeaning(m.points);
    m.candidates = sort2(m.candidates.map((p) => p.map(String).sort()));
  }
  if (m.kind === "real-polygon-diagonal-drawing") {
    m.diagrams = sort2(m.polygons.map((p, i) => ({ shape: shapeMeaning(p), segments: sort2(m.segments[i].map((p2) => p2.map(String).sort())) })));
    delete m.polygons;
    delete m.segments;
  }
  if (["real-polygons-sum-diagonals", "real-polygons-order-diagonals"].includes(m.kind)) {
    m.counts.sort((a, b) => a - b);
    delete m.points;
  }
  if (m.kind === "real-regular-polygon-perimeter-query") {
    delete m.points;
    delete m.form;
  }
  if (m.kind === "real-grid-regular-polygon-selection") {
    m.points = sort2(m.points.map(shapeMeaning));
    delete m.facts;
  }
  if (m.kind === "real-square-four-of-six-points") {
    const forms = [];
    for (let flip = 0; flip < 2; flip++) for (let turn = 0; turn < 4; turn++) forms.push(sort2(m.points.map(([x, y]) => {
      x -= m.side / 2;
      y -= m.side / 2;
      if (flip) x = -x;
      for (let j = 0; j < turn; j++) [x, y] = [-y, x];
      return [x, y];
    })));
    m.points = forms.map(JSON.stringify).sort()[0];
  }
  if (m.kind === "real-hexagon-missing-vertex") {
    const scale = Math.max(...m.points.map((p) => p[0])) - Math.min(...m.points.map((p) => p[0]));
    m.points = m.points.map((p) => p.map((x) => clean(x / scale)));
    m.options = m.options.map((p) => p.map((x) => clean(x / scale)));
  }
  if (m.kind === "real-rectangle-failed-regularity-reason") {
    m.claims.sort();
    delete m.points;
  }
  if (m.kind === "real-polygon-side-angle-property-filter") {
    m.polygons = sort2(m.polygons.map(shapeMeaning));
    delete m.facts;
  }
  if (m.kind === "real-rectangle-center-angle-claims") {
    m.claims.sort();
    delete m.w;
    delete m.h;
    delete m.points;
  }
  if (m.kind === "real-polygon-cycle-diagonal-count") delete m.points;
  if (m.kind === "real-rectangle-center-triangle-names") {
    m.points = shapeMeaning(m.points);
    delete m.triangle;
    delete m.w;
    delete m.h;
  }
  if (m.kind === "real-fold-result-name-diagonal-angle") for (const k of ["paper", "folded", "kept", "cut", "pieces", "unfolded", "diagonals", "sourceGeneratorId"]) delete m[k];
  if (["real-rhombus-shared-parallelogram-length", "real-isosceles-sixty-rhombus-boundary"].includes(m.kind)) for (const k of ["labels", "polygons", "outline"]) delete m[k];
  if (m.kind === "real-quad-fold-cut-unfold") for (const k of ["paper", "folded", "kept", "cut", "pieces", "unfolded"]) delete m[k];
  if (m.kind === "real-single-trapezoid-explanations") {
    m.points = shapeMeaning(m.points);
    m.claims.sort();
    delete m.w;
    delete m.h;
    delete m.delta;
  }
  if (m.kind === "real-shortest-parallel-connector") {
    m.paths = sort2(m.paths.map((ps) => {
      const p = ps.map(([x, y]) => [clean(x / m.height), clean(y / m.height)]), q = p.map(([x, y]) => [-x, y]);
      return [JSON.stringify(p), JSON.stringify(q)].sort()[0];
    }));
    delete m.height;
    delete m.screenPaths;
  }
  if (m.kind === "real-protractor-perpendicular-construction") m.records = sort2(m.records);
  if (m.kind === "real-equilateral-network-all-size-count") {
    const orbits = [];
    for (const flip of [false, true]) for (let turn = 0; turn < 6; turn++) {
      let ps = m.axial.map(([u2, v2]) => flip ? [u2 + v2, -v2] : [u2, v2]);
      for (let j = 0; j < turn; j++) ps = ps.map(([u2, v2]) => [-v2, u2 + v2]);
      const u = Math.min(...ps.map((p) => p[0])), v = Math.min(...ps.map((p) => p[1]));
      ps = ps.map((p) => [p[0] - u, p[1] - v]);
      orbits.push(JSON.stringify(sort2(m.segments.map(([a, b]) => sort2([ps[a], ps[b]])))));
    }
    m.network = orbits.sort()[0];
    delete m.axial;
    delete m.points;
    delete m.segments;
    delete m.sizes;
  }
  if (m.kind === "real-triangle-single-angle-name") {
    m.known = m.angles.slice(0, 2).sort((a, b) => a - b);
    m.third = m.angles[2];
    delete m.angles;
    delete m.points;
  }
  if (m.kind === "real-triangle-not-equilateral-reason") {
    m.claims = sort2(m.claims);
    delete m.points;
  }
  if (m.kind === "real-triangle-single-observed-class") m.points = shapeMeaning(m.points);
  if (m.kind === "real-rectangle-diagonal-triangle-class") {
    const wh = [m.w, m.h].sort((a, b) => a - b);
    m.w = wh[0];
    m.h = wh[1];
    delete m.points;
    delete m.pieces;
  }
  if (m.kind === "real-fraction-parallel-mixed-sums") delete m.wrongTuples;
  if (m.kind === "real-fraction-parallel-borrow-differences") delete m.wrongTuples;
  if (["real-fraction-subtraction-claim-truth", "real-fraction-odd-subtraction", "real-fraction-subtraction-method-comparison"].includes(m.kind)) m.records = sort2(m.records);
  if (["real-fraction-one-bound", "real-fraction-open-interval-sums"].includes(m.kind)) m.records = sort2(m.records.map(({ a, b, d }) => ({ a: Math.min(a, b), b: Math.max(a, b), d })));
  if (m.kind === "real-fraction-range") m.values.sort((a, b) => a - b);
  if (m.kind === "real-hangul-two-flip-claims") m.claims = sort2(m.claims.map((c) => ({ from: c.from, claimed: c.claimed, composite: "R180" })));
  if (m.kind === "real-fraction-odd-representation") m.expressions = sort2(m.expressions.map((e) => ({ ...e, numerators: e.numerators.slice().sort((a, b) => a - b) })));
  if (m.kind === "real-natural-two-mixed-claims") m.pairs = sort2(m.pairs.map((p) => p.slice().sort((a, b) => a - b)));
  if (m.kind === "real-mixed-improper-slot-error") {
    delete m.order;
    delete m.trace;
  }
  if (m.kind === "real-mixed-same-operands-method-comparison") m.methods = sort2(m.methods);
  if (m.kind === "real-fraction-process-claims") {
    m.records = sort2(m.records.map(({ a, b, d, mode, proposedN, proposedD }) => ({ a: Math.min(a, b), b: Math.max(a, b), d, mode, proposedN, proposedD })));
  }
  if (m.kind === "real-mixed-add-procedure-blanks") {
    delete m.trace;
    delete m.wrongTuples;
  }
  if (m.kind === "real-parallelogram-line-claims") {
    m.points = shapeMeaning(m.points);
    m.claims.sort();
  }
  if (m.kind === "real-rhombus-diagonal-relations") {
    m.points = shapeMeaning(m.points);
    delete m.diagonals;
  }
  if (m.kind === "real-isosceles-equal-angle-labels") delete m.points;
  if (m.kind === "real-triangle-sufficient-isosceles") {
    m.records = sort2(m.records);
    delete m.oneAngleCounterexample;
  }
  if (m.kind === "real-triangle-complete-acute") m.pairs = sort2(m.pairs.map((p) => p.sort((a, b) => a - b)));
  if (m.kind === "real-marked-perpendicular-judgment") delete m.lines;
  if (m.kind === "real-whole-motif-validity") m.patterns = sort2(m.patterns);
  if (m.kind === "real-triangle-universal-relations") {
    m.claims = sort2(m.claims);
    delete m.counterexamples;
  }
  if (m.kind === "real-triangle-paired-picture-claims") {
    m.values = m.values.map(shapeMeaning);
    m.claims = sort2(m.claims);
  }
  if (m.kind === "real-motif-odd-operation") m.groups = sort2(m.groups);
  if (m.kind === "real-rotation-motif-recover") {
    delete m.candidates;
    delete m.tiles;
  }
  if (m.kind === "real-graph-purpose") delete m.linePosition;
  if (m.kind === "real-line-axis-claims") m.claims.sort();
  if (m.kind === "real-bar-table-purpose") delete m.barPosition;
  if (m.kind === "real-axis-max-from-incomplete-table") {
    m.known.sort((a, b) => a - b);
    delete m.missingIndex;
  }
  if (["real-axis-minimum-integer-step", "real-axis-required-cells"].includes(m.kind)) m.values.sort((a, b) => a - b);
  if (["real-fraction-exact-sum-filter", "real-fraction-max-sum"].includes(m.kind)) m.pairs = sort2(m.pairs.map((p) => p.sort((a, b) => a - b)));
  if (m.kind === "real-fraction-compare-sums") {
    const p = sort2([m.left.sort((a, b) => a - b), m.right.sort((a, b) => a - b)]);
    m.left = p[0];
    m.right = p[1];
  }
  if (m.kind === "real-grid-obtuse-isosceles-names") m.points = shapeMeaning(m.points);
  if (m.kind === "real-glyph-symmetry-claims") {
    const scale = Math.max(m.width, m.height);
    m.paths = m.paths.map((p) => p.map((v) => v.map((x) => Math.round(x / scale * 1e8) / 1e8)));
    delete m.width;
    delete m.height;
    delete m.center;
  }
  const cells = (p) => {
    const x = Math.min(...p.map((v) => v[0])), y = Math.min(...p.map((v) => v[1]));
    return sort2(p.map((v) => [clean(v[0] - x), clean(v[1] - y)]));
  }, orbit = (p, rotate, flip = false) => {
    const out = [];
    for (const f of flip ? [1, -1] : [1]) for (let r = 0; r < (rotate ? 4 : 1); r++) {
      let q = p.map(([x, y]) => [f * x, y]);
      for (let n = 0; n < r; n++) q = q.map(([x, y]) => [-y, x]);
      out.push(JSON.stringify(cells(q)));
    }
    return out.sort()[0];
  };
  if (m.kind === "hole-piece-match") {
    m.hole = orbit(m.hole, m.rotations);
    delete m.pieces;
  }
  if (m.kind === "rectangle-tiling") {
    const dimensions = [m.width, m.height].sort((a, b) => a - b);
    m.width = dimensions[0];
    m.height = dimensions[1];
    m.pieces = sort2(m.pieces.map((p) => orbit(p, true, true)));
  }
  if (m.kind === "real-inverse-translation-choice") m.starts.sort((a, b) => a - b);
  if (m.kind === "real-triangle-single-isosceles") m.points = shapeMeaning(m.points);
  if (m.kind === "real-word-mirror") delete m.options;
  if (m.kind === "real-transform-possibility") delete m.candidates;
  if (m.kind === "real-curved-motif-validity") delete m.patterns;
  if (m.kind === "real-quad-class-inclusion") m.records = sort2(m.records);
  if (m.kind === "real-square-growth-claims") m.claims.sort();
  if (m.kind === "product-rank") m.pairs = sort2(m.pairs.map((p) => p.sort((a, b) => a - b)));
  if (m.kind === "product-claims") m.claims = sort2(m.claims.map(([a, b, c]) => [Math.min(a, b), Math.max(a, b), c]));
  if (m.kind === "division-list") m.pairs = sort2(m.pairs);
  if (m.kind === "nested-shapes") m.values = sort2(m.values.map((v) => ({ outer: shapeMeaning(v.outer), inner: shapeMeaning(v.inner), outerSides: v.outerSides?.slice().sort((a, b) => a - b), innerSides: v.innerSides?.slice().sort((a, b) => a - b) ?? null })));
  if (["real-move-result", "real-point-translation"].includes(m.kind)) delete m.candidates;
  if (m.kind === "coords-select") m.values = sort2(m.values.map(shapeMeaning));
  if (m.kind === "quad-select") m.polygons = sort2(m.polygons.map(shapeMeaning));
  if (["angles-select", "sides-select"].includes(m.kind)) m.values = sort2(m.values.map((v) => [...v].sort((a, b) => a - b)));
  if (m.kind === "real-polygon-count" || m.kind === "real-polygon-vertex-side") m.points = shapeMeaning(m.points);
  if (m.kind === "real-polygon-side-query") {
    m.points = sort2(m.points.map(shapeMeaning));
    m.counts.sort((a, b) => a - b);
  }
  if (m.kind === "fan-triangles") delete m.points;
  if (m.kind === "real-polygon-boundary") {
    delete m.criterion;
    m.rows = sort2(m.rows.map((r) => r.points ? { straight: r.straight, closed: r.closed, points: shapeMeaning(r.points) } : { straight: r.straight, closed: r.closed }));
  }
  if (m.kind === "real-mirror-clock") m.minutes.sort((a, b) => a - b);
  if (m.kind === "real-parallel-max") m.directionMultiplicities = sort2(m.directionMultiplicities.map((v) => v.sort((a, b) => a - b)));
  if (m.kind === "real-triangle-right-isosceles-cut-network") {
    m.points = m.points.map((p) => p.map((v) => Math.round(v / m.squareSide * 1e9) / 1e9));
    m.cutParameter = Math.round(m.cutParameter / m.squareSide * 1e9) / 1e9;
    delete m.squareSide;
    delete m.allIntersectionPoints;
    delete m.enumeratedTriangleVertices;
  }
  if (m.kind === "real-triangle-three-class-acute-count-sum") m.classes.sort();
  if (m.kind === "real-triangle-all-equilateral-assembly") m.groups = sort2(m.groups.map((ps) => sort2(ps.map(shapeMeaning))));
  return m;
}

// qb-g4-3.0-real-generator-coverage/core.mjs
var hash3 = hash2;

// qb-g4-3.0-final-quality-repetition/identity.mjs
function conditionKey(r) {
  if (r.deliveryKind === "fixed") {
    if (typeof r.fixedConceptKey !== "string" || !r.fixedConceptKey) throw Error("VERIFIED_FIXED_CONCEPT_KEY_REQUIRED");
    return hash3({ subject: "math", grade: 4, fixedConcept: r.fixedConceptKey });
  }
  const m = r.proof?.model;
  if (!m) throw Error("VERIFIED_MATHEMATICAL_MODEL_REQUIRED");
  const task = r.solutionStructureId;
  if (m.kind === "real-source-bar-final-context" && m.role === "adjacent-completions") return hash3({ subject: "math", grade: 4, unit: r.unitId, task, n: m.n, preceding: m.prefix.at(-1), missing: 3 });
  if (["real-quad-missing-side", "quad-inverse"].includes(m.kind)) return hash3({ subject: "math", grade: 4, unit: r.unitId, task: "quadrilateral.infer-adjacent-side-from-half-perimeter", knownSide: m.a, perimeter: m.total ?? m.sum });
  if (m.kind === "real-source-decimal-contrast" && m.spec.kind === "decimal-value-match") return hash3({ subject: "math", grade: 4, unit: r.unitId, task, values: m.spec.values.map(Number).sort((a, b) => a - b) });
  if (r.templateId.startsWith("G4RC-") || r.templateId.startsWith("G4QF-")) return hash3({ subject: "math", grade: 4, unitId: r.unitId, structure: task, model: meaning(m) });
  if (!r.semanticConditionKey) throw Error("IDENTITY_KEY_REQUIRED");
  return r.semanticConditionKey;
}

// qb-g4-3.0-final-quality-repetition/repetition-audit.mjs
var clone = (x) => JSON.parse(JSON.stringify(x));
function createRepetitionAudit({ contentVersion, clock = () => (/* @__PURE__ */ new Date()).toISOString() }) {
  let sessions = {}, events = [];
  const selected = (s) => ({ subject: "math", grade: 4, unitIds: [...s.unitIds ?? [s.unitId]], skillIds: [...s.skillIds ?? []], levels: [...s.levels ?? [1, 2, 3, 4, 5]] });
  return {
    open(sessionId, scope) {
      if (sessions[sessionId]) throw Error("EXISTING_SESSION_MUST_RESTORE");
      sessions[sessionId] = { scope: selected(scope), keys: [], fixed: [], deliveries: 0, restored: false };
    },
    record({ sessionId, row, role, elapsedScenarioSeconds = null }) {
      const s = sessions[sessionId];
      if (!s) throw Error("UNKNOWN_SESSION");
      if (!["base", "instant-twin", "challenge"].includes(role)) throw Error("UNKNOWN_ROLE");
      const key = conditionKey(row);
      let reason = null;
      if (!s.scope.unitIds.includes(row.unitId) || !s.scope.levels.includes(row.level) || s.scope.skillIds.length && !s.scope.skillIds.includes(row.skillId)) reason = "OUTSIDE_SELECTED_SCOPE";
      if (s.keys.includes(key)) reason = "DUPLICATE_CONDITION_IN_SESSION";
      if (row.deliveryKind === "fixed") {
        if (role !== "base") reason = "FIXED_ITEM_NOT_AN_EQUIVALENT_VARIANT";
        else if (s.fixed.some((x) => x.key === key)) reason = "FIXED_CONCEPT_ALREADY_USED";
        else if (s.fixed.length && s.deliveries - s.fixed.at(-1).at < 13) reason = "FIXED_ITEM_FREQUENCY_GAP";
      }
      const event = { occurredAt: clock(), sessionId, scope: clone(s.scope), questionId: row.questionId, questionVersion: row.questionVersion, templateId: row.templateId, contentHash: row.contentHash, conditionKey: key, role, restored: s.restored, elapsedScenarioSeconds, status: reason ? "blocked" : "delivered", reason };
      events.push(event);
      if (reason) return { status: "held", reason };
      s.keys.push(key);
      if (row.deliveryKind === "fixed") s.fixed.push({ key, at: s.deliveries });
      s.deliveries++;
      return { status: "accepted", conditionKey: key };
    },
    terminal(sessionId, result) {
      const s = sessions[sessionId];
      if (!s) throw Error("UNKNOWN_SESSION");
      events.push({ occurredAt: clock(), sessionId, scope: clone(s.scope), status: result.status, reason: result.reason ?? null, restored: s.restored });
    },
    serialize() {
      return clone({ schemaVersion: "qb-repetition-audit/1", contentVersion, sessions, events });
    },
    restore(input) {
      const x = clone(input);
      if (x.schemaVersion !== "qb-repetition-audit/1" || x.contentVersion !== contentVersion) throw Error("AUDIT_VERSION_MISMATCH");
      if (!x.sessions || !Array.isArray(x.events)) throw Error("INVALID_AUDIT");
      const fields = /* @__PURE__ */ new Set(["occurredAt", "sessionId", "scope", "questionId", "questionVersion", "templateId", "contentHash", "conditionKey", "role", "restored", "elapsedScenarioSeconds", "status", "reason"]);
      if (x.events.some((e) => Object.keys(e).some((k) => !fields.has(k)))) throw Error("UNKNOWN_LOG_FIELD");
      for (const s of Object.values(x.sessions)) {
        if (!Array.isArray(s.keys) || new Set(s.keys).size !== s.keys.length) throw Error("INVALID_SESSION_KEYS");
        s.restored = true;
      }
      sessions = clone(x.sessions);
      events = clone(x.events);
    },
    log() {
      return clone(events);
    }
  };
}
export {
  conditionKey,
  createRepetitionAudit
};
