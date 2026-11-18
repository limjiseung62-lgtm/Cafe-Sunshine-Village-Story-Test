function qbmark(name,start){globalThis.__QB_STAGES??=[];globalThis.__QB_STAGES.push({name,start,end:performance.now(),duration:performance.now()-start,heap:performance.memory?.usedJSHeapSize??null});}
const qbCoreStart=performance.now();
// learning-review-r1/native/core/rational.js
var Rational = class _Rational {
  numerator;
  denominator;
  constructor(n, d = 1n) {
    if (typeof n === "number" && !Number.isSafeInteger(n) || typeof d === "number" && !Number.isSafeInteger(d)) throw Error("Safe integer constructor operands");
    let a12 = BigInt(n), b = BigInt(d);
    if (!b) throw Error("Zero denominator");
    if (b < 0n) {
      a12 = -a12;
      b = -b;
    }
    const g = _Rational.gcd(a12, b);
    this.numerator = a12 / g;
    this.denominator = b / g;
  }
  static gcd(a12, b) {
    a12 = a12 < 0n ? -a12 : a12;
    b = b < 0n ? -b : b;
    while (b) [a12, b] = [b, a12 % b];
    return a12;
  }
  static parse(value) {
    const s = String(value);
    if (s.length > 100) throw Error("Bounded exact literal");
    const m = /^([+-]?\d+)(?:\.(\d+))?(?:\/(\d+))?$/.exec(s);
    if (!m) throw Error("Exact numeric literal required");
    const decimals = m[2] ?? "", sign = m[1].startsWith("-") ? -1n : 1n;
    return new _Rational(BigInt(m[1].replace(/^[+-]/, "") + decimals) * sign, 10n ** BigInt(decimals.length) * BigInt(m[3] ?? 1));
  }
  normalize() {
    return this;
  }
  add(b) {
    return new _Rational(this.numerator * b.denominator + b.numerator * this.denominator, this.denominator * b.denominator);
  }
  subtract(b) {
    return new _Rational(this.numerator * b.denominator - b.numerator * this.denominator, this.denominator * b.denominator);
  }
  multiply(b) {
    return new _Rational(this.numerator * b.numerator, this.denominator * b.denominator);
  }
  divide(b) {
    return new _Rational(this.numerator * b.denominator, this.denominator * b.numerator);
  }
  compare(b) {
    const delta2 = this.numerator * b.denominator - b.numerator * this.denominator;
    return delta2 > 0n ? 1 : delta2 < 0n ? -1 : 0;
  }
  equals(b) {
    return this.compare(b) === 0;
  }
  toMixedNumber() {
    const sign = this.numerator < 0n ? -1n : 1n, n = this.numerator * sign;
    return { sign: String(sign), whole: String(n / this.denominator), numerator: String(n % this.denominator), denominator: String(this.denominator) };
  }
  toDisplayString(mode = "auto") {
    if (this.denominator === 1n) return String(this.numerator);
    if (mode === "mixed") {
      const m = this.toMixedNumber();
      return `${m.sign === "-1" ? "-" : ""}${m.whole === "0" ? "" : m.whole + " "}${m.numerator}/${m.denominator}`;
    }
    if (mode !== "fraction") {
      let d = this.denominator;
      while (d % 2n === 0n) d /= 2n;
      while (d % 5n === 0n) d /= 5n;
      if (d === 1n) {
        const n = this.numerator < 0n ? -this.numerator : this.numerator;
        let remainder = n % this.denominator, tail = "";
        while (remainder) {
          remainder *= 10n;
          tail += String(remainder / this.denominator);
          remainder %= this.denominator;
          if (tail.length > 64) throw Error("Display decimal exceeds precision policy");
        }
        return `${this.numerator < 0n ? "-" : ""}${n / this.denominator}.${tail}`;
      }
      if (mode === "decimal") throw Error("Nonterminating decimal needs explicit rounding model");
    }
    return `${this.numerator}/${this.denominator}`;
  }
};

// learning-review-r1/native/core/answer-policy.js
function parseSchoolNumber(s) {
  if (typeof s !== "string" || s.length > 80) throw Error("Bounded school number");
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(s.trim());
  if (mixed) {
    const [w, n, d] = mixed.slice(1).map(BigInt);
    if (d <= 0n || n >= d) throw Error("Proper remainder required");
    return { value: new Rational(w * d + n, d), format: "mixed", numerator: n, denominator: d };
  }
  const literal = /^(\d+)(?:\.(\d+))?(?:\/(\d+))?$/.exec(s.trim());
  if (!literal) throw Error("School number syntax");
  const value = Rational.parse(s.trim());
  return { value, format: literal[3] ? "fraction" : literal[2] ? "decimal" : "integer", numerator: literal[3] ? BigInt(literal[1]) : value.numerator, denominator: literal[3] ? BigInt(literal[3]) : value.denominator };
}
function checkNumericResponse(expected, response, policy, responseUnit) {
  try {
    if (!policy || !["value", "fraction", "mixed", "decimal"].includes(policy.format) || policy.decimalPlaces !== void 0 && (!Number.isInteger(policy.decimalPlaces) || policy.decimalPlaces < 0 || policy.decimalPlaces > 6)) return { status: "invalid" };
    const a12 = parseSchoolNumber(expected), b = parseSchoolNumber(response);
    if (policy.unit && responseUnit !== policy.unit) return { status: "incorrect", reason: "unit" };
    if (!a12.value.equals(b.value)) return { status: "incorrect", reason: "value" };
    if (policy.format === "mixed" && b.value.denominator !== 1n && b.value.numerator > b.value.denominator && b.format !== "mixed") return { status: "incorrect", reason: "mixed-format" };
    if (policy.format === "mixed" && b.format === "mixed" && (b.value.numerator < b.value.denominator || b.numerator === 0n)) return { status: "incorrect", reason: "zero-whole" };
    if (policy.format === "fraction" && b.format !== "fraction") return { status: "incorrect", reason: "fraction-format" };
    if (policy.format === "decimal" && !["decimal", "integer"].includes(b.format)) return { status: "incorrect", reason: "decimal-format" };
    if (policy.decimalPlaces !== void 0 && (response.trim().split(".")[1]?.length ?? 0) !== policy.decimalPlaces) return { status: "incorrect", reason: "decimal-places" };
    if (policy.simplified && Rational.gcd(b.numerator, b.denominator) !== 1n) return { status: "incorrect", reason: "simplify" };
    return { status: "correct" };
  } catch {
    return { status: "invalid" };
  }
}

// learning-review-r1/native/core/grading.js
function rational(value) {
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(value.trim())) return;
  const text = value.trim(), negative = text.startsWith("-"), unsigned = text.replace(/^[+-]/, "");
  const [integer2, decimal = ""] = unsigned.split(".");
  return [BigInt(integer2 + decimal) * (negative ? -1n : 1n), 10n ** BigInt(decimal.length)];
}
function fractionKey(f2) {
  let n = BigInt(f2.numerator) + BigInt(f2.whole ?? 0) * BigInt(f2.denominator), d = BigInt(f2.denominator);
  let a12 = n < 0n ? -n : n, b = d;
  while (b) [a12, b] = [b, a12 % b];
  return `${n / (a12 || 1n)}/${d / (a12 || 1n)}`;
}
function gradeAnswer(q, response) {
  const answer = q.answer;
  if (q.answerFormat && (answer.kind === "number" || answer.kind === "fraction")) {
    const expected = answer.kind === "number" ? answer.value : `${answer.value.numerator + (answer.value.whole ?? 0) * answer.value.denominator}/${answer.value.denominator}`;
    if (typeof response === "string") return { status: checkNumericResponse(expected, response, q.answerFormat).status };
    const r2 = response;
    if (!r2 || typeof r2 !== "object") return { status: "invalid" };
    const text = typeof r2.value === "string" ? r2.value : Number.isSafeInteger(r2.numerator) && Number.isSafeInteger(r2.denominator) ? r2.whole !== void 0 ? `${r2.whole} ${r2.numerator}/${r2.denominator}` : `${r2.numerator}/${r2.denominator}` : void 0;
    if (text === void 0) return { status: "invalid" };
    return { status: checkNumericResponse(expected, text, q.answerFormat, r2.unit).status };
  }
  let correct = false;
  if (answer.kind === "single-choice") {
    if (typeof response !== "string" || !q.choices?.some((c2) => c2.id === response)) return { status: "invalid" };
    correct = response === answer.choiceId;
  } else if (answer.kind === "number") {
    const input = typeof response === "string" ? { value: response } : response;
    if (!input || typeof input.value !== "string") return { status: "invalid" };
    const a12 = rational(input.value), b = rational(answer.value);
    if (!a12 || !b) return { status: "invalid" };
    if (answer.unit && typeof input.unit !== "string") return { status: "invalid" };
    correct = a12[0] * b[1] === b[0] * a12[1] && (!answer.unit || [answer.unit, ...answer.acceptedUnits ?? []].includes(input.unit));
  } else if (answer.kind === "fraction") {
    const f2 = response;
    if (!f2 || !Number.isSafeInteger(f2.numerator) || !Number.isSafeInteger(f2.denominator) || f2.denominator <= 0 || f2.whole !== void 0 && !Number.isSafeInteger(f2.whole)) return { status: "invalid" };
    correct = fractionKey(f2) === fractionKey(answer.value);
    if (answer.requireSimplified) {
      let a12 = Math.abs(f2.numerator), b = f2.denominator;
      while (b) [a12, b] = [b, a12 % b];
      correct &&= a12 === 1;
    }
  } else if (answer.kind === "text") {
    if (typeof response !== "string") return { status: "invalid" };
    const normalize = (s) => {
      if (answer.normalization.trim) s = s.trim();
      if (answer.normalization.separator === "comma") s = s.replace(/\s*,\s*/g, ",");
      if (answer.normalization.separator === "colon") s = s.replace(/\s*:\s*/g, ":");
      if (answer.normalization.collapseSpaces) s = s.replace(/\s+/g, " ");
      return answer.normalization.caseSensitive ? s : s.toLowerCase();
    };
    correct = answer.accepted.some((s) => normalize(s) === normalize(response));
  } else {
    if (!Array.isArray(response) || response.some((s) => typeof s !== "string")) return { status: "invalid" };
    correct = JSON.stringify(response) === JSON.stringify(answer.tokenIds);
  }
  return { status: correct ? "correct" : "incorrect" };
}

// learning-review-r1/dist/util.js
var canonical = (v) => JSON.stringify(sort(v));
function sort(v) {
  if (Array.isArray(v))
    return v.map(sort);
  if (v && typeof v === "object")
    return Object.fromEntries(Object.entries(v).sort(([a12], [b]) => a12.localeCompare(b)).map(([k, x]) => [k, sort(x)]));
  return v;
}
async function sha(v) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(typeof v === "string" ? v : canonical(v)));
  return Array.from(new Uint8Array(bytes), (x) => x.toString(16).padStart(2, "0")).join("");
}
function requireThat(ok, message) {
  if (!ok)
    throw Error(message);
}
var clone = (x) => structuredClone(x);
var stamp = (x) => Number.isFinite(Date.parse(x));
var uuid = () => crypto.randomUUID();

// learning-review-r1/native/core/randomizer.js
function hash(text) {
  let a12 = 2166136261, b = 2246822507;
  for (const char of text) {
    a12 = Math.imul(a12 ^ char.charCodeAt(0), 16777619);
    b = Math.imul(b ^ char.charCodeAt(0), 3266489909);
  }
  return (a12 >>> 0).toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0");
}
function createRandom(seed) {
  let state = parseInt(hash(String(seed)).slice(0, 8), 16);
  return () => {
    state = Math.imul(state, 1664525) + 1013904223 >>> 0;
    return state / 4294967296;
  };
}
function shuffle(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// learning-review-r1/native/quality/korean-formatter.js
function rangeSuffixContext(rest) {
  const next = rest.replace(/^\s*[,;]\s*/, " ");
  return /^[\s]*\d+(?:\.\d+)?\s*(?:이하|미만|이상|초과)/.test(next) || /^\s*[.!?]?\s*$/.test(rest);
}
var unitReading = { mL: "\uBC00\uB9AC\uB9AC\uD130", L: "\uB9AC\uD130", mm: "\uBC00\uB9AC\uBBF8\uD130", cm: "\uC13C\uD2F0\uBBF8\uD130", km: "\uD0AC\uB85C\uBBF8\uD130", m: "\uBBF8\uD130", kg: "\uD0AC\uB85C\uADF8\uB7A8", g: "\uADF8\uB7A8", t: "\uD1A4", s: "\uCD08", min: "\uBD84", "%": "\uD37C\uC13C\uD2B8", "\xB0": "\uB3C4", "\u2103": "\uB3C4" };
var digitReading = ["\uC601", "\uC77C", "\uC774", "\uC0BC", "\uC0AC", "\uC624", "\uC721", "\uCE60", "\uD314", "\uAD6C"];
function integerTail(s) {
  const clean = s.replace(/^[+-]/, "").replaceAll(",", "").replace(/^0+(?=\d)/, "");
  if (!/^\d+$/.test(clean)) return clean.at(-1) ?? "";
  const last2 = clean.at(-1);
  if (last2 !== "0") return digitReading[Number(last2)];
  const nonzero = clean.search(/[1-9](?=0*$)/);
  if (nonzero < 0) return "\uC601";
  const zeros = clean.length - 1 - nonzero, local = zeros % 4;
  if (local) return ["", "\uC2ED", "\uBC31", "\uCC9C"][local];
  return ["", "\uB9CC", "\uC5B5", "\uC870", "\uACBD", "\uD574"][Math.floor(zeros / 4)] ?? "\uC601";
}
function spokenTail(s) {
  s = s.trim();
  const quantity = /([A-Za-z]+(?:[²³])?|[%°℃])$/.exec(s);
  if (quantity) {
    const root = quantity[1].replace(/[²³]/g, "");
    if (unitReading[root]) return unitReading[root].at(-1);
  }
  const mixed = /\d+\s+(\d+)\/(\d+)$/.exec(s), fraction2 = /(\d+)\/(\d+)$/.exec(s);
  if (mixed) return integerTail(mixed[1]);
  if (fraction2) return integerTail(fraction2[1]);
  const decimal = /[+-]?\d+\.(\d+)$/.exec(s);
  if (decimal) return digitReading[Number(decimal[1].at(-1))];
  const natural2 = /[+-]?[\d,]+$/.exec(s);
  if (natural2) return integerTail(natural2[0]);
  return s.at(-1) ?? "";
}
function koreanParticle(value, pair = "\uC744/\uB97C") {
  const c2 = spokenTail(String(value)), n = c2.charCodeAt(0), jong = n >= 44032 && n <= 55203 ? (n - 44032) % 28 : 0;
  if (pair === "\uC73C\uB85C/\uB85C") return jong !== 0 && jong !== 8 ? "\uC73C\uB85C" : "\uB85C";
  return pair.split("/")[jong ? 0 : 1];
}
var pairs = { \uC740: "\uC740/\uB294", \uB294: "\uC740/\uB294", \uC774: "\uC774/\uAC00", \uAC00: "\uC774/\uAC00", \uC744: "\uC744/\uB97C", \uB97C: "\uC744/\uB97C", \uACFC: "\uACFC/\uC640", \uC640: "\uACFC/\uC640", \uC73C\uB85C: "\uC73C\uB85C/\uB85C", \uB85C: "\uC73C\uB85C/\uB85C" };
function formatKoreanContent(input) {
  let s = input;
  s = s.replace(/([가-힣])(?=[+-]?\d)/g, "$1 ");
  s = s.replace(/(\d)(?=(?:mL|mm|cm|km|kg|L|g|m|t)(?:[²³])?(?:[^A-Za-z]|$))/g, "$1 ");
  const number3 = "[+-]?(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+|\\/\\d+|\\s+\\d+\\/\\d+)?";
  const unit = "(?:\\s*(?:mL|mm|cm|km|kg|L|g|m|t)(?:[\xB2\xB3])?|\\s*[%\xB0\u2103]|\\s*(?:\uC2DC\uAC04|\uBD84|\uCD08|\uAD8C|\uC7A5|\uBA85|\uAC1C|\uC6D0|\uADF8\uB8E8|\uC790\uB8E8|\uB300|\uCE78|\uC904))?";
  const suffix = new RegExp("(" + number3 + unit + ")(\uC73C\uB85C|\uC740|\uB294|\uC774|\uAC00|\uC744|\uB97C|\uACFC|\uC640|\uB85C)(?=\\s|[.,!?;:)]|$)", "g");
  s = s.replace(suffix, (all, value, old, offset) => {
    const rest = s.slice(offset + all.length);
    if (old === "\uACFC" && /\d\s*초$/.test(value) && rangeSuffixContext(rest)) return all;
    return value + koreanParticle(value, pairs[old]);
  });
  return s;
}

// learning-review-r1/native/validators/line-relations.js
function point(v) {
  if (!Array.isArray(v) || v.length !== 2 || !v.every((x) => typeof x === "number" && Number.isFinite(x))) throw Error("Invalid 2D point");
  return v;
}
function line(v) {
  if (!Array.isArray(v) || v.length !== 2) throw Error("Invalid line");
  const a12 = point(v[0]), b = point(v[1]);
  if (a12[0] === b[0] && a12[1] === b[1]) throw Error("Degenerate line");
  return [a12, b];
}
var vec = (l) => [l[1][0] - l[0][0], l[1][1] - l[0][1]];
var dot = (a12, b) => a12[0] * b[0] + a12[1] * b[1];
var cross = (a12, b) => a12[0] * b[1] - a12[1] * b[0];
var on = (p, l) => cross([p[0] - l[0][0], p[1] - l[0][1]], vec(l)) === 0;
var relation = (a12, b) => cross(vec(a12), vec(b)) === 0 ? on(b[0], a12) ? "\uC11C\uB85C \uC644\uC804\uD788 \uACB9\uCE68" : "\uD3C9\uD589" : dot(vec(a12), vec(b)) === 0 ? "\uC218\uC9C1" : "\uD55C \uC810\uC5D0\uC11C \uBE44\uC2A4\uB4EC\uD788 \uB9CC\uB0A8";
var distance = (p, l) => Math.abs(cross([p[0] - l[0][0], p[1] - l[0][1]], vec(l))) / Math.hypot(...vec(l));
function unique(xs) {
  if (xs.length !== 1) throw Error("Answer is not unique");
  return xs[0];
}
function solveLineRelations(m) {
  const d = m.data;
  if (d.shape !== "line-relations") throw Error("Wrong model");
  if (m.query === "perpendicular-pair") return unique(d.pairs.filter((p) => p.angle === 90).map((p) => p.label));
  if (m.query === "perpendicular-label") {
    const l = line(d.base), p = point(d.point);
    if (on(p, l)) throw Error("Point must be outside line");
    return unique(d.targets.filter((t) => {
      const q = point(t.point);
      return on(q, l) && dot([q[0] - p[0], q[1] - p[1]], vec(l)) === 0;
    }).map((t) => t.label));
  }
  if (m.query === "point-line-distance") return String(distance(point(d.point), line(d.base)));
  if (m.query === "parallel-pair") return unique(d.pairs.filter((p) => relation(line(p.lines[0]), line(p.lines[1])) === "\uD3C9\uD589").map((p) => p.label));
  const a12 = line(d.lines[0]), b = line(d.lines[1]), r2 = relation(a12, b);
  if (m.query === "relation") return r2;
  if (m.query === "right-angle-count" || m.query === "perpendicular-angle") {
    if (r2 !== "\uC218\uC9C1") throw Error("Perpendicular condition missing");
    return m.query === "right-angle-count" ? "4" : "90";
  }
  if (r2 !== "\uD3C9\uD589") throw Error("Distinct parallel lines required");
  if (m.query === "parallel-distance") return String(distance(b[0], a12));
  if (m.query === "distance-segment") return unique(d.segments.filter((s) => {
    const seg = line(s.points);
    return (on(seg[0], a12) && on(seg[1], b) || on(seg[1], a12) && on(seg[0], b)) && dot(vec(seg), vec(a12)) === 0;
  }).map((s) => s.label));
  throw Error("Unsupported line query");
}

// learning-review-r1/native/quality/closure62.js
var closureDifficulty = {
  "G4-S1U1-FINAL-bounded-order": { difficulty: 3, rationale: "\uD55C \uACBD\uACC4\uB85C \uD6C4\uBCF4\uB97C \uAC70\uB978 \uB4A4 \uC790\uB9BF\uAC12\uC744 \uBE44\uAD50\uD558\uB294 \uB450 \uC5F0\uACB0 \uC791\uC5C5" },
  "G4-S1U1-FINAL-digit-condition": { difficulty: 3, rationale: "\uB450 \uACBD\uACC4\uC758 \uC5C4\uACA9\uD55C \uD3EC\uD568 \uC5EC\uBD80\uB97C \uAC19\uC740 \uC790\uB9BF\uAC12 \uBE44\uAD50\uB85C \uC801\uC6A9" },
  "G4-S1U1-FINAL-card-largest": { difficulty: 3, rationale: "\uACE0\uC815\uB41C \uCC9C\uC758 \uC790\uB9AC\uC640 \uB0A8\uC740 \uCE74\uB4DC \uB0B4\uB9BC\uCC28\uC21C \uBC30\uC5F4 \uC5F0\uACB0" },
  "G4-S1U2-FINAL-triangle-zero-condition": { difficulty: 3, rationale: "\uB0B4\uAC01 \uD569\uACFC \uC591\uC758 \uAC01\uC774\uC5B4\uC57C \uD55C\uB2E4\uB294 \uC131\uB9BD \uC870\uAC74 \uC5F0\uACB0" },
  "G4-S1U5-FINAL-goal-comparison": { difficulty: 2, rationale: "\uAC19\uC740 \uAE30\uC900 9\uBA85\uBD84\uACFC \uAC01 \uC778\uC6D0\uC744 \uC9C1\uC811 \uBE44\uAD50; \uD56D\uBAA9 \uC218\uB85C \uB09C\uC774\uB3C4\uB97C \uB192\uC774\uC9C0 \uC54A\uC74C" },
  "G4-S1U6-FINAL-false-rule-test": { difficulty: 3, rationale: "\uC81C\uC2DC\uB41C \uAD00\uACC4\uC758 \uC99D\uAC00\uB7C9\uC744 \uC5EC\uB7EC \uC2DD\uC5D0 \uB300\uC870; \uC804\uB7B5/\uBCF5\uD569 \uC870\uAC74 \uC5C6\uC74C" },
  "G4-S2U5-FINAL-largest-change-interval": { difficulty: 3, rationale: "\uC5F0\uC18D \uBCC0\uD654\uB7C9\uC744 \uAD6C\uD574 \uBE44\uAD50\uD558\uB294 \uC2DC\uACC4\uC5F4 \uC801\uC6A9" },
  "G5-S1U2-FINAL-gcd-selection": { difficulty: 1, rationale: "\uACF5\uC57D\uC218 \uC804\uCCB4\uAC00 \uC8FC\uC5B4\uC838 \uCD5C\uB300\uAC12 \uC815\uC758\uB97C \uC9C1\uC811 \uC77D\uC74C" },
  "G5-S2U1-FINAL-range-intersection": { difficulty: 3, rationale: "\uB450 \uAD6C\uAC04\uC758 \uACBD\uACC4 \uD3EC\uD568 \uC5EC\uBD80\uB97C \uC5F0\uACB0\uD574 \uAD50\uC9D1\uD569 \uD310\uB2E8" },
  "G5-S2U3-FINAL-congruence-two-info": { difficulty: 3, rationale: "\uC54C\uB824\uC9C4 \uB300\uC751 \uAD00\uACC4\uC758 \uBCC0\uACFC \uAC01 \uC131\uC9C8\uC744 \uC5F0\uACB0 \uC801\uC6A9" },
  "G6-S1U2-FINAL-net-base-side-match": { difficulty: 3, rationale: "\uBC11\uBA74 \uBCC0 \uC218\uC5D0\uC11C \uC606\uBA74 \uC218\uB97C \uB3C4\uCD9C\uD55C \uB4A4 \uC8FC\uC5B4\uC9C4 \uAC1C\uC218\uC640 \uBE44\uAD50" },
  "G6-S1U4-FINAL-two-actual-counts-rate": { difficulty: 3, rationale: "\uB450 \uBE44\uC728\uC744 \uACC4\uC0B0\uD558\uC5EC \uAC19\uC740 \uAE30\uC900\uC73C\uB85C \uBE44\uAD50" },
  "G6-S1U6-FINAL-surface-versus-volume-scaling": { difficulty: 3, rationale: "\uBD80\uD53C \uACF5\uC2DD\uC758 \uD55C \uAE38\uC774 \uBCC0\uD654\uC640 \uACF1\uC758 \uBC30\uC728 \uC5F0\uACB0" },
  "G6-S2U5-FINAL-circle-plan-limit": { difficulty: 3, rationale: "\uC6D0\uC8FC \uACC4\uC0B0 \uD6C4 \uC900\uBE44 \uAE38\uC774\uC640 \uBE44\uAD50; \uBCC4\uB3C4 \uC804\uB7B5 \uC870\uAC74 \uC5C6\uC74C" },
  "G6-S2U2-FINAL-decimal-divide-equal": { difficulty: 2, rationale: "\uC815\uB2F5\uC744 \uBBF8\uB9AC \uC81C\uC2DC\uD558\uC9C0 \uC54A\uC740 \uAC19\uC740 \uC591\uC758 \uC18C\uC218 \uB098\uB217\uC148 \uC9C1\uC811 \uC801\uC6A9" }
};
var c = (p, question, answer, wrong, explanation) => ({ ...p, question, answer, explanation, choices: [{ text: answer, reason: "" }, ...wrong.map(([text, reason]) => ({ text, reason }))] });
function closurePayload(id, p) {
  if (id === "G4-S2U2-FINAL-side-equality-sufficiency") return c(p, "\uC0BC\uAC01\uD615\uC758 \uB450 \uBCC0\uC758 \uAE38\uC774\uB294 \uAC01\uAC01 6 cm\uC785\uB2C8\uB2E4. \uC138 \uBCC0\uC758 \uAE38\uC774\uAC00 \uBAA8\uB450 \uAC19\uC740\uC9C0 \uD655\uC778\uD558\uAE30 \uC704\uD574 \uC0C8\uB85C \uC54C\uC544\uC57C \uD558\uB294 \uC815\uBCF4\uB97C \uACE0\uB974\uC138\uC694.", "\uB098\uBA38\uC9C0 \uBCC0\uC758 \uAE38\uC774", [["\uC774\uBBF8 \uC54C\uB824\uC9C4 \uB450 \uBCC0\uC758 \uAE38\uC774\uC758 \uD569", "\uB450 \uBCC0\uC758 \uD569 12 cm\uB9CC\uC73C\uB85C \uC14B\uC9F8 \uBCC0\uC744 \uC54C \uC218 \uC5C6\uC74C"], ["\uC774\uBBF8 \uC54C\uB824\uC9C4 \uB450 \uBCC0\uC758 \uAE38\uC774\uC758 \uCC28", "\uB450 \uBCC0\uC758 \uCC28 0 cm\uB9CC\uC73C\uB85C \uC14B\uC9F8 \uBCC0\uC744 \uC54C \uC218 \uC5C6\uC74C"]], "\uB098\uBA38\uC9C0 \uBCC0\uB3C4 6 cm\uC778\uC9C0 \uD655\uC778\uD574\uC57C \uD569\uB2C8\uB2E4. \uC774\uBBF8 \uC54C\uB824\uC9C4 \uB450 \uBCC0\uC758 \uD569\uC774\uB098 \uCC28\uC5D0\uB294 \uB098\uBA38\uC9C0 \uBCC0\uC758 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
  if (id === "G4-S2U5-FINAL-compare-same-scale") {
    p.question = "\uB450 \uAEBE\uC740\uC120\uADF8\uB798\uD504\uB294 \uAC19\uC740 \uC2DC\uAC01\uC758 \uC774\uC6A9 \uC778\uC6D0\uC744 \uB098\uD0C0\uB0C5\uB2C8\uB2E4. \uC815\uC624\uC758 \uC810\uC740 A\uADF8\uB798\uD504\uC5D0\uC11C \uC138\uB85C\uCD95 0\uC73C\uB85C\uBD80\uD130 5\uCE78(\uD55C \uCE78 2\uBA85), B\uADF8\uB798\uD504\uC5D0\uC11C 3\uCE78(\uD55C \uCE78 5\uBA85) \uB192\uC774\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. \uC815\uC624\uC758 \uC778\uC6D0\uC774 \uB354 \uB9CE\uC740 \uC790\uB8CC\uB97C \uACE0\uB974\uC138\uC694.";
  }
  if (id === "G5-S1U5-fraction-complete") p.question = "\uC804\uCCB4 \uC791\uC5C5\uC758 2/5\uB97C \uB05D\uB0B8 \uB4A4, \uC544\uC9C1 \uD558\uC9C0 \uC54A\uC740 \uBD80\uBD84 \uC911\uC5D0\uC11C \uC804\uCCB4 \uC791\uC5C5\uC758 1/4\uC5D0 \uD574\uB2F9\uD558\uB294 \uC591\uC744 \uCD94\uAC00\uB85C \uB05D\uB0C8\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uC791\uC5C5\uC740 \uC804\uCCB4\uC758 \uC5BC\uB9C8\uC785\uB2C8\uAE4C?";
  if (id === "G5-S1U5-FINAL-fraction-order-of-use") p.question = "\uC804\uCCB4 \uC791\uC5C5\uC5D0\uC11C \uC11C\uB85C \uACB9\uCE58\uC9C0 \uC54A\uB294 \uB450 \uBD80\uBD84\uC758 \uD06C\uAE30\uB294 \uAC01\uAC01 \uC804\uCCB4\uC758 1/3\uACFC 2/5\uC785\uB2C8\uB2E4. \uC774 \uB450 \uBD80\uBD84\uC744 \uB05D\uB0C8\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uBD84\uB7C9\uC740 \uC804\uCCB4\uC758 \uC5BC\uB9C8\uC785\uB2C8\uAE4C?";
  if (id === "G5-S2U6-FINAL-mean-not-always-data") return c(p, "\uB450 \uC810\uC218\uB294 4\uC810\uACFC 8\uC810\uC785\uB2C8\uB2E4. \uC774 \uC790\uB8CC\uC758 \uD3C9\uADE0\uC744 \uAD6C\uD558\uC5EC \uC2E4\uC81C \uC790\uB8CC\uAC12\uACFC \uBE44\uAD50\uD55C \uBC14\uB978 \uC124\uBA85\uC744 \uACE0\uB974\uC138\uC694.", "\uD3C9\uADE0\uC740 6\uC810\uC774\uBA70 \uC2E4\uC81C \uC810\uC218 \uC911\uC5D0\uB294 6\uC810\uC774 \uC5C6\uB2E4", [["\uD3C9\uADE0\uC740 4\uC810\uC774\uBA70 \uC791\uC740 \uC810\uC218\uC640 \uAC19\uB2E4", "\uC791\uC740 \uC790\uB8CC\uAC12\uC744 \uD3C9\uADE0\uC73C\uB85C \uC0AC\uC6A9"], ["\uD3C9\uADE0\uC740 8\uC810\uC774\uBA70 \uD070 \uC810\uC218\uC640 \uAC19\uB2E4", "\uD070 \uC790\uB8CC\uAC12\uC744 \uD3C9\uADE0\uC73C\uB85C \uC0AC\uC6A9"]], "\uD3C9\uADE0\uC740 (4 + 8) \xF7 2 = 6\uC810\uC785\uB2C8\uB2E4. \uD3C9\uADE0\uC774 \uBC18\uB4DC\uC2DC \uC2E4\uC81C \uC790\uB8CC\uAC12 \uC911 \uD558\uB098\uC640 \uAC19\uC744 \uD544\uC694\uB294 \uC5C6\uC2B5\uB2C8\uB2E4.");
  if (id === "G5-S2U6-FINAL-observations-not-certainty") p.question = "\uAC19\uC740 \uC870\uAC74\uC5D0\uC11C \uB9E4\uBC88 \uBB34\uC791\uC704\uB85C \uBF51\uC740 \uB4A4 \uB2E4\uC2DC \uB123\uB294 \uC2E4\uD5D8\uC744 200\uBC88 \uD588\uB354\uB2C8 A\uAC00 140\uBC88, B\uAC00 60\uBC88 \uB098\uC654\uC2B5\uB2C8\uB2E4. \uC774 \uAD00\uCC30\uC744 \uBC14\uD0D5\uC73C\uB85C \uB2E4\uC74C \uD55C \uBC88\uC758 \uACB0\uACFC\uB97C \uC5B4\uB5BB\uAC8C \uC608\uC0C1\uD560 \uC218 \uC788\uC2B5\uB2C8\uAE4C?";
  if (id === "G5-S1U3-FINAL-rule-from-two-rows") p.question = "\uC81C\uC2DC\uB41C \uC138 \uC30D\uC5D0\uC11C \u25A1\uAC00 2, 4, 6\uC77C \uB54C \u25B3\uB294 5, 7, 9\uC785\uB2C8\uB2E4. \uBCF4\uAE30 \uC911 \uC774 \uC138 \uC30D\uC5D0 \uBAA8\uB450 \uB9DE\uB294 \uAD00\uACC4\uB97C \uACE0\uB974\uC138\uC694.";
  if (id === "G6-S2U4-FINAL-proportion-units-check") return c(p, "A\uAC00\uAC8C\uB294 \uACF5\uCC45 4\uAD8C\uC5D0 8000\uC6D0, B\uAC00\uAC8C\uB294 \uAC19\uC740 \uC885\uB958 \uACF5\uCC45 6\uAD8C\uC5D0 1.2\uB9CC \uC6D0\uC785\uB2C8\uB2E4. \uB450 \uAC00\uAC8C\uC758 \uAD8C\uB2F9 \uAC00\uACA9\uC744 \uBE44\uC728\uB85C \uBE44\uAD50\uD558\uAE30 \uC804\uC5D0 \uD574\uC57C \uD560 \uC77C\uC744 \uACE0\uB974\uC138\uC694.", "1.2\uB9CC \uC6D0\uC744 12000\uC6D0\uC73C\uB85C \uBC14\uAFB8\uC5B4 \uAC00\uACA9 \uB2E8\uC704\uB97C \uB9DE\uCD98\uB2E4", [["8000\uACFC 1.2\uB9CC \uBE44\uAD50\uD558\uACE0 \uAD8C\uC218\uB294 \uBB34\uC2DC\uD55C\uB2E4", "\uAC00\uACA9 \uB2E8\uC704\uC640 \uAE30\uC900\uC778 \uAD8C\uC218\uB97C \uBC18\uC601\uD558\uC9C0 \uC54A\uC74C"], ["\uAD8C\uC218 4\uC640 6\uB9CC \uBE44\uAD50\uD55C\uB2E4", "\uBE44\uAD50\uD558\uB294 \uC591\uC778 \uAC00\uACA9\uC744 \uBB34\uC2DC"]], "1.2\uB9CC \uC6D0\uC740 12000\uC6D0\uC785\uB2C8\uB2E4. \uAC19\uC740 \uC6D0 \uB2E8\uC704\uC5D0\uC11C 8000 \xF7 4 = 2000, 12000 \xF7 6 = 2000\uC73C\uB85C \uBE44\uAD50\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
  if (id === "G4-S2U3-FINAL-decimal-place-carry") {
    p.question = "0.75 + 0.25\uB97C \uACC4\uC0B0\uD558\uC5EC \uC18C\uC218 \uCCAB\uC9F8 \uC790\uB9AC\uC758 \uD569\uC774 10\uC774 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC774 10\uC744 \uC5B4\uB290 \uC790\uB9AC\uC758 1\uB85C \uBC14\uAFB8\uC5B4 \uC801\uC2B5\uB2C8\uAE4C?";
    p.explanation = "0.1\uC774 10\uAC1C \uBAA8\uC774\uBA74 1\uC785\uB2C8\uB2E4. \uB530\uB77C\uC11C \uC77C\uC758 \uC790\uB9AC\uC5D0 1\uC744 \uC801\uC2B5\uB2C8\uB2E4. 0.75 + 0.25 = 1\uC785\uB2C8\uB2E4.";
  }
  if (id === "G5-S1U4-FINAL-simplification-equivalence") p.question = "\uBD84\uC790\uC640 \uBD84\uBAA8\uB97C 1\uBCF4\uB2E4 \uD070 \uACF5\uC57D\uC218\uB85C \uB098\uB204\uC5B4 \uC57D\uBD84\uD588\uC2B5\uB2C8\uB2E4. \uBD84\uC218\uC758 \uAC12\uC740 \uC5B4\uB5BB\uAC8C \uB429\uB2C8\uAE4C?";
  if (id === "G6-S2U2-FINAL-decimal-divide-equal") p.question = "\uBB3C 1.25 L\uB97C \uD55C \uBCD1\uC5D0 1.25 L\uC529 \uB2F4\uC2B5\uB2C8\uB2E4. \uD544\uC694\uD55C \uBCD1 \uC218\uB97C \uAD6C\uD558\uACE0 \uB098\uB217\uC148\uC758 \uAE4C\uB2ED\uC744 \uACE0\uB974\uC138\uC694.";
  return p;
}

// learning-review-r1/native/quality/final-gate-corrections.js
var finalGateCorrectedTasks = ["G4-S1U3-FINAL-minimum-bags-condition", "G4-S1U3-FINAL-capacity-strategy", "G4-S2U3-FINAL-decimal-place-carry", "G5-S2U3-FINAL-symmetry-combined-reasoning", "G6-S2U1-FINAL-divisor-over-one", "G5-S2U2-FINAL-multiplier-greater-one", "G6-S1U1-FINAL-quotient-value-size", "G6-S1U3-FINAL-natural-divisor-size", "G6-S2U2-FINAL-decimal-divide-size"];
function finalGateCorrection(id, p) {
  if (id === "G4-S1U3-FINAL-minimum-bags-condition") p.question = "\uACF5 96\uAC1C\uB97C \uD55C \uBD09\uC9C0\uC5D0 \uCD5C\uB300 20\uAC1C\uC529 \uB2F4\uC2B5\uB2C8\uB2E4. \uC55E \uBD09\uC9C0\uBD80\uD130 20\uAC1C\uC529 \uAC00\uB4DD \uCC44\uC6B0\uACE0 \uB0A8\uC740 \uACF5\uC740 \uB9C8\uC9C0\uB9C9 \uBD09\uC9C0\uC5D0 \uB2F4\uC2B5\uB2C8\uB2E4. \uD544\uC694\uD55C \uCD5C\uC18C \uBD09\uC9C0 \uC218\uC640 \uB9C8\uC9C0\uB9C9 \uBD09\uC9C0\uC758 \uACF5 \uC218\uB97C \uACE0\uB974\uC138\uC694.";
  if (id === "G4-S1U3-FINAL-capacity-strategy") p.question = "\uCE74\uB4DC 170\uC7A5 \uC911 26\uC7A5\uC744 \uBA3C\uC800 \uB530\uB85C \uB461\uB2C8\uB2E4. \uB098\uBA38\uC9C0\uB294 \uC55E \uC0C1\uC790\uBD80\uD130 30\uC7A5\uC529 \uAC00\uB4DD \uCC44\uC6B0\uACE0 \uB0A8\uC740 \uCE74\uB4DC\uB294 \uB9C8\uC9C0\uB9C9 \uC0C1\uC790\uC5D0 \uB2F4\uC2B5\uB2C8\uB2E4. \uBE44\uC5B4 \uC788\uB294 \uC0C1\uC790\uB294 \uC4F0\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD544\uC694\uD55C \uCD5C\uC18C \uC0C1\uC790 \uC218\uC640 \uB9C8\uC9C0\uB9C9 \uC0C1\uC790\uC758 \uC7A5\uC218\uB97C \uACE0\uB974\uC138\uC694.";
  if (id === "G4-S2U3-FINAL-decimal-place-carry") {
    p.question = "0.75 + 0.25\uC5D0\uC11C \uC18C\uC218 \uB458\uC9F8 \uC790\uB9AC\uC758 10\uC744 \uC18C\uC218 \uCCAB\uC9F8 \uC790\uB9AC\uC758 1\uB85C \uBC14\uAFD4 \uB354\uD558\uBA74 \uC18C\uC218 \uCCAB\uC9F8 \uC790\uB9AC\uC758 \uD569\uC774 10\uC774 \uB429\uB2C8\uB2E4. \uC774 10\uC744 \uC5B4\uB290 \uC790\uB9AC\uC758 1\uB85C \uBC14\uAFB8\uC5B4 \uC801\uC2B5\uB2C8\uAE4C?";
    p.explanation = "\uC18C\uC218 \uCCAB\uC9F8 \uC790\uB9AC\uC758 0.1\uC774 10\uAC1C \uBAA8\uC774\uBA74 \uC804\uCCB4 1\uC785\uB2C8\uB2E4. \uB530\uB77C\uC11C \uC77C\uC758 \uC790\uB9AC\uC5D0 1\uC744 \uC801\uC73C\uBA70 0.75 + 0.25 = 1\uC785\uB2C8\uB2E4.";
  }
  if (id === "G5-S2U3-FINAL-symmetry-combined-reasoning") p.question = "\uB300\uCE6D\uCD95\uC740 \uC138\uB85C\uB85C \uB193\uC778 \uC9C1\uC120\uC785\uB2C8\uB2E4. \uAC01 \uD6C4\uBCF4\uC758 \uB450 \uC810\uC740 \uAC19\uC740 \uB192\uC774\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. A\uB294 \uCD95\uC758 \uC591\uCABD\uC5D0 \uAC01\uAC01 2 cm, B\uB294 \uCD95\uC758 \uC591\uCABD\uC5D0 2 cm\uC640 3 cm, C\uB294 \uCD95\uC758 \uAC19\uC740 \uCABD\uC5D0 \uAC01\uAC01 2 cm \uB5A8\uC5B4\uC838 \uC788\uC2B5\uB2C8\uB2E4. \uC774 \uCD95\uC5D0 \uB300\uD55C \uC120\uB300\uCE6D \uC870\uAC74\uC5D0 \uB9DE\uB294 \uD6C4\uBCF4\uB97C \uACE0\uB974\uC138\uC694.";
  if (id === "G6-S2U1-FINAL-divisor-over-one") p.question = "0\uBCF4\uB2E4 \uD070 \uC218\uB97C 3/2\uB85C \uB098\uB204\uBA74 \uBAAB\uC740 \uC6D0\uB798 \uAC12\uBCF4\uB2E4 \uC5B4\uB5BB\uC2B5\uB2C8\uAE4C?";
  if (finalGateCorrectedTasks.includes(id)) p.question = p.question.replace("\uC591\uC758 \uC790\uC5F0\uC218", "0\uBCF4\uB2E4 \uD070 \uC790\uC5F0\uC218").replace("\uC591\uC758 \uC18C\uC218 \uC591", "0\uBCF4\uB2E4 \uD070 \uC18C\uC218\uB85C \uB098\uD0C0\uB0B8 \uC591").replace("\uC591\uC218\uB97C", "0\uBCF4\uB2E4 \uD070 \uC218\uB97C").replace("\uC591\uC218\uC5D0", "0\uBCF4\uB2E4 \uD070 \uC218\uC5D0");
  return closurePayload(id, p);
}

// learning-review-r1/native/quality/rc-corrections.js
function applyRCCorrection(id, p, k) {
  if (id === "G5-S2U1-FINAL-range-intersection") {
    p.choices[2] = { text: "15 \uCD08\uACFC 20 \uC774\uD558", reason: "15\uB97C \uC81C\uC678\uD558\uACE0 20\uC744 \uD3EC\uD568\uD558\uC5EC \uB450 \uACBD\uACC4\uC758 \uD3EC\uD568 \uC870\uAC74\uC744 \uBC14\uAFC8" };
  }
  if (id === "G6-S2U4-proportion-equivalent") {
    const scale = 2 + k;
    p.explanation = `\uC55E\uD56D\uC774 2\uC5D0\uC11C ${2 * scale}\uB85C ${scale}\uBC30\uAC00 \uB418\uC5C8\uC73C\uBBC0\uB85C \uB4A4\uD56D\uB3C4 3\uC5D0\uC11C ${3 * scale}\uC73C\uB85C ${scale}\uBC30\uAC00 \uB418\uC5B4\uC57C \uD569\uB2C8\uB2E4.`;
  }
  if (id === "G6-S2U4-FINAL-equivalent-proportion-check") p.explanation = "\uC55E\uD56D\uACFC \uB4A4\uD56D\uC774 \uAC01\uAC01 3\uBC30\uAC00 \uB418\uC5C8\uC73C\uBBC0\uB85C \uB450 \uBE44\uC758 \uBE44\uC728\uC740 \uAC19\uC2B5\uB2C8\uB2E4.";
  if (id === "G4-S1U5-FINAL-equal-height") {
    p.answer = "\uB450 \uD56D\uBAA9\uC758 \uAC12\uC774 \uAC19\uB2E4";
    p.choices[0].text = p.answer;
    p.explanation = "\uAC19\uC740 \uCD95\uACFC \uB208\uAE08\uC744 \uC0AC\uC6A9\uD558\uBBC0\uB85C \uB450 \uB9C9\uB300\uC758 \uB192\uC774\uAC00 \uAC19\uC73C\uBA74 \uB450 \uD56D\uBAA9\uC758 \uAC12\uC774 \uAC19\uC2B5\uB2C8\uB2E4.";
  }
  if (id === "G5-S2U2-fraction-cancel-error") {
    p.choices[1] = { text: "24/13", reason: "\uBD84\uC790\uB294 3 \xD7 8 = 24\uB85C \uACF1\uD588\uC9C0\uB9CC \uBD84\uBAA8\uB294 4 + 9 = 13\uC73C\uB85C \uB354\uD568" };
    p.choices[2] = { text: "11/36", reason: "\uBD84\uBAA8\uB294 4 \xD7 9 = 36\uC73C\uB85C \uACF1\uD588\uC9C0\uB9CC \uBD84\uC790\uB294 3 + 8 = 11\uB85C \uB354\uD568" };
    p.explanation = "\uBD84\uC790\uB294 3 \xD7 8 = 24, \uBD84\uBAA8\uB294 4 \xD7 9 = 36\uC785\uB2C8\uB2E4. 24/36\uC744 \uC57D\uBD84\uD558\uBA74 2/3\uC785\uB2C8\uB2E4.";
  }
  if (id === "G6-S2U1-FINAL-division-order-not-same") p.explanation = "1/2 \xF7 1/4 = 2\uC774\uACE0, 1/4 \xF7 1/2 = 1/2\uC785\uB2C8\uB2E4. \uB098\uB217\uC148\uC740 \uC21C\uC11C\uB97C \uBC14\uAFB8\uBA74 \uBAAB\uC774 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
  if (id === "G6-S1U1-FINAL-fraction-share-meaning") p.explanation = "\uC804\uCCB4 \uC591 2/3\uC744 4\uB4F1\uBD84\uD558\uBA74 \uBD84\uBAA8\uAC00 3 \xD7 4 = 12\uC778 \uBD84\uC218 2/12\uAC00 \uB429\uB2C8\uB2E4. 2/12 = 1/6\uC774\uBBC0\uB85C \uD55C \uBD80\uBD84\uC758 \uC591\uC740 1/6\uC785\uB2C8\uB2E4.";
  return finalGateCorrection(id, p);
}

// learning-review-r1/native/quality/human-review-rules.js
var humanTaskMetadata = { "G4-S1U6-multiply-rule": { difficulty: 2, objective: "\uD55C \uC218\uB97C \uB450 \uBC30\uC529 \uB298\uB9AC\uB294 \uADDC\uCE59\uC744 \uC9C1\uC811 \uC801\uC6A9\uD558\uAE30" }, "G4-S2U5-FINAL-compare-same-scale": { difficulty: 3, objective: "\uC11C\uB85C \uB2E4\uB978 \uB208\uAE08\uC5D0\uC11C \uC2E4\uC81C \uAC12\uC744 \uACC4\uC0B0\uD558\uC5EC \uBE44\uAD50\uD558\uAE30" }, "G6-S1U5-FINAL-band-whole-length": { difficulty: 3, objective: "\uB760\uADF8\uB798\uD504\uC758 \uC804\uCCB4\xB7\uBD80\uBD84 \uBE44\uC728\uC744 \uC2E4\uC81C \uC778\uC6D0\uACFC \uC5F0\uACB0\uD558\uAE30" } };
var mathHumanGlossary = [["\uC790\uB9AC\uAC12", "\uC790\uB9BF\uAC12"], ["\uAF2D\uC9C0\uC810", "\uAF2D\uC9D3\uC810"], ["\uD55C \uAF2D\uB300\uAE30 \uC810", "\uD55C \uAC1C\uC758 \uAF2D\uC9D3\uC810"], ["\uD3C9\uADE0\uAC12", "\uD3C9\uADE0"], ["\uC13C\uD2F0\uBBF8\uD130\uC81C\uACF1", "\uC81C\uACF1\uC13C\uD2F0\uBBF8\uD130"], ["\uC13C\uD2F0\uBBF8\uD130\uC138\uC81C\uACF1", "\uC138\uC81C\uACF1\uC13C\uD2F0\uBBF8\uD130"], ["\uC6D0\uB458\uB808", "\uC6D0\uC8FC"]];
function humanMathText(text) {
  let s = text;
  const pairs2 = { \uC73C\uB85C: "\uC73C\uB85C/\uB85C", \uC740: "\uC740/\uB294", \uB294: "\uC740/\uB294", \uC774: "\uC774/\uAC00", \uAC00: "\uC774/\uAC00", \uC744: "\uC744/\uB97C", \uB97C: "\uC744/\uB97C", \uACFC: "\uACFC/\uC640", \uC640: "\uACFC/\uC640", \uB85C: "\uC73C\uB85C/\uB85C" };
  for (const [before, after] of mathHumanGlossary) {
    let pos = 0, out = "", at;
    while ((at = s.indexOf(before, pos)) >= 0) {
      out += s.slice(pos, at) + after;
      pos = at + before.length;
      const particle2 = Object.keys(pairs2).find((p) => s.startsWith(p, pos) && /^(?:\s|[.,!?;:)]|$)/.test(s.slice(pos + p.length)));
      if (particle2) {
        out += koreanParticle(after, pairs2[particle2]);
        pos += particle2.length;
      }
    }
    s = out + s.slice(pos);
  }
  return formatKoreanContent(s);
}
var concept = (question, answer, wrong, explanation) => ({ question, answer, unit: "", category: "concept", explanation, choices: [{ text: answer, reason: "" }, ...wrong.map(([text, reason]) => ({ text, reason }))] });
var graphHumanOverrides = {
  "G4-S2U5-FINAL-line-flat-meaning": concept("\uC6D4\uC694\uC77C\uACFC \uD654\uC694\uC77C \uC815\uC624\uC758 \uAE30\uC628\uC744 \uAC01\uAC01 18\u2103\uB85C \uCE21\uC815\uD558\uC5EC \uAEBE\uC740\uC120\uADF8\uB798\uD504\uB85C \uC774\uC5C8\uC2B5\uB2C8\uB2E4. \uC774 \uC218\uD3C9 \uAD6C\uAC04\uC5D0\uC11C \uD655\uC2E4\uD788 \uC54C \uC218 \uC788\uB294 \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uB450 \uC2DC\uAC01\uC5D0 \uCE21\uC815\uD55C \uAE30\uC628\uC774 \uAC19\uB2E4", [["\uB450 \uC2DC\uAC01 \uC0AC\uC774 \uB0B4\uB0B4 \uAE30\uC628\uC774 18\u2103\uC600\uB2E4", "\uB450 \uAD00\uCE21 \uC2DC\uAC01 \uC0AC\uC774\uC758 \uC2E4\uC81C \uAC12\uC744 \uB2E8\uC815"], ["\uB450 \uC2DC\uAC01\uC758 \uAE30\uC628\uC774 \uBAA8\uB450 0\u2103\uC600\uB2E4", "\uC218\uD3C9 \uAD6C\uAC04\uACFC 0\uC744 \uD63C\uB3D9"]], "\uB450 \uC810\uC758 \uB192\uC774\uAC00 \uAC19\uC73C\uBBC0\uB85C \uCE21\uC815\uD55C \uAE30\uC628\uC740 \uAC19\uC2B5\uB2C8\uB2E4. \uB450 \uC2DC\uAC01 \uC0AC\uC774\uC758 \uAE30\uC628\uC740 \uCD94\uAC00 \uCE21\uC815 \uC5C6\uC774 \uD655\uC815\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."),
  "G4-S2U5-FINAL-line-missing-day": concept("\uC6D4\uC694\uC77C \uC815\uC624 12\u2103\uC640 \uC218\uC694\uC77C \uC815\uC624 16\u2103\uB9CC \uCE21\uC815\uD558\uACE0 \uB450 \uC810\uC744 \uC774\uC5C8\uC2B5\uB2C8\uB2E4. \uD654\uC694\uC77C \uC815\uC624\uC758 \uC2E4\uC81C \uAE30\uC628\uC5D0 \uB300\uD55C \uBC14\uB978 \uC124\uBA85\uC744 \uACE0\uB974\uC138\uC694.", "\uC2E4\uC81C \uAE30\uC628\uC744 \uC54C\uB824\uBA74 \uD654\uC694\uC77C\uC5D0 \uCE21\uC815\uD55C \uC790\uB8CC\uAC00 \uD544\uC694\uD558\uB2E4", [["\uC120\uC744 \uC774\uC5C8\uC73C\uBBC0\uB85C \uC2E4\uC81C \uAE30\uC628\uC740 \uBC18\uB4DC\uC2DC 14\u2103\uC774\uB2E4", "\uC5F0\uACB0\uC120\uC744 \uC2E4\uC81C \uAD00\uCE21 \uC790\uB8CC\uB85C \uC624\uC778"], ["\uD654\uC694\uC77C \uC790\uB8CC\uAC00 \uC5C6\uC73C\uBBC0\uB85C \uAE30\uC628\uC740 0\u2103\uC774\uB2E4", "\uCE21\uC815 \uB204\uB77D\uC744 0\uC73C\uB85C \uCC98\uB9AC"]], "\uC5F0\uACB0\uC120\uC758 \uC911\uAC04 \uAC12 14\u2103\uB294 \uCE21\uC815\uD55C \uAC12\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uD654\uC694\uC77C\uC758 \uC2E4\uC81C \uAE30\uC628\uC744 \uC54C\uB824\uBA74 \uADF8\uB0A0\uC758 \uCE21\uC815 \uC790\uB8CC\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4."),
  "G4-S2U5-FINAL-line-unit-suitability": concept("\uC2DD\uBB3C\uC758 \uB192\uC774\uB97C 1\uC8FC\uC5D0 8 cm, 2\uC8FC\uC5D0 11 cm, 3\uC8FC\uC5D0 15 cm\uB85C \uCE21\uC815\uD588\uC2B5\uB2C8\uB2E4. \uC774 \uBCC0\uD654\uB97C \uB098\uD0C0\uB0B4\uB294 \uAEBE\uC740\uC120\uADF8\uB798\uD504\uC758 \uCD95\uC744 \uBC14\uB974\uAC8C \uC815\uD55C \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uAC00\uB85C\uCD95\uC740 \uCE21\uC815\uD55C \uC8FC, \uC138\uB85C\uCD95\uC740 \uB192\uC774(cm)", [["\uAC00\uB85C\uCD95\uC740 \uB192\uC774(cm), \uC138\uB85C\uCD95\uC740 \uD559\uC0DD \uC218(\uBA85)", "\uC2DC\uAC04 \uC815\uBCF4\uC640 \uCE21\uC815\uD55C \uC591\uC744 \uB2E4\uB978 \uC790\uB8CC\uB85C \uBC14\uAFC8"], ["\uAC00\uB85C\uCD95\uC740 \uCE21\uC815\uD55C \uC8FC, \uC138\uB85C\uCD95\uC740 \uBB34\uAC8C(kg)", "\uB192\uC774\uB97C \uBB34\uAC8C\uB85C \uD45C\uD604"]], "\uC2DC\uAC04\uC5D0 \uB530\uB978 \uBCC0\uD654\uB97C \uBCF4\uB824\uBA74 \uAC00\uB85C\uCD95\uC5D0 \uCE21\uC815\uD55C \uC8FC\uB97C, \uC138\uB85C\uCD95\uC5D0 \uC2DD\uBB3C\uC758 \uB192\uC774\uB97C cm \uB2E8\uC704\uB85C \uB098\uD0C0\uB0C5\uB2C8\uB2E4."),
  "G6-S1U5-FINAL-band-whole-length": concept("\uD559\uC0DD 40\uBA85\uC774 \uD76C\uB9DD \uD65C\uB3D9\uC744 \uD55C \uAC00\uC9C0\uC529 \uACE8\uB790\uC2B5\uB2C8\uB2E4. \uB760\uADF8\uB798\uD504\uC5D0\uC11C \uBBF8\uC220 25%, \uC6B4\uB3D9 35%\uC774\uACE0 \uB098\uBA38\uC9C0\uB294 \uC74C\uC545\uC785\uB2C8\uB2E4. \uC804\uCCB4 \uB760\uC640 \uC74C\uC545 \uBD80\uBD84\uC744 \uBC14\uB974\uAC8C \uC124\uBA85\uD55C \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uC804\uCCB4 \uB760\uB294 40\uBA85(100%)\uC774\uACE0 \uC74C\uC545\uC740 16\uBA85(40%)", [["\uC804\uCCB4 \uB760\uB294 40\uBA85(100%)\uC774\uACE0 \uC74C\uC545\uC740 40\uBA85(40%)", "\uBC31\uBD84\uC728\uC758 \uC218\uB97C \uC778\uC6D0\uC73C\uB85C \uC0AC\uC6A9"], ["\uC804\uCCB4 \uB760\uB294 24\uBA85(60%)\uC774\uACE0 \uC74C\uC545\uC740 16\uBA85(40%)", "\uC774\uBBF8 \uC54C\uB824\uC9C4 \uB450 \uBD80\uBD84\uB9CC \uC804\uCCB4\uB85C \uC0AC\uC6A9"]], "\uC74C\uC545\uC758 \uBE44\uC728\uC740 100 \u2212 25 \u2212 35 = 40%\uC785\uB2C8\uB2E4. 40\uBA85\uC758 40%\uB294 16\uBA85\uC774\uBA70 \uC804\uCCB4 \uB760\uB294 \uBAA8\uB4E0 \uD559\uC0DD 40\uBA85\uC744 \uB098\uD0C0\uB0C5\uB2C8\uB2E4."),
  "G6-S1U5-FINAL-percent-not-size": concept("A\uBC18 20\uBA85\uACFC B\uBC18 30\uBA85\uC758 \uD76C\uB9DD \uD65C\uB3D9 \uC6D0\uADF8\uB798\uD504\uC5D0\uC11C \uBBF8\uC220\uC740 \uBAA8\uB450 30%\uC785\uB2C8\uB2E4. \uBBF8\uC220\uC744 \uD76C\uB9DD\uD55C \uC778\uC6D0\uC744 \uBC14\uB974\uAC8C \uBE44\uAD50\uD55C \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "A\uBC18 6\uBA85, B\uBC18 9\uBA85\uC73C\uB85C B\uBC18\uC774 3\uBA85 \uB354 \uB9CE\uB2E4", [["\uB450 \uBC18 \uBAA8\uB450 30\uBA85\uC774\uBBC0\uB85C \uAC19\uB2E4", "\uBC31\uBD84\uC728\uACFC \uC2E4\uC81C \uC778\uC6D0\uC744 \uD63C\uB3D9"], ["\uB450 \uBC18 \uBAA8\uB450 6\uBA85\uC774\uBBC0\uB85C \uAC19\uB2E4", "A\uBC18\uC758 \uC804\uCCB4 \uC778\uC6D0\uC744 \uB450 \uBC18\uC5D0 \uC801\uC6A9"]], "\uAC19\uC740 30%\uB77C\uB3C4 \uAE30\uC900\uC778 \uC804\uCCB4 \uC778\uC6D0\uC774 \uB2E4\uB985\uB2C8\uB2E4. 20 \xD7 0.3 = 6\uBA85, 30 \xD7 0.3 = 9\uBA85\uC785\uB2C8\uB2E4."),
  "G6-S1U5-FINAL-band-pie-same-data": concept("\uD559\uC0DD 20\uBA85\uC758 \uC751\uB2F5\uC740 \uBBF8\uC220 5\uBA85, \uC6B4\uB3D9 8\uBA85, \uC74C\uC545 7\uBA85\uC785\uB2C8\uB2E4. \uAC19\uC740 \uC751\uB2F5\uC744 \uB760\uADF8\uB798\uD504\uC640 \uC6D0\uADF8\uB798\uD504\uB85C \uB098\uD0C0\uB0BC \uB54C \uC6B4\uB3D9 \uBD80\uBD84\uC744 \uBC14\uB974\uAC8C \uC124\uBA85\uD55C \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uB450 \uADF8\uB798\uD504 \uBAA8\uB450 \uC6B4\uB3D9\uC774 \uC804\uCCB4\uC758 40%\uB97C \uCC28\uC9C0\uD55C\uB2E4", [["\uB760\uADF8\uB798\uD504\uB294 8%, \uC6D0\uADF8\uB798\uD504\uB294 40%\uC774\uB2E4", "\uC778\uC6D0 \uC218 8\uC744 \uBC31\uBD84\uC728 8%\uB85C \uC624\uC778"], ["\uC6D0\uADF8\uB798\uD504\uAC00 \uB465\uAE00\uBBC0\uB85C \uC6B4\uB3D9 \uBE44\uC728\uC774 \uB354 \uCEE4\uC9C4\uB2E4", "\uADF8\uB9BC \uBAA8\uC591\uACFC \uC2E4\uC81C \uBE44\uC728\uC744 \uD63C\uB3D9"]], "\uC6B4\uB3D9\uC758 \uBE44\uC728\uC740 8 \xF7 20 \xD7 100 = 40%\uC785\uB2C8\uB2E4. \uADF8\uB798\uD504\uC758 \uBAA8\uC591\uC774 \uB2EC\uB77C\uB3C4 \uAC19\uC740 \uC790\uB8CC\uC758 \uBE44\uC728\uC740 \uAC19\uC2B5\uB2C8\uB2E4.")
};
function applyHumanTaskPatch(id, input, k = 0) {
  const p = applyRCCorrection(id, structuredClone(graphHumanOverrides[id] ?? input), k), old = p.answer;
  const decimal = /원주율|원주\s*÷\s*지름/.test(p.question) && !p.choices;
  if (decimal) {
    p.answer = parseSchoolNumber(old).value.toDisplayString("decimal");
    p.explanation = p.explanation.replaceAll(old, p.answer);
  }
  p.question = humanMathText(p.question);
  p.explanation = humanMathText(p.explanation);
  p.answer = humanMathText(p.answer);
  p.choices = p.choices?.map((c2) => ({ text: humanMathText(c2.text), reason: humanMathText(c2.reason) }));
  if (!input.choices && !graphHumanOverrides[id]?.choices) delete p.choices;
  return p;
}

// learning-review-r1/native/validators/foundation-model.js
var measurementUnits = { mm: { dimension: "length", scale: "1/1000" }, cm: { dimension: "length", scale: "1/100" }, m: { dimension: "length", scale: "1" }, km: { dimension: "length", scale: "1000" }, \uCD08: { dimension: "time", scale: "1" }, \uBD84: { dimension: "time", scale: "60" }, \uC2DC\uAC04: { dimension: "time", scale: "3600" }, mL: { dimension: "capacity", scale: "1/1000" }, L: { dimension: "capacity", scale: "1" }, g: { dimension: "mass", scale: "1/1000" }, kg: { dimension: "mass", scale: "1" }, t: { dimension: "mass", scale: "1000" }, "cm\xB2": { dimension: "area", scale: "1/10000" }, "m\xB2": { dimension: "area", scale: "1" }, "km\xB2": { dimension: "area", scale: "1000000" }, "cm\xB3": { dimension: "volume", scale: "1/1000000" }, "m\xB3": { dimension: "volume", scale: "1" } };
var exact = (v) => {
  if (typeof v !== "string" && typeof v !== "number") throw Error("Exact data field required");
  const x = Rational.parse(v);
  if (x.numerator < 0n) throw Error("Natural/nonnegative elementary quantity");
  return x;
};
var positive = (v) => {
  const x = exact(v);
  if (x.numerator <= 0n) throw Error("Positive reference quantity");
  return x;
};
var natural = (v) => {
  const x = exact(v);
  if (x.denominator !== 1n || x.numerator > 1000000n) throw Error("Bounded natural data");
  return x.numerator;
};
function graphProjection(m) {
  const d = m.data;
  if (d.task !== "graph" || !["table", "bar", "line", "band", "pie"].includes(String(d.graphType)) || !Array.isArray(d.rows) || !d.rows.length || d.rows.length > 6) throw Error("Registered graph with 1..6 rows");
  const rows2 = d.rows;
  if (rows2.some((r2) => !r2 || typeof r2.label !== "string" || !r2.label.trim() || r2.label.length > (["bar", "line"].includes(String(d.graphType)) ? 4 : 12) || !Number.isSafeInteger(r2.value) || r2.value < 0 || r2.value > 1e4) || new Set(rows2.map((r2) => r2.label)).size !== rows2.length) throw Error("Graph labels/counts");
  const total = rows2.reduce((s, r2) => s + r2.value, 0);
  if (["pie", "band"].includes(String(d.graphType)) && (!total || rows2.some((r2) => r2.value * 100 % total))) throw Error("Grade6 graph percentages must be integer, nonzero total");
  if (d.renderedRows !== void 0 && JSON.stringify(rows2) !== JSON.stringify(d.renderedRows)) throw Error("Rendered/source data disagreement");
  return { type: String(d.graphType), rows: structuredClone(rows2), total, valueUnit: String(d.valueUnit ?? "") };
}
function solveFoundationModel(m) {
  const d = m.data;
  const allowed = { "unit-conversion": ["task", "amount", "fromUnit", "toUnit"], ratio: ["task", "comparison", "base", "inputUnit", "total", "otherComparison"], "number-theory": ["task", "a", "b"], "large-number": ["task", "a", "b", "place"], graph: ["task", "graphType", "rows", "a", "b", "valueUnit", "renderedRows"] };
  if (!allowed[String(d.task)] || Object.keys(d).some((k) => !allowed[String(d.task)].includes(k))) throw Error("Unknown/unused foundation field must have a registered semantic role");
  if (d.task === "unit-conversion") {
    const from = measurementUnits[String(d.fromUnit)], to = measurementUnits[String(d.toUnit)];
    if (!from || !to || from.dimension !== to.dimension || m.unit !== d.toUnit) throw Error("Dimensionally consistent conversion required");
    return exact(d.amount).multiply(Rational.parse(from.scale)).divide(Rational.parse(to.scale)).toDisplayString();
  }
  if (d.task === "ratio") {
    const base = positive(d.base), comparison = exact(d.comparison);
    if (d.inputUnit === void 0 || typeof d.inputUnit !== "string") throw Error("Ratio input unit declaration");
    if (!["rate", "percentage", "proportion", "allocation"].includes(m.query)) throw Error("Ratio operation");
    if (m.query === "percentage") {
      if (m.unit !== "%") throw Error("Percentage unit");
      return comparison.divide(base).multiply(new Rational(100)).toDisplayString();
    }
    if (m.unit !== (["allocation", "proportion"].includes(m.query) ? d.inputUnit : "")) throw Error("Ratio result unit");
    if (m.query === "rate") return comparison.divide(base).toDisplayString("fraction");
    if (m.query === "proportion") return positive(d.otherComparison).multiply(base).divide(positive(d.comparison)).toDisplayString();
    return exact(d.total).multiply(comparison).divide(base.add(comparison)).toDisplayString();
  }
  if (d.task === "number-theory") {
    const a12 = natural(d.a), b = d.b === void 0 ? 0n : natural(d.b);
    if (m.unit !== (m.query === "divisor-count" ? "\uAC1C" : "")) throw Error("Number theory unit");
    if (["gcd", "lcm", "is-divisor"].includes(m.query) && (!a12 || !b)) throw Error("Positive divisor/multiple operands");
    if (m.query === "gcd") return String(Rational.gcd(a12, b));
    if (m.query === "lcm") return String(a12 / Rational.gcd(a12, b) * b);
    if (m.query === "is-divisor") return a12 % b === 0n ? "\uC608" : "\uC544\uB2C8\uC694";
    if (m.query === "divisor-count") {
      if (!a12) throw Error("Zero has unbounded divisors");
      let count = 0;
      for (let i = 1n; i * i <= a12; i++) if (a12 % i === 0n) count += i * i === a12 ? 1 : 2;
      return String(count);
    }
    throw Error("Registered number theory query");
  }
  if (d.task === "large-number") {
    const a12 = exact(d.a);
    if (a12.denominator !== 1n || a12.numerator > 9999999999999999n || a12.numerator < 10000n) throw Error("Large natural number scope");
    if (m.unit !== "") throw Error("Large number unit");
    if (m.query === "place-value") {
      const place = positive(d.place);
      if (place.denominator !== 1n || !/^(1|10+)$/u.test(String(place.numerator))) throw Error("Power-of-ten place");
      return String(a12.numerator / place.numerator % 10n * place.numerator);
    }
    if (m.query === "compare") {
      const b = exact(d.b);
      if (b.denominator !== 1n || b.numerator > 9999999999999999n) throw Error("Large comparison");
      return a12.compare(b) > 0 ? "\uC67C\uCABD" : a12.compare(b) < 0 ? "\uC624\uB978\uCABD" : "\uAC19\uC74C";
    }
    throw Error("Large number query");
  }
  if (d.task === "graph") {
    const p = graphProjection(m), find = (v) => {
      const row = p.rows.find((r2) => r2.label === v);
      if (!row) throw Error("Question refers to absent graph row");
      return row;
    };
    if (m.unit !== (m.query === "max-label" ? "" : m.query === "percentage" ? "%" : p.valueUnit)) throw Error("Graph query unit");
    if (m.query === "value") return String(find(d.a).value);
    if (m.query === "sum") return String(p.total);
    if (m.query === "difference") return String(find(d.a).value - find(d.b).value);
    if (m.query === "change") return String(p.rows.at(-1).value - p.rows[0].value);
    if (m.query === "mean") return new Rational(p.total, p.rows.length).toDisplayString();
    if (m.query === "percentage") {
      if (!p.total) throw Error("Graph zero reference");
      return new Rational(find(d.a).value * 100, p.total).toDisplayString();
    }
    if (m.query === "max-label") {
      const maximum = Math.max(...p.rows.map((r2) => r2.value));
      if (p.rows.filter((r2) => r2.value === maximum).length !== 1) throw Error("Ambiguous maximum");
      return p.rows.find((r2) => r2.value === maximum).label;
    }
    throw Error("Graph operation");
  }
  throw Error("Unsupported foundation task");
}

// learning-review-r1/native/validators/planar-geometry.js
var close = (a12, b) => Math.abs(a12 - b) <= 1e-8 * Math.max(1, Math.abs(a12), Math.abs(b));
var point2 = (p) => {
  if (!Array.isArray(p) || p.length !== 2 || p.some((x) => typeof x !== "number" || !Number.isFinite(x) || Math.abs(x) > 1e4 || (String(x).split(".")[1] ?? "").length > 3)) throw Error("Bounded coordinate point required");
  return p;
};
var diff = (a12, b) => [a12[0] - b[0], a12[1] - b[1]];
var dot2 = (a12, b) => a12[0] * b[0] + a12[1] * b[1];
var cross2 = (a12, b) => a12[0] * b[1] - a12[1] * b[0];
var length = (a12) => Math.hypot(...a12);
var dim = (v) => {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0 || v > 1e4) throw Error("Positive bounded dimension");
  return v;
};
function validatePlanarGeometry(m) {
  const d = m.data;
  if (Object.keys(d).some((k) => !["shape", "vertices", "coordinateUnit", "areaUnit", "base", "height", "heightSegment", "topBase", "diagonal1", "diagonal2", "displayLabels"].includes(k))) throw Error("Unknown planar field must have a registered semantic role");
  const shape = String(d.shape), expectedVertices = shape === "triangle" ? 3 : 4;
  if (!["triangle", "rectangle", "square", "parallelogram", "trapezoid", "rhombus"].includes(shape)) throw Error("Registered planar shape required");
  if (!Array.isArray(d.vertices) || d.vertices.length !== expectedVertices) throw Error("Planar vertex count");
  const vertices = d.vertices.map(point2);
  if (new Set(vertices.map((v) => v.join(","))).size !== vertices.length) throw Error("Distinct planar vertices");
  if (!["cm", "m"].includes(String(d.coordinateUnit)) || m.unit !== d.coordinateUnit + "\xB2") throw Error("Area/coordinate unit mismatch");
  if (d.areaUnit !== void 0 && d.areaUnit !== m.unit) throw Error("Declared area label unit mismatch");
  const edges = vertices.map((v, i) => diff(vertices[(i + 1) % vertices.length], v));
  const turns = edges.map((e, i) => cross2(e, edges[(i + 1) % edges.length]));
  if (turns.some((t) => close(t, 0)) || turns.some((t) => t * turns[0] <= 0)) throw Error("Nondegenerate convex polygon required");
  const sides = edges.map(length);
  if (["rectangle", "square"].includes(shape) && edges.some((e, i) => !close(dot2(e, edges[(i + 1) % edges.length]), 0))) throw Error("Rectangle perpendicular sides");
  if (["square", "rhombus"].includes(shape) && sides.some((s) => !close(s, sides[0]))) throw Error("All four sides must be equal");
  if (["rectangle", "square", "parallelogram"].includes(shape) && (!close(cross2(edges[0], edges[2]), 0) || !close(cross2(edges[1], edges[3]), 0))) throw Error("Opposite parallel sides");
  if (shape === "trapezoid" && !close(cross2(edges[0], edges[2]), 0)) throw Error("Trapezoid parallel bases");
  let area, labels = {};
  const unit = String(d.coordinateUnit);
  if (shape === "rhombus") {
    const a12 = diff(vertices[2], vertices[0]), b = diff(vertices[3], vertices[1]);
    if (!close(dot2(a12, b), 0)) throw Error("Rhombus diagonals perpendicular");
    if (!close(dim(d.diagonal1), length(a12)) || !close(dim(d.diagonal2), length(b))) throw Error("Declared diagonal length differs from coordinates");
    area = Number(d.diagonal1) * Number(d.diagonal2) / 2;
    labels = { diagonal1: `${d.diagonal1} ${unit}`, diagonal2: `${d.diagonal2} ${unit}` };
  } else {
    if (!close(dim(d.base), sides[0])) throw Error("Declared base differs from corresponding edge");
    const segment = d.heightSegment;
    if (!segment) throw Error("Height segment required");
    const from = point2(segment.from), to = point2(segment.to), apex = vertices[shape === "triangle" ? 2 : 3];
    if (!close(length(diff(from, apex)), 0)) throw Error("Height must start at the corresponding opposite vertex");
    const altitude = diff(from, to);
    if (!close(cross2(diff(to, vertices[0]), edges[0]), 0) || !close(dot2(altitude, edges[0]), 0) || !close(dim(d.height), length(altitude))) throw Error("Marked height must meet base line perpendicularly with the declared length");
    if (shape === "trapezoid" && !close(dim(d.topBase), sides[2])) throw Error("Declared top base differs");
    area = shape === "triangle" ? Number(d.base) * Number(d.height) / 2 : shape === "trapezoid" ? (Number(d.base) + Number(d.topBase)) * Number(d.height) / 2 : Number(d.base) * Number(d.height);
    labels = { base: `${d.base} ${unit}`, height: `${d.height} ${unit}`, ...shape === "trapezoid" ? { topBase: `${d.topBase} ${unit}` } : {} };
  }
  const coordinateArea = Math.abs(vertices.reduce((s, v, i) => s + cross2(v, vertices[(i + 1) % vertices.length]), 0)) / 2;
  if (!close(area, coordinateArea)) throw Error("Formula/coordinate area disagreement");
  if (d.displayLabels !== void 0 && JSON.stringify(d.displayLabels) !== JSON.stringify(labels)) throw Error("Visual label/data mismatch");
  return { shape, vertices, labels, area, heightSegment: d.heightSegment, unit };
}
function solvePlanarArea(m) {
  if (m.query !== "area") throw Error("Unsupported coordinate query");
  const p = validatePlanarGeometry(m);
  let sum = new Rational(0);
  for (let i = 0; i < p.vertices.length; i++) {
    const a12 = p.vertices[i], b = p.vertices[(i + 1) % p.vertices.length];
    sum = sum.add(Rational.parse(a12[0]).multiply(Rational.parse(b[1])).subtract(Rational.parse(a12[1]).multiply(Rational.parse(b[0]))));
  }
  if (sum.numerator < 0n) sum = new Rational(-sum.numerator, sum.denominator);
  return sum.divide(new Rational(2)).toDisplayString();
}

// learning-review-r1/native/quality/korean.js
var last = (s) => s.trim().at(-1) ?? "";
function particle(s, pair = "\uC744/\uB97C") {
  const units = { mL: "\uBC00\uB9AC\uB9AC\uD130", L: "\uB9AC\uD130", mm: "\uBC00\uB9AC\uBBF8\uD130", cm: "\uC13C\uD2F0\uBBF8\uD130", km: "\uD0AC\uB85C\uBBF8\uD130", m: "\uBBF8\uD130", kg: "\uD0AC\uB85C\uADF8\uB7A8", g: "\uADF8\uB7A8", t: "\uD1A4" };
  const token = /([a-zA-Z]+)$/.exec(s)?.[1];
  const char = last(token && units[token] ? units[token] : s), n = char.charCodeAt(0);
  const consonant = n >= 44032 && n <= 55203 ? (n - 44032) % 28 !== 0 : "013678".includes(char);
  return pair.split("/")[consonant ? 0 : 1];
}
function polishKorean(s) {
  s = s.replace(/【[^】]*】/g, "").replace(/\((?:검토 그림|첨부 도형) 참조\)/g, "").replace(/\s+/g, " ").trim();
  s = s.replace(/(시간|권|장|명|개|원|초|분|그루|자루)(를|을|은|는|이|가|와|과)(?=\s|[.,!?]|$)/g, (all, unit, p, offset, text) => {
    if (unit === "\uCD08" && p === "\uACFC" && /\d+\s*$/.test(text.slice(0, offset)) && rangeSuffixContext(text.slice(offset + all.length))) return all;
    return unit + particle(unit, ["\uC744", "\uB97C"].includes(p) ? "\uC744/\uB97C" : ["\uC740", "\uB294"].includes(p) ? "\uC740/\uB294" : ["\uC774", "\uAC00"].includes(p) ? "\uC774/\uAC00" : "\uACFC/\uC640");
  });
  s = s.replace(/(표시|부분|그림|문항)\s+\1/g, "$1").replace(/(\d)\s*(mL|mm|cm|kg|km|L|g|m|t)\b/g, "$1 $2");
  s = s.replace(/(시간|분|초)(로|으로)/g, (a12, u) => u + (u === "\uCD08" ? "\uB85C" : "\uC73C\uB85C")).replace(/(mL|mm|cm|kg|km|L|g|m|t)(는|은|와|과|를|을)/g, (a12, u, p) => u + particle(u, ["\uB294", "\uC740"].includes(p) ? "\uC740/\uB294" : ["\uC640", "\uACFC"].includes(p) ? "\uACFC/\uC640" : "\uC744/\uB97C"));
  return s.replace(/\s*([+×÷=])\s*/g, " $1 ").replace(/\s+/g, " ").trim();
}

// learning-review-r1/native/core/math-capabilities.js
var objectives = { "natural-multiply": "\uC790\uC5F0\uC218 \uACF1\uC148", "natural-divide": "\uB450 \uC790\uB9AC \uC81C\uC218 \uB098\uB217\uC148\uC758 \uBAAB\uACFC \uB098\uBA38\uC9C0", "natural-mixed": "\uC790\uC5F0\uC218 \uD63C\uD569 \uACC4\uC0B0\uC758 \uC21C\uC11C", "fraction-add": "\uBD84\uC218 \uB367\uC148", "fraction-subtract": "\uBD84\uC218 \uBE84\uC148", "fraction-multiply": "\uBD84\uC218 \uACF1\uC148", "fraction-divide": "\uBD84\uC218 \uB098\uB217\uC148", "natural-fraction-quotient": "\uC790\uC5F0\uC218 \uB098\uB217\uC148\uC758 \uBAAB\uC744 \uBD84\uC218\uB85C \uB098\uD0C0\uB0B4\uAE30", "natural-decimal-quotient": "\uC790\uC5F0\uC218 \uB098\uB217\uC148\uC758 \uBAAB\uC744 \uC18C\uC218\uB85C \uB098\uD0C0\uB0B4\uAE30", "decimal-add": "\uC18C\uC218 \uB367\uC148", "decimal-subtract": "\uC18C\uC218 \uBE84\uC148", "decimal-multiply": "\uC18C\uC218 \uACF1\uC148", "decimal-divide": "\uC18C\uC218 \uB098\uB217\uC148", "large-place-value": "\uD070 \uC218\uC758 \uC790\uB9BF\uAC12", "large-compare": "\uD070 \uC218\uC758 \uD06C\uAE30 \uBE44\uAD50", "divisor-count": "\uC591\uC758 \uC57D\uC218 \uCC3E\uAE30", "gcd": "\uCD5C\uB300\uACF5\uC57D\uC218", "lcm": "\uCD5C\uC18C\uACF5\uBC30\uC218", "is-divisor": "\uC57D\uC218 \uAD00\uACC4 \uD655\uC778", "area-unit-conversion": "\uB113\uC774 \uB2E8\uC704 \uAD00\uACC4", "volume-unit-conversion": "\uBD80\uD53C \uB2E8\uC704 \uAD00\uACC4", "planar-rectangle": "\uC9C1\uC0AC\uAC01\uD615 \uB113\uC774", "planar-square": "\uC815\uC0AC\uAC01\uD615 \uB113\uC774", "planar-triangle": "\uC0BC\uAC01\uD615 \uBC11\uBCC0\uACFC \uC218\uC9C1\uC778 \uB192\uC774 \uBC0F \uB113\uC774", "planar-parallelogram": "\uD3C9\uD589\uC0AC\uBCC0\uD615 \uBC11\uBCC0\uACFC \uB192\uC774 \uBC0F \uB113\uC774", "planar-trapezoid": "\uC0AC\uB2E4\uB9AC\uAF34 \uD3C9\uD589\uD55C \uBC11\uBCC0\uACFC \uB192\uC774 \uBC0F \uB113\uC774", "planar-rhombus": "\uB9C8\uB984\uBAA8 \uB300\uAC01\uC120\uACFC \uB113\uC774", "ratio-rate": "\uBE44\uAD50\uB7C9\uACFC \uAE30\uC900\uB7C9\uC758 \uBE44\uC728", "ratio-percentage": "\uBE44\uC728\uACFC \uBC31\uBD84\uC728", "ratio-proportion": "\uBE44\uB840\uC2DD\uC758 \uBBF8\uC9C0\uC218", "ratio-allocation": "\uBE44\uB840\uBC30\uBD84", "graph-bar": "\uB9C9\uB300\uADF8\uB798\uD504 \uC790\uB8CC \uD574\uC11D", "graph-line": "\uAEBE\uC740\uC120\uADF8\uB798\uD504 \uBCC0\uD654\uB7C9 \uD574\uC11D", "graph-band": "\uB760\uADF8\uB798\uD504 \uBC31\uBD84\uC728 \uD574\uC11D", "graph-pie": "\uC6D0\uADF8\uB798\uD504 \uBC31\uBD84\uC728 \uD574\uC11D", "data-mean": "\uC790\uB8CC\uC758 \uD3C9\uADE0" };
var contract = (id, grades, standards, limitations = "") => ({ id, learningObjective: objectives[id] ?? id, grades, standards, limitations: limitations || "Registered numeric/fraction response; numeric MC error models require separate registration" });
var mathCapabilityContracts = [
  contract("natural-multiply", [4], ["4\uC21801-04"]),
  contract("natural-divide", [4], ["4\uC21801-07"]),
  contract("natural-mixed", [5], ["6\uC21801-01"]),
  contract("fraction-add", [4, 5], ["4\uC21801-15", "6\uC21801-08"]),
  contract("fraction-subtract", [4, 5], ["4\uC21801-15", "6\uC21801-08"]),
  contract("fraction-multiply", [5], ["6\uC21801-09"]),
  contract("fraction-divide", [6], ["6\uC21801-11"]),
  contract("decimal-add", [4], ["4\uC21801-16"]),
  contract("decimal-subtract", [4], ["4\uC21801-16"]),
  contract("decimal-multiply", [5], ["6\uC21801-13"]),
  contract("decimal-divide", [6], ["6\uC21801-15"], "Terminating decimal only; rounding/repeating results are not registered"),
  contract("natural-fraction-quotient", [6], ["6\uC21801-10"]),
  contract("natural-decimal-quotient", [6], ["6\uC21801-14"], "Terminating decimal only"),
  contract("large-place-value", [4], ["4\uC21801-01"]),
  contract("large-compare", [4], ["4\uC21801-02"]),
  contract("divisor-count", [5], ["6\uC21801-04"]),
  contract("gcd", [5], ["6\uC21801-04"]),
  contract("lcm", [5], ["6\uC21801-05"]),
  contract("is-divisor", [5], ["6\uC21801-04"]),
  contract("area-unit-conversion", [5], ["6\uC21803-12"], "Integer response only; avoids incidental advanced decimal display"),
  contract("volume-unit-conversion", [6], ["6\uC21803-18"], "Integer response only; avoids incidental precision"),
  ...["rectangle", "square"].map((shape) => contract("planar-" + shape, [5], ["6\uC21803-13"], "Semester1 natural-number dimensions; checked coordinates/height")),
  ...["triangle", "parallelogram", "trapezoid", "rhombus"].map((shape) => contract("planar-" + shape, [5], ["6\uC21803-14"], "Semester1 natural-number dimensions; checked coordinates/height")),
  contract("ratio-rate", [6], ["6\uC21802-03"]),
  contract("ratio-percentage", [6], ["6\uC21802-03"]),
  contract("ratio-proportion", [6], ["6\uC21802-04"]),
  contract("ratio-allocation", [6], ["6\uC21802-05"], "Quantity result must have source unit; fractional dimensional input response not registered"),
  contract("graph-bar", [4], ["4\uC21804-01", "4\uC21804-03"]),
  contract("graph-line", [4], ["4\uC21804-02", "4\uC21804-03"]),
  contract("graph-band", [6], ["6\uC21804-02", "6\uC21804-03"], "Integer percentages, <=6 categories"),
  contract("graph-pie", [6], ["6\uC21804-02", "6\uC21804-03"], "Integer percentages, <=6 categories"),
  contract("data-mean", [5], ["6\uC21804-01"])
];

// learning-review-r1/native/core/math-operating-scope.js
var upperMathOperatingScope = [
  {
    "grade": 4,
    "semester": 1,
    "unitId": "sem1_unit1",
    "title": "\uD070 \uC218\uC640 \uC790\uB9BF\uAC12",
    "learningElements": "\uB9CC \uC774\uC0C1\uC758 \uC77D\uAE30\xB7\uC4F0\uAE30\xB7\uBE44\uAD50",
    "achievementStandard": [
      "4\uC21801-01",
      "4\uC21801-02"
    ],
    "bankScope": "\uB9CC \uC774\uC0C1\uC758 \uC77D\uAE30\xB7\uC4F0\uAE30\xB7\uBE44\uAD50",
    "excludedConcepts": "\uD070 \uC218 \uB367\uC148\uC744 \uC774 \uB2E8\uC6D0\uC758 \uD575\uC2EC\uC73C\uB85C \uCDE8\uAE09\uD558\uC9C0 \uC54A\uC74C"
  },
  {
    "grade": 4,
    "semester": 1,
    "unitId": "sem1_unit2",
    "title": "\uAC01\uB3C4\uC640 \uB0B4\uAC01\uC758 \uD569",
    "learningElements": "\uC608\uAC01\xB7\uB454\uAC01, \uCE21\uC815, \uC0BC\uAC01\uD615\xB7\uC0AC\uAC01\uD615 \uB0B4\uAC01 \uD569",
    "achievementStandard": [
      "4\uC21803-02",
      "4\uC21803-24",
      "4\uC21803-25"
    ],
    "bankScope": "\uC608\uAC01\xB7\uB454\uAC01, \uCE21\uC815, \uC0BC\uAC01\uD615\xB7\uC0AC\uAC01\uD615 \uB0B4\uAC01 \uD569",
    "excludedConcepts": "n\uAC01\uD615 \uB0B4\uAC01 \uD569 \uC77C\uBC18\uC2DD \uC81C\uC678"
  },
  {
    "grade": 4,
    "semester": 1,
    "unitId": "sem1_unit3",
    "title": "\uACF1\uC148\uACFC \uB450 \uC790\uB9AC \uC81C\uC218 \uB098\uB217\uC148",
    "learningElements": "\uC790\uC5F0\uC218 \uACC4\uC0B0\xB7\uB098\uBA38\uC9C0\xB7\uC5B4\uB9BC",
    "achievementStandard": [
      "4\uC21801-04",
      "4\uC21801-07",
      "4\uC21801-08"
    ],
    "bankScope": "\uC790\uC5F0\uC218 \uACC4\uC0B0\xB7\uB098\uBA38\uC9C0\xB7\uC5B4\uB9BC",
    "excludedConcepts": "\uBB38\uC790\uBC29\uC815\uC2DD\xB7\uC18C\uC218 \uB098\uB217\uC148 \uC81C\uC678"
  },
  {
    "grade": 4,
    "semester": 1,
    "unitId": "sem1_unit4",
    "title": "\uB3C4\uD615 \uC774\uB3D9\uACFC \uC810\uC758 \uC704\uCE58",
    "learningElements": "\uBC00\uAE30\xB7\uB4A4\uC9D1\uAE30\xB7\uB3CC\uB9AC\uAE30, \uC704\uCE58\xB7\uBC29\uD5A5 \uC124\uBA85",
    "achievementStandard": [
      "4\uC21803-04",
      "4\uC21803-05"
    ],
    "bankScope": "\uBC00\uAE30\xB7\uB4A4\uC9D1\uAE30\xB7\uB3CC\uB9AC\uAE30, \uC704\uCE58\xB7\uBC29\uD5A5 \uC124\uBA85",
    "excludedConcepts": "\uC88C\uD45C\xB7\uC74C\uC218\xB7\uBCC0\uD658\uD589\uB82C \uC81C\uC678"
  },
  {
    "grade": 4,
    "semester": 1,
    "unitId": "sem1_unit5",
    "title": "\uB9C9\uB300\uADF8\uB798\uD504\uC640 \uD0D0\uAD6C",
    "learningElements": "\uC218\uC9D1\xB7\uC815\uB9AC\xB7\uB9C9\uB300\uADF8\uB798\uD504 \uD574\uC11D",
    "achievementStandard": [
      "4\uC21804-01",
      "4\uC21804-03"
    ],
    "bankScope": "\uC218\uC9D1\xB7\uC815\uB9AC\xB7\uB9C9\uB300\uADF8\uB798\uD504 \uD574\uC11D",
    "excludedConcepts": "\uD3C9\uADE0\xB7\uBE44\uC728 \uACC4\uC0B0 \uC81C\uC678"
  },
  {
    "grade": 4,
    "semester": 1,
    "unitId": "sem1_unit6",
    "title": "\uBCC0\uD654 \uADDC\uCE59\uACFC \uB4F1\uD638",
    "learningElements": "\uBCC0\uD654 \uADDC\uCE59, \uBC30\uC5F4, \uB450 \uC591\uC758 \uB3D9\uCE58",
    "achievementStandard": [
      "4\uC21802-01",
      "4\uC21802-02",
      "4\uC21802-03"
    ],
    "bankScope": "\uBCC0\uD654 \uADDC\uCE59, \uBC30\uC5F4, \uB450 \uC591\uC758 \uB3D9\uCE58",
    "excludedConcepts": "\u25A1\xB7\u25B3 \uB300\uC751 \uAD00\uACC4 \uC77C\uBC18\uD654\uB294 5\uD559\uB144 \uC6B4\uC601 \uBC94\uC704"
  },
  {
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit1",
    "title": "\uB3D9\uBD84\uBAA8 \uBD84\uC218 \uB367\uC148\xB7\uBE84\uC148",
    "learningElements": "\uC9C4\uBD84\uC218\xB7\uB300\uBD84\uC218, \uB3D9\uC77C \uBD84\uBAA8 \uD569\xB7\uCC28",
    "achievementStandard": [
      "4\uC21801-10",
      "4\uC21801-11",
      "4\uC21801-15"
    ],
    "bankScope": "\uC9C4\uBD84\uC218\xB7\uB300\uBD84\uC218, \uB3D9\uC77C \uBD84\uBAA8 \uD569\xB7\uCC28",
    "excludedConcepts": "\uD1B5\uBD84\xB7\uC774\uBD84\uBAA8 \uC5F0\uC0B0 \uC81C\uC678"
  },
  {
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit2",
    "title": "\uC0BC\uAC01\uD615\uC758 \uBD84\uB958\uC640 \uC131\uC9C8",
    "learningElements": "\uBCC0\xB7\uAC01\uC5D0 \uB530\uB978 \uBD84\uB958\uC640 \uC131\uC9C8",
    "achievementStandard": [
      "4\uC21803-08",
      "4\uC21803-09",
      "4\uC21803-25"
    ],
    "bankScope": "\uBCC0\xB7\uAC01\uC5D0 \uB530\uB978 \uBD84\uB958\uC640 \uC131\uC9C8",
    "excludedConcepts": "\uB458\uB808\uB97C \uC2E0\uADDC \uD3C9\uAC00\uD558\uB294 \uBB38\uD56D\uC740 5\uD559\uB144 \uC774\uB3D9 \uAC80\uD1A0"
  },
  {
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit3",
    "title": "\uC18C\uC218\uC758 \uC758\uBBF8\uC640 \uB367\uC148\xB7\uBE84\uC148",
    "learningElements": "\uC138 \uC790\uB9AC\uAE4C\uC9C0 \uC758\uBBF8\xB7\uBE44\uAD50, \uB450 \uC790\uB9AC \uBC94\uC704 \uD569\xB7\uCC28",
    "achievementStandard": [
      "4\uC21801-13",
      "4\uC21801-14",
      "4\uC21801-16"
    ],
    "bankScope": "\uC138 \uC790\uB9AC\uAE4C\uC9C0 \uC758\uBBF8\xB7\uBE44\uAD50, \uB450 \uC790\uB9AC \uBC94\uC704 \uD569\xB7\uCC28",
    "excludedConcepts": "\uC18C\uC218 \uC14B\uC9F8 \uC790\uB9AC \uD569\xB7\uCC28 \uC81C\uC678"
  },
  {
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit4",
    "title": "\uC218\uC9C1\xB7\uD3C9\uD589\uACFC \uC0AC\uAC01\uD615",
    "learningElements": "\uC0AC\uAC01\uD615 \uBD84\uB958\xB7\uC131\uC9C8, \uC218\uC9C1\xB7\uD3C9\uD589",
    "achievementStandard": [
      "4\uC21803-03",
      "4\uC21803-10",
      "4\uC21803-25"
    ],
    "bankScope": "\uC0AC\uAC01\uD615 \uBD84\uB958\xB7\uC131\uC9C8, \uC218\uC9C1\xB7\uD3C9\uD589",
    "excludedConcepts": "\uD3C9\uD589\uC120 \uB3D9\uC704\uAC01\xB7\uC5C7\uAC01 \uC815\uB9AC \uBC0F \uB458\uB808 \uACF5\uC2DD \uC81C\uC678"
  },
  {
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit5",
    "title": "\uAEBE\uC740\uC120\uADF8\uB798\uD504\uC640 \uD0D0\uAD6C",
    "learningElements": "\uC2DC\uAC04\uC5D0 \uB530\uB978 \uBCC0\uD654\uC640 \uADF8\uB798\uD504 \uC120\uD0DD",
    "achievementStandard": [
      "4\uC21804-02",
      "4\uC21804-03"
    ],
    "bankScope": "\uC2DC\uAC04\uC5D0 \uB530\uB978 \uBCC0\uD654\uC640 \uADF8\uB798\uD504 \uC120\uD0DD",
    "excludedConcepts": "\uD3C9\uADE0\xB7\uAE30\uC6B8\uAE30 \uACF5\uC2DD \uC81C\uC678"
  },
  {
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit6",
    "title": "\uB2E4\uAC01\uD615\uACFC \uB3C4\uD615 \uAD6C\uC131",
    "learningElements": "\uB2E4\uAC01\uD615\xB7\uC815\uB2E4\uAC01\uD615, \uB9CC\uB4E4\uAE30\xB7\uCC44\uC6B0\uAE30",
    "achievementStandard": [
      "4\uC21803-11",
      "4\uC21803-12"
    ],
    "bankScope": "\uB2E4\uAC01\uD615\xB7\uC815\uB2E4\uAC01\uD615, \uB9CC\uB4E4\uAE30\xB7\uCC44\uC6B0\uAE30",
    "excludedConcepts": "n\uAC01\uD615 \uB0B4\uAC01 \uD569\xB7\uB300\uAC01\uC120 \uAC1C\uC218 \uACF5\uC2DD \uC81C\uC678"
  },
  {
    "grade": 5,
    "semester": 1,
    "unitId": "sem1_unit1",
    "title": "\uC790\uC5F0\uC218 \uD63C\uD569 \uACC4\uC0B0",
    "learningElements": "\uAD04\uD638\uC640 \uC5F0\uC0B0 \uC21C\uC11C",
    "achievementStandard": [
      "6\uC21801-01"
    ],
    "bankScope": "\uAD04\uD638\uC640 \uC5F0\uC0B0 \uC21C\uC11C",
    "excludedConcepts": "\uBB38\uC790\uC2DD\xB7\uC74C\uC218 \uC81C\uC678"
  },
  {
    "grade": 5,
    "semester": 1,
    "unitId": "sem1_unit2",
    "title": "\uC57D\uC218\uC640 \uBC30\uC218",
    "learningElements": "\uC57D\uC218\xB7\uBC30\uC218\xB7\uCD5C\uB300\uACF5\uC57D\uC218\xB7\uCD5C\uC18C\uACF5\uBC30\uC218",
    "achievementStandard": [
      "6\uC21801-04",
      "6\uC21801-05"
    ],
    "bankScope": "\uC57D\uC218\xB7\uBC30\uC218\xB7\uCD5C\uB300\uACF5\uC57D\uC218\xB7\uCD5C\uC18C\uACF5\uBC30\uC218",
    "excludedConcepts": "\uC18C\uC778\uC218\uBD84\uD574 \uACF5\uC2DD \uC81C\uC678"
  },
  {
    "grade": 5,
    "semester": 1,
    "unitId": "sem1_unit3",
    "title": "\uB450 \uC591\uC758 \uB300\uC751 \uAD00\uACC4",
    "learningElements": "\uD45C\xB7\uADDC\uCE59\xB7\u25A1\xB7\u25B3 \uC2DD",
    "achievementStandard": [
      "6\uC21802-01"
    ],
    "bankScope": "\uD45C\xB7\uADDC\uCE59\xB7\u25A1\xB7\u25B3 \uC2DD",
    "excludedConcepts": "\uD568\uC218\xB7\uC88C\uD45C\uC2DD \uC81C\uC678"
  },
  {
    "grade": 5,
    "semester": 1,
    "unitId": "sem1_unit4",
    "title": "\uC57D\uBD84\xB7\uD1B5\uBD84\uACFC \uBD84\uC218 \uBE44\uAD50",
    "learningElements": "\uB3D9\uCE58 \uBD84\uC218, \uC774\uBD84\uBAA8 \uBE44\uAD50\xB7\uC18C\uC218 \uC5F0\uACB0",
    "achievementStandard": [
      "6\uC21801-06",
      "6\uC21801-07",
      "6\uC21801-12"
    ],
    "bankScope": "\uB3D9\uCE58 \uBD84\uC218, \uC774\uBD84\uBAA8 \uBE44\uAD50\xB7\uC18C\uC218 \uC5F0\uACB0",
    "excludedConcepts": "\uBD84\uC218 \uB098\uB217\uC148 \uC81C\uC678"
  },
  {
    "grade": 5,
    "semester": 1,
    "unitId": "sem1_unit5",
    "title": "\uC774\uBD84\uBAA8 \uBD84\uC218 \uB367\uC148\xB7\uBE84\uC148",
    "learningElements": "\uD1B5\uBD84 \uAE30\uBC18 \uD569\xB7\uCC28",
    "achievementStandard": [
      "6\uC21801-08"
    ],
    "bankScope": "\uD1B5\uBD84 \uAE30\uBC18 \uD569\xB7\uCC28",
    "excludedConcepts": "\uBD84\uC218 \uB098\uB217\uC148 \uC81C\uC678"
  },
  {
    "grade": 5,
    "semester": 1,
    "unitId": "sem1_unit6",
    "title": "\uD3C9\uBA74\uB3C4\uD615 \uB458\uB808\uC640 \uB113\uC774",
    "learningElements": "\uB458\uB808, cm\xB2\xB7m\xB2\xB7km\xB2, \uC5EC\uB7EC \uB3C4\uD615 \uB113\uC774",
    "achievementStandard": [
      "6\uC21803-11",
      "6\uC21803-12",
      "6\uC21803-13",
      "6\uC21803-14"
    ],
    "bankScope": "\uB458\uB808, cm\xB2\xB7m\xB2\xB7km\xB2, \uC5EC\uB7EC \uB3C4\uD615 \uB113\uC774",
    "excludedConcepts": "\uC6D0 \uB113\uC774\xB7\uC785\uCCB4 \uBD80\uD53C \uC81C\uC678"
  },
  {
    "grade": 5,
    "semester": 2,
    "unitId": "sem2_unit1",
    "title": "\uC218\uC758 \uBC94\uC704\uC640 \uC5B4\uB9BC",
    "learningElements": "\uC774\uC0C1\xB7\uC774\uD558\xB7\uCD08\uACFC\xB7\uBBF8\uB9CC, \uC62C\uB9BC\xB7\uBC84\uB9BC\xB7\uBC18\uC62C\uB9BC",
    "achievementStandard": [
      "6\uC21801-02",
      "6\uC21801-03"
    ],
    "bankScope": "\uC774\uC0C1\xB7\uC774\uD558\xB7\uCD08\uACFC\xB7\uBBF8\uB9CC, \uC62C\uB9BC\xB7\uBC84\uB9BC\xB7\uBC18\uC62C\uB9BC",
    "excludedConcepts": "\uBD80\uB4F1\uC2DD \uD480\uC774 \uC81C\uC678"
  },
  {
    "grade": 5,
    "semester": 2,
    "unitId": "sem2_unit2",
    "title": "\uBD84\uC218 \uACF1\uC148",
    "learningElements": "\uBD84\uC218\xD7\uC790\uC5F0\uC218, \uBD84\uC218\xD7\uBD84\uC218",
    "achievementStandard": [
      "6\uC21801-09"
    ],
    "bankScope": "\uBD84\uC218\xD7\uC790\uC5F0\uC218, \uBD84\uC218\xD7\uBD84\uC218",
    "excludedConcepts": "\uC5ED\uC218 \uAE30\uBC18 \uB098\uB217\uC148 \uC81C\uC678"
  },
  {
    "grade": 5,
    "semester": 2,
    "unitId": "sem2_unit3",
    "title": "\uD569\uB3D9\uACFC \uB300\uCE6D",
    "learningElements": "\uD569\uB3D9, \uC120\uB300\uCE6D\xB7\uC810\uB300\uCE6D",
    "achievementStandard": [
      "6\uC21803-01",
      "6\uC21803-02"
    ],
    "bankScope": "\uD569\uB3D9, \uC120\uB300\uCE6D\xB7\uC810\uB300\uCE6D",
    "excludedConcepts": "\uC99D\uBA85\xB7\uD569\uB3D9\uC870\uAC74 \uACF5\uC2DD \uC81C\uC678"
  },
  {
    "grade": 5,
    "semester": 2,
    "unitId": "sem2_unit4",
    "title": "\uC18C\uC218 \uACF1\uC148",
    "learningElements": "\uC18C\uC218\xD7\uC790\uC5F0\uC218\xB7\uC18C\uC218",
    "achievementStandard": [
      "6\uC21801-13"
    ],
    "bankScope": "\uC18C\uC218\xD7\uC790\uC5F0\uC218\xB7\uC18C\uC218",
    "excludedConcepts": "\uC18C\uC218 \uB098\uB217\uC148 \uC81C\uC678"
  },
  {
    "grade": 5,
    "semester": 2,
    "unitId": "sem2_unit5",
    "title": "\uC9C1\uC721\uBA74\uCCB4\uC640 \uC815\uC721\uBA74\uCCB4",
    "learningElements": "\uAD6C\uC131 \uC694\uC18C\xB7\uC131\uC9C8\xB7\uACA8\uB0E5\uB3C4\xB7\uC804\uAC1C\uB3C4",
    "achievementStandard": [
      "6\uC21803-03",
      "6\uC21803-04"
    ],
    "bankScope": "\uAD6C\uC131 \uC694\uC18C\xB7\uC131\uC9C8\xB7\uACA8\uB0E5\uB3C4\xB7\uC804\uAC1C\uB3C4",
    "excludedConcepts": "\uAC89\uB113\uC774\xB7\uBD80\uD53C\uB294 6\uD559\uB144 \uC6B4\uC601 \uBC94\uC704"
  },
  {
    "grade": 5,
    "semester": 2,
    "unitId": "sem2_unit6",
    "title": "\uD3C9\uADE0\uACFC \uAC00\uB2A5\uC131",
    "learningElements": "\uD3C9\uADE0\xB7\uAC00\uB2A5\uC131 \uB9D0\uACFC \uC218\xB7\uD310\uB2E8",
    "achievementStandard": [
      "6\uC21804-01",
      "6\uC21804-04",
      "6\uC21804-05",
      "6\uC21804-06"
    ],
    "bankScope": "\uD3C9\uADE0\xB7\uAC00\uB2A5\uC131 \uB9D0\uACFC \uC218\xB7\uD310\uB2E8",
    "excludedConcepts": "\uACBD\uC6B0\uC758 \uC218 \uC870\uD569\xB7\uD655\uB960 \uACF5\uC2DD \uC81C\uC678"
  },
  {
    "grade": 6,
    "semester": 1,
    "unitId": "sem1_unit1",
    "title": "\uBD84\uC218 \uB098\uB217\uC148\uC758 \uB3C4\uC785",
    "learningElements": "\uC790\uC5F0\uC218 \uBAAB\uC758 \uBD84\uC218 \uD45C\uD604, \uBD84\uC218\xF7\uC790\uC5F0\uC218",
    "achievementStandard": [
      "6\uC21801-10",
      "6\uC21801-11"
    ],
    "bankScope": "\uC790\uC5F0\uC218 \uBAAB\uC758 \uBD84\uC218 \uD45C\uD604, \uBD84\uC218\xF7\uC790\uC5F0\uC218",
    "excludedConcepts": "\uC74C\uC218\xB7\uBCF5\uC7A1\uD55C \uD63C\uD569\uC5F0\uC0B0 \uC81C\uC678"
  },
  {
    "grade": 6,
    "semester": 1,
    "unitId": "sem1_unit2",
    "title": "\uAC01\uAE30\uB465\uACFC \uAC01\uBFD4",
    "learningElements": "\uAD6C\uC131 \uC694\uC18C\xB7\uC131\uC9C8\xB7\uAC01\uAE30\uB465 \uC804\uAC1C\uB3C4",
    "achievementStandard": [
      "6\uC21803-05",
      "6\uC21803-06"
    ],
    "bankScope": "\uAD6C\uC131 \uC694\uC18C\xB7\uC131\uC9C8\xB7\uAC01\uAE30\uB465 \uC804\uAC1C\uB3C4",
    "excludedConcepts": "\uAC01\uBFD4 \uBD80\uD53C \uACF5\uC2DD \uC81C\uC678"
  },
  {
    "grade": 6,
    "semester": 1,
    "unitId": "sem1_unit3",
    "title": "\uC18C\uC218 \uB098\uB217\uC148\uC758 \uB3C4\uC785",
    "learningElements": "\uC790\uC5F0\uC218 \uBAAB\uC758 \uC18C\uC218 \uD45C\uD604, \uC18C\uC218\xF7\uC790\uC5F0\uC218",
    "achievementStandard": [
      "6\uC21801-14",
      "6\uC21801-15"
    ],
    "bankScope": "\uC790\uC5F0\uC218 \uBAAB\uC758 \uC18C\uC218 \uD45C\uD604, \uC18C\uC218\xF7\uC790\uC5F0\uC218",
    "excludedConcepts": "\uC21C\uD658\uC18C\uC218 \uAC1C\uB150 \uC81C\uC678"
  },
  {
    "grade": 6,
    "semester": 1,
    "unitId": "sem1_unit4",
    "title": "\uBE44\uC640 \uBE44\uC728",
    "learningElements": "\uBE44\xB7\uBD84\uC218\xB7\uC18C\uC218\xB7\uBC31\uBD84\uC728 \uC5F0\uACB0",
    "achievementStandard": [
      "6\uC21802-02",
      "6\uC21802-03"
    ],
    "bankScope": "\uBE44\xB7\uBD84\uC218\xB7\uC18C\uC218\xB7\uBC31\uBD84\uC728 \uC5F0\uACB0",
    "excludedConcepts": "\uC815\uBE44\uB840\xB7\uBC18\uBE44\uB840 \uD568\uC218 \uC81C\uC678"
  },
  {
    "grade": 6,
    "semester": 1,
    "unitId": "sem1_unit5",
    "title": "\uB760\xB7\uC6D0\uADF8\uB798\uD504\uC640 \uD0D0\uAD6C",
    "learningElements": "\uC218\uC9D1\xB7\uC815\uB9AC\xB7\uC801\uC808\uD55C \uADF8\uB798\uD504 \uC120\uD0DD",
    "achievementStandard": [
      "6\uC21804-02",
      "6\uC21804-03"
    ],
    "bankScope": "\uC218\uC9D1\xB7\uC815\uB9AC\xB7\uC801\uC808\uD55C \uADF8\uB798\uD504 \uC120\uD0DD",
    "excludedConcepts": "\uBD84\uC0B0\xB7\uD45C\uC900\uD3B8\uCC28 \uC81C\uC678"
  },
  {
    "grade": 6,
    "semester": 1,
    "unitId": "sem1_unit6",
    "title": "\uC9C1\uC721\uBA74\uCCB4 \uAC89\uB113\uC774\uC640 \uBD80\uD53C",
    "learningElements": "\uAC89\uB113\uC774\xB7cm\xB3\xB7m\xB3\xB7\uBD80\uD53C",
    "achievementStandard": [
      "6\uC21803-17",
      "6\uC21803-18",
      "6\uC21803-19"
    ],
    "bankScope": "\uAC89\uB113\uC774\xB7cm\xB3\xB7m\xB3\xB7\uBD80\uD53C",
    "excludedConcepts": "\uC6D0\uAE30\uB465\xB7\uC6D0\uBFD4 \uBD80\uD53C \uACF5\uC2DD \uC81C\uC678"
  },
  {
    "grade": 6,
    "semester": 2,
    "unitId": "sem2_unit1",
    "title": "\uBD84\uC218 \uB098\uB217\uC148\uC758 \uD655\uC7A5",
    "learningElements": "\uC790\uC5F0\uC218\xF7\uBD84\uC218, \uBD84\uC218\xF7\uBD84\uC218",
    "achievementStandard": [
      "6\uC21801-11"
    ],
    "bankScope": "\uC790\uC5F0\uC218\xF7\uBD84\uC218, \uBD84\uC218\xF7\uBD84\uC218",
    "excludedConcepts": "\uB300\uC218\uC801 \uC5ED\uC218 \uC99D\uBA85 \uC81C\uC678"
  },
  {
    "grade": 6,
    "semester": 2,
    "unitId": "sem2_unit2",
    "title": "\uC18C\uC218 \uB098\uB217\uC148\uC758 \uD655\uC7A5",
    "learningElements": "\uC790\uC5F0\uC218\xB7\uC18C\uC218\xF7\uC18C\uC218",
    "achievementStandard": [
      "6\uC21801-15"
    ],
    "bankScope": "\uC790\uC5F0\uC218\xB7\uC18C\uC218\xF7\uC18C\uC218",
    "excludedConcepts": "\uC21C\uD658\uC18C\uC218\xB7\uC720\uD6A8\uC22B\uC790 \uC81C\uC678"
  },
  {
    "grade": 6,
    "semester": 2,
    "unitId": "sem2_unit3",
    "title": "\uACF5\uAC04\uACFC \uC785\uCCB4 \uAD00\uCC30",
    "learningElements": "\uC313\uAE30\uB098\uBB34 \uC218, \uC704\xB7\uC55E\xB7\uC606 \uBAA8\uC591",
    "achievementStandard": [
      "6\uC21803-09",
      "6\uC21803-10"
    ],
    "bankScope": "\uC313\uAE30\uB098\uBB34 \uC218, \uC704\xB7\uC55E\xB7\uC606 \uBAA8\uC591",
    "excludedConcepts": "\uC88C\uD45C\uACF5\uAC04\xB7\uD22C\uC601\uD589\uB82C \uC81C\uC678"
  },
  {
    "grade": 6,
    "semester": 2,
    "unitId": "sem2_unit4",
    "title": "\uBE44\uB840\uC2DD\uACFC \uBE44\uB840\uBC30\uBD84",
    "learningElements": "\uAC04\uB2E8\uD55C \uBE44\uB840\uC2DD\xB7\uC8FC\uC5B4\uC9C4 \uC591 \uBC30\uBD84",
    "achievementStandard": [
      "6\uC21802-04",
      "6\uC21802-05"
    ],
    "bankScope": "\uAC04\uB2E8\uD55C \uBE44\uB840\uC2DD\xB7\uC8FC\uC5B4\uC9C4 \uC591 \uBC30\uBD84",
    "excludedConcepts": "\uC5F0\uB9BD\uBC29\uC815\uC2DD\xB7\uD568\uC218 \uC81C\uC678"
  },
  {
    "grade": 6,
    "semester": 2,
    "unitId": "sem2_unit5",
    "title": "\uC6D0\uC8FC\uC728\xB7\uC6D0\uC8FC\xB7\uC6D0 \uB113\uC774",
    "learningElements": "\uCE21\uC815 \uAE30\uBC18 \uC6D0\uC8FC\uC728, \uC6D0\uC8FC\xB7\uB113\uC774",
    "achievementStandard": [
      "6\uC21803-15",
      "6\uC21803-16"
    ],
    "bankScope": "\uCE21\uC815 \uAE30\uBC18 \uC6D0\uC8FC\uC728, \uC6D0\uC8FC\xB7\uB113\uC774",
    "excludedConcepts": "\uBD80\uCC44\uAF34 \uB113\uC774 \uACF5\uC2DD \uC81C\uC678"
  },
  {
    "grade": 6,
    "semester": 2,
    "unitId": "sem2_unit6",
    "title": "\uC6D0\uAE30\uB465\xB7\uC6D0\uBFD4\xB7\uAD6C",
    "learningElements": "\uAD6C\uC131 \uC694\uC18C\xB7\uC131\uC9C8\xB7\uC6D0\uAE30\uB465 \uC804\uAC1C\uB3C4",
    "achievementStandard": [
      "6\uC21803-07",
      "6\uC21803-08"
    ],
    "bankScope": "\uAD6C\uC131 \uC694\uC18C\xB7\uC131\uC9C8\xB7\uC6D0\uAE30\uB465 \uC804\uAC1C\uB3C4",
    "excludedConcepts": "\uAD6C \uD45C\uBA74\uC801\xB7\uC6D0\uBFD4 \uBD80\uD53C \uC81C\uC678"
  }
];

// learning-review-r1/native/data/upper-task-registry.js
var upperAuthored = [];
function A(g, s, u, id, code, l, o, f2, domain = 24) {
  upperAuthored.push({ id: `G${g}-S${s}U${u}-${id}`, grade: g, semester: s, unitId: `sem${s}_unit${u}`, code, difficulty: l, objective: o, domain, make: f2 });
}

// learning-review-r1/native/data/upper-authored.js
function M(question, kind, query, data, explanation, unit = "", category = "concept") {
  question = polishKorean(question);
  const model = { kind, query, data, unit: kind === "foundation" && data.task === "number-theory" ? query === "divisor-count" ? "\uAC1C" : "" : unit, prompt: question, structureId: "authored-" + query, difficultyRationale: "Finite authored task; operand roles and constraints recorded", expected: "" };
  model.expected = solveMathModel(model);
  return { question, explanation: explanation.replaceAll("{answer}", model.expected), answer: model.expected, unit, model, category };
}
function E(question, tokens, explanation, unit = "", category = "word-problem") {
  return M(question, "expression", "calculate", { tokens: tokens.map(String) }, explanation, unit, category);
}
function C(question, correct, wrong, explanation) {
  return { question: polishKorean(question), answer: correct, unit: "", explanation, category: "concept", choices: [{ text: correct, reason: "" }, ...wrong.map(([text, reason]) => ({ text, reason }))] };
}
var dec = (n, d = 10) => new Rational(n, d).toDisplayString("decimal");
var f = (n, d) => `${n}/${d}`;
function T(question, query, rows2, a12, b, explanation, unit = "\uBA85") {
  return M(question, "table", query, { rows: rows2, a: a12, b, valueUnit: unit }, explanation, unit, "data-interpretation");
}

// learning-review-r1/native/data/final-expansion-grade4.js
var a = (s, u, id, code, l, o, fn, domain = 1) => A(4, s, u, "FINAL-" + id, code, l, o, fn, domain);
a(1, 1, "place-groups", "4\uC21801-01", 2, "\uD070 \uC218\uB97C \uB9CC \uB2E8\uC704 \uBB36\uC74C\uC73C\uB85C \uB098\uD0C0\uB0B4\uAE30", (k) => E(`10000\uC774 ${24 + k}\uAC1C \uBAA8\uC778 \uC218\uB97C \uC22B\uC790\uB85C \uC4F0\uC138\uC694.`, [1e4, 24 + k, "*"], "\uB9CC \uB2E8\uC704 \uBB36\uC74C \uC218\uB97C \uC790\uB9BF\uAC12\uC73C\uB85C \uB098\uD0C0\uB0B4\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "concept"), 16);
a(1, 1, "neighbor-before", "4\uC21801-02", 3, "\uB6F0\uC5B4 \uC13C \uD070 \uC218\uC758 \uC774\uC804 \uD56D \uCC3E\uAE30", (k) => E(`5\uB9CC\uC529 \uCEE4\uC9C0\uB294 \uC218 \uBC30\uC5F4\uC5D0\uC11C ${35e4 + k * 5e4} \uBC14\uB85C \uC55E\uC5D0 \uC788\uB358 \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [35e4 + k * 5e4, 5e4, "-"], "\uD55C \uBC88\uC758 \uC99D\uAC00\uB7C9\uC744 \uBE7C\uBA74 \uBC14\uB85C \uC55E\uC758 \uC218 {answer}\uC785\uB2C8\uB2E4.", "", "pattern"), 16);
a(1, 1, "read-zero-middle", "4\uC21801-01", 1, "\uD070 \uC218\uC5D0\uC11C \uBE44\uC5B4 \uC788\uB294 \uC790\uB9AC\uB97C \uC77D\uAE30", () => C("\uC0BC\uC2ED\uB9CC \uC624\uC2ED\uC744 \uC22B\uC790\uB85C \uBC14\uB974\uAC8C \uC4F4 \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "300050", [["300500", "\uC2ED\uC758 \uC790\uB9AC\uC640 \uBC31\uC758 \uC790\uB9AC \uD63C\uB3D9"], ["305000", "\uCC9C\uC758 \uC790\uB9AC\uB85C \uC62E\uAE40"], ["30005", "\uB9CC \uC790\uB9AC \uB204\uB77D"]], "30\uB9CC\uACFC 50\uC744 \uAC01 \uC790\uB9AC\uC5D0 \uB193\uC73C\uBA74 300050\uC785\uB2C8\uB2E4."));
a(1, 1, "digit-zero", "4\uC21801-01", 2, "\uAC19\uC740 \uC22B\uC790\uC758 \uC704\uCE58\uC5D0 \uB530\uB978 \uAC12 \uAD6C\uBCC4\uD558\uAE30", () => C("505000\uC5D0\uC11C \uC55E\uC758 5\uC640 \uB4A4\uC758 5\uAC00 \uB098\uD0C0\uB0B4\uB294 \uAC12\uC744 \uBC14\uB974\uAC8C \uC9DD\uC9C0\uC73C\uC138\uC694.", "500000\uACFC 5000", [["50000\uACFC 5000", "\uC2ED\uB9CC \uC790\uB9AC\uB97C \uB9CC \uC790\uB9AC\uB85C \uC624\uC778"], ["500000\uACFC 500", "\uCC9C \uC790\uB9AC\uB97C \uBC31 \uC790\uB9AC\uB85C \uC624\uC778"]], "\uC55E\uC758 5\uB294 \uC2ED\uB9CC \uC790\uB9AC, \uB4A4\uC758 5\uB294 \uCC9C \uC790\uB9AC\uC785\uB2C8\uB2E4."));
a(1, 1, "comparison-method", "4\uC21801-02", 1, "\uD070 \uC218 \uBE44\uAD50\uC5D0\uC11C \uBA3C\uC800 \uD655\uC778\uD560 \uC815\uBCF4 \uACE0\uB974\uAE30", () => C("\uB450 \uC790\uC5F0\uC218\uC758 \uC790\uB9AC \uC218\uAC00 \uB2E4\uB985\uB2C8\uB2E4. \uD070 \uC218\uB97C \uD310\uB2E8\uD558\uB294 \uCCAB \uAE30\uC900\uC744 \uACE0\uB974\uC138\uC694.", "\uC790\uB9AC \uC218\uAC00 \uB354 \uB9CE\uC740 \uC218\uAC00 \uD06C\uB2E4", [["\uC77C\uC758 \uC790\uB9AC\uB9CC \uBE44\uAD50\uD55C\uB2E4", "\uB0AE\uC740 \uC790\uB9AC\uB9CC \uC0AC\uC6A9"], ["\uC22B\uC790 9\uAC00 \uB4E4\uC5B4 \uC788\uB294 \uC218\uAC00 \uC5B8\uC81C\uB098 \uD06C\uB2E4", "\uD55C \uC22B\uC790\uB9CC \uBCF4\uACE0 \uD310\uB2E8"]], "\uB9E8 \uC55E\uC5D0 0\uC774 \uC5C6\uB294 \uC790\uC5F0\uC218\uB294 \uC790\uB9AC \uC218\uAC00 \uB354 \uB9CE\uC73C\uBA74 \uB354 \uD07D\uB2C8\uB2E4."));
a(1, 1, "million-equivalence", "4\uC21801-01", 2, "\uAC19\uC740 \uD070 \uC218\uC758 \uB2E4\uB978 \uB2E8\uC704 \uBB36\uC74C \uC5F0\uACB0\uD558\uAE30", () => E("100\uB9CC\uC740 1\uB9CC\uC774 \uBA87 \uAC1C \uBAA8\uC778 \uC218\uC785\uB2C8\uAE4C?", [1e6, 1e4, "/"], "\uAC19\uC740 \uC591\uC744 \uB9CC \uB2E8\uC704 \uBB36\uC74C\uC73C\uB85C \uC138\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C", "concept"));
a(1, 1, "zero-insertion", "4\uC21801-01", 3, "0\uC744 \uC9C0\uC6E0\uC744 \uB54C \uC790\uB9BF\uAC12 \uBCC0\uD654 \uD310\uB2E8\uD558\uAE30", () => C("70040\uC744 7040\uC774\uB77C\uACE0 \uC798\uBABB \uC801\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB978 \uC124\uBA85\uC744 \uACE0\uB974\uC138\uC694.", "7\uC758 \uC790\uB9BF\uAC12\uC774 70000\uC5D0\uC11C 7000\uC73C\uB85C \uB2EC\uB77C\uC84C\uB2E4", [["\uB450 \uC218\uC758 \uAC12\uC740 \uAC19\uB2E4", "0\uC758 \uC790\uB9AC \uD45C\uC2DC \uC5ED\uD560 \uBB34\uC2DC"], ["4\uC758 \uC790\uB9BF\uAC12\uB9CC \uBCC0\uD588\uB2E4", "\uB192\uC740 \uC790\uB9AC \uBCC0\uD654 \uB204\uB77D"]], "0\uB3C4 \uC790\uB9AC\uB97C \uC720\uC9C0\uD558\uBBC0\uB85C \uC9C0\uC6B0\uBA74 \uC55E \uC22B\uC790\uC758 \uC790\uB9BF\uAC12\uC774 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."));
a(1, 1, "bounded-order", "4\uC21801-02", 4, "\uAC19\uC740 \uBC94\uC704 \uC548\uC5D0\uC11C \uC5EC\uB7EC \uC218\uB97C \uBE44\uAD50\uD558\uAE30", () => C("450080, 450800, 458000 \uC911 451000\uBCF4\uB2E4 \uC791\uACE0 \uAC00\uC7A5 \uD070 \uC218\uB97C \uACE0\uB974\uC138\uC694.", "450800", [["458000", "\uBC94\uC704 \uC870\uAC74 \uB204\uB77D"], ["450080", "\uCD5C\uB300 \uC870\uAC74 \uB204\uB77D"]], "\uBC94\uC704 \uC548\uC758 \uB450 \uC218\uB97C \uBE44\uAD50\uD558\uBA74 450800\uC774 \uB354 \uD07D\uB2C8\uB2E4."));
a(1, 1, "digit-condition", "4\uC21801-02", 4, "\uBE44\uAD50 \uC870\uAC74\uC744 \uB9CC\uC871\uD558\uB294 \uC790\uB9AC \uC22B\uC790 \uCC3E\uAE30", () => C("73\u25A100\uC740 73400\uBCF4\uB2E4 \uD06C\uACE0 73700\uBCF4\uB2E4 \uC791\uC2B5\uB2C8\uB2E4. \u25A1\uAC00 \uB420 \uC218 \uC788\uB294 \uC22B\uC790\uB97C \uBAA8\uB450 \uACE0\uB974\uC138\uC694.", "5\uC640 6", [["4\uC640 5\uC640 6", "\uACBD\uACC4\uAC12\uC744 \uD3EC\uD568"], ["6\uACFC 7", "\uC0C1\uD55C\uC744 \uD3EC\uD568"], ["5\uB9CC \uAC00\uB2A5", "\uAC00\uB2A5\uD55C \uB2E4\uB978 \uC218 \uB204\uB77D"]], "\uC0AC\uC774\uC5D0 \uC788\uB294 \uC218\uB294 73500\uACFC 73600\uC785\uB2C8\uB2E4."));
a(1, 1, "card-largest", "4\uC21801-02", 4, "\uCE74\uB4DC \uC870\uAC74\uACFC \uD070 \uC218\uC758 \uBE44\uAD50 \uC5F0\uACB0\uD558\uAE30", () => C("0, 2, 5, 8\uC744 \uD55C \uBC88\uC529 \uC368 \uB124 \uC790\uB9AC \uC218\uB97C \uB9CC\uB4ED\uB2C8\uB2E4. \uCC9C\uC758 \uC790\uB9AC \uC22B\uC790\uAC00 5\uC77C \uB54C \uAC00\uC7A5 \uD070 \uC218\uB97C \uACE0\uB974\uC138\uC694.", "5820", [["8520", "\uCC9C\uC758 \uC790\uB9AC \uC870\uAC74 \uB204\uB77D"], ["5802", "\uB0AE\uC740 \uC790\uB9AC \uC21C\uC11C \uC624\uB958"], ["5280", "\uBC31\uC758 \uC790\uB9AC \uCD5C\uB313\uAC12 \uB204\uB77D"]], "\uCC9C\uC758 \uC790\uB9AC 5\uB97C \uACE0\uC815\uD558\uACE0 \uB0A8\uC740 \uC22B\uC790\uB97C \uD070 \uC790\uB9AC\uBD80\uD130 8, 2, 0\uC73C\uB85C \uB193\uC2B5\uB2C8\uB2E4."));
a(1, 1, "jump-two-directions", "4\uC21801-02", 3, "\uB450 \uBC29\uD5A5\uC758 \uB6F0\uC5B4 \uC138\uAE30\uB97C \uC5F0\uACB0\uD558\uAE30", () => E("280000\uC5D0\uC11C 10000\uC529 \uC138 \uBC88 \uC55E\uC73C\uB85C \uC13C \uB4A4 1000\uC529 \uB450 \uBC88 \uB4A4\uB85C \uC14C\uC2B5\uB2C8\uB2E4. \uB9C8\uC9C0\uB9C9 \uC218\uB294 \uBB34\uC5C7\uC785\uB2C8\uAE4C?", [28e4, 1e4, 3, "*", "+", 1e3, 2, "*", "-"], "\uC55E\uC73C\uB85C \uC13C \uC591\uC744 \uB354\uD558\uACE0 \uB4A4\uB85C \uC13C \uC591\uC744 \uBE7C\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "pattern"));
a(1, 1, "constrained-card-strategy", "4\uC21801-02", 5, "\uBC94\uC704\uC640 \uCE74\uB4DC \uC0AC\uC6A9 \uC870\uAC74\uC744 \uD568\uAED8 \uB9CC\uC871\uC2DC\uD0A4\uAE30", () => C("0, 3, 6, 8\uC744 \uD55C \uBC88\uC529 \uC368 \uB124 \uC790\uB9AC \uC218\uB97C \uB9CC\uB4ED\uB2C8\uB2E4. 6000\uBCF4\uB2E4 \uD06C\uACE0 6800\uBCF4\uB2E4 \uC791\uC740 \uC218 \uC911 \uAC00\uC7A5 \uD070 \uC218\uB97C \uACE0\uB974\uC138\uC694.", "6380", [["6830", "\uC0C1\uD55C \uC870\uAC74 \uC704\uBC18"], ["6308", "\uAC00\uB2A5\uD55C \uC218 \uC911 \uCD5C\uB300\uAC00 \uC544\uB2D8"], ["6083", "\uBC31\uC758 \uC790\uB9AC\uB97C \uB354 \uD06C\uAC8C \uD560 \uC218 \uC788\uC74C"]], "\uCC9C\uC758 \uC790\uB9AC\uB294 6\uC774\uACE0 \uBC31\uC758 \uC790\uB9AC\uC5D0\uB294 8\uC744 \uB193\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. 3\uC744 \uB193\uACE0 \uB0A8\uC740 8, 0\uC744 \uD070 \uC790\uB9AC\uBD80\uD130 \uB193\uC2B5\uB2C8\uB2E4."));
a(1, 2, "angle-multiple-pieces", "4\uC21803-24", 3, "\uAC19\uC740 \uD06C\uAE30 \uAC01\uC744 \uC774\uC5B4 \uB9CC\uB4E0 \uAC01 \uAD6C\uD558\uAE30", (k) => E(`\uC11C\uB85C \uACB9\uCE58\uC9C0 \uC54A\uB294 ${20 + k}\xB0\uC778 \uAC01 \uC138 \uAC1C\uB97C \uD55C \uAF2D\uC9D3\uC810\uC5D0\uC11C \uB098\uB780\uD788 \uC774\uC5C8\uC2B5\uB2C8\uB2E4. \uD569\uCE5C \uAC01\uC740 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?`, [20 + k, 3, "*"], "\uAC19\uC740 \uD06C\uAE30\uC758 \uAC01 \uC138 \uAC1C\uB97C \uB354\uD558\uBA74 {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"), 16);
a(1, 2, "angle-equal-split", "4\uC21803-24", 3, "\uC8FC\uC5B4\uC9C4 \uAC01\uC744 \uAC19\uC740 \uD06C\uAE30\uB85C \uB098\uB204\uAE30", (k) => E(`${80 + 2 * k}\xB0\uC778 \uAC01\uC744 \uAC19\uC740 \uD06C\uAE30 \uB450 \uBD80\uBD84\uC73C\uB85C \uB098\uB215\uB2C8\uB2E4. \uD55C \uBD80\uBD84\uC740 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?`, [80 + 2 * k, 2, "/"], "\uC804\uCCB4 \uAC01\uC744 \uB611\uAC19\uC774 \uB458\uB85C \uB098\uB204\uBA74 {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"), 16);
a(1, 2, "degree-unit", "4\uC21803-24", 1, "\uAC01\uB3C4 \uB2E8\uC704 \uAD6C\uBCC4\uD558\uAE30", () => C("\uAC01\uC758 \uD06C\uAE30\uB97C \uB098\uD0C0\uB0B4\uB294 \uB2E8\uC704\uB85C \uC54C\uB9DE\uC740 \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uB3C4(\xB0)", [["cm", "\uAE38\uC774\uC640 \uAC01\uB3C4 \uD63C\uB3D9"], ["cm\xB2", "\uB113\uC774\uC640 \uAC01\uB3C4 \uD63C\uB3D9"]], "\uAC01\uC758 \uD06C\uAE30\uB294 \uB3C4 \uB2E8\uC704\uB85C \uB098\uD0C0\uB0C5\uB2C8\uB2E4."));
a(1, 2, "right-angle-parts", "4\uC21803-02", 2, "\uC9C1\uAC01\uC758 \uC808\uBC18\uACFC \uC9C1\uAC01 \uBE44\uAD50\uD558\uAE30", () => C("\uC9C1\uAC01\uC744 \uAC19\uC740 \uD06C\uAE30 \uB450 \uAC01\uC73C\uB85C \uB098\uB234\uC2B5\uB2C8\uB2E4. \uD55C \uAC01\uC758 \uC885\uB958\uB97C \uACE0\uB974\uC138\uC694.", "\uC608\uAC01", [["\uC9C1\uAC01", "\uC804\uCCB4\uC640 \uBD80\uBD84 \uD63C\uB3D9"], ["\uB454\uAC01", "\uC9C1\uAC01\uBCF4\uB2E4 \uC791\uC740 \uC870\uAC74 \uBB34\uC2DC"]], "\uD55C \uBD80\uBD84\uC740 45\xB0\uB85C 90\xB0\uBCF4\uB2E4 \uC791\uC2B5\uB2C8\uB2E4."));
a(1, 2, "straight-total", "4\uC21803-24", 2, "\uC9C1\uC120 \uC704 \uB098\uB780\uD55C \uAC01\uC758 \uD569 \uC774\uD574\uD558\uAE30", () => E("\uC9C1\uC120 \uC704 \uD55C \uC810\uC5D0\uC11C \uD55C\uCABD\uC5D0 \uB098\uB780\uD788 \uBD99\uC740 \uB450 \uAC01 \uC911 \uD558\uB098\uAC00 125\xB0\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uAC01\uC740 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?", [180, 125, "-"], "\uD55C\uCABD\uC5D0\uC11C \uC9C1\uC120\uC744 \uC774\uB8E8\uB294 \uB450 \uAC01\uC758 \uD569\uC740 180\xB0\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0\uB294 {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"));
a(1, 2, "reverse-scale-reading", "4\uC21803-24", 3, "\uAC01\uB3C4\uAE30 \uC591\uCABD \uB208\uAE08\uC5D0\uC11C \uC2DC\uC791\uC810 \uD655\uC778\uD558\uAE30", () => C("\uAC01\uB3C4\uAE30\uC758 \uC67C\uCABD 0\uC5D0 \uD55C \uBCC0\uC744 \uB9DE\uCDC4\uC2B5\uB2C8\uB2E4. \uB2E4\uB978 \uBCC0\uC740 \uC67C\uCABD 0\uC5D0\uC11C \uC2DC\uC791\uD558\uB294 \uB208\uAE08 130\uACFC \uC624\uB978\uCABD 0\uC5D0\uC11C \uC2DC\uC791\uD558\uB294 \uB208\uAE08 50\uC774 \uD568\uAED8 \uC788\uB294 \uACF3\uC785\uB2C8\uB2E4. \uAC01\uC758 \uD06C\uAE30\uB97C \uACE0\uB974\uC138\uC694.", "130\xB0", [["50\xB0", "\uBC18\uB300\uCABD \uB208\uAE08\uC744 \uC77D\uC74C"], ["180\xB0", "\uAC01\uB3C4\uAE30 \uC804\uCCB4\uB97C \uC77D\uC74C"]], "\uB9DE\uCD98 0\uC5D0\uC11C \uC2DC\uC791\uD558\uB294 \uB208\uAE08\uC744 \uC77D\uC2B5\uB2C8\uB2E4."));
a(1, 2, "nonoverlap-required", "4\uC21803-24", 3, "\uACB9\uCE58\uB294 \uAC01\uC744 \uB2E8\uC21C\uD788 \uB354\uD560 \uC218 \uC5C6\uB294 \uC774\uC720 \uC774\uD574\uD558\uAE30", () => C("\uB450 \uAC01\uC758 \uB0B4\uBD80\uAC00 \uC77C\uBD80 \uACB9\uCE69\uB2C8\uB2E4. \uB450 \uD06C\uAE30\uB97C \uB354\uD558\uAE30\uB9CC \uD558\uBA74 \uD569\uCE5C \uBC14\uAE65 \uAC01\uC758 \uD06C\uAE30\uB97C \uD56D\uC0C1 \uAD6C\uD560 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uACB9\uCE5C \uBD80\uBD84\uC744 \uB450 \uBC88 \uC148"]], "\uACB9\uCE5C \uBD80\uBD84\uC744 \uB450 \uBC88 \uB354\uD560 \uC218 \uC788\uC73C\uBBC0\uB85C \uACB9\uCE68 \uC815\uBCF4\uB97C \uD568\uAED8 \uC54C\uC544\uC57C \uD569\uB2C8\uB2E4."));
a(1, 2, "triangle-zero-condition", "4\uC21803-25", 4, "\uB0B4\uAC01 \uD569\uACFC \uC591\uC758 \uAC01 \uC870\uAC74 \uD568\uAED8 \uD655\uC778\uD558\uAE30", () => C("\uC0BC\uAC01\uD615\uC758 \uB450 \uB0B4\uAC01\uC774 90\xB0\uC640 90\xB0\uB77C\uACE0 \uD569\uB2C8\uB2E4. \uAC00\uB2A5\uD55C \uC124\uBA85\uC785\uB2C8\uAE4C?", "\uBD88\uAC00\uB2A5\uD558\uB2E4", [["\uAC00\uB2A5\uD558\uB2E4", "\uD569\uB9CC \uD655\uC778\uD558\uACE0 \uB098\uBA38\uC9C0 0\xB0\uB97C \uD5C8\uC6A9"]], "\uB098\uBA38\uC9C0 \uAC01\uC774 0\xB0\uAC00 \uB418\uC5B4 \uC815\uC0C1\uC801\uC778 \uC0BC\uAC01\uD615\uC774 \uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."));
a(1, 2, "quad-fourth-condition", "4\uC21803-25", 3, "\uC5EC\uB7EC \uAC01\uC758 \uD569\uC73C\uB85C \uB0A8\uC740 \uAC01 \uACC4\uC0B0\uD558\uAE30", () => E("\uC0AC\uAC01\uD615\uC758 \uC138 \uB0B4\uAC01\uC774 65\xB0, 95\xB0, 110\xB0\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uB0B4\uAC01\uC740 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?", [360, 65, "-", 95, "-", 110, "-"], "\uB0B4\uAC01\uC758 \uD569\uC5D0\uC11C \uC138 \uAC01\uC744 \uBE7C\uBA74 {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"));
a(1, 2, "angle-ordering", "4\uC21803-02", 2, "\uAC01 \uD06C\uAE30\uB85C \uC5EC\uB7EC \uC885\uB958\uB97C \uAD6C\uBCC4\uD558\uAE30", () => C("35\xB0, 90\xB0, 125\xB0\uB97C \uCC28\uB840\uB85C \uBD84\uB958\uD55C \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uC608\uAC01, \uC9C1\uAC01, \uB454\uAC01", [["\uC608\uAC01, \uB454\uAC01, \uC9C1\uAC01", "\uC9C1\uAC01 \uAE30\uC900 \uD63C\uB3D9"], ["\uC9C1\uAC01, \uC608\uAC01, \uB454\uAC01", "\uC791\uC740 \uAC01\uACFC \uC9C1\uAC01 \uD63C\uB3D9"]], "90\xB0\uBCF4\uB2E4 \uC791\uC74C, \uAC19\uC74C, \uD07C\uC744 \uAC01\uAC01 \uBE44\uAD50\uD569\uB2C8\uB2E4."));
a(1, 2, "equal-two-angles", "4\uC21803-25", 3, "\uAC19\uC740 \uB450 \uAC01\uACFC \uB0B4\uAC01 \uD569 \uC870\uAC74 \uACB0\uD569\uD558\uAE30", () => E("\uC0BC\uAC01\uD615\uC758 \uD55C \uB0B4\uAC01\uC774 40\xB0\uC774\uACE0 \uB098\uBA38\uC9C0 \uB450 \uB0B4\uAC01\uC740 \uAC19\uC2B5\uB2C8\uB2E4. \uAC19\uC740 \uB450 \uAC01 \uC911 \uD55C \uAC01\uC740 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?", [180, 40, "-", 2, "/"], "\uB0A8\uC740 \uB450 \uAC01\uC758 \uD569\uC744 \uAD6C\uD558\uACE0 \uB458\uB85C \uB098\uB204\uBA74 {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"));
a(1, 2, "classify-with-difference", "4\uC21803-25", 5, "\uD569\xB7\uCC28 \uC870\uAC74\uC73C\uB85C \uAC01\uC744 \uCC3E\uC544 \uC0BC\uAC01\uD615 \uBD84\uB958\uD558\uAE30", () => C("\uC0BC\uAC01\uD615\uC758 \uD55C \uAC01\uC740 60\xB0\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uB450 \uAC01\uC758 \uCC28\uAC00 10\xB0\uC77C \uB54C \uC774 \uC0BC\uAC01\uD615\uC744 \uAC01\uC758 \uD06C\uAE30\uC5D0 \uB530\uB77C \uBD84\uB958\uD558\uC138\uC694.", "\uC608\uAC01\uC0BC\uAC01\uD615", [["\uC9C1\uAC01\uC0BC\uAC01\uD615", "\uC138 \uAC01\uC744 \uCC3E\uC9C0 \uC54A\uACE0 \uC9C1\uAC01\uC73C\uB85C \uD310\uB2E8"], ["\uB454\uAC01\uC0BC\uAC01\uD615", "\uD070 \uCABD\uC774\uB77C\uB294 \uC774\uC720\uB9CC\uC73C\uB85C \uB454\uAC01 \uD310\uB2E8"]], "\uB098\uBA38\uC9C0 \uB450 \uAC01\uC758 \uD569\uC740 120\xB0\uC785\uB2C8\uB2E4. \uAC19\uC740 \uC591\uC73C\uB85C \uB098\uB208 60\xB0\uC5D0\uC11C \uAC01\uAC01 5\xB0\uB97C \uBE7C\uACE0 \uB354\uD558\uBA74 55\xB0\uC640 65\xB0\uC785\uB2C8\uB2E4. \uC138 \uAC01\uC774 \uBAA8\uB450 \uC608\uAC01\uC785\uB2C8\uB2E4."));
a(1, 3, "package-two-kinds", "4\uC21801-04", 3, "\uC11C\uB85C \uB2E4\uB978 \uB450 \uBB36\uC74C\uC758 \uC804\uCCB4 \uC218\uB7C9 \uAD6C\uD558\uAE30", (k) => E(`\uC5F0\uD544\uC740 \uD55C \uC0C1\uC790\uC5D0 12\uC790\uB8E8\uC529 ${3 + k}\uC0C1\uC790, \uC0C9\uC5F0\uD544\uC740 \uD55C \uC0C1\uC790\uC5D0 24\uC790\uB8E8\uC529 2\uC0C1\uC790 \uC788\uC2B5\uB2C8\uB2E4. \uBAA8\uB450 \uBA87 \uC790\uB8E8\uC785\uB2C8\uAE4C?`, [12, 3 + k, "*", 24, 2, "*", "+"], "\uB450 \uC885\uB958\uC758 \uC804\uCCB4 \uC218\uB97C \uAC01\uAC01 \uAD6C\uD55C \uB4A4 \uB354\uD558\uBA74 {answer}\uC790\uB8E8\uC785\uB2C8\uB2E4.", "\uC790\uB8E8"), 12);
a(1, 3, "division-full-and-left", "4\uC21801-07", 3, "\uC644\uC131 \uBB36\uC74C \uC774\uD6C4 \uB0A8\uC740 \uC218\uB7C9 \uAD6C\uD558\uAE30", (k) => E(`\uC2A4\uD2F0\uCEE4 ${75 + k}\uC7A5\uC744 12\uC7A5\uC529 \uC644\uC131 \uBB36\uC74C\uC73C\uB85C \uB9CC\uB4ED\uB2C8\uB2E4. \uB0A8\uB294 \uC2A4\uD2F0\uCEE4\uB294 \uBA87 \uC7A5\uC785\uB2C8\uAE4C?`, [75 + k, 12, "%"], "12\uC7A5 \uBB36\uC74C\uC744 \uCD5C\uB300\uD55C \uB9CC\uB4E4\uACE0 \uB0A8\uC740 \uC218\uB294 {answer}\uC7A5\uC785\uB2C8\uB2E4.", "\uC7A5"), 12);
a(1, 3, "division-zero-remainder", "4\uC21801-07", 1, "\uB098\uB204\uC5B4\uB5A8\uC5B4\uC9D0\uC758 \uB73B \uC774\uD574\uD558\uAE30", () => C("\uB098\uBA38\uC9C0\uAC00 0\uC778 \uB098\uB217\uC148\uC744 \uBC14\uB974\uAC8C \uC124\uBA85\uD55C \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uB611\uAC19\uC740 \uBB36\uC74C\uC73C\uB85C \uB098\uB204\uACE0 \uB0A8\uB294 \uAC83\uC774 \uC5C6\uB2E4", [["\uBAAB\uB3C4 \uD56D\uC0C1 0\uC774\uB2E4", "\uBAAB\uACFC \uB098\uBA38\uC9C0 \uD63C\uB3D9"], ["\uD55C \uBB36\uC74C\uC774 \uBD80\uC871\uD558\uB2E4", "\uB098\uB204\uC5B4\uB5A8\uC5B4\uC9D0 \uC758\uBBF8 \uD63C\uB3D9"]], "\uB098\uBA38\uC9C0 0\uC740 \uB0A8\uB294 \uC591\uC774 \uC5C6\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4."));
a(1, 3, "missing-factor-right", "4\uC21801-04", 2, "\uACF1\uC148\uC758 \uBE60\uC9C4 \uBB36\uC74C \uC218 \uCC3E\uAE30", () => E("18 \xD7 \u25A1 = 216\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB97C \uAD6C\uD558\uC138\uC694.", [216, 18, "/"], "\uC804\uCCB4\uB97C \uD55C \uBB36\uC74C\uC758 \uC218\uB85C \uB098\uB204\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a(1, 3, "remainder-invalid-equal", "4\uC21801-07", 3, "\uB098\uBA38\uC9C0\uC758 \uD5C8\uC6A9 \uBC94\uC704\uB85C \uD480\uC774 \uD655\uC778\uD558\uAE30", () => C("\uC5B4\uB5A4 \uC218\uB97C 16\uC73C\uB85C \uB098\uB208 \uB098\uBA38\uC9C0\uAC00 16\uC774\uB77C\uACE0 \uC801\uC5C8\uC2B5\uB2C8\uB2E4. \uC54C\uB9DE\uC740 \uD310\uB2E8\uC744 \uACE0\uB974\uC138\uC694.", "\uBB36\uC74C\uC744 \uD558\uB098 \uB354 \uB9CC\uB4E4 \uC218 \uC788\uC73C\uBBC0\uB85C \uB098\uBA38\uC9C0\uB294 16\uBCF4\uB2E4 \uC791\uC544\uC57C \uD55C\uB2E4", [["\uC62C\uBC14\uB978 \uB098\uBA38\uC9C0\uC774\uB2E4", "\uB098\uBA38\uC9C0 \uACBD\uACC4 \uC870\uAC74 \uB204\uB77D"], ["\uB098\uBA38\uC9C0\uB294 \uD56D\uC0C1 0\uC774\uC5B4\uC57C \uD55C\uB2E4", "\uB098\uBA38\uC9C0 \uD5C8\uC6A9 \uC758\uBBF8 \uD63C\uB3D9"]], "\uB098\uB204\uB294 \uC218\uB9CC\uD07C \uB0A8\uC73C\uBA74 \uBAAB\uC5D0 1\uC744 \uB354\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."));
a(1, 3, "check-product", "4\uC21801-04", 3, "\uACF1\uC148 \uACB0\uACFC\uB97C \uBD84\uBC30\uD558\uC5EC \uD655\uC778\uD558\uAE30", () => C("23 \xD7 14\uC758 \uACB0\uACFC\uB97C \uD655\uC778\uD558\uB294 \uBC14\uB978 \uC2DD\uC744 \uACE0\uB974\uC138\uC694.", "23 \xD7 10 + 23 \xD7 4", [["23 \xD7 10 + 4", "\uBB36\uC74C \uD06C\uAE30\uB97C \uD55C \uBC88\uB9CC \uACF1\uD568"], ["23 \xD7 1 + 23 \xD7 4", "\uC2ED\uC758 \uC790\uB9AC \uC790\uB9BF\uAC12 \uB204\uB77D"]], "14\uB97C 10\uACFC 4\uB85C \uB098\uB204\uC5B4 \uAC01\uAC01 \uACF1\uD569\uB2C8\uB2E4."));
a(1, 3, "comparison-packs", "4\uC21801-04", 3, "\uBB36\uC74C\uC758 \uB450 \uAD6C\uC131\uC73C\uB85C \uC804\uCCB4 \uC218 \uBE44\uAD50\uD558\uAE30", () => C("A\uC0C1\uC790\uB294 12\uAC1C\uC529 15\uC0C1\uC790, B\uC0C1\uC790\uB294 15\uAC1C\uC529 12\uC0C1\uC790\uC785\uB2C8\uB2E4. \uC804\uCCB4 \uAC1C\uC218\uB97C \uBE44\uAD50\uD558\uC138\uC694.", "\uAC19\uB2E4", [["A\uAC00 \uB354 \uB9CE\uB2E4", "\uD55C \uC0C1\uC790\uC758 \uD06C\uAE30\uB9CC \uBE44\uAD50"], ["B\uAC00 \uB354 \uB9CE\uB2E4", "\uC0C1\uC790 \uC218\uB9CC \uBE44\uAD50"]], "\uB450 \uC804\uCCB4\uB294 \uBAA8\uB450 12 \xD7 15 = 180\uAC1C\uC785\uB2C8\uB2E4."));
a(1, 3, "recover-with-check", "4\uC21801-07", 3, "\uBAAB\xB7\uB098\uBA38\uC9C0\uC640 \uC804\uCCB4 \uC218\uC758 \uC77C\uCE58 \uD655\uC778\uD558\uAE30", () => C("365\uB97C 24\uB85C \uB098\uB208 \uD480\uC774\uB85C \uC633\uC740 \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uBAAB 15, \uB098\uBA38\uC9C0 5", [["\uBAAB 14, \uB098\uBA38\uC9C0 29", "\uB098\uBA38\uC9C0\uAC00 \uB098\uB204\uB294 \uC218\uBCF4\uB2E4 \uD07C"], ["\uBAAB 15, \uB098\uBA38\uC9C0 15", "\uC804\uCCB4 \uC218\uB97C \uBCF5\uC6D0\uD558\uBA74 \uB2E4\uB984"]], "24 \xD7 15 + 5 = 365\uC774\uACE0 5\uB294 24\uBCF4\uB2E4 \uC791\uC2B5\uB2C8\uB2E4."));
a(1, 3, "minimum-bags-condition", "4\uC21801-07", 4, "\uB0A8\uB294 \uC591\uACFC \uD544\uC694\uD55C \uBB36\uC74C \uC218 \uD568\uAED8 \uD310\uB2E8\uD558\uAE30", () => C("\uACF5 96\uAC1C\uB97C \uD55C \uBD09\uC9C0\uC5D0 \uCD5C\uB300 20\uAC1C\uC529 \uB2F4\uC2B5\uB2C8\uB2E4. \uD544\uC694\uD55C \uCD5C\uC18C \uBD09\uC9C0 \uC218\uC640 \uB9C8\uC9C0\uB9C9 \uBD09\uC9C0\uC758 \uACF5 \uC218\uB97C \uACE0\uB974\uC138\uC694.", "5\uBD09\uC9C0, 16\uAC1C", [["4\uBD09\uC9C0, 16\uAC1C", "\uB098\uBA38\uC9C0\uB97C \uB2F4\uC744 \uBD09\uC9C0 \uB204\uB77D"], ["5\uBD09\uC9C0, 20\uAC1C", "\uC804\uCCB4 \uACF5 \uC218\uC640 \uBD88\uC77C\uCE58"]], "\uB124 \uBD09\uC9C0\uC5D0 80\uAC1C\uB97C \uB2F4\uACE0 \uB0A8\uC740 16\uAC1C\uC5D0 \uD55C \uBD09\uC9C0\uAC00 \uB354 \uD544\uC694\uD569\uB2C8\uB2E4."));
a(1, 3, "estimate-consistency", "4\uC21801-08", 2, "\uACC4\uC0B0 \uACB0\uACFC\uC758 \uC790\uB9BF\uAC12 \uC624\uB958 \uD310\uB2E8\uD558\uAE30", () => C("302 \xD7 19\uB97C \uC57D 300 \xD7 20 = 6000\uC73C\uB85C \uC5B4\uB9BC\uD588\uC2B5\uB2C8\uB2E4. 5738\uACFC 57380 \uC911 \uACC4\uC0B0 \uACB0\uACFC\uB85C \uB354 \uD0C0\uB2F9\uD55C \uC218\uB97C \uACE0\uB974\uC138\uC694.", "5738", [["57380", "\uC5B4\uB9BC\uAC12\uACFC \uADDC\uBAA8 \uBE44\uAD50\uB97C \uD558\uC9C0 \uC54A\uC74C"]], "\uC5B4\uB9BC\uAC12 6000\uACFC \uAC00\uAE4C\uC6B4 5738\uC774 \uD0C0\uB2F9\uD569\uB2C8\uB2E4."));
a(1, 3, "leftover-after-use", "4\uC21801-07", 3, "\uC77C\uBD80 \uC0AC\uC6A9 \uD6C4 \uAC19\uC740 \uBB36\uC74C\uC73C\uB85C \uB098\uB204\uAE30", () => E("\uCE74\uB4DC 158\uC7A5 \uC911 14\uC7A5\uC744 \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4. \uB098\uBA38\uC9C0\uB97C 12\uC7A5\uC529 \uBB36\uC73C\uBA74 \uBA87 \uBB36\uC74C\uC785\uB2C8\uAE4C?", [158, 14, "-", 12, "/"], "\uC0AC\uC6A9\uD55C \uC591\uC744 \uBE7C\uACE0 \uD55C \uBB36\uC74C\uC758 \uC218\uB85C \uB098\uB204\uBA74 {answer}\uBB36\uC74C\uC785\uB2C8\uB2E4.", "\uBB36\uC74C"));
a(1, 3, "capacity-strategy", "4\uC21801-07", 5, "\uC804\uCCB4\xB7\uBD80\uBD84 \uC0AC\uC6A9\xB7\uBB36\uC74C \uC81C\uD55C \uC870\uAC74\uC73C\uB85C \uCD5C\uC18C \uACC4\uD68D \uC138\uC6B0\uAE30", () => C("\uCE74\uB4DC 170\uC7A5 \uC911 26\uC7A5\uC744 \uBA3C\uC800 \uB530\uB85C \uB461\uB2C8\uB2E4. \uB098\uBA38\uC9C0\uB294 \uD55C \uC0C1\uC790\uC5D0 \uCD5C\uB300 30\uC7A5\uC529 \uB2F4\uB418 \uBE44\uC5B4 \uC788\uB294 \uC0C1\uC790\uB294 \uC4F0\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD544\uC694\uD55C \uCD5C\uC18C \uC0C1\uC790 \uC218\uC640 \uB9C8\uC9C0\uB9C9 \uC0C1\uC790\uC758 \uC7A5\uC218\uB97C \uACE0\uB974\uC138\uC694.", "5\uC0C1\uC790, 24\uC7A5", [["4\uC0C1\uC790, 24\uC7A5", "\uB0A8\uC740 \uC7A5\uC218\uB97C \uB2F4\uC744 \uC0C1\uC790 \uB204\uB77D"], ["6\uC0C1\uC790, 20\uC7A5", "\uCC98\uC74C \uB530\uB85C \uB454 \uC218\uB97C \uBC18\uC601\uD558\uC9C0 \uC54A\uC74C"]], "\uBA3C\uC800 144\uC7A5\uC774 \uB0A8\uC2B5\uB2C8\uB2E4. \uB124 \uC0C1\uC790\uC5D0 120\uC7A5\uC744 \uB2F4\uACE0 \uB9C8\uC9C0\uB9C9 24\uC7A5\uC5D0 \uD55C \uC0C1\uC790\uAC00 \uB354 \uD544\uC694\uD569\uB2C8\uB2E4."));
a(1, 4, "route-backtrack", "4\uC21803-05", 3, "\uC138 \uBC88\uC758 \uC774\uB3D9\uC744 \uD569\uCCD0 \uC704\uCE58 \uCC3E\uAE30", (k) => E(`\uC624\uB978\uCABD\uC73C\uB85C ${7 + k}\uCE78, \uC67C\uCABD\uC73C\uB85C 4\uCE78, \uB2E4\uC2DC \uC624\uB978\uCABD\uC73C\uB85C 2\uCE78 \uC774\uB3D9\uD588\uC2B5\uB2C8\uB2E4. \uCD9C\uBC1C\uC810 \uAE30\uC900 \uC624\uB978\uCABD \uBA87 \uCE78\uC785\uB2C8\uAE4C?`, [7 + k, 4, "-", 2, "+"], "\uBC18\uB300 \uBC29\uD5A5 \uC774\uB3D9\uC744 \uBE7C\uACE0 \uB9C8\uC9C0\uB9C9 \uC774\uB3D9\uC744 \uB354\uD558\uBA74 {answer}\uCE78\uC785\uB2C8\uB2E4.", "\uCE78"), 12);
var sport = (k = 0) => [{ label: "\uB2EC\uB9AC\uAE30", value: 6 + k }, { label: "\uC904\uB118\uAE30", value: 9 + k }, { label: "\uBC30\uB4DC\uBBFC\uD134", value: 4 + k }];
a(1, 5, "smallest-row", "4\uC21804-01", 2, "\uC790\uB8CC\uC758 \uAC00\uC7A5 \uC791\uC740 \uD56D\uBAA9 \uCC3E\uAE30", (k) => M("\uC6B4\uB3D9 \uD76C\uB9DD \uC778\uC6D0 \uD45C\uC5D0\uC11C \uC778\uC6D0\uC774 \uAC00\uC7A5 \uC801\uC740 \uC6B4\uB3D9\uC744 \uC801\uC73C\uC138\uC694.", "table", "min-label", { rows: sport(k).map((r2, i, all) => ({ ...r2, value: all[(i + k) % 3].value })), valueUnit: "\uBA85" }, "\uBAA8\uB4E0 \uD56D\uBAA9\uC744 \uBE44\uAD50\uD558\uBA74 {answer}\uAC00 \uAC00\uC7A5 \uC801\uC2B5\uB2C8\uB2E4.", "", "data-interpretation"), 12);
a(1, 5, "above-threshold", "4\uC21804-01", 3, "\uC790\uB8CC\uC5D0\uC11C \uC870\uAC74\uC744 \uB9CC\uC871\uD558\uB294 \uD56D\uBAA9 \uC218 \uC138\uAE30", (k) => M(`\uD45C\uC5D0\uC11C \uD76C\uB9DD \uC778\uC6D0\uC774 ${5 + k}\uBA85\uBCF4\uB2E4 \uB9CE\uC740 \uC6B4\uB3D9\uC740 \uBA87 \uAC00\uC9C0\uC785\uB2C8\uAE4C?`, "table", "count-over", { rows: sport(k), threshold: 5 + k, valueUnit: "\uBA85" }, "\uAC01 \uD56D\uBAA9\uC744 \uAE30\uC900\uACFC \uBE44\uAD50\uD558\uC5EC \uC870\uAC74\uC744 \uB9CC\uC871\uD558\uB294 \uD56D\uBAA9\uC744 \uC138\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C", "data-interpretation"), 12);
a(1, 5, "survey-one-category", "4\uC21804-03", 1, "\uC870\uC0AC \uD56D\uBAA9\uC758 \uBD84\uB958 \uAE30\uC900 \uC774\uD574\uD558\uAE30", () => C("\uD559\uC0DD\uC758 \uB4F1\uAD50 \uBC29\uBC95\uC744 \uC870\uC0AC\uD569\uB2C8\uB2E4. \uD56D\uBAA9\uC73C\uB85C \uD568\uAED8 \uC0AC\uC6A9\uD560 \uC218 \uC788\uB294 \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uAC77\uAE30, \uC790\uC804\uAC70, \uBC84\uC2A4", [["\uAC77\uAE30, \uBE68\uAC04\uC0C9, \uCD95\uAD6C", "\uC11C\uB85C \uB2E4\uB978 \uBD84\uB958 \uAE30\uC900\uC744 \uC11E\uC74C"], ["\uC6D4\uC694\uC77C, \uD654\uC694\uC77C, \uAC77\uAE30", "\uC2DC\uAC04\uACFC \uBC29\uBC95\uC744 \uC11E\uC74C"]], "\uC870\uC0AC \uBAA9\uC801\uC5D0 \uB9DE\uB294 \uAC19\uC740 \uAE30\uC900\uC758 \uD56D\uBAA9\uC744 \uC815\uD569\uB2C8\uB2E4."));
a(1, 5, "legend-role", "4\uC21804-01", 1, "\uB9C9\uB300\uADF8\uB798\uD504 \uCD95\uC758 \uC5ED\uD560 \uAD6C\uBCC4\uD558\uAE30", () => C("\uAC00\uB85C\uCD95\uC740 \uC6B4\uB3D9 \uC885\uB958, \uC138\uB85C\uCD95\uC740 \uC778\uC6D0\uC778 \uB9C9\uB300\uADF8\uB798\uD504\uC785\uB2C8\uB2E4. \uB9C9\uB300\uC758 \uB192\uC774\uAC00 \uB098\uD0C0\uB0B4\uB294 \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uADF8 \uC6B4\uB3D9\uC744 \uACE0\uB978 \uC778\uC6D0", [["\uC6B4\uB3D9\uC758 \uC774\uB984 \uAE38\uC774", "\uD56D\uBAA9\uACFC \uC790\uB8CC\uAC12 \uD63C\uB3D9"], ["\uC6B4\uB3D9\uC744 \uD55C \uB0A0\uC9DC", "\uCD95\uC758 \uC758\uBBF8\uB97C \uBC14\uAFC8"]], "\uC138\uB85C\uCD95\uC774 \uC778\uC6D0\uC774\uBBC0\uB85C \uB192\uC774\uB294 \uADF8 \uD56D\uBAA9\uC758 \uC778\uC6D0\uC785\uB2C8\uB2E4."));
a(1, 5, "missing-to-total", "4\uC21804-01", 3, "\uC804\uCCB4\uC640 \uAE30\uB85D\uB41C \uC790\uB8CC\uB85C \uB204\uB77D \uAC12 \uAD6C\uD558\uAE30", () => M("\uD76C\uB9DD \uC6B4\uB3D9\uC744 \uD55C \uAC00\uC9C0\uC529 \uACE0\uB978 \uD559\uC0DD\uC740 \uBAA8\uB450 25\uBA85\uC785\uB2C8\uB2E4. \uD45C\uC5D0 \uC801\uD78C \uD56D\uBAA9 \uC678 \uB098\uBA38\uC9C0 \uD55C \uC6B4\uB3D9\uC744 \uACE0\uB978 \uD559\uC0DD\uC740 \uBA87 \uBA85\uC785\uB2C8\uAE4C?", "table", "missing-to-total", { rows: sport(), total: 25, valueUnit: "\uBA85" }, "\uC804\uCCB4\uC5D0\uC11C \uAE30\uB85D\uB41C \uC778\uC6D0 \uD569\uC744 \uBE7C\uBA74 {answer}\uBA85\uC785\uB2C8\uB2E4.", "\uBA85", "data-interpretation"));
a(1, 5, "axis-step-error", "4\uC21804-01", 3, "\uADF8\uB798\uD504 \uB208\uAE08 \uAC04\uACA9\uC5D0 \uB530\uB978 \uAC12 \uC77D\uAE30", () => E("\uB9C9\uB300\uADF8\uB798\uD504\uC758 \uC138\uB85C\uCD95\uC740 \uD55C \uCE78\uC5D0 2\uBA85\uC785\uB2C8\uB2E4. \uB9C9\uB300\uAC00 0\uC5D0\uC11C 7\uCE78 \uC62C\uB77C\uAC00 \uC788\uC73C\uBA74 \uBA87 \uBA85\uC785\uB2C8\uAE4C?", [2, 7, "*"], "\uCE78 \uC218\uC5D0 \uD55C \uCE78\uC758 \uC778\uC6D0\uC744 \uACF1\uD558\uBA74 {answer}\uBA85\uC785\uB2C8\uB2E4.", "\uBA85", "data-interpretation"));
a(1, 5, "double-record", "4\uC21804-03", 3, "\uC911\uBCF5 \uAE30\uB85D\uC774 \uC804\uCCB4\uC5D0 \uBBF8\uCE58\uB294 \uC601\uD5A5 \uD310\uB2E8\uD558\uAE30", () => C("\uD55C \uD559\uC0DD\uC774 \uD55C \uBC88\uB9CC \uC751\uB2F5\uD574\uC57C \uD558\uB294 \uC870\uC0AC\uC5D0\uC11C \uBBFC\uC218\uC758 \uC751\uB2F5\uC744 \uB450 \uBC88 \uAE30\uB85D\uD588\uC2B5\uB2C8\uB2E4. \uAC00\uC7A5 \uD0C0\uB2F9\uD55C \uC870\uCE58\uB97C \uACE0\uB974\uC138\uC694.", "\uC911\uBCF5 \uAE30\uB85D \uD55C \uBC88\uC744 \uC81C\uC678\uD55C\uB2E4", [["\uB450 \uBC88\uC758 \uAE30\uB85D\uC744 \uBAA8\uB450 \uB0A8\uAE34\uB2E4", "\uD55C \uD559\uC0DD\uC744 \uB450 \uBA85\uC73C\uB85C \uC148"], ["\uBBFC\uC218\uC758 \uC751\uB2F5\uC744 \uBAA8\uB450 \uC9C0\uC6B4\uB2E4", "\uC2E4\uC81C \uD55C \uC751\uB2F5\uAE4C\uC9C0 \uC0AD\uC81C"]], "\uC2E4\uC81C \uC751\uB2F5\uC740 \uD55C \uBC88\uC774\uBBC0\uB85C \uC911\uBCF5 \uD55C \uBC88\uB9CC \uC81C\uC678\uD569\uB2C8\uB2E4."));
a(1, 5, "equal-height", "4\uC21804-01", 2, "\uAC19\uC740 \uB192\uC774 \uB9C9\uB300\uC758 \uC758\uBBF8 \uD574\uC11D\uD558\uAE30", () => C("\uAC19\uC740 \uB208\uAE08\uC744 \uC4F0\uB294 \uD55C \uB9C9\uB300\uADF8\uB798\uD504\uC5D0\uC11C \uB450 \uB9C9\uB300\uC758 \uB192\uC774\uAC00 \uAC19\uC2B5\uB2C8\uB2E4. \uC54C\uB9DE\uC740 \uACB0\uB860\uC744 \uACE0\uB974\uC138\uC694.", "\uB450 \uD56D\uBAA9\uC758 \uC790\uB8CC\uAC12\uC774 \uAC19\uB2E4", [["\uD56D\uBAA9\uC758 \uB73B\uC774 \uAC19\uB2E4", "\uAC12\uACFC \uBC94\uC8FC\uB97C \uD63C\uB3D9"], ["\uC870\uC0AC\uD558\uC9C0 \uC54A\uC740 \uD56D\uBAA9\uC774\uB2E4", "\uAC19\uC740 \uB192\uC774\uC640 \uC790\uB8CC \uC5C6\uC74C \uD63C\uB3D9"]], "\uAC19\uC740 \uCD95\uACFC \uB208\uAE08\uC5D0\uC11C\uB294 \uB192\uC774\uAC00 \uAC19\uC73C\uBA74 \uAC12\uB3C4 \uAC19\uC2B5\uB2C8\uB2E4."));
a(1, 5, "goal-comparison", "4\uC21804-03", 4, "\uC790\uB8CC\uC640 \uC900\uBE44 \uC218\uB7C9\uC744 \uC5F0\uACB0\uD574 \uBD80\uC871\uD55C \uD56D\uBAA9 \uD310\uB2E8\uD558\uAE30", () => C("\uCD95\uAD6C 12\uBA85, \uB18D\uAD6C 8\uBA85, \uBC30\uAD6C 10\uBA85\uC774 \uC2E0\uCCAD\uD588\uC2B5\uB2C8\uB2E4. \uAC01 \uD65C\uB3D9\uC758 \uC900\uBE44\uBB3C\uC740 9\uBA85\uBD84\uC529 \uC788\uC2B5\uB2C8\uB2E4. \uBD80\uC871\uD55C \uD65C\uB3D9\uC744 \uBAA8\uB450 \uACE0\uB974\uC138\uC694.", "\uCD95\uAD6C\uC640 \uBC30\uAD6C", [["\uCD95\uAD6C\uB9CC", "\uBC30\uAD6C\uC758 \uC2E0\uCCAD\uAC12\uC744 \uBE44\uAD50\uD558\uC9C0 \uC54A\uC74C"], ["\uC138 \uD65C\uB3D9 \uBAA8\uB450", "\uB18D\uAD6C\uB3C4 \uBD80\uC871\uD558\uB2E4\uACE0 \uC624\uC778"]], "\uC2E0\uCCAD \uC778\uC6D0\uC774 9\uBA85\uBCF4\uB2E4 \uD070 \uCD95\uAD6C\uC640 \uBC30\uAD6C\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4."));
a(1, 5, "sample-versus-all", "4\uC21804-03", 3, "\uB300\uD45C \uC77C\uBD80 \uC790\uB8CC\uC640 \uC804\uCCB4 \uC790\uB8CC \uAD6C\uBCC4\uD558\uAE30", () => C("\uAC01 \uBAA8\uB460 \uB300\uD45C \uD55C \uC0AC\uB78C\uC529\uB9CC \uC88B\uC544\uD558\uB294 \uC6B4\uB3D9\uC744 \uBB3C\uC5C8\uC2B5\uB2C8\uB2E4. \uC774\uB97C \uD559\uAE09 \uC804\uCCB4\uC758 \uC815\uD655\uD55C \uC778\uC6D0\uC774\uB77C\uACE0 \uBC1C\uD45C\uD558\uB824 \uD569\uB2C8\uB2E4. \uC54C\uB9DE\uC740 \uD310\uB2E8\uC744 \uACE0\uB974\uC138\uC694.", "\uBAA8\uB4E0 \uD559\uC0DD\uC758 \uC751\uB2F5\uC744 \uBC1B\uC9C0 \uC54A\uC544 \uC804\uCCB4 \uC778\uC6D0\uC73C\uB85C \uD655\uC815\uD560 \uC218 \uC5C6\uB2E4", [["\uB300\uD45C\uC758 \uC751\uB2F5 \uC218\uC5D0 \uC544\uBB34 \uC218\uB098 \uACF1\uD558\uBA74 \uC815\uD655\uD574\uC9C4\uB2E4", "\uADFC\uAC70 \uC5C6\uB294 \uD655\uB300"], ["\uB300\uD45C \uC751\uB2F5\uC740 \uD56D\uC0C1 \uC804\uCCB4\uC640 \uAC19\uC740 \uBE44\uC728\uC774\uB2E4", "\uB300\uD45C\uC131 \uADFC\uAC70 \uC5C6\uC74C"]], "\uC804\uCCB4 \uC778\uC6D0\uC744 \uAD6C\uD558\uB824\uBA74 \uC870\uC0AC \uB300\uC0C1 \uC804\uCCB4\uC758 \uC2E4\uC81C \uC751\uB2F5\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."));
a(1, 5, "compare-two-groups", "4\uC21804-01", 3, "\uB450 \uC9D1\uB2E8 \uC790\uB8CC\uB97C \uD569\uCCD0 \uD55C \uD56D\uBAA9\uC758 \uAC12 \uAD6C\uD558\uAE30", () => E("\uB2EC\uB9AC\uAE30 \uC2E0\uCCAD\uC790\uB294 1\uBC18 8\uBA85, 2\uBC18 11\uBA85\uC785\uB2C8\uB2E4. \uB450 \uBC18\uC5D0\uC11C \uC2E0\uCCAD\uD55C \uC778\uC6D0\uC740 \uBAA8\uB450 \uBA87 \uBA85\uC785\uB2C8\uAE4C?", [8, 11, "+"], "\uAC19\uC740 \uD56D\uBAA9\uC758 \uB450 \uBC18 \uAC12\uC744 \uB354\uD558\uBA74 {answer}\uBA85\uC785\uB2C8\uB2E4.", "\uBA85", "data-interpretation"));
a(1, 5, "collection-consistency", "4\uC21804-03", 4, "\uC911\uBCF5\xB7\uB204\uB77D\xB7\uC804\uCCB4 \uC218 \uC870\uAC74\uC744 \uD568\uAED8 \uD655\uC778\uD558\uAE30", () => C("\uD559\uAE09\uC740 28\uBA85\uC785\uB2C8\uB2E4. \uC6B4\uB3D9\uC744 \uD55C \uAC00\uC9C0\uC529 \uACE0\uB978 \uC751\uB2F5\uC744 \uC138\uB2C8 29\uAC1C\uC600\uACE0, \uD55C \uD559\uC0DD\uC740 \uB450 \uBC88 \uAE30\uB85D\uB418\uC5C8\uC73C\uBA70 \uACB0\uC11D\uC790\uB3C4 \uB098\uC911\uC5D0 \uBAA8\uB450 \uC751\uB2F5\uD588\uC2B5\uB2C8\uB2E4. \uBC14\uB978 \uC815\uB9AC \uBC29\uBC95\uC744 \uACE0\uB974\uC138\uC694.", "\uC911\uBCF5 \uD55C \uBC88\uC744 \uBE7C\uC11C 28\uAC1C\uB85C \uC815\uB9AC\uD55C\uB2E4", [["\uACB0\uC11D\uC790\uB97C \uB2E4\uC2DC \uB354\uD55C\uB2E4", "\uC774\uBBF8 \uBC1B\uC740 \uC751\uB2F5\uC744 \uB610 \uC148"], ["\uC751\uB2F5 29\uAC1C\uB97C \uADF8\uB300\uB85C \uBC1C\uD45C\uD55C\uB2E4", "\uC911\uBCF5 \uC870\uAC74 \uB204\uB77D"]], "\uACB0\uC11D\uC790 \uC751\uB2F5\uC740 \uC774\uBBF8 \uD3EC\uD568\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uC911\uBCF5 \uD55C \uBC88\uB9CC \uC81C\uC678\uD558\uBA74 \uC804\uCCB4 28\uBA85\uACFC \uC77C\uCE58\uD569\uB2C8\uB2E4."));
a(1, 6, "alternating-rule", "4\uC21802-01", 3, "\uB450 \uADDC\uCE59\uC774 \uBC88\uAC08\uC544 \uC801\uC6A9\uB418\uB294 \uC218 \uBC30\uC5F4 \uC774\uD574\uD558\uAE30", (k) => E(`${5 + k}\uC5D0\uC11C 2\uB97C \uB354\uD558\uACE0 3\uC744 \uB354\uD558\uB294 \uADDC\uCE59\uC744 \uBC88\uAC08\uC544 \uC801\uC6A9\uD569\uB2C8\uB2E4. \uCC98\uC74C\uBD80\uD130 \uB124 \uBC88 \uC801\uC6A9\uD55C \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [5 + k, 2, "+", 3, "+", 2, "+", 3, "+"], "\uB450 \uC99D\uAC00\uB7C9\uC744 \uCC28\uB840\uB85C \uB450 \uBC88\uC529 \uC801\uC6A9\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "pattern"), 12);
a(1, 6, "missing-multiplier", "4\uC21802-03", 3, "\uAC19\uC740 \uC591\uC744 \uB9CC\uB4DC\uB294 \uACF1\uC148\uC2DD\uC758 \uBE48\uCE78 \uCC3E\uAE30", (k) => E(`6 \xD7 \u25A1 = ${12 * (2 + k)}\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [12 * (2 + k), 6, "/"], "\uACF1\uC744 \uC54C\uB824\uC9C4 \uC218\uB85C \uB098\uB204\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"), 12);
a(1, 6, "equality-meaning", "4\uC21802-03", 1, "\uB4F1\uD638\uAC00 \uB098\uD0C0\uB0B4\uB294 \uAD00\uACC4 \uC774\uD574\uD558\uAE30", () => C("\uB4F1\uD638 =\uC758 \uB73B\uC73C\uB85C \uC54C\uB9DE\uC740 \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uC591\uCABD\uC758 \uAC12\uC774 \uAC19\uB2E4", [["\uD56D\uC0C1 \uC624\uB978\uCABD\uC5D0 \uB2F5\uB9CC \uC801\uB294\uB2E4", "\uB4F1\uD638\uB97C \uACC4\uC0B0 \uC9C0\uC2DC\uB85C\uB9CC \uC774\uD574"], ["\uC624\uB978\uCABD \uAC12\uC774 \uB354 \uD06C\uB2E4", "\uAD00\uACC4 \uAE30\uD638 \uD63C\uB3D9"]], "\uB4F1\uD638\uB294 \uC591\uCABD\uC774 \uAC19\uC740 \uAC12\uC784\uC744 \uB098\uD0C0\uB0C5\uB2C8\uB2E4."));
a(1, 6, "both-sides-add", "4\uC21802-03", 2, "\uAC19\uC740 \uB450 \uC591\uC5D0 \uAC19\uC740 \uC218\uB97C \uB354\uD558\uAE30", () => C("A\uC640 B\uAC00 \uAC19\uC740 \uAC12\uC785\uB2C8\uB2E4. \uC591\uCABD\uC5D0 7\uC744 \uAC01\uAC01 \uB354\uD558\uBA74 \uAD00\uACC4\uB294 \uC5B4\uB5BB\uAC8C \uB429\uB2C8\uAE4C?", "\uAC19\uC740 \uAC12\uC744 \uC720\uC9C0\uD55C\uB2E4", [["A\uB9CC \uB354 \uCEE4\uC9C4\uB2E4", "\uD55C\uCABD\uB9CC \uBCC0\uD55C\uB2E4\uACE0 \uD310\uB2E8"], ["B\uB9CC \uB354 \uCEE4\uC9C4\uB2E4", "\uD55C\uCABD\uB9CC \uBCC0\uD55C\uB2E4\uACE0 \uD310\uB2E8"]], "\uAC19\uC740 \uB450 \uAC12\uC5D0 \uAC19\uC740 \uC591\uC744 \uB354\uD558\uBA74 \uACB0\uACFC\uB3C4 \uAC19\uC2B5\uB2C8\uB2E4."));
a(1, 6, "visual-repeat-count", "4\uC21802-01", 3, "\uBC18\uBCF5 \uBB34\uB2AC\uC758 \uC790\uB9AC\uB85C \uD56D\uBAA9 \uCC3E\uAE30", () => C("\uBE68\uAC15, \uD30C\uB791, \uB178\uB791\uC774 \uC774 \uC21C\uC11C\uB85C \uACC4\uC18D \uBC18\uBCF5\uB429\uB2C8\uB2E4. 8\uBC88\uC9F8 \uC0C9\uC744 \uACE0\uB974\uC138\uC694.", "\uD30C\uB791", [["\uBE68\uAC15", "\uBC18\uBCF5 \uC2DC\uC791 \uC704\uCE58 \uC624\uB958"], ["\uB178\uB791", "\uBB36\uC74C \uB05D \uC704\uCE58 \uC624\uB958"]], "\uC138 \uC0C9\uC529 \uB450 \uBC88 \uBC18\uBCF5\uD55C \uB4A4 7\uBC88\uC9F8\uB294 \uBE68\uAC15, 8\uBC88\uC9F8\uB294 \uD30C\uB791\uC785\uB2C8\uB2E4."));
a(1, 6, "explicit-next-expression", "4\uC21802-02", 2, "\uACF1\uC148\uC2DD\uC758 \uC785\uB825 \uC99D\uAC00\uC5D0 \uB530\uB978 \uACB0\uACFC \uBCC0\uD654 \uC124\uBA85\uD558\uAE30", () => C("9 \xD7 3\uC5D0\uC11C 9 \xD7 4\uB85C \uBC14\uB00C\uBA74 \uACB0\uACFC\uB294 \uC5BC\uB9C8 \uB298\uC5B4\uB0A9\uB2C8\uAE4C?", "9", [["1", "\uACF1\uD558\uB294 \uC218 \uBCC0\uD654\uB9CC \uB2F5\uD568"], ["4", "\uBB36\uC74C \uD06C\uAE30\uC640 \uBB36\uC74C \uC218 \uD63C\uB3D9"]], "9\uC9DC\uB9AC \uBB36\uC74C\uC774 \uD55C \uAC1C \uB298\uC5B4\uB098\uBBC0\uB85C 9 \uC99D\uAC00\uD569\uB2C8\uB2E4."));
a(1, 6, "same-subtract", "4\uC21802-03", 2, "\uAC19\uC740 \uC591\uC5D0\uC11C \uAC19\uC740 \uC591\uC744 \uBE80 \uAD00\uACC4 \uD310\uB2E8\uD558\uAE30", () => C("\uB450 \uC0C1\uC790\uC5D0 \uAC19\uC740 \uC218\uC758 \uACF5\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uB450 \uC0C1\uC790\uC5D0\uC11C \uAC01\uAC01 3\uAC1C\uC529 \uBE90\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uACF5 \uC218\uC758 \uAD00\uACC4\uB97C \uACE0\uB974\uC138\uC694.", "\uAC19\uB2E4", [["\uCCAB \uC0C1\uC790\uAC00 \uB354 \uB9CE\uB2E4", "\uAC19\uC740 \uAC10\uC18C\uB7C9 \uC870\uAC74 \uB204\uB77D"], ["\uB458\uC9F8 \uC0C1\uC790\uAC00 \uB354 \uB9CE\uB2E4", "\uAC19\uC740 \uAC10\uC18C\uB7C9 \uC870\uAC74 \uB204\uB77D"]], "\uAC19\uC740 \uC218\uC5D0\uC11C \uAC19\uC740 \uC218\uB97C \uBE7C\uBA74 \uB0A8\uC740 \uC218\uB3C4 \uAC19\uC2B5\uB2C8\uB2E4."));
a(1, 6, "reverse-pattern", "4\uC21802-01", 3, "\uC8FC\uC5B4\uC9C4 \uC99D\uAC00 \uADDC\uCE59\uC744 \uAC70\uAFB8\uB85C \uC0AC\uC6A9\uD558\uAE30", () => E("\uC218 \uBC30\uC5F4\uC740 7\uC529 \uCEE4\uC9D1\uB2C8\uB2E4. \uB2E4\uC12F \uBC88\uC9F8 \uC218\uAC00 42\uC77C \uB54C \uC138 \uBC88\uC9F8 \uC218\uB97C \uAD6C\uD558\uC138\uC694.", [42, 7, 2, "*", "-"], "\uB450 \uBC88\uC758 \uC99D\uAC00\uB7C9\uC744 \uAC70\uAFB8\uB85C \uBE7C\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "pattern"));
a(1, 6, "false-rule-test", "4\uC21802-02", 4, "\uC5EC\uB7EC \uC2DD\uC5D0 \uBAA8\uB450 \uB9DE\uB294 \uC124\uBA85 \uCC3E\uAE30", () => C("4 \xD7 2 = 8, 4 \xD7 3 = 12, 4 \xD7 4 = 16\uC785\uB2C8\uB2E4. \uBAA8\uB4E0 \uC2DD\uC5D0 \uB9DE\uB294 \uC124\uBA85\uC744 \uACE0\uB974\uC138\uC694.", "\uB4A4\uC758 \uC218\uAC00 1 \uCEE4\uC9C8 \uB54C \uACB0\uACFC\uAC00 4 \uCEE4\uC9C4\uB2E4", [["\uACB0\uACFC\uAC00 \uD56D\uC0C1 2 \uCEE4\uC9C4\uB2E4", "\uCCAB \uC2DD\uC758 \uC785\uB825\uB9CC \uC0AC\uC6A9"], ["\uACB0\uACFC\uAC00 \uD56D\uC0C1 4\uBC30 \uCEE4\uC9C4\uB2E4", "\uCC28\uC640 \uBC30\uC728 \uD63C\uB3D9"]], "\uC774\uC6C3\uD55C \uACB0\uACFC\uC758 \uCC28\uAC00 \uBAA8\uB450 4\uC785\uB2C8\uB2E4."));
a(1, 6, "balance-multiply", "4\uC21802-03", 3, "\uC591\uCABD \uC2DD\uC758 \uAC12\uC744 \uC5F0\uACB0\uD558\uC5EC \uBE48\uCE78 \uCC3E\uAE30", () => E("3 \xD7 \u25A1 + 4 = 7 \xD7 4\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB97C \uAD6C\uD558\uC138\uC694.", [7, 4, "*", 4, "-", 3, "/"], "\uC624\uB978\uCABD \uAC12\uC744 \uAD6C\uD558\uACE0 4\uB97C \uBE80 \uB4A4 3\uC73C\uB85C \uB098\uB204\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a(1, 6, "pattern-one-change", "4\uC21802-01", 3, "\uADDC\uCE59\uC5D0\uC11C \uBC97\uC5B4\uB09C \uD55C \uD56D \uCC3E\uAE30", () => C("5\uC529 \uCEE4\uC9C0\uB294 \uADDC\uCE59\uC774\uC5B4\uC57C \uD558\uB294 \uBC30\uC5F4\uC774 7, 12, 18, 22\uC785\uB2C8\uB2E4. \uC138 \uBC88\uC9F8 \uC218\uB97C \uBC14\uB974\uAC8C \uACE0\uCE58\uC138\uC694.", "17", [["16", "\uC99D\uAC00\uB7C9 5\uB97C \uC720\uC9C0\uD558\uC9C0 \uC54A\uC74C"], ["19", "\uC99D\uAC00\uB7C9 5\uB97C \uC720\uC9C0\uD558\uC9C0 \uC54A\uC74C"]], "12\uC5D0 5\uB97C \uB354\uD558\uBA74 17\uC774\uACE0 17\uC5D0 5\uB97C \uB354\uD558\uBA74 22\uC785\uB2C8\uB2E4."));
a(1, 6, "two-rule-constraint", "4\uC21802-01", 5, "\uADDC\uCE59\xB7\uCD9C\uBC1C\uAC12\xB7\uB9C8\uC9C0\uB9C9 \uAC12 \uC870\uAC74\uC744 \uD568\uAED8 \uCD94\uB860\uD558\uAE30", () => C("\uC5B4\uB5A4 \uC218\uC5D0\uC11C 4\uB97C \uB354\uD558\uACE0 2\uB97C \uBE7C\uB294 \uADDC\uCE59\uC744 \uB450 \uBC88 \uBC18\uBCF5\uD588\uB354\uB2C8 19\uAC00 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uCC98\uC74C \uC218\uC640 \uCCAB \uBC88\uC9F8 \uBC18\uBCF5 \uD6C4\uC758 \uC218\uB97C \uACE0\uB974\uC138\uC694.", "\uCC98\uC74C 15, \uD55C \uBC88 \uD6C4 17", [["\uCC98\uC74C 11, \uD55C \uBC88 \uD6C4 15", "\uBE7C\uB294 \uADDC\uCE59\uC744 \uB204\uB77D"], ["\uCC98\uC74C 17, \uD55C \uBC88 \uD6C4 19", "\uBC18\uBCF5 \uD69F\uC218\uB97C \uB204\uB77D"]], "\uD55C \uBC88\uC758 \uBCC0\uD654\uB294 2\uC785\uB2C8\uB2E4. \uB450 \uBC88\uC758 \uBCC0\uD654 4\uB97C \uBE7C\uBA74 \uCC98\uC74C\uC740 15\uC774\uACE0 \uD55C \uBC88 \uD6C4\uC5D0\uB294 17\uC785\uB2C8\uB2E4."));
a(2, 1, "three-fractions", "4\uC21801-15", 3, "\uAC19\uC740 \uBD84\uBAA8\uC778 \uC138 \uBD84\uC218\uC758 \uD569 \uAD6C\uD558\uAE30", (k) => E(`${f(1 + k % 3, 11)}, 2/11, 3/11\uC744 \uBAA8\uB450 \uB354\uD558\uC138\uC694.`, [f(1 + k % 3, 11), "2/11", "+", "3/11", "+"], "\uAC19\uC740 \uD06C\uAE30\uC758 \uC870\uAC01 \uC218\uB97C \uBAA8\uB450 \uB354\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"), 3);
a(2, 1, "fraction-returned", "4\uC21801-15", 3, "\uBD84\uC218 \uC591\uC744 \uC4F0\uACE0 \uB3CC\uB824\uBC1B\uC740 \uC591 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uBB3C ${f(7 + k % 3, 10)} L\uC5D0\uC11C 3/10 L\uB97C \uC4F4 \uB4A4 1/10 L\uB97C \uB2E4\uC2DC \uB123\uC5C8\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uC591\uC744 L \uB2E8\uC704\uC758 \uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, [f(7 + k % 3, 10), "3/10", "-", "1/10", "+"], "\uC4F4 \uC591\uC744 \uBE7C\uACE0 \uB2E4\uC2DC \uB123\uC740 \uC591\uC744 \uB354\uD558\uBA74 {answer} L\uC785\uB2C8\uB2E4."), 3);
a(2, 1, "improper-definition", "4\uC21801-10", 1, "\uAC00\uBD84\uC218\uC758 \uBD84\uC790\xB7\uBD84\uBAA8 \uAD00\uACC4 \uD655\uC778\uD558\uAE30", () => C("\uAC00\uBD84\uC218\uC5D0 \uB300\uD55C \uBC14\uB978 \uC124\uBA85\uC744 \uACE0\uB974\uC138\uC694.", "\uBD84\uC790\uAC00 \uBD84\uBAA8\uC640 \uAC19\uAC70\uB098 \uB354 \uD06C\uB2E4", [["\uBD84\uC790\uAC00 \uD56D\uC0C1 1\uC774\uB2E4", "\uB2E8\uC704\uBD84\uC218\uC640 \uD63C\uB3D9"], ["\uBD84\uC790\uAC00 \uBD84\uBAA8\uBCF4\uB2E4 \uC791\uB2E4", "\uC9C4\uBD84\uC218\uC640 \uD63C\uB3D9"]], "\uBD84\uC790\uAC00 \uBD84\uBAA8 \uC774\uC0C1\uC774\uBA74 \uAC00\uBD84\uC218\uC785\uB2C8\uB2E4."));
a(2, 1, "mixed-whole-part", "4\uC21801-10", 2, "\uB300\uBD84\uC218\uC758 \uC790\uC5F0\uC218 \uBD80\uBD84 \uC758\uBBF8 \uC774\uD574\uD558\uAE30", () => C("2 3/7\uC5D0\uC11C 2\uAC00 \uB098\uD0C0\uB0B4\uB294 \uB73B\uC744 \uACE0\uB974\uC138\uC694.", "\uC628\uC804\uD55C \uC804\uCCB4\uAC00 2\uAC1C \uC788\uB2E4", [["\uC804\uCCB4\uB97C \uB450 \uC870\uAC01\uC73C\uB85C \uB098\uB234\uB2E4", "\uC790\uC5F0\uC218 \uBD80\uBD84\uACFC \uBD84\uBAA8 \uD63C\uB3D9"], ["\uC120\uD0DD\uD55C \uC870\uAC01\uC774 \uB450 \uAC1C\uB2E4", "\uC790\uC5F0\uC218 \uBD80\uBD84\uACFC \uBD84\uC790 \uD63C\uB3D9"]], "2\uB294 \uC628\uC804\uD55C \uC804\uCCB4\uC758 \uC218\uC774\uACE0 3/7\uC740 \uCD94\uAC00 \uBD80\uBD84\uC785\uB2C8\uB2E4."));
a(2, 1, "whole-as-fraction", "4\uC21801-10", 2, "\uBD84\uBAA8\uAC00 \uC8FC\uC5B4\uC84C\uC744 \uB54C \uC804\uCCB4 1 \uB098\uD0C0\uB0B4\uAE30", () => C("\uC804\uCCB4 1\uC744 \uBD84\uBAA8\uAC00 8\uC778 \uBD84\uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.", "8/8", [["1/8", "\uC804\uCCB4\uC640 \uD55C \uBD80\uBD84 \uD63C\uB3D9"], ["8/1", "\uBD84\uBAA8\uC640 \uBD84\uC790 \uBC14\uAFC8"]], "1/8 \uD06C\uAE30 \uC870\uAC01 8\uAC1C\uAC00 \uC804\uCCB4 1\uC785\uB2C8\uB2E4."));
a(2, 1, "borrow-fraction", "4\uC21801-15", 3, "\uC790\uC5F0\uC218 1\uACFC \uBD84\uC218 \uBD80\uBD84\uC744 \uC5F0\uACB0\uD558\uC5EC \uBE7C\uAE30", () => E("1 - 3/8\uC744 \uACC4\uC0B0\uD558\uC138\uC694.", ["8/8", "3/8", "-"], "\uC804\uCCB4 1\uC744 8/8\uB85C \uBCF4\uACE0 \uBE7C\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a(2, 1, "compare-improper", "4\uC21801-11", 2, "\uBD84\uBAA8\uAC00 \uAC19\uC740 \uAC00\uBD84\uC218\uC640 \uC9C4\uBD84\uC218 \uBE44\uAD50\uD558\uAE30", () => C("11/9\uC640 8/9 \uC911 \uD070 \uC218\uB97C \uACE0\uB974\uC138\uC694.", "11/9", [["8/9", "\uBD84\uC790 \uD06C\uAE30 \uBE44\uAD50 \uC624\uB958"], ["\uAC19\uB2E4", "\uAC19\uC740 \uBD84\uBAA8\uB97C \uAC19\uC740 \uAC12\uC73C\uB85C \uD310\uB2E8"]], "\uBD84\uBAA8\uAC00 \uAC19\uC73C\uBBC0\uB85C \uBD84\uC790\uAC00 \uD070 11/9\uC774 \uD07D\uB2C8\uB2E4."));
a(2, 1, "join-to-one", "4\uC21801-15", 3, "\uC804\uCCB4 1\uC774 \uB418\uB294 \uBE60\uC9C4 \uBD84\uC218 \uCC3E\uAE30", () => E("3/10 + \u25A1 = 1\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uBD84\uC218\uB97C \uAD6C\uD558\uC138\uC694.", ["10/10", "3/10", "-"], "\uC804\uCCB4\uC5D0\uC11C \uC8FC\uC5B4\uC9C4 \uBD84\uC218\uB97C \uBE7C\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a(2, 1, "same-piece-error", "4\uC21801-15", 3, "\uAC19\uC740 \uBD84\uBAA8\uC758 \uD569\uACFC \uC804\uCCB4 1 \uAD00\uACC4 \uD655\uC778\uD558\uAE30", () => C("5/8 + 4/8\uC740 1\uBCF4\uB2E4 \uD07D\uB2C8\uAE4C?", "\uC608", [["\uC544\uB2C8\uC694", "\uC804\uCCB4 8\uC870\uAC01\uBCF4\uB2E4 \uB9CE\uC740 9\uC870\uAC01\uC744 \uBE44\uAD50\uD558\uC9C0 \uC54A\uC74C"]], "\uD569\uC740 9/8\uC774\uACE0 \uC804\uCCB4 1\uC778 8/8\uBCF4\uB2E4 \uD07D\uB2C8\uB2E4."));
a(2, 1, "mixed-difference-context", "4\uC21801-15", 3, "\uB300\uBD84\uC218 \uB450 \uC591\uACFC \uADF8 \uCC28\uB97C \uC0C1\uD669\uC5D0 \uC5F0\uACB0\uD558\uAE30", () => E("\uB9AC\uBCF8\uC740 3 2/9 m, \uB048\uC740 1 7/9 m\uC785\uB2C8\uB2E4. \uB9AC\uBCF8\uC774 \uB048\uBCF4\uB2E4 \uAE34 \uC591\uC744 m \uB2E8\uC704\uC758 \uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.", ["29/9", "16/9", "-"], "\uAE34 \uC591\uC5D0\uC11C \uC9E7\uC740 \uC591\uC744 \uBE7C\uBA74 {answer} m\uC785\uB2C8\uB2E4."));
a(2, 1, "fraction-denominator-meaning", "4\uC21801-15", 3, "\uACC4\uC0B0 \uC911 \uBD84\uBAA8\uB97C \uC720\uC9C0\uD558\uB294 \uC774\uC720 \uC124\uBA85\uD558\uAE30", () => C("3/12 + 4/12\uC5D0\uC11C \uBD84\uBAA8\uB97C 24\uB85C \uB354\uD558\uC9C0 \uC54A\uB294 \uAE4C\uB2ED\uC744 \uACE0\uB974\uC138\uC694.", "\uC870\uAC01 \uD55C \uAC1C\uC758 \uD06C\uAE30\uB294 \uBC14\uB00C\uC9C0 \uC54A\uAE30 \uB54C\uBB38\uC774\uB2E4", [["\uC804\uCCB4\uAC00 \uB450 \uAC1C\uAC00 \uB418\uC5B4\uC11C\uC774\uB2E4", "\uC804\uCCB4 \uAE30\uC900\uC744 \uBC14\uAFC8"], ["\uBD84\uBAA8\uB294 \uC5B8\uC81C\uB098 \uBB34\uC2DC\uD574\uB3C4 \uB418\uAE30 \uB54C\uBB38\uC774\uB2E4", "\uBD84\uBAA8 \uC5ED\uD560 \uB204\uB77D"]], "1/12 \uD06C\uAE30 \uC870\uAC01\uC758 \uAC1C\uC218\uB9CC \uB354\uD569\uB2C8\uB2E4."));
a(2, 1, "fraction-two-stage-restoration", "4\uC21801-15", 3, "\uC4F4 \uC591\xB7\uCD94\uAC00\uD55C \uC591\xB7\uB9C8\uC9C0\uB9C9 \uC591\uC5D0\uC11C \uCC98\uC74C \uC591 \uCC3E\uAE30", () => E("\uC5B4\uB5A4 \uC591\uC758 \uBB3C\uC5D0\uC11C 3/7 L\uB97C \uC4F4 \uB4A4 2/7 L\uB97C \uB123\uC5C8\uB354\uB2C8 6/7 L\uAC00 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uCC98\uC74C \uC591\uC744 L \uB2E8\uC704\uC758 \uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.", ["6/7", "2/7", "-", "3/7", "+"], "\uB9C8\uC9C0\uB9C9\uC5D0 \uB123\uC740 \uC591\uC744 \uBE7C\uACE0 \uADF8\uC804\uC5D0 \uC4F4 \uC591\uC744 \uB354\uD558\uC5EC \uB418\uB3CC\uB9AC\uBA74 {answer} L\uC785\uB2C8\uB2E4."));
a(2, 2, "equilateral-angle", "4\uC21803-25", 3, "\uC815\uC0BC\uAC01\uD615\uC758 \uAC19\uC740 \uC138 \uAC01\uACFC \uB0B4\uAC01 \uD569 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uC815\uC0BC\uAC01\uD615\uC758 \uB450 \uB0B4\uAC01\uC758 \uD06C\uAE30\uB97C \uD569\uD558\uBA74 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?`, [180, 3, "/", 2, "*"], "\uD55C \uB0B4\uAC01 60\xB0\uB97C \uB450 \uBC88 \uB354\uD558\uBA74 {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"), 1);
a(2, 2, "isosceles-base-from-apex", "4\uC21803-25", 3, "\uAF2D\uC9C0\uAC01\uACFC \uAC19\uC740 \uB450 \uBC11\uAC01\uC73C\uB85C \uAC01 \uAD6C\uD558\uAE30", (k) => E(`\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615\uC758 \uAF2D\uC9C0\uAC01\uC774 ${40 + 2 * k}\xB0\uC785\uB2C8\uB2E4. \uB450 \uBC11\uAC01 \uC911 \uD55C \uAC01\uC740 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?`, [180, 40 + 2 * k, "-", 2, "/"], "\uB0A8\uC740 \uB450 \uAC01\uC758 \uD569\uC744 \uB458\uB85C \uB098\uB204\uBA74 {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"), 12);
a(2, 2, "right-triangle-two-acute", "4\uC21803-09", 1, "\uC9C1\uAC01\uC0BC\uAC01\uD615\uC758 \uB2E4\uB978 \uB450 \uAC01 \uC774\uD574\uD558\uAE30", () => C("\uC9C1\uAC01\uC0BC\uAC01\uD615\uC758 \uB098\uBA38\uC9C0 \uB450 \uAC01\uC740 \uC5B4\uB5A4 \uAC01\uC785\uB2C8\uAE4C?", "\uB458 \uB2E4 \uC608\uAC01", [["\uB458 \uB2E4 \uC9C1\uAC01", "\uB0B4\uAC01 \uD569 \uC870\uAC74 \uC704\uBC18"], ["\uB458 \uB2E4 \uB454\uAC01", "\uB0B4\uAC01 \uD569 \uC870\uAC74 \uC704\uBC18"]], "\uD55C \uC9C1\uAC01\uC744 \uBE7C\uBA74 \uB450 \uAC01\uC758 \uD569\uC740 90\xB0\uC774\uBBC0\uB85C \uAC01\uAC01 \uC608\uAC01\uC785\uB2C8\uB2E4."));
a(2, 2, "side-category-not-angle", "4\uC21803-08", 2, "\uBCC0\uACFC \uAC01\uC5D0 \uB530\uB978 \uBD84\uB958 \uAE30\uC900 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615\uC774\uB77C\uB294 \uC774\uB984\uC744 \uD310\uB2E8\uD560 \uB54C \uBA3C\uC800 \uD655\uC778\uD560 \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uAC19\uC740 \uAE38\uC774\uC758 \uBCC0\uC774 \uC788\uB294\uC9C0", [["\uC9C1\uAC01\uC774 \uC788\uB294\uC9C0\uB9CC \uD655\uC778\uD55C\uB2E4", "\uAC01 \uBD84\uB958\uC640 \uBCC0 \uBD84\uB958 \uD63C\uB3D9"], ["\uAC00\uC7A5 \uAE34 \uBCC0\uB9CC \uC7B0\uB2E4", "\uB450 \uBCC0\uC758 \uAC19\uC74C\uC744 \uD655\uC778\uD558\uC9C0 \uC54A\uC74C"]], "\uBCC0 \uAE38\uC774\uC5D0 \uB530\uB978 \uBD84\uB958\uC5D0\uC11C\uB294 \uAC19\uC740 \uAE38\uC774\uC758 \uBCC0\uC744 \uD655\uC778\uD569\uB2C8\uB2E4."));
a(2, 2, "all-angles-equal", "4\uC21803-25", 3, "\uAC19\uC740 \uC138 \uAC01\uC758 \uD06C\uAE30 \uAD6C\uD558\uAE30", () => E("\uC0BC\uAC01\uD615\uC758 \uC138 \uB0B4\uAC01\uC774 \uBAA8\uB450 \uAC19\uC2B5\uB2C8\uB2E4. \uD55C \uB0B4\uAC01\uC740 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?", [180, 3, "/"], "\uAC19\uC740 \uC138 \uAC01\uC758 \uD569\uC774 180\xB0\uC774\uBBC0\uB85C \uD55C \uAC01\uC740 {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"));
a(2, 2, "obtuse-one-only", "4\uC21803-09", 3, "\uB454\uAC01\uC0BC\uAC01\uD615\uC5D0\uC11C \uB450 \uB454\uAC01\uC774 \uBD88\uAC00\uB2A5\uD568 \uD310\uB2E8\uD558\uAE30", () => C("\uC0BC\uAC01\uD615\uC5D0 \uB454\uAC01\uC774 \uB450 \uAC1C \uC788\uC744 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uAC01 \uB450 \uAC1C\uB9CC\uC73C\uB85C 180\xB0\uB97C \uB118\uB294 \uC870\uAC74 \uB204\uB77D"]], "\uB450 \uB454\uAC01\uC758 \uD569\uC740 180\xB0\uBCF4\uB2E4 \uCEE4\uC9C0\uBBC0\uB85C \uC0BC\uAC01\uD615 \uB0B4\uAC01 \uD569\uACFC \uB9DE\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."));
a(2, 2, "angle-classification-boundary", "4\uC21803-09", 2, "90\xB0 \uACBD\uACC4\uC5D0\uC11C \uC0BC\uAC01\uD615 \uBD84\uB958\uD558\uAE30", () => C("\uD55C \uB0B4\uAC01\uC774 \uC815\uD655\uD788 90\xB0\uC778 \uC0BC\uAC01\uD615\uC744 \uACE0\uB974\uC138\uC694.", "\uC9C1\uAC01\uC0BC\uAC01\uD615", [["\uB454\uAC01\uC0BC\uAC01\uD615", "\uACBD\uACC4 90\xB0\uB97C \uCD08\uACFC\uB85C \uC624\uC778"], ["\uC608\uAC01\uC0BC\uAC01\uD615", "\uC138 \uAC01 \uBAA8\uB450 90\xB0 \uBBF8\uB9CC \uC870\uAC74 \uB204\uB77D"]], "\uC815\uD655\uD788 90\xB0\uC778 \uAC01\uC774 \uC788\uC73C\uBA74 \uC9C1\uAC01\uC0BC\uAC01\uD615\uC785\uB2C8\uB2E4."));
a(2, 2, "classification-both-criteria", "4\uC21803-08", 3, "\uBCC0\uC758 \uAC19\uC74C\uACFC \uC9C1\uAC01 \uC870\uAC74\uC744 \uB3D9\uC2DC\uC5D0 \uBD84\uB958\uD558\uAE30", () => C("\uC0BC\uAC01\uD615\uC5D0 \uAC19\uC740 \uAE38\uC774\uC758 \uB450 \uBCC0\uC774 \uC788\uACE0 \uD55C \uB0B4\uAC01\uC774 \uC9C1\uAC01\uC785\uB2C8\uB2E4. \uB450 \uAE30\uC900\uC5D0 \uB530\uB978 \uC774\uB984\uC744 \uBC14\uB974\uAC8C \uC9DD\uC9C0\uC73C\uC138\uC694.", "\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615\uC774\uBA70 \uC9C1\uAC01\uC0BC\uAC01\uD615", [["\uC815\uC0BC\uAC01\uD615\uC774\uBA70 \uC9C1\uAC01\uC0BC\uAC01\uD615", "\uAC19\uC740 \uB450 \uBCC0\uC744 \uC138 \uBCC0\uC73C\uB85C \uC624\uC778"], ["\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615\uC774\uBA70 \uB454\uAC01\uC0BC\uAC01\uD615", "\uC9C1\uAC01 \uC870\uAC74 \uBB34\uC2DC"]], "\uBCC0\uC758 \uAE30\uC900\uC73C\uB85C \uC774\uB4F1\uBCC0, \uAC01\uC758 \uAE30\uC900\uC73C\uB85C \uC9C1\uAC01\uC785\uB2C8\uB2E4."));
a(2, 2, "equal-angle-reconstruct", "4\uC21803-25", 3, "\uBC11\uAC01\uACFC \uAF2D\uC9C0\uAC01\uC744 \uC11C\uB85C \uB2E4\uB978 \uC815\uBCF4\uB85C \uD655\uC778\uD558\uAE30", () => C("\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615\uC758 \uBC11\uAC01 \uD558\uB098\uAC00 55\xB0\uC785\uB2C8\uB2E4. \uB450 \uBC11\uAC01\uACFC \uAF2D\uC9C0\uAC01\uC744 \uBC14\uB974\uAC8C \uB098\uD0C0\uB0B4\uC138\uC694.", "55\xB0, 55\xB0, 70\xB0", [["55\xB0, 70\xB0, 55\xB0\uC774\uBA70 \uAF2D\uC9C0\uAC01\uC740 55\xB0", "\uAC19\uC740 \uBC11\uAC01 \uB300\uC751\uC744 \uBC14\uAFC8"], ["55\xB0, 55\xB0, 80\xB0", "\uB0B4\uAC01 \uD569 \uC624\uB958"]], "\uBC11\uAC01 \uB458\uC740 \uAC19\uACE0 \uAF2D\uC9C0\uAC01\uC740 180\xB0\uC5D0\uC11C 110\xB0\uB97C \uBE80 70\xB0\uC785\uB2C8\uB2E4."));
a(2, 2, "information-sufficient", "4\uC21803-09", 3, "\uAC01 \uBD84\uB958\uC5D0 \uCDA9\uBD84\uD55C \uC815\uBCF4 \uD310\uB2E8\uD558\uAE30", () => C("\uD55C \uAC01\uC774 105\xB0\uB77C\uB294 \uC815\uBCF4\uB9CC\uC73C\uB85C \uC0BC\uAC01\uD615\uC758 \uAC01\uC5D0 \uB530\uB978 \uC885\uB958\uB97C \uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uB454\uAC01\uC0BC\uAC01\uD615\uC73C\uB85C \uC815\uD560 \uC218 \uC788\uB2E4", [["\uB098\uBA38\uC9C0 \uB450 \uAC01\uC744 \uC54C\uC544\uC57C\uB9CC \uC815\uD560 \uC218 \uC788\uB2E4", "\uB454\uAC01 \uD558\uB098\uC758 \uC870\uAC74\uC744 \uC801\uC6A9\uD558\uC9C0 \uC54A\uC74C"], ["\uC9C1\uAC01\uC0BC\uAC01\uD615\uC73C\uB85C \uC815\uD55C\uB2E4", "105\xB0\uC640 90\xB0 \uD63C\uB3D9"]], "\uD55C \uB454\uAC01\uC774 \uC788\uB2E4\uB294 \uAC83\uB9CC\uC73C\uB85C \uB454\uAC01\uC0BC\uAC01\uD615\uC785\uB2C8\uB2E4."));
a(2, 2, "side-equality-sufficiency", "4\uC21803-08", 3, "\uBAA8\uB4E0 \uBCC0 \uBE44\uAD50\uAC00 \uD544\uC694\uD55C \uBD84\uB958 \uC774\uD574\uD558\uAE30", () => C("\uC0BC\uAC01\uD615\uC758 \uB450 \uBCC0\uC774 6 cm\uC640 6 cm\uC785\uB2C8\uB2E4. \uC138 \uBCC0\uC774 \uBAA8\uB450 \uAC19\uC740\uC9C0\uAE4C\uC9C0 \uC815\uD558\uB824\uBA74 \uBB34\uC5C7\uC744 \uB354 \uC54C\uC544\uC57C \uD569\uB2C8\uAE4C?", "\uB098\uBA38\uC9C0 \uBCC0\uC758 \uAE38\uC774", [["\uC0BC\uAC01\uD615\uC758 \uC0C9", "\uAE38\uC774 \uC870\uAC74\uACFC \uBB34\uAD00\uD55C \uC815\uBCF4"], ["\uB3C4\uD615\uC758 \uC885\uC774 \uC885\uB958", "\uAE38\uC774 \uC870\uAC74\uACFC \uBB34\uAD00\uD55C \uC815\uBCF4"]], "\uB098\uBA38\uC9C0 \uBCC0\uB3C4 6 cm\uC778\uC9C0 \uD655\uC778\uD574\uC57C \uC815\uC0BC\uAC01\uD615\uC778\uC9C0 \uC54C \uC218 \uC788\uC2B5\uB2C8\uB2E4."));
a(2, 2, "angle-constraint-strategy", "4\uC21803-25", 4, "\uD569\uACFC \uBE44\uAD50 \uC870\uAC74\uC73C\uB85C \uAC00\uB2A5\uD55C \uAC01 \uC870\uD569 \uC120\uD0DD\uD558\uAE30", () => C("\uC0BC\uAC01\uD615\uC758 \uB450 \uAC01\uC740 \uAC19\uC73C\uBA70 \uAC01\uAC01 \uAC00\uC7A5 \uD070 \uAC01\uBCF4\uB2E4 \uC791\uC2B5\uB2C8\uB2E4. \uAC00\uC7A5 \uD070 \uAC01\uC740 80\xB0\uC77C \uB54C \uAC00\uB2A5\uD55C \uC138 \uAC01\uC744 \uACE0\uB974\uC138\uC694.", "50\xB0, 50\xB0, 80\xB0", [["80\xB0, 80\xB0, 20\xB0", "\uAC19\uC740 \uB450 \uAC01\uC774 \uCD5C\uB300\uAC01\uBCF4\uB2E4 \uC791\uB2E4\uB294 \uC870\uAC74 \uC704\uBC18"], ["40\xB0, 40\xB0, 100\xB0", "\uAC00\uC7A5 \uD070 \uAC01 80\xB0 \uC870\uAC74 \uC704\uBC18"]], "80\xB0\uB97C \uBE7C\uBA74 100\xB0\uAC00 \uB0A8\uC2B5\uB2C8\uB2E4. \uAC19\uC740 \uB450 \uC791\uC740 \uAC01\uC740 \uAC01\uAC01 50\xB0\uC785\uB2C8\uB2E4."));
a(1, 4, "route-horizontal-unknown", "4\uC21803-05", 3, "\uC774\uB3D9 \uC21C\uC11C\uC640 \uB3C4\uCC29 \uC704\uCE58\uB85C \uD544\uC694\uD55C \uC774\uB3D9 \uCC3E\uAE30", (k) => E(`\uC624\uB978\uCABD\uC73C\uB85C 5\uCE78 \uAC04 \uB4A4 \uB2E4\uC2DC \uC624\uB978\uCABD\uC73C\uB85C \uC774\uB3D9\uD558\uC5EC \uCC98\uC74C \uC704\uCE58\uC758 \uC624\uB978\uCABD ${9 + k}\uCE78\uC5D0 \uB3C4\uCC29\uD588\uC2B5\uB2C8\uB2E4. \uB450 \uBC88\uC9F8 \uC774\uB3D9\uC740 \uBA87 \uCE78\uC785\uB2C8\uAE4C?`, [9 + k, 5, "-"], "\uCD1D \uC774\uB3D9\uC5D0\uC11C \uCCAB \uC774\uB3D9\uC744 \uBE7C\uBA74 {answer}\uCE78\uC785\uB2C8\uB2E4.", "\uCE78"), 12);
a(1, 4, "translation-angle", "4\uC21803-04", 1, "\uBC00\uAE30\uC5D0\uC11C \uBC29\uD5A5 \uC720\uC9C0 \uD655\uC778\uD558\uAE30", () => C("\uC704\uCABD \uD654\uC0B4\uD45C\uB97C \uC67C\uCABD\uC73C\uB85C \uBC00\uC5C8\uC2B5\uB2C8\uB2E4. \uD654\uC0B4\uD45C\uAC00 \uAC00\uB9AC\uD0A4\uB294 \uBC29\uD5A5\uC744 \uACE0\uB974\uC138\uC694.", "\uC704\uCABD", [["\uC67C\uCABD", "\uC774\uB3D9 \uBC29\uD5A5\uACFC \uD654\uC0B4\uD45C \uBC29\uD5A5 \uD63C\uB3D9"], ["\uC544\uB798\uCABD", "\uBC00\uAE30\uC640 \uB3CC\uB9AC\uAE30 \uD63C\uB3D9"]], "\uBC00\uAE30\uB294 \uD654\uC0B4\uD45C\uC758 \uBC29\uD5A5\uC744 \uBC14\uAFB8\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."));
a(1, 4, "four-quarter-turns", "4\uC21803-04", 2, "\uC5F0\uC18D \uB3CC\uB9AC\uAE30\uB85C \uC6D0\uB798 \uBC29\uD5A5 \uB3CC\uC544\uC624\uAE30", () => M("\uC624\uB978\uCABD \uD654\uC0B4\uD45C\uB97C \uC2DC\uACC4 \uBC29\uD5A5\uC73C\uB85C 90\xB0\uC529 \uB124 \uBC88 \uB3CC\uB838\uC2B5\uB2C8\uB2E4. \uB9C8\uC9C0\uB9C9 \uBC29\uD5A5\uC744 \uC801\uC73C\uC138\uC694.", "geometry", "direction", { shape: "transform", direction: "right", operations: ["rotate90", "rotate90", "rotate90", "rotate90"] }, "\uD55C \uBC14\uD034 \uB3CC\uC544 \uCC98\uC74C \uBC29\uD5A5\uC778 {answer}\uC785\uB2C8\uB2E4."));
a(1, 4, "two-half-turns", "4\uC21803-04", 2, "\uBC18 \uBC14\uD034 \uB3CC\uB9AC\uAE30 \uB450 \uBC88\uC758 \uACB0\uACFC \uCC3E\uAE30", () => M("\uC544\uB798\uCABD \uD654\uC0B4\uD45C\uB97C \uBC18 \uBC14\uD034 \uB3CC\uB9AC\uACE0 \uB2E4\uC2DC \uBC18 \uBC14\uD034 \uB3CC\uB838\uC2B5\uB2C8\uB2E4. \uB9C8\uC9C0\uB9C9 \uBC29\uD5A5\uC744 \uC801\uC73C\uC138\uC694.", "geometry", "direction", { shape: "transform", direction: "down", operations: ["rotate180", "rotate180"] }, "\uB450 \uBC88\uC758 \uBC18 \uBC14\uD034\uB294 \uD55C \uBC14\uD034\uC774\uBBC0\uB85C {answer}\uC785\uB2C8\uB2E4."));
a(1, 4, "vertical-flip-direction", "4\uC21803-04", 2, "\uC704\uC544\uB798 \uB4A4\uC9D1\uAE30\uC758 \uBC29\uD5A5 \uBCC0\uD654 \uD310\uB2E8\uD558\uAE30", () => M("\uC544\uB798\uCABD \uD654\uC0B4\uD45C\uB97C \uC704\uC544\uB798\uB85C \uB4A4\uC9D1\uC5C8\uC2B5\uB2C8\uB2E4. \uB9C8\uC9C0\uB9C9 \uBC29\uD5A5\uC744 \uC801\uC73C\uC138\uC694.", "geometry", "direction", { shape: "transform", direction: "down", operations: ["flip-vertical"] }, "\uC704\uC640 \uC544\uB798\uAC00 \uBC14\uB00C\uC5B4 {answer}\uB97C \uAC00\uB9AC\uD0B5\uB2C8\uB2E4."));
a(1, 4, "position-not-size", "4\uC21803-04", 1, "\uC704\uCE58 \uBCC0\uD654\uC640 \uD06C\uAE30 \uBCC0\uD654 \uAD6C\uBCC4\uD558\uAE30", () => C("\uB3C4\uD615\uC744 \uB4A4\uC9D1\uC5C8\uC744 \uB54C \uC6D0\uB798 \uB3C4\uD615\uACFC \uBE44\uAD50\uD558\uC5EC \uC720\uC9C0\uB418\uB294 \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uBCC0\uC758 \uAE38\uC774\uC640 \uAC01\uC758 \uD06C\uAE30", [["\uBAA8\uB4E0 \uC810\uC758 \uC704\uCE58", "\uC704\uCE58\uAE4C\uC9C0 \uC720\uC9C0\uD55C\uB2E4\uACE0 \uD310\uB2E8"], ["\uD56D\uC0C1 \uAF2D\uC9D3\uC810\uC758 \uBC29\uD5A5", "\uBC29\uD5A5 \uBCC0\uD654 \uBB34\uC2DC"]], "\uB4A4\uC9D1\uAE30\uB294 \uD06C\uAE30\uC640 \uBAA8\uC591\uC744 \uC720\uC9C0\uD558\uBA74\uC11C \uC704\uCE58\uC640 \uBC29\uD5A5\uC744 \uBC14\uAFC9\uB2C8\uB2E4."));
a(1, 4, "rotation-then-flip", "4\uC21803-04", 3, "\uC11C\uB85C \uB2E4\uB978 \uB450 \uBCC0\uD658\uC758 \uC21C\uC11C \uC0AC\uC6A9\uD558\uAE30", () => M("\uC704\uCABD \uD654\uC0B4\uD45C\uB97C \uC2DC\uACC4 \uBC29\uD5A5\uC73C\uB85C 90\xB0 \uB3CC\uB9B0 \uB4A4 \uC88C\uC6B0\uB85C \uB4A4\uC9D1\uC5C8\uC2B5\uB2C8\uB2E4. \uB9C8\uC9C0\uB9C9 \uBC29\uD5A5\uC744 \uC801\uC73C\uC138\uC694.", "geometry", "direction", { shape: "transform", direction: "up", operations: ["rotate90", "flip-horizontal"] }, "\uBA3C\uC800 \uC624\uB978\uCABD\uC744 \uAC00\uB9AC\uD0A4\uACE0 \uC88C\uC6B0 \uB4A4\uC9D1\uAE30 \uD6C4 {answer}\uB97C \uAC00\uB9AC\uD0B5\uB2C8\uB2E4."));
a(1, 4, "inverse-two-transforms", "4\uC21803-04", 4, "\uCD5C\uC885 \uBC29\uD5A5\uC5D0\uC11C \uBCC0\uD658\uC744 \uAC70\uAFB8\uB85C \uD655\uC778\uD558\uAE30", () => C("\uD654\uC0B4\uD45C\uB97C \uBC18 \uBC14\uD034 \uB3CC\uB9B0 \uB4A4 \uC88C\uC6B0\uB85C \uB4A4\uC9D1\uC5C8\uB354\uB2C8 \uC67C\uCABD\uC744 \uAC00\uB9AC\uCF30\uC2B5\uB2C8\uB2E4. \uCC98\uC74C \uBC29\uD5A5\uC744 \uACE0\uB974\uC138\uC694.", "\uC67C\uCABD", [["\uC624\uB978\uCABD", "\uD55C \uBCC0\uD658\uB9CC \uAC70\uAFB8\uB85C \uC801\uC6A9"], ["\uC704\uCABD", "\uD68C\uC804 \uBC29\uD5A5 \uD63C\uB3D9"]], "\uB4A4\uC9D1\uAE30 \uC804\uC5D0\uB294 \uC624\uB978\uCABD, \uBC18 \uBC14\uD034 \uB3CC\uB9AC\uAE30 \uC804\uC5D0\uB294 \uC67C\uCABD\uC785\uB2C8\uB2E4."));
a(1, 4, "different-directions-count", "4\uC21803-05", 3, "\uACA9\uC790 \uAE38\uACFC \uB450 \uBC29\uD5A5\uC758 \uC774\uB3D9 \uC815\uBCF4 \uC5F0\uACB0\uD558\uAE30", () => E("\uC624\uB978\uCABD\uC73C\uB85C 4\uCE78, \uC704\uB85C 3\uCE78 \uAC04 \uB4A4 \uC624\uB978\uCABD\uC73C\uB85C 2\uCE78 \uB354 \uAC14\uC2B5\uB2C8\uB2E4. \uCD9C\uBC1C\uC810\uC758 \uC624\uB978\uCABD\uC73C\uB85C\uB294 \uBAA8\uB450 \uBA87 \uCE78\uC785\uB2C8\uAE4C?", [4, 2, "+"], "\uC624\uB978\uCABD \uC774\uB3D9\uB9CC \uD569\uD558\uBA74 {answer}\uCE78\uC774\uACE0 \uC704\uCABD \uC774\uB3D9\uC740 \uC774 \uAC12\uC5D0 \uB354\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", "\uCE78"));
a(1, 4, "blocked-route-choice", "4\uC21803-05", 4, "\uB3C4\uCC29 \uC704\uCE58\uC640 \uAE08\uC9C0 \uBC29\uD5A5\uC744 \uD568\uAED8 \uACE0\uB824\uD558\uAE30", () => C("\uCD9C\uBC1C\uC810\uC758 \uC624\uB978\uCABD 2\uCE78, \uC704\uCABD 1\uCE78\uC5D0 \uB3C4\uCC29\uD558\uB824 \uD569\uB2C8\uB2E4. \uC67C\uCABD\uC774\uB098 \uC544\uB798\uCABD \uC774\uB3D9 \uC5C6\uC774 \uAC08 \uC218 \uC788\uB294 \uAE38\uC744 \uACE0\uB974\uC138\uC694.", "\uC624\uB978\uCABD 1\uCE78, \uC704\uCABD 1\uCE78, \uC624\uB978\uCABD 1\uCE78", [["\uC624\uB978\uCABD 2\uCE78, \uC544\uB798\uCABD 1\uCE78", "\uB3C4\uCC29 \uC704\uCE58 \uC870\uAC74 \uC704\uBC18"], ["\uC67C\uCABD 1\uCE78, \uC704\uCABD 1\uCE78, \uC624\uB978\uCABD 3\uCE78", "\uAE08\uC9C0 \uBC29\uD5A5 \uC870\uAC74 \uC704\uBC18"]], "\uB3C4\uCC29 \uC704\uCE58\uC640 \uD5C8\uC6A9 \uBC29\uD5A5\uC744 \uBAA8\uB450 \uD655\uC778\uD574\uC57C \uD569\uB2C8\uB2E4."));
a(1, 4, "transform-order-strategy", "4\uC21803-04", 4, "\uC21C\uC11C\uAC00 \uB2E4\uB978 \uBCC0\uD658\uC758 \uACB0\uACFC\uB97C \uAC01\uAC01 \uBE44\uAD50\uD558\uAE30", () => C("\uC704\uCABD \uD654\uC0B4\uD45C\uC5D0 A\uBC29\uBC95\uC740 \uC2DC\uACC4 \uBC29\uD5A5 90\xB0 \uB3CC\uB9B0 \uB4A4 \uC88C\uC6B0 \uB4A4\uC9D1\uAE30, B\uBC29\uBC95\uC740 \uC88C\uC6B0 \uB4A4\uC9D1\uC740 \uB4A4 \uC2DC\uACC4 \uBC29\uD5A5 90\xB0 \uB3CC\uB9AC\uAE30\uC785\uB2C8\uB2E4. \uB450 \uACB0\uACFC\uB97C \uBC14\uB974\uAC8C \uBE44\uAD50\uD558\uC138\uC694.", "A\uB294 \uC67C\uCABD, B\uB294 \uC624\uB978\uCABD", [["\uB458 \uB2E4 \uC624\uB978\uCABD", "\uBCC0\uD658 \uC21C\uC11C\uC758 \uC601\uD5A5 \uBB34\uC2DC"], ["\uB458 \uB2E4 \uC67C\uCABD", "\uCCAB \uBC29\uBC95\uC744 \uB450 \uBC29\uBC95\uC5D0 \uADF8\uB300\uB85C \uC801\uC6A9"]], "A\uB294 \uC704\u2192\uC624\uB978\uCABD\u2192\uC67C\uCABD, B\uB294 \uC704\u2192\uC704\u2192\uC624\uB978\uCABD\uC785\uB2C8\uB2E4. \uC21C\uC11C\uB97C \uAC01\uAC01 \uB530\uB77C \uD655\uC778\uD569\uB2C8\uB2E4."));

// learning-review-r1/native/data/final-expansion-grade4b.js
var a2 = (u, id, code, l, o, fn, domain = 1) => A(4, 2, u, "FINAL-" + id, code, l, o, fn, domain);
a2(3, "decimal-two-changes", "4\uC21801-16", 3, "\uC18C\uC218 \uC591\uC758 \uB450 \uBCC0\uD654\uB97C \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uBB3C ${dec(240 + k, 100)} L\uC5D0 0.35 L\uB97C \uB123\uACE0 0.6 L\uB97C \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uC591\uC740 \uBA87 L\uC785\uB2C8\uAE4C?`, [dec(240 + k, 100), "0.35", "+", "0.6", "-"], "\uB123\uC740 \uC591\uC744 \uB354\uD558\uACE0 \uC0AC\uC6A9\uD55C \uC591\uC744 \uBE7C\uBA74 {answer} L\uC785\uB2C8\uB2E4.", "L"), 16);
a2(3, "decimal-gap-to-target", "4\uC21801-16", 3, "\uBAA9\uD45C \uC591\uACFC \uD604\uC7AC \uC591\uC758 \uCC28 \uAD6C\uD558\uAE30", (k) => E(`\uB048\uC744 5 m \uC900\uBE44\uD558\uB824 \uD569\uB2C8\uB2E4. \uD604\uC7AC ${dec(230 + k, 100)} m\uAC00 \uC788\uC73C\uBA74 \uBA87 m\uB97C \uB354 \uC900\uBE44\uD574\uC57C \uD569\uB2C8\uAE4C?`, [5, dec(230 + k, 100), "-"], "\uBAA9\uD45C \uAE38\uC774\uC5D0\uC11C \uD604\uC7AC \uAE38\uC774\uB97C \uBE7C\uBA74 {answer} m\uC785\uB2C8\uB2E4.", "m"), 16);
a2(3, "decimal-zero-place", "4\uC21801-13", 1, "\uC18C\uC218\uC758 0\uC774 \uB098\uD0C0\uB0B4\uB294 \uC790\uB9AC \uD655\uC778\uD558\uAE30", () => C("4.205\uC5D0\uC11C 0\uC774 \uC788\uB294 \uC790\uB9AC\uB97C \uACE0\uB974\uC138\uC694.", "\uC18C\uC218 \uB458\uC9F8 \uC790\uB9AC", [["\uC18C\uC218 \uCCAB\uC9F8 \uC790\uB9AC", "\uC790\uB9AC \uC21C\uC11C \uC624\uB958"], ["\uC18C\uC218 \uC14B\uC9F8 \uC790\uB9AC", "\uC790\uB9AC \uC21C\uC11C \uC624\uB958"]], "\uC18C\uC218\uC810 \uB2E4\uC74C 2, 0, 5\uB294 \uAC01\uAC01 \uCCAB\uC9F8, \uB458\uC9F8, \uC14B\uC9F8 \uC790\uB9AC\uC785\uB2C8\uB2E4."));
a2(3, "decimal-ten-tenths", "4\uC21801-13", 2, "\uC18C\uC218 \uBD80\uBD84\uC774 \uC804\uCCB4 1\uC744 \uC774\uB8E8\uB294 \uAD00\uACC4 \uC774\uD574\uD558\uAE30", () => C("0.1\uC774 10\uAC1C \uBAA8\uC778 \uC218\uB97C \uACE0\uB974\uC138\uC694.", "1", [["0.10", "\uC790\uB9BF\uAC12 \uC758\uBBF8 \uD63C\uB3D9"], ["10", "\uD55C \uBD80\uBD84\uC744 \uC804\uCCB4 1\uB85C \uD63C\uB3D9"]], "0.1\uC740 \uC804\uCCB4\uC758 \uC5F4 \uBD80\uBD84 \uC911 \uD558\uB098\uC774\uBBC0\uB85C \uC5F4 \uAC1C\uAC00 \uBAA8\uC774\uBA74 1\uC785\uB2C8\uB2E4."));
a2(3, "decimal-leading-zero", "4\uC21801-14", 2, "\uC18C\uC218\uC758 \uD06C\uAE30\uB97C \uC790\uB9AC\uB85C \uBE44\uAD50\uD558\uAE30", () => C("0.08\uACFC 0.8 \uC911 \uD070 \uC218\uB97C \uACE0\uB974\uC138\uC694.", "0.8", [["0.08", "\uC22B\uC790 \uC790\uB9AC \uC218\uB9CC \uBE44\uAD50"], ["\uAC19\uB2E4", "0\uC758 \uC790\uB9AC \uC5ED\uD560 \uB204\uB77D"]], "\uC18C\uC218 \uCCAB\uC9F8 \uC790\uB9AC\uB97C \uBE44\uAD50\uD558\uBA74 0.8\uC758 8\uC774 \uB354 \uD07D\uB2C8\uB2E4."));
a2(3, "decimal-place-carry", "4\uC21801-16", 3, "\uC18C\uC218 \uC790\uB9AC\uC5D0\uC11C \uC804\uCCB4 1\uB85C \uB118\uC5B4\uAC00\uB294 \uB367\uC148 \uC774\uD574\uD558\uAE30", () => C("0.78 + 0.35\uB97C \uB354\uD560 \uB54C \uC2ED\uBD84\uC758 \uC790\uB9AC \uD569 10\uC740 \uC5B4\uB290 \uC790\uB9AC\uC758 1\uB85C \uBC14\uAFB8\uC5B4 \uC801\uC2B5\uB2C8\uAE4C?", "\uC77C\uC758 \uC790\uB9AC", [["\uC2ED\uC758 \uC790\uB9AC", "\uC2ED\uBD84\uC758 \uC790\uB9AC 10\uC744 \uC5F4 \uBC30 \uD06C\uAC8C \uCC98\uB9AC"], ["\uBC31\uBD84\uC758 \uC790\uB9AC", "\uC2ED\uBD84\uC758 \uC790\uB9AC 10\uC744 \uC81C\uC790\uB9AC\uC5D0 \uB460"]], "\uC2ED\uBD84\uC758 \uC77C 10\uAC1C\uB294 \uC804\uCCB4 1\uC774\uBBC0\uB85C \uC77C\uC758 \uC790\uB9AC\uB85C \uC62E\uAE41\uB2C8\uB2E4."));
a2(3, "decimal-aligned-columns", "4\uC21801-16", 3, "\uC18C\uC218 \uB367\uC148\uC758 \uBC14\uB978 \uC790\uB9AC \uB9DE\uCDA4 \uD310\uB2E8\uD558\uAE30", () => C("2.4 + 0.36\uC744 \uC138\uB85C\uB85C \uACC4\uC0B0\uD560 \uB54C \uBB34\uC5C7\uC744 \uB9DE\uCD94\uC5B4\uC57C \uD569\uB2C8\uAE4C?", "\uC18C\uC218\uC810\uC758 \uC704\uCE58", [["\uB9E8 \uC624\uB978\uCABD \uC22B\uC790\uC758 \uC704\uCE58\uB9CC", "\uB2E4\uB978 \uC790\uB9BF\uAC12\uC744 \uB354\uD568"], ["\uCCAB \uC22B\uC790\uC758 \uC704\uCE58\uB9CC", "\uC790\uB9BF\uAC12 \uC815\uB82C \uAE30\uC900 \uC624\uB958"]], "\uC18C\uC218\uC810\uC744 \uB9DE\uCD94\uBA74 \uAC19\uC740 \uC790\uB9BF\uAC12\uB07C\uB9AC \uACC4\uC0B0\uD558\uAC8C \uB429\uB2C8\uB2E4."));
a2(3, "decimal-last-digit-value", "4\uC21801-13", 2, "\uC18C\uC218 \uC138 \uC790\uB9AC\uC758 \uB05D \uC22B\uC790\uAC00 \uB098\uD0C0\uB0B4\uB294 \uAC12 \uCC3E\uAE30", () => E("7.019\uC5D0\uC11C \uC22B\uC790 9\uAC00 \uB098\uD0C0\uB0B4\uB294 \uAC12\uC744 \uAD6C\uD558\uC138\uC694.", ["0.009"], "\uC18C\uC218 \uC14B\uC9F8 \uC790\uB9AC\uC758 9\uB294 0.001\uC774 \uC544\uD649 \uAC1C\uC774\uBBC0\uB85C {answer}\uC785\uB2C8\uB2E4.", "", "concept"));
a2(3, "decimal-equality-inverse", "4\uC21801-16", 3, "\uB3D9\uC77C\uD55C \uD569\uC744 \uB9CC\uB4DC\uB294 \uC18C\uC218 \uCC3E\uAE30", () => E("1.25 + \u25A1 = 0.9 + 1.4\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB97C \uAD6C\uD558\uC138\uC694.", ["0.9", "1.4", "+", "1.25", "-"], "\uC624\uB978\uCABD \uD569\uC5D0\uC11C \uC54C\uB824\uC9C4 \uC218\uB97C \uBE7C\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a2(3, "decimal-compare-three", "4\uC21801-14", 4, "\uC815\uB82C\uACFC \uBC94\uC704 \uC870\uAC74 \uD568\uAED8 \uD655\uC778\uD558\uAE30", () => C("3.05, 3.5, 3.15 \uC911 3.1\uBCF4\uB2E4 \uD06C\uACE0 \uAC00\uC7A5 \uC791\uC740 \uC218\uB97C \uACE0\uB974\uC138\uC694.", "3.15", [["3.05", "\uD558\uD55C \uC870\uAC74 \uC704\uBC18"], ["3.5", "\uCD5C\uC18C \uC870\uAC74 \uB204\uB77D"]], "3.1\uBCF4\uB2E4 \uD070 \uB450 \uC218 \uC911 3.15\uAC00 \uB354 \uC791\uC2B5\uB2C8\uB2E4."));
a2(3, "decimal-net-weight", "4\uC21801-16", 3, "\uC804\uCCB4 \uBB34\uAC8C\uC5D0\uC11C \uC6A9\uAE30 \uBB34\uAC8C \uBE7C\uAE30", () => E("\uC0C1\uC790\uC640 \uB0B4\uC6A9\uBB3C\uC758 \uBB34\uAC8C\uB294 4.25 kg\uC774\uACE0 \uBE48 \uC0C1\uC790\uB294 0.65 kg\uC785\uB2C8\uB2E4. \uB0B4\uC6A9\uBB3C\uC740 \uBA87 kg\uC785\uB2C8\uAE4C?", ["4.25", "0.65", "-"], "\uC804\uCCB4\uC5D0\uC11C \uBE48 \uC0C1\uC790\uC758 \uBB34\uAC8C\uB97C \uBE7C\uBA74 {answer} kg\uC785\uB2C8\uB2E4.", "kg"));
a2(3, "decimal-two-containers", "4\uC21801-16", 5, "\uB450 \uC6A9\uAE30\uC640 \uC62E\uAE34 \uC591\uC744 \uC5F0\uACB0\uD558\uC5EC \uCC28\uC774 \uD310\uB2E8\uD558\uAE30", () => C("A\uC5D0 2.8 L, B\uC5D0 1.6 L\uC758 \uBB3C\uC774 \uC788\uC2B5\uB2C8\uB2E4. A\uC5D0\uC11C B\uB85C 0.45 L\uB97C \uC62E\uAE34 \uB4A4 \uB354 \uB9CE\uC740 \uCABD\uACFC \uB450 \uC591\uC758 \uCC28\uB97C \uACE0\uB974\uC138\uC694.", "A\uAC00 0.3 L \uB354 \uB9CE\uB2E4", [["A\uAC00 0.75 L \uB354 \uB9CE\uB2E4", "A\uC5D0\uC11C \uBE60\uC9C4 \uC591\uB9CC \uBC18\uC601"], ["B\uAC00 0.3 L \uB354 \uB9CE\uB2E4", "\uC62E\uAE34 \uB4A4 \uB450 \uC591\uC758 \uBE44\uAD50 \uBC29\uD5A5 \uC624\uB958"]], "\uC62E\uAE34 \uB4A4 A\uB294 2.35 L, B\uB294 2.05 L\uC774\uBBC0\uB85C A\uAC00 0.3 L \uB354 \uB9CE\uC2B5\uB2C8\uB2E4."));
a2(4, "quad-angle-difference", "4\uC21803-25", 3, "\uB0B4\uAC01 \uB450 \uAC1C\uC758 \uD569\uACFC \uB098\uBA38\uC9C0 \uB450 \uAC01 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uC0AC\uAC01\uD615\uC758 \uB450 \uB0B4\uAC01 \uD569\uC774 ${150 + 2 * k}\xB0\uC774\uACE0 \uB098\uBA38\uC9C0 \uB450 \uAC01\uC740 \uAC19\uC2B5\uB2C8\uB2E4. \uAC19\uC740 \uB450 \uAC01 \uC911 \uD55C \uAC01\uC740 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?`, [360, 150 + 2 * k, "-", 2, "/"], "\uB0A8\uC740 \uD569\uC744 \uB458\uB85C \uB098\uB204\uBA74 {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"), 12);
a2(4, "right-quadrilateral-count", "4\uC21803-10", 2, "\uC9C1\uC0AC\uAC01\uD615\uC758 \uC9C1\uAC01 \uAC1C\uC218 \uC774\uD574\uD558\uAE30", () => E("\uC9C1\uC0AC\uAC01\uD615 \uB450 \uAC1C\uC5D0 \uC788\uB294 \uC9C1\uAC01\uC740 \uBAA8\uB450 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", [4, 2, "*"], "\uD55C \uB3C4\uD615\uC5D0 \uC9C1\uAC01 \uB124 \uAC1C\uAC00 \uC788\uC73C\uBBC0\uB85C \uBAA8\uB450 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 1);
a2(4, "parallel-definition", "4\uC21803-03", 1, "\uD3C9\uD589\uC120\uC758 \uB9CC\uB0A8 \uC870\uAC74 \uC774\uD574\uD558\uAE30", () => C("\uD55C \uD3C9\uBA74\uC5D0\uC11C \uB450 \uC9C1\uC120\uC774 \uD3C9\uD589\uD558\uB2E4\uB294 \uC124\uBA85\uC744 \uACE0\uB974\uC138\uC694.", "\uACC4\uC18D \uB298\uB824\uB3C4 \uC11C\uB85C \uB9CC\uB098\uC9C0 \uC54A\uB294\uB2E4", [["\uC9C0\uAE08 \uC885\uC774\uC5D0 \uADF8\uB9B0 \uBD80\uBD84\uB9CC \uB9CC\uB098\uC9C0 \uC54A\uB294\uB2E4", "\uC9C1\uC120\uC744 \uB298\uB838\uC744 \uB54C \uC870\uAC74 \uB204\uB77D"], ["\uC9C1\uAC01\uC73C\uB85C \uB9CC\uB09C\uB2E4", "\uC218\uC9C1\uACFC \uD63C\uB3D9"]], "\uD3C9\uD589\uD55C \uB450 \uC9C1\uC120\uC740 \uB298\uB824\uB3C4 \uB9CC\uB098\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."));
a2(4, "rectangle-not-all-equal", "4\uC21803-10", 2, "\uC9C1\uC0AC\uAC01\uD615\uACFC \uC815\uC0AC\uAC01\uD615 \uC870\uAC74 \uAD6C\uBCC4\uD558\uAE30", () => C("\uB124 \uAC01\uC774 \uC9C1\uAC01\uC778 \uC0AC\uAC01\uD615\uC5D0\uC11C \uC774\uC6C3\uD55C \uB450 \uBCC0\uC740 7 cm\uC640 4 cm\uC785\uB2C8\uB2E4. \uAC00\uC7A5 \uAD6C\uCCB4\uC801\uC778 \uC774\uB984\uC744 \uACE0\uB974\uC138\uC694.", "\uC9C1\uC0AC\uAC01\uD615", [["\uC815\uC0AC\uAC01\uD615", "\uB124 \uBCC0 \uAC19\uC74C \uC870\uAC74 \uB204\uB77D"], ["\uB9C8\uB984\uBAA8", "\uB124 \uBCC0 \uAC19\uC74C \uC870\uAC74 \uB204\uB77D"]], "\uB124 \uAC01\uC774 \uC9C1\uAC01\uC774\uACE0 \uC774\uC6C3\uD55C \uBCC0\uC774 \uB2EC\uB77C \uC815\uC0AC\uAC01\uD615\uC740 \uC544\uB2CC \uC9C1\uC0AC\uAC01\uD615\uC785\uB2C8\uB2E4."));
a2(4, "rhombus-opposite-parallel", "4\uC21803-10", 3, "\uC0AC\uAC01\uD615\uC758 \uD3EC\uD568 \uAD00\uACC4\uB85C \uC131\uC9C8 \uD310\uB2E8\uD558\uAE30", () => C("\uB9C8\uB984\uBAA8\uC758 \uB9C8\uC8FC \uBCF4\uB294 \uBCC0\uC740 \uD3C9\uD589\uD569\uB2C8\uAE4C?", "\uC608", [["\uC544\uB2C8\uC694", "\uB9C8\uB984\uBAA8\uC758 \uD3C9\uD589\uC0AC\uBCC0\uD615 \uC131\uC9C8\uC744 \uB204\uB77D"]], "\uB9C8\uB984\uBAA8\uB294 \uB9C8\uC8FC \uBCF4\uB294 \uB450 \uC30D\uC758 \uBCC0\uC774 \uD3C9\uD589\uD55C \uD3C9\uD589\uC0AC\uBCC0\uD615\uC758 \uC131\uC9C8\uC744 \uAC00\uC9D1\uB2C8\uB2E4."));
a2(4, "square-also-rhombus", "4\uC21803-10", 3, "\uC815\uC0AC\uAC01\uD615\uC758 \uBCC0 \uC870\uAC74\uC73C\uB85C \uB9C8\uB984\uBAA8 \uAD00\uACC4 \uC774\uD574\uD558\uAE30", () => C("\uC815\uC0AC\uAC01\uD615\uC744 \uB9C8\uB984\uBAA8\uB77C\uACE0\uB3C4 \uD560 \uC218 \uC788\uB294 \uAE4C\uB2ED\uC744 \uACE0\uB974\uC138\uC694.", "\uB124 \uBCC0\uC758 \uAE38\uC774\uAC00 \uBAA8\uB450 \uAC19\uAE30 \uB54C\uBB38\uC774\uB2E4", [["\uB124 \uAF2D\uC9D3\uC810\uC774 \uC788\uAE30 \uB54C\uBB38\uC774\uB2E4", "\uBAA8\uB4E0 \uC0AC\uAC01\uD615\uC774 \uB9CC\uC871\uD558\uB294 \uC870\uAC74"], ["\uD55C \uAC01\uB9CC \uC9C1\uAC01\uC774\uAE30 \uB54C\uBB38\uC774\uB2E4", "\uC815\uC0AC\uAC01\uD615\uC758 \uC870\uAC74\uC744 \uC798\uBABB \uB9D0\uD568"]], "\uC815\uC0AC\uAC01\uD615\uC740 \uB9C8\uB984\uBAA8\uC758 \uB124 \uBCC0\uC774 \uAC19\uB2E4\uB294 \uC870\uAC74\uC744 \uB9CC\uC871\uD569\uB2C8\uB2E4."));
a2(4, "perpendicular-pair-info", "4\uC21803-03", 2, "\uC218\uC9C1\uACFC \uD3C9\uD589\uC744 \uBCC4\uAC1C \uAD00\uACC4\uB85C \uD655\uC778\uD558\uAE30", () => C("\uB450 \uC9C1\uC120\uC774 \uD55C \uC810\uC5D0\uC11C \uB9CC\uB098\uC9C0\uB9CC \uC9C1\uAC01\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uB450 \uC9C1\uC120\uC758 \uAD00\uACC4\uB97C \uACE0\uB974\uC138\uC694.", "\uD3C9\uD589\uB3C4 \uC218\uC9C1\uB3C4 \uC544\uB2C8\uB2E4", [["\uD3C9\uD589\uC774\uB2E4", "\uB9CC\uB098\uC9C0 \uC54A\uB294 \uC870\uAC74 \uB204\uB77D"], ["\uC218\uC9C1\uC774\uB2E4", "\uC9C1\uAC01 \uC870\uAC74 \uB204\uB77D"]], "\uB9CC\uB098\uBBC0\uB85C \uD3C9\uD589\uC774 \uC544\uB2C8\uACE0 \uC9C1\uAC01\uC774 \uC544\uB2C8\uBBC0\uB85C \uC218\uC9C1\uB3C4 \uC544\uB2D9\uB2C8\uB2E4."));
a2(4, "parallelogram-inclusion", "4\uC21803-10", 3, "\uD3EC\uD568 \uAD00\uACC4\uC640 \uC815\uC758\uB97C \uD568\uAED8 \uC0AC\uC6A9\uD558\uAE30", () => C("\uD3C9\uD589\uD55C \uBCC0\uC774 \uC801\uC5B4\uB3C4 \uD55C \uC30D\uC774\uBA74 \uC0AC\uB2E4\uB9AC\uAF34\uB85C \uBD84\uB958\uD558\uAE30\uB85C \uD588\uC2B5\uB2C8\uB2E4. \uD3C9\uD589\uC0AC\uBCC0\uD615\uC744 \uC0AC\uB2E4\uB9AC\uAF34\uC774\uB77C\uACE0\uB3C4 \uD560 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC608", [["\uC544\uB2C8\uC694", "\uB450 \uC30D\uC774 \uD3C9\uD589\uD558\uBA74 \uD55C \uC30D \uC870\uAC74\uC744 \uB9CC\uC871\uD558\uC9C0 \uC54A\uB294\uB2E4\uACE0 \uC624\uC778"]], "\uB450 \uC30D\uC774 \uD3C9\uD589\uD558\uBA74 \uC801\uC5B4\uB3C4 \uD55C \uC30D\uC774\uB77C\uB294 \uC870\uAC74\uB3C4 \uB9CC\uC871\uD569\uB2C8\uB2E4."));
a2(4, "opposite-lengths", "4\uC21803-10", 3, "\uD3C9\uD589\uC0AC\uBCC0\uD615\uC758 \uB300\uC751 \uBCC0 \uAE38\uC774 \uAD6C\uD558\uAE30", () => E("\uD3C9\uD589\uC0AC\uBCC0\uD615 ABCD\uC5D0\uC11C AB\uB294 8 cm\uC785\uB2C8\uB2E4. \uB9C8\uC8FC \uBCF4\uB294 CD\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?", [8], "\uD3C9\uD589\uC0AC\uBCC0\uD615\uC758 \uB9C8\uC8FC \uBCF4\uB294 \uBCC0\uC740 \uAE38\uC774\uAC00 \uAC19\uC73C\uBBC0\uB85C {answer} cm\uC785\uB2C8\uB2E4.", "cm"));
a2(4, "angle-sum-check", "4\uC21803-25", 3, "\uB0B4\uAC01 \uD569\uC73C\uB85C \uC0AC\uAC01\uD615 \uC124\uBA85\uC758 \uC624\uB958 \uD655\uC778\uD558\uAE30", () => C("\uC0AC\uAC01\uD615\uC758 \uB124 \uB0B4\uAC01\uC774 80\xB0, 90\xB0, 100\xB0, 100\xB0\uB77C\uACE0 \uD569\uB2C8\uB2E4. \uBC14\uB978 \uD310\uB2E8\uC744 \uACE0\uB974\uC138\uC694.", "\uD569\uC774 360\xB0\uAC00 \uC544\uB2C8\uBBC0\uB85C \uC124\uBA85\uC774 \uB9DE\uC9C0 \uC54A\uB294\uB2E4", [["\uB124 \uAC01\uC774 \uC591\uC218\uC774\uBBC0\uB85C \uC5B8\uC81C\uB098 \uB9DE\uB2E4", "\uB0B4\uAC01 \uD569 \uC870\uAC74 \uB204\uB77D"], ["\uC9C1\uAC01\uC774 \uD558\uB098 \uC788\uC73C\uBBC0\uB85C \uB9DE\uB2E4", "\uB098\uBA38\uC9C0 \uC870\uAC74 \uB204\uB77D"]], "\uB124 \uAC01\uC758 \uD569\uC740 370\xB0\uB85C 360\xB0\uC640 \uB2E4\uB985\uB2C8\uB2E4."));
a2(4, "necessary-rectangle-info", "4\uC21803-10", 3, "\uD55C \uC9C1\uAC01\uACFC \uB124 \uC9C1\uAC01 \uC870\uAC74 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC0AC\uAC01\uD615\uC5D0 \uC9C1\uAC01 \uD558\uB098\uAC00 \uC788\uB2E4\uB294 \uC815\uBCF4\uB9CC\uC73C\uB85C \uC9C1\uC0AC\uAC01\uD615\uC774\uB77C\uACE0 \uD560 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uD55C \uAC01\uC744 \uB124 \uAC01 \uC804\uCCB4 \uC870\uAC74\uC73C\uB85C \uD655\uB300"]], "\uC9C1\uC0AC\uAC01\uD615\uC778\uC9C0 \uD310\uB2E8\uD558\uB824\uBA74 \uB124 \uAC01\uC774 \uBAA8\uB450 \uC9C1\uAC01\uC778\uC9C0 \uD655\uC778\uD574\uC57C \uD569\uB2C8\uB2E4."));
a2(4, "quad-angle-constraint", "4\uC21803-25", 3, "\uB0B4\uAC01 \uD569\uACFC \uAC19\uC740 \uAC01\uC758 \uAC1C\uC218\uB85C \uAC01 \uCC3E\uAE30", () => E("\uC0AC\uAC01\uD615\uC5D0 \uC9C1\uAC01 \uD558\uB098\uAC00 \uC788\uACE0 \uB098\uBA38\uC9C0 \uC138 \uAC01\uC774 \uBAA8\uB450 \uAC19\uC2B5\uB2C8\uB2E4. \uAC19\uC740 \uAC01 \uD558\uB098\uC758 \uD06C\uAE30\uB294 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?", [360, 90, "-", 3, "/"], "\uC9C1\uAC01\uC744 \uC81C\uC678\uD55C \uD569 270\xB0\uB97C \uC138 \uAC01\uC73C\uB85C \uB611\uAC19\uC774 \uB098\uB204\uBA74 {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"));
var growth = (k = 0) => [{ label: "1\uC8FC", value: 8 + k }, { label: "2\uC8FC", value: 11 + k }, { label: "3\uC8FC", value: 15 + k }];
a2(5, "growth-first-interval", "4\uC21804-02", 2, "\uAC19\uC740 \uAC04\uACA9 \uC790\uB8CC\uC758 \uCCAB \uBCC0\uD654\uB7C9 \uAD6C\uD558\uAE30", (k) => M("\uC2DD\uBB3C \uB192\uC774 \uD45C\uC5D0\uC11C 1\uC8FC\uC5D0\uC11C 2\uC8FC \uC0AC\uC774\uC5D0 \uC790\uB780 \uB192\uC774\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?", "foundation", "difference", { task: "graph", graphType: "table", rows: growth(k), a: "2\uC8FC", b: "1\uC8FC", valueUnit: "cm" }, "\uB4A4\uC758 \uB192\uC774\uC5D0\uC11C \uC55E\uC758 \uB192\uC774\uB97C \uBE7C\uBA74 {answer} cm\uC785\uB2C8\uB2E4.", "cm", "data-interpretation"), 12);
a2(5, "growth-target-left", "4\uC21804-03", 3, "\uC2DC\uAC04 \uC790\uB8CC\uC758 \uB9C8\uC9C0\uB9C9 \uAC12\uACFC \uBAA9\uD45C \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uC2DD\uBB3C\uC758 \uD604\uC7AC \uB192\uC774\uB294 ${15 + k} cm\uC774\uACE0 \uBAA9\uD45C\uB294 30 cm\uC785\uB2C8\uB2E4. \uC55E\uC73C\uB85C \uBA87 cm \uB354 \uC790\uB77C\uC57C \uD569\uB2C8\uAE4C?`, [30, 15 + k, "-"], "\uBAA9\uD45C\uC5D0\uC11C \uD604\uC7AC \uB192\uC774\uB97C \uBE7C\uBA74 {answer} cm\uC785\uB2C8\uB2E4.", "cm", "data-interpretation"), 12);
a2(5, "line-time-order", "4\uC21804-02", 1, "\uAEBE\uC740\uC120\uADF8\uB798\uD504\uC758 \uC2DC\uAC04 \uC21C\uC11C \uC774\uD574\uD558\uAE30", () => C("\uB9E4\uC77C\uC758 \uAE30\uC628 \uBCC0\uD654\uB97C \uAEBE\uC740\uC120\uADF8\uB798\uD504\uB85C \uB098\uD0C0\uB0B4\uB824 \uD569\uB2C8\uB2E4. \uAC00\uB85C\uCD95 \uB0A0\uC9DC\uB97C \uB193\uB294 \uBC14\uB978 \uC21C\uC11C\uB97C \uACE0\uB974\uC138\uC694.", "\uC2DC\uAC04\uC774 \uC9C0\uB09C \uC21C\uC11C", [["\uAE30\uC628\uC774 \uB192\uC740 \uB0A0\uC9DC\uBD80\uD130", "\uC2DC\uAC04 \uC21C\uC11C\uB97C \uC790\uB8CC \uD06C\uAE30 \uC21C\uC11C\uB85C \uBC14\uAFC8"], ["\uB0A0\uC9DC\uB97C \uC544\uBB34 \uC21C\uC11C\uB85C", "\uBCC0\uD654 \uD750\uB984\uC744 \uC783\uC74C"]], "\uBCC0\uD654\uB97C \uBCF4\uB824\uBA74 \uB0A0\uC9DC\uB97C \uC2DC\uAC04 \uC21C\uC11C\uB85C \uB193\uC2B5\uB2C8\uB2E4."));
a2(5, "line-flat-meaning", "4\uC21804-02", 2, "\uC218\uD3C9 \uAD6C\uAC04\uC758 \uC758\uBBF8 \uC77D\uAE30", () => C("\uAC19\uC740 \uC2DC\uAC04 \uAC04\uACA9\uC758 \uB450 \uC810\uC744 \uC774\uC740 \uAEBE\uC740\uC120\uC774 \uC218\uD3C9\uC785\uB2C8\uB2E4. \uC54C\uB9DE\uC740 \uB73B\uC744 \uACE0\uB974\uC138\uC694.", "\uB450 \uC2DC\uAC01\uC758 \uC790\uB8CC\uAC12\uC774 \uAC19\uB2E4", [["\uB450 \uAC12\uC774 \uBAA8\uB450 0\uC774\uB2E4", "\uAC19\uC740 \uAC12\uACFC 0 \uD63C\uB3D9"], ["\uC870\uC0AC\uB97C \uD558\uC9C0 \uC54A\uC558\uB2E4", "\uC790\uB8CC \uD45C\uC2DC \uC758\uBBF8 \uD63C\uB3D9"]], "\uB192\uC774\uAC00 \uAC19\uC73C\uBBC0\uB85C \uB450 \uAC12\uC774 \uAC19\uC2B5\uB2C8\uB2E4."));
a2(5, "line-total-change", "4\uC21804-02", 3, "\uC99D\uAC00\uC640 \uAC10\uC18C\uB97C \uC5F0\uACB0\uD574 \uC804\uCCB4 \uBCC0\uD654 \uAD6C\uD558\uAE30", () => E("\uC6D4\uC694\uC77C\uBCF4\uB2E4 \uD654\uC694\uC77C \uAE30\uC628\uC740 5\u2103 \uB192\uACE0, \uD654\uC694\uC77C\uBCF4\uB2E4 \uC218\uC694\uC77C\uC740 2\u2103 \uB0AE\uC2B5\uB2C8\uB2E4. \uC218\uC694\uC77C\uC740 \uC6D4\uC694\uC77C\uBCF4\uB2E4 \uBA87 \u2103 \uB192\uC2B5\uB2C8\uAE4C?", [5, 2, "-"], "\uC99D\uAC00\uB7C9\uC5D0\uC11C \uAC10\uC18C\uB7C9\uC744 \uBE7C\uBA74 {answer}\u2103 \uB192\uC2B5\uB2C8\uB2E4.", "\u2103", "data-interpretation"));
a2(5, "line-missing-day", "4\uC21804-03", 3, "\uBE60\uC9C4 \uC2DC\uAC04 \uC790\uB8CC\uB97C \uD568\uBD80\uB85C \uD655\uC815\uD558\uC9C0 \uC54A\uAE30", () => C("\uC6D4\uC694\uC77C\uACFC \uC218\uC694\uC77C\uB9CC \uCE21\uC815\uD588\uC2B5\uB2C8\uB2E4. \uB450 \uC810\uC744 \uC9C1\uC120\uC73C\uB85C \uC774\uC5C8\uC73C\uBBC0\uB85C \uD654\uC694\uC77C\uC758 \uC2E4\uC81C \uAC12\uB3C4 \uC815\uD655\uD788 \uCE21\uC815\uD588\uB2E4\uACE0 \uB9D0\uD560 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uC5F0\uACB0\uC120\uACFC \uC2E4\uC81C \uAD00\uCE21\uC744 \uD63C\uB3D9"]], "\uD654\uC694\uC77C\uC740 \uCE21\uC815\uD558\uC9C0 \uC54A\uC558\uC73C\uBBC0\uB85C \uC2E4\uC81C \uAC12\uC744 \uD655\uC815\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."));
a2(5, "largest-change-interval", "4\uC21804-02", 4, "\uC5EC\uB7EC \uAD6C\uAC04 \uBCC0\uD654\uB7C9 \uBE44\uAD50\uD558\uAE30", () => C("\uC2DC\uAC04 \uC21C\uC11C\uC758 \uB192\uC774\uAC00 8, 12, 13, 19 cm\uC785\uB2C8\uB2E4. \uAC00\uC7A5 \uB9CE\uC774 \uC790\uB780 \uAD6C\uAC04\uC744 \uACE0\uB974\uC138\uC694.", "\uC138 \uBC88\uC9F8\uC5D0\uC11C \uB124 \uBC88\uC9F8", [["\uCCAB \uBC88\uC9F8\uC5D0\uC11C \uB450 \uBC88\uC9F8", "\uBCC0\uD654\uB7C9 4\uB97C \uCD5C\uB313\uAC12\uC73C\uB85C \uC624\uC778"], ["\uB450 \uBC88\uC9F8\uC5D0\uC11C \uC138 \uBC88\uC9F8", "\uAC12\uACFC \uBCC0\uD654\uB7C9 \uD63C\uB3D9"]], "\uBCC0\uD654\uB7C9\uC740 4, 1, 6 cm\uC774\uBA70 \uB9C8\uC9C0\uB9C9 \uAD6C\uAC04\uC774 \uAC00\uC7A5 \uD07D\uB2C8\uB2E4."));
a2(5, "compare-same-scale", "4\uC21804-03", 4, "\uC11C\uB85C \uB2E4\uB978 \uCD95 \uAC04\uACA9\uC5D0\uC11C \uC790\uB8CC\uAC12 \uBE44\uAD50\uD558\uAE30", () => C("A\uADF8\uB798\uD504 \uD55C \uCE78\uC740 2\uBA85\uC774\uACE0 \uB9C9\uB300\uB294 5\uCE78, B\uADF8\uB798\uD504 \uD55C \uCE78\uC740 5\uBA85\uC774\uACE0 \uB9C9\uB300\uB294 3\uCE78\uC785\uB2C8\uB2E4. \uD070 \uC790\uB8CC\uAC12\uC744 \uACE0\uB974\uC138\uC694.", "B\uC758 15\uBA85", [["A\uC758 10\uBA85", "\uCE78 \uC218\uB9CC \uBE44\uAD50"], ["\uB450 \uAC12\uC774 \uAC19\uB2E4", "\uB208\uAE08 \uAC04\uACA9\uC744 \uB204\uB77D"]], "\uAC01 \uCE78\uC758 \uAC12\uC744 \uACF1\uD558\uBA74 A\uB294 10\uBA85, B\uB294 15\uBA85\uC785\uB2C8\uB2E4."));
a2(5, "line-unit-suitability", "4\uC21804-02", 2, "\uC790\uB8CC\uC758 \uC885\uB958\uC640 \uB2E8\uC704 \uC5F0\uACB0\uD558\uAE30", () => C("\uB9E4\uC77C \uC2DD\uBB3C\uC758 \uB192\uC774\uB97C \uB098\uD0C0\uB0B4\uB294 \uADF8\uB798\uD504\uC758 \uC138\uB85C\uCD95 \uB2E8\uC704\uB85C \uC54C\uB9DE\uC740 \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "cm", [["\uBA85", "\uB192\uC774\uC640 \uC778\uC6D0 \uD63C\uB3D9"], ["kg", "\uB192\uC774\uC640 \uC9C8\uB7C9 \uD63C\uB3D9"]], "\uC2DD\uBB3C\uC758 \uB192\uC774\uB294 \uAE38\uC774\uB85C \uB098\uD0C0\uB0C5\uB2C8\uB2E4."));
a2(5, "direction-after-peak", "4\uC21804-02", 3, "\uAC00\uC7A5 \uB192\uC740 \uAC12 \uC774\uD6C4\uC758 \uBCC0\uD654 \uC124\uBA85\uD558\uAE30", () => C("\uAE30\uC628\uC774 13, 18, 16, 15\u2103 \uC21C\uC11C\uB85C \uBCC0\uD588\uC2B5\uB2C8\uB2E4. \uCD5C\uACE0 \uAE30\uC628 \uC774\uD6C4\uC758 \uD750\uB984\uC744 \uACE0\uB974\uC138\uC694.", "\uACC4\uC18D \uB0B4\uB824\uAC14\uB2E4", [["\uACC4\uC18D \uC62C\uB77C\uAC14\uB2E4", "\uCC98\uC74C \uAD6C\uAC04\uB9CC \uC0AC\uC6A9"], ["\uBCC0\uD558\uC9C0 \uC54A\uC558\uB2E4", "\uB2E4\uB978 \uAC12\uB4E4\uC744 \uAC19\uB2E4\uACE0 \uD310\uB2E8"]], "18\u2103 \uC774\uD6C4 16\u2103, 15\u2103\uB85C \uCC28\uB840\uB85C \uB0B4\uB824\uAC14\uC2B5\uB2C8\uB2E4."));
a2(5, "comparison-purpose", "4\uC21804-03", 3, "\uC2DC\uAC04 \uBCC0\uD654\uC640 \uD56D\uBAA9 \uBE44\uAD50 \uBAA9\uC801 \uAD6C\uBCC4\uD558\uAE30", () => C("\uAC19\uC740 \uB098\uBB34\uC758 \uD55C \uB2EC \uB3D9\uC548 \uB192\uC774 \uBCC0\uD654\uB97C \uBCF4\uB824 \uD569\uB2C8\uB2E4. \uC6B4\uB3D9 \uC885\uB958\uBCC4 \uC778\uC6D0 \uC870\uC0AC\uBCF4\uB2E4 \uD544\uC694\uD55C \uC790\uB8CC\uB97C \uACE0\uB974\uC138\uC694.", "\uAC19\uC740 \uB098\uBB34\uB97C \uC77C\uC815\uD55C \uB0A0\uC9DC \uAC04\uACA9\uC73C\uB85C \uC7B0 \uB192\uC774", [["\uD558\uB8E8\uC5D0 \uC5EC\uB7EC \uC6B4\uB3D9\uC744 \uACE0\uB978 \uC778\uC6D0", "\uBAA9\uC801\uACFC \uB2E4\uB978 \uC790\uB8CC"], ["\uB098\uBB34 \uC0AC\uC9C4\uC758 \uAC1C\uC218\uB9CC", "\uB192\uC774 \uBCC0\uD654\uB7C9\uC744 \uC54C \uC218 \uC5C6\uB294 \uC790\uB8CC"]], "\uAC19\uC740 \uB300\uC0C1\uC758 \uC2DC\uAC04 \uC21C\uC11C \uCE21\uC815\uAC12\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."));
a2(5, "trend-condition-strategy", "4\uC21804-03", 4, "\uC5EC\uB7EC \uBCC0\uD654 \uC870\uAC74\uC5D0\uC11C \uB9C8\uC9C0\uB9C9 \uAC12 \uBCF5\uC6D0\uD558\uAE30", () => E("\uC6D4\uC694\uC77C \uAE30\uC628\uC740 12\u2103\uC785\uB2C8\uB2E4. \uD654\uC694\uC77C\uC740 4\u2103 \uB192\uC544\uC9C0\uACE0 \uC218\uC694\uC77C\uC740 3\u2103 \uB0AE\uC544\uC84C\uC2B5\uB2C8\uB2E4. \uBAA9\uC694\uC77C\uC740 \uC6D4\uC694\uC77C\uBCF4\uB2E4 6\u2103 \uB192\uC544\uC57C \uD55C\uB2E4\uBA74 \uC218\uC694\uC77C\uC5D0\uC11C \uBA87 \u2103 \uC62C\uB77C\uC57C \uD569\uB2C8\uAE4C?", [12, 6, "+", 12, 4, "+", 3, "-", "-"], "\uBAA9\uD45C \uBAA9\uC694\uC77C \uAC12 18\u2103\uC640 \uC218\uC694\uC77C \uAC12 13\u2103\uB97C \uAC01\uAC01 \uAD6C\uD558\uC5EC \uCC28 {answer}\u2103\uB97C \uAD6C\uD569\uB2C8\uB2E4.", "\u2103", "data-interpretation"));
a2(6, "tile-extra-pieces", "4\uC21803-12", 3, "\uB3C4\uD615 \uCC44\uC6B0\uAE30\uC5D0\uC11C \uD544\uC694\uD55C \uCD94\uAC00 \uC870\uAC01 \uAD6C\uD558\uAE30", (k) => E(`\uC815\uC0AC\uAC01\uD615\uC744 \uD55C \uC904\uC5D0 6\uAC1C\uC529 ${3 + k}\uC904 \uB193\uC544 \uC9C1\uC0AC\uAC01\uD615\uC744 \uB9CC\uB4E4\uB824 \uD569\uB2C8\uB2E4. \uD604\uC7AC 8\uAC1C\uAC00 \uC788\uC73C\uBA74 \uBA87 \uAC1C\uAC00 \uB354 \uD544\uC694\uD569\uB2C8\uAE4C?`, [6, 3 + k, "*", 8, "-"], "\uD544\uC694\uD55C \uC804\uCCB4 \uC870\uAC01\uC5D0\uC11C \uD604\uC7AC \uC870\uAC01\uC744 \uBE7C\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 12);
a2(6, "polygon-vertex-relation", "4\uC21803-11", 2, "\uB2E4\uAC01\uD615\uC758 \uBCC0\uACFC \uAF2D\uC9D3\uC810 \uAC1C\uC218 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uBCC0\uC774 ${5 + k % 4}\uAC1C\uC778 \uB2E4\uAC01\uD615\uC758 \uAF2D\uC9D3\uC810\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [5 + k % 4], "\uB2E4\uAC01\uD615\uC758 \uBCC0\uACFC \uAF2D\uC9D3\uC810 \uAC1C\uC218\uB294 \uAC19\uC73C\uBBC0\uB85C {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 4);
a2(6, "open-line-not-polygon", "4\uC21803-11", 1, "\uB2E4\uAC01\uD615\uC758 \uB2EB\uD78C \uC870\uAC74 \uC774\uD574\uD558\uAE30", () => C("\uACE7\uC740 \uC120\uBD84 \uB2E4\uC12F \uAC1C\uAC00 \uC774\uC5B4\uC84C\uC9C0\uB9CC \uB05D\uC774 \uB2EB\uD788\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uC624\uAC01\uD615\uC785\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uBCC0 \uC218\uB9CC \uD655\uC778\uD558\uACE0 \uB2EB\uD78C \uC870\uAC74 \uB204\uB77D"]], "\uB2E4\uAC01\uD615\uC740 \uC120\uBD84\uB4E4\uC774 \uB2EB\uD78C \uBAA8\uC591\uC73C\uB85C \uB458\uB7EC\uC2F8\uC57C \uD569\uB2C8\uB2E4."));
a2(6, "polygon-name-seven", "4\uC21803-11", 1, "\uBCC0\uC758 \uAC1C\uC218\uC640 \uB2E4\uAC01\uD615 \uC774\uB984 \uC5F0\uACB0\uD558\uAE30", () => C("\uACE7\uC740 \uC120\uBD84 \uC77C\uACF1 \uAC1C\uB85C \uB458\uB7EC\uC2F8\uC778 \uB3C4\uD615\uC758 \uC774\uB984\uC744 \uACE0\uB974\uC138\uC694.", "\uCE60\uAC01\uD615", [["\uC721\uAC01\uD615", "\uBCC0 \uC218 \uC624\uC778"], ["\uD314\uAC01\uD615", "\uBCC0 \uC218 \uC624\uC778"]], "\uBCC0\uC774 \uC77C\uACF1 \uAC1C\uC778 \uB2E4\uAC01\uD615\uC740 \uCE60\uAC01\uD615\uC785\uB2C8\uB2E4."));
a2(6, "regular-angle-condition", "4\uC21803-11", 3, "\uAC19\uC740 \uAC01\uB9CC\uC73C\uB85C \uC815\uB2E4\uAC01\uD615\uC744 \uD655\uC815\uD560 \uC218 \uC5C6\uC74C \uC774\uD574\uD558\uAE30", () => C("\uC9C1\uC0AC\uAC01\uD615\uC758 \uB124 \uAC01\uC740 \uAC19\uC9C0\uB9CC \uB124 \uBCC0\uC774 \uBAA8\uB450 \uAC19\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4. \uC815\uB2E4\uAC01\uD615\uC785\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uAC01 \uC870\uAC74\uB9CC \uD655\uC778"]], "\uC815\uB2E4\uAC01\uD615\uC740 \uBAA8\uB4E0 \uAC01\uBFD0 \uC544\uB2C8\uB77C \uBAA8\uB4E0 \uBCC0\uC758 \uAE38\uC774\uB3C4 \uAC19\uC544\uC57C \uD569\uB2C8\uB2E4."));
a2(6, "shape-made-two-triangles", "4\uC21803-12", 2, "\uB3C4\uD615 \uC870\uAC01\uC73C\uB85C \uC0C8 \uB3C4\uD615 \uAD6C\uC131\uD558\uAE30", () => C("\uAC19\uC740 \uC9C1\uAC01\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615 \uB450 \uAC1C\uB97C \uAE34 \uBCC0\uB07C\uB9AC \uBD99\uC5EC \uC815\uC0AC\uAC01\uD615\uC744 \uB9CC\uB4E4\uC5C8\uC2B5\uB2C8\uB2E4. \uC0AC\uC6A9\uD55C \uC0BC\uAC01\uD615\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", "2", [["4", "\uC0C8 \uB3C4\uD615\uC758 \uBCC0 \uC218\uC640 \uD63C\uB3D9"], ["1", "\uB450 \uC870\uAC01\uC744 \uD55C \uC870\uAC01\uC73C\uB85C \uD63C\uB3D9"]], "\uC815\uC0AC\uAC01\uD615\uC744 \uC774\uB8E8\uB294 \uB450 \uC870\uAC01\uC744 \uC149\uB2C8\uB2E4."));
a2(6, "tile-two-regions", "4\uC21803-12", 3, "\uC11C\uB85C \uB2E4\uB978 \uB450 \uBD80\uBD84\uC758 \uC870\uAC01 \uC218 \uD569\uD558\uAE30", () => E("\uC9C1\uC0AC\uAC01\uD615\uC758 \uC67C\uCABD \uBD80\uBD84\uC740 \uC815\uC0AC\uAC01\uD615 3\uAC1C\uC529 4\uC904, \uC624\uB978\uCABD\uC740 2\uAC1C\uC529 4\uC904\uB85C \uCC44\uC6E0\uC2B5\uB2C8\uB2E4. \uBAA8\uB450 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", [3, 4, "*", 2, 4, "*", "+"], "\uB450 \uBD80\uBD84\uC758 \uC870\uAC01\uC744 \uAC01\uAC01 \uC138\uC5B4 \uB354\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a2(6, "tile-gap-diagnosis", "4\uC21803-12", 3, "\uD3C9\uBA74 \uCC44\uC6B0\uAE30\uC758 \uBE48\uD2C8\uACFC \uACB9\uCE68 \uD310\uB2E8\uD558\uAE30", () => C("\uC870\uAC01\uC774 \uACB9\uCE58\uC9C0\uB294 \uC54A\uC9C0\uB9CC \uAC00\uC6B4\uB370 \uBE48\uD2C8\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uBE48\uD2C8\uC5C6\uC774 \uCC44\uC6E0\uB2E4\uACE0 \uD560 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uACB9\uCE68\uB9CC \uD655\uC778\uD558\uACE0 \uBE48\uD2C8 \uC870\uAC74 \uB204\uB77D"]], "\uACB9\uCE68\uB3C4 \uC5C6\uACE0 \uBE48\uD2C8\uB3C4 \uC5C6\uC5B4\uC57C \uBE48\uD2C8\uC5C6\uC774 \uCC44\uC6B4 \uAC83\uC785\uB2C8\uB2E4."));
a2(6, "diagonal-definition", "4\uC21803-11", 2, "\uB2E4\uAC01\uD615\uC758 \uB300\uAC01\uC120 \uC870\uAC74 \uC774\uD574\uD558\uAE30", () => C("\uB2E4\uAC01\uD615\uC5D0\uC11C \uB300\uAC01\uC120\uC740 \uC5B4\uB5A4 \uB450 \uAF2D\uC9D3\uC810\uC744 \uC787\uC2B5\uB2C8\uAE4C?", "\uC11C\uB85C \uC774\uC6C3\uD558\uC9C0 \uC54A\uB294 \uB450 \uAF2D\uC9D3\uC810", [["\uC11C\uB85C \uC774\uC6C3\uD55C \uB450 \uAF2D\uC9D3\uC810", "\uBCC0\uACFC \uB300\uAC01\uC120 \uD63C\uB3D9"], ["\uAF2D\uC9D3\uC810\uACFC \uBCC0\uC758 \uC544\uBB34 \uC810", "\uB05D\uC810 \uC870\uAC74 \uB204\uB77D"]], "\uB300\uAC01\uC120\uC740 \uC774\uC6C3\uD558\uC9C0 \uC54A\uB294 \uAF2D\uC9D3\uC810\uB07C\uB9AC \uC787\uC2B5\uB2C8\uB2E4."));
a2(6, "triangle-diagonal", "4\uC21803-11", 3, "\uC0BC\uAC01\uD615\uC5D0 \uB300\uAC01\uC120\uC774 \uC5C6\uB294 \uC774\uC720 \uD310\uB2E8\uD558\uAE30", () => C("\uC0BC\uAC01\uD615\uC5D0 \uB300\uAC01\uC120\uC774 \uC5C6\uB294 \uAE4C\uB2ED\uC744 \uACE0\uB974\uC138\uC694.", "\uBAA8\uB4E0 \uAF2D\uC9D3\uC810 \uC30D\uC774 \uC11C\uB85C \uC774\uC6C3\uD558\uAE30 \uB54C\uBB38\uC774\uB2E4", [["\uAF2D\uC9D3\uC810\uC774 \uC5C6\uAE30 \uB54C\uBB38\uC774\uB2E4", "\uC0BC\uAC01\uD615\uC758 \uAD6C\uC131 \uC624\uB958"], ["\uBCC0\uC774 \uACE1\uC120\uC774\uAE30 \uB54C\uBB38\uC774\uB2E4", "\uBCC0\uC758 \uC131\uC9C8 \uC624\uB958"]], "\uC0BC\uAC01\uD615\uC758 \uBAA8\uB4E0 \uAF2D\uC9D3\uC810 \uC30D\uC744 \uC774\uC73C\uBA74 \uC774\uBBF8 \uBCC0\uC785\uB2C8\uB2E4."));
a2(6, "two-building-plans", "4\uC21803-12", 3, "\uAC19\uC740 \uC804\uCCB4 \uC870\uAC01 \uC218\uB97C \uB9CC\uB4DC\uB294 \uB2E4\uB978 \uBC30\uCE58 \uBE44\uAD50\uD558\uAE30", () => C("\uAC19\uC740 \uC815\uC0AC\uAC01\uD615\uC73C\uB85C A\uB294 4\uAC1C\uC529 6\uC904, B\uB294 3\uAC1C\uC529 8\uC904\uC744 \uB193\uC558\uC2B5\uB2C8\uB2E4. \uC870\uAC01 \uC218\uB97C \uBE44\uAD50\uD558\uC138\uC694.", "\uAC19\uB2E4", [["A\uAC00 \uB354 \uB9CE\uB2E4", "\uD55C \uC904 \uC218\uB9CC \uBE44\uAD50"], ["B\uAC00 \uB354 \uB9CE\uB2E4", "\uC904 \uC218\uB9CC \uBE44\uAD50"]], "\uB450 \uBC30\uCE58 \uBAA8\uB450 24\uAC1C\uC785\uB2C8\uB2E4."));
a2(6, "tile-plan-restriction", "4\uC21803-12", 5, "\uC804\uCCB4 \uC218\xB7\uD55C \uC904 \uC81C\uD55C\xB7\uB098\uBA38\uC9C0 \uC870\uAC74\uC73C\uB85C \uBC30\uCE58 \uD310\uB2E8\uD558\uAE30", () => C("\uC815\uC0AC\uAC01\uD615 30\uAC1C\uB97C \uBAA8\uB450 \uC368 \uC9C1\uC0AC\uAC01\uD615\uC73C\uB85C \uCC44\uC6B0\uB824 \uD569\uB2C8\uB2E4. \uD55C \uC904\uC5D0 4\uAC1C \uC774\uC0C1 7\uAC1C \uC774\uD558\uB97C \uB450\uACE0 \uBE48\uD2C8\uACFC \uB0A8\uB294 \uC870\uAC01\uC774 \uC5C6\uC5B4\uC57C \uD569\uB2C8\uB2E4. \uAC00\uB2A5\uD55C \uD55C \uC904 \uAC1C\uC218\uB97C \uBAA8\uB450 \uACE0\uB974\uC138\uC694.", "5\uAC1C\uC640 6\uAC1C", [["4\uAC1C\uC640 5\uAC1C", "30\uC774 4\uB85C \uB098\uB204\uC5B4\uB5A8\uC5B4\uC9C0\uC9C0 \uC54A\uC74C"], ["6\uAC1C\uC640 7\uAC1C", "30\uC774 7\uB85C \uB098\uB204\uC5B4\uB5A8\uC5B4\uC9C0\uC9C0 \uC54A\uC74C"]], "\uD55C \uC904\uC758 \uC218\uB85C \uC804\uCCB4\uB97C \uB098\uB204\uC5B4\uB5A8\uC5B4\uC9C0\uAC8C \uD574\uC57C \uD569\uB2C8\uB2E4. \uBC94\uC704 \uC548\uC5D0\uC11C\uB294 5\uAC1C \uB610\uB294 6\uAC1C\uC785\uB2C8\uB2E4."));

// learning-review-r1/native/data/final-expansion-grade5.js
var a3 = (s, u, id, code, l, o, fn, domain = 1) => A(5, s, u, "FINAL-" + id, code, l, o, fn, domain);
a3(1, 1, "two-products-gap", "6\uC21801-01", 3, "\uB450 \uBB36\uC74C\uC758 \uC804\uCCB4 \uCC28 \uAD6C\uD558\uAE30", (k) => E(`A\uB294 8\uAC1C\uC529 ${6 + k}\uBB36\uC74C, B\uB294 6\uAC1C\uC529 5\uBB36\uC74C\uC785\uB2C8\uB2E4. A\uB294 B\uBCF4\uB2E4 \uBA87 \uAC1C \uB9CE\uC2B5\uB2C8\uAE4C?`, [8, 6 + k, "*", 6, 5, "*", "-"], "\uB450 \uC804\uCCB4\uB97C \uAD6C\uD574 \uCC28\uB97C \uAD6C\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 12);
a3(1, 1, "share-after-add", "6\uC21801-01", 3, "\uB450 \uC591\uC758 \uD569\uC744 \uAC19\uC740 \uC218\uB85C \uB098\uB204\uAE30", (k) => E(`\uCC45 ${18 + 3 * k}\uAD8C\uACFC 12\uAD8C\uC744 \uD569\uCCD0 3\uC0C1\uC790\uC5D0 \uB611\uAC19\uC774 \uB123\uC2B5\uB2C8\uB2E4. \uD55C \uC0C1\uC790\uC5D0 \uBA87 \uAD8C\uC785\uB2C8\uAE4C?`, [18 + 3 * k, 12, "+", 3, "/"], "\uB450 \uC591\uC744 \uD569\uD55C \uB4A4 \uC0C1\uC790 \uC218\uB85C \uB098\uB204\uBA74 {answer}\uAD8C\uC785\uB2C8\uB2E4.", "\uAD8C"), 12);
a3(1, 1, "order-parenthesis-first", "6\uC21801-01", 1, "\uAD04\uD638\uC758 \uACC4\uC0B0 \uC21C\uC11C \uD655\uC778\uD558\uAE30", () => C("(14 + 6) \xD7 3\uC5D0\uC11C \uBA3C\uC800 \uACC4\uC0B0\uD560 \uBD80\uBD84\uC744 \uACE0\uB974\uC138\uC694.", "14 + 6", [["6 \xD7 3", "\uAD04\uD638\uB97C \uBB34\uC2DC"], ["14 \xD7 3", "\uC5F0\uC0B0 \uAD6C\uC870\uB97C \uBC14\uAFC8"]], "\uAD04\uD638 \uC548\uC744 \uBA3C\uC800 \uACC4\uC0B0\uD569\uB2C8\uB2E4."));
a3(1, 1, "equal-priority-order", "6\uC21801-01", 2, "\uAC19\uC740 \uC6B0\uC120\uC21C\uC704 \uC5F0\uC0B0\uC758 \uC21C\uC11C \uC801\uC6A9\uD558\uAE30", () => E("36 \xF7 6 \xD7 3\uC744 \uACC4\uC0B0\uD558\uC138\uC694.", [36, 6, "/", 3, "*"], "\uB098\uB217\uC148\uACFC \uACF1\uC148\uC740 \uC67C\uCABD\uBD80\uD130 \uACC4\uC0B0\uD558\uBBC0\uB85C {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a3(1, 1, "subtraction-order", "6\uC21801-01", 2, "\uC5F0\uC18D \uBE84\uC148\uC758 \uC21C\uC11C \uC774\uD574\uD558\uAE30", () => E("28 - 9 - 4\uB97C \uACC4\uC0B0\uD558\uC138\uC694.", [28, 9, "-", 4, "-"], "\uC67C\uCABD\uBD80\uD130 \uCC28\uB840\uB85C \uBE7C\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a3(1, 1, "parentheses-effect", "6\uC21801-01", 3, "\uAD04\uD638\uC5D0 \uB530\uB77C \uB2E4\uB978 \uACB0\uACFC \uBE44\uAD50\uD558\uAE30", () => C("20 - 8 \xF7 4\uC640 (20 - 8) \xF7 4\uB97C \uBE44\uAD50\uD558\uC138\uC694.", "\uCCAB \uC2DD\uC740 18, \uB458\uC9F8 \uC2DD\uC740 3", [["\uB450 \uC2DD \uBAA8\uB450 3", "\uCCAB \uC2DD\uC5D0 \uC5C6\uB294 \uAD04\uD638\uB97C \uC801\uC6A9"], ["\uB450 \uC2DD \uBAA8\uB450 18", "\uB458\uC9F8 \uC2DD\uC758 \uAD04\uD638 \uBB34\uC2DC"]], "\uCCAB \uC2DD\uC740 \uB098\uB217\uC148 \uBA3C\uC800, \uB458\uC9F8 \uC2DD\uC740 \uAD04\uD638 \uC548 \uBA3C\uC800\uC785\uB2C8\uB2E4."));
a3(1, 1, "expression-choice-context", "6\uC21801-01", 3, "\uB0A8\uC740 \uC900\uBE44\uBB3C\uC744 \uB098\uB204\uB294 \uC0C1\uD669\uC744 \uC2DD\uC73C\uB85C \uD45C\uD604\uD558\uAE30", () => C("\uC0C9\uC885\uC774 60\uC7A5 \uC911 12\uC7A5\uC744 \uB530\uB85C \uB450\uACE0 \uB098\uBA38\uC9C0\uB97C 6\uBA85\uC5D0\uAC8C \uB611\uAC19\uC774 \uB098\uB215\uB2C8\uB2E4. \uD55C \uC0AC\uB78C\uC758 \uC7A5\uC218 \uC2DD\uC744 \uACE0\uB974\uC138\uC694.", "(60 - 12) \xF7 6", [["60 - 12 \xF7 6", "\uC804\uCCB4\uC5D0\uC11C \uBE7C\uB294 \uC21C\uC11C \uC624\uB958"], ["60 \xF7 (12 - 6)", "\uC5ED\uD560\uC744 \uBC14\uAFB8\uC5B4 \uACC4\uC0B0"]], "\uB0A8\uC740 \uC804\uCCB4\uB97C \uBA3C\uC800 \uAD6C\uD558\uACE0 \uC0AC\uB78C \uC218\uB85C \uB098\uB215\uB2C8\uB2E4."));
a3(1, 1, "inverse-two-groups", "6\uC21801-01", 3, "\uC5EC\uB7EC \uBB36\uC74C\uACFC \uCD94\uAC00 \uC218\uB7C9\uC5D0\uC11C \uBB36\uC74C \uD06C\uAE30 \uBCF5\uC6D0\uD558\uAE30", () => E("\uAC19\uC740 \uD06C\uAE30 5\uBB36\uC74C\uC5D0 \uB0B1\uAC1C 7\uAC1C\uB97C \uB354\uD558\uBA74 82\uAC1C\uC785\uB2C8\uB2E4. \uD55C \uBB36\uC74C\uC5D0\uB294 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", [82, 7, "-", 5, "/"], "\uB0B1\uAC1C\uB97C \uC81C\uC678\uD558\uACE0 \uBB36\uC74C \uC218\uB85C \uB098\uB204\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a3(1, 1, "wrong-distribution", "6\uC21801-01", 4, "\uD63C\uD569 \uC2DD\uC5D0\uC11C \uC5ED\uD560\uC774 \uB2E4\uB978 \uC591\uC744 \uAD6C\uBCC4\uD558\uAE30", () => C("\uD55C \uC0C1\uC790 12\uAC1C\uC529 4\uC0C1\uC790\uC640 \uB0B1\uAC1C 5\uAC1C\uAC00 \uC788\uC2B5\uB2C8\uB2E4. (12 + 5) \xD7 4\uB77C\uACE0 \uACC4\uC0B0\uD558\uBA74 \uC65C \uD2C0\uB9BD\uB2C8\uAE4C?", "\uB0B1\uAC1C 5\uAC1C\uB3C4 \uC0C1\uC790\uB9C8\uB2E4 \uC788\uB294 \uAC83\uC73C\uB85C \uB124 \uBC88 \uC138\uAE30 \uB54C\uBB38\uC774\uB2E4", [["12\uC640 5\uB294 \uB354\uD560 \uC218 \uC5C6\uB294 \uC790\uC5F0\uC218\uC774\uB2E4", "\uC5F0\uC0B0 \uC790\uCCB4\uB97C \uC798\uBABB \uD310\uB2E8"], ["\uACF1\uC148\uC744 \uC5B8\uC81C\uB098 \uBA3C\uC800 \uD558\uBA74 \uC548 \uB41C\uB2E4", "\uAD04\uD638\uC640 \uC5ED\uD560 \uBB38\uC81C\uB97C \uB193\uCE68"]], "\uB0B1\uAC1C\uB294 \uC804\uCCB4\uC5D0 \uD55C \uBC88\uB9CC \uB354\uD574\uC57C \uD569\uB2C8\uB2E4."));
a3(1, 1, "two-batches-sharing", "6\uC21801-01", 3, "\uC11C\uB85C \uB2E4\uB978 \uB450 \uBB36\uC74C\uC744 \uD569\uCCD0 \uB098\uB204\uAE30", () => E("\uD39C 6\uAC1C\uC529 4\uBB36\uC74C\uACFC 8\uAC1C\uC529 3\uBB36\uC74C\uC744 \uBAA8\uB450 6\uBA85\uC5D0\uAC8C \uB611\uAC19\uC774 \uB098\uB215\uB2C8\uB2E4. \uD55C \uC0AC\uB78C\uC5D0 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", [6, 4, "*", 8, 3, "*", "+", 6, "/"], "\uC804\uCCB4 \uB450 \uBB36\uC74C\uC758 \uD569\uC744 \uC0AC\uB78C \uC218\uB85C \uB098\uB204\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a3(1, 1, "constraint-plan-choice", "6\uC21801-01", 5, "\uAC00\uACA9\xB7\uAC1C\uC218\xB7\uC608\uC0B0 \uC870\uAC74\uC744 \uD568\uAED8 \uD310\uB2E8\uD558\uAE30", () => C("\uACF5\uCC45\uC740 \uD55C \uAD8C 800\uC6D0, \uC5F0\uD544\uC740 \uD55C \uC790\uB8E8 300\uC6D0\uC785\uB2C8\uB2E4. \uACF5\uCC45 3\uAD8C\uC744 \uC0AC\uACE0 \uC5F0\uD544\uC744 \uCD5C\uB300\uD55C \uC0AC\uB418 \uCD1D 4000\uC6D0 \uC774\uD558\uB85C \uC368\uC57C \uD569\uB2C8\uB2E4. \uC0B4 \uC218 \uC788\uB294 \uC5F0\uD544 \uCD5C\uB300 \uC218\uB97C \uACE0\uB974\uC138\uC694.", "5\uC790\uB8E8", [["6\uC790\uB8E8", "\uC608\uC0B0 \uCD08\uACFC"], ["4\uC790\uB8E8", "\uB354 \uC0B4 \uC218 \uC788\uB294 \uACBD\uC6B0\uB97C \uB204\uB77D"]], "\uACF5\uCC45\uC5D0 2400\uC6D0\uC744 \uC368\uC11C 1600\uC6D0\uC774 \uB0A8\uC2B5\uB2C8\uB2E4. \uC5F0\uD544 5\uC790\uB8E8\uB294 1500\uC6D0, 6\uC790\uB8E8\uB294 1800\uC6D0\uC785\uB2C8\uB2E4."));
a3(1, 1, "reverse-plan-check", "6\uC21801-01", 4, "\uC5ED\uC0B0 \uACB0\uACFC\uB97C \uCC98\uC74C \uC0C1\uD669\uC5D0 \uB300\uC785\uD574 \uD655\uC778\uD558\uAE30", () => C("6\uAC1C\uC529 \uAC19\uC740 \uBB36\uC74C\uACFC \uB0B1\uAC1C 4\uAC1C\uB97C \uD569\uCCD0 46\uAC1C\uC785\uB2C8\uB2E4. \uBB36\uC74C \uC218\uC640 \uD655\uC778 \uC2DD\uC744 \uACE0\uB974\uC138\uC694.", "7\uBB36\uC74C, 6 \xD7 7 + 4 = 46", [["8\uBB36\uC74C, 6 \xD7 8 - 4 = 44", "\uCD94\uAC00\uB7C9\uC744 \uBE7C\uACE0 \uC798\uBABB \uD655\uC778"], ["7\uBB36\uC74C, 6 + 7 + 4 = 17", "\uBB36\uC74C \uAD00\uACC4\uB97C \uB367\uC148\uC73C\uB85C \uBC14\uAFC8"]], "\uB0B1\uAC1C\uB97C \uBE7C\uACE0 6\uC73C\uB85C \uB098\uB204\uC5B4 \uAD6C\uD55C \uBB36\uC74C \uC218\uB97C \uC6D0\uB798 \uC2DD\uC5D0 \uB123\uC2B5\uB2C8\uB2E4."));
a3(1, 2, "divisor-pair", "6\uC21801-04", 2, "\uD55C \uC57D\uC218\uB85C \uB300\uC751\uD558\uB294 \uC57D\uC218 \uCC3E\uAE30", (k) => E(`${6 * (8 + k)}\uC758 \uD55C \uC57D\uC218\uAC00 6\uC785\uB2C8\uB2E4. 6\uACFC \uACF1\uD574\uC11C \uC774 \uC218\uAC00 \uB418\uB294 \uC57D\uC218\uB294 \uBB34\uC5C7\uC785\uB2C8\uAE4C?`, [6 * (8 + k), 6, "/"], "\uC57D\uC218\uC758 \uC9DD\uC740 \uC804\uCCB4 \uC218\uB97C 6\uC73C\uB85C \uB098\uB204\uC5B4 {answer}\uC785\uB2C8\uB2E4.", "", "concept"), 12);
a3(1, 2, "third-common-time", "6\uC21801-05", 3, "\uACF5\uD1B5 \uBC18\uBCF5 \uAC04\uACA9\uACFC \uBC18\uBCF5 \uD69F\uC218 \uC5F0\uACB0\uD558\uAE30", (k) => M(`\uB450 \uC54C\uB78C\uC740 4\uBD84\uB9C8\uB2E4, ${6 + 2 * k}\uBD84\uB9C8\uB2E4 \uC6B8\uB9BD\uB2C8\uB2E4. \uC9C0\uAE08 \uD568\uAED8 \uC6B8\uB9B0 \uB4A4 \uB2E4\uC74C\uBD80\uD130 \uD568\uAED8 \uC6B8\uB9AC\uB294 \uCCAB \uAC04\uACA9\uC744 \uAD6C\uD558\uC138\uC694.`, "foundation", "lcm", { task: "number-theory", a: "4", b: String(6 + 2 * k) }, "\uB450 \uAC04\uACA9\uC758 \uCD5C\uC18C\uACF5\uBC30\uC218\uB294 {answer}\uBD84\uC785\uB2C8\uB2E4.", "", "word-problem"), 12);
a3(1, 2, "one-divisor", "6\uC21801-04", 1, "1\uC758 \uC57D\uC218 \uC5ED\uD560 \uC774\uD574\uD558\uAE30", () => C("0\uBCF4\uB2E4 \uD070 \uC790\uC5F0\uC218\uC758 \uC57D\uC218\uC5D0 \uD56D\uC0C1 \uB4E4\uC5B4\uAC00\uB294 \uC218\uB97C \uACE0\uB974\uC138\uC694.", "1", [["0", "0\uC73C\uB85C \uB098\uB20C \uC218 \uC5C6\uC74C"], ["2", "\uD640\uC218\uC5D0\uB294 \uC801\uC6A9\uB418\uC9C0 \uC54A\uC74C"]], "\uBAA8\uB4E0 \uC790\uC5F0\uC218\uB294 1\uB85C \uB098\uB204\uC5B4\uB5A8\uC5B4\uC9D1\uB2C8\uB2E4."));
a3(1, 2, "zero-not-divisor", "6\uC21801-04", 2, "0\uC744 \uC57D\uC218\uB85C \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uB294 \uC774\uC720 \uC774\uD574\uD558\uAE30", () => C("12\uC758 \uC57D\uC218\uC5D0 0\uC744 \uB123\uC744 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "0\uC73C\uB85C \uB098\uB204\uB294 \uC5F0\uC0B0\uC744 \uD5C8\uC6A9"]], "\uC57D\uC218\uB294 \uB098\uB204\uC5B4\uB5A8\uC5B4\uC9C0\uAC8C \uD558\uB294 \uC591\uC758 \uC790\uC5F0\uC218\uC774\uBA70 0\uC73C\uB85C \uB098\uB20C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."));
a3(1, 2, "divisors-not-all-small", "6\uC21801-04", 3, "\uC791\uC740 \uC218\uB77C\uB294 \uAC83\uACFC \uC57D\uC218 \uC870\uAC74 \uAD6C\uBCC4\uD558\uAE30", () => C("7\uC740 20\uBCF4\uB2E4 \uC791\uC2B5\uB2C8\uB2E4. \uC774\uAC83\uB9CC\uC73C\uB85C 7\uC774 20\uC758 \uC57D\uC218\uB77C\uACE0 \uD560 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uD06C\uAE30 \uC870\uAC74\uB9CC \uD655\uC778"]], "20\uC774 7\uB85C \uB098\uB204\uC5B4\uB5A8\uC5B4\uC9C0\uB294\uC9C0 \uD655\uC778\uD574\uC57C \uD569\uB2C8\uB2E4."));
a3(1, 2, "multiple-boundary", "6\uC21801-05", 3, "\uBC94\uC704 \uC548\uC5D0 \uC788\uB294 \uBC30\uC218 \uCC3E\uAE30", () => C("7\uC758 \uBC30\uC218 \uC911 20\uBCF4\uB2E4 \uD06C\uACE0 40\uBCF4\uB2E4 \uC791\uC740 \uC218\uB97C \uBAA8\uB450 \uACE0\uB974\uC138\uC694.", "21, 28, 35", [["14, 21, 28", "\uD558\uD55C \uC870\uAC74 \uC704\uBC18"], ["21, 28, 35, 42", "\uC0C1\uD55C \uC870\uAC74 \uC704\uBC18"]], "7\uC529 \uCEE4\uC9C0\uB294 \uBC30\uC218\uC5D0\uC11C \uBC94\uC704\uC5D0 \uB9DE\uB294 \uAC83\uC744 \uACE0\uB985\uB2C8\uB2E4."));
a3(1, 2, "gcd-selection", "6\uC21801-04", 3, "\uACF5\uC57D\uC218\uC640 \uCD5C\uB300\uACF5\uC57D\uC218 \uAD6C\uBCC4\uD558\uAE30", () => C("18\uACFC 24\uC758 \uACF5\uC57D\uC218\uAC00 1, 2, 3, 6\uC785\uB2C8\uB2E4. \uCD5C\uB300\uACF5\uC57D\uC218\uB97C \uACE0\uB974\uC138\uC694.", "6", [["3", "\uACF5\uC57D\uC218 \uC911 \uCD5C\uB313\uAC12\uC744 \uB193\uCE68"], ["12", "\uB450 \uC218 \uBAA8\uB450\uC758 \uC57D\uC218\uAC00 \uC544\uB2D8"]], "\uACF5\uD1B5 \uC57D\uC218 \uC911 \uAC00\uC7A5 \uD070 \uAC83\uC740 6\uC785\uB2C8\uB2E4."));
a3(1, 2, "lcm-or-gcd", "6\uC21801-05", 4, "\uC0C1\uD669\uC5D0 \uB9DE\uB294 \uACF5\uC57D\uC218\uC640 \uACF5\uBC30\uC218 \uC120\uD0DD\uD558\uAE30", () => C("\uAE38\uC774 6 cm\uC640 8 cm\uC778 \uB9C9\uB300\uB97C \uAC01\uAC01 \uB05D\uACFC \uB05D\uC774 \uB2FF\uAC8C \uD55C \uC904\uB85C \uBC18\uBCF5\uD558\uC5EC \uB450 \uC904\uC758 \uAE38\uC774\uB97C \uAC19\uAC8C \uD558\uB824 \uD569\uB2C8\uB2E4. \uAC00\uC7A5 \uC9E7\uC740 \uACF5\uD1B5 \uAE38\uC774\uB97C \uAD6C\uD558\uB294 \uBC29\uBC95\uC744 \uACE0\uB974\uC138\uC694.", "\uCD5C\uC18C\uACF5\uBC30\uC218", [["\uCD5C\uB300\uACF5\uC57D\uC218", "\uC790\uB974\uB294 \uD06C\uAE30\uC640 \uBC18\uBCF5 \uAE38\uC774\uB97C \uD63C\uB3D9"], ["\uB450 \uC218\uC758 \uCC28", "\uBC18\uBCF5 \uC870\uAC74 \uB204\uB77D"]], "\uBC18\uBCF5\uD55C \uAE38\uC774\uB294 \uAC01 \uB9C9\uB300 \uAE38\uC774\uC758 \uBC30\uC218\uC785\uB2C8\uB2E4."));
a3(1, 2, "gcd-bags-condition", "6\uC21801-04", 4, "\uAC19\uC740 \uCD5C\uB300 \uADF8\uB8F9\uC758 \uAD6C\uC131 \uC218 \uD310\uB2E8\uD558\uAE30", () => C("\uBE68\uAC04 \uAD6C\uC2AC 24\uAC1C\uC640 \uD30C\uB780 \uAD6C\uC2AC 36\uAC1C\uB97C \uB0A8\uAE40\uC5C6\uC774 \uC5EC\uB7EC \uBD09\uC9C0\uC5D0 \uB098\uB215\uB2C8\uB2E4. \uBAA8\uB4E0 \uBD09\uC9C0\uC758 \uBE68\uAC04 \uC218\uC640 \uD30C\uB780 \uC218\uB3C4 \uAC01\uAC01 \uAC19\uC544\uC57C \uD569\uB2C8\uB2E4. \uBD09\uC9C0 \uC218\uB97C \uCD5C\uB300\uD55C \uD560 \uB54C \uD55C \uBD09\uC9C0 \uAD6C\uC131\uC744 \uACE0\uB974\uC138\uC694.", "\uBE68\uAC15 2\uAC1C, \uD30C\uB791 3\uAC1C", [["\uBE68\uAC15 3\uAC1C, \uD30C\uB791 2\uAC1C", "\uC0C9\uBCC4 \uC804\uCCB4 \uC218 \uC870\uAC74\uC744 \uBC14\uAFC8"], ["\uBE68\uAC15 1\uAC1C, \uD30C\uB791 1\uAC1C", "\uB450 \uC804\uCCB4\uB97C \uBAA8\uB450 \uB098\uB204\uB294 \uC870\uAC74 \uC704\uBC18"]], "\uBD09\uC9C0 \uC218\uC758 \uCD5C\uB300\uACF5\uC57D\uC218\uB294 12\uC785\uB2C8\uB2E4. \uAC01 \uC804\uCCB4\uB97C 12\uB85C \uB098\uB204\uBA74 2\uAC1C\uC640 3\uAC1C\uC785\uB2C8\uB2E4."));
a3(1, 2, "factor-list-completeness", "6\uC21801-04", 3, "\uC57D\uC218 \uBAA9\uB85D\uC758 \uB204\uB77D \uCC3E\uAE30", () => C("16\uC758 \uC57D\uC218\uB97C 1, 2, 4, 16\uC774\uB77C\uACE0 \uC801\uC5C8\uC2B5\uB2C8\uB2E4. \uBE60\uC9C4 \uC57D\uC218\uB97C \uACE0\uB974\uC138\uC694.", "8", [["6", "\uB098\uB204\uC5B4\uB5A8\uC5B4\uC9C0\uC9C0 \uC54A\uC74C"], ["12", "\uB098\uB204\uC5B4\uB5A8\uC5B4\uC9C0\uC9C0 \uC54A\uC74C"]], "16 = 2 \xD7 8\uC774\uBBC0\uB85C 8\uB3C4 \uC57D\uC218\uC785\uB2C8\uB2E4."));
a3(1, 2, "joint-time-limited", "6\uC21801-05", 4, "\uACF5\uD1B5 \uAC04\uACA9\uACFC \uC2DC\uAC04 \uBC94\uC704 \uC870\uAC74 \uACB0\uD569\uD558\uAE30", () => C("4\uBD84\uACFC 6\uBD84 \uAC04\uACA9\uC758 \uC54C\uB78C\uC774 0\uBD84\uC5D0 \uD568\uAED8 \uC6B8\uB838\uC2B5\uB2C8\uB2E4. 30\uBD84\uC774 \uB418\uAE30 \uC804\uC5D0 \uB2E4\uC2DC \uD568\uAED8 \uC6B8\uB9AC\uB294 \uC2DC\uAC01\uC744 \uBAA8\uB450 \uACE0\uB974\uC138\uC694.", "12\uBD84, 24\uBD84", [["6\uBD84, 12\uBD84, 24\uBD84", "6\uBD84\uC740 4\uC758 \uBC30\uC218\uAC00 \uC544\uB2D8"], ["12\uBD84, 24\uBD84, 36\uBD84", "\uC2DC\uAC04 \uC0C1\uD55C \uC704\uBC18"]], "\uCD5C\uC18C\uACF5\uBC30\uC218 12\uC758 \uBC30\uC218 \uC911 0\uBCF4\uB2E4 \uD06C\uACE0 30\uBCF4\uB2E4 \uC791\uC740 \uC2DC\uAC01\uC744 \uACE0\uB985\uB2C8\uB2E4."));
a3(1, 2, "max-divisor-groups", "6\uC21801-04", 3, "\uAC19\uC740 \uD06C\uAE30\uC640 \uB0A8\uAE40\uC5C6\uC74C \uC870\uAC74\uC73C\uB85C \uCD5C\uB300 \uC870\uAC01 \uD06C\uAE30 \uCC3E\uAE30", () => M("\uAE38\uC774 30 cm\uC640 42 cm\uC758 \uB048\uC744 \uAC19\uC740 \uAE38\uC774\uB85C \uB0A8\uAE40\uC5C6\uC774 \uC790\uB985\uB2C8\uB2E4. \uAC00\uB2A5\uD55C \uAC00\uC7A5 \uAE34 \uD55C \uC870\uAC01\uC758 \uAE38\uC774\uB97C \uC218\uB85C \uAD6C\uD558\uC138\uC694.", "foundation", "gcd", { task: "number-theory", a: "30", b: "42" }, "\uB450 \uAE38\uC774\uB97C \uBAA8\uB450 \uB098\uB204\uB294 \uAC00\uC7A5 \uD070 \uC218\uB294 {answer} cm\uC785\uB2C8\uB2E4."));
a3(1, 3, "affine-rule-check", "6\uC21802-01", 3, "\uB300\uC751 \uAD00\uACC4\uC758 \uCD94\uAC00 \uACE0\uC815\uB7C9 \uC801\uC6A9\uD558\uAE30", (k) => E(`\uC0C1\uC790 \uD558\uB098\uC5D0 \uCE74\uB4DC 5\uAC1C\uB97C \uB123\uACE0 \uC0C1\uC790 \uC218\uC640 \uAD00\uACC4\uC5C6\uC774 \uC548\uB0B4 \uCE74\uB4DC 2\uAC1C\uB97C \uB354\uD569\uB2C8\uB2E4. ${3 + k}\uC0C1\uC790\uC5D0 \uD544\uC694\uD55C \uCE74\uB4DC\uB294 \uBAA8\uB450 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [3 + k, 5, "*", 2, "+"], "\uC0C1\uC790\uBCC4 \uCE74\uB4DC\uC640 \uD55C \uBC88 \uB354\uD558\uB294 \uACE0\uC815\uB7C9\uC744 \uAD6C\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 12);
a3(1, 3, "inverse-additive-rule", "6\uC21802-01", 3, "\uB300\uC751\uD558\uB294 \uB450 \uC591\uC758 \uC77C\uC815\uD55C \uCC28\uB85C \uC785\uB825 \uCC3E\uAE30", (k) => E(`\u25B3 = \u25A1 + 8\uC785\uB2C8\uB2E4. \u25B3\uAC00 ${19 + k}\uC77C \uB54C \u25A1\uB97C \uAD6C\uD558\uC138\uC694.`, [19 + k, 8, "-"], "\uCD9C\uB825\uC5D0\uC11C \uC77C\uC815\uD55C \uCC28\uB97C \uBE7C\uBA74 \uC785\uB825\uC740 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"), 12);
a3(1, 3, "two-quantities-label", "6\uC21802-01", 1, "\uB300\uC751\uD45C\uC5D0\uC11C \uC785\uB825\uACFC \uCD9C\uB825 \uC5ED\uD560 \uC77D\uAE30", () => C("\uD55C \uBB36\uC74C\uC5D0 \uACF5 4\uAC1C\uC529 \uC788\uC2B5\uB2C8\uB2E4. \uB300\uC751\uD45C\uC758 \uB450 \uC591\uC73C\uB85C \uC54C\uB9DE\uC740 \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uBB36\uC74C \uC218\uC640 \uC804\uCCB4 \uACF5 \uC218", [["\uACF5 \uC0C9\uACFC \uC885\uC774 \uC0C9", "\uC218\uB7C9 \uAD00\uACC4\uC640 \uBB34\uAD00"], ["\uB0A0\uC9DC\uC640 \uB0A0\uC528 \uC774\uB984", "\uC8FC\uC5B4\uC9C4 \uAD00\uACC4\uC640 \uBB34\uAD00"]], "\uBB36\uC74C \uC218\uAC00 \uBC14\uB00C\uBA74 \uC804\uCCB4 \uACF5 \uC218\uAC00 \uB300\uC751\uD558\uC5EC \uBC14\uB01D\uB2C8\uB2E4."));
a3(1, 3, "rule-from-two-rows", "6\uC21802-01", 2, "\uB300\uC751\uD45C\uC5D0 \uB9DE\uB294 \uC77C\uC815\uD55C \uCC28 \uCC3E\uAE30", () => C("\u25A1\uAC00 2, 4, 6\uC77C \uB54C \u25B3\uB294 5, 7, 9\uC785\uB2C8\uB2E4. \uC54C\uB9DE\uC740 \uAD00\uACC4\uB97C \uACE0\uB974\uC138\uC694.", "\u25B3 = \u25A1 + 3", [["\u25B3 = \u25A1 \xD7 3", "\uCC28\uC640 \uBC30\uC728 \uD63C\uB3D9"], ["\u25B3 = \u25A1 - 3", "\uBCC0\uD654 \uBC29\uD5A5 \uBC18\uB300"]], "\uAC01 \uB300\uC751\uC30D\uC758 \uCC28\uAC00 \uBAA8\uB450 3\uC785\uB2C8\uB2E4."));
a3(1, 3, "rule-does-not-vary", "6\uC21802-01", 3, "\uBAA8\uB4E0 \uB300\uC751\uC30D\uC5D0 \uAC19\uC740 \uAD00\uACC4 \uC801\uC6A9\uD558\uAE30", () => C("\uB300\uC751\uD45C\uC758 \uCCAB \uC30D\uC5D0\uC11C\uB9CC \uB9DE\uB294 \uAD00\uACC4\uAC00 \uC788\uACE0 \uB2E4\uB978 \uC30D\uC5D0\uC11C\uB294 \uB9DE\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uADF8 \uAD00\uACC4\uB97C \uD45C\uC758 \uADDC\uCE59\uC73C\uB85C \uD655\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uCCAB \uB300\uC751\uC30D\uB9CC \uD655\uC778"]], "\uD45C\uC758 \uADDC\uCE59\uC740 \uBAA8\uB4E0 \uB300\uC751\uC30D\uC5D0 \uB9DE\uC544\uC57C \uD569\uB2C8\uB2E4."));
a3(1, 3, "zero-input-offset", "6\uC21802-01", 2, "\uC785\uB825\uC774 0\uC77C \uB54C \uACE0\uC815\uB7C9\uC758 \uC5ED\uD560 \uC774\uD574\uD558\uAE30", () => E("\u25B3 = \u25A1 \xD7 4 + 3\uC785\uB2C8\uB2E4. \u25A1\uAC00 0\uC774\uBA74 \u25B3\uB294 \uC5BC\uB9C8\uC785\uB2C8\uAE4C?", [0, 4, "*", 3, "+"], "\uBB36\uC74C\uC5D0 \uD574\uB2F9\uD558\uB294 \uC591\uC740 0\uC774\uC9C0\uB9CC \uACE0\uC815\uB7C9\uC740 \uB0A8\uC544 {answer}\uC785\uB2C8\uB2E4.", "", "concept"));
a3(1, 3, "rule-output-change", "6\uC21802-01", 3, "\uC785\uB825 \uBCC0\uD654\uC640 \uCD9C\uB825 \uBCC0\uD654 \uC5F0\uACB0\uD558\uAE30", () => E("\u25B3\uB294 \u25A1\uC758 6\uBC30\uC785\uB2C8\uB2E4. \u25A1\uAC00 2 \uCEE4\uC9C0\uBA74 \u25B3\uB294 \uC5BC\uB9C8 \uCEE4\uC9D1\uB2C8\uAE4C?", [6, 2, "*"], "\uC785\uB825\uC758 \uC99D\uAC00\uB7C9\uB3C4 6\uBC30 \uB418\uC5B4 {answer} \uCEE4\uC9D1\uB2C8\uB2E4.", "", "pattern"));
a3(1, 3, "two-sources-comparison", "6\uC21802-01", 4, "\uC11C\uB85C \uB2E4\uB978 \uB450 \uB300\uC751 \uAD00\uACC4\uC758 \uCD9C\uB825 \uBE44\uAD50\uD558\uAE30", () => C("A\uAD00\uACC4\uB294 \uC785\uB825\uC758 3\uBC30, B\uAD00\uACC4\uB294 \uC785\uB825\uC5D0 8\uC744 \uB354\uD569\uB2C8\uB2E4. \uC785\uB825\uC774 5\uC77C \uB54C \uB354 \uD070 \uCD9C\uB825\uACFC \uADF8 \uCC28\uB97C \uACE0\uB974\uC138\uC694.", "A\uAC00 2 \uB354 \uD06C\uB2E4", [["B\uAC00 2 \uB354 \uD06C\uB2E4", "\uBE44\uAD50 \uBC29\uD5A5 \uC624\uB958"], ["A\uAC00 8 \uB354 \uD06C\uB2E4", "\uCD9C\uB825 \uB300\uC2E0 \uACE0\uC815\uB7C9\uC744 \uBE44\uAD50"]], "A\uB294 15, B\uB294 13\uC785\uB2C8\uB2E4."));
a3(1, 3, "inverse-offset-multiply", "6\uC21802-01", 3, "\uACE0\uC815\uB7C9\uC774 \uC788\uB294 \uBC30\uC218 \uAD00\uACC4\uB97C \uAC70\uAFB8\uB85C \uC0AC\uC6A9\uD558\uAE30", () => E("\u25B3 = \u25A1 \xD7 5 + 2\uC785\uB2C8\uB2E4. \u25B3\uAC00 37\uC774\uBA74 \u25A1\uB294 \uC5BC\uB9C8\uC785\uB2C8\uAE4C?", [37, 2, "-", 5, "/"], "\uACE0\uC815\uB7C9\uC744 \uBE7C\uACE0 \uBC30\uC218\uB85C \uB098\uB204\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a3(1, 3, "relation-expression-symbol", "6\uC21802-01", 2, "\uB9D0\uB85C \uC124\uBA85\uD55C \uAD00\uACC4\uB97C \uAE30\uD638\uB85C \uB098\uD0C0\uB0B4\uAE30", () => C("\u25B3\uB294 \u25A1\uBCF4\uB2E4 7 \uC791\uC2B5\uB2C8\uB2E4. \uAD00\uACC4\uC2DD\uC744 \uACE0\uB974\uC138\uC694.", "\u25B3 = \u25A1 - 7", [["\u25B3 = \u25A1 + 7", "\uCC28\uC758 \uBC29\uD5A5 \uC624\uB958"], ["\u25B3 = \u25A1 \xD7 7", "\uCC28\uC640 \uBC30\uC728 \uD63C\uB3D9"]], "\uBE44\uAD50\uD558\uB294 \uC591\uC774 7 \uC791\uC73C\uBBC0\uB85C 7\uC744 \uBE8D\uB2C8\uB2E4."));
a3(1, 3, "input-output-order", "6\uC21802-01", 3, "\uB300\uC751 \uAD00\uACC4\uB97C \uB4A4\uC9D1\uC740 \uC2DD \uD655\uC778\uD558\uAE30", () => C("\u25B3 = \u25A1 \xD7 4\uC785\uB2C8\uB2E4. \u25A1\uB97C \uAD6C\uD558\uB294 \uC2DD\uC744 \uACE0\uB974\uC138\uC694.", "\u25A1 = \u25B3 \xF7 4", [["\u25A1 = \u25B3 \xD7 4", "\uC5ED\uAD00\uACC4 \uB300\uC2E0 \uAC19\uC740 \uC5F0\uC0B0 \uC0AC\uC6A9"], ["\u25A1 = \u25B3 - 4", "\uBC30\uC728\uC744 \uCC28\uB85C \uBC14\uAFC8"]], "\uCD9C\uB825\uC758 4\uBC30 \uAD00\uACC4\uB97C \uB418\uB3CC\uB9AC\uB824\uBA74 4\uB85C \uB098\uB215\uB2C8\uB2E4."));
a3(1, 3, "two-rule-equal-output", "6\uC21802-01", 4, "\uB450 \uAD00\uACC4\uC758 \uCD9C\uB825\uACFC \uC785\uB825 \uC870\uAC74 \uD568\uAED8 \uD655\uC778\uD558\uAE30", () => C("A\uB294 \uC785\uB825\uC758 2\uBC30\uC5D0 3\uC744 \uB354\uD558\uACE0 B\uB294 \uC785\uB825\uC5D0 8\uC744 \uB354\uD569\uB2C8\uB2E4. \uC785\uB825 4, 5, 6 \uC911 \uB450 \uCD9C\uB825\uC774 \uAC19\uC544\uC9C0\uB294 \uC785\uB825\uC744 \uACE0\uB974\uC138\uC694.", "5", [["4", "\uB450 \uCD9C\uB825 11\uACFC 12\uAC00 \uB2E4\uB984"], ["6", "\uB450 \uCD9C\uB825 15\uC640 14\uAC00 \uB2E4\uB984"]], "\uAC01 \uC785\uB825\uC744 \uB450 \uAD00\uACC4\uC5D0 \uB300\uC785\uD558\uBA74 5\uC5D0\uC11C \uBAA8\uB450 13\uC785\uB2C8\uB2E4."));
a3(1, 4, "equivalent-denominator", "6\uC21801-06", 3, "\uB3D9\uCE58 \uBD84\uC218\uC758 \uBE60\uC9C4 \uBD84\uBAA8 \uCC3E\uAE30", (k) => E(`2/5 = ${2 * (2 + k)}/\u25A1\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [5, 2 + k, "*"], "\uBD84\uC790\uAC00 \uCEE4\uC9C4 \uBC30\uC218\uB9CC\uD07C \uBD84\uBAA8\uB3C4 \uCEE4\uC9C0\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"), 12);
a3(1, 4, "fraction-decimal-hundredths", "6\uC21801-12", 2, "\uBD84\uC218\uC640 \uC18C\uC218 \uD45C\uD604\uC744 \uC5F0\uACB0\uD558\uC5EC \uB354\uD558\uAE30", (k) => E(`${f(35 + k, 100)}\uB97C \uC18C\uC218\uB85C \uB098\uD0C0\uB0B8 \uD6C4 0.05\uB97C \uB354\uD55C \uAC12\uC744 \uAD6C\uD558\uC138\uC694.`, [f(35 + k, 100), "0.05", "+"], "\uBD84\uC218\uB97C \uC18C\uC218\uB85C \uBC14\uAFB8\uC5B4 0.05\uB97C \uB354\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "concept"), 12);
a3(1, 4, "simplification-equivalence", "6\uC21801-06", 1, "\uC57D\uBD84\uC774 \uAC12\uC744 \uBC14\uAFB8\uC9C0 \uC54A\uC74C\uC744 \uC774\uD574\uD558\uAE30", () => C("\uBD84\uBAA8\uC640 \uBD84\uC790\uB97C \uAC19\uC740 0\uC774 \uC544\uB2CC \uC218\uB85C \uB098\uB234\uC2B5\uB2C8\uB2E4. \uBD84\uC218\uC758 \uAC12\uC740 \uC5B4\uB5BB\uAC8C \uB429\uB2C8\uAE4C?", "\uAC19\uB2E4", [["\uC791\uC544\uC9C4\uB2E4", "\uC22B\uC790\uAC00 \uC791\uC544\uC9C0\uBA74 \uAC12\uB3C4 \uC791\uC544\uC9C4\uB2E4\uACE0 \uD310\uB2E8"], ["\uCEE4\uC9C4\uB2E4", "\uBD84\uBAA8\uB9CC \uBCC0\uD654\uD588\uB2E4\uACE0 \uD310\uB2E8"]], "\uBD84\uBAA8\uC640 \uBD84\uC790\uB97C \uAC19\uC740 \uBE44\uC728\uB85C \uBC14\uAFB8\uBBC0\uB85C \uB098\uD0C0\uB0B4\uB294 \uC591\uC740 \uAC19\uC2B5\uB2C8\uB2E4."));
a3(1, 4, "lowest-terms-check", "6\uC21801-06", 2, "\uAE30\uC57D\uBD84\uC218 \uC870\uAC74 \uD655\uC778\uD558\uAE30", () => C("\uB2E4\uC74C \uC911 \uAE30\uC57D\uBD84\uC218\uB97C \uACE0\uB974\uC138\uC694.", "5/12", [["6/12", "\uACF5\uC57D\uC218 6\uC774 \uC788\uC74C"], ["8/12", "\uACF5\uC57D\uC218 4\uAC00 \uC788\uC74C"]], "5\uC640 12\uC758 \uACF5\uC57D\uC218\uB294 1\uBFD0\uC785\uB2C8\uB2E4."));
a3(1, 4, "same-numerator-compare", "6\uC21801-07", 3, "\uBD84\uC790\uAC00 \uAC19\uC740 \uBD84\uC218\uC758 \uC870\uAC01 \uD06C\uAE30 \uBE44\uAD50\uD558\uAE30", () => C("3/5\uC640 3/8 \uC911 \uD070 \uBD84\uC218\uB97C \uACE0\uB974\uC138\uC694.", "3/5", [["3/8", "\uD070 \uBD84\uBAA8\uB97C \uD070 \uC870\uAC01\uC73C\uB85C \uC624\uC778"], ["\uAC19\uB2E4", "\uBD84\uC790\uB9CC \uBE44\uAD50"]], "\uAC19\uC740 \uC218\uC758 \uC870\uAC01\uC774\uB77C\uBA74 \uD55C \uC870\uAC01\uC774 \uD070 1/5 \uCABD\uC774 \uD07D\uB2C8\uB2E4."));
a3(1, 4, "common-denominator-option", "6\uC21801-06", 3, "\uD1B5\uBD84\uC5D0 \uAC00\uB2A5\uD55C \uBD84\uBAA8 \uC120\uD0DD\uD558\uAE30", () => C("1/6\uACFC 1/8\uC744 \uD1B5\uBD84\uD560 \uC218 \uC788\uB294 \uACF5\uD1B5 \uBD84\uBAA8\uB97C \uACE0\uB974\uC138\uC694.", "24", [["14", "\uBD84\uBAA8\uB97C \uB354\uD568"], ["12", "8\uC758 \uBC30\uC218\uAC00 \uC544\uB2D8"]], "\uACF5\uD1B5 \uBD84\uBAA8\uB294 \uB450 \uBD84\uBAA8\uC758 \uACF5\uBC30\uC218\uC5EC\uC57C \uD569\uB2C8\uB2E4."));
a3(1, 4, "fraction-decimal-equal", "6\uC21801-12", 2, "\uAC19\uC740 \uAC12\uC778 \uBD84\uC218\xB7\uC18C\uC218 \uCC3E\uAE30", () => C("2/5\uC640 \uAC19\uC740 \uAC12\uC744 \uACE0\uB974\uC138\uC694.", "0.4", [["0.25", "\uBD84\uBAA8 5\uC640 4 \uD63C\uB3D9"], ["0.2", "\uBD84\uC790 2\uB97C \uB204\uB77D"]], "2/5 = 4/10 = 0.4\uC785\uB2C8\uB2E4."));
a3(1, 4, "denominator-only-error", "6\uC21801-06", 3, "\uB3D9\uCE58 \uBD84\uC218\uC5D0\uC11C \uD55C\uCABD\uB9CC \uBC14\uAFB8\uB294 \uC624\uB958 \uCC3E\uAE30", () => C("3/7\uC744 \uBD84\uBAA8\uB9CC \uB450 \uBC30 \uD558\uC5EC 3/14\uB85C \uB9CC\uB4E4\uC5C8\uC2B5\uB2C8\uB2E4. \uC6D0\uB798 \uAC12\uACFC \uAC19\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uBD84\uC790\uB3C4 \uAC19\uC740 \uBC30\uC218\uB85C \uBC14\uAFB8\uB294 \uC870\uAC74 \uB204\uB77D"]], "\uAC19\uC740 \uAC12\uC744 \uC720\uC9C0\uD558\uB824\uBA74 \uBD84\uC790\uC640 \uBD84\uBAA8\uB97C \uD568\uAED8 \uB450 \uBC30 \uD574\uC57C \uD569\uB2C8\uB2E4."));
a3(1, 4, "compare-near-whole", "6\uC21801-07", 3, "\uC804\uCCB4 1\uACFC\uC758 \uCC28\uB85C \uB450 \uBD84\uC218 \uBE44\uAD50\uD558\uAE30", () => C("7/8\uACFC 8/9\uC744 \uD1B5\uBD84\uD558\uC9C0 \uC54A\uACE0 1\uC5D0\uC11C \uBD80\uC871\uD55C \uC591\uC73C\uB85C \uBE44\uAD50\uD588\uC2B5\uB2C8\uB2E4. 8/9\uC774 \uB354 \uD070 \uAE4C\uB2ED\uC744 \uACE0\uB974\uC138\uC694.", "1\uC5D0\uC11C \uBD80\uC871\uD55C 1/9\uC774 1/8\uBCF4\uB2E4 \uC791\uAE30 \uB54C\uBB38\uC774\uB2E4", [["\uBD84\uC790\uAC00 \uD06C\uBA74 \uC5B4\uB5A4 \uBD84\uC218\uB4E0 \uB354 \uD06C\uAE30 \uB54C\uBB38\uC774\uB2E4", "\uBD84\uBAA8\uB97C \uBB34\uC2DC\uD558\uC5EC \uC77C\uBC18\uD654"], ["\uBD84\uBAA8\uAC00 \uD06C\uBA74 \uC5B4\uB5A4 \uBD84\uC218\uB4E0 \uB354 \uD06C\uAE30 \uB54C\uBB38\uC774\uB2E4", "\uC870\uAC01 \uD06C\uAE30\uB97C \uBC18\uB300\uB85C \uC77C\uBC18\uD654"]], "\uC804\uCCB4 1\uC5D0\uC11C \uBE7C\uC57C \uD558\uB294 \uC591\uC774 \uB354 \uC801\uC740 8/9\uC774 \uB354 \uD07D\uB2C8\uB2E4."));
a3(1, 4, "mixed-compare", "6\uC21801-07", 3, "\uC790\uC5F0\uC218 \uBD80\uBD84\uC774 \uAC19\uC740 \uB300\uBD84\uC218 \uBE44\uAD50\uD558\uAE30", () => C("2 1/3\uACFC 2 3/8 \uC911 \uD070 \uC218\uB97C \uACE0\uB974\uC138\uC694.", "2 3/8", [["2 1/3", "\uBD84\uC218 \uBD80\uBD84\uC744 \uBE44\uAD50\uD558\uC9C0 \uC54A\uC74C"], ["\uAC19\uB2E4", "\uC790\uC5F0\uC218 \uBD80\uBD84\uB9CC \uBE44\uAD50"]], "\uC790\uC5F0\uC218 \uBD80\uBD84\uC740 \uAC19\uACE0 \uBD84\uC218 \uBD80\uBD84\uC744 24\uBD84\uC758 \uC591\uC73C\uB85C \uBC14\uAFB8\uBA74 8/24\uC640 9/24\uC785\uB2C8\uB2E4."));
a3(1, 4, "decimal-one-equal", "6\uC21801-12", 3, "\uB05D\uC758 0\uACFC \uBD84\uC218 \uD45C\uD604\uC758 \uAC19\uC740 \uC591 \uD655\uC778\uD558\uAE30", () => C("0.50, 1/2, 5/10\uC758 \uAD00\uACC4\uB97C \uACE0\uB974\uC138\uC694.", "\uC138 \uAC12\uC774 \uBAA8\uB450 \uAC19\uB2E4", [["0.50\uC774 \uAC00\uC7A5 \uD06C\uB2E4", "\uC18C\uC218 \uC790\uB9AC \uC218\uB9CC \uBE44\uAD50"], ["1/2\uB9CC \uB2E4\uB974\uB2E4", "\uC57D\uBD84 \uC804\uD6C4\uC758 \uC591\uC744 \uB2E4\uB974\uAC8C \uD310\uB2E8"]], "0.50\uC740 50/100\uC774\uACE0 \uC138 \uAC12\uC740 \uBAA8\uB450 \uAC19\uC740 \uBC18\uC785\uB2C8\uB2E4."));
a3(1, 4, "equivalence-constraints", "6\uC21801-06", 4, "\uB3D9\uCE58\xB7\uAE30\uC57D\xB7\uBC94\uC704 \uC870\uAC74\uC744 \uD568\uAED8 \uD310\uB2E8\uD558\uAE30", () => C("6/9\uACFC \uAC19\uC740 \uAC12\uC774\uACE0 \uAE30\uC57D\uBD84\uC218\uC774\uBA70 \uBD84\uBAA8\uAC00 10\uBCF4\uB2E4 \uC791\uC740 \uBD84\uC218\uB97C \uACE0\uB974\uC138\uC694.", "2/3 (\uAE30\uC57D\uBD84\uC218)", [["4/6 (\uC57D\uBD84\uD558\uC9C0 \uC54A\uC740 \uBD84\uC218)", "\uAE30\uC57D \uC870\uAC74 \uC704\uBC18"], ["8/12 (\uBD84\uBAA8 12)", "\uAE30\uC57D\xB7\uBD84\uBAA8 \uBC94\uC704 \uC870\uAC74 \uC704\uBC18"]], "6/9\uC758 \uBD84\uC790\uC640 \uBD84\uBAA8\uB97C 3\uC73C\uB85C \uB098\uB204\uBA74 2/3\uC774\uBA70 \uBAA8\uB4E0 \uC870\uAC74\uC5D0 \uB9DE\uC2B5\uB2C8\uB2E4."));

// learning-review-r1/native/data/final-expansion-grade5b.js
var a4 = (s, u, id, code, l, o, fn, domain = 1) => A(5, s, u, "FINAL-" + id, code, l, o, fn, domain);
a4(1, 5, "fraction-three-denominators", "6\uC21801-08", 3, "\uBD84\uBAA8\uAC00 \uB2E4\uB978 \uC138 \uC591 \uD569\uD558\uAE30", (k) => E(`1/2, 1/3, ${f(1 + k % 3, 6)}\uC744 \uBAA8\uB450 \uB354\uD558\uC138\uC694.`, ["1/2", "1/3", "+", f(1 + k % 3, 6), "+"], "\uACF5\uD1B5 \uBD84\uBAA8\uB85C \uC591\uC744 \uB9DE\uCD94\uC5B4 \uBAA8\uB450 \uB354\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"), 3);
a4(1, 5, "fraction-use-and-add", "6\uC21801-08", 3, "\uBD84\uC218 \uC591\uC758 \uAC10\uC18C\uC640 \uC99D\uAC00 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uB9AC\uBCF8 ${f(5 + k, 4)} m\uC5D0\uC11C 1/3 m\uB97C \uC790\uB974\uACE0 1/6 m\uB97C \uC774\uC5B4 \uBD99\uC600\uC2B5\uB2C8\uB2E4. \uCD5C\uC885 \uAE38\uC774\uB97C m \uB2E8\uC704\uC758 \uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, [f(5 + k, 4), "1/3", "-", "1/6", "+"], "\uC0AC\uC6A9\uD55C \uC591\uC744 \uBE7C\uACE0 \uC774\uC5B4 \uBD99\uC778 \uC591\uC744 \uB354\uD558\uBA74 {answer} m\uC785\uB2C8\uB2E4."), 12);
a4(1, 5, "common-pieces-reason", "6\uC21801-08", 1, "\uD1B5\uBD84\uD558\uC5EC \uAC19\uC740 \uD06C\uAE30 \uC870\uAC01\uC744 \uB354\uD558\uB294 \uC774\uC720 \uC774\uD574\uD558\uAE30", () => C("1/3\uACFC 1/4\uC744 \uB354\uD560 \uB54C \uAC19\uC740 \uBD84\uBAA8\uB85C \uBC14\uAFB8\uB294 \uAE4C\uB2ED\uC744 \uACE0\uB974\uC138\uC694.", "\uAC19\uC740 \uD06C\uAE30\uC758 \uC870\uAC01 \uC218\uB85C \uB9DE\uCD94\uAE30 \uC704\uD574\uC11C", [["\uBD84\uBAA8\uAC00 \uCEE4\uC9C8\uC218\uB85D \uAC12\uC774 \uD56D\uC0C1 \uCEE4\uC838\uC11C", "\uB3D9\uCE58 \uAD00\uACC4 \uC624\uC778"], ["\uBD84\uC790\uB97C \uC5C6\uC560\uAE30 \uC704\uD574\uC11C", "\uBD84\uC218 \uAD6C\uC131 \uC5ED\uD560 \uD63C\uB3D9"]], "\uC870\uAC01 \uD06C\uAE30\uB97C \uAC19\uAC8C \uD558\uC5EC \uAC1C\uC218\uB97C \uB354\uD569\uB2C8\uB2E4."));
a4(1, 5, "sum-over-one", "6\uC21801-08", 2, "\uB450 \uBD84\uC218\uC758 \uD569\uACFC \uC804\uCCB4 1 \uBE44\uAD50\uD558\uAE30", () => C("3/4 + 2/3\uC740 1\uBCF4\uB2E4 \uD07D\uB2C8\uAE4C?", "\uC608", [["\uC544\uB2C8\uC694", "\uC804\uCCB4 1 \uAE30\uC900 \uBE44\uAD50\uB97C \uD558\uC9C0 \uC54A\uC74C"]], "12\uB85C \uD1B5\uBD84\uD558\uBA74 9/12 + 8/12 = 17/12\uC785\uB2C8\uB2E4."));
a4(1, 5, "subtraction-negative-condition", "6\uC21801-08", 3, "\uBE84\uC148 \uC0C1\uD669\uC5D0\uC11C \uAC00\uB2A5\uD55C \uC591\uC758 \uC870\uAC74 \uD655\uC778\uD558\uAE30", () => C("\uBB3C 1/4 L\uAC00 \uC788\uB294\uB370 1/3 L\uB97C \uBAA8\uB450 \uC0AC\uC6A9\uD588\uB2E4\uACE0 \uD569\uB2C8\uB2E4. \uB2E4\uB978 \uBB3C\uC744 \uBCF4\uD0DC\uC9C0 \uC54A\uC558\uB2E4\uBA74 \uAC00\uB2A5\uD55C \uC124\uBA85\uC785\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uD604\uC7AC \uC591\uBCF4\uB2E4 \uD070 \uC0AC\uC6A9\uB7C9\uC744 \uD5C8\uC6A9"]], "1/3 L\uAC00 1/4 L\uBCF4\uB2E4 \uB9CE\uC73C\uBBC0\uB85C \uAC00\uC9C4 \uBB3C\uB9CC\uC73C\uB85C\uB294 \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."));
a4(1, 5, "two-routes-same-sum", "6\uC21801-08", 3, "\uACF5\uD1B5 \uBD84\uBAA8 \uC120\uD0DD\uC774 \uB2EC\uB77C\uB3C4 \uAC19\uC740 \uC591\uC784\uC744 \uD655\uC778\uD558\uAE30", () => C("1/2 + 1/3\uC744 \uBD84\uBAA8 6 \uB610\uB294 12\uB85C \uD1B5\uBD84\uD588\uC2B5\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uC758 \uAC12\uC740 \uC5B4\uB5BB\uAC8C \uB429\uB2C8\uAE4C?", "\uAC19\uB2E4", [["\uBD84\uBAA8 12\uC758 \uACB0\uACFC\uAC00 \uB354 \uD06C\uB2E4", "\uBD84\uBAA8 \uD06C\uAE30\uB9CC \uBE44\uAD50"], ["\uBD84\uBAA8 6\uC758 \uACB0\uACFC\uAC00 \uB354 \uD06C\uB2E4", "\uB3D9\uCE58 \uBD84\uC218 \uAD00\uACC4 \uB204\uB77D"]], "\uAC19\uC740 \uC591\uC744 \uB2E4\uB978 \uC870\uAC01 \uD06C\uAE30\uB85C \uB098\uD0C0\uB0B8 \uAC83\uC774\uBBC0\uB85C \uD569\uC758 \uAC12\uB3C4 \uAC19\uC2B5\uB2C8\uB2E4."));
a4(1, 5, "fraction-needed-to-two", "6\uC21801-08", 3, "\uC804\uCCB4 \uBAA9\uD45C\uC5D0\uC11C \uD544\uC694\uD55C \uBD84\uC218 \uC591 \uAD6C\uD558\uAE30", () => E("\uBB3C 1 1/4 L\uB97C 2 L\uB85C \uCC44\uC6B0\uB824 \uD569\uB2C8\uB2E4. \uB354 \uD544\uC694\uD55C \uC591\uC744 L \uB2E8\uC704\uC758 \uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.", [2, "5/4", "-"], "\uBAA9\uD45C\uC5D0\uC11C \uD604\uC7AC \uC591\uC744 \uBE7C\uBA74 {answer} L\uC785\uB2C8\uB2E4."));
a4(1, 5, "fraction-order-of-use", "6\uC21801-08", 3, "\uB450 \uC0AC\uC6A9\uB7C9\uACFC \uC804\uCCB4 \uB0A8\uC740 \uC591 \uC5F0\uACB0\uD558\uAE30", () => E("\uC804\uCCB4 \uC791\uC5C5\uC758 1/3\uACFC 2/5\uB97C \uB05D\uB0C8\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uBD84\uB7C9\uC740 \uC804\uCCB4\uC758 \uC5BC\uB9C8\uC785\uB2C8\uAE4C?", [1, "1/3", "-", "2/5", "-"], "\uC804\uCCB4\uC5D0\uC11C \uB450 \uC644\uB8CC \uBD84\uB7C9\uC744 \uBAA8\uB450 \uBE7C\uBA74 {answer}\uC785\uB2C8\uB2E4."));
a4(1, 5, "fraction-inverse-two-adds", "6\uC21801-08", 3, "\uB450 \uB2E8\uACC4 \uB367\uC148 \uACB0\uACFC\uC5D0\uC11C \uCC98\uC74C \uBD84\uC218 \uBCF5\uC6D0\uD558\uAE30", () => E("\uC5B4\uB5A4 \uC218\uC5D0 1/4\uC744 \uB354\uD558\uACE0 1/6\uC744 \uB354\uD588\uB354\uB2C8 5/6\uC785\uB2C8\uB2E4. \uC5B4\uB5A4 \uC218\uB97C \uAD6C\uD558\uC138\uC694.", ["5/6", "1/6", "-", "1/4", "-"], "\uB098\uC911\uC5D0 \uB354\uD55C \uC591\uBD80\uD130 \uB418\uB3CC\uB824 \uBE7C\uBA74 {answer}\uC785\uB2C8\uB2E4."));
a4(1, 5, "unlike-incorrect-subtraction", "6\uC21801-08", 3, "\uBD84\uC790\uB07C\uB9AC\uB9CC \uBE7C\uB294 \uC624\uB958 \uAD6C\uBCC4\uD558\uAE30", () => C("3/4 - 1/3\uC758 \uBC14\uB978 \uAC12\uC744 \uACE0\uB974\uC138\uC694.", "5/12", [["2/1", "\uBD84\uBAA8\uC640 \uBD84\uC790\uB97C \uAC01\uAC01 \uBE8C"], ["2/4", "\uB2E4\uB978 \uC870\uAC01 \uD06C\uAE30\uB97C \uB9DE\uCD94\uC9C0 \uC54A\uC74C"]], "12\uB85C \uD1B5\uBD84\uD558\uBA74 9/12 - 4/12\uC785\uB2C8\uB2E4."));
a4(1, 5, "mixed-combined-amount", "6\uC21801-08", 3, "\uC790\uC5F0\uC218\uC640 \uBD84\uC218 \uBD80\uBD84\uC744 \uD568\uAED8 \uD569\uD558\uAE30", () => E("\uB048 2 1/3 m\uC640 1 3/4 m\uB97C \uACB9\uCE58\uC9C0 \uC54A\uAC8C \uC774\uC5C8\uC2B5\uB2C8\uB2E4. \uC804\uCCB4 \uAE38\uC774\uB97C m \uB2E8\uC704\uC758 \uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.", ["7/3", "7/4", "+"], "\uC790\uC5F0\uC218 \uBD80\uBD84\uACFC \uD1B5\uBD84\uD55C \uBD84\uC218 \uBD80\uBD84\uC744 \uD569\uD558\uBA74 {answer} m\uC785\uB2C8\uB2E4."));
a4(1, 5, "fraction-constraint-strategy", "6\uC21801-08", 4, "\uD569\xB7\uCC28\xB7\uBAA9\uD45C \uC870\uAC74\uC744 \uBAA8\uB450 \uC801\uC6A9\uD558\uAE30", () => C("\uBB3C 2 L\uC5D0\uC11C \uCCAB \uD65C\uB3D9\uC5D0 1/3 L, \uB458\uC9F8 \uD65C\uB3D9\uC5D0 3/4 L\uB97C \uC37C\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uC591\uC744 1 L\uB85C \uB9DE\uCD94\uB824\uBA74 \uBB34\uC5C7\uC744 \uD574\uC57C \uD569\uB2C8\uAE4C?", "1/12 L\uB97C \uB354 \uB123\uB294\uB2E4", [["1/12 L\uB97C \uB354 \uBE80\uB2E4", "\uBD80\uC871\uACFC \uCD08\uACFC \uBC29\uD5A5 \uD63C\uB3D9"], ["5/12 L\uB97C \uB354 \uB123\uB294\uB2E4", "\uB450 \uC0AC\uC6A9\uB7C9\uC744 \uBAA8\uB450 \uBC18\uC601\uD558\uC9C0 \uC54A\uC74C"]], "\uB0A8\uC740 \uC591\uC740 11/12 L\uC774\uBBC0\uB85C 1 L\uBCF4\uB2E4 1/12 L \uBD80\uC871\uD569\uB2C8\uB2E4."));
a4(1, 6, "rhombus-diagonals", "6\uC21803-14", 3, "\uB450 \uB300\uAC01\uC120\uC73C\uB85C \uB9C8\uB984\uBAA8 \uB113\uC774 \uAD6C\uD558\uAE30", (k) => E(`\uB9C8\uB984\uBAA8\uC758 \uB450 \uB300\uAC01\uC120\uC740 ${8 + 2 * k} cm\uC640 6 cm\uC785\uB2C8\uB2E4. \uB113\uC774\uB294 \uBA87 cm\xB2\uC785\uB2C8\uAE4C?`, [8 + 2 * k, 6, "*", 2, "/"], "\uB300\uAC01\uC120 \uB450 \uAE38\uC774\uC758 \uACF1\uC744 2\uB85C \uB098\uB204\uBA74 {answer} cm\xB2\uC785\uB2C8\uB2E4.", "cm\xB2"), 12);
a4(1, 6, "perimeter-inverse-side", "6\uC21803-11", 3, "\uC9C1\uC0AC\uAC01\uD615 \uB458\uB808\uC640 \uD55C \uBCC0\uC73C\uB85C \uB2E4\uB978 \uBCC0 \uAD6C\uD558\uAE30", (k) => E(`\uC9C1\uC0AC\uAC01\uD615\uC758 \uB458\uB808\uB294 ${30 + 2 * k} cm\uC774\uACE0 \uC138\uB85C\uB294 6 cm\uC785\uB2C8\uB2E4. \uAC00\uB85C\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?`, [30 + 2 * k, 2, "/", 6, "-"], "\uB458\uB808\uC758 \uC808\uBC18\uC5D0\uC11C \uC138\uB85C\uB97C \uBE7C\uBA74 {answer} cm\uC785\uB2C8\uB2E4.", "cm"), 12);
a4(1, 6, "area-unit-square", "6\uC21803-12", 1, "\uB113\uC774 \uB2E8\uC704\uAC00 \uB098\uD0C0\uB0B4\uB294 \uB2E8\uC704 \uC815\uC0AC\uAC01\uD615 \uC774\uD574\uD558\uAE30", () => C("1 cm\xB2\uC758 \uB73B\uC744 \uACE0\uB974\uC138\uC694.", "\uD55C \uBCC0\uC774 1 cm\uC778 \uC815\uC0AC\uAC01\uD615\uC758 \uB113\uC774", [["\uAE38\uC774 1 cm\uC778 \uC120\uBD84", "\uAE38\uC774\uC640 \uB113\uC774 \uD63C\uB3D9"], ["\uB124 \uBCC0 \uAE38\uC774 \uD569\uC774 1 cm\uC778 \uC815\uC0AC\uAC01\uD615", "\uB2E8\uC704 \uC815\uC0AC\uAC01\uD615 \uC870\uAC74 \uC624\uB958"]], "\uB113\uC774\uB294 \uB2E8\uC704 \uC815\uC0AC\uAC01\uD615\uC774 \uCC28\uC9C0\uD558\uB294 \uD06C\uAE30\uB85C \uB098\uD0C0\uB0C5\uB2C8\uB2E4."));
a4(1, 6, "height-not-side", "6\uC21803-14", 2, "\uC0BC\uAC01\uD615 \uB192\uC774\uC640 \uBE44\uC2A4\uB4EC\uD55C \uBCC0 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC0BC\uAC01\uD615\uC758 \uBC11\uBCC0\uC5D0 \uB300\uD55C \uB192\uC774\uB294 \uC5B4\uB5A4 \uAE38\uC774\uC785\uB2C8\uAE4C?", "\uB9DE\uC740\uD3B8 \uAF2D\uC9D3\uC810\uC5D0\uC11C \uBC11\uBCC0\uC744 \uD3EC\uD568\uD55C \uC9C1\uC120\uC5D0 \uC218\uC9C1\uC73C\uB85C \uB0B4\uB9B0 \uAC70\uB9AC", [["\uC544\uBB34 \uBE44\uC2A4\uB4EC\uD55C \uBCC0\uC758 \uAE38\uC774", "\uBCC0\uC744 \uD56D\uC0C1 \uB192\uC774\uB85C \uC624\uC778"], ["\uBC11\uBCC0 \uAE38\uC774\uC758 \uC808\uBC18", "\uBC11\uBCC0\uACFC \uB192\uC774 \uD63C\uB3D9"]], "\uB192\uC774\uB294 \uBC11\uBCC0\uC5D0 \uC218\uC9C1\uC778 \uAC70\uB9AC\uC785\uB2C8\uB2E4."));
a4(1, 6, "parallelogram-area", "6\uC21803-14", 3, "\uD3C9\uD589\uC0AC\uBCC0\uD615 \uBC11\uBCC0\uACFC \uC218\uC9C1 \uB192\uC774 \uC801\uC6A9\uD558\uAE30", () => E("\uD3C9\uD589\uC0AC\uBCC0\uD615\uC758 \uBC11\uBCC0\uC740 11 cm, \uADF8\uC5D0 \uC218\uC9C1\uC778 \uB192\uC774\uB294 4 cm\uC785\uB2C8\uB2E4. \uB113\uC774\uB294 \uBA87 cm\xB2\uC785\uB2C8\uAE4C?", [11, 4, "*"], "\uBC11\uBCC0\uACFC \uB192\uC774\uB97C \uACF1\uD558\uBA74 {answer} cm\xB2\uC785\uB2C8\uB2E4.", "cm\xB2"));
a4(1, 6, "triangle-vs-rectangle", "6\uC21803-14", 3, "\uAC19\uC740 \uBC11\uBCC0 \uB192\uC774\uC778 \uB3C4\uD615\uC758 \uB113\uC774 \uAD00\uACC4 \uC774\uD574\uD558\uAE30", () => C("\uBC11\uBCC0\uACFC \uC218\uC9C1 \uB192\uC774\uAC00 \uAC19\uC740 \uC0BC\uAC01\uD615\uACFC \uC9C1\uC0AC\uAC01\uD615\uC758 \uB113\uC774\uB97C \uBE44\uAD50\uD558\uC138\uC694.", "\uC0BC\uAC01\uD615\uC740 \uC9C1\uC0AC\uAC01\uD615\uC758 \uC808\uBC18", [["\uB450 \uB113\uC774\uAC00 \uAC19\uB2E4", "2\uB85C \uB098\uB204\uB294 \uC870\uAC74 \uB204\uB77D"], ["\uC0BC\uAC01\uD615\uC774 \uB450 \uBC30", "\uB113\uC774 \uAD00\uACC4 \uBC18\uB300\uB85C \uC774\uD574"]], "\uC0BC\uAC01\uD615 \uB450 \uAC1C\uB85C \uAC19\uC740 \uBC11\uBCC0\uACFC \uB192\uC774\uC758 \uC9C1\uC0AC\uAC01\uD615\uC744 \uAD6C\uC131\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."));
a4(1, 6, "unit-ratio-squared", "6\uC21803-12", 3, "\uAE38\uC774 \uBC30\uC728\uACFC \uB113\uC774 \uBC30\uC728 \uAD6C\uBCC4\uD558\uAE30", () => C("1 m\uAC00 100 cm\uC774\uBBC0\uB85C 1 m\xB2\uB294 100 cm\xB2\uB77C\uACE0 \uD588\uC2B5\uB2C8\uB2E4. \uBC14\uB978 \uAC12\uC744 \uACE0\uB974\uC138\uC694.", "10000 cm\xB2", [["100 cm\xB2", "\uD55C \uBC29\uD5A5\uC758 \uBC30\uC728\uB9CC \uC801\uC6A9"], ["1000 cm\xB2", "\uB450 \uBC29\uD5A5 \uBC30\uC728 \uC624\uB958"]], "\uB2E8\uC704 \uC815\uC0AC\uAC01\uD615\uC758 \uAC00\uB85C\uC640 \uC138\uB85C\uAC00 \uAC01\uAC01 100\uBC30\uC785\uB2C8\uB2E4."));
a4(1, 6, "same-area-different-shape", "6\uC21803-13", 4, "\uAC19\uC740 \uB113\uC774\uB97C \uB9CC\uB4DC\uB294 \uC11C\uB85C \uB2E4\uB978 \uAE38\uC774 \uBE44\uAD50\uD558\uAE30", () => C("\uAC00\uB85C\xB7\uC138\uB85C\uAC00 6 cm\xB74 cm\uC778 \uC9C1\uC0AC\uAC01\uD615\uACFC \uB113\uC774\uAC00 \uAC19\uC740 \uC9C1\uC0AC\uAC01\uD615\uC744 \uACE0\uB974\uC138\uC694.", "8 cm\xB73 cm", [["8 cm\xB74 cm", "\uD55C \uBCC0\uB9CC \uB298\uB9AC\uACE0 \uB113\uC774 \uC720\uC9C0\uB85C \uD310\uB2E8"], ["6 cm\xB73 cm", "\uD55C \uBCC0 \uAC10\uC18C\uB97C \uACE0\uB824\uD558\uC9C0 \uC54A\uC74C"]], "\uAC01 \uAC00\uB85C\uC640 \uC138\uB85C\uC758 \uACF1\uC744 \uBE44\uAD50\uD569\uB2C8\uB2E4."));
a4(1, 6, "triangle-height-inverse", "6\uC21803-14", 3, "\uC0BC\uAC01\uD615 \uB113\uC774\uC640 \uBC11\uBCC0\uC5D0\uC11C \uB192\uC774 \uAD6C\uD558\uAE30", () => E("\uC0BC\uAC01\uD615\uC758 \uB113\uC774\uB294 35 cm\xB2, \uBC11\uBCC0\uC740 10 cm\uC785\uB2C8\uB2E4. \uC218\uC9C1 \uB192\uC774\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?", [35, 2, "*", 10, "/"], "\uB113\uC774\uB97C \uB450 \uBC30 \uD558\uACE0 \uBC11\uBCC0\uC73C\uB85C \uB098\uB204\uBA74 {answer} cm\uC785\uB2C8\uB2E4.", "cm"));
a4(1, 6, "perimeter-area-choice", "6\uC21803-11", 3, "\uD14C\uB450\uB9AC \uAE38\uC774\uC640 \uC548\uCABD \uD06C\uAE30 \uAD6C\uBCC4\uD558\uAE30", () => C("\uD654\uB2E8\uC758 \uD14C\uB450\uB9AC\uC5D0 \uC6B8\uD0C0\uB9AC\uB97C \uB450\uB974\uB824 \uD569\uB2C8\uB2E4. \uBA3C\uC800 \uAD6C\uD574\uC57C \uD558\uB294 \uC591\uC744 \uACE0\uB974\uC138\uC694.", "\uB458\uB808", [["\uB113\uC774", "\uC548\uCABD \uD06C\uAE30\uC640 \uD14C\uB450\uB9AC \uD63C\uB3D9"], ["\uAF2D\uC9D3\uC810 \uC218", "\uD544\uC694\uD55C \uAE38\uC774\uC640 \uBB34\uAD00"]], "\uC6B8\uD0C0\uB9AC\uB294 \uD14C\uB450\uB9AC \uC804\uCCB4 \uAE38\uC774\uC5D0 \uD574\uB2F9\uD569\uB2C8\uB2E4."));
a4(1, 6, "composite-two-rectangles", "6\uC21803-13", 3, "\uACB9\uCE58\uC9C0 \uC54A\uB294 \uB450 \uC9C1\uC0AC\uAC01\uD615 \uB113\uC774 \uD569\uD558\uAE30", () => E("\uBAA8\uC591\uC740 \uC9C1\uC0AC\uAC01\uD615 5 cm \xD7 4 cm\uC640 3 cm \xD7 2 cm\uB97C \uACB9\uCE58\uC9C0 \uC54A\uAC8C \uC774\uC5B4 \uB9CC\uB4E0 \uAC83\uC785\uB2C8\uB2E4. \uC804\uCCB4 \uB113\uC774\uB294 \uBA87 cm\xB2\uC785\uB2C8\uAE4C?", [5, 4, "*", 3, 2, "*", "+"], "\uB450 \uBD80\uBD84\uC758 \uB113\uC774\uB97C \uB354\uD558\uBA74 {answer} cm\xB2\uC785\uB2C8\uB2E4.", "cm\xB2"));
a4(1, 6, "design-area-and-perimeter", "6\uC21803-13", 5, "\uB113\uC774\uC640 \uBCC0 \uC81C\uD55C\uC744 \uD568\uAED8 \uB9CC\uC871\uD558\uB294 \uC124\uACC4 \uCC3E\uAE30", () => C("\uB113\uC774\uAC00 36 cm\xB2\uC774\uACE0 \uAC00\uB85C\xB7\uC138\uB85C\uAC00 \uC790\uC5F0\uC218\uC778 \uC9C1\uC0AC\uAC01\uD615\uC744 \uB9CC\uB4ED\uB2C8\uB2E4. \uAC00\uB85C\uB294 \uC138\uB85C \uC774\uC0C1\uC774\uBA70 \uC138\uB85C\uAC00 4 cm \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4. \uC81C\uC2DC\uD55C \uC124\uACC4 \uC911 \uB458\uB808\uAC00 \uAC00\uC7A5 \uC791\uC740 \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "6 cm \xD7 6 cm", [["9 cm \xD7 4 cm", "\uC870\uAC74\uC5D0 \uB9DE\uC9C0\uB9CC \uB458\uB808\uAC00 \uB354 \uD07C"], ["12 cm \xD7 3 cm", "\uC138\uB85C \uC81C\uD55C \uC704\uBC18"]], "\uC870\uAC74\uC5D0 \uB9DE\uB294 \uC124\uACC4\uC758 \uB458\uB808\uB97C \uBE44\uAD50\uD558\uBA74 6 \xD7 6\uC740 24 cm, 9 \xD7 4\uB294 26 cm\uC785\uB2C8\uB2E4."));
a4(2, 1, "rounding-tens-range", "6\uC21801-03", 3, "\uBC18\uC62C\uB9BC \uACB0\uACFC\uC640 \uC790\uC5F0\uC218 \uBC94\uC704 \uC5F0\uACB0\uD558\uAE30", (k) => E(`${145 + 10 * k}\uB97C \uC2ED\uC758 \uC790\uB9AC\uAE4C\uC9C0 \uBC18\uC62C\uB9BC\uD558\uC138\uC694.`, [145 + 10 * k, 5, "+", 10, "floor/", 10, "*"], "\uC77C\uC758 \uC790\uB9AC 5\uB97C \uBCF4\uACE0 \uC62C\uB9AC\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"), 12);
a4(2, 1, "range-count", "6\uC21801-02", 3, "\uACBD\uACC4\uB97C \uD3EC\uD568\uD558\uB294 \uC790\uC5F0\uC218 \uAC1C\uC218 \uC138\uAE30", (k) => E(`${12 + k} \uC774\uC0C1 ${19 + k} \uC774\uD558\uC778 \uC790\uC5F0\uC218\uB294 \uBAA8\uB450 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [19 + k, 12 + k, "-", 1, "+"], "\uC591 \uB05D\uC744 \uD3EC\uD568\uD558\uBBC0\uB85C \uCC28\uC5D0 1\uC744 \uB354\uD574 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 12);
a4(2, 1, "inclusive-upper", "6\uC21801-02", 1, "\uC774\uD558\uC758 \uACBD\uACC4 \uD3EC\uD568 \uD655\uC778\uD558\uAE30", () => C("\uB192\uC774\uAC00 150 cm \uC774\uD558\uC778 \uC0AC\uB78C\uC5D0 \uC815\uD655\uD788 150 cm\uB3C4 \uD3EC\uD568\uB429\uB2C8\uAE4C?", "\uC608", [["\uC544\uB2C8\uC694", "\uC774\uD558\uC640 \uBBF8\uB9CC \uD63C\uB3D9"]], "\uC774\uD558\uB294 \uAE30\uC900\uAC12\uC744 \uD3EC\uD568\uD569\uB2C8\uB2E4."));
a4(2, 1, "strict-lower", "6\uC21801-02", 1, "\uCD08\uACFC\uC758 \uACBD\uACC4 \uC81C\uC678 \uD655\uC778\uD558\uAE30", () => C("\uBB34\uAC8C\uAC00 5 kg \uCD08\uACFC\uC778 \uBB3C\uAC74\uC5D0 \uC815\uD655\uD788 5 kg\uC744 \uD3EC\uD568\uD569\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uCD08\uACFC\uC640 \uC774\uC0C1 \uD63C\uB3D9"]], "\uCD08\uACFC\uB294 \uAE30\uC900\uAC12\uC744 \uD3EC\uD568\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."));
a4(2, 1, "floor-place", "6\uC21801-03", 2, "\uC815\uD55C \uC790\uB9AC\uC5D0\uC11C \uBC84\uB9BC \uC801\uC6A9\uD558\uAE30", () => E("3687\uC744 \uBC31\uC758 \uC790\uB9AC\uAE4C\uC9C0 \uBC84\uB9BC\uD558\uC5EC \uB098\uD0C0\uB0B4\uC138\uC694.", [3687, 100, "floor/", 100, "*"], "\uBC31\uC758 \uC790\uB9AC \uC544\uB798\uB97C \uBC84\uB9AC\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a4(2, 1, "ceil-place", "6\uC21801-03", 2, "\uC815\uD55C \uC790\uB9AC\uC5D0\uC11C \uC62C\uB9BC \uC801\uC6A9\uD558\uAE30", () => E("2401\uC744 \uCC9C\uC758 \uC790\uB9AC\uAE4C\uC9C0 \uC62C\uB9BC\uD558\uC5EC \uB098\uD0C0\uB0B4\uC138\uC694.", [2401, 1e3, "ceil/", 1e3, "*"], "\uCC9C\uC758 \uC790\uB9AC \uC544\uB798 \uC218\uAC00 \uB0A8\uC73C\uBBC0\uB85C \uB2E4\uC74C \uCC9C \uB2E8\uC704 \uC218 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a4(2, 1, "round-all-zeros", "6\uC21801-03", 3, "\uC774\uBBF8 \uC815\uD55C \uC790\uB9AC \uC218\uC778 \uACBD\uC6B0 \uC720\uC9C0 \uD310\uB2E8\uD558\uAE30", () => C("3500\uC744 \uBC31\uC758 \uC790\uB9AC\uAE4C\uC9C0 \uC62C\uB9BC\uD558\uBA74 \uC5BC\uB9C8\uC785\uB2C8\uAE4C?", "3500", [["3600", "\uC544\uB798 \uC790\uB9AC \uAC12\uC774 \uC5C6\uB294\uB370\uB3C4 \uC62C\uB9BC"], ["4000", "\uC815\uD55C \uC790\uB9AC \uD63C\uB3D9"]], "\uC774\uBBF8 \uBC31 \uB2E8\uC704\uB85C \uB098\uD0C0\uB09C \uC218\uC774\uBBC0\uB85C \uADF8\uB300\uB85C\uC785\uB2C8\uB2E4."));
a4(2, 1, "range-intersection", "6\uC21801-02", 4, "\uB450 \uBC94\uC704 \uC870\uAC74\uC744 \uB3D9\uC2DC\uC5D0 \uB9CC\uC871\uC2DC\uD0A4\uAE30", () => C("10 \uC774\uC0C1 20 \uBBF8\uB9CC\uC774\uBA74\uC11C 15 \uC774\uC0C1\uC778 \uC790\uC5F0\uC218\uC758 \uBC94\uC704\uB97C \uACE0\uB974\uC138\uC694.", "15 \uC774\uC0C1 20 \uBBF8\uB9CC", [["10 \uC774\uC0C1 20 \uBBF8\uB9CC", "\uB458\uC9F8 \uD558\uD55C \uC870\uAC74 \uB204\uB77D"], ["15 \uCD08\uACFC 20 \uC774\uD558", "\uACBD\uACC4 \uD3EC\uD568 \uC870\uAC74 \uBCC0\uACBD"]], "\uB450 \uC870\uAC74\uC744 \uB3D9\uC2DC\uC5D0 \uB9CC\uC871\uD558\uB294 \uBC94\uC704\uB97C \uCC3E\uC2B5\uB2C8\uB2E4."));
a4(2, 1, "appropriate-round-mode", "6\uC21801-03", 3, "\uC790\uC6D0\uC774 \uBD80\uC871\uD558\uC9C0 \uC54A\uB3C4\uB85D \uC62C\uB9BC \uC120\uD0DD\uD558\uAE30", () => C("\uC778\uC6D0\uC744 \uBAA8\uB450 \uD0DC\uC6B8 \uCC28\uB7C9 \uC218\uB97C \uC5B4\uB9BC\uD569\uB2C8\uB2E4. \uBAAB \uC544\uB798\uC758 \uB0A8\uB294 \uC778\uC6D0\uC744 \uBB34\uC2DC\uD558\uC9C0 \uC54A\uC73C\uB824\uBA74 \uC5B4\uB5A4 \uCC98\uB9AC\uAC00 \uC54C\uB9DE\uC2B5\uB2C8\uAE4C?", "\uC62C\uB9BC", [["\uBC84\uB9BC", "\uB0A8\uB294 \uC778\uC6D0\uC744 \uD0DC\uC6B8 \uCC28\uB7C9 \uB204\uB77D"], ["\uD56D\uC0C1 \uBC18\uC62C\uB9BC", "\uB0A8\uB294 \uC778\uC6D0\uC774 \uC801\uC73C\uBA74 \uBD80\uC871\uD560 \uC218 \uC788\uC74C"]], "\uD55C \uC0AC\uB78C\uC774\uB77C\uB3C4 \uB0A8\uC73C\uBA74 \uCC28\uB7C9\uC774 \uB354 \uD544\uC694\uD569\uB2C8\uB2E4."));
a4(2, 1, "round-upper-bound", "6\uC21801-03", 3, "\uBC18\uC62C\uB9BC \uACB0\uACFC\uC5D0\uC11C \uAC00\uC7A5 \uD070 \uC790\uC5F0\uC218 \uCC3E\uAE30", () => C("\uBC31\uC758 \uC790\uB9AC\uAE4C\uC9C0 \uBC18\uC62C\uB9BC\uD558\uC5EC 700\uC774 \uB418\uB294 \uC790\uC5F0\uC218 \uC911 \uAC00\uC7A5 \uD070 \uC218\uB97C \uACE0\uB974\uC138\uC694.", "749", [["750", "\uB2E4\uC74C \uAD6C\uAC04\uC73C\uB85C \uB118\uC5B4\uAC10"], ["799", "\uBC84\uB9BC \uAD6C\uAC04\uACFC \uD63C\uB3D9"]], "650\uBD80\uD130 749\uAE4C\uC9C0 \uBC18\uC62C\uB9BC \uACB0\uACFC\uAC00 700\uC785\uB2C8\uB2E4."));
a4(2, 1, "measurement-word-range", "6\uC21801-02", 3, "\uB9D0\uB85C \uC81C\uC2DC\uD55C \uBC94\uC704\uB97C \uC790\uB8CC\uC5D0 \uC801\uC6A9\uD558\uAE30", () => C("\uAE38\uC774\uAC00 20 cm \uC774\uC0C1 25 cm \uBBF8\uB9CC\uC778 \uB048\uC744 \uACE0\uB985\uB2C8\uB2E4. \uAC00\uB2A5\uD55C \uAE38\uC774\uB97C \uACE0\uB974\uC138\uC694.", "20 cm", [["19.9 cm", "\uD558\uD55C \uBBF8\uB2EC"], ["25 cm", "\uC81C\uC678\uB418\uB294 \uC0C1\uD55C"]], "20\uC740 \uD3EC\uD568\uD558\uACE0 25\uB294 \uD3EC\uD568\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."));
a4(2, 1, "round-and-range-strategy", "6\uC21801-03", 4, "\uBC18\uC62C\uB9BC \uAD6C\uAC04\uACFC \uC2E4\uC81C \uBC94\uC704 \uC870\uAC74 \uACB0\uD569\uD558\uAE30", () => C("\uC2ED\uC758 \uC790\uB9AC\uAE4C\uC9C0 \uBC18\uC62C\uB9BC\uD558\uC5EC 80\uC774 \uB418\uBA70 78 \uC774\uC0C1\uC778 \uC790\uC5F0\uC218 \uC911 \uAC00\uC7A5 \uD070 \uC218\uB97C \uACE0\uB974\uC138\uC694.", "84", [["85", "\uBC18\uC62C\uB9BC \uACB0\uACFC\uAC00 90"], ["77", "\uC2E4\uC81C \uD558\uD55C \uC870\uAC74 \uC704\uBC18"]], "75~84 \uC911 78 \uC774\uC0C1\uC778 \uC218\uB294 78~84\uC774\uBA70 \uAC00\uC7A5 \uD070 \uC218\uB294 84\uC785\uB2C8\uB2E4."));
a4(2, 2, "fraction-product-two-sources", "6\uC21801-09", 3, "\uC804\uCCB4\uC758 \uBD84\uC218\uB9CC\uD07C\uC778 \uB450 \uC591 \uD569\uD558\uAE30", (k) => E(`\uAD6C\uC2AC ${12 * (2 + k)}\uAC1C\uC758 1/3\uACFC \uB2E4\uB978 \uAD6C\uC2AC 20\uAC1C\uC758 1/4\uC744 \uD569\uD569\uB2C8\uB2E4. \uBAA8\uB450 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [12 * (2 + k), "1/3", "*", 20, "1/4", "*", "+"], "\uAC01 \uC804\uCCB4\uC758 \uBD80\uBD84 \uC591\uC744 \uAD6C\uD574 \uB354\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 12);
a4(2, 2, "fraction-length-repeat-gap", "6\uC21801-09", 3, "\uBC18\uBCF5\uD55C \uBD84\uC218 \uAE38\uC774\uC640 \uC8FC\uC5B4\uC9C4 \uAE38\uC774 \uCC28 \uAD6C\uD558\uAE30", (k) => E(`\uD55C \uC870\uAC01\uC740 3/5 m\uC774\uACE0 ${4 + k}\uC870\uAC01\uC744 \uC774\uC5C8\uC2B5\uB2C8\uB2E4. 1 m\uBCF4\uB2E4 \uAE34 \uC591\uC744 m \uB2E8\uC704\uC758 \uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, ["3/5", 4 + k, "*", 1, "-"], "\uC804\uCCB4 \uAE38\uC774\uB97C \uACF1\uC148\uC73C\uB85C \uAD6C\uD558\uACE0 1 m\uB97C \uBE7C\uBA74 {answer} m\uC785\uB2C8\uB2E4."), 12);
a4(2, 2, "multiply-one", "6\uC21801-09", 1, "1\uC744 \uACF1\uD55C \uBD84\uC218 \uAC12 \uC774\uD574\uD558\uAE30", () => C("4/7\uC5D0 1\uC744 \uACF1\uD558\uBA74 \uAC12\uC774 \uC5B4\uB5BB\uAC8C \uB429\uB2C8\uAE4C?", "\uADF8\uB300\uB85C\uC774\uB2E4", [["0\uC774 \uB41C\uB2E4", "1\uACFC 0\uC758 \uC5ED\uD560 \uD63C\uB3D9"], ["7/4\uAC00 \uB41C\uB2E4", "\uC5ED\uC218\uB85C \uBC14\uAFC8"]], "1\uBC30\uB294 \uAC19\uC740 \uC591\uC785\uB2C8\uB2E4."));
a4(2, 2, "multiply-zero", "6\uC21801-09", 2, "\uBD84\uC218\uC5D0 0\uC744 \uACF1\uD55C \uC758\uBBF8 \uC774\uD574\uD558\uAE30", () => E("5/8 \xD7 0\uC744 \uACC4\uC0B0\uD558\uC138\uC694.", ["5/8", 0, "*"], "\uC5B4\uB5A4 \uC591\uB3C4 0\uBC88\uC774\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a4(2, 2, "part-of-part", "6\uC21801-09", 3, "\uC804\uCCB4\uC758 \uC77C\uBD80 \uC911 \uB2E4\uC2DC \uC77C\uBD80\uC778 \uC591 \uAD6C\uD558\uAE30", () => E("\uC804\uCCB4\uC758 3/4 \uC911 2/3\uB9CC\uD07C\uC744 \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4. \uC0AC\uC6A9\uD55C \uC591\uC740 \uC6D0\uB798 \uC804\uCCB4\uC758 \uC5BC\uB9C8\uC785\uB2C8\uAE4C?", ["3/4", "2/3", "*"], "\uBD80\uBD84\uC758 \uBD80\uBD84\uC740 \uB450 \uBD84\uC218\uB97C \uACF1\uD558\uC5EC {answer}\uC785\uB2C8\uB2E4."));
a4(2, 2, "natural-commutativity", "6\uC21801-09", 2, "\uBD84\uC218\uC640 \uC790\uC5F0\uC218 \uACF1\uC758 \uC21C\uC11C \uBE44\uAD50\uD558\uAE30", () => C("3 \xD7 2/5\uC640 2/5 \xD7 3\uC758 \uAC12\uC744 \uBE44\uAD50\uD558\uC138\uC694.", "\uAC19\uB2E4", [["\uC55E \uC2DD\uC774 \uB354 \uD06C\uB2E4", "\uACF1\uD558\uB294 \uC21C\uC11C\uB97C \uD06C\uAE30 \uBCC0\uD654\uB85C \uD310\uB2E8"], ["\uB4A4 \uC2DD\uC774 \uB354 \uD06C\uB2E4", "\uACF1\uD558\uB294 \uC21C\uC11C\uB97C \uD06C\uAE30 \uBCC0\uD654\uB85C \uD310\uB2E8"]], "\uACF1\uD558\uB294 \uC21C\uC11C\uB97C \uBC14\uAFB8\uC5B4\uB3C4 \uAC12\uC740 \uAC19\uC2B5\uB2C8\uB2E4."));
a4(2, 2, "multiplier-greater-one", "6\uC21801-09", 3, "1\uBCF4\uB2E4 \uD070 \uBD84\uC218\uB97C \uACF1\uD55C \uD06C\uAE30 \uD310\uB2E8\uD558\uAE30", () => C("\uC591\uC218\uC5D0 5/4\uB97C \uACF1\uD558\uBA74 \uC6D0\uB798 \uC218\uC640 \uBE44\uAD50\uD558\uC5EC \uC5B4\uB5BB\uC2B5\uB2C8\uAE4C?", "\uCEE4\uC9C4\uB2E4", [["\uC791\uC544\uC9C4\uB2E4", "\uBD84\uC218\uB294 \uC5B8\uC81C\uB098 1\uBCF4\uB2E4 \uC791\uB2E4\uACE0 \uD310\uB2E8"], ["\uAC19\uB2E4", "\uACF1\uD558\uB294 \uC591\uC758 \uD06C\uAE30 \uBB34\uC2DC"]], "5/4\uB294 1\uBCF4\uB2E4 \uD06C\uBBC0\uB85C \uC6D0\uB798 \uC591\uBCF4\uB2E4 \uCEE4\uC9D1\uB2C8\uB2E4."));
a4(2, 2, "fraction-multiplication-error", "6\uC21801-09", 3, "\uBD84\uC218 \uACF1\uC148\uC5D0\uC11C \uBD84\uBAA8 \uC720\uC9C0 \uC624\uB958 \uCC3E\uAE30", () => C("2/3 \xD7 3/4\uB97C 6/4\uB77C\uACE0 \uACC4\uC0B0\uD588\uC2B5\uB2C8\uB2E4. \uBC14\uB978 \uACB0\uACFC\uB97C \uACE0\uB974\uC138\uC694.", "1/2", [["6/4", "\uCCAB \uBD84\uBAA8 3\uC744 \uB204\uB77D"], ["5/7", "\uBD84\uC790\xB7\uBD84\uBAA8\uB97C \uB354\uD568"]], "\uBD84\uC790\uB294 6, \uBD84\uBAA8\uB294 12\uC774\uBA70 \uC57D\uBD84\uD558\uBA74 1/2\uC785\uB2C8\uB2E4."));
a4(2, 2, "part-remaining-multiply", "6\uC21801-09", 3, "\uBD80\uBD84 \uC591\uC744 \uAD6C\uD55C \uB4A4 \uB0A8\uC740 \uC591 \uC5F0\uACB0\uD558\uAE30", () => E("\uAD6C\uC2AC 48\uAC1C\uC758 3/8\uC744 \uB098\uB220 \uC90D\uB2C8\uB2E4. \uB0A8\uC740 \uAD6C\uC2AC\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", [48, 48, "3/8", "*", "-"], "\uB098\uB220 \uC900 18\uAC1C\uB97C \uC804\uCCB4\uC5D0\uC11C \uBE7C\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a4(2, 2, "two-step-fraction-scaling", "6\uC21801-09", 3, "\uBD84\uC218 \uBC30\uC728\uC744 \uCC28\uB840\uB85C \uC801\uC6A9\uD558\uAE30", () => E("\uC804\uCCB4\uC758 4/5\uB97C \uC900\uBE44\uD558\uACE0 \uADF8\uC911 3/4\uB97C \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4. \uC0AC\uC6A9\uD55C \uC591\uC740 \uC6D0\uB798 \uC804\uCCB4\uC758 \uC5BC\uB9C8\uC785\uB2C8\uAE4C?", ["4/5", "3/4", "*"], "\uC900\uBE44\uD55C \uBD80\uBD84\uC5D0 \uB2E4\uC2DC \uC0AC\uC6A9 \uBE44\uC728\uC744 \uC801\uC6A9\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4."));
a4(2, 2, "area-fraction-multiply", "6\uC21801-09", 3, "\uBD84\uC218 \uCE21\uC815\uB7C9\uC758 \uACF1\uC5D0 \uB2E8\uC704 \uBD99\uC774\uAE30", () => E("\uAC00\uB85C 3/4 m, \uC138\uB85C 2/5 m\uC778 \uC9C1\uC0AC\uAC01\uD615\uC758 \uB113\uC774\uB97C m\xB2 \uB2E8\uC704\uC758 \uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.", ["3/4", "2/5", "*"], "\uAC00\uB85C\uC640 \uC138\uB85C\uB97C \uACF1\uD558\uBA74 {answer} m\xB2\uC785\uB2C8\uB2E4."));
a4(2, 2, "part-plan-two-conditions", "6\uC21801-09", 3, "\uBD80\uBD84 \uC0AC\uC6A9\uACFC \uBC30\uBD84 \uC870\uAC74\uC744 \uD568\uAED8 \uC801\uC6A9\uD558\uAE30", () => C("\uC885\uC774 60\uC7A5\uC758 2/3\uC744 \uC0AC\uC6A9\uD558\uACE0 \uB0A8\uC740 \uC885\uC774\uB97C \uB450 \uBAA8\uB460\uC5D0 \uB611\uAC19\uC774 \uB098\uB215\uB2C8\uB2E4. \uD55C \uBAA8\uB460\uC774 \uBC1B\uB294 \uC7A5\uC218\uB97C \uACE0\uB974\uC138\uC694.", "10\uC7A5", [["20\uC7A5", "\uB450 \uBAA8\uB460\uC73C\uB85C \uB098\uB204\uB294 \uC870\uAC74 \uB204\uB77D"], ["30\uC7A5", "\uC0AC\uC6A9\uD55C \uC591\uC744 \uB204\uB77D"]], "40\uC7A5\uC744 \uC0AC\uC6A9\uD558\uC5EC 20\uC7A5\uC774 \uB0A8\uACE0 \uB450 \uBAA8\uB460\uC5D0 10\uC7A5\uC529 \uC90D\uB2C8\uB2E4."));

// learning-review-r1/native/data/final-expansion-grade5c.js
var a5 = (u, id, code, l, o, fn, domain = 1) => A(5, 2, u, "FINAL-" + id, code, l, o, fn, domain);
a5(3, "symmetry-total-distance", "6\uC21803-02", 3, "\uB300\uCE6D\uCD95\uAE4C\uC9C0 \uAC70\uB9AC\uC640 \uB450 \uB300\uC751\uC810 \uC0AC\uC774 \uAC70\uB9AC \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uB300\uC751\uC810 A\uC640 B\uB294 \uC138\uB85C \uB300\uCE6D\uCD95\uC744 \uC0AC\uC774\uC5D0 \uB450\uACE0 \uAC19\uC740 \uC218\uD3C9\uC120 \uC704\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. A\uC5D0\uC11C \uCD95\uAE4C\uC9C0 ${2 + k} cm\uC774\uBA74 A\uC640 B \uC0AC\uC774\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?`, [2 + k, 2, "*"], "\uCD95\uC758 \uC591\uCABD \uAC19\uC740 \uAC70\uB9AC\uB97C \uD569\uD558\uBA74 {answer} cm\uC785\uB2C8\uB2E4.", "cm"), 12);
a5(3, "congruent-remaining-side", "6\uC21803-01", 3, "\uD569\uB3D9 \uC870\uAC74\uACFC \uC54C\uB824\uC9C4 \uC804\uCCB4 \uAE38\uC774 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uD569\uB3D9\uC778 \uC0BC\uAC01\uD615\uC5D0\uC11C \uB300\uC751\uD558\uB294 \uBCC0 AB\uC640 DE\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uB450 \uBCC0 \uAE38\uC774\uC758 \uD569\uC774 ${12 + 2 * k} cm\uC774\uBA74 DE\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?`, [12 + 2 * k, 2, "/"], "\uB300\uC751\uD558\uB294 \uBCC0\uC740 \uAC19\uC73C\uBBC0\uB85C \uD569\uC744 \uB458\uB85C \uB098\uB204\uBA74 {answer} cm\uC785\uB2C8\uB2E4.", "cm"), 12);
a5(3, "congruence-definition", "6\uC21803-01", 1, "\uD569\uB3D9\uC758 \uD06C\uAE30\uC640 \uBAA8\uC591 \uC870\uAC74 \uD655\uC778\uD558\uAE30", () => C("\uD569\uB3D9\uC778 \uB450 \uB3C4\uD615\uC5D0 \uB300\uD55C \uC124\uBA85\uC744 \uACE0\uB974\uC138\uC694.", "\uC62E\uAE30\uAC70\uB098 \uB4A4\uC9D1\uAC70\uB098 \uB3CC\uB824 \uC815\uD655\uD788 \uACB9\uCE60 \uC218 \uC788\uB2E4", [["\uBAA8\uC591\uB9CC \uAC19\uC73C\uBA74 \uD06C\uAE30\uAC00 \uB2EC\uB77C\uB3C4 \uB41C\uB2E4", "\uD06C\uAE30 \uC870\uAC74 \uB204\uB77D"], ["\uB113\uC774\uB9CC \uAC19\uC73C\uBA74 \uB41C\uB2E4", "\uBAA8\uC591 \uC870\uAC74 \uB204\uB77D"]], "\uD569\uB3D9\uC740 \uD06C\uAE30\uC640 \uBAA8\uC591\uC774 \uBAA8\uB450 \uAC19\uC740 \uAD00\uACC4\uC785\uB2C8\uB2E4."));
a5(3, "corresponding-vertex-list", "6\uC21803-01", 2, "\uB300\uC751 \uC21C\uC11C\uB85C \uAF2D\uC9D3\uC810 \uCC3E\uAE30", () => C("\uD569\uB3D9\uC778 \uB3C4\uD615 ABCD\uC640 PQRS\uC5D0\uC11C A\u2194P, B\u2194Q, C\u2194R\uC785\uB2C8\uB2E4. D\uC5D0 \uB300\uC751\uD558\uB294 \uAF2D\uC9D3\uC810\uC744 \uACE0\uB974\uC138\uC694.", "S", [["R", "\uC774\uBBF8 C\uC5D0 \uB300\uC751\uD55C \uC810\uC744 \uB2E4\uC2DC \uC0AC\uC6A9"], ["Q", "\uB300\uC751 \uC21C\uC11C\uB97C \uBC14\uAFC8"]], "\uAC01 \uAF2D\uC9D3\uC810\uC740 \uD55C \uC810\uC529 \uB300\uC751\uD558\uBBC0\uB85C \uB0A8\uC740 D\uB294 S\uC5D0 \uB300\uC751\uD569\uB2C8\uB2E4."));
a5(3, "line-symmetry-axis-count", "6\uC21803-02", 2, "\uC9C1\uC0AC\uAC01\uD615\uC758 \uB300\uCE6D\uCD95 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC815\uC0AC\uAC01\uD615\uC774 \uC544\uB2CC \uC9C1\uC0AC\uAC01\uD615\uC758 \uB300\uCE6D\uCD95\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", "2\uAC1C", [["4\uAC1C", "\uC815\uC0AC\uAC01\uD615\uC758 \uB300\uAC01\uC120\uAE4C\uC9C0 \uD3EC\uD568"], ["1\uAC1C", "\uD55C \uBC29\uD5A5\uB9CC \uD655\uC778"]], "\uAC00\uB85C\uC640 \uC138\uB85C\uC758 \uAC00\uC6B4\uB370\uB97C \uC9C0\uB098\uB294 \uB450 \uC9C1\uC120\uC774 \uB300\uCE6D\uCD95\uC785\uB2C8\uB2E4."));
a5(3, "point-center-distance", "6\uC21803-02", 3, "\uC810\uB300\uCE6D \uB300\uC751\uC810\uC758 \uC911\uC2EC \uAC70\uB9AC \uC774\uD574\uD558\uAE30", () => E("A\uC640 B\uB294 \uC810\uB300\uCE6D\uC758 \uB300\uC751\uC810\uC774\uACE0 \uC911\uC2EC O\uC5D0\uC11C A\uAE4C\uC9C0 4 cm\uC785\uB2C8\uB2E4. A\uC640 B \uC0AC\uC774\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?", [4, 2, "*"], "\uC911\uC2EC\uC774 \uB300\uC751\uC810\uC744 \uC787\uB294 \uC120\uBD84\uC758 \uAC00\uC6B4\uB370\uC774\uBBC0\uB85C {answer} cm\uC785\uB2C8\uB2E4.", "cm"));
a5(3, "congruent-angle-choice", "6\uC21803-01", 3, "\uB300\uC751\uAC01\uC774 \uB2E4\uB978 \uD569\uB3D9 \uC124\uBA85\uC758 \uC624\uB958 \uD310\uB2E8\uD558\uAE30", () => C("\uB450 \uC0BC\uAC01\uD615\uC774 \uD569\uB3D9\uC774\uACE0 A\uC640 P\uAC00 \uB300\uC751\uD55C\uB2E4\uACE0 \uD569\uB2C8\uB2E4. \uAC01 A\uB294 50\xB0, \uAC01 P\uB294 60\xB0\uB77C\uB294 \uC124\uBA85\uC740 \uB9DE\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uB300\uC751\uAC01\uC758 \uAC19\uC74C\uC744 \uB204\uB77D"]], "\uD569\uB3D9\uC778 \uB3C4\uD615\uC758 \uB300\uC751\uAC01\uC740 \uAC19\uC740 \uD06C\uAE30\uC5EC\uC57C \uD569\uB2C8\uB2E4."));
a5(3, "axis-distance-error", "6\uC21803-02", 3, "\uC120\uB300\uCE6D \uB300\uC751\uC810\uC758 \uAC70\uB9AC \uBD88\uC77C\uCE58 \uCC3E\uAE30", () => C("\uC138\uB85C\uCD95 \uC591\uCABD \uAC19\uC740 \uB192\uC774\uC5D0 \uC788\uB294 \uC810 A\uC640 B\uAC00 \uCD95\uC5D0\uC11C \uAC01\uAC01 3 cm, 4 cm \uB5A8\uC5B4\uC838 \uC788\uC2B5\uB2C8\uB2E4. \uC774 \uCD95\uC5D0 \uB300\uD574 \uB300\uC751\uD558\uB294 \uC120\uB300\uCE6D \uC810\uC785\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uC591\uCABD\uC5D0 \uC788\uB2E4\uB294 \uC870\uAC74\uB9CC \uD655\uC778"]], "\uB300\uC751\uC810\uC740 \uB192\uC774\uBFD0 \uC544\uB2C8\uB77C \uCD95\uC5D0\uC11C\uC758 \uAC70\uB9AC\uB3C4 \uAC19\uC544\uC57C \uD569\uB2C8\uB2E4."));
a5(3, "square-point-symmetry", "6\uC21803-02", 2, "\uC815\uC0AC\uAC01\uD615\uC758 \uB300\uCE6D \uC911\uC2EC \uD310\uB2E8\uD558\uAE30", () => C("\uC815\uC0AC\uAC01\uD615\uC744 \uC911\uC2EC\uC5D0\uC11C \uBC18 \uBC14\uD034 \uB3CC\uB9AC\uBA74 \uC6D0\uB798 \uB3C4\uD615\uACFC \uACB9\uCE69\uB2C8\uB2E4. \uC54C\uB9DE\uC740 \uC124\uBA85\uC744 \uACE0\uB974\uC138\uC694.", "\uC815\uC0AC\uAC01\uD615\uC740 \uC810\uB300\uCE6D\uB3C4\uD615\uC774\uB2E4", [["\uC810\uB300\uCE6D\uB3C4\uD615\uC774 \uC544\uB2C8\uB2E4", "\uBC18 \uBC14\uD034 \uC870\uAC74 \uBB34\uC2DC"], ["\uBC18\uB4DC\uC2DC \uC120\uB300\uCE6D\uB3C4\uD615\uC774 \uC544\uB2C8\uB2E4", "\uB450 \uB300\uCE6D \uC131\uC9C8\uC744 \uBC30\uD0C0\uC801\uC73C\uB85C \uD310\uB2E8"]], "\uC911\uC2EC\uC744 \uAE30\uC900\uC73C\uB85C \uBC18 \uBC14\uD034 \uB3CC\uB824 \uACB9\uCE58\uBA74 \uC810\uB300\uCE6D\uB3C4\uD615\uC785\uB2C8\uB2E4."));
a5(3, "congruence-two-info", "6\uC21803-01", 4, "\uB300\uC751 \uBCC0\uACFC \uB300\uC751 \uAC01\uC744 \uD568\uAED8 \uC0AC\uC6A9\uD558\uAE30", () => C("\uD569\uB3D9\uC778 \uC0BC\uAC01\uD615 ABC\uC640 DEF\uC5D0\uC11C A\u2194D, B\u2194E, C\u2194F\uC785\uB2C8\uB2E4. AB\uB294 6 cm, \uAC01 C\uB294 40\xB0\uC785\uB2C8\uB2E4. \uBC14\uB978 \uC815\uBCF4\uB97C \uACE0\uB974\uC138\uC694.", "DE\uB294 6 cm, \uAC01 F\uB294 40\xB0", [["EF\uB294 6 cm, \uAC01 D\uB294 40\xB0", "\uB300\uC751 \uB300\uC0C1\uC744 \uBC14\uAFC8"], ["DE\uB294 12 cm, \uAC01 F\uB294 80\xB0", "\uD569\uB3D9\uC744 \uD655\uB300\uC640 \uD63C\uB3D9"]], "\uB300\uC751 \uC21C\uC11C\uC5D0 \uB530\uB77C \uAC19\uC740 \uBCC0 \uAE38\uC774\uC640 \uAC01 \uD06C\uAE30\uB97C \uC62E\uAE41\uB2C8\uB2E4."));
a5(3, "symmetry-versus-congruence", "6\uC21803-02", 4, "\uD569\uB3D9\uACFC \uD2B9\uC815 \uCD95\uC758 \uC120\uB300\uCE6D \uAD6C\uBCC4\uD558\uAE30", () => C("\uAC19\uC740 \uBAA8\uC591\uACFC \uD06C\uAE30\uC758 \uB450 \uB3C4\uD615\uC774 \uC788\uC9C0\uB9CC \uAC00\uC6B4\uB370 \uC9C1\uC120\uC73C\uB85C \uB4A4\uC9D1\uC5B4\uB3C4 \uACB9\uCE58\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC54C\uB9DE\uC740 \uD310\uB2E8\uC744 \uACE0\uB974\uC138\uC694.", "\uD569\uB3D9\uC77C \uC218 \uC788\uC9C0\uB9CC \uADF8 \uC9C1\uC120\uC5D0 \uB300\uD55C \uC120\uB300\uCE6D\uC740 \uC544\uB2C8\uB2E4", [["\uD569\uB3D9\uB3C4 \uB420 \uC218 \uC5C6\uB2E4", "\uD569\uB3D9\uACFC \uD2B9\uC815 \uCD95 \uB300\uCE6D\uC744 \uAC19\uC740 \uC870\uAC74\uC73C\uB85C \uD310\uB2E8"], ["\uC5B8\uC81C\uB098 \uADF8 \uC9C1\uC120\uC5D0 \uB300\uD574 \uC120\uB300\uCE6D\uC774\uB2E4", "\uB4A4\uC9D1\uAE30 \uACB0\uACFC\uB97C \uBB34\uC2DC"]], "\uD569\uB3D9\uACFC \uD2B9\uC815 \uCD95\uC5D0 \uB300\uD55C \uB300\uC751\uC740 \uC11C\uB85C \uB2E4\uB978 \uC870\uAC74\uC785\uB2C8\uB2E4."));
a5(3, "symmetry-combined-reasoning", "6\uC21803-02", 4, "\uC911\uC2EC\xB7\uCD95\xB7\uAC70\uB9AC \uC870\uAC74\uC5D0\uC11C \uC798\uBABB\uB41C \uBC30\uCE58 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC120\uB300\uCE6D \uB300\uC751\uC810\uC740 \uCD95\uC744 \uC0AC\uC774\uC5D0 \uB454 \uAC19\uC740 \uB192\uC774\uC774\uACE0 \uCD95\uAE4C\uC9C0 \uAC70\uB9AC\uAC00 \uAC19\uC2B5\uB2C8\uB2E4. \uD6C4\uBCF4 A\uB294 \uAC70\uB9AC 2 cm\xB72 cm, B\uB294 2 cm\xB73 cm, C\uB294 \uAC19\uC740 \uCABD\uC5D0 2 cm\xB72 cm\uC785\uB2C8\uB2E4. \uC870\uAC74\uC5D0 \uB9DE\uB294 \uD6C4\uBCF4\uB97C \uACE0\uB974\uC138\uC694.", "A\uB9CC \uAC00\uB2A5", [["A\uC640 B", "\uAC70\uB9AC \uAC19\uC74C \uC870\uAC74 \uB204\uB77D"], ["A\uC640 C", "\uCD95 \uC591\uCABD \uC870\uAC74 \uB204\uB77D"]], "\uB192\uC774, \uAC70\uB9AC, \uCD95 \uC591\uCABD \uC870\uAC74\uC744 \uBAA8\uB450 \uD655\uC778\uD569\uB2C8\uB2E4."));
a5(4, "decimal-product-two-groups", "6\uC21801-13", 3, "\uC18C\uC218 \uAE38\uC774\uC758 \uB450 \uBB36\uC74C \uC804\uCCB4 \uAD6C\uD558\uAE30", (k) => E(`\uC885\uC774\uB760\uB294 0.6 m\uC529 ${3 + k}\uAC1C\uC640 0.25 m\uC529 4\uAC1C\uC785\uB2C8\uB2E4. \uBAA8\uB450 \uC774\uC5B4 \uBD99\uC778 \uAE38\uC774\uB294 \uBA87 m\uC785\uB2C8\uAE4C?`, ["0.6", 3 + k, "*", "0.25", 4, "*", "+"], "\uAC01 \uC885\uB958\uC758 \uC804\uCCB4 \uAE38\uC774\uB97C \uAD6C\uD574 \uB354\uD558\uBA74 {answer} m\uC785\uB2C8\uB2E4.", "m"), 12);
a5(4, "decimal-mass-packs", "6\uC21801-13", 3, "\uC18C\uC218 \uC9C8\uB7C9\uC744 \uBC18\uBCF5\uD55C \uC804\uCCB4 \uAD6C\uD558\uAE30", (k) => E(`\uD55C \uBD09\uC9C0\uC758 \uC300\uC740 ${dec(12 + k, 10)} kg\uC785\uB2C8\uB2E4. 3\uBD09\uC9C0\uC758 \uC804\uCCB4 \uBB34\uAC8C\uB294 \uBA87 kg\uC785\uB2C8\uAE4C?`, [dec(12 + k, 10), 3, "*"], "\uD55C \uBD09\uC9C0\uC758 \uC591\uC5D0 \uBD09\uC9C0 \uC218\uB97C \uACF1\uD558\uBA74 {answer} kg\uC785\uB2C8\uB2E4.", "kg"), 12);
a5(4, "decimal-times-ten", "6\uC21801-13", 1, "\uC18C\uC218\uC758 \uC5F4 \uBC30\uC640 \uC790\uB9BF\uAC12 \uC5F0\uACB0\uD558\uAE30", () => C("0.34\uC758 10\uBC30\uB97C \uACE0\uB974\uC138\uC694.", "3.4", [["0.034", "\uBC30\uC728 \uBC29\uD5A5 \uBC18\uB300"], ["34", "100\uBC30\uB85C \uBC14\uAFC8"]], "\uC5F4 \uBC30\uAC00 \uB418\uBA74 \uAC01 \uC790\uB9BF\uAC12\uB3C4 \uC5F4 \uBC30\uAC00 \uB429\uB2C8\uB2E4."));
a5(4, "decimal-times-hundred", "6\uC21801-13", 2, "\uC18C\uC218\uC758 \uBC31 \uBC30 \uAD6C\uD558\uAE30", () => E("0.07 \xD7 100\uC744 \uACC4\uC0B0\uD558\uC138\uC694.", ["0.07", 100, "*"], "\uBC31 \uBC30\uC758 \uC591\uC740 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a5(4, "product-less-one-factor", "6\uC21801-13", 3, "\uACF1\uD558\uB294 \uC218\uAC00 1\uBCF4\uB2E4 \uC791\uC740 \uACBD\uC6B0 \uD06C\uAE30 \uD310\uB2E8\uD558\uAE30", () => C("2.5 \xD7 0.8\uC740 2.5\uBCF4\uB2E4 \uD07D\uB2C8\uAE4C, \uC791\uC2B5\uB2C8\uAE4C?", "\uC791\uB2E4", [["\uD06C\uB2E4", "\uACF1\uC148\uC740 \uD56D\uC0C1 \uCEE4\uC9C4\uB2E4\uACE0 \uD310\uB2E8"], ["\uAC19\uB2E4", "\uBC30\uC728\uC744 \uBB34\uC2DC"]], "1\uBCF4\uB2E4 \uC791\uC740 0.8\uBC30\uC774\uBBC0\uB85C \uC6D0\uB798 \uC591\uBCF4\uB2E4 \uC791\uC2B5\uB2C8\uB2E4."));
a5(4, "decimal-point-placement", "6\uC21801-13", 3, "\uACF1\uC758 \uC18C\uC218 \uC790\uB9BF\uAC12\uC73C\uB85C \uC624\uB958 \uAD6C\uBCC4\uD558\uAE30", () => C("12 \xD7 15 = 180\uC744 \uC774\uC6A9\uD558\uC5EC 1.2 \xD7 0.15\uC758 \uAC12\uC744 \uACE0\uB974\uC138\uC694.", "0.18", [["1.8", "\uC18C\uC218 \uC790\uB9BF\uAC12 \uD55C \uC790\uB9AC \uB204\uB77D"], ["18", "\uC18C\uC218 \uC790\uB9BF\uAC12 \uB450 \uC790\uB9AC \uB204\uB77D"]], "10\uBD84\uC758 \uC591\uACFC 100\uBD84\uC758 \uC591\uC744 \uACF1\uD558\uBBC0\uB85C 180/1000 = 0.18\uC785\uB2C8\uB2E4."));
a5(4, "decimal-area-product", "6\uC21801-13", 3, "\uC18C\uC218 \uCE21\uC815\uAC12\uACFC \uB113\uC774 \uB2E8\uC704 \uC5F0\uACB0\uD558\uAE30", () => C("\uAC00\uB85C 2.5 m, \uC138\uB85C 1.2 m\uC778 \uC9C1\uC0AC\uAC01\uD615\uC758 \uB113\uC774\uB97C \uAD6C\uD558\uBA70 2.5 \xD7 1.2 = 3\uC744 \uACC4\uC0B0\uD588\uC2B5\uB2C8\uB2E4. \uACB0\uACFC\uC5D0 \uBD99\uC77C \uC54C\uB9DE\uC740 \uB2E8\uC704\uB97C \uACE0\uB974\uC138\uC694.", "m\xB2", [["m", "\uAE38\uC774\uC758 \uB2E8\uC704\uB97C \uB113\uC774\uC5D0 \uADF8\uB300\uB85C \uC0AC\uC6A9"], ["m\xB3", "\uB113\uC774\uB97C \uBD80\uD53C\uB85C \uD63C\uB3D9"]], "\uB450 \uAE38\uC774\uB97C \uACF1\uD558\uC5EC \uAD6C\uD55C \uB113\uC774\uB294 \uC81C\uACF1\uBBF8\uD130\uB85C \uB098\uD0C0\uB0C5\uB2C8\uB2E4."));
a5(4, "decimal-zero-factor", "6\uC21801-13", 2, "0\uC744 \uACF1\uD55C \uACB0\uACFC \uC774\uD574\uD558\uAE30", () => C("3.75 \xD7 0\uC758 \uAC12\uC774 0\uC774 \uB418\uB294 \uAE4C\uB2ED\uC744 \uACE0\uB974\uC138\uC694.", "3.75\uB9CC\uD07C\uC758 \uC591\uC744 \uD55C \uBC88\uB3C4 \uB354\uD558\uC9C0 \uC54A\uAE30 \uB54C\uBB38\uC774\uB2E4", [["\uC18C\uC218\uB97C \uACF1\uD558\uBA74 \uC5B8\uC81C\uB098 0\uC774\uAE30 \uB54C\uBB38\uC774\uB2E4", "\uC18C\uC218 \uACF1\uC148\uC744 \uC77C\uBC18\uC801\uC73C\uB85C \uC798\uBABB \uC124\uBA85"], ["\uACF1\uD558\uB294 \uC218\uB294 \uACB0\uACFC\uC5D0 \uC601\uD5A5\uC744 \uC8FC\uC9C0 \uC54A\uAE30 \uB54C\uBB38\uC774\uB2E4", "\uACF1\uD558\uB294 \uC218\uC758 \uC5ED\uD560\uC744 \uBB34\uC2DC"]], "\uAC19\uC740 \uC591\uC744 0\uBC88 \uBAA8\uC73C\uBA74 \uBAA8\uC778 \uC591\uB3C4 0\uC785\uB2C8\uB2E4."));
a5(4, "decimal-two-stage-use", "6\uC21801-13", 3, "\uBC18\uBCF5\uD55C \uC591\uACFC \uC0AC\uC6A9\uB7C9\uC758 \uCC28 \uAD6C\uD558\uAE30", () => E("\uBB3C 0.75 L\uC529 6\uBCD1\uC744 \uC900\uBE44\uD558\uACE0 1.2 L\uB97C \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uBB3C\uC740 \uBA87 L\uC785\uB2C8\uAE4C?", ["0.75", 6, "*", "1.2", "-"], "\uC804\uCCB4\uB97C \uACF1\uC148\uC73C\uB85C \uAD6C\uD55C \uB4A4 \uC0AC\uC6A9\uB7C9\uC744 \uBE7C\uBA74 {answer} L\uC785\uB2C8\uB2E4.", "L"));
a5(4, "decimal-repeated-addition", "6\uC21801-13", 3, "\uAC19\uC740 \uC18C\uC218\uC758 \uB367\uC148\uC744 \uACF1\uC148\uC73C\uB85C \uD45C\uD604\uD558\uAE30", () => C("0.8 + 0.8 + 0.8 + 0.8\uACFC \uAC19\uC740 \uC2DD\uC744 \uACE0\uB974\uC138\uC694.", "0.8 \xD7 4", [["0.8 + 4", "\uAC19\uC740 \uC591 \uBC18\uBCF5\uC744 \uD55C \uBC88\uB9CC \uB354\uD568"], ["0.8 \xD7 0.4", "\uD69F\uC218\uC758 \uC790\uB9BF\uAC12 \uC624\uB958"]], "0.8\uC774 \uB124 \uBC88 \uBC18\uBCF5\uB418\uB294 \uC591\uC785\uB2C8\uB2E4."));
a5(4, "decimal-price-both", "6\uC21801-13", 4, "\uB450 \uD488\uBAA9\uC758 \uB2E8\uAC00\uC640 \uCE21\uC815\uB7C9\uC744 \uC5F0\uACB0\uD558\uAE30", () => E("\uB048\uC740 1 m\uC5D0 1000\uC6D0\uC774\uACE0 \uB9AC\uBCF8\uC740 1 m\uC5D0 2000\uC6D0\uC785\uB2C8\uB2E4. \uB048 1.5 m\uC640 \uB9AC\uBCF8 0.75 m\uB97C \uC0AC\uBA74 \uBAA8\uB450 \uBA87 \uC6D0\uC785\uB2C8\uAE4C?", [1e3, "1.5", "*", 2e3, "0.75", "*", "+"], "\uAC01 \uAC00\uACA9\uC744 \uAD6C\uD574 \uD569\uD558\uBA74 {answer}\uC6D0\uC785\uB2C8\uB2E4.", "\uC6D0"));
a5(4, "decimal-budget-choice", "6\uC21801-13", 4, "\uCE21\uC815\uB7C9\xB7\uBC18\uBCF5 \uD69F\uC218\xB7\uCD1D\uB7C9 \uC81C\uD55C\uC73C\uB85C \uACC4\uD68D \uD310\uB2E8\uD558\uAE30", () => C("\uBB3C 5 L\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uD55C \uBC88\uC5D0 0.65 L\uC529 6\uBC88 \uC4F0\uACE0 0.4 L\uB97C \uB530\uB85C \uB0A8\uACA8\uC57C \uD569\uB2C8\uB2E4. \uC774 \uACC4\uD68D \uB4A4 \uB0A8\uAE38 \uC218 \uC788\uB294 \uBB3C\uC744 \uACE0\uB974\uC138\uC694.", "1.1 L\uC774\uBA70 0.4 L\uB97C \uB0A8\uAE38 \uC218 \uC788\uB2E4", [["0.7 L\uB77C\uC11C 0.4 L\uB97C \uBABB \uB0A8\uAE34\uB2E4", "\uB0A8\uAE38 \uC218 \uC788\uB294 \uC870\uAC74 \uBE44\uAD50 \uC624\uB958"], ["1.5 L\uB77C\uC11C \uAC00\uB2A5\uD558\uB2E4", "\uC0AC\uC6A9\uB7C9 \uACC4\uC0B0 \uC624\uB958"]], "\uC4F4 \uBB3C\uC740 3.9 L\uC774\uACE0 \uB0A8\uC740 1.1 L\uB294 0.4 L \uC774\uC0C1\uC785\uB2C8\uB2E4."));
a5(5, "cube-edge-total", "6\uC21803-03", 3, "\uC815\uC721\uBA74\uCCB4 \uAC19\uC740 \uBAA8\uC11C\uB9AC\uB4E4\uC758 \uC804\uCCB4 \uAE38\uC774 \uAD6C\uD558\uAE30", (k) => E(`\uC815\uC721\uBA74\uCCB4 \uD55C \uBAA8\uC11C\uB9AC\uAC00 ${2 + k} cm\uC785\uB2C8\uB2E4. \uBAA8\uB4E0 \uBAA8\uC11C\uB9AC\uC758 \uAE38\uC774\uB97C \uD569\uD558\uBA74 \uBA87 cm\uC785\uB2C8\uAE4C?`, [2 + k, 12, "*"], "\uAC19\uC740 \uAE38\uC774 \uBAA8\uC11C\uB9AC \uC5F4\uB450 \uAC1C\uB97C \uB354\uD558\uBA74 {answer} cm\uC785\uB2C8\uB2E4.", "cm"), 12);
a5(5, "cuboid-edge-group-total", "6\uC21803-03", 3, "\uC9C1\uC721\uBA74\uCCB4 \uAC19\uC740 \uBC29\uD5A5\uC758 \uBAA8\uC11C\uB9AC \uBB36\uC74C \uC138\uAE30", (k) => E(`\uC9C1\uC721\uBA74\uCCB4\uC758 \uAC00\uB85C\uAC00 ${3 + k} cm\uC785\uB2C8\uB2E4. \uAC00\uB85C\uC640 \uAC19\uC740 \uAE38\uC774\uC778 \uBAA8\uC11C\uB9AC \uB124 \uAC1C\uC758 \uAE38\uC774 \uD569\uC740 \uBA87 cm\uC785\uB2C8\uAE4C?`, [3 + k, 4, "*"], "\uAC19\uC740 \uBC29\uD5A5 \uBAA8\uC11C\uB9AC \uB124 \uAC1C\uB97C \uB354\uD558\uBA74 {answer} cm\uC785\uB2C8\uB2E4.", "cm"), 12);
a5(5, "cuboid-vertex-count", "6\uC21803-03", 1, "\uC9C1\uC721\uBA74\uCCB4 \uAF2D\uC9D3\uC810 \uC218 \uC774\uD574\uD558\uAE30", () => C("\uC9C1\uC721\uBA74\uCCB4\uC758 \uAF2D\uC9D3\uC810\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", "8", [["6", "\uBA74 \uC218\uC640 \uD63C\uB3D9"], ["12", "\uBAA8\uC11C\uB9AC \uC218\uC640 \uD63C\uB3D9"]], "\uC717\uBA74 \uB124 \uAC1C\uC640 \uC544\uB7AB\uBA74 \uB124 \uAC1C\uC758 \uAF2D\uC9D3\uC810\uC785\uB2C8\uB2E4."));
a5(5, "faces-versus-edges", "6\uC21803-03", 2, "\uBA74\uACFC \uBAA8\uC11C\uB9AC\uC758 \uC5ED\uD560 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC9C1\uC721\uBA74\uCCB4\uC5D0\uC11C \uB450 \uBA74\uC774 \uB9CC\uB098\uB294 \uC120\uBD84\uC744 \uBB34\uC5C7\uC774\uB77C\uACE0 \uD569\uB2C8\uAE4C?", "\uBAA8\uC11C\uB9AC", [["\uAF2D\uC9D3\uC810", "\uC810\uACFC \uC120\uBD84 \uD63C\uB3D9"], ["\uBC11\uBA74", "\uC120\uBD84\uACFC \uBA74 \uD63C\uB3D9"]], "\uBA74\uACFC \uBA74\uC774 \uB9CC\uB098\uB294 \uC120\uBD84\uC774 \uBAA8\uC11C\uB9AC\uC785\uB2C8\uB2E4."));
a5(5, "cube-face-condition", "6\uC21803-03", 2, "\uC815\uC721\uBA74\uCCB4\uC758 \uBA74 \uC870\uAC74 \uD655\uC778\uD558\uAE30", () => C("\uC815\uC721\uBA74\uCCB4\uC758 \uC5EC\uC12F \uBA74\uC744 \uBC14\uB974\uAC8C \uC124\uBA85\uD55C \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uBAA8\uB450 \uAC19\uC740 \uD06C\uAE30\uC758 \uC815\uC0AC\uAC01\uD615", [["\uC11C\uB85C \uB2E4\uB978 \uD06C\uAE30\uC758 \uC9C1\uC0AC\uAC01\uD615", "\uC815\uC721\uBA74\uCCB4\uC640 \uC77C\uBC18 \uC9C1\uC721\uBA74\uCCB4 \uD63C\uB3D9"], ["\uC0BC\uAC01\uD615 \uC5EC\uC12F \uAC1C", "\uBA74\uC758 \uBAA8\uC591 \uD63C\uB3D9"]], "\uBAA8\uB4E0 \uBAA8\uC11C\uB9AC\uAC00 \uAC19\uC544 \uC5EC\uC12F \uBA74\uC774 \uD569\uB3D9\uC778 \uC815\uC0AC\uAC01\uD615\uC785\uB2C8\uB2E4."));
a5(5, "corner-incidence", "6\uC21803-03", 3, "\uD55C \uAF2D\uC9D3\uC810\uC5D0\uC11C \uB9CC\uB098\uB294 \uBAA8\uC11C\uB9AC \uC218 \uC774\uD574\uD558\uAE30", () => C("\uC9C1\uC721\uBA74\uCCB4\uC758 \uD55C \uAF2D\uC9D3\uC810\uC5D0\uC11C \uB9CC\uB098\uB294 \uBAA8\uC11C\uB9AC\uB294 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", "3", [["2", "\uD3C9\uBA74\uB3C4\uD615\uC758 \uAF2D\uC9D3\uC810\uC73C\uB85C \uD310\uB2E8"], ["4", "\uC717\uBA74\uC758 \uBCC0 \uC218\uC640 \uD63C\uB3D9"]], "\uC11C\uB85C \uB2E4\uB978 \uC138 \uBC29\uD5A5\uC758 \uBAA8\uC11C\uB9AC\uAC00 \uB9CC\uB0A9\uB2C8\uB2E4."));
a5(5, "opposite-not-share-edge", "6\uC21803-03", 3, "\uB9C8\uC8FC \uBCF4\uB294 \uBA74\uACFC \uC774\uC6C3\uD55C \uBA74 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC9C1\uC721\uBA74\uCCB4\uC5D0\uC11C \uC11C\uB85C \uB9C8\uC8FC \uBCF4\uB294 \uB450 \uBA74\uC740 \uBAA8\uC11C\uB9AC\uB97C \uACF5\uC720\uD569\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uC774\uC6C3\uD55C \uBA74\uC758 \uAD00\uACC4\uB97C \uC801\uC6A9"]], "\uB9C8\uC8FC \uBCF4\uB294 \uBA74\uC740 \uC11C\uB85C \uB5A8\uC5B4\uC838 \uD3C9\uD589\uD569\uB2C8\uB2E4."));
a5(5, "net-cuts-versus-folds", "6\uC21803-04", 3, "\uC804\uAC1C\uB3C4\uC5D0\uC11C \uC5F0\uACB0\uB41C \uACBD\uACC4\uC758 \uC5ED\uD560 \uC774\uD574\uD558\uAE30", () => C("\uC804\uAC1C\uB3C4\uC5D0\uC11C \uB450 \uBA74\uC774 \uC774\uC5B4\uC9C4 \uACBD\uACC4\uB97C \uBAA8\uB450 \uC798\uB77C \uBD84\uB9AC\uD558\uBA74 \uAC19\uC740 \uC811\uD798 \uAD6C\uC870\uB97C \uC720\uC9C0\uD569\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uC5F0\uACB0 \uAD00\uACC4\uB97C \uBB34\uC2DC"]], "\uC774\uC5B4\uC9C4 \uACBD\uACC4\uB294 \uC811\uB294 \uC120\uC774\uBBC0\uB85C \uB04A\uC73C\uBA74 \uBA74 \uC5F0\uACB0 \uAD6C\uC870\uAC00 \uBC14\uB01D\uB2C8\uB2E4."));
a5(5, "cuboid-three-direction-lengths", "6\uC21803-03", 3, "\uC138 \uBC29\uD5A5\uC758 \uBAA8\uC11C\uB9AC \uAE38\uC774\uC640 \uB3D9\uC77C\uD55C \uBB36\uC74C \uC5F0\uACB0\uD558\uAE30", () => C("\uC9C1\uC721\uBA74\uCCB4\uC758 \uAC00\uB85C\xB7\uC138\uB85C\xB7\uB192\uC774\uB294 3, 4, 5 cm\uC785\uB2C8\uB2E4. \uC804\uCCB4 \uBAA8\uC11C\uB9AC \uAE38\uC774 \uD569\uC744 \uACE0\uB974\uC138\uC694.", "48 cm", [["12 cm", "\uC138 \uBC29\uD5A5 \uD55C \uAC1C\uC529\uB9CC \uC148"], ["60 cm", "\uAE38\uC774 \uD569 \uB300\uC2E0 \uC138 \uAE38\uC774\uB97C \uACF1\uD568"]], "\uAC01 \uAE38\uC774\uC758 \uBAA8\uC11C\uB9AC\uAC00 \uB124 \uAC1C\uC529\uC774\uBBC0\uB85C 4 \xD7 (3 + 4 + 5)\uC785\uB2C8\uB2E4."));
a5(5, "net-too-few-faces", "6\uC21803-04", 2, "\uC804\uAC1C\uB3C4 \uBA74 \uC218\uC758 \uD544\uC694 \uC870\uAC74 \uD310\uB2E8\uD558\uAE30", () => C("\uC815\uC0AC\uAC01\uD615 \uB2E4\uC12F \uAC1C\uB9CC\uC73C\uB85C \uC815\uC721\uBA74\uCCB4\uC758 \uBAA8\uB4E0 \uBA74\uC744 \uB2EB\uC744 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uBA74 \uD55C \uAC1C \uB204\uB77D"]], "\uC815\uC721\uBA74\uCCB4\uC758 \uC5EC\uC12F \uBA74\uC5D0 \uB9DE\uAC8C \uC815\uC0AC\uAC01\uD615 \uC5EC\uC12F \uAC1C\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4."));
a5(5, "net-size-mismatch", "6\uC21803-04", 4, "\uBA74 \uC218\uC640 \uD569\uB3D9 \uC870\uAC74\uC744 \uD568\uAED8 \uD655\uC778\uD558\uAE30", () => C("\uC815\uC0AC\uAC01\uD615 \uC5EC\uC12F \uAC1C \uC911 \uD558\uB098\uC758 \uD06C\uAE30\uAC00 \uB2E4\uB978 \uACBD\uC6B0 \uC815\uC721\uBA74\uCCB4 \uC804\uAC1C\uB3C4 \uC870\uAC74\uC5D0 \uB9DE\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uBA74 \uAC1C\uC218\uB9CC \uD655\uC778"]], "\uC815\uC721\uBA74\uCCB4\uC758 \uBA74\uB4E4\uC740 \uBAA8\uB450 \uAC19\uC740 \uD06C\uAE30\uC5EC\uC57C \uD569\uB2C8\uB2E4."));
a5(5, "cube-cuboid-relations", "6\uC21803-03", 3, "\uD3EC\uD568 \uAD00\uACC4\uC640 \uBAA8\uC11C\uB9AC \uC870\uAC74\uC744 \uB3D9\uC2DC\uC5D0 \uD310\uB2E8\uD558\uAE30", () => C("\uC815\uC721\uBA74\uCCB4\uB294 \uC9C1\uC721\uBA74\uCCB4\uB77C\uACE0\uB3C4 \uD560 \uC218 \uC788\uACE0 \uC9C1\uC721\uBA74\uCCB4\uB294 \uBAA8\uB450 \uC815\uC721\uBA74\uCCB4\uB77C\uACE0 \uD560 \uC218 \uC788\uB2E4\uB294 \uB450 \uC124\uBA85\uC744 \uD310\uB2E8\uD558\uC138\uC694.", "\uCCAB \uC124\uBA85\uB9CC \uB9DE\uB2E4", [["\uB458 \uB2E4 \uB9DE\uB2E4", "\uC77C\uBC18 \uC9C1\uC721\uBA74\uCCB4\uC758 \uBAA8\uC11C\uB9AC \uAE38\uC774 \uC870\uAC74\uC744 \uB193\uCE68"], ["\uB458 \uB2E4 \uD2C0\uB9AC\uB2E4", "\uC815\uC721\uBA74\uCCB4\uC758 \uC9C1\uC721\uBA74\uCCB4 \uC131\uC9C8\uC744 \uB193\uCE68"]], "\uC815\uC721\uBA74\uCCB4\uB294 \uBAA8\uB4E0 \uBA74\uC774 \uC9C1\uC0AC\uAC01\uD615\uC778 \uC870\uAC74\uC744 \uB9CC\uC871\uD558\uC9C0\uB9CC \uC77C\uBC18 \uC9C1\uC721\uBA74\uCCB4\uB294 \uBAA8\uB4E0 \uBAA8\uC11C\uB9AC\uAC00 \uAC19\uC744 \uD544\uC694\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."));
var scores = (k = 0) => [{ label: "1\uD68C", value: 5 + k }, { label: "2\uD68C", value: 7 + k }, { label: "3\uD68C", value: 12 + k }];
a5(6, "mean-different-values", "6\uC21804-01", 3, "\uC11C\uB85C \uB2E4\uB978 \uC138 \uAC12\uC758 \uD3C9\uADE0 \uAD6C\uD558\uAE30", (k) => M("\uD45C\uC5D0 \uC788\uB294 \uC138 \uBC88\uC758 \uC810\uC218 \uD3C9\uADE0\uC740 \uBA87 \uC810\uC785\uB2C8\uAE4C?", "foundation", "mean", { task: "graph", graphType: "table", rows: scores(k), valueUnit: "\uC810" }, "\uC790\uB8CC \uD569\uC744 \uC790\uB8CC \uAC1C\uC218\uB85C \uB098\uB204\uBA74 {answer}\uC810\uC785\uB2C8\uB2E4.", "\uC810", "data-interpretation"), 12);
a5(6, "mean-after-added-data", "6\uC21804-01", 3, "\uCD94\uAC00 \uC790\uB8CC\uB97C \uD3EC\uD568\uD55C \uC0C8 \uD3C9\uADE0 \uAD6C\uD558\uAE30", (k) => E(`\uC138 \uC790\uB8CC\uC758 \uD569\uC740 ${24 + 3 * k}\uC774\uACE0 \uC0C8 \uC790\uB8CC ${8 + k}\uC744 \uB354\uD588\uC2B5\uB2C8\uB2E4. \uB124 \uC790\uB8CC\uC758 \uD3C9\uADE0\uC740 \uC5BC\uB9C8\uC785\uB2C8\uAE4C?`, [24 + 3 * k, 8 + k, "+", 4, "/"], "\uCD94\uAC00\uD55C \uC804\uCCB4 \uD569\uC744 \uC0C8 \uC790\uB8CC \uAC1C\uC218 4\uB85C \uB098\uB204\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "data-interpretation"), 12);
a5(6, "mean-definition", "6\uC21804-01", 1, "\uD3C9\uADE0\uC758 \uACC4\uC0B0 \uC6D0\uB9AC \uD655\uC778\uD558\uAE30", () => C("\uD3C9\uADE0\uC744 \uAD6C\uD558\uB294 \uBC14\uB978 \uBC29\uBC95\uC744 \uACE0\uB974\uC138\uC694.", "\uC790\uB8CC\uC758 \uD569\uC744 \uC790\uB8CC\uC758 \uAC1C\uC218\uB85C \uB098\uB208\uB2E4", [["\uAC00\uC7A5 \uD070 \uAC12\uC744 \uACE0\uB978\uB2E4", "\uCD5C\uB313\uAC12\uACFC \uD3C9\uADE0 \uD63C\uB3D9"], ["\uD569\uC5D0\uC11C \uAC1C\uC218\uB97C \uBE80\uB2E4", "\uB098\uB217\uC148 \uC5ED\uD560\uC744 \uBC14\uAFC8"]], "\uD3C9\uADE0\uC740 \uC804\uCCB4 \uC591\uC744 \uAC19\uC740 \uC591\uC73C\uB85C \uACE0\uB974\uAC8C \uB098\uB208 \uAC12\uC785\uB2C8\uB2E4."));
a5(6, "mean-not-always-data", "6\uC21804-01", 2, "\uD3C9\uADE0\uC774 \uC2E4\uC81C \uC790\uB8CC\uAC12\uC77C \uD544\uC694\uAC00 \uC5C6\uC74C \uC774\uD574\uD558\uAE30", () => C("\uC810\uC218 4\uC640 8\uC758 \uD3C9\uADE0\uC740 6\uC785\uB2C8\uB2E4. \uC2E4\uC81C \uC810\uC218\uC5D0 6\uC774 \uC5C6\uC5B4\uB3C4 \uD3C9\uADE0 6\uC774 \uB420 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC608", [["\uC544\uB2C8\uC694", "\uD3C9\uADE0\uC744 \uC790\uB8CC \uC911 \uD558\uB098\uB85C\uB9CC \uD310\uB2E8"]], "\uD3C9\uADE0\uC740 \uC790\uB8CC\uB97C \uACC4\uC0B0\uD574 \uC5BB\uB294 \uB300\uD45C\uAC12\uC774\uBA70 \uC2E4\uC81C \uC790\uB8CC\uAC12\uACFC \uAC19\uC744 \uD544\uC694\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."));
a5(6, "zero-in-mean", "6\uC21804-01", 3, "0\uC778 \uC790\uB8CC\uB3C4 \uAC1C\uC218\uC5D0 \uD3EC\uD568\uD558\uAE30", () => E("\uC790\uB8CC\uAC00 0, 6, 9\uC785\uB2C8\uB2E4. \uD3C9\uADE0\uC744 \uAD6C\uD558\uC138\uC694.", [0, 6, "+", 9, "+", 3, "/"], "0\uB3C4 \uC790\uB8CC \uD55C \uAC1C\uC774\uBBC0\uB85C \uC138 \uAC12\uC758 \uD569\uC744 3\uC73C\uB85C \uB098\uB204\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "data-interpretation"));
a5(6, "chance-impossible-number", "6\uC21804-05", 2, "\uBD88\uAC00\uB2A5\uD55C \uC0AC\uAC74\uACFC 0 \uC5F0\uACB0\uD558\uAE30", () => C("\uBD88\uAC00\uB2A5\uD55C \uC0AC\uAC74\uC758 \uAC00\uB2A5\uC131\uC744 \uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.", "0", [["1", "\uD655\uC2E4\uACFC \uD63C\uB3D9"], ["1/2", "\uBC18\uBC18\uACFC \uD63C\uB3D9"]], "\uBD88\uAC00\uB2A5\uD55C \uC0AC\uAC74\uC740 0\uC73C\uB85C \uB098\uD0C0\uB0C5\uB2C8\uB2E4."));
a5(6, "chance-certain-number", "6\uC21804-05", 2, "\uD655\uC2E4\uD55C \uC0AC\uAC74\uACFC 1 \uC5F0\uACB0\uD558\uAE30", () => C("\uD655\uC2E4\uD55C \uC0AC\uAC74\uC758 \uAC00\uB2A5\uC131\uC744 \uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.", "1", [["0", "\uBD88\uAC00\uB2A5\uACFC \uD63C\uB3D9"], ["1/2", "\uBC18\uBC18\uACFC \uD63C\uB3D9"]], "\uD655\uC2E4\uD55C \uC0AC\uAC74\uC740 1\uB85C \uB098\uD0C0\uB0C5\uB2C8\uB2E4."));
a5(6, "mean-two-sets-same", "6\uC21804-01", 3, "\uC790\uB8CC \uBD84\uD3EC\uC640 \uD3C9\uADE0\uC774 \uC11C\uB85C \uB2E4\uB978 \uC815\uBCF4\uC784\uC744 \uD310\uB2E8\uD558\uAE30", () => C("A\uC790\uB8CC\uB294 4, 6, 8\uC774\uACE0 B\uC790\uB8CC\uB294 6, 6, 6\uC785\uB2C8\uB2E4. \uD3C9\uADE0\uC744 \uBE44\uAD50\uD558\uC138\uC694.", "\uAC19\uB2E4", [["A\uAC00 \uB354 \uD06C\uB2E4", "\uCD5C\uB313\uAC12\uB9CC \uBE44\uAD50"], ["B\uAC00 \uB354 \uD06C\uB2E4", "\uAC00\uC6B4\uB370 \uAC12 \uBC18\uBCF5 \uD69F\uC218\uB9CC \uBE44\uAD50"]], "\uB450 \uD569\uC774 \uBAA8\uB450 18\uC774\uACE0 \uAC1C\uC218\uAC00 3\uC774\uBBC0\uB85C \uD3C9\uADE0\uC740 6\uC785\uB2C8\uB2E4."));
a5(6, "observations-not-certainty", "6\uC21804-06", 3, "\uAD00\uCE21 \uBE44\uC728\uACFC \uB2E4\uC74C \uACB0\uACFC\uC758 \uD655\uC815 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC2E4\uD5D8\uC5D0\uC11C A\uAC00 B\uBCF4\uB2E4 \uB354 \uC790\uC8FC \uB098\uC654\uC2B5\uB2C8\uB2E4. \uB2E4\uC74C \uD55C \uBC88\uC758 \uACB0\uACFC\uB97C \uBC14\uB974\uAC8C \uC124\uBA85\uD558\uC138\uC694.", "A\uAC00 \uB354 \uC790\uC8FC \uB098\uC62C \uAC83\uC73C\uB85C \uC608\uC0C1\uD560 \uC218 \uC788\uC9C0\uB9CC \uACB0\uACFC\uB97C \uD655\uC815\uD560 \uC218\uB294 \uC5C6\uB2E4", [["\uB2E4\uC74C\uC5D0\uB294 \uBC18\uB4DC\uC2DC A\uC774\uB2E4", "\uC608\uC0C1\uC744 \uD655\uC815\uC73C\uB85C \uBC14\uAFC8"], ["\uBC18\uB4DC\uC2DC B\uAC00 \uBCF4\uC0C1\uD558\uC5EC \uB098\uC628\uB2E4", "\uACFC\uAC70 \uAE30\uB85D\uC774 \uB2E4\uC74C \uACB0\uACFC\uB97C \uAC15\uC81C\uD55C\uB2E4\uACE0 \uD310\uB2E8"]], "\uAD00\uCE21\uC740 \uC608\uC0C1\uC758 \uADFC\uAC70\uC774\uBA70 \uB2E4\uC74C \uACB0\uACFC\uB97C \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."));
a5(6, "probability-language-order", "6\uC21804-04", 3, "\uAC00\uB2A5\uC131\uC758 \uB9D0\uC758 \uD06C\uAE30 \uC21C\uC11C \uC774\uD574\uD558\uAE30", () => C("\uBD88\uAC00\uB2A5\uD558\uB2E4, \uBC18\uBC18\uC774\uB2E4, \uD655\uC2E4\uD558\uB2E4\uB97C \uAC00\uB2A5\uC131\uC774 \uC791\uC740 \uC21C\uC11C\uB300\uB85C \uACE0\uB974\uC138\uC694.", "\uBD88\uAC00\uB2A5\uD558\uB2E4 \u2192 \uBC18\uBC18\uC774\uB2E4 \u2192 \uD655\uC2E4\uD558\uB2E4", [["\uBC18\uBC18\uC774\uB2E4 \u2192 \uBD88\uAC00\uB2A5\uD558\uB2E4 \u2192 \uD655\uC2E4\uD558\uB2E4", "0\uACFC \uC911\uAC04 \uAC00\uB2A5\uC131 \uD63C\uB3D9"], ["\uD655\uC2E4\uD558\uB2E4 \u2192 \uBC18\uBC18\uC774\uB2E4 \u2192 \uBD88\uAC00\uB2A5\uD558\uB2E4", "\uC21C\uC11C \uBC18\uB300"]], "\uAC01\uAC01 0, 1/2, 1\uC5D0 \uD574\uB2F9\uD569\uB2C8\uB2E4."));
a5(6, "mean-recover-combined", "6\uC21804-01", 3, "\uD3C9\uADE0\uACFC \uC54C\uB824\uC9C4 \uC790\uB8CC\uC758 \uD569\uC5D0\uC11C \uB098\uBA38\uC9C0 \uAC12 \uCC3E\uAE30", () => E("\uB124 \uC810\uC218\uC758 \uD3C9\uADE0\uC774 8\uC774\uACE0 \uC54C\uB824\uC9C4 \uC138 \uC810\uC218 \uD569\uC774 23\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uC810\uC218\uB97C \uAD6C\uD558\uC138\uC694.", [8, 4, "*", 23, "-"], "\uC804\uCCB4 \uD569\uC5D0\uC11C \uC54C\uB824\uC9C4 \uD569\uC744 \uBE7C\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "data-interpretation"));
a5(6, "mean-choice-constraint", "6\uC21804-01", 4, "\uBAA9\uD45C \uD3C9\uADE0\uACFC \uC810\uC218 \uC81C\uD55C\uC744 \uD568\uAED8 \uACE0\uB824\uD558\uAE30", () => C("\uC138 \uC810\uC218\uB294 6, 7, 8\uC785\uB2C8\uB2E4. \uB124 \uBC88\uC9F8 \uC810\uC218\uB294 \uC790\uC5F0\uC218\uC774\uBA70 10 \uC774\uD558\uC785\uB2C8\uB2E4. \uB124 \uC810\uC218\uC758 \uD3C9\uADE0\uC744 8\uB85C \uB9CC\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uBD88\uAC00\uB2A5\uD558\uB2E4", [["\uAC00\uB2A5\uD558\uB2E4", "\uD544\uC694 \uC810\uC218 11\uC774 \uC81C\uD55C\uC744 \uB118\uB294 \uC810 \uB204\uB77D"]], "\uC804\uCCB4 \uD569 32\uAC00 \uD544\uC694\uD558\uC9C0\uB9CC \uC9C0\uAE08 \uD569\uC740 21\uC774\uBBC0\uB85C \uB124 \uBC88\uC9F8\uB294 11\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4."));

// learning-review-r1/native/data/final-expansion-grade6.js
var a6 = (s, u, id, code, l, o, fn, domain = 1) => A(6, s, u, "FINAL-" + id, code, l, o, fn, domain);
a6(1, 1, "fraction-share-two-amounts", "6\uC21801-11", 3, "\uB450 \uBD84\uC218 \uC591\uC744 \uD569\uCE5C \uB4A4 \uC790\uC5F0\uC218\uB85C \uB098\uB204\uAE30", (k) => E(`\uBB3C ${f(2 + k, 5)} L\uC640 1/5 L\uB97C \uD569\uCCD0 3\uBA85\uC5D0\uAC8C \uB611\uAC19\uC774 \uB098\uB215\uB2C8\uB2E4. \uD55C \uC0AC\uB78C\uC758 \uC591\uC744 L \uB2E8\uC704\uC758 \uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, [f(2 + k, 5), "1/5", "+", 3, "/"], "\uB450 \uC591\uC744 \uD569\uD558\uC5EC \uC0AC\uB78C \uC218\uB85C \uB098\uB204\uBA74 {answer} L\uC785\uB2C8\uB2E4."), 12);
a6(1, 1, "natural-quotient-three", "6\uC21801-10", 2, "\uB098\uB204\uC5B4\uB5A8\uC5B4\uC9C0\uC9C0 \uC54A\uB294 \uC790\uC5F0\uC218 \uBAAB\uC744 \uBD84\uC218\uB85C \uB098\uD0C0\uB0B4\uAE30", (k) => E(`\uBB3C ${3 * k + 4} L\uB97C \uC138 \uD1B5\uC5D0 \uB611\uAC19\uC774 \uB098\uB215\uB2C8\uB2E4. \uD55C \uD1B5\uC5D0 \uB2F4\uAE30\uB294 \uC591\uC744 L \uB2E8\uC704\uC758 \uAE30\uC57D\uBD84\uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, [3 * k + 4, 3, "/"], "\uC804\uCCB4 \uC591\uC744 \uC138 \uB4F1\uBD84\uD558\uC5EC \uD55C \uD1B5\uC758 \uC591\uC744 \uAD6C\uD558\uBA74 {answer} L\uC785\uB2C8\uB2E4.", "", "word-problem"), 12);
a6(1, 1, "quotient-fraction-meaning", "6\uC21801-10", 1, "\uC790\uC5F0\uC218 \uB098\uB217\uC148\uACFC \uBD84\uC218 \uD45C\uD604 \uC5F0\uACB0\uD558\uAE30", () => C("3 \xF7 5\uC758 \uBAAB\uACFC \uAC19\uC740 \uBD84\uC218\uB97C \uACE0\uB974\uC138\uC694.", "3/5", [["5/3", "\uC21C\uC11C\uB97C \uB4A4\uC9D1\uC74C"], ["3/3", "\uB098\uB204\uB294 \uC218\uB97C \uB204\uB77D"]], "\uB098\uB204\uC5B4\uC9C0\uB294 \uC218\uB97C \uBD84\uC790, \uB098\uB204\uB294 \uC218\uB97C \uBD84\uBAA8\uB85C \uB098\uD0C0\uB0C5\uB2C8\uB2E4."));
a6(1, 1, "fraction-divide-one", "6\uC21801-11", 2, "1\uB85C \uB098\uB208 \uBD84\uC218\uC758 \uAC12 \uC774\uD574\uD558\uAE30", () => C("7/9\uC744 1\uB85C \uB098\uB20C \uB54C \uC6D0\uB798 \uAC12\uC774 \uADF8\uB300\uB85C\uC778 \uAE4C\uB2ED\uC744 \uACE0\uB974\uC138\uC694.", "\uC804\uCCB4 \uC591\uC744 \uD55C \uBAAB\uC73C\uB85C \uB098\uB204\uAE30 \uB54C\uBB38\uC774\uB2E4", [["\uBD84\uC218\uB294 \uC5B4\uB5A4 \uC218\uB85C \uB098\uB204\uC5B4\uB3C4 \uAC12\uC774 \uAC19\uAE30 \uB54C\uBB38\uC774\uB2E4", "\uB098\uB204\uB294 \uC218\uAC00 1\uC778 \uD2B9\uBCC4\uD55C \uC870\uAC74\uC744 \uC77C\uBC18\uD654"], ["\uBD84\uBAA8\uC5D0\uC11C 1\uC744 \uBE7C\uAE30 \uB54C\uBB38\uC774\uB2E4", "\uBD84\uC218 \uB098\uB217\uC148\uC744 \uBD84\uBAA8 \uBE84\uC148\uC73C\uB85C \uC624\uC778"]], "\uD55C \uBAAB\uC73C\uB85C \uB098\uB204\uBA74 \uADF8 \uD55C \uBAAB\uC740 \uC804\uCCB4 \uC591\uACFC \uAC19\uC2B5\uB2C8\uB2E4."));
a6(1, 1, "fraction-share-meaning", "6\uC21801-11", 2, "\uBD84\uC218 \uC591\uC758 \uB4F1\uBD84\uC744 \uBD84\uBAA8 \uBCC0\uD654\uB85C \uC124\uBA85\uD558\uAE30", () => C("2/3\uC744 4\uB4F1\uBD84\uD55C \uD55C \uBD80\uBD84\uC744 \uACE0\uB974\uC138\uC694.", "1/6", [["8/3", "\uB098\uB217\uC148\uC744 \uACF1\uC148\uC73C\uB85C \uBC14\uAFC8"], ["2/7", "\uBD84\uBAA8\uC5D0 \uB098\uB204\uB294 \uC218\uB97C \uB354\uD568"]], "2/3\uC758 \uD55C \uC870\uAC01\uC744 \uB137\uC73C\uB85C \uB098\uB204\uBA74 2/12\uC774\uACE0 \uC57D\uBD84\uD558\uBA74 1/6\uC785\uB2C8\uB2E4."));
a6(1, 1, "quotient-value-size", "6\uC21801-10", 3, "1\uBCF4\uB2E4 \uC791\uC740 \uC790\uC5F0\uC218 \uB098\uB217\uC148 \uBAAB \uD310\uB2E8\uD558\uAE30", () => C("\uC591\uC758 \uC790\uC5F0\uC218 A\uAC00 B\uBCF4\uB2E4 \uC791\uC2B5\uB2C8\uB2E4. A \xF7 B\uC758 \uBAAB\uC744 \uBC14\uB974\uAC8C \uC124\uBA85\uD558\uC138\uC694.", "0\uBCF4\uB2E4 \uD06C\uACE0 1\uBCF4\uB2E4 \uC791\uB2E4", [["\uD56D\uC0C1 0\uC774\uB2E4", "\uC815\uC218 \uBAAB\uB9CC \uC0DD\uAC01"], ["1\uBCF4\uB2E4 \uD06C\uB2E4", "\uBE44\uAD50 \uBC29\uD5A5\uC744 \uBC14\uAFC8"]], "\uC804\uCCB4 B\uBCF4\uB2E4 \uC791\uC740 \uC591 A\uB97C \uB098\uB204\uBBC0\uB85C \uBD84\uC218\uB85C \uB098\uD0C0\uB0B8 \uBAAB\uC740 1\uBCF4\uB2E4 \uC791\uC2B5\uB2C8\uB2E4."));
a6(1, 1, "fraction-return-check", "6\uC21801-11", 3, "\uB4F1\uBD84 \uACB0\uACFC\uC5D0 \uC0AC\uB78C \uC218\uB97C \uACF1\uD574 \uD655\uC778\uD558\uAE30", () => C("3/4 L\uB97C 3\uBA85\uC5D0\uAC8C \uB611\uAC19\uC774 \uC8FC\uBA74 1/4 L\uC529\uC785\uB2C8\uB2E4. \uBC14\uB978 \uD655\uC778 \uC2DD\uC744 \uACE0\uB974\uC138\uC694.", "1/4 \xD7 3 = 3/4", [["1/4 \xF7 3 = 3/4", "\uD655\uC778\uC5D0\uC11C \uB2E4\uC2DC \uB098\uB214"], ["1/4 + 3 = 3/4", "\uC591\uACFC \uC0AC\uB78C \uC218 \uC5ED\uD560 \uD63C\uB3D9"]], "\uD55C \uC0AC\uB78C\uC758 \uC591\uC744 \uC0AC\uB78C \uC218\uB9CC\uD07C \uD569\uD558\uBA74 \uCC98\uC74C \uC591\uC785\uB2C8\uB2E4."));
a6(1, 1, "fraction-subtract-before-share", "6\uC21801-11", 3, "\uC0AC\uC6A9\uD55C \uC591\uC744 \uBE80 \uB4A4 \uB0A8\uC740 \uC591 \uB098\uB204\uAE30", () => E("\uBB3C 5/6 L \uC911 1/3 L\uB97C \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4. \uB098\uBA38\uC9C0\uB97C 2\uBCD1\uC5D0 \uB611\uAC19\uC774 \uB2F4\uC740 \uD55C \uBCD1\uC758 \uC591\uC744 L \uB2E8\uC704\uC758 \uC218\uB85C \uAD6C\uD558\uC138\uC694.", ["5/6", "1/3", "-", 2, "/"], "\uB0A8\uC740 1/2 L\uB97C \uB458\uB85C \uB098\uB204\uBA74 {answer} L\uC785\uB2C8\uB2E4."));
a6(1, 1, "fraction-unknown-people", "6\uC21801-11", 3, "\uC591\xB7\uC0AC\uB78C \uC218\xB7\uB4F1\uBD84 \uACB0\uACFC\uC758 \uC77C\uCE58 \uD310\uB2E8\uD558\uAE30", () => C("\uBB3C 3/5 L\uB97C \uB611\uAC19\uC774 \uB098\uB204\uC5B4 \uD55C \uC0AC\uB78C\uC5D0\uAC8C 1/5 L\uC529 \uC8FC\uC5C8\uC2B5\uB2C8\uB2E4. \uC0AC\uB78C \uC218\uB97C \uACE0\uB974\uC138\uC694.", "3\uBA85", [["5\uBA85", "\uBD84\uBAA8\uB97C \uC0AC\uB78C \uC218\uB85C \uC624\uC778"], ["1\uBA85", "\uBD84\uC790\uB97C \uB204\uB77D"]], "1/5 L\uB97C \uC138 \uBC88 \uD569\uD558\uBA74 3/5 L\uC785\uB2C8\uB2E4."));
a6(1, 1, "natural-fraction-two-symbols", "6\uC21801-10", 3, "\uB098\uB204\uB294 \uC21C\uC11C\uC640 \uBAAB\uC758 \uD06C\uAE30 \uBE44\uAD50\uD558\uAE30", () => C("4 \xF7 7\uACFC 7 \xF7 4\uB97C \uBE44\uAD50\uD558\uC138\uC694.", "\uCCAB \uBAAB\uC740 1\uBCF4\uB2E4 \uC791\uACE0 \uB458\uC9F8 \uBAAB\uC740 1\uBCF4\uB2E4 \uD06C\uB2E4", [["\uB450 \uBAAB\uC774 \uAC19\uB2E4", "\uB098\uB217\uC148 \uC21C\uC11C \uC601\uD5A5 \uBB34\uC2DC"], ["\uB450 \uBAAB\uC774 \uBAA8\uB450 1\uBCF4\uB2E4 \uC791\uB2E4", "\uB450 \uBC88\uC9F8 \uBE44\uAD50 \uC870\uAC74 \uB204\uB77D"]], "4/7\uACFC 7/4\uB97C \uC804\uCCB4 1\uACFC \uBE44\uAD50\uD569\uB2C8\uB2E4."));
a6(1, 1, "fraction-whole-sharing", "6\uC21801-11", 3, "\uB300\uBD84\uC218 \uC591\uC744 \uC790\uC5F0\uC218\uB85C \uB098\uB204\uAE30", () => E("\uB9AC\uBCF8 2 1/2 m\uB97C 5\uC870\uAC01\uC73C\uB85C \uB611\uAC19\uC774 \uB098\uB215\uB2C8\uB2E4. \uD55C \uC870\uAC01 \uAE38\uC774\uB97C m \uB2E8\uC704\uC758 \uC218\uB85C \uAD6C\uD558\uC138\uC694.", ["5/2", 5, "/"], "\uAC00\uBD84\uC218\uB85C \uB098\uD0C0\uB0B8 \uC591\uC744 \uB2E4\uC12F\uC73C\uB85C \uB098\uB204\uBA74 {answer} m\uC785\uB2C8\uB2E4."));
a6(1, 1, "sharing-two-goals", "6\uC21801-11", 4, "\uC804\uCCB4\xB7\uB0A8\uACA8\uB458 \uC591\xB7\uBC30\uBD84 \uBAA9\uD45C\uB97C \uD568\uAED8 \uD310\uB2E8\uD558\uAE30", () => C("\uBB3C 2 L \uC911 1/2 L\uB97C \uB0A8\uACA8 \uB450\uACE0 \uB098\uBA38\uC9C0\uB97C 3\uBA85\uC5D0\uAC8C \uB611\uAC19\uC774 \uC90D\uB2C8\uB2E4. \uD55C \uC0AC\uB78C\uC5D0\uAC8C 1/2 L \uC774\uC0C1 \uC904 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uAC00\uB2A5\uD558\uBA70 \uC815\uD655\uD788 1/2 L\uC529\uC774\uB2E4", [["\uBD88\uAC00\uB2A5\uD558\uBA70 1/3 L\uC529\uC774\uB2E4", "\uB0A8\uACA8\uB458 \uC591 \uCC98\uB9AC \uC624\uB958"], ["\uAC00\uB2A5\uD558\uBA70 2/3 L\uC529\uC774\uB2E4", "\uB0A8\uACA8\uB458 \uC591 \uB204\uB77D"]], "\uB098\uB20C \uC591\uC740 3/2 L\uC774\uACE0 \uC138 \uB4F1\uBD84\uD558\uBA74 1/2 L\uC785\uB2C8\uB2E4."));
a6(1, 2, "prism-vertices", "6\uC21803-05", 2, "\uAC01\uAE30\uB465 \uBC11\uBA74\uC758 \uAF2D\uC9D3\uC810\uACFC \uC804\uCCB4 \uAF2D\uC9D3\uC810 \uC5F0\uACB0\uD558\uAE30", (k) => E(`${["\uC0BC", "\uC0AC", "\uC624", "\uC721"][k]}\uAC01\uAE30\uB465\uC758 \uAC01 \uBC11\uBA74 \uAF2D\uC9D3\uC810\uC740 ${3 + k}\uAC1C\uC785\uB2C8\uB2E4. \uC804\uCCB4 \uAF2D\uC9D3\uC810\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [3 + k, 2, "*"], "\uB450 \uBC11\uBA74\uC758 \uAF2D\uC9D3\uC810\uC744 \uD569\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 4);
a6(1, 2, "pyramid-vertices", "6\uC21803-05", 2, "\uAC01\uBFD4 \uBC11\uBA74 \uAF2D\uC9D3\uC810\uACFC \uD55C \uAF2D\uC9D3\uC810 \uC5F0\uACB0\uD558\uAE30", (k) => E(`${["\uC0BC", "\uC0AC", "\uC624", "\uC721"][k]}\uAC01\uBFD4\uC758 \uBC11\uBA74 \uAF2D\uC9D3\uC810\uC740 ${3 + k}\uAC1C\uC785\uB2C8\uB2E4. \uAF2D\uB300\uAE30 \uD55C \uC810\uAE4C\uC9C0 \uC804\uCCB4 \uAF2D\uC9D3\uC810\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [3 + k, 1, "+"], "\uBC11\uBA74 \uAF2D\uC9D3\uC810\uACFC \uAF2D\uB300\uAE30\uB97C \uB354\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 4);
a6(1, 2, "prism-name-base", "6\uC21803-05", 1, "\uBC11\uBA74 \uBAA8\uC591\uC73C\uB85C \uAC01\uAE30\uB465 \uC774\uB984 \uC815\uD558\uAE30", () => C("\uBC11\uBA74\uC774 \uC11C\uB85C \uD569\uB3D9\uC778 \uC624\uAC01\uD615 \uB450 \uAC1C\uC774\uACE0 \uC606\uBA74\uC774 \uC9C1\uC0AC\uAC01\uD615\uC778 \uACE7\uC740 \uAE30\uB465\uC744 \uACE0\uB974\uC138\uC694.", "\uC624\uAC01\uAE30\uB465", [["\uC624\uAC01\uBFD4", "\uBC11\uBA74 \uC218\uC640 \uC606\uBA74 \uBAA8\uC591 \uB204\uB77D"], ["\uC0BC\uAC01\uAE30\uB465", "\uBC11\uBA74 \uBAA8\uC591 \uC624\uB958"]], "\uAC01\uAE30\uB465 \uC774\uB984\uC740 \uBC11\uBA74 \uB2E4\uAC01\uD615\uC758 \uC774\uB984\uC744 \uB530\uB985\uB2C8\uB2E4."));
a6(1, 2, "pyramid-side-shape", "6\uC21803-05", 2, "\uAC01\uBFD4 \uC606\uBA74\uACFC \uBC11\uBA74 \uAD6C\uBCC4\uD558\uAE30", () => C("\uAC01\uBFD4\uC758 \uC606\uBA74\uC740 \uC5B4\uB5A4 \uBAA8\uC591\uC785\uB2C8\uAE4C?", "\uC0BC\uAC01\uD615", [["\uD56D\uC0C1 \uC9C1\uC0AC\uAC01\uD615", "\uAC01\uAE30\uB465 \uC606\uBA74\uACFC \uD63C\uB3D9"], ["\uD56D\uC0C1 \uC6D0", "\uC6D0\uBFD4\uACFC \uD63C\uB3D9"]], "\uBC11\uBA74\uC758 \uAC01 \uBCC0\uACFC \uAF2D\uB300\uAE30\uB97C \uC787\uB294 \uC0BC\uAC01\uD615\uB4E4\uC774 \uC606\uBA74\uC785\uB2C8\uB2E4."));
a6(1, 2, "prism-edges", "6\uC21803-05", 3, "\uAC01\uAE30\uB465\uC758 \uBAA8\uC11C\uB9AC \uBB36\uC74C \uC138\uAE30", () => E("\uC624\uAC01\uAE30\uB465\uC5D0\uB294 \uBC11\uBA74 \uB450 \uAC1C\uC758 \uBAA8\uC11C\uB9AC \uB2E4\uC12F \uAC1C\uC529\uACFC \uB450 \uBC11\uBA74\uC744 \uC787\uB294 \uB2E4\uC12F \uAC1C\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uBAA8\uC11C\uB9AC\uB294 \uBAA8\uB450 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", [5, 2, "*", 5, "+"], "\uC138 \uBB36\uC74C\uC758 \uBAA8\uC11C\uB9AC\uB97C \uB354\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a6(1, 2, "pyramid-edges", "6\uC21803-05", 3, "\uAC01\uBFD4\uC758 \uBC11\uBA74\uACFC \uC606 \uBAA8\uC11C\uB9AC \uC138\uAE30", () => E("\uC721\uAC01\uBFD4\uC5D0\uB294 \uBC11\uBA74 \uBAA8\uC11C\uB9AC \uC5EC\uC12F \uAC1C\uC640 \uAF2D\uB300\uAE30\uB85C \uC787\uB294 \uC5EC\uC12F \uAC1C\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uBAA8\uB450 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", [6, 6, "+"], "\uB450 \uC885\uB958\uC758 \uBAA8\uC11C\uB9AC\uB97C \uB354\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a6(1, 2, "two-base-congruence", "6\uC21803-05", 3, "\uAC01\uAE30\uB465 \uB450 \uBC11\uBA74\uC758 \uC870\uAC74 \uD310\uB2E8\uD558\uAE30", () => C("\uBAA8\uC591\uC740 \uAC19\uC9C0\uB9CC \uD06C\uAE30\uAC00 \uB2E4\uB978 \uB450 \uB2E4\uAC01\uD615\uC744 \uBC11\uBA74\uC73C\uB85C \uC4F4 \uAE30\uB465\uC744 \uCD08\uB4F1\uC5D0\uC11C \uBC30\uC6B0\uB294 \uACE7\uC740 \uAC01\uAE30\uB465\uC73C\uB85C \uD310\uB2E8\uD574\uB3C4 \uB429\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uBC11\uBA74\uC758 \uD569\uB3D9 \uC870\uAC74 \uB204\uB77D"]], "\uB450 \uBC11\uBA74\uC740 \uD06C\uAE30\uC640 \uBAA8\uC591\uC774 \uAC19\uC544\uC57C \uD569\uB2C8\uB2E4."));
a6(1, 2, "net-base-side-match", "6\uC21803-06", 4, "\uC804\uAC1C\uB3C4 \uC606\uBA74 \uC218\uC640 \uBC11\uBA74 \uBCC0 \uC218 \uD568\uAED8 \uD655\uC778\uD558\uAE30", () => C("\uC624\uAC01\uD615 \uBC11\uBA74 \uB450 \uAC1C\uC640 \uC9C1\uC0AC\uAC01\uD615 \uC606\uBA74 \uB124 \uAC1C\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uC624\uAC01\uAE30\uB465\uC758 \uBA74\uC744 \uBAA8\uB450 \uCC44\uC6B8 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uBC11\uBA74 \uBCC0 \uC218\uC640 \uC606\uBA74 \uC218 \uB300\uC751 \uB204\uB77D"]], "\uC624\uAC01\uAE30\uB465\uC758 \uC606\uBA74\uC740 \uB2E4\uC12F \uAC1C\uC5EC\uC57C \uD569\uB2C8\uB2E4."));
a6(1, 2, "prism-face-inverse", "6\uC21803-05", 3, "\uC804\uCCB4 \uBA74 \uC218\uC5D0\uC11C \uBC11\uBA74 \uBAA8\uC591 \uCD94\uB860\uD558\uAE30", () => C("\uAC01\uAE30\uB465\uC758 \uBA74\uC774 \uBAA8\uB450 8\uAC1C\uC785\uB2C8\uB2E4. \uC606\uBA74\uC740 \uBC11\uBA74\uC758 \uAC01 \uBCC0\uC5D0 \uD558\uB098\uC529 \uC788\uC2B5\uB2C8\uB2E4. \uBC11\uBA74 \uBAA8\uC591\uC744 \uACE0\uB974\uC138\uC694.", "\uC721\uAC01\uD615", [["\uD314\uAC01\uD615", "\uBC11\uBA74 \uB450 \uAC1C\uB97C \uBE7C\uC9C0 \uC54A\uC74C"], ["\uC624\uAC01\uD615", "\uBA74 \uC218\uC640 \uBCC0 \uC218 \uB300\uC751 \uC624\uB958"]], "\uBC11\uBA74 \uB450 \uAC1C\uB97C \uBE7C\uBA74 \uC606\uBA74 \uC5EC\uC12F \uAC1C\uC785\uB2C8\uB2E4."));
a6(1, 2, "missing-pyramid-side", "6\uC21803-05", 3, "\uBC11\uBA74\uC5D0 \uD544\uC694\uD55C \uC606\uBA74 \uC218 \uAD6C\uD558\uAE30", () => C("\uC0AC\uAC01\uBFD4\uC744 \uB9CC\uB4E4\uB824\uBA74 \uC0AC\uAC01\uD615 \uBC11\uBA74 \uC678 \uC0BC\uAC01\uD615 \uC606\uBA74\uC740 \uBA87 \uAC1C \uD544\uC694\uD569\uB2C8\uAE4C?", "4\uAC1C", [["2\uAC1C", "\uAC01\uAE30\uB465 \uBC11\uBA74 \uC218\uC640 \uD63C\uB3D9"], ["5\uAC1C", "\uBC11\uBA74\uAE4C\uC9C0 \uC606\uBA74\uC5D0 \uC148"]], "\uBC11\uBA74 \uB124 \uBCC0\uC5D0 \uC0BC\uAC01\uD615 \uD558\uB098\uC529 \uBD99\uC2B5\uB2C8\uB2E4."));
a6(1, 2, "net-only-components", "6\uC21803-06", 3, "\uBA74 \uAD6C\uC131\uACFC \uC5F0\uACB0 \uC131\uB9BD\uC744 \uBCC4\uB3C4\uB85C \uD310\uB2E8\uD558\uAE30", () => C("\uC0BC\uAC01\uAE30\uB465\uC5D0 \uB9DE\uB294 \uBA74\uC758 \uC885\uB958\uC640 \uAC1C\uC218\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uC774\uAC83\uB9CC\uC73C\uB85C \uC5B4\uB5A4 \uC5F0\uACB0\uB3C4 \uC62C\uBC14\uB978 \uC804\uAC1C\uB3C4\uB77C\uACE0 \uD560 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uBA74 \uAD6C\uC131\uACFC \uC5F0\uACB0 \uC131\uB9BD\uC744 \uD63C\uB3D9"]], "\uBA74\uC758 \uB300\uC751 \uBCC0\uACFC \uC811\uD78C \uB4A4 \uACB9\uCE68\uB3C4 \uD655\uC778\uD574\uC57C \uD569\uB2C8\uB2E4."));
a6(1, 2, "solid-combined-counts", "6\uC21803-05", 3, "\uBA74\xB7\uBAA8\uC11C\uB9AC\xB7\uAF2D\uC9D3\uC810 \uC870\uAC74\uC744 \uD568\uAED8 \uC0AC\uC6A9\uD558\uAE30", () => C("\uAC01\uAE30\uB465\uC758 \uAF2D\uC9D3\uC810\uC774 10\uAC1C, \uC606\uBA74\uC774 5\uAC1C\uC785\uB2C8\uB2E4. \uC804\uCCB4 \uBA74 \uC218\uC640 \uC774\uB984\uC744 \uACE0\uB974\uC138\uC694.", "7\uBA74\uC778 \uC624\uAC01\uAE30\uB465", [["5\uBA74\uC778 \uC624\uAC01\uAE30\uB465", "\uBC11\uBA74 \uB450 \uAC1C \uB204\uB77D"], ["7\uBA74\uC778 \uCE60\uAC01\uAE30\uB465", "\uC804\uCCB4 \uBA74 \uC218\uC640 \uBC11\uBA74 \uBCC0 \uC218 \uD63C\uB3D9"]], "\uAC01 \uBC11\uBA74\uC758 \uAF2D\uC9D3\uC810\uC740 \uB2E4\uC12F \uAC1C\uC774\uACE0 \uBA74\uC740 \uC606\uBA74 \uB2E4\uC12F \uAC1C\uC640 \uBC11\uBA74 \uB450 \uAC1C\uC785\uB2C8\uB2E4."));
a6(1, 3, "decimal-share-two-sources", "6\uC21801-15", 3, "\uB450 \uC18C\uC218 \uC591\uC744 \uD569\uCCD0 \uC790\uC5F0\uC218\uB85C \uB098\uB204\uAE30", (k) => E(`\uBB3C ${dec(24 + 3 * k, 10)} L\uC640 1.2 L\uB97C \uD569\uCCD0 3\uBCD1\uC5D0 \uB611\uAC19\uC774 \uB2F4\uC2B5\uB2C8\uB2E4. \uD55C \uBCD1\uC5D0 \uBA87 L\uC785\uB2C8\uAE4C?`, [dec(24 + 3 * k, 10), "1.2", "+", 3, "/"], "\uD569\uCE5C \uC591\uC744 \uBCD1 \uC218\uB85C \uB098\uB204\uBA74 {answer} L\uC785\uB2C8\uB2E4.", "L"), 12);
a6(1, 3, "natural-quotient-eighths", "6\uC21801-14", 2, "\uC790\uC5F0\uC218 \uBAAB\uC744 \uC18C\uC218\uB85C \uD45C\uD604\uD558\uAE30", (k) => E(`\uC8FC\uC2A4 ${2 * k + 9} L\uB97C \uC5EC\uB35F \uD1B5\uC5D0 \uB611\uAC19\uC774 \uB2F4\uC2B5\uB2C8\uB2E4. \uD55C \uD1B5\uC758 \uC591\uC740 \uBA87 L\uC785\uB2C8\uAE4C? \uC18C\uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, [2 * k + 9, 8, "/"], "\uC804\uCCB4 \uC591\uC744 \uC5EC\uB35F \uB4F1\uBD84\uD558\uC5EC \uAD6C\uD558\uBA74 {answer} L\uC785\uB2C8\uB2E4.", "L"), 12);
a6(1, 3, "decimal-division-one", "6\uC21801-15", 1, "1\uB85C \uB098\uB208 \uC18C\uC218 \uAC12 \uC774\uD574\uD558\uAE30", () => E("2.75 \xF7 1\uC744 \uACC4\uC0B0\uD558\uC138\uC694.", ["2.75", 1, "/"], "\uD55C \uBB36\uC74C\uC73C\uB85C \uADF8\uB300\uB85C \uB098\uB208 \uC591\uC740 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a6(1, 3, "decimal-point-quotient", "6\uC21801-15", 2, "\uC790\uB9BF\uAC12\uC73C\uB85C \uC18C\uC218 \uBAAB \uD655\uC778\uD558\uAE30", () => C("0.84 \xF7 4\uC758 \uBC14\uB978 \uBAAB\uC744 \uACE0\uB974\uC138\uC694.", "0.21", [["2.1", "\uC18C\uC218\uC810 \uD55C \uC790\uB9AC \uC624\uB958"], ["21", "\uC18C\uC218\uC810 \uB450 \uC790\uB9AC \uC624\uB958"]], "84\uAC1C\uC758 0.01\uC744 \uB137\uC73C\uB85C \uB098\uB204\uBA74 21\uAC1C\uC758 0.01\uC785\uB2C8\uB2E4."));
a6(1, 3, "equal-distance-time", "6\uC21801-15", 3, "\uC804\uCCB4 \uC18C\uC218 \uAC70\uB9AC\uC640 \uAC19\uC740 \uAD6C\uAC04 \uC218 \uC5F0\uACB0\uD558\uAE30", () => E("\uC804\uCCB4 \uAC70\uB9AC 7.2 km\uB97C \uAC19\uC740 \uAE38\uC774 \uC5EC\uC12F \uAD6C\uAC04\uC73C\uB85C \uB098\uB215\uB2C8\uB2E4. \uD55C \uAD6C\uAC04\uC740 \uBA87 km\uC785\uB2C8\uAE4C?", ["7.2", 6, "/"], "\uC804\uCCB4\uB97C \uAD6C\uAC04 \uC218\uB85C \uB098\uB204\uBA74 {answer} km\uC785\uB2C8\uB2E4.", "km"));
a6(1, 3, "quotient-and-unit", "6\uC21801-14", 3, "\uC790\uC5F0\uC218 \uCE21\uC815\uB7C9\uC744 \uB098\uB208 \uC18C\uC218\uC640 \uB2E8\uC704 \uC720\uC9C0\uD558\uAE30", () => E("\uB048 5 m\uB97C 4\uC870\uAC01\uC73C\uB85C \uB611\uAC19\uC774 \uB098\uB215\uB2C8\uB2E4. \uD55C \uC870\uAC01 \uAE38\uC774\uB294 \uBA87 m\uC785\uB2C8\uAE4C?", [5, 4, "/"], "\uAC19\uC740 \uB2E8\uC704\uC758 \uC804\uCCB4\uB97C \uB137\uC73C\uB85C \uB098\uB208 {answer} m\uC785\uB2C8\uB2E4.", "m"));
a6(1, 3, "division-result-check", "6\uC21801-15", 3, "\uC18C\uC218 \uBAAB\uACFC \uC6D0\uB798 \uC591\uC758 \uC77C\uCE58 \uD655\uC778\uD558\uAE30", () => C("6.3 \xF7 3 = 2.1\uC744 \uD655\uC778\uD558\uB294 \uC2DD\uC744 \uACE0\uB974\uC138\uC694.", "2.1 \xD7 3 = 6.3", [["2.1 + 3 = 6.3", "\uACF1\uC148\uACFC \uB367\uC148 \uD63C\uB3D9"], ["2.1 \xF7 3 = 6.3", "\uB2E4\uC2DC \uB098\uB214"]], "\uBAAB\uC5D0 \uB098\uB204\uB294 \uC218\uB97C \uACF1\uD574 \uD655\uC778\uD569\uB2C8\uB2E4."));
a6(1, 3, "decimal-use-before-share", "6\uC21801-15", 3, "\uC0AC\uC6A9\uD55C \uC591\uC744 \uC81C\uC678\uD55C \uC18C\uC218 \uC591 \uB098\uB204\uAE30", () => E("\uC8FC\uC2A4 5.4 L \uC911 0.6 L\uB97C \uC0AC\uC6A9\uD558\uACE0 \uB098\uBA38\uC9C0\uB97C 4\uBCD1\uC5D0 \uB098\uB215\uB2C8\uB2E4. \uD55C \uBCD1\uC5D0\uB294 \uBA87 L\uC785\uB2C8\uAE4C?", ["5.4", "0.6", "-", 4, "/"], "\uB0A8\uC740 \uC591 4.8 L\uB97C \uB137\uC73C\uB85C \uB098\uB204\uBA74 {answer} L\uC785\uB2C8\uB2E4.", "L"));
a6(1, 3, "natural-divisor-size", "6\uC21801-15", 2, "\uC790\uC5F0\uC218\uB85C \uB4F1\uBD84\uD560 \uB54C \uBAAB\uC758 \uD06C\uAE30 \uD310\uB2E8\uD558\uAE30", () => C("\uC591\uC758 \uC18C\uC218 \uC591\uC744 3\uB4F1\uBD84\uD55C \uD55C \uBD80\uBD84\uC740 \uC6D0\uB798 \uC591\uACFC \uBE44\uAD50\uD558\uC5EC \uC5B4\uB5BB\uC2B5\uB2C8\uAE4C?", "\uC791\uB2E4", [["\uCEE4\uC9C4\uB2E4", "\uB4F1\uBD84\uACFC \uD569\uCE58\uAE30 \uD63C\uB3D9"], ["\uAC19\uB2E4", "\uB098\uB204\uB294 \uC218 3\uC744 \uBB34\uC2DC"]], "\uC138 \uB4F1\uBD84\uD55C \uD55C \uBD80\uBD84\uC740 \uC804\uCCB4\uBCF4\uB2E4 \uC791\uC2B5\uB2C8\uB2E4."));
a6(1, 3, "division-missing-original", "6\uC21801-15", 3, "\uB4F1\uBD84 \uACB0\uACFC\uC5D0\uC11C \uC18C\uC218 \uC804\uCCB4 \uC591 \uCC3E\uAE30", () => E("5\uBA85\uC5D0\uAC8C \uBB3C 0.35 L\uC529 \uB611\uAC19\uC774 \uC8FC\uC5C8\uC2B5\uB2C8\uB2E4. \uCC98\uC74C \uC804\uCCB4 \uBB3C\uC740 \uBA87 L\uC785\uB2C8\uAE4C?", ["0.35", 5, "*"], "\uD55C \uC0AC\uB78C\uC758 \uC591\uC744 \uB2E4\uC12F \uBC88 \uD569\uD558\uBA74 {answer} L\uC785\uB2C8\uB2E4.", "L"));
a6(1, 3, "rounding-needed-word", "6\uC21801-14", 3, "\uC815\uD655\uD55C \uBAAB\uACFC \uC815\uD55C \uC790\uB9AC\uC758 \uADFC\uC0BF\uAC12 \uAD6C\uBCC4\uD558\uAE30", () => C("10 \xF7 3\uC758 \uBAAB\uC744 \uC18C\uC218 \uB458\uC9F8 \uC790\uB9AC\uAE4C\uC9C0 \uBC18\uC62C\uB9BC\uD55C 3.33\uC740 \uC815\uD655\uD55C \uBAAB\uACFC \uAC19\uC740 \uAC12\uC785\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uADFC\uC0BF\uAC12\uC744 \uC815\uD655\uD55C \uAC12\uC73C\uB85C \uC624\uC778"]], "10/3\uC740 \uC18C\uC218\uAC00 \uACC4\uC18D \uC774\uC5B4\uC9C0\uBBC0\uB85C 3.33\uC740 \uC815\uD55C \uC790\uB9AC\uAE4C\uC9C0\uC758 \uADFC\uC0BF\uAC12\uC785\uB2C8\uB2E4."));
a6(1, 3, "decimal-sharing-plan", "6\uC21801-15", 4, "\uC5EC\uB7EC \uC0AC\uC6A9\uB7C9\uACFC \uBC30\uBD84 \uBAA9\uD45C\uB97C \uD568\uAED8 \uD655\uC778\uD558\uAE30", () => C("\uBB3C 6 L\uC5D0\uC11C 1.2 L\uB97C \uB0A8\uACA8 \uB450\uACE0 4\uBCD1\uC5D0 \uB611\uAC19\uC774 \uB2F4\uC2B5\uB2C8\uB2E4. \uD55C \uBCD1 1.25 L\uB97C \uCC44\uC6B8 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uBD88\uAC00\uB2A5\uD558\uBA70 \uD55C \uBCD1\uC5D0 1.2 L\uC529\uC774\uB2E4", [["\uAC00\uB2A5\uD558\uBA70 1.5 L\uC529\uC774\uB2E4", "\uB0A8\uACA8\uB458 \uC591 \uB204\uB77D"], ["\uAC00\uB2A5\uD558\uBA70 \uC815\uD655\uD788 1.25 L\uC529\uC774\uB2E4", "\uC804\uCCB4 \uC591 \uC81C\uD55C\uC744 \uD655\uC778\uD558\uC9C0 \uC54A\uC74C"]], "\uB098\uB20C \uC591\uC740 4.8 L\uC774\uACE0 \uB124 \uBCD1\uC5D0 1.2 L\uC529 \uB3CC\uC544\uAC11\uB2C8\uB2E4."));
a6(1, 4, "percent-of-two-groups", "6\uC21802-03", 3, "\uB450 \uC9D1\uB2E8\uC758 \uBE44\uC728 \uC591 \uD569\uD558\uAE30", (k) => E(`A\uC9D1\uB2E8 ${20 + 4 * k}\uBA85\uC758 25%\uC640 B\uC9D1\uB2E8 30\uBA85\uC758 50%\uAC00 \uCC38\uC5EC\uD569\uB2C8\uB2E4. \uCC38\uC5EC\uC790\uB294 \uBAA8\uB450 \uBA87 \uBA85\uC785\uB2C8\uAE4C?`, [20 + 4 * k, "0.25", "*", 30, "0.5", "*", "+"], "\uAC01 \uC9D1\uB2E8\uC758 \uCC38\uC5EC \uC591\uC744 \uAD6C\uD574 \uB354\uD558\uBA74 {answer}\uBA85\uC785\uB2C8\uB2E4.", "\uBA85"), 12);
a6(1, 4, "rate-whole-unknown", "6\uC21802-03", 3, "\uBE44\uAD50\uB7C9\uACFC \uBE44\uC728\uC5D0\uC11C \uAE30\uC900\uB7C9 \uCC3E\uAE30", (k) => E(`\uC804\uCCB4 \uD559\uC0DD\uC758 25%\uAC00 ${5 + k}\uBA85\uC785\uB2C8\uB2E4. \uC804\uCCB4\uB294 \uBA87 \uBA85\uC785\uB2C8\uAE4C?`, [5 + k, 4, "*"], "\uC804\uCCB4\uC758 \uB124 \uBD80\uBD84 \uC911 \uD558\uB098\uAC00 \uC8FC\uC5B4\uC9C4 \uC218\uC774\uBBC0\uB85C \uC804\uCCB4\uB294 {answer}\uBA85\uC785\uB2C8\uB2E4.", "\uBA85"), 12);
a6(1, 4, "ratio-meaning", "6\uC21802-02", 1, "\uBE44\uC758 \uC55E\uD56D\uACFC \uB4A4\uD56D \uC5ED\uD560 \uC774\uD574\uD558\uAE30", () => C("\uBE44\uAD50\uB7C9\uC774 3\uC774\uACE0 \uAE30\uC900\uB7C9\uC774 5\uC77C \uB54C \uBE44\uB97C \uACE0\uB974\uC138\uC694.", "3:5", [["5:3", "\uC5ED\uD560 \uC21C\uC11C \uBC18\uB300"], ["3:8", "\uAE30\uC900\uB7C9\uC744 \uD569\uC73C\uB85C \uBC14\uAFC8"]], "\uBE44\uAD50\uB7C9\uC744 \uBA3C\uC800, \uAE30\uC900\uB7C9\uC744 \uB098\uC911\uC5D0 \uC501\uB2C8\uB2E4."));
a6(1, 4, "percent-one-whole", "6\uC21802-03", 2, "100%\uC640 \uC804\uCCB4\uC758 \uAD00\uACC4 \uC774\uD574\uD558\uAE30", () => C("\uC804\uCCB4\uC758 100%\uB97C \uBC14\uB974\uAC8C \uC124\uBA85\uD55C \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uC804\uCCB4\uC640 \uAC19\uC740 \uC591", [["\uC804\uCCB4\uC758 \uC808\uBC18", "50%\uC640 \uD63C\uB3D9"], ["\uC804\uCCB4\uBCF4\uB2E4 \uD56D\uC0C1 100\uAC1C \uB9CE\uC740 \uC591", "\uBE44\uC728\uACFC \uAC1C\uC218 \uD63C\uB3D9"]], "100%\uB294 \uAE30\uC900\uB7C9 \uC804\uCCB4\uC785\uB2C8\uB2E4."));
a6(1, 4, "ratio-equal-values", "6\uC21802-02", 3, "\uC11C\uB85C \uB2E4\uB978 \uC218\uC758 \uBE44\uAC00 \uAC19\uC740 \uBE44\uC728\uC77C \uC218 \uC788\uC74C \uD310\uB2E8\uD558\uAE30", () => C("2:3\uACFC 4:6\uC758 \uBE44\uC728\uC744 \uBE44\uAD50\uD558\uC138\uC694.", "\uAC19\uB2E4", [["\uB4A4\uC758 \uBE44\uC728\uC774 \uB450 \uBC30\uC774\uB2E4", "\uC218\uB7C9 \uBC30\uC218\uC640 \uBE44\uC728\uC744 \uD63C\uB3D9"], ["\uC55E\uC758 \uBE44\uC728\uC774 \uB354 \uD06C\uB2E4", "\uBD84\uBAA8\uB9CC \uBE44\uAD50"]], "\uBE44\uAD50\uB7C9\uACFC \uAE30\uC900\uB7C9\uC744 \uAC19\uC740 \uBC30\uC218\uB85C \uBC14\uAFB8\uBA74 \uBE44\uC728\uC774 \uC720\uC9C0\uB429\uB2C8\uB2E4."));
a6(1, 4, "fraction-percent-conversion", "6\uC21802-03", 2, "\uBD84\uC218 \uBE44\uC728\uACFC \uBC31\uBD84\uC728 \uC5F0\uACB0\uD558\uAE30", () => E("\uBE44\uC728 3/4\uC744 \uBC31\uBD84\uC728\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.", ["3/4", 100, "*"], "\uBE44\uC728\uC5D0 100\uC744 \uACF1\uD558\uBA74 {answer}%\uC785\uB2C8\uB2E4.", "%"));
a6(1, 4, "rate-denominator-error", "6\uC21802-03", 3, "\uAE30\uC900\uB7C9\uACFC \uBE44\uAD50\uB7C9\uC758 \uC21C\uC11C\uB97C \uD655\uC778\uD558\uAE30", () => C("\uC804\uCCB4 40\uBA85 \uC911 10\uBA85\uC774 \uCC38\uC5EC\uD588\uC2B5\uB2C8\uB2E4. \uCC38\uC5EC \uBE44\uC728\uC744 40/10\uC774\uB77C\uACE0 \uC801\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACE0\uB974\uC138\uC694.", "10/40", [["40/10", "\uAE30\uC900\uB7C9\uACFC \uBE44\uAD50\uB7C9 \uC21C\uC11C \uBC18\uB300"], ["10/50", "\uB450 \uC218 \uD569\uC744 \uAE30\uC900\uB7C9\uC73C\uB85C \uC0AC\uC6A9"]], "\uCC38\uC5EC\uB7C9\uC744 \uC804\uCCB4\uB85C \uB098\uB204\uC5B4\uC57C \uD569\uB2C8\uB2E4."));
a6(1, 4, "percent-increase-fixed-base", "6\uC21802-03", 3, "\uAC19\uC740 \uAE30\uC900\uB7C9\uC5D0\uC11C \uB450 \uBE44\uC728 \uCC28\uC758 \uC591 \uAD6C\uD558\uAE30", () => E("\uC804\uCCB4 60\uBA85\uC5D0\uC11C \uCC38\uC5EC \uBE44\uC728\uC774 20%\uC5D0\uC11C 35%\uB85C \uB298\uC5C8\uC2B5\uB2C8\uB2E4. \uCC38\uC5EC \uC778\uC6D0\uC740 \uBA87 \uBA85 \uB298\uC5C8\uC2B5\uB2C8\uAE4C?", [60, "0.35", "*", 60, "0.20", "*", "-"], "\uAC19\uC740 \uC804\uCCB4\uC5D0 \uB300\uD55C \uB450 \uCC38\uC5EC\uB7C9\uC758 \uCC28\uB294 {answer}\uBA85\uC785\uB2C8\uB2E4.", "\uBA85"));
a6(1, 4, "two-actual-counts-rate", "6\uC21802-03", 4, "\uC778\uC6D0\uACFC \uBE44\uC728\uC744 \uD568\uAED8 \uBE44\uAD50\uD558\uAE30", () => C("A\uB294 20\uBA85 \uC911 12\uBA85, B\uB294 40\uBA85 \uC911 20\uBA85\uC774 \uCC38\uC5EC\uD588\uC2B5\uB2C8\uB2E4. \uBE44\uC728\uC774 \uB354 \uD070 \uC9D1\uB2E8\uC744 \uACE0\uB974\uC138\uC694.", "A", [["B", "\uC2E4\uC81C \uC778\uC6D0\uB9CC \uBE44\uAD50"], ["\uAC19\uB2E4", "\uAE30\uC900\uB7C9 \uCC28\uC774 \uBB34\uC2DC"]], "A\uB294 60%, B\uB294 50%\uC785\uB2C8\uB2E4."));
a6(1, 4, "ratio-not-total", "6\uC21802-02", 3, "\uBD80\uBD84\uB07C\uB9AC\uC758 \uBE44\uC640 \uC804\uCCB4 \uAE30\uC900 \uBE44\uC728 \uAD6C\uBCC4\uD558\uAE30", () => C("\uBE68\uAC15 2\uAC1C, \uD30C\uB791 3\uAC1C\uC785\uB2C8\uB2E4. \uC804\uCCB4\uB97C \uAE30\uC900\uC73C\uB85C \uBE68\uAC15 \uBE44\uC728\uC744 \uACE0\uB974\uC138\uC694.", "2/5", [["2/3", "\uD30C\uB791\uB9CC \uAE30\uC900\uB7C9\uC73C\uB85C \uC0AC\uC6A9"], ["3/5", "\uBE44\uAD50\uB7C9\uC744 \uBC14\uAFC8"]], "\uC804\uCCB4\uB294 5\uAC1C\uC774\uBBC0\uB85C 2/5\uC785\uB2C8\uB2E4."));
a6(1, 4, "percent-more-than-one", "6\uC21802-03", 3, "\uBC31\uBD84\uC728\uC774 100%\uB97C \uB118\uB294 \uBE44\uAD50 \uC0C1\uD669 \uC774\uD574\uD558\uAE30", () => C("\uAE30\uC900 \uAE38\uC774 10 cm\uC640 \uBE44\uAD50\uD558\uC5EC 15 cm\uC758 \uBE44\uC728\uC740 100%\uBCF4\uB2E4 \uD07D\uB2C8\uAE4C?", "\uC608", [["\uC544\uB2C8\uC694", "\uBC31\uBD84\uC728\uC740 \uC5B8\uC81C\uB098 100% \uC774\uD558\uB77C\uACE0 \uD310\uB2E8"]], "15/10 = 1.5\uB85C 150%\uC785\uB2C8\uB2E4."));
a6(1, 4, "percent-plan-constraint", "6\uC21802-03", 3, "\uCC38\uC5EC\uC728\xB7\uC804\uCCB4\xB7\uCD5C\uC18C \uC778\uC6D0 \uC870\uAC74 \uD568\uAED8 \uD310\uB2E8\uD558\uAE30", () => C("\uD559\uC0DD 40\uBA85 \uC911 60%\uAC00 \uC2E0\uCCAD\uD588\uC2B5\uB2C8\uB2E4. \uD589\uC0AC\uC5D0 \uCD5C\uC18C 30\uBA85\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. \uD604\uC7AC \uC778\uC6D0\uC744 \uD3EC\uD568\uD558\uC5EC \uBA87 \uBA85\uC774 \uB354 \uC2E0\uCCAD\uD574\uC57C \uD569\uB2C8\uAE4C?", "6\uBA85", [["10\uBA85", "\uC804\uCCB4 40\uC5D0\uC11C \uCD5C\uC18C 30\uB9CC \uBE44\uAD50"], ["16\uBA85", "\uD604\uC7AC \uBBF8\uC2E0\uCCAD\uC790 \uC804\uCCB4\uB97C \uB2F5\uD568"]], "\uD604\uC7AC 24\uBA85\uC774\uBBC0\uB85C \uCD5C\uC18C 30\uBA85\uAE4C\uC9C0 6\uBA85\uC774 \uB354 \uD544\uC694\uD569\uB2C8\uB2E4."));

// learning-review-r1/native/data/final-expansion-grade6b.js
var a7 = (s, u, id, code, l, o, fn, domain = 1) => A(6, s, u, "FINAL-" + id, code, l, o, fn, domain);
a7(1, 5, "band-two-parts-percent", "6\uC21804-02", 3, "\uB450 \uD56D\uBAA9\uC744 \uD569\uCE5C \uBE44\uC728 \uC77D\uAE30", (k) => E(`\uC804\uCCB4\uAC00 ${50 + 10 * k}\uBA85\uC774\uACE0 \uBBF8\uC220 ${10 + 2 * k}\uBA85, \uC6B4\uB3D9 ${15 + 3 * k}\uBA85\uC785\uB2C8\uB2E4. \uB450 \uD56D\uBAA9\uC744 \uD569\uD55C \uBE44\uC728\uC740 \uBA87 %\uC785\uB2C8\uAE4C?`, [10 + 2 * k, 15 + 3 * k, "+", 50 + 10 * k, "/", 100, "*"], "\uB450 \uBD80\uBD84\uC758 \uD569\uC744 \uC804\uCCB4\uB85C \uB098\uB204\uBA74 {answer}%\uC785\uB2C8\uB2E4.", "%", "data-interpretation"), 12);
a7(1, 5, "pie-quantity-from-rate", "6\uC21804-02", 3, "\uC6D0\uADF8\uB798\uD504 \uBE44\uC728\uB85C \uC591 \uAD6C\uD558\uAE30", (k) => E(`\uC6D0\uADF8\uB798\uD504\uC5D0\uC11C \uC74C\uC545\uC740 40%\uC774\uBA70 \uC804\uCCB4\uB294 ${25 + 5 * k}\uBA85\uC785\uB2C8\uB2E4. \uC74C\uC545\uC744 \uACE0\uB978 \uD559\uC0DD\uC740 \uBA87 \uBA85\uC785\uB2C8\uAE4C?`, [25 + 5 * k, "0.4", "*"], "\uC804\uCCB4\uC758 40%\uB97C \uAD6C\uD558\uBA74 {answer}\uBA85\uC785\uB2C8\uB2E4.", "\uBA85", "data-interpretation"), 12);
a7(1, 5, "band-whole-length", "6\uC21804-02", 1, "\uB760\uADF8\uB798\uD504 \uC804\uCCB4\uC758 \uAE30\uC900 \uC774\uD574\uD558\uAE30", () => C("\uB760\uADF8\uB798\uD504\uC758 \uC804\uCCB4 \uB760\uB294 \uC804\uCCB4 \uC790\uB8CC\uC758 \uBA87 %\uB97C \uB098\uD0C0\uB0C5\uB2C8\uAE4C?", "100%", [["50%", "\uBC18\uACFC \uC804\uCCB4 \uD63C\uB3D9"], ["\uD56D\uBAA9 \uC218\uC5D0 \uB530\uB77C \uB2E4\uB974\uB2E4", "\uC804\uCCB4 \uAE30\uC900 \uB204\uB77D"]], "\uC804\uCCB4 \uB760\uAC00 \uC804\uCCB4 100%\uC785\uB2C8\uB2E4."));
a7(1, 5, "category-percent-compare", "6\uC21804-02", 2, "\uBE44\uC728 \uD45C\uC2DC\uB85C \uD56D\uBAA9 \uBE44\uAD50\uD558\uAE30", () => C("\uC6D0\uADF8\uB798\uD504\uC5D0\uC11C A\uAC00 35%, B\uAC00 25%, C\uAC00 40%\uC785\uB2C8\uB2E4. \uAC00\uC7A5 \uD070 \uBE44\uC728\uC758 \uD56D\uBAA9\uC744 \uACE0\uB974\uC138\uC694.", "C", [["A", "\uBAA8\uB4E0 \uD56D\uBAA9\uC744 \uBE44\uAD50\uD558\uC9C0 \uC54A\uC74C"], ["B", "\uBE44\uC728 \uD06C\uAE30 \uC21C\uC11C \uC624\uB958"]], "\uC138 \uBE44\uC728\uC744 \uBE44\uAD50\uD558\uBA74 40%\uAC00 \uAC00\uC7A5 \uD07D\uB2C8\uB2E4."));
a7(1, 5, "pie-complete-count", "6\uC21804-03", 3, "\uAC19\uC740 \uC0AC\uB78C\uC758 \uC911\uBCF5 \uC120\uD0DD\uACFC \uC6D0\uADF8\uB798\uD504 \uAE30\uC900 \uAD6C\uBCC4\uD558\uAE30", () => C("\uD55C \uC0AC\uB78C\uC774 \uB450 \uC885\uB958\uB97C \uC120\uD0DD\uD55C \uC870\uC0AC\uC5D0\uC11C \uC751\uB2F5 \uC218 \uC804\uCCB4\uB97C \uAE30\uC900\uC73C\uB85C \uC6D0\uADF8\uB798\uD504\uB97C \uADF8\uB838\uC2B5\uB2C8\uB2E4. \uC774\uB294 \uD559\uC0DD \uC218 \uC804\uCCB4 \uAE30\uC900 \uADF8\uB798\uD504\uC640 \uBC18\uB4DC\uC2DC \uAC19\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uC751\uB2F5 \uC218\uC640 \uC0AC\uB78C \uC218 \uAE30\uC900\uC744 \uD63C\uB3D9"]], "\uC751\uB2F5 \uC218 \uAE30\uC900\uACFC \uD559\uC0DD \uC218 \uAE30\uC900\uC744 \uAD6C\uBCC4\uD574\uC57C \uD569\uB2C8\uB2E4."));
a7(1, 5, "percent-not-size", "6\uC21804-03", 3, "\uB450 \uADF8\uB798\uD504\uC758 \uBE44\uC728\uACFC \uC2E4\uC81C \uC804\uCCB4 \uD06C\uAE30 \uBE44\uAD50\uD558\uAE30", () => C("\uB450 \uD559\uAE09\uC758 \uC6D0\uADF8\uB798\uD504\uC5D0\uC11C \uAC19\uC740 \uD56D\uBAA9\uC774 \uBAA8\uB450 30%\uC785\uB2C8\uB2E4. \uC804\uCCB4 \uC778\uC6D0\uC744 \uBAA8\uB974\uBA74 \uADF8 \uD56D\uBAA9 \uC778\uC6D0\uC774 \uAC19\uB2E4\uACE0 \uD655\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uAC19\uC740 \uBE44\uC728\uC744 \uAC19\uC740 \uC591\uC73C\uB85C \uD310\uB2E8"]], "\uC804\uCCB4 \uD06C\uAE30\uAC00 \uB2E4\uB974\uBA74 \uAC19\uC740 \uBE44\uC728\uC758 \uC778\uC6D0\uB3C4 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."));
a7(1, 5, "find-remainder-two", "6\uC21804-02", 3, "\uD56D\uBAA9 \uD569\uACFC \uC804\uCCB4 100% \uC5F0\uACB0\uD558\uAE30", () => E("\uB760\uADF8\uB798\uD504\uC5D0\uC11C A\uB294 28%, B\uB294 37%\uC774\uACE0 \uB098\uBA38\uC9C0\uAC00 C\uC785\uB2C8\uB2E4. C\uC758 \uBE44\uC728\uC740 \uBA87 %\uC785\uB2C8\uAE4C?", [100, 28, "-", 37, "-"], "\uC804\uCCB4\uC5D0\uC11C \uB450 \uBE44\uC728\uC744 \uBE7C\uBA74 {answer}%\uC785\uB2C8\uB2E4.", "%", "data-interpretation"));
a7(1, 5, "graph-invalid-total", "6\uC21804-03", 3, "\uBE44\uC728 \uD569\uC73C\uB85C \uADF8\uB798\uD504 \uC624\uB958 \uD655\uC778\uD558\uAE30", () => C("\uD559\uC0DD\uB9C8\uB2E4 \uD55C \uAC00\uC9C0\uB97C \uACE0\uB978 \uC6D0\uADF8\uB798\uD504\uC758 \uBE44\uC728\uC774 45%, 35%, 30%\uC785\uB2C8\uB2E4. \uC62C\uBC14\uB978 \uC804\uCCB4 \uADF8\uB798\uD504\uC785\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uC804\uCCB4 \uD569 100% \uC870\uAC74 \uB204\uB77D"]], "\uD569\uC774 110%\uC774\uBBC0\uB85C \uC11C\uB85C \uACB9\uCE58\uC9C0 \uC54A\uB294 \uC804\uCCB4\uC758 \uBD80\uBD84\uC73C\uB85C \uB9DE\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."));
a7(1, 5, "two-parts-same-rate", "6\uC21804-02", 3, "\uD569\uACFC \uAC19\uC740 \uB450 \uBE44\uC728 \uC870\uAC74\uC73C\uB85C \uD56D\uBAA9 \uCC3E\uAE30", () => E("\uC6D0\uADF8\uB798\uD504\uC5D0\uC11C C\uB294 40%\uC774\uACE0 A\uC640 B\uB294 \uAC19\uC740 \uBE44\uC728\uC785\uB2C8\uB2E4. A\uB294 \uBA87 %\uC785\uB2C8\uAE4C?", [100, 40, "-", 2, "/"], "\uB0A8\uC740 \uBE44\uC728\uC744 \uAC19\uC740 \uB450 \uBD80\uBD84\uC73C\uB85C \uB098\uB204\uBA74 {answer}%\uC785\uB2C8\uB2E4.", "%", "data-interpretation"));
a7(1, 5, "survey-title-basis", "6\uC21804-03", 2, "\uADF8\uB798\uD504\uC758 \uC804\uCCB4 \uAE30\uC900\uC744 \uC81C\uBAA9\uACFC \uC5F0\uACB0\uD558\uAE30", () => C("\uB3C4\uC11C\uAD00 \uC774\uC6A9\uC790\uC758 \uD76C\uB9DD \uD504\uB85C\uADF8\uB7A8\uC744 \uC870\uC0AC\uD588\uC2B5\uB2C8\uB2E4. \uADF8\uB798\uD504\uC5D0 \uC804\uCCB4 \uAE30\uC900\uC744 \uBC1D\uD788\uB294 \uC815\uBCF4\uB85C \uC54C\uB9DE\uC740 \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uB204\uAD6C\uB97C \uB300\uC0C1\uC73C\uB85C \uC870\uC0AC\uD588\uB294\uC9C0\uC640 \uC804\uCCB4 \uC751\uB2F5 \uC218", [["\uADF8\uB798\uD504 \uC0C9\uC758 \uC774\uB984\uB9CC", "\uC804\uCCB4 \uAE30\uC900\uC744 \uBC1D\uD788\uC9C0 \uC54A\uC74C"], ["\uAC00\uC7A5 \uD070 \uD56D\uBAA9 \uC774\uB984\uB9CC", "\uC804\uCCB4 \uC815\uBCF4 \uB204\uB77D"]], "\uBE44\uC728\uC758 \uAE30\uC900\uC778 \uC804\uCCB4 \uC790\uB8CC\uAC00 \uBB34\uC5C7\uC778\uC9C0 \uBC1D\uD600\uC57C \uD569\uB2C8\uB2E4."));
a7(1, 5, "band-pie-same-data", "6\uC21804-02", 3, "\uAC19\uC740 \uC790\uB8CC\uC758 \uC11C\uB85C \uB2E4\uB978 \uBE44\uC728 \uADF8\uB798\uD504 \uC5F0\uACB0\uD558\uAE30", () => C("\uAC19\uC740 \uC790\uB8CC\uB97C \uB760\uADF8\uB798\uD504\uC640 \uC6D0\uADF8\uB798\uD504\uB85C \uB098\uD0C0\uB0C8\uC2B5\uB2C8\uB2E4. \uAC01 \uD56D\uBAA9\uC758 \uBE44\uC728\uC740 \uC5B4\uB5BB\uAC8C \uB429\uB2C8\uAE4C?", "\uAC19\uB2E4", [["\uC6D0\uADF8\uB798\uD504\uC5D0\uC11C \uB354 \uCEE4\uC9C4\uB2E4", "\uADF8\uB9BC \uBAA8\uC591\uACFC \uC790\uB8CC \uBE44\uC728\uC744 \uD63C\uB3D9"], ["\uB760\uADF8\uB798\uD504\uC5D0\uC11C \uB354 \uCEE4\uC9C4\uB2E4", "\uADF8\uB9BC \uBAA8\uC591\uACFC \uC790\uB8CC \uBE44\uC728\uC744 \uD63C\uB3D9"]], "\uC790\uB8CC\uAC00 \uAC19\uC73C\uBA74 \uD45C\uD604 \uBAA8\uC591\uC774 \uB2EC\uB77C\uB3C4 \uBE44\uC728\uC740 \uAC19\uC2B5\uB2C8\uB2E4."));
a7(1, 5, "two-graphs-joint-plan", "6\uC21804-03", 4, "\uB2E4\uB978 \uC804\uCCB4\uC640 \uD56D\uBAA9 \uBE44\uC728\uC744 \uD569\uCCD0 \uACC4\uD68D \uD310\uB2E8\uD558\uAE30", () => C("A\uBC18 30\uBA85 \uC911 40%, B\uBC18 20\uBA85 \uC911 60%\uAC00 \uCCB4\uD5D8\uC5D0 \uC2E0\uCCAD\uD588\uC2B5\uB2C8\uB2E4. \uB450 \uBC18\uC744 \uD569\uCCD0 \uC2E0\uCCAD\uC790 25\uBA85\uBD84\uC744 \uC900\uBE44\uD558\uBA74 \uCDA9\uBD84\uD569\uB2C8\uAE4C?", "\uCDA9\uBD84\uD558\uBA70 1\uBA85\uBD84 \uB0A8\uB294\uB2E4", [["\uBD80\uC871\uD558\uBA70 5\uBA85\uBD84\uC774 \uBAA8\uC790\uB780\uB2E4", "\uC804\uCCB4 \uC778\uC6D0\uB9CC \uBE44\uAD50"], ["\uCDA9\uBD84\uD558\uBA70 5\uBA85\uBD84 \uB0A8\uB294\uB2E4", "\uAC19\uC740 \uBE44\uC728\uC744 \uC784\uC758\uB85C \uC801\uC6A9"]], "\uAC01 \uBC18\uC5D0\uC11C 12\uBA85\uC529 \uC2E0\uCCAD\uD558\uC5EC \uBAA8\uB450 24\uBA85\uC785\uB2C8\uB2E4."));
a7(1, 6, "open-box-surface", "6\uC21803-17", 4, "\uD55C \uBA74\uC774 \uC5C6\uB294 \uC9C1\uC721\uBA74\uCCB4\uC758 \uBA74 \uB113\uC774 \uD569\uD558\uAE30", (k) => E(`\uAC00\uB85C ${3 + k} cm, \uC138\uB85C 4 cm, \uB192\uC774 2 cm\uC778 \uC0C1\uC790\uC758 \uC717\uBA74\uC740 \uC5C6\uC2B5\uB2C8\uB2E4. \uBC14\uB2E5\uACFC \uC606\uBA74\uC758 \uB113\uC774 \uD569\uC740 \uBA87 cm\xB2\uC785\uB2C8\uAE4C?`, [3 + k, 4, "*", 3 + k, 2, "*", 2, "*", "+", 4, 2, "*", 2, "*", "+"], "\uBC14\uB2E5 \uD55C \uBA74\uACFC \uC606\uBA74 \uB124 \uBA74\uB9CC \uB354\uD558\uBA74 {answer} cm\xB2\uC785\uB2C8\uB2E4.", "cm\xB2"), 12);
a7(1, 6, "volume-layer-count", "6\uC21803-19", 3, "\uD55C \uCE35\uC758 \uB2E8\uC704 \uC815\uC721\uBA74\uCCB4 \uC218\uC640 \uCE35 \uC218 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uD55C \uCE35\uC5D0 \uB2E8\uC704 \uC815\uC721\uBA74\uCCB4 12\uAC1C\uAC00 \uC788\uACE0 \uAC19\uC740 \uCE35\uC744 ${3 + k}\uCE35 \uC313\uC558\uC2B5\uB2C8\uB2E4. 1\uAC1C\uAC00 1 cm\xB3\uC774\uBA74 \uC804\uCCB4 \uBD80\uD53C\uB294 \uBA87 cm\xB3\uC785\uB2C8\uAE4C?`, [12, 3 + k, "*"], "\uD55C \uCE35\uC758 \uBD80\uD53C\uC5D0 \uCE35 \uC218\uB97C \uACF1\uD558\uBA74 {answer} cm\xB3\uC785\uB2C8\uB2E4.", "cm\xB3"), 12);
a7(1, 6, "volume-unit-cube", "6\uC21803-18", 1, "\uBD80\uD53C \uB2E8\uC704\uC758 \uB2E8\uC704 \uC815\uC721\uBA74\uCCB4 \uC774\uD574\uD558\uAE30", () => C("1 cm\xB3\uB97C \uBC14\uB974\uAC8C \uC124\uBA85\uD55C \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uD55C \uBAA8\uC11C\uB9AC 1 cm\uC778 \uC815\uC721\uBA74\uCCB4\uC758 \uBD80\uD53C", [["\uD55C \uBCC0 1 cm\uC778 \uC815\uC0AC\uAC01\uD615\uC758 \uB113\uC774", "\uB113\uC774\uC640 \uBD80\uD53C \uD63C\uB3D9"], ["1 cm \uC120\uBD84\uC758 \uAE38\uC774", "\uAE38\uC774\uC640 \uBD80\uD53C \uD63C\uB3D9"]], "\uBD80\uD53C\uB294 \uB2E8\uC704 \uC815\uC721\uBA74\uCCB4\uAC00 \uCC28\uC9C0\uD558\uB294 \uACF5\uAC04\uC758 \uD06C\uAE30\uB85C \uB098\uD0C0\uB0C5\uB2C8\uB2E4."));
a7(1, 6, "cube-volume", "6\uC21803-19", 2, "\uC815\uC721\uBA74\uCCB4 \uBD80\uD53C\uC758 \uC138 \uBC29\uD5A5 \uACF1 \uC774\uD574\uD558\uAE30", () => E("\uD55C \uBAA8\uC11C\uB9AC 4 cm\uC778 \uC815\uC721\uBA74\uCCB4\uC758 \uBD80\uD53C\uB294 \uBA87 cm\xB3\uC785\uB2C8\uAE4C?", [4, 4, "*", 4, "*"], "\uC138 \uAE38\uC774\uB97C \uACF1\uD558\uBA74 {answer} cm\xB3\uC785\uB2C8\uB2E4.", "cm\xB3"));
a7(1, 6, "same-volume-different-dims", "6\uC21803-19", 3, "\uB2E4\uB978 \uAE38\uC774 \uC870\uD569\uC758 \uAC19\uC740 \uBD80\uD53C \uBE44\uAD50\uD558\uAE30", () => C("\uC9C1\uC721\uBA74\uCCB4 A\uB294 3 \xD7 4 \xD7 6 cm, B\uB294 2 \xD7 6 \xD7 6 cm\uC785\uB2C8\uB2E4. \uBD80\uD53C\uB97C \uBE44\uAD50\uD558\uC138\uC694.", "\uAC19\uB2E4", [["A\uAC00 \uB354 \uD06C\uB2E4", "\uC77C\uBD80 \uAE38\uC774\uB9CC \uBE44\uAD50"], ["B\uAC00 \uB354 \uD06C\uB2E4", "\uC77C\uBD80 \uAE38\uC774\uB9CC \uBE44\uAD50"]], "\uC138 \uAE38\uC774\uC758 \uACF1\uC740 \uB458 \uB2E4 72 cm\xB3\uC785\uB2C8\uB2E4."));
a7(1, 6, "surface-not-three-faces", "6\uC21803-17", 3, "\uBCF4\uC774\uB294 \uBA74\uACFC \uC804\uCCB4 \uAC89\uB113\uC774 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC9C1\uC721\uBA74\uCCB4 \uADF8\uB9BC\uC5D0 \uC138 \uBA74\uB9CC \uBCF4\uC785\uB2C8\uB2E4. \uAC89\uB113\uC774\uB294 \uBCF4\uC774\uB294 \uC138 \uBA74\uB9CC \uB354\uD558\uBA74 \uB429\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uB4A4\uCABD\uC758 \uB9C8\uC8FC \uBCF4\uB294 \uBA74 \uB204\uB77D"]], "\uAC89\uB113\uC774\uB294 \uBCF4\uC774\uC9C0 \uC54A\uB294 \uBA74\uAE4C\uC9C0 \uC5EC\uC12F \uBA74\uC744 \uBAA8\uB450 \uB354\uD569\uB2C8\uB2E4."));
a7(1, 6, "volume-conversion-direction", "6\uC21803-18", 3, "\uBD80\uD53C \uB2E8\uC704 \uBCC0\uD658 \uBC29\uD5A5 \uC774\uD574\uD558\uAE30", () => E("2000000 cm\xB3\uB294 \uBA87 m\xB3\uC785\uB2C8\uAE4C?", [2e6, 1e6, "/"], "1 m\xB3\uC5D0 \uD574\uB2F9\uD558\uB294 \uB2E8\uC704 \uBD80\uD53C \uC218\uB85C \uB098\uB204\uBA74 {answer} m\xB3\uC785\uB2C8\uB2E4.", "m\xB3"));
a7(1, 6, "surface-versus-volume-scaling", "6\uC21803-19", 4, "\uD55C \uAE38\uC774 \uBCC0\uD654\uAC00 \uBD80\uD53C\uC5D0 \uBBF8\uCE58\uB294 \uC601\uD5A5 \uD310\uB2E8\uD558\uAE30", () => C("\uC9C1\uC721\uBA74\uCCB4\uC758 \uAC00\uB85C\uB9CC 2\uBC30\uB85C \uD558\uACE0 \uB098\uBA38\uC9C0 \uB450 \uAE38\uC774\uB294 \uC720\uC9C0\uD588\uC2B5\uB2C8\uB2E4. \uBD80\uD53C\uB294 \uBA87 \uBC30\uC785\uB2C8\uAE4C?", "2\uBC30", [["4\uBC30", "\uB113\uC774\uC758 \uB450 \uBC29\uD5A5 \uBC30\uC728\uB85C \uC624\uC778"], ["8\uBC30", "\uC138 \uAE38\uC774\uB97C \uBAA8\uB450 \uB450 \uBC30\uB85C \uBC14\uAFE8\uB2E4\uACE0 \uD310\uB2E8"]], "\uACF1\uD558\uB294 \uC138 \uAE38\uC774 \uC911 \uD55C \uAE38\uC774\uB9CC \uB450 \uBC30\uC785\uB2C8\uB2E4."));
a7(1, 6, "height-from-layer-area", "6\uC21803-19", 3, "\uBC11\uBA74 \uB113\uC774\uC640 \uBD80\uD53C\uC5D0\uC11C \uB192\uC774 \uCD94\uB860\uD558\uAE30", () => E("\uBC11\uBA74 \uB113\uC774\uAC00 15 cm\xB2\uC774\uACE0 \uBD80\uD53C\uAC00 90 cm\xB3\uC778 \uC9C1\uC721\uBA74\uCCB4\uC758 \uB192\uC774\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?", [90, 15, "/"], "\uBD80\uD53C\uB97C \uBC11\uBA74 \uB113\uC774\uB85C \uB098\uB204\uBA74 {answer} cm\uC785\uB2C8\uB2E4.", "cm"));
a7(1, 6, "cube-surface-one-face", "6\uC21803-17", 3, "\uD55C \uBA74 \uB113\uC774\uB85C \uC815\uC721\uBA74\uCCB4 \uAC89\uB113\uC774 \uAD6C\uD558\uAE30", () => E("\uC815\uC721\uBA74\uCCB4\uC758 \uD55C \uBA74 \uB113\uC774\uB294 9 cm\xB2\uC785\uB2C8\uB2E4. \uAC89\uB113\uC774\uB294 \uBA87 cm\xB2\uC785\uB2C8\uAE4C?", [9, 6, "*"], "\uAC19\uC740 \uBA74 \uC5EC\uC12F \uAC1C\uB97C \uB354\uD558\uBA74 {answer} cm\xB2\uC785\uB2C8\uB2E4.", "cm\xB2"));
a7(1, 6, "volume-empty-space", "6\uC21803-19", 3, "\uC804\uCCB4 \uC9C1\uC721\uBA74\uCCB4\uC640 \uBE48 \uBD80\uBD84\uC758 \uBD80\uD53C \uC5F0\uACB0\uD558\uAE30", () => E("\uD070 \uC9C1\uC721\uBA74\uCCB4\uB294 5 \xD7 4 \xD7 3 cm\uC774\uACE0 \uADF8 \uC548\uC5D0 \uBE44\uC5B4 \uC788\uB294 \uC9C1\uC721\uBA74\uCCB4 \uACF5\uAC04\uC740 2 \xD7 2 \xD7 3 cm\uC785\uB2C8\uB2E4. \uBE48 \uBD80\uBD84\uC744 \uC81C\uC678\uD55C \uBD80\uD53C\uB294 \uBA87 cm\xB3\uC785\uB2C8\uAE4C?", [5, 4, "*", 3, "*", 2, 2, "*", 3, "*", "-"], "\uC804\uCCB4\uC5D0\uC11C \uBE44\uC5B4 \uC788\uB294 \uACF5\uAC04\uC744 \uBE7C\uBA74 {answer} cm\xB3\uC785\uB2C8\uB2E4.", "cm\xB3"));
a7(1, 6, "volume-plan-constraint", "6\uC21803-19", 5, "\uBD80\uD53C\xB7\uAE38\uC774\xB7\uB192\uC774 \uC81C\uD55C\uC73C\uB85C \uC124\uACC4 \uC120\uD0DD\uD558\uAE30", () => C("\uAC00\uB85C 6 cm, \uC138\uB85C 4 cm\uC778 \uC9C1\uC721\uBA74\uCCB4\uC758 \uB192\uC774\uB294 \uC790\uC5F0\uC218\uC774\uBA70 5 cm \uC774\uD558\uC785\uB2C8\uB2E4. \uBD80\uD53C\uB97C \uCD5C\uC18C 100 cm\xB3\uB85C \uD558\uB824\uBA74 \uAC00\uC7A5 \uC791\uC740 \uB192\uC774\uB97C \uACE0\uB974\uC138\uC694.", "5 cm", [["4 cm", "\uBD80\uD53C 96\uC73C\uB85C \uBAA9\uD45C \uBBF8\uB2EC"], ["6 cm", "\uB192\uC774 \uC0C1\uD55C \uC704\uBC18"]], "\uD55C \uCE35 24 cm\xB3\uC774\uBBC0\uB85C \uB124 \uCE35\uC740 \uBD80\uC871\uD558\uACE0 \uB2E4\uC12F \uCE35\uC740 120 cm\xB3\uC785\uB2C8\uB2E4."));
a7(2, 1, "fraction-piece-with-rest", "6\uC21801-11", 3, "\uC0AC\uC6A9\uD55C \uBD84\uC218 \uC591\uC744 \uBE7C\uACE0 \uAC19\uC740 \uC870\uAC01\uC73C\uB85C \uB098\uB204\uAE30", (k) => E(`\uB9AC\uBCF8 ${f(5 + k, 4)} m\uC5D0\uC11C 1/4 m\uB97C \uC37C\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uAE38\uC774\uB294 1/2 m\uC758 \uBA87 \uBC30\uC778\uC9C0 \uC218\uB85C \uAD6C\uD558\uC138\uC694.`, [f(5 + k, 4), "1/4", "-", "1/2", "/"], "\uB0A8\uC740 \uC591\uC744 \uD55C \uC870\uAC01\uC758 \uC591\uC73C\uB85C \uB098\uB204\uBA74 {answer}\uC785\uB2C8\uB2E4."), 12);
a7(2, 1, "fraction-dividend-mixed", "6\uC21801-11", 3, "\uB300\uBD84\uC218\uC640 \uBD84\uC218\uC758 \uB098\uB217\uC148 \uACC4\uC0B0\uD558\uAE30", (k) => E(`\uAE38\uC774 ${f(9 + 2 * k, 4)} m\uC778 \uB048\uC740 \uAE38\uC774 3/4 m\uC778 \uB048\uC758 \uBA87 \uBC30\uC785\uB2C8\uAE4C?`, [f(9 + 2 * k, 4), "3/4", "/"], "\uBE44\uAD50\uD560 \uC804\uCCB4 \uAE38\uC774\uB97C \uAE30\uC900 \uAE38\uC774\uB85C \uB098\uB204\uBA74 {answer}\uBC30\uC785\uB2C8\uB2E4.", "", "word-problem"), 12);
a7(2, 1, "divide-one-half-meaning", "6\uC21801-11", 1, "\uBC18 \uC870\uAC01\uC758 \uAC1C\uC218\uB85C \uB098\uB217\uC148 \uC758\uBBF8 \uC774\uD574\uD558\uAE30", () => C("1 \uC548\uC5D0 1/2\uC774 \uBA87 \uBC88 \uB4E4\uC5B4\uAC11\uB2C8\uAE4C?", "2", [["1/2", "\uB098\uB204\uB294 \uC591\uC744 \uBAAB\uC73C\uB85C \uB2F5\uD568"], ["1", "\uC804\uCCB4 \uC218\uB9CC \uB2F5\uD568"]], "\uBC18\uC529 \uB098\uB204\uBA74 \uB450 \uC870\uAC01\uC785\uB2C8\uB2E4."));
a7(2, 1, "fraction-division-same", "6\uC21801-11", 2, "\uAC19\uC740 \uBD84\uC218\uB07C\uB9AC \uB098\uB208 \uBAAB \uC774\uD574\uD558\uAE30", () => E("5/7 \xF7 5/7\uC744 \uACC4\uC0B0\uD558\uC138\uC694.", ["5/7", "5/7", "/"], "\uAC19\uC740 \uC591\uC774 \uD55C \uBC88 \uB4E4\uC5B4\uAC00\uBBC0\uB85C {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a7(2, 1, "division-order-not-same", "6\uC21801-11", 3, "\uBD84\uC218 \uB098\uB217\uC148 \uC21C\uC11C\uC758 \uC601\uD5A5 \uD655\uC778\uD558\uAE30", () => C("1/2 \xF7 1/4\uC640 1/4 \xF7 1/2\uC758 \uBAAB\uC744 \uBE44\uAD50\uD558\uC138\uC694.", "\uCCAB \uBAAB 2, \uB458\uC9F8 \uBAAB 1/2", [["\uB450 \uBAAB \uBAA8\uB450 2", "\uC21C\uC11C\uB97C \uBC14\uAFB8\uC5B4\uB3C4 \uAC19\uB2E4\uACE0 \uD310\uB2E8"], ["\uB450 \uBAAB \uBAA8\uB450 1/2", "\uB458\uC9F8 \uC2DD\uB9CC \uACC4\uC0B0"]], "\uB098\uB204\uC5B4\uC9C0\uB294 \uC591\uACFC \uB098\uB204\uB294 \uC591\uC758 \uC21C\uC11C\uAC00 \uB2E4\uB985\uB2C8\uB2E4."));
a7(2, 1, "divisor-over-one", "6\uC21801-11", 3, "1\uBCF4\uB2E4 \uD070 \uBD84\uC218\uB85C \uB098\uB204\uB294 \uBAAB\uC758 \uD06C\uAE30 \uD310\uB2E8\uD558\uAE30", () => C("\uC591\uC218\uC5D0 3/2\uB97C \uB098\uB204\uBA74 \uC6D0\uB798 \uAC12\uBCF4\uB2E4 \uC5B4\uB5BB\uC2B5\uB2C8\uAE4C?", "\uC791\uC544\uC9C4\uB2E4", [["\uCEE4\uC9C4\uB2E4", "\uBD84\uC218\uB85C \uB098\uB204\uBA74 \uD56D\uC0C1 \uCEE4\uC9C4\uB2E4\uACE0 \uD310\uB2E8"], ["\uAC19\uB2E4", "\uB098\uB204\uB294 \uC218 \uD06C\uAE30 \uBB34\uC2DC"]], "1\uBCF4\uB2E4 \uD070 \uC591\uC73C\uB85C \uB098\uB204\uBBC0\uB85C \uBAAB\uC740 \uC791\uC544\uC9D1\uB2C8\uB2E4."));
a7(2, 1, "inverse-verification-fraction", "6\uC21801-11", 3, "\uBD84\uC218 \uB098\uB217\uC148\uC758 \uACF1\uC148 \uD655\uC778\uC2DD \uCC3E\uAE30", () => C("3/4 \xF7 1/2 = 3/2\uC758 \uBC14\uB978 \uD655\uC778 \uC2DD\uC744 \uACE0\uB974\uC138\uC694.", "3/2 \xD7 1/2 = 3/4", [["3/2 \xF7 1/2 = 3/4", "\uD655\uC778\uC5D0\uC11C \uB2E4\uC2DC \uB098\uB214"], ["3/2 + 1/2 = 3/4", "\uACF1\uC148\uC744 \uB367\uC148\uC73C\uB85C \uBC14\uAFC8"]], "\uBAAB\uC5D0 \uB098\uB204\uB294 \uC218\uB97C \uACF1\uD558\uBA74 \uCC98\uC74C \uC591\uC785\uB2C8\uB2E4."));
a7(2, 1, "fraction-divisor-inverse-two", "6\uC21801-11", 3, "\uB098\uB204\uB294 \uC218\uC640 \uACB0\uACFC\uC758 \uAD00\uACC4 \uBCF5\uC6D0\uD558\uAE30", () => E("3/5 \xF7 \u25A1 = 2\uC785\uB2C8\uB2E4. \u25A1\uB97C \uAD6C\uD558\uC138\uC694.", ["3/5", 2, "/"], "\uB098\uB204\uC5B4\uC9C0\uB294 \uC591\uC744 \uBAAB\uC73C\uB85C \uB098\uB204\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a7(2, 1, "fraction-share-double-check", "6\uC21801-11", 3, "\uC870\uAC01 \uAE38\uC774\uC640 \uC804\uCCB4 \uAE38\uC774\uB85C \uBAAB\uC758 \uD0C0\uB2F9\uC131 \uD655\uC778\uD558\uAE30", () => C("\uB9AC\uBCF8 2/3 m\uB97C 1/6 m\uC529 \uC790\uB974\uBA74 3\uC870\uAC01\uC774\uB77C\uACE0 \uD569\uB2C8\uB2E4. \uBC14\uB978 \uD310\uB2E8\uC744 \uACE0\uB974\uC138\uC694.", "4\uC870\uAC01\uC774\uBBC0\uB85C \uD2C0\uB9AC\uB2E4", [["3\uC870\uAC01\uC774\uBBC0\uB85C \uB9DE\uB2E4", "\uBD84\uBAA8\uC758 \uBC30\uC728\uB9CC \uBCF4\uACE0 \uBD84\uC790 \uB204\uB77D"], ["2\uC870\uAC01\uC774\uBBC0\uB85C \uD2C0\uB9AC\uB2E4", "\uC804\uCCB4 \uBD84\uC790\uB9CC \uB2F5\uD568"]], "2/3 m\uB294 4/6 m\uC5EC\uC11C 1/6 m\uAC00 \uB124 \uBC88 \uB4E4\uC5B4\uAC11\uB2C8\uB2E4."));
a7(2, 1, "fraction-decimal-bridge", "6\uC21801-11", 3, "\uB098\uB217\uC148 \uBAAB\uC758 \uBD84\uC218\uC640 \uC18C\uC218 \uAC12 \uC5F0\uACB0\uD558\uAE30", () => C("3/4 \xF7 1/2\uC758 \uBAAB\uACFC \uAC19\uC740 \uC18C\uC218\uB97C \uACE0\uB974\uC138\uC694.", "1.5", [["0.375", "\uB098\uB217\uC148\uC744 \uACF1\uC148\uC73C\uB85C \uBC14\uAFC8"], ["0.5", "\uB098\uB204\uB294 \uC218\uB9CC \uB2F5\uD568"]], "\uBAAB 3/2\uB294 1.5\uC785\uB2C8\uB2E4."));
a7(2, 1, "zero-dividend-fraction", "6\uC21801-11", 2, "0\uC778 \uC591\uC744 \uC591\uC758 \uBD84\uC218\uB85C \uB098\uB204\uAE30", () => C("0 \xF7 2/5\uC640 2/5 \xF7 0\uC744 \uBE44\uAD50\uD55C \uC124\uBA85\uC744 \uACE0\uB974\uC138\uC694.", "\uCCAB \uC2DD\uC758 \uAC12\uC740 0\uC774\uACE0 \uB458\uC9F8 \uC2DD\uC740 \uACC4\uC0B0\uD560 \uC218 \uC5C6\uB2E4", [["\uB450 \uC2DD\uC758 \uAC12\uC774 \uBAA8\uB450 0\uC774\uB2E4", "0\uC73C\uB85C \uB098\uB20C \uC218 \uC788\uB2E4\uACE0 \uC624\uC778"], ["\uB450 \uC2DD\uC744 \uBAA8\uB450 \uACC4\uC0B0\uD560 \uC218 \uC5C6\uB2E4", "\uB098\uB204\uC5B4\uC9C0\uB294 \uC218\uAC00 0\uC778 \uACBD\uC6B0\uC640 \uD63C\uB3D9"]], "\uB098\uB204\uC5B4\uC9C0\uB294 \uC591\uC774 0\uC774\uBA74 \uBAAB\uC740 0\uC774\uC9C0\uB9CC \uB098\uB204\uB294 \uC218\uB294 0\uC774 \uB420 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."));
a7(2, 1, "fraction-cut-plan", "6\uC21801-11", 5, "\uC0AC\uC6A9\uB7C9\xB7\uC870\uAC01 \uAE38\uC774\xB7\uAC00\uB2A5\uD55C \uC644\uC131 \uC870\uAC01 \uC218 \uD310\uB2E8\uD558\uAE30", () => C("\uB9AC\uBCF8 2 m\uC5D0\uC11C 1/2 m\uB97C \uB0A8\uACA8 \uB450\uACE0 2/5 m\uC529 \uC644\uC131 \uC870\uAC01\uC73C\uB85C \uC790\uB985\uB2C8\uB2E4. \uC644\uC131 \uC870\uAC01 \uCD5C\uB300 \uC218\uC640 \uC790\uB974\uB294 \uBD80\uBD84\uC5D0\uC11C \uB0A8\uB294 \uAE38\uC774\uB97C \uACE0\uB974\uC138\uC694. \uB530\uB85C \uB454 1/2 m\uB294 \uB0A8\uB294 \uAE38\uC774\uC5D0 \uB354\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", "3\uC870\uAC01, 3/10 m", [["4\uC870\uAC01, 1/10 m", "\uC0AC\uC6A9 \uAC00\uB2A5 \uAE38\uC774\uB97C \uCD08\uACFC"], ["3\uC870\uAC01, 1/5 m", "\uB0A8\uB294 \uC591 \uACC4\uC0B0 \uC624\uB958"]], "\uC790\uB97C \uC591\uC740 3/2 m\uC785\uB2C8\uB2E4. \uC138 \uC870\uAC01\uC740 6/5 m\uC774\uACE0 \uB0A8\uB294 \uC591\uC740 3/10 m\uC785\uB2C8\uB2E4."));
a7(2, 2, "decimal-price-per-unit", "6\uC21801-15", 3, "\uC804\uCCB4 \uAC00\uACA9\uACFC \uC18C\uC218 \uAE38\uC774\uB85C \uB2E8\uAC00 \uAD6C\uD558\uAE30", (k) => E(`\uB9AC\uBCF8 ${dec(15 + 5 * k, 10)} m\uC758 \uAC00\uACA9\uC774 ${3e3 + 1e3 * k}\uC6D0\uC785\uB2C8\uB2E4. 1 m\uC758 \uAC00\uACA9\uC740 \uBA87 \uC6D0\uC785\uB2C8\uAE4C?`, [3e3 + 1e3 * k, dec(15 + 5 * k, 10), "/"], "\uC804\uCCB4 \uAC00\uACA9\uC744 \uAE38\uC774\uB85C \uB098\uB204\uBA74 {answer}\uC6D0\uC785\uB2C8\uB2E4.", "\uC6D0"), 12);
a7(2, 2, "decimal-length-with-offset", "6\uC21801-15", 3, "\uC18C\uC218 \uC591\uC758 \uCC28\uB97C \uD55C \uC870\uAC01 \uAE38\uC774\uB85C \uB098\uB204\uAE30", (k) => E(`\uB048 ${dec(24 + 3 * k, 10)} m\uC5D0\uC11C 0.6 m\uB97C \uB0A8\uACA8 \uB450\uACE0 0.3 m\uC529 \uC790\uB985\uB2C8\uB2E4. \uC870\uAC01\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [dec(24 + 3 * k, 10), "0.6", "-", "0.3", "/"], "\uC790\uB97C \uAE38\uC774\uB97C \uAD6C\uD558\uACE0 \uC870\uAC01 \uAE38\uC774\uB85C \uB098\uB204\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 12);
a7(2, 2, "decimal-divide-equal", "6\uC21801-15", 1, "\uAC19\uC740 \uC18C\uC218\uB07C\uB9AC \uB098\uB208 \uBAAB \uC774\uD574\uD558\uAE30", () => C("1.25 L\uC758 \uBB3C\uC744 \uD55C \uBCD1\uC5D0 1.25 L\uC529 \uB2F4\uC73C\uBA74 \uD55C \uBCD1\uC774 \uB429\uB2C8\uB2E4. \uC774\uC5D0 \uD574\uB2F9\uD558\uB294 \uB098\uB217\uC148\uC758 \uBAAB\uACFC \uAE4C\uB2ED\uC744 \uACE0\uB974\uC138\uC694.", "\uBAAB\uC740 1\uC774\uBA70 \uAC19\uC740 \uC591\uC774 \uD55C \uBC88 \uB4E4\uC5B4\uAC04\uB2E4", [["\uBAAB\uC740 0\uC774\uBA70 \uAC19\uC740 \uC218\uB97C \uC5C6\uC564\uB2E4", "\uB098\uB217\uC148\uC744 \uBE84\uC148\uC73C\uB85C \uD63C\uB3D9"], ["\uBAAB\uC740 1.25\uC774\uBA70 \uB098\uB204\uB294 \uC218\uB97C \uBB34\uC2DC\uD55C\uB2E4", "\uBB36\uC74C \uD06C\uAE30\uB97C \uBC18\uC601\uD558\uC9C0 \uC54A\uC74C"]], "\uC804\uCCB4 \uC591\uACFC \uD55C \uBCD1\uC758 \uC591\uC774 \uAC19\uC73C\uBBC0\uB85C \uD55C \uBCD1\uC744 \uCC44\uC6C1\uB2C8\uB2E4."));
a7(2, 2, "decimal-one-tenth-divisor", "6\uC21801-15", 2, "0.1 \uC870\uAC01\uC758 \uAC1C\uC218\uB85C \uB098\uB217\uC148 \uC758\uBBF8 \uC774\uD574\uD558\uAE30", () => E("2.4 \uC548\uC5D0 0.1\uC774 \uBA87 \uBC88 \uB4E4\uC5B4\uAC00\uB294\uC9C0 \uAD6C\uD558\uC138\uC694.", ["2.4", "0.1", "/"], "0.1 \uD06C\uAE30\uC758 \uC870\uAC01\uC740 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "", "concept"));
a7(2, 2, "decimal-scaling-preserved", "6\uC21801-15", 3, "\uB450 \uC218\uB97C \uAC19\uC740 \uBC30\uC218\uB85C \uBC14\uAFC0 \uB54C \uBAAB \uC720\uC9C0\uD558\uAE30", () => C("1.44 \xF7 0.12\uB97C \uC790\uC5F0\uC218 \uB098\uB217\uC148\uC73C\uB85C \uBC14\uAFBC \uC62C\uBC14\uB978 \uC2DD\uC744 \uACE0\uB974\uC138\uC694.", "144 \xF7 12", [["144 \xF7 0.12", "\uD55C\uCABD\uB9CC \uBC30\uC728 \uBCC0\uACBD"], ["1.44 \xF7 12", "\uD55C\uCABD\uB9CC \uBC30\uC728 \uBCC0\uACBD"]], "\uB450 \uC218\uB97C \uBAA8\uB450 100\uBC30 \uD574\uC57C \uD569\uB2C8\uB2E4."));
a7(2, 2, "decimal-divide-size", "6\uC21801-15", 3, "\uB098\uB204\uB294 \uC18C\uC218\uAC00 1\uBCF4\uB2E4 \uD070 \uACBD\uC6B0 \uD06C\uAE30 \uD310\uB2E8\uD558\uAE30", () => C("\uC591\uC218\uB97C 1.5\uB85C \uB098\uB208 \uBAAB\uC740 \uC6D0\uB798 \uC218\uBCF4\uB2E4 \uC5B4\uB5BB\uC2B5\uB2C8\uAE4C?", "\uC791\uB2E4", [["\uD06C\uB2E4", "\uC18C\uC218\uB85C \uB098\uB204\uBA74 \uC5B8\uC81C\uB098 \uCEE4\uC9C4\uB2E4\uACE0 \uD310\uB2E8"], ["\uAC19\uB2E4", "\uB098\uB204\uB294 \uC218 \uC601\uD5A5 \uBB34\uC2DC"]], "1\uBCF4\uB2E4 \uD070 \uC218\uB85C \uB098\uB204\uBBC0\uB85C \uBAAB\uC774 \uC791\uC544\uC9D1\uB2C8\uB2E4."));
a7(2, 2, "decimal-division-order", "6\uC21801-15", 3, "\uB098\uB217\uC148 \uC21C\uC11C\uB97C \uBC14\uAFBC \uACB0\uACFC \uBE44\uAD50\uD558\uAE30", () => C("0.6 \xF7 0.2\uC640 0.2 \xF7 0.6\uC758 \uAC12\uC744 \uBE44\uAD50\uD558\uC138\uC694.", "\uCCAB \uAC12\uC774 \uD06C\uB2E4", [["\uB450 \uAC12\uC774 \uAC19\uB2E4", "\uB098\uB217\uC148 \uC21C\uC11C \uC601\uD5A5 \uBB34\uC2DC"], ["\uB458\uC9F8 \uAC12\uC774 \uD06C\uB2E4", "\uBE44\uAD50 \uBC29\uD5A5 \uBC18\uB300"]], "\uCCAB \uAC12\uC740 3\uC774\uACE0 \uB458\uC9F8 \uAC12\uC740 1/3\uC785\uB2C8\uB2E4."));
a7(2, 2, "decimal-reverse-check", "6\uC21801-15", 3, "\uC18C\uC218 \uBAAB\uACFC \uB098\uB204\uB294 \uC218\uC758 \uACF1\uC73C\uB85C \uD655\uC778\uD558\uAE30", () => C("2.4 \xF7 0.3 = 8\uC758 \uD655\uC778 \uC2DD\uC744 \uACE0\uB974\uC138\uC694.", "8 \xD7 0.3 = 2.4", [["8 + 0.3 = 2.4", "\uD655\uC778 \uC5F0\uC0B0 \uC624\uB958"], ["8 \xF7 0.3 = 2.4", "\uD655\uC778\uC5D0\uC11C \uB2E4\uC2DC \uB098\uB214"]], "\uBAAB\uC5D0 \uB098\uB204\uB294 \uC218\uB97C \uACF1\uD569\uB2C8\uB2E4."));
a7(2, 2, "decimal-remaining-share", "6\uC21801-15", 3, "\uCD1D\uB7C9\xB7\uC77C\uBD80 \uC0AC\uC6A9\uB7C9\xB7\uC18C\uC218 \uBB36\uC74C \uD06C\uAE30 \uC5F0\uACB0\uD558\uAE30", () => E("\uC8FC\uC2A4 4.5 L \uC911 0.9 L\uB97C \uC0AC\uC6A9\uD558\uACE0 0.6 L\uC529 \uCEF5\uC5D0 \uB2F4\uC2B5\uB2C8\uB2E4. \uCEF5\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", ["4.5", "0.9", "-", "0.6", "/"], "\uB0A8\uC740 3.6 L\uB97C \uD55C \uCEF5 \uC591\uC73C\uB85C \uB098\uB204\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a7(2, 2, "decimal-divisor-misplacement", "6\uC21801-15", 3, "\uD55C\uCABD \uC18C\uC218\uC810\uB9CC \uC62E\uAE34 \uC624\uB958 \uD310\uB2E8\uD558\uAE30", () => C("4.8 \xF7 0.6\uC744 48 \xF7 0.6\uC73C\uB85C \uBC14\uAFB8\uC5B4 80\uC774\uB77C\uACE0 \uD588\uC2B5\uB2C8\uB2E4. \uBC14\uB978 \uBAAB\uC744 \uACE0\uB974\uC138\uC694.", "8", [["80", "\uB098\uB204\uC5B4\uC9C0\uB294 \uC218\uB9CC 10\uBC30"], ["0.8", "\uBC30\uC728 \uBC29\uD5A5\uC744 \uBC18\uB300\uB85C \uCC98\uB9AC"]], "\uB450 \uC218\uB97C \uBAA8\uB450 10\uBC30 \uD558\uC5EC 48 \xF7 6\uC744 \uACC4\uC0B0\uD569\uB2C8\uB2E4."));
a7(2, 2, "decimal-unit-length-count", "6\uC21801-15", 2, "\uC804\uCCB4 \uC18C\uC218 \uAE38\uC774\uC5D0 \uB2E8\uC704 \uAE38\uC774\uAC00 \uB4E4\uC5B4\uAC00\uB294 \uC218 \uAD6C\uD558\uAE30", () => E("\uB9AC\uBCF8 1.8 m\uC5D0\uC11C 0.45 m \uC870\uAC01\uC740 \uBA87 \uAC1C \uB9CC\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", ["1.8", "0.45", "/"], "\uC804\uCCB4\uB97C \uD55C \uC870\uAC01 \uAE38\uC774\uB85C \uB098\uB204\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a7(2, 2, "decimal-pack-plan", "6\uC21801-15", 4, "\uC804\uCCB4\xB7\uB0A8\uACA8\uB458 \uC591\xB7\uD3EC\uC7A5 \uC870\uAC74\uC5D0 \uB9DE\uB294 \uACC4\uD68D \uC120\uD0DD\uD558\uAE30", () => C("\uBB3C 5 L\uC5D0\uC11C 0.8 L\uB97C \uB0A8\uACA8 \uB450\uACE0 0.6 L\uC529 \uBCD1\uC5D0 \uB2F4\uC2B5\uB2C8\uB2E4. \uCD5C\uB300\uD55C \uAF49 \uCC44\uC6B4 \uBCD1 \uC218\uC640 \uB0A8\uB294 \uBB3C\uC744 \uACE0\uB974\uC138\uC694.", "7\uBCD1, \uB530\uB85C \uB454 0.8 L\uB9CC \uB0A8\uB294\uB2E4", [["8\uBCD1, 0.2 L \uB0A8\uB294\uB2E4", "\uB0A8\uACA8\uB458 \uC591 \uC870\uAC74 \uB204\uB77D"], ["6\uBCD1, 1.4 L \uB0A8\uB294\uB2E4", "\uAC00\uB2A5\uD55C \uC644\uC131 \uBCD1 \uC218\uB97C \uCD5C\uB300\uD55C \uB9CC\uB4E4\uC9C0 \uC54A\uC74C"]], "\uB2F4\uC744 \uC591\uC740 4.2 L\uC774\uBA70 0.6 L\uC529 \uC77C\uACF1 \uBCD1\uC5D0 \uC815\uD655\uD788 \uB4E4\uC5B4\uAC11\uB2C8\uB2E4."));

// learning-review-r1/native/data/final-expansion-grade6c.js
var a8 = (u, id, code, l, o, fn, domain = 1) => A(6, 2, u, "FINAL-" + id, code, l, o, fn, domain);
a8(3, "stack-known-heights-sum", "6\uC21803-09", 3, "\uC11C\uB85C \uB2E4\uB978 \uBC14\uB2E5 \uC790\uB9AC\uC758 \uB192\uC774\uB97C \uD569\uD558\uAE30", (k) => E(`\uBC14\uB2E5 \uC138 \uC790\uB9AC\uC5D0 \uBE48 \uCE35 \uC5C6\uC774 \uAC01\uAC01 ${1 + k}\uAC1C, 2\uAC1C, 4\uAC1C\uC529 \uC313\uC558\uC2B5\uB2C8\uB2E4. \uC804\uCCB4 \uBE14\uB85D \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [1 + k, 2, "+", 4, "+"], "\uAC01 \uC790\uB9AC\uC758 \uC218\uB97C \uB354\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 4);
a8(3, "stack-removed-top", "6\uC21803-09", 3, "\uB192\uC774\uBCC4 \uBE14\uB85D \uC218\uC5D0\uC11C \uC717\uBE14\uB85D\uC744 \uBE80 \uC804\uCCB4 \uAD6C\uD558\uAE30", (k) => E(`\uC138 \uC790\uB9AC\uC758 \uB192\uC774\uB294 ${2 + k}\uAC1C, 3\uAC1C, 2\uAC1C\uC785\uB2C8\uB2E4. \uAC01 \uC790\uB9AC\uC5D0\uC11C \uB9E8 \uC704 \uD55C \uAC1C\uC529\uC744 \uBE90\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uBE14\uB85D\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [2 + k, 3, "+", 2, "+", 3, "-"], "\uC804\uCCB4\uC5D0\uC11C \uC138 \uC790\uB9AC\uC758 \uC717\uBE14\uB85D\uC744 \uBE7C\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 4);
a8(3, "top-view-no-height", "6\uC21803-10", 1, "\uC704\uC5D0\uC11C \uBCF8 \uBAA8\uC591\uC5D0 \uC5C6\uB294 \uB192\uC774 \uC815\uBCF4 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC704\uC5D0\uC11C \uBCF8 \uBAA8\uC591\uB9CC\uC73C\uB85C \uD56D\uC0C1 \uC54C \uC218 \uC5C6\uB294 \uC815\uBCF4\uB97C \uACE0\uB974\uC138\uC694.", "\uAC01 \uC790\uB9AC\uC758 \uC815\uD655\uD55C \uB192\uC774", [["\uC5B4\uB290 \uBC14\uB2E5 \uC790\uB9AC\uAC00 \uC0AC\uC6A9\uB418\uC5C8\uB294\uC9C0", "\uC704\uC5D0\uC11C \uBCF8 \uC790\uB9AC \uC815\uBCF4\uB97C \uB204\uB77D"], ["\uB4DC\uB7EC\uB09C \uBC14\uB2E5 \uC790\uB9AC\uC758 \uAC1C\uC218", "\uD45C\uC2DC\uB41C \uC790\uB9AC \uC218\uB97C \uB204\uB77D"]], "\uC704\uC5D0\uC11C\uB294 \uAC19\uC740 \uC790\uB9AC\uC758 \uB192\uC774\uAC00 \uACB9\uCCD0 \uBCF4\uC785\uB2C8\uB2E4."));
a8(3, "front-count-not-all", "6\uC21803-10", 3, "\uD22C\uC601\uB3C4\uC5D0\uC11C \uACB9\uCCD0 \uBCF4\uC774\uB294 \uBE14\uB85D \uC774\uD574\uD558\uAE30", () => C("\uC55E\uC5D0\uC11C \uBCF4\uC774\uB294 \uBE14\uB85D\uC744 \uC13C \uC218\uAC00 \uD56D\uC0C1 \uC804\uCCB4 \uBE14\uB85D \uC218\uC640 \uAC19\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uB4A4\uC5D0 \uAC00\uB824\uC9C4 \uBE14\uB85D\uC744 \uB204\uB77D"]], "\uC55E\uB4A4\uC5D0 \uACB9\uCCD0 \uC788\uB294 \uBE14\uB85D\uC774 \uAC00\uB824\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."));
a8(3, "base-support-condition", "6\uC21803-09", 2, "\uBE48 \uCE35 \uC5C6\uC774 \uC313\uB294 \uC870\uAC74 \uC774\uD574\uD558\uAE30", () => C("\uAC19\uC740 \uBC14\uB2E5 \uC790\uB9AC\uC5D0\uC11C \uB9E8 \uC704\uC5D0 \uBE14\uB85D\uC774 3\uCE35 \uB192\uC774\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. \uBE48 \uCE35 \uC5C6\uC774 \uC313\uC558\uB2E4\uBA74 \uADF8 \uC790\uB9AC\uC758 \uBE14\uB85D \uC218\uB97C \uACE0\uB974\uC138\uC694.", "3\uAC1C", [["1\uAC1C", "\uC544\uB798\uCE35\uC744 \uB204\uB77D"], ["2\uAC1C", "\uD55C \uCE35 \uB204\uB77D"]], "\uBC14\uB2E5\uBD80\uD130 1, 2, 3\uCE35\uC774 \uBAA8\uB450 \uC788\uC5B4\uC57C \uD569\uB2C8\uB2E4."));
a8(3, "top-shape-same-different-total", "6\uC21803-10", 3, "\uC704 \uBAA8\uC591\uACFC \uC804\uCCB4 \uC218\uAC00 \uC11C\uB85C \uB2E4\uB978 \uC815\uBCF4\uC784\uC744 \uD310\uB2E8\uD558\uAE30", () => C("\uAC19\uC740 \uBC14\uB2E5 \uB450 \uC790\uB9AC\uC5D0 A\uB294 \uB192\uC774 1\xB71, B\uB294 \uB192\uC774 1\xB73\uC73C\uB85C \uC313\uC558\uC2B5\uB2C8\uB2E4. \uC704\uC5D0\uC11C \uBCF8 \uC790\uB9AC \uC218\uC640 \uC804\uCCB4 \uC218\uB97C \uBE44\uAD50\uD558\uC138\uC694.", "\uC704 \uC790\uB9AC \uC218\uB294 \uAC19\uACE0 \uC804\uCCB4 \uC218\uB294 \uB2E4\uB974\uB2E4", [["\uB458 \uB2E4 \uAC19\uB2E4", "\uB192\uC774\uB97C \uC804\uCCB4 \uC218\uC5D0 \uBC18\uC601\uD558\uC9C0 \uC54A\uC74C"], ["\uB458 \uB2E4 \uB2E4\uB974\uB2E4", "\uC704 \uBAA8\uC591\uC5D0 \uB192\uC774\uB97C \uADF8\uB300\uB85C \uBC18\uC601"]], "\uB450 \uC790\uB9AC \uBAA8\uC591\uC740 \uAC19\uC9C0\uB9CC \uC804\uCCB4\uB294 2\uAC1C\uC640 4\uAC1C\uC785\uB2C8\uB2E4."));
a8(3, "all-one-layer", "6\uC21803-09", 2, "\uD55C \uCE35 \uBC30\uCE58\uC758 \uC804\uCCB4 \uC218 \uC77D\uAE30", () => E("\uC11C\uB85C \uB2E4\uB978 \uBC14\uB2E5 \uB2E4\uC12F \uC790\uB9AC\uC5D0 \uBE14\uB85D \uD55C \uAC1C\uC529\uB9CC \uC788\uC2B5\uB2C8\uB2E4. \uC804\uCCB4\uB294 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", [5], "\uD55C \uC790\uB9AC\uB9C8\uB2E4 \uD55C \uAC1C\uC774\uBBC0\uB85C {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a8(3, "hidden-addition", "6\uC21803-10", 3, "\uAC00\uB824\uC9C4 \uBE14\uB85D \uCD94\uAC00\uC640 \uD2B9\uC815 \uD22C\uC601 \uC720\uC9C0 \uD310\uB2E8\uD558\uAE30", () => C("\uC55E\uC5D0\uC11C \uAC00\uB824\uC9C0\uB294 \uB4A4\uCABD \uC704\uCE58\uC5D0 \uBE14\uB85D \uD55C \uAC1C\uB97C \uB354 \uB193\uC558\uC2B5\uB2C8\uB2E4. \uC55E \uBAA8\uC591\uC740 \uADF8\uB300\uB85C\uC5EC\uB3C4 \uC804\uCCB4 \uBE14\uB85D \uC218\uB294 \uC5B4\uB5BB\uAC8C \uB429\uB2C8\uAE4C?", "1\uAC1C \uB298\uC5B4\uB09C\uB2E4", [["\uADF8\uB300\uB85C\uC774\uB2E4", "\uD22C\uC601 \uBCC0\uD654 \uC5C6\uC74C\uACFC \uC804\uCCB4 \uC218\uB97C \uD63C\uB3D9"], ["1\uAC1C \uC904\uC5B4\uB4E0\uB2E4", "\uCD94\uAC00 \uBC29\uD5A5\uC744 \uBC18\uB300\uB85C \uD310\uB2E8"]], "\uAC00\uB824\uC838 \uBCF4\uC774\uC9C0 \uC54A\uC544\uB3C4 \uC2E4\uC81C \uBE14\uB85D\uC740 \uD558\uB098 \uCD94\uAC00\uB429\uB2C8\uB2E4."));
a8(3, "height-change-top-preserved", "6\uC21803-10", 3, "\uB192\uC774 \uBCC0\uD654\uAC00 \uC704 \uBAA8\uC591\uC5D0 \uBBF8\uCE58\uB294 \uC601\uD5A5 \uD310\uB2E8\uD558\uAE30", () => C("\uC774\uBBF8 \uBE14\uB85D\uC774 \uC788\uB294 \uBC14\uB2E5 \uC790\uB9AC\uC758 \uB192\uC774\uB9CC 2\uC5D0\uC11C 4\uB85C \uB298\uB838\uC2B5\uB2C8\uB2E4. \uC704\uC5D0\uC11C \uBCF8 \uBC14\uB2E5 \uC790\uB9AC \uBAA8\uC591\uC740 \uC5B4\uB5BB\uAC8C \uB429\uB2C8\uAE4C?", "\uAC19\uB2E4", [["\uB450 \uC790\uB9AC\uAC00 \uB354 \uC0DD\uAE34\uB2E4", "\uCE35 \uC218\uC640 \uBC14\uB2E5 \uC790\uB9AC \uC218 \uD63C\uB3D9"], ["\uD55C \uC790\uB9AC\uAC00 \uC0AC\uB77C\uC9C4\uB2E4", "\uB192\uC774 \uC99D\uAC00\uB97C \uC790\uB9AC \uAC10\uC18C\uB85C \uD310\uB2E8"]], "\uC0AC\uC6A9\uB41C \uBC14\uB2E5 \uC790\uB9AC\uB294 \uAC19\uC73C\uBBC0\uB85C \uC704 \uBAA8\uC591\uC740 \uAC19\uC2B5\uB2C8\uB2E4."));
a8(3, "two-heights-comparison", "6\uC21803-09", 3, "\uB450 \uBC30\uCE58\uC758 \uC804\uCCB4 \uC218 \uBE44\uAD50\uD558\uAE30", () => C("A\uB294 \uB192\uC774 1\xB72\xB73, B\uB294 2\xB72\xB72\uB85C \uC313\uC558\uC2B5\uB2C8\uB2E4. \uC804\uCCB4 \uC218\uB97C \uBE44\uAD50\uD558\uC138\uC694.", "\uAC19\uB2E4", [["A\uAC00 \uB9CE\uB2E4", "\uCD5C\uB300 \uB192\uC774\uB9CC \uBE44\uAD50"], ["B\uAC00 \uB9CE\uB2E4", "\uAC19\uC740 \uB192\uC774 \uBC18\uBCF5\uB9CC \uBE44\uAD50"]], "\uAC01 \uB192\uC774 \uD569\uC774 \uBAA8\uB450 6\uC785\uB2C8\uB2E4."));
a8(3, "max-height-information", "6\uC21803-10", 3, "\uBCF4\uC774\uB294 \uCD5C\uB300 \uB192\uC774\uC640 \uBAA8\uB4E0 \uC790\uB9AC \uB192\uC774 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC55E \uBAA8\uC591\uC758 \uCD5C\uB300 \uB192\uC774\uAC00 4\uC785\uB2C8\uB2E4. \uBAA8\uB4E0 \uBC14\uB2E5 \uC790\uB9AC\uC5D0 \uBC18\uB4DC\uC2DC \uBE14\uB85D \uB124 \uAC1C\uC529 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uCD5C\uB300 \uB192\uC774\uB97C \uAC01 \uC790\uB9AC \uB192\uC774\uB85C \uD655\uB300"]], "\uCD5C\uB300 \uB192\uC774\uB294 \uAC00\uC7A5 \uB192\uC740 \uBD80\uBD84\uC744 \uB098\uD0C0\uB0B4\uBA70 \uAC01 \uC790\uB9AC\uB294 \uB354 \uB0AE\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4."));
a8(3, "stack-two-constraints", "6\uC21803-09", 4, "\uC804\uCCB4 \uC218\xB7\uC790\uB9AC \uC218\xB7\uB192\uC774 \uC81C\uD55C\uC744 \uD568\uAED8 \uD655\uC778\uD558\uAE30", () => C("\uBC14\uB2E5 \uC138 \uC790\uB9AC\uC5D0 \uBE48 \uCE35 \uC5C6\uC774 \uC313\uACE0 \uC804\uCCB4 \uBE14\uB85D\uC740 10\uAC1C\uC785\uB2C8\uB2E4. \uB192\uC774 \uC81C\uD55C\uC740 \uAC01 \uC790\uB9AC 4\uAC1C \uC774\uD558\uC785\uB2C8\uB2E4. \uAC00\uB2A5\uD55C \uB192\uC774 \uC870\uD569\uC744 \uACE0\uB974\uC138\uC694.", "3\xB73\xB74", [["1\xB74\xB75", "\uB192\uC774 \uC0C1\uD55C \uC704\uBC18"], ["2\xB73\xB74", "\uC804\uCCB4 \uC218 10 \uC870\uAC74 \uC704\uBC18"]], "\uC138 \uB192\uC774\uC758 \uD569\uACFC \uAC01 \uB192\uC774 \uC81C\uD55C\uC744 \uBAA8\uB450 \uD655\uC778\uD569\uB2C8\uB2E4."));
a8(4, "allocation-difference", "6\uC21802-05", 3, "\uC804\uCCB4\uC758 \uBE44 \uBC30\uBD84\uACFC \uB450 \uC591\uC758 \uCC28 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uAD6C\uC2AC ${7 * (5 + k)}\uAC1C\uB97C A\uC640 B\uC5D0\uAC8C 3:4\uB85C \uB098\uB215\uB2C8\uB2E4. B\uB294 A\uBCF4\uB2E4 \uBA87 \uAC1C \uB354 \uBC1B\uC2B5\uB2C8\uAE4C?`, [7 * (5 + k), 7, "/", 4, 3, "-", "*"], "\uBE44 \uD55C \uBAAB\uC758 \uC591\uACFC \uB450 \uBE44\uC758 \uCC28\uB97C \uACF1\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 12);
a8(4, "proportion-recover-base", "6\uC21802-04", 3, "\uAC19\uC740 \uAD00\uACC4\uC5D0\uC11C \uC54C\uB824\uC9C4 \uBE44\uAD50\uB7C9\uC73C\uB85C \uAE30\uC900\uB7C9 \uCC3E\uAE30", (k) => E(`\uACF5\uCC45 4\uAD8C\uC758 \uAC00\uACA9\uC774 8000\uC6D0\uC785\uB2C8\uB2E4. ${6e3 + 2e3 * k}\uC6D0\uC774\uBA74 \uAC19\uC740 \uACF5\uCC45\uC740 \uBA87 \uAD8C\uC785\uB2C8\uAE4C?`, [6e3 + 2e3 * k, 8e3, 4, "/", "/"], "\uD55C \uAD8C \uAC00\uACA9\uC73C\uB85C \uC804\uCCB4 \uAE08\uC561\uC744 \uB098\uB204\uBA74 {answer}\uAD8C\uC785\uB2C8\uB2E4.", "\uAD8C"), 12);
a8(4, "proportion-definition", "6\uC21802-04", 1, "\uBE44\uB840\uC2DD\uC758 \uAC19\uC740 \uBE44\uC728 \uAD00\uACC4 \uC774\uD574\uD558\uAE30", () => C("\uBE44\uB840\uC2DD\uC5D0 \uB300\uD55C \uBC14\uB978 \uC124\uBA85\uC744 \uACE0\uB974\uC138\uC694.", "\uAC19\uC740 \uBE44\uC728\uC758 \uB450 \uBE44\uB97C \uB4F1\uD638\uB85C \uC5F0\uACB0\uD55C\uB2E4", [["\uC544\uBB34 \uB450 \uBE44\uB97C \uC5F0\uACB0\uD55C\uB2E4", "\uAC19\uC740 \uBE44\uC728 \uC870\uAC74 \uB204\uB77D"], ["\uB450 \uBE44\uC758 \uC218\uAC00 \uBAA8\uB450 \uAC19\uC544\uC57C\uB9CC \uD55C\uB2E4", "\uB3D9\uCE58 \uBE44\uC758 \uD655\uB300\uB97C \uD5C8\uC6A9\uD558\uC9C0 \uC54A\uC74C"]], "\uBE44\uC728\uC774 \uAC19\uC740 \uB450 \uBE44\uB97C \uB098\uD0C0\uB0B4\uB294 \uC2DD\uC785\uB2C8\uB2E4."));
a8(4, "allocation-ratio-sum", "6\uC21802-05", 2, "\uBE44\uB840\uBC30\uBD84\uC5D0\uC11C \uBE44\uC758 \uD569\uC744 \uAE30\uC900\uC73C\uB85C \uC0AC\uC6A9\uD558\uAE30", () => C("\uC804\uCCB4\uB97C 2:5\uB85C \uB098\uB20C \uB54C \uC804\uCCB4\uB97C \uAC19\uC740 \uBA87 \uBAAB\uC73C\uB85C \uC0DD\uAC01\uD569\uB2C8\uAE4C?", "7\uBAAB", [["5\uBAAB", "\uB4A4 \uD56D\uB9CC \uAE30\uC900\uC73C\uB85C \uC0AC\uC6A9"], ["2\uBAAB", "\uC55E \uD56D\uB9CC \uAE30\uC900\uC73C\uB85C \uC0AC\uC6A9"]], "\uB450 \uD56D\uC758 \uD569 7\uC774 \uC804\uCCB4\uC5D0 \uD574\uB2F9\uD569\uB2C8\uB2E4."));
a8(4, "equivalent-proportion-check", "6\uC21802-04", 3, "\uAC19\uC740 \uBC30\uC728\uB85C \uBE44\uB840\uC2DD \uC131\uB9BD \uD655\uC778\uD558\uAE30", () => C("3:4 = 9:12\uB294 \uC62C\uBC14\uB978 \uBE44\uB840\uC2DD\uC785\uB2C8\uAE4C?", "\uC608", [["\uC544\uB2C8\uC694", "\uC218 \uC790\uCCB4\uAC00 \uB2E4\uB974\uBA74 \uBE44\uC728\uB3C4 \uB2E4\uB974\uB2E4\uACE0 \uD310\uB2E8"]], "\uC55E\uD56D\uACFC \uB4A4\uD56D\uC774 \uBAA8\uB450 \uC138 \uBC30\uC785\uB2C8\uB2E4."));
a8(4, "allocation-one-part", "6\uC21802-05", 3, "\uC804\uCCB4\uC640 \uD55C \uBC30\uBD84\uB7C9\uC73C\uB85C \uB2E4\uB978 \uC591 \uAD6C\uD558\uAE30", () => E("\uC804\uCCB4 56\uAC1C\uB97C 3:4\uB85C \uB098\uB204\uBA74 \uCCAB \uBC88\uC9F8 \uC591\uC740 24\uAC1C\uC785\uB2C8\uB2E4. \uB450 \uBC88\uC9F8 \uC591\uC744 \uAD6C\uD558\uC138\uC694.", [56, 24, "-"], "\uC804\uCCB4\uC5D0\uC11C \uCCAB \uBC88\uC9F8 \uC591\uC744 \uBE7C\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a8(4, "wrong-base-allocation", "6\uC21802-05", 3, "\uC55E \uD56D\uB9CC\uC73C\uB85C \uC804\uCCB4\uB97C \uB098\uB204\uB294 \uC624\uB958 \uD310\uB2E8\uD558\uAE30", () => C("\uC804\uCCB4 40\uAC1C\uB97C 2:3\uC73C\uB85C \uB098\uB204\uB294\uB370 40 \xF7 2\uB85C \uBE44 \uD55C \uBAAB\uC744 \uAD6C\uD588\uC2B5\uB2C8\uB2E4. \uBC14\uB978 \uD55C \uBAAB\uC744 \uACE0\uB974\uC138\uC694.", "8\uAC1C", [["20\uAC1C", "\uBE44\uC758 \uD569 \uB300\uC2E0 \uC55E \uD56D \uC0AC\uC6A9"], ["40\uAC1C", "\uC804\uCCB4\uB97C \uD55C \uBAAB\uC73C\uB85C \uD310\uB2E8"]], "\uC804\uCCB4\uB294 \uB2E4\uC12F \uBAAB\uC774\uBBC0\uB85C 40 \xF7 5\uC785\uB2C8\uB2E4."));
a8(4, "inverse-allocation-second", "6\uC21802-05", 3, "\uD55C \uBC30\uBD84\uB7C9\uC73C\uB85C \uB2E4\uB978 \uBC30\uBD84\uB7C9 \uCC3E\uAE30", () => E("A:B = 3:5\uC774\uACE0 B\uAC00 35\uAC1C\uC785\uB2C8\uB2E4. A\uB294 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", [35, 5, "/", 3, "*"], "\uBE44 \uD55C \uBAAB\uC758 \uC591\uC744 \uAD6C\uD558\uACE0 A\uC758 \uBE44 3\uC744 \uACF1\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a8(4, "proportion-scale-versus-plus", "6\uC21802-04", 3, "\uBE44\uC758 \uD655\uB300\uB97C \uAC19\uC740 \uCC28 \uB354\uD558\uAE30\uC640 \uAD6C\uBCC4\uD558\uAE30", () => C("2:3\uC5D0 \uAC01\uAC01 4\uB97C \uB354\uD55C 6:7\uC740 \uAC19\uC740 \uBE44\uC728\uC785\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uAC19\uC740 \uC218\uB97C \uB354\uD558\uBA74 \uBE44\uC728\uB3C4 \uAC19\uB2E4\uACE0 \uD310\uB2E8"]], "\uAC19\uC740 \uBE44\uC728\uC744 \uC720\uC9C0\uD558\uB824\uBA74 \uAC19\uC740 \uBC30\uC218\uB85C \uBC14\uAFB8\uC5B4\uC57C \uD569\uB2C8\uB2E4."));
a8(4, "allocation-equal-ratio", "6\uC21802-05", 2, "\uAC19\uC740 \uB450 \uD56D\uC758 \uBC30\uBD84 \uAD00\uACC4 \uC774\uD574\uD558\uAE30", () => E("\uC0C9\uC885\uC774 36\uC7A5\uC744 4:4\uB85C \uB098\uB215\uB2C8\uB2E4. \uD55C\uCABD\uC740 \uBA87 \uC7A5\uC785\uB2C8\uAE4C?", [36, 2, "/"], "\uB450 \uBE44\uAC00 \uAC19\uC73C\uBBC0\uB85C \uBC18\uC529 \uBC1B\uC544 {answer}\uC7A5\uC785\uB2C8\uB2E4.", "\uC7A5"));
a8(4, "proportion-units-check", "6\uC21802-04", 3, "\uAC19\uC740 \uB2E8\uC704 \uAD00\uACC4\uB97C \uBE44\uAD50\uD558\uB294 \uC870\uAC74 \uC774\uD574\uD558\uAE30", () => C("\uAC19\uC740 \uC885\uB958\uC758 \uACF5\uCC45 \uAC00\uACA9\uC744 \uBE44\uAD50\uD558\uB294 \uBE44\uB840\uC2DD\uC5D0\uC11C \uD55C\uCABD\uC740 \uC6D0, \uB2E4\uB978 \uCABD\uC740 \uAC00\uACA9\uC758 \uC22B\uC790\uB9CC \uC801\uC740 \uB9CC \uC6D0 \uB2E8\uC704\uC785\uB2C8\uB2E4. \uBE44\uAD50 \uC804\uC5D0 \uBB34\uC5C7\uC744 \uD574\uC57C \uD569\uB2C8\uAE4C?", "\uAC00\uACA9 \uB2E8\uC704\uB97C \uB9DE\uCD98\uB2E4", [["\uB2E8\uC704 \uC5C6\uC774 \uC22B\uC790\uB9CC \uBE44\uAD50\uD55C\uB2E4", "\uAE30\uC900 \uB2E8\uC704 \uCC28\uC774 \uBB34\uC2DC"], ["\uD070 \uC22B\uC790\uAC00 \uD56D\uC0C1 \uBE44\uC728\uB3C4 \uD06C\uB2E4", "\uBE44\uAD50\uB7C9\uACFC \uAE30\uC900\uB7C9 \uC5ED\uD560 \uBB34\uC2DC"]], "\uAC19\uC740 \uC591\uC758 \uBE44\uB97C \uBE44\uAD50\uD558\uB824\uBA74 \uB2E8\uC704\uB97C \uB9DE\uCD94\uC5B4\uC57C \uD569\uB2C8\uB2E4."));
a8(4, "allocation-constraint-plan", "6\uC21802-05", 5, "\uBC30\uBD84\uBE44\xB7\uD55C\uCABD \uCD5C\uC18C\uB7C9\xB7\uC804\uCCB4 \uC81C\uD55C\uC73C\uB85C \uACC4\uD68D \uD310\uB2E8\uD558\uAE30", () => C("A\uC640 B\uC5D0\uAC8C 2:3\uC73C\uB85C \uB098\uB204\uBA70 A\uB294 \uCD5C\uC18C 12\uAC1C \uBC1B\uC544\uC57C \uD569\uB2C8\uB2E4. \uC804\uCCB4\uB294 28\uAC1C \uB610\uB294 30\uAC1C \uC911 \uACE0\uB985\uB2C8\uB2E4. \uB0A8\uAE40\uC5C6\uC774 \uC790\uC5F0\uC218 \uAC1C\uC218\uB85C \uB098\uB204\uB294 \uACC4\uD68D\uC744 \uACE0\uB974\uC138\uC694.", "30\uAC1C\uB97C \uB098\uB204\uC5B4 A 12\uAC1C, B 18\uAC1C", [["28\uAC1C\uB97C \uB098\uB204\uC5B4 A 12\uAC1C, B 16\uAC1C", "\uC8FC\uC5B4\uC9C4 \uBE44\uC728 \uC704\uBC18"], ["30\uAC1C\uB97C \uB098\uB204\uC5B4 A 18\uAC1C, B 12\uAC1C", "\uB300\uC0C1 \uC21C\uC11C \uBC18\uB300"]], "\uD55C \uBAAB\uC740 6\uAC1C\uC5EC\uC57C \uD558\uACE0 \uC804\uCCB4 \uB2E4\uC12F \uBAAB\uC740 30\uAC1C\uC785\uB2C8\uB2E4."));
a8(5, "circle-circumference-difference", "6\uC21803-16", 3, "\uB450 \uC6D0\uC758 \uC9C0\uB984 \uCC28\uC640 \uC6D0\uC8FC \uCC28 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uB450 \uC6D0\uC758 \uC9C0\uB984\uC740 ${8 + k} cm\uC640 ${4 + k} cm\uC785\uB2C8\uB2E4. \uC6D0\uC8FC \uCC28\uB294 \uBA87 cm\uC785\uB2C8\uAE4C? \uC6D0\uC8FC\uC728\uC740 3.14\uC785\uB2C8\uB2E4.`, [8 + k, 4 + k, "-", 3.14, "*"], "\uC9C0\uB984 \uCC28\uC5D0 \uC6D0\uC8FC\uC728\uC744 \uACF1\uD558\uBA74 \uC6D0\uC8FC \uCC28 {answer} cm\uC785\uB2C8\uB2E4.", "cm"), 12);
a8(5, "circle-area-and-small", "6\uC21803-16", 4, "\uB450 \uC6D0 \uB113\uC774 \uCC28 \uAD6C\uD558\uAE30", (k) => E(`\uBC18\uC9C0\uB984 ${3 + k} cm\uC778 \uC6D0\uC5D0\uC11C \uBC18\uC9C0\uB984 2 cm\uC778 \uC791\uC740 \uC6D0\uC758 \uB113\uC774\uB97C \uBE80 \uAC12\uC740 \uBA87 cm\xB2\uC785\uB2C8\uAE4C? \uC6D0\uC8FC\uC728\uC740 3.14\uC785\uB2C8\uB2E4.`, [3 + k, 3 + k, "*", 2, 2, "*", "-", 3.14, "*"], "\uB450 \uBC18\uC9C0\uB984 \uC81C\uACF1\uC758 \uCC28\uC5D0 \uC6D0\uC8FC\uC728\uC744 \uACF1\uD558\uBA74 {answer} cm\xB2\uC785\uB2C8\uB2E4.", "cm\xB2"), 12);
a8(5, "pi-measurement-ratio", "6\uC21803-15", 1, "\uC6D0\uC8FC\uC728\uC5D0 \uD574\uB2F9\uD558\uB294 \uCE21\uC815 \uBE44 \uD655\uC778\uD558\uAE30", () => C("\uC6D0\uC8FC\uC728\uC744 \uD655\uC778\uD558\uB294 \uBE44\uB97C \uACE0\uB974\uC138\uC694.", "\uC6D0\uC8FC \xF7 \uC9C0\uB984", [["\uC9C0\uB984 \xF7 \uC6D0\uC8FC", "\uC21C\uC11C \uBC18\uB300"], ["\uC6D0\uC8FC \xF7 \uBC18\uC9C0\uB984", "\uC9C0\uB984\uACFC \uBC18\uC9C0\uB984 \uD63C\uB3D9"]], "\uC6D0\uC8FC\uB97C \uC9C0\uB984\uC73C\uB85C \uB098\uB208 \uBE44\uAC00 \uC6D0\uC8FC\uC728\uC785\uB2C8\uB2E4."));
a8(5, "diameter-radius-conversion", "6\uC21803-16", 2, "\uC9C0\uB984\uC5D0\uC11C \uBC18\uC9C0\uB984\uC744 \uCC3E\uC544 \uB113\uC774\uC5D0 \uC801\uC6A9\uD558\uAE30", () => E("\uC9C0\uB984 10 cm\uC778 \uC6D0\uC758 \uB113\uC774\uB97C \uAD6C\uD558\uC138\uC694. \uC6D0\uC8FC\uC728\uC740 3.14\uC785\uB2C8\uB2E4.", [10, 2, "/", 10, 2, "/", "*", 3.14, "*"], "\uBC18\uC9C0\uB984 5 cm\uB97C \uC0AC\uC6A9\uD558\uBA74 {answer} cm\xB2\uC785\uB2C8\uB2E4.", "cm\xB2"));
a8(5, "circumference-formula-choice", "6\uC21803-16", 3, "\uC6D0\uC758 \uB113\uC774\uC640 \uC6D0\uC8FC \uC2DD \uAD6C\uBCC4\uD558\uAE30", () => C("\uBC18\uC9C0\uB984 r\uC778 \uC6D0\uC758 \uC6D0\uC8FC\uB97C \uAD6C\uD558\uB294 \uC2DD\uC744 \uACE0\uB974\uC138\uC694.", "r \xD7 2 \xD7 \uC6D0\uC8FC\uC728", [["r \xD7 r \xD7 \uC6D0\uC8FC\uC728", "\uB113\uC774 \uC2DD\uC744 \uC6D0\uC8FC\uC5D0 \uC0AC\uC6A9"], ["r \xD7 \uC6D0\uC8FC\uC728", "\uC9C0\uB984 \uB450 \uBC30 \uAD00\uACC4 \uB204\uB77D"]], "\uC6D0\uC8FC\uB294 \uC9C0\uB984\uC5D0 \uC6D0\uC8FC\uC728\uC744 \uACF1\uD55C \uAC12\uC785\uB2C8\uB2E4."));
a8(5, "area-radius-error", "6\uC21803-16", 3, "\uC9C0\uB984\uC744 \uBC18\uC9C0\uB984\uC73C\uB85C \uC0AC\uC6A9\uD558\uB294 \uC624\uB958 \uD310\uB2E8\uD558\uAE30", () => C("\uC9C0\uB984 8 cm\uC778 \uC6D0\uC758 \uB113\uC774\uC5D0 8 \xD7 8 \xD7 3.14\uB97C \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4. \uC5B4\uB5A4 \uAC12\uC744 \uBC14\uAFB8\uC5B4\uC57C \uD569\uB2C8\uAE4C?", "\uB450 8\uC744 \uBC18\uC9C0\uB984 4\uB85C \uBC14\uAFBC\uB2E4", [["\uC6D0\uC8FC\uC728\uC744 2\uB85C \uBC14\uAFBC\uB2E4", "\uB2E8\uC704\uC640 \uBC18\uC9C0\uB984 \uC870\uAC74\uC744 \uC798\uBABB \uCC98\uB9AC"], ["\uAC12\uC744 \uBC14\uAFB8\uC9C0 \uC54A\uB294\uB2E4", "\uC9C0\uB984\uACFC \uBC18\uC9C0\uB984 \uD63C\uB3D9"]], "\uB113\uC774 \uC2DD\uC5D0\uB294 \uBC18\uC9C0\uB984\uC744 \uB450 \uBC88 \uACF1\uD569\uB2C8\uB2E4."));
a8(5, "circle-scale-circumference", "6\uC21803-16", 3, "\uC9C0\uB984 \uBC30\uC728\uACFC \uC6D0\uC8FC \uBC30\uC728 \uC5F0\uACB0\uD558\uAE30", () => C("\uC9C0\uB984\uC774 3\uBC30\uAC00 \uB41C \uC6D0\uC758 \uC6D0\uC8FC\uB294 \uC6D0\uB798\uC758 \uBA87 \uBC30\uC785\uB2C8\uAE4C?", "3\uBC30", [["9\uBC30", "\uB113\uC774 \uBC30\uC728\uACFC \uD63C\uB3D9"], ["6\uBC30", "\uBC18\uC9C0\uB984\uACFC \uC9C0\uB984 \uBCC0\uD658\uC744 \uC911\uBCF5 \uC801\uC6A9"]], "\uC6D0\uC8FC\uB294 \uC9C0\uB984\uC5D0 \uBE44\uB840\uD569\uB2C8\uB2E4."));
a8(5, "pi-not-size-dependent", "6\uC21803-15", 3, "\uC6D0\uC758 \uD06C\uAE30\uC640 \uC6D0\uC8FC\uC728\uC758 \uAD00\uACC4 \uC774\uD574\uD558\uAE30", () => C("\uC791\uC740 \uC6D0\uACFC \uD070 \uC6D0\uC5D0\uC11C \uC6D0\uC8FC\uB97C \uC9C0\uB984\uC73C\uB85C \uB098\uB208 \uBE44\uB294 \uC5B4\uB5BB\uAC8C \uB429\uB2C8\uAE4C?", "\uB300\uB7B5 \uAC19\uC740 \uC6D0\uC8FC\uC728\uC774\uB2E4", [["\uD070 \uC6D0\uC5D0\uC11C \uBC18\uB4DC\uC2DC \uB450 \uBC30\uC774\uB2E4", "\uC6D0\uC758 \uD06C\uAE30\uC640 \uC6D0\uC8FC\uC728 \uD63C\uB3D9"], ["\uC791\uC740 \uC6D0\uC5D0\uC11C\uB294 1\uC774\uB2E4", "\uBE44\uC758 \uC758\uBBF8 \uC624\uB958"]], "\uC6D0\uC758 \uD06C\uAE30\uAC00 \uB2EC\uB77C\uB3C4 \uC774 \uBE44\uB294 \uB300\uB7B5 \uAC19\uC740 \uC6D0\uC8FC\uC728\uC785\uB2C8\uB2E4."));
a8(5, "radius-inverse-circumference", "6\uC21803-16", 3, "\uC6D0\uC8FC\uB85C \uC9C0\uB984\uACFC \uBC18\uC9C0\uB984 \uBCF5\uC6D0\uD558\uAE30", () => E("\uC6D0\uC8FC\uAC00 31.4 cm\uC785\uB2C8\uB2E4. \uC6D0\uC8FC\uC728\uC744 3.14\uB85C \uACC4\uC0B0\uD560 \uB54C \uBC18\uC9C0\uB984\uC740 \uBA87 cm\uC785\uB2C8\uAE4C?", ["31.4", "3.14", "/", 2, "/"], "\uC6D0\uC8FC\uC5D0\uC11C \uC9C0\uB984\uC744 \uAD6C\uD558\uACE0 \uB458\uB85C \uB098\uB204\uBA74 \uBC18\uC9C0\uB984 {answer} cm\uC785\uB2C8\uB2E4.", "cm"));
a8(5, "area-unit-square-choice", "6\uC21803-16", 2, "\uC6D0 \uB113\uC774\uC640 \uC6D0\uC8FC \uB2E8\uC704 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC6D0\uC758 \uC6D0\uC8FC\uB97C \uAD6C\uD55C \uAC12\uC740 \uC5B4\uB5A4 \uB2E8\uC704\uB85C \uC801\uC2B5\uB2C8\uAE4C? \uAE38\uC774\uB294 m\uB85C \uC8FC\uC5B4\uC84C\uC2B5\uB2C8\uB2E4.", "m", [["m\xB2", "\uB113\uC774 \uB2E8\uC704\uC640 \uD63C\uB3D9"], ["m\xB3", "\uBD80\uD53C \uB2E8\uC704\uC640 \uD63C\uB3D9"]], "\uC6D0\uC8FC\uB294 \uB458\uB808\uC758 \uAE38\uC774\uC785\uB2C8\uB2E4."));
a8(5, "circumference-two-laps", "6\uC21803-16", 3, "\uC6D0\uC8FC\uC640 \uBC18\uBCF5 \uC774\uB3D9 \uAC70\uB9AC \uC5F0\uACB0\uD558\uAE30", () => E("\uC9C0\uB984 20 m\uC778 \uC6D0\uD615 \uAE38\uC744 \uB450 \uBC14\uD034 \uB3CC\uC558\uC2B5\uB2C8\uB2E4. \uC774\uB3D9 \uAC70\uB9AC\uB294 \uBA87 m\uC785\uB2C8\uAE4C? \uC6D0\uC8FC\uC728\uC740 3.14\uC785\uB2C8\uB2E4.", [20, "3.14", "*", 2, "*"], "\uD55C \uBC14\uD034\uC758 \uC6D0\uC8FC\uB97C \uB450 \uBC30 \uD558\uBA74 {answer} m\uC785\uB2C8\uB2E4.", "m"));
a8(5, "circle-plan-limit", "6\uC21803-16", 4, "\uC9C0\uB984\xB7\uC6D0\uC8FC\xB7\uC900\uBE44 \uAE38\uC774 \uC81C\uD55C \uD568\uAED8 \uD310\uB2E8\uD558\uAE30", () => C("\uC9C0\uB984 6 m\uC778 \uC6D0\uD615 \uD14C\uB450\uB9AC\uC5D0 \uB048\uC744 \uD55C \uBC14\uD034 \uB450\uB985\uB2C8\uB2E4. \uC6D0\uC8FC\uC728\uC740 3.14\uC774\uBA70 \uB048\uC740 18 m \uB610\uB294 19 m \uC911 \uACE0\uB985\uB2C8\uB2E4. \uBD80\uC871\uD558\uC9C0 \uC54A\uC740 \uAC00\uC7A5 \uC9E7\uC740 \uC900\uBE44 \uAE38\uC774\uB97C \uACE0\uB974\uC138\uC694.", "19 m", [["18 m", "\uC6D0\uC8FC 18.84 m\uBCF4\uB2E4 \uBD80\uC871"], ["\uB458 \uB2E4 \uCDA9\uBD84\uD558\uB2E4", "\uC815\uD655\uD55C \uC6D0\uC8FC \uBE44\uAD50 \uB204\uB77D"]], "\uC6D0\uC8FC\uB97C \uBA3C\uC800 \uAD6C\uD558\uACE0 \uC900\uBE44 \uAC00\uB2A5\uD55C \uAE38\uC774\uC640 \uBE44\uAD50\uD569\uB2C8\uB2E4."));
a8(6, "cylinder-net-width", "6\uC21803-08", 3, "\uC6D0\uAE30\uB465 \uBC11\uBA74 \uC9C0\uB984\uACFC \uC606\uBA74 \uAE38\uC774 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uC6D0\uAE30\uB465 \uBC11\uBA74 \uC9C0\uB984\uC740 ${4 + k} cm\uC785\uB2C8\uB2E4. \uD3BC\uCE5C \uC606\uBA74\uC758 \uC6D0\uC8FC\uC5D0 \uB300\uC751\uD558\uB294 \uBCC0\uC740 \uBA87 cm\uC785\uB2C8\uAE4C? \uC6D0\uC8FC\uC728\uC740 3.14\uC785\uB2C8\uB2E4.`, [4 + k, "3.14", "*"], "\uD574\uB2F9 \uBCC0\uC740 \uBC11\uBA74 \uC6D0\uC8FC\uC774\uBBC0\uB85C {answer} cm\uC785\uB2C8\uB2E4.", "cm"), 12);
a8(6, "cylinder-net-height-inverse", "6\uC21803-08", 3, "\uC804\uAC1C\uB3C4\uC5D0\uC11C \uB192\uC774 \uBC29\uD5A5\uC758 \uBCC0\uC744 \uC785\uCCB4\uC5D0 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uC6D0\uAE30\uB465\uC758 \uC606\uBA74 \uC9C1\uC0AC\uAC01\uD615\uC5D0\uC11C \uC6D0\uC8FC\uAC00 \uC544\uB2CC \uB192\uC774 \uBC29\uD5A5 \uBCC0\uC740 ${5 + k} cm\uC785\uB2C8\uB2E4. \uC6D0\uAE30\uB465 \uB192\uC774\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?`, [5 + k], "\uC774 \uBCC0\uC740 \uC6D0\uAE30\uB465 \uB192\uC774\uC5D0 \uB300\uC751\uD558\uBBC0\uB85C {answer} cm\uC785\uB2C8\uB2E4.", "cm"), 12);
a8(6, "cone-vertex", "6\uC21803-07", 1, "\uC6D0\uBFD4\uC758 \uAF2D\uC9D3\uC810 \uD655\uC778\uD558\uAE30", () => C("\uC6D0\uBFD4\uC758 \uAF2D\uC9D3\uC810\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", "1\uAC1C", [["2\uAC1C", "\uBC11\uBA74 \uC911\uC2EC\uAE4C\uC9C0 \uAF2D\uC9D3\uC810\uC73C\uB85C \uC148"], ["0\uAC1C", "\uAD6C\uC640 \uD63C\uB3D9"]], "\uC6D0\uBFD4\uC5D0\uB294 \uD55C \uAF2D\uB300\uAE30 \uC810\uC774 \uC788\uC2B5\uB2C8\uB2E4."));
a8(6, "sphere-all-curved", "6\uC21803-07", 2, "\uAD6C\uC758 \uD45C\uBA74\uACFC \uD3C9\uBA74 \uAD6C\uBCC4\uD558\uAE30", () => C("\uAD6C\uC758 \uD45C\uBA74\uC5D0 \uD3C9\uD3C9\uD55C \uB2E4\uAC01\uD615 \uBA74\uC774 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uB2E4\uBA74\uCCB4\uC758 \uBA74\uC744 \uAD6C\uC5D0 \uC801\uC6A9"]], "\uAD6C\uC758 \uD45C\uBA74\uC740 \uB465\uADFC \uACE1\uBA74\uC785\uB2C8\uB2E4."));
a8(6, "cylinder-cone-base-count", "6\uC21803-07", 2, "\uC6D0\uAE30\uB465\uACFC \uC6D0\uBFD4\uC758 \uBC11\uBA74 \uC218 \uBE44\uAD50\uD558\uAE30", () => C("\uC6D0\uAE30\uB465\uACFC \uC6D0\uBFD4\uC758 \uBC11\uBA74 \uC218\uB97C \uCC28\uB840\uB85C \uACE0\uB974\uC138\uC694.", "2\uAC1C, 1\uAC1C", [["1\uAC1C, 2\uAC1C", "\uB450 \uC785\uCCB4\uC758 \uC815\uC758\uB97C \uBC18\uB300\uB85C \uC801\uC6A9"], ["2\uAC1C, 2\uAC1C", "\uC6D0\uBFD4\uC744 \uC6D0\uAE30\uB465\uC73C\uB85C \uD310\uB2E8"]], "\uC6D0\uAE30\uB465\uC5D0\uB294 \uB450 \uBC11\uBA74, \uC6D0\uBFD4\uC5D0\uB294 \uD55C \uBC11\uBA74\uC774 \uC788\uC2B5\uB2C8\uB2E4."));
a8(6, "cylinder-straight-height", "6\uC21803-07", 3, "\uC6D0\uAE30\uB465 \uB192\uC774\uC640 \uBC11\uBA74 \uC0AC\uC774 \uAD00\uACC4 \uC774\uD574\uD558\uAE30", () => C("\uC6D0\uAE30\uB465 \uB192\uC774\uB97C \uBC14\uB974\uAC8C \uC124\uBA85\uD55C \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uB450 \uBC11\uBA74 \uC0AC\uC774\uC758 \uC218\uC9C1 \uAC70\uB9AC", [["\uBC11\uBA74\uC758 \uC6D0\uC8FC", "\uB192\uC774\uC640 \uB458\uB808 \uD63C\uB3D9"], ["\uBC11\uBA74 \uBC18\uC9C0\uB984", "\uB192\uC774\uC640 \uBC18\uC9C0\uB984 \uD63C\uB3D9"]], "\uB192\uC774\uB294 \uB450 \uBC11\uBA74 \uC0AC\uC774\uC758 \uC218\uC9C1 \uAC70\uB9AC\uC785\uB2C8\uB2E4."));
a8(6, "net-circles-same-size", "6\uC21803-08", 3, "\uC804\uAC1C\uB3C4\uC758 \uB450 \uC6D0 \uD06C\uAE30 \uC870\uAC74 \uD655\uC778\uD558\uAE30", () => C("\uC6D0\uAE30\uB465 \uC804\uAC1C\uB3C4\uC5D0\uC11C \uB450 \uC6D0\uC758 \uBC18\uC9C0\uB984\uC774 \uB2E4\uB985\uB2C8\uB2E4. \uC62C\uBC14\uB978 \uC804\uAC1C\uB3C4 \uC870\uAC74\uC5D0 \uB9DE\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uB450 \uBC11\uBA74 \uD569\uB3D9 \uC870\uAC74 \uB204\uB77D"]], "\uC6D0\uAE30\uB465\uC758 \uB450 \uBC11\uBA74\uC740 \uAC19\uC740 \uD06C\uAE30\uC785\uB2C8\uB2E4."));
a8(6, "net-circle-role", "6\uC21803-08", 2, "\uC804\uAC1C\uB3C4\uC5D0\uC11C \uC6D0\uACFC \uC9C1\uC0AC\uAC01\uD615 \uC5ED\uD560 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC6D0\uAE30\uB465 \uC804\uAC1C\uB3C4\uC758 \uB450 \uC6D0\uC740 \uC5B4\uB5A4 \uBA74\uC774 \uB429\uB2C8\uAE4C?", "\uBC11\uBA74", [["\uC606\uBA74", "\uBA74 \uC5ED\uD560 \uBC14\uAFC8"], ["\uBAA8\uC11C\uB9AC", "\uD3C9\uBA74\uACFC \uC120 \uD63C\uB3D9"]], "\uB450 \uC6D0\uC774 \uC11C\uB85C \uD3C9\uD589\uD55C \uBC11\uBA74\uC774 \uB429\uB2C8\uB2E4."));
a8(6, "net-width-height-separation", "6\uC21803-08", 3, "\uC606\uBA74\uC758 \uB450 \uBC29\uD5A5\uACFC \uBC11\uBA74 \uC815\uBCF4 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC6D0\uAE30\uB465 \uC804\uAC1C\uB3C4\uC5D0\uC11C \uD55C \uBCC0\uC740 \uB192\uC774\uC774\uACE0 \uB2E4\uB978 \uBCC0\uC740 \uBC11\uBA74 \uC6D0\uC8FC\uC785\uB2C8\uB2E4. \uB192\uC774\uAC00 \uCEE4\uC9C0\uACE0 \uBC11\uBA74 \uC6D0 \uD06C\uAE30\uB294 \uAC19\uC73C\uBA74 \uC6D0\uC8FC \uBC29\uD5A5 \uBCC0\uC740 \uC5B4\uB5BB\uAC8C \uB429\uB2C8\uAE4C?", "\uAC19\uB2E4", [["\uB192\uC774\uC640 \uD568\uAED8 \uCEE4\uC9C4\uB2E4", "\uB450 \uBC29\uD5A5\uC758 \uC5ED\uD560 \uD63C\uB3D9"], ["\uD56D\uC0C1 \uC904\uC5B4\uB4E0\uB2E4", "\uBC11\uBA74 \uC720\uC9C0 \uC870\uAC74 \uBB34\uC2DC"]], "\uBC11\uBA74 \uC6D0\uC774 \uAC19\uC73C\uBBC0\uB85C \uC6D0\uC8FC \uBC29\uD5A5 \uBCC0\uB3C4 \uAC19\uC2B5\uB2C8\uB2E4."));
a8(6, "solid-identification-two-features", "6\uC21803-07", 3, "\uBC11\uBA74 \uC218\uC640 \uAF2D\uC9D3\uC810 \uC815\uBCF4\uB85C \uC785\uCCB4 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC6D0\uC778 \uBC11\uBA74\uC774 \uD55C \uAC1C\uC774\uACE0 \uD55C \uAF2D\uB300\uAE30 \uC810\uC774 \uC788\uB294 \uC785\uCCB4\uB97C \uACE0\uB974\uC138\uC694.", "\uC6D0\uBFD4", [["\uC6D0\uAE30\uB465", "\uBC11\uBA74 \uC218\uC640 \uAF2D\uB300\uAE30 \uC870\uAC74 \uB204\uB77D"], ["\uAD6C", "\uBC11\uBA74\uACFC \uAF2D\uB300\uAE30\uAC00 \uC5C6\uC74C"]], "\uB450 \uC870\uAC74\uC774 \uC6D0\uBFD4\uC758 \uD2B9\uC9D5\uC785\uB2C8\uB2E4."));
a8(6, "net-seam-role", "6\uC21803-08", 3, "\uB192\uC774 \uBC29\uD5A5 \uB450 \uBCC0\uC744 \uC774\uC744 \uB54C \uC785\uCCB4 \uAD00\uACC4 \uD310\uB2E8\uD558\uAE30", () => C("\uC9C1\uC0AC\uAC01\uD615\uC758 \uC6D0\uC8FC \uBC29\uD5A5 \uBCC0\uC744 \uC704\uC544\uB798\uC5D0 \uB450\uACE0 \uB9D0\uC544 \uC6D0\uAE30\uB465 \uC606\uBA74\uC744 \uB9CC\uB4E4\uC5C8\uC2B5\uB2C8\uB2E4. \uC88C\uC6B0\uB97C \uC787\uB294 \uC774\uC74C\uC120\uC758 \uAE38\uC774\uB294 \uBB34\uC5C7\uACFC \uAC19\uC2B5\uB2C8\uAE4C?", "\uC6D0\uAE30\uB465\uC758 \uB192\uC774", [["\uBC11\uBA74 \uC9C0\uB984", "\uBCC0\uC758 \uC5ED\uD560 \uD63C\uB3D9"], ["\uBC11\uBA74 \uC6D0\uC8FC", "\uC6D0\uC8FC \uBC29\uD5A5\uACFC \uB192\uC774 \uBC29\uD5A5 \uD63C\uB3D9"]], "\uC88C\uC6B0\uC758 \uB192\uC774 \uBC29\uD5A5 \uB450 \uBCC0\uC774 \uC774\uC74C\uC120\uC73C\uB85C \uB9DE\uBD99\uC2B5\uB2C8\uB2E4."));
a8(6, "net-two-dimensions-plan", "6\uC21803-08", 3, "\uBC11\uBA74 \uC6D0\uC8FC\uC640 \uB192\uC774 \uC870\uAC74\uC73C\uB85C \uC606\uBA74 \uCE58\uC218 \uC120\uD0DD\uD558\uAE30", () => C("\uBC11\uBA74 \uC9C0\uB984\uC740 4 cm, \uC6D0\uAE30\uB465 \uB192\uC774\uB294 6 cm\uC785\uB2C8\uB2E4. \uC6D0\uC8FC\uC728 3.14\uB85C \uACC4\uC0B0\uD55C \uC606\uBA74 \uC9C1\uC0AC\uAC01\uD615\uC758 \uB450 \uBCC0 \uAE38\uC774\uB97C \uACE0\uB974\uC138\uC694.", "12.56 cm\uC640 6 cm", [["6.28 cm\uC640 6 cm", "\uC9C0\uB984\uC744 \uBC18\uC9C0\uB984\uC73C\uB85C \uD63C\uB3D9"], ["12.56 cm\uC640 4 cm", "\uB192\uC774 \uB300\uC2E0 \uC9C0\uB984 \uC0AC\uC6A9"]], "\uC6D0\uC8FC \uBC29\uD5A5\uC740 4 \xD7 3.14\uC774\uACE0 \uB192\uC774 \uBC29\uD5A5\uC740 6 cm\uC785\uB2C8\uB2E4."));

// learning-review-r1/native/data/upper-legacy-content.js
var upperLegacyContent = [
  {
    "sourceId": "MATH-G4-q_s1_u2_diff3",
    "grade": 4,
    "semester": 1,
    "unitId": "sem1_unit2",
    "code": "4\uC21803-25",
    "difficulty": 3,
    "question": "\uC0BC\uAC01\uD615\uC5D0\uC11C \uD55C \uAC01\uC740 90\xB0(\uC9C1\uAC01)\uC774\uACE0, \uB2E4\uB978 \uD55C \uAC01\uC740 38\xB0\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uD55C \uAC01\uC758 \uD06C\uAE30\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "tokens": [
      180,
      90,
      "-",
      38,
      "-"
    ],
    "unit": "\xB0",
    "payload": {
      "question": "\uC0BC\uAC01\uD615\uC5D0\uC11C \uD55C \uAC01\uC740 90\xB0(\uC9C1\uAC01)\uC774\uACE0, \uB2E4\uB978 \uD55C \uAC01\uC740 38\xB0\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uD55C \uAC01\uC758 \uD06C\uAE30\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
      "explanation": "\uC0BC\uAC01\uD615\uC758 \uC138 \uB0B4\uAC01\uC758 \uD569\uC740 180\xB0\uC785\uB2C8\uB2E4. \uC9C1\uAC01 90\xB0\uC640 \uC8FC\uC5B4\uC9C4 \uC608\uAC01\uC744 \uBE7C\uBA74 \uB098\uBA38\uC9C0 \uC608\uAC01\uC774 \uB429\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 52 \xB0\uC785\uB2C8\uB2E4.",
      "answer": "52",
      "unit": "\xB0",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "180",
            "90",
            "-",
            "38",
            "-"
          ]
        },
        "unit": "\xB0",
        "prompt": "\uC0BC\uAC01\uD615\uC5D0\uC11C \uD55C \uAC01\uC740 90\xB0(\uC9C1\uAC01)\uC774\uACE0, \uB2E4\uB978 \uD55C \uAC01\uC740 38\xB0\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uD55C \uAC01\uC758 \uD06C\uAE30\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "52"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "52",
          "reason": ""
        },
        {
          "text": "42",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "62",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "48",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC0BC\uAC01\uD615\uC5D0\uC11C \uD55C \uAC01\uC740 90\xB0(\uC9C1\uAC01)\uC774\uACE0, \uB2E4\uB978 \uD55C \uAC01\uC740 38\xB0\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uD55C \uAC01\uC758 \uD06C\uAE30\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "opt_1",
        "text": "52\xB0"
      },
      {
        "id": "opt_2",
        "text": "42\xB0"
      },
      {
        "id": "opt_3",
        "text": "62\xB0"
      },
      {
        "id": "opt_4",
        "text": "48\xB0"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s1_u2_diff3-TWIN",
    "grade": 4,
    "semester": 1,
    "unitId": "sem1_unit2",
    "code": "4\uC21803-25",
    "difficulty": 3,
    "question": "\uC9C1\uAC01\uC0BC\uAC01\uD615\uC758 \uD55C \uC608\uAC01\uC774 47\xB0\uC77C \uB54C, \uB2E4\uB978 \uD55C \uC608\uAC01\uC758 \uD06C\uAE30\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "tokens": [
      90,
      47,
      "-"
    ],
    "unit": "\xB0",
    "payload": {
      "question": "\uC9C1\uAC01\uC0BC\uAC01\uD615\uC758 \uD55C \uC608\uAC01\uC774 47\xB0\uC77C \uB54C, \uB2E4\uB978 \uD55C \uC608\uAC01\uC758 \uD06C\uAE30\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
      "explanation": "\uC0BC\uAC01\uD615\uC758 \uC138 \uB0B4\uAC01\uC758 \uD569\uC740 180\xB0\uC785\uB2C8\uB2E4. \uC9C1\uAC01 90\xB0\uC640 \uC8FC\uC5B4\uC9C4 \uC608\uAC01\uC744 \uBE7C\uBA74 \uB098\uBA38\uC9C0 \uC608\uAC01\uC774 \uB429\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 43 \xB0\uC785\uB2C8\uB2E4.",
      "answer": "43",
      "unit": "\xB0",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "90",
            "47",
            "-"
          ]
        },
        "unit": "\xB0",
        "prompt": "\uC9C1\uAC01\uC0BC\uAC01\uD615\uC758 \uD55C \uC608\uAC01\uC774 47\xB0\uC77C \uB54C, \uB2E4\uB978 \uD55C \uC608\uAC01\uC758 \uD06C\uAE30\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "43"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "43",
          "reason": ""
        },
        {
          "text": "53",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "33",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "47",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC9C1\uAC01\uC0BC\uAC01\uD615\uC758 \uD55C \uC608\uAC01\uC774 47\xB0\uC77C \uB54C, \uB2E4\uB978 \uD55C \uC608\uAC01\uC758 \uD06C\uAE30\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "43\xB0"
      },
      {
        "id": "t_opt_2",
        "text": "53\xB0"
      },
      {
        "id": "t_opt_3",
        "text": "33\xB0"
      },
      {
        "id": "t_opt_4",
        "text": "47\xB0"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s1_u2_diff4-TWIN",
    "grade": 4,
    "semester": 1,
    "unitId": "sem1_unit2",
    "code": "4\uC21803-25",
    "difficulty": 4,
    "question": "\uC0AC\uAC01\uD615\uC758 \uB124 \uAC01 \uC911 \uC138 \uAC01\uC774 70\xB0, 120\xB0, 80\xB0\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uD55C \uAC01\uC758 \uD06C\uAE30\uB294 \uBA87 \uB3C4\uC77C\uAE4C\uC694?",
    "tokens": [
      360,
      70,
      "-",
      120,
      "-",
      80,
      "-"
    ],
    "unit": "\xB0",
    "payload": {
      "question": "\uC0AC\uAC01\uD615\uC758 \uB124 \uAC01 \uC911 \uC138 \uAC01\uC774 70\xB0, 120\xB0, 80\xB0\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uD55C \uAC01\uC758 \uD06C\uAE30\uB294 \uBA87 \uB3C4\uC77C\uAE4C\uC694?",
      "explanation": "\uC0AC\uAC01\uD615\uC758 \uB124 \uB0B4\uAC01\uC758 \uD569\uC740 360\xB0\uC785\uB2C8\uB2E4. \uC8FC\uC5B4\uC9C4 \uC138 \uAC01\uC758 \uD569\uC744 \uBE7C\uBA74 \uB098\uBA38\uC9C0 \uAC01\uC774 \uB429\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 90 \xB0\uC785\uB2C8\uB2E4.",
      "answer": "90",
      "unit": "\xB0",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "360",
            "70",
            "-",
            "120",
            "-",
            "80",
            "-"
          ]
        },
        "unit": "\xB0",
        "prompt": "\uC0AC\uAC01\uD615\uC758 \uB124 \uAC01 \uC911 \uC138 \uAC01\uC774 70\xB0, 120\xB0, 80\xB0\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uD55C \uAC01\uC758 \uD06C\uAE30\uB294 \uBA87 \uB3C4\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "90"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "90",
          "reason": ""
        },
        {
          "text": "100",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "80",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "110",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC0AC\uAC01\uD615\uC758 \uB124 \uAC01 \uC911 \uC138 \uAC01\uC774 70\xB0, 120\xB0, 80\xB0\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uD55C \uAC01\uC758 \uD06C\uAE30\uB294 \uBA87 \uB3C4\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "90\xB0"
      },
      {
        "id": "t_opt_2",
        "text": "100\xB0"
      },
      {
        "id": "t_opt_3",
        "text": "80\xB0"
      },
      {
        "id": "t_opt_4",
        "text": "110\xB0"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s1_u3_diff1",
    "grade": 4,
    "semester": 1,
    "unitId": "sem1_unit3",
    "code": "4\uC21801-04",
    "difficulty": 1,
    "question": "\uC2DD [ \u25A1 \xD7 7 = 350 ] \uC5D0\uC11C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC54C\uB9DE\uC740 \uC218\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "tokens": [
      350,
      7,
      "/"
    ],
    "unit": "",
    "payload": {
      "question": "\uC2DD [ \u25A1 \xD7 7 = 350 ] \uC5D0\uC11C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC54C\uB9DE\uC740 \uC218\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
      "explanation": "\uACF1\uC744 \uC54C\uACE0 \uD55C \uACF1\uD558\uB294 \uC218\uB97C \uC54C \uB54C, \uACF1\uC744 \uC54C\uB824\uC9C4 \uC218\uB85C \uB098\uB204\uBA74 \uBE60\uC9C4 \uACF1\uD558\uB294 \uC218\uAC00 \uB429\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 50\uC785\uB2C8\uB2E4.",
      "answer": "50",
      "unit": "",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "350",
            "7",
            "/"
          ]
        },
        "unit": "",
        "prompt": "\uC2DD [ \u25A1 \xD7 7 = 350 ] \uC5D0\uC11C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC54C\uB9DE\uC740 \uC218\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "50"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "50",
          "reason": ""
        },
        {
          "text": "5",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "500",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "60",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC2DD [ \u25A1 \xD7 7 = 350 ] \uC5D0\uC11C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC54C\uB9DE\uC740 \uC218\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "opt_1",
        "text": "50"
      },
      {
        "id": "opt_2",
        "text": "5"
      },
      {
        "id": "opt_3",
        "text": "500"
      },
      {
        "id": "opt_4",
        "text": "60"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s1_u3_diff1-TWIN",
    "grade": 4,
    "semester": 1,
    "unitId": "sem1_unit3",
    "code": "4\uC21801-04",
    "difficulty": 1,
    "question": "\uC2DD [ 40 \xD7 \u25A1 = 360 ] \uC5D0\uC11C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC54C\uB9DE\uC740 \uC218\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "tokens": [
      360,
      40,
      "/"
    ],
    "unit": "",
    "payload": {
      "question": "\uC2DD [ 40 \xD7 \u25A1 = 360 ] \uC5D0\uC11C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC54C\uB9DE\uC740 \uC218\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
      "explanation": "\uACF1\uC744 \uC54C\uACE0 \uD55C \uACF1\uD558\uB294 \uC218\uB97C \uC54C \uB54C, \uACF1\uC744 \uC54C\uB824\uC9C4 \uC218\uB85C \uB098\uB204\uBA74 \uBE60\uC9C4 \uACF1\uD558\uB294 \uC218\uAC00 \uB429\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 9\uC785\uB2C8\uB2E4.",
      "answer": "9",
      "unit": "",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "360",
            "40",
            "/"
          ]
        },
        "unit": "",
        "prompt": "\uC2DD [ 40 \xD7 \u25A1 = 360 ] \uC5D0\uC11C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC54C\uB9DE\uC740 \uC218\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "9"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "9",
          "reason": ""
        },
        {
          "text": "90",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "8",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "7",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC2DD [ 40 \xD7 \u25A1 = 360 ] \uC5D0\uC11C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC54C\uB9DE\uC740 \uC218\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "9"
      },
      {
        "id": "t_opt_2",
        "text": "90"
      },
      {
        "id": "t_opt_3",
        "text": "8"
      },
      {
        "id": "t_opt_4",
        "text": "7"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s1_u3_diff2-TWIN",
    "grade": 4,
    "semester": 1,
    "unitId": "sem1_unit3",
    "code": "4\uC21801-07",
    "difficulty": 2,
    "question": "\uC0AC\uD0D5 180\uAC1C\uB97C \uD55C \uBD09\uC9C0\uC5D0 20\uAC1C\uC529 \uB611\uAC19\uC774 \uB098\uB204\uC5B4 \uB2F4\uC73C\uB824\uACE0 \uD569\uB2C8\uB2E4. \uBA87 \uBD09\uC9C0\uAC00 \uB420\uAE4C\uC694?",
    "tokens": [
      180,
      20,
      "/"
    ],
    "unit": "\uBD09\uC9C0",
    "payload": {
      "question": "\uC0AC\uD0D5 180\uAC1C\uB97C \uD55C \uBD09\uC9C0\uC5D0 20\uAC1C\uC529 \uB611\uAC19\uC774 \uB098\uB204\uC5B4 \uB2F4\uC73C\uB824\uACE0 \uD569\uB2C8\uB2E4. \uBA87 \uBD09\uC9C0\uAC00 \uB420\uAE4C\uC694?",
      "explanation": "\uC804\uCCB4 \uC0AC\uD0D5 \uC218\uB97C \uD55C \uBD09\uC9C0\uC758 \uC0AC\uD0D5 \uC218\uB85C \uB098\uB204\uC5B4 \uBD09\uC9C0 \uC218\uB97C \uAD6C\uD569\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 9 \uBD09\uC9C0\uC785\uB2C8\uB2E4.",
      "answer": "9",
      "unit": "\uBD09\uC9C0",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "180",
            "20",
            "/"
          ]
        },
        "unit": "\uBD09\uC9C0",
        "prompt": "\uC0AC\uD0D5 180\uAC1C\uB97C \uD55C \uBD09\uC9C0\uC5D0 20\uAC1C\uC529 \uB611\uAC19\uC774 \uB098\uB204\uC5B4 \uB2F4\uC73C\uB824\uACE0 \uD569\uB2C8\uB2E4. \uBA87 \uBD09\uC9C0\uAC00 \uB420\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "9"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "9",
          "reason": ""
        },
        {
          "text": "8",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "90",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "7",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC0AC\uD0D5 180\uAC1C\uB97C \uD55C \uBD09\uC9C0\uC5D0 20\uAC1C\uC529 \uB611\uAC19\uC774 \uB098\uB204\uC5B4 \uB2F4\uC73C\uB824\uACE0 \uD569\uB2C8\uB2E4. \uBA87 \uBD09\uC9C0\uAC00 \uB420\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "9\uBD09\uC9C0"
      },
      {
        "id": "t_opt_2",
        "text": "8\uBD09\uC9C0"
      },
      {
        "id": "t_opt_3",
        "text": "90\uBD09\uC9C0"
      },
      {
        "id": "t_opt_4",
        "text": "7\uBD09\uC9C0"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s1_u3_diff3-TWIN",
    "grade": 4,
    "semester": 1,
    "unitId": "sem1_unit3",
    "code": "4\uC21801-07",
    "difficulty": 3,
    "question": "\uB098\uB217\uC148\uC5D0\uC11C \uB098\uB204\uB294 \uC218\uAC00 15\uC77C \uB54C \uB098\uC62C \uC218 \uC788\uB294 \uAC00\uC7A5 \uD070 \uB098\uBA38\uC9C0\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "tokens": [
      15,
      1,
      "-"
    ],
    "unit": "",
    "payload": {
      "question": "\uB098\uB217\uC148\uC5D0\uC11C \uB098\uB204\uB294 \uC218\uAC00 15\uC77C \uB54C \uB098\uC62C \uC218 \uC788\uB294 \uAC00\uC7A5 \uD070 \uB098\uBA38\uC9C0\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
      "explanation": "\uB098\uBA38\uC9C0\uB294 \uB098\uB204\uB294 \uC218\uBCF4\uB2E4 \uC791\uC544\uC57C \uD569\uB2C8\uB2E4. \uAC00\uC7A5 \uD070 \uB098\uBA38\uC9C0\uB294 \uB098\uB204\uB294 \uC218\uBCF4\uB2E4 1 \uC791\uC2B5\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 14\uC785\uB2C8\uB2E4.",
      "answer": "14",
      "unit": "",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "15",
            "1",
            "-"
          ]
        },
        "unit": "",
        "prompt": "\uB098\uB217\uC148\uC5D0\uC11C \uB098\uB204\uB294 \uC218\uAC00 15\uC77C \uB54C \uB098\uC62C \uC218 \uC788\uB294 \uAC00\uC7A5 \uD070 \uB098\uBA38\uC9C0\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "14"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "14",
          "reason": ""
        },
        {
          "text": "15",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "16",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "10",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uB098\uB217\uC148\uC5D0\uC11C \uB098\uB204\uB294 \uC218\uAC00 15\uC77C \uB54C \uB098\uC62C \uC218 \uC788\uB294 \uAC00\uC7A5 \uD070 \uB098\uBA38\uC9C0\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "14"
      },
      {
        "id": "t_opt_2",
        "text": "15"
      },
      {
        "id": "t_opt_3",
        "text": "16"
      },
      {
        "id": "t_opt_4",
        "text": "10"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s1_u3_diff4",
    "grade": 4,
    "semester": 1,
    "unitId": "sem1_unit3",
    "code": "4\uC21801-07",
    "difficulty": 4,
    "question": "\uC5B4\uB5A4 \uC218\uB97C 26\uC73C\uB85C \uB098\uB204\uC5B4\uC57C \uD560 \uAC83\uC744 \uC798\uBABB\uD558\uC5EC \uACF1\uD588\uB354\uB2C8 676\uC774 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACC4\uC0B0\uD588\uC744 \uB54C\uC758 \uBAAB\uC740 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "tokens": [
      676,
      26,
      "/",
      26,
      "/"
    ],
    "unit": "",
    "payload": {
      "question": "\uC5B4\uB5A4 \uC218\uB97C 26\uC73C\uB85C \uB098\uB204\uC5B4\uC57C \uD560 \uAC83\uC744 \uC798\uBABB\uD558\uC5EC \uACF1\uD588\uB354\uB2C8 676\uC774 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACC4\uC0B0\uD588\uC744 \uB54C\uC758 \uBAAB\uC740 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
      "explanation": "\uC798\uBABB \uACF1\uD55C \uACB0\uACFC\uB97C \uACF1\uD55C \uC218\uB85C \uB098\uB204\uC5B4 \uCC98\uC74C \uC218\uB97C \uCC3E\uACE0, \uADF8 \uCC98\uC74C \uC218\uB97C \uB2E4\uC2DC \uB098\uB204\uB294 \uC218\uB85C \uB098\uB215\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 1\uC785\uB2C8\uB2E4.",
      "answer": "1",
      "unit": "",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "676",
            "26",
            "/",
            "26",
            "/"
          ]
        },
        "unit": "",
        "prompt": "\uC5B4\uB5A4 \uC218\uB97C 26\uC73C\uB85C \uB098\uB204\uC5B4\uC57C \uD560 \uAC83\uC744 \uC798\uBABB\uD558\uC5EC \uACF1\uD588\uB354\uB2C8 676\uC774 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACC4\uC0B0\uD588\uC744 \uB54C\uC758 \uBAAB\uC740 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "1"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "1",
          "reason": ""
        },
        {
          "text": "26",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "0",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "2",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC5B4\uB5A4 \uC218\uB97C 26\uC73C\uB85C \uB098\uB204\uC5B4\uC57C \uD560 \uAC83\uC744 \uC798\uBABB\uD558\uC5EC \uACF1\uD588\uB354\uB2C8 676\uC774 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACC4\uC0B0\uD588\uC744 \uB54C\uC758 \uBAAB\uC740 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "opt_1",
        "text": "1"
      },
      {
        "id": "opt_2",
        "text": "26"
      },
      {
        "id": "opt_3",
        "text": "0"
      },
      {
        "id": "opt_4",
        "text": "2"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s1_u3_diff4-TWIN",
    "grade": 4,
    "semester": 1,
    "unitId": "sem1_unit3",
    "code": "4\uC21801-04",
    "difficulty": 4,
    "question": "\uC5B4\uB5A4 \uC218\uC5D0 14\uB97C \uACF1\uD574\uC57C \uD560 \uAC83\uC744 \uC798\uBABB\uD558\uC5EC \uB354\uD588\uB354\uB2C8 38\uC774 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACC4\uC0B0\uD55C \uACF1\uC148 \uACB0\uACFC\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "tokens": [
      38,
      14,
      "-",
      14,
      "*"
    ],
    "unit": "",
    "payload": {
      "question": "\uC5B4\uB5A4 \uC218\uC5D0 14\uB97C \uACF1\uD574\uC57C \uD560 \uAC83\uC744 \uC798\uBABB\uD558\uC5EC \uB354\uD588\uB354\uB2C8 38\uC774 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACC4\uC0B0\uD55C \uACF1\uC148 \uACB0\uACFC\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
      "explanation": "\uC798\uBABB \uB354\uD55C \uAC12\uC744 \uBA3C\uC800 \uBE7C\uC11C \uCC98\uC74C \uC218\uB97C \uCC3E\uACE0, \uADF8 \uC218\uC5D0 \uC8FC\uC5B4\uC9C4 \uC218\uB97C \uACF1\uD569\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 336\uC785\uB2C8\uB2E4.",
      "answer": "336",
      "unit": "",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "38",
            "14",
            "-",
            "14",
            "*"
          ]
        },
        "unit": "",
        "prompt": "\uC5B4\uB5A4 \uC218\uC5D0 14\uB97C \uACF1\uD574\uC57C \uD560 \uAC83\uC744 \uC798\uBABB\uD558\uC5EC \uB354\uD588\uB354\uB2C8 38\uC774 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACC4\uC0B0\uD55C \uACF1\uC148 \uACB0\uACFC\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "336"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "336",
          "reason": ""
        },
        {
          "text": "320",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "346",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "350",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC5B4\uB5A4 \uC218\uC5D0 14\uB97C \uACF1\uD574\uC57C \uD560 \uAC83\uC744 \uC798\uBABB\uD558\uC5EC \uB354\uD588\uB354\uB2C8 38\uC774 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACC4\uC0B0\uD55C \uACF1\uC148 \uACB0\uACFC\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "336"
      },
      {
        "id": "t_opt_2",
        "text": "320"
      },
      {
        "id": "t_opt_3",
        "text": "346"
      },
      {
        "id": "t_opt_4",
        "text": "350"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u1_diff1",
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit1",
    "code": "4\uC21801-15",
    "difficulty": 1,
    "question": "\uB2E4\uC74C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC54C\uB9DE\uC740 \uBD84\uC218\uB97C \uACE0\uB974\uC138\uC694.\n\n2/9 + \u25A1 = 7/9",
    "tokens": [
      "7/9",
      "2/9",
      "-"
    ],
    "unit": "",
    "payload": {
      "question": "\uB2E4\uC74C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC54C\uB9DE\uC740 \uBD84\uC218\uB97C \uACE0\uB974\uC138\uC694. 2/9 + \u25A1 = 7/9",
      "explanation": "\uBD84\uBAA8\uAC00 \uAC19\uC740 \uBD84\uC218\uC758 \uB367\uC148\uC5D0\uC11C \uD569\uC744 \uC54C\uACE0 \uD55C \uBD84\uC218\uB97C \uC54C \uB54C, \uD569\uC5D0\uC11C \uC54C\uB824\uC9C4 \uBD84\uC218\uB97C \uBE8D\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 5/9\uC785\uB2C8\uB2E4.",
      "answer": "5/9",
      "unit": "",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "7/9",
            "2/9",
            "-"
          ]
        },
        "unit": "",
        "prompt": "\uB2E4\uC74C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC54C\uB9DE\uC740 \uBD84\uC218\uB97C \uACE0\uB974\uC138\uC694. 2/9 + \u25A1 = 7/9",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "5/9"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "5/9",
          "reason": ""
        },
        {
          "text": "9/9",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "5/18",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "4/9",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uB2E4\uC74C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC54C\uB9DE\uC740 \uBD84\uC218\uB97C \uACE0\uB974\uC138\uC694.\n\n[FRACTION:2/9] + \u25A1 = [FRACTION:7/9]",
    "originalChoices": [
      {
        "id": "opt_1",
        "text": "5/9",
        "mathValue": {
          "numerator": 5,
          "denominator": 9
        }
      },
      {
        "id": "opt_2",
        "text": "9/9",
        "mathValue": {
          "numerator": 9,
          "denominator": 9
        }
      },
      {
        "id": "opt_3",
        "text": "5/18",
        "mathValue": {
          "numerator": 5,
          "denominator": 18
        }
      },
      {
        "id": "opt_4",
        "text": "4/9",
        "mathValue": {
          "numerator": 4,
          "denominator": 9
        }
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u1_diff1-TWIN",
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit1",
    "code": "4\uC21801-15",
    "difficulty": 1,
    "question": "\uB2E4\uC74C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC54C\uB9DE\uC740 \uBD84\uC218\uB97C \uAD6C\uD558\uC138\uC694.\n\n2/8 + \u25A1 = 7/8",
    "tokens": [
      "7/8",
      "1/4",
      "-"
    ],
    "unit": "",
    "payload": {
      "question": "\uB2E4\uC74C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC54C\uB9DE\uC740 \uBD84\uC218\uB97C \uAD6C\uD558\uC138\uC694. 2/8 + \u25A1 = 7/8",
      "explanation": "\uBD84\uBAA8\uAC00 \uAC19\uC740 \uBD84\uC218\uC758 \uB367\uC148\uC5D0\uC11C \uD569\uC744 \uC54C\uACE0 \uD55C \uBD84\uC218\uB97C \uC54C \uB54C, \uD569\uC5D0\uC11C \uC54C\uB824\uC9C4 \uBD84\uC218\uB97C \uBE8D\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 5/8\uC785\uB2C8\uB2E4.",
      "answer": "5/8",
      "unit": "",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "7/8",
            "1/4",
            "-"
          ]
        },
        "unit": "",
        "prompt": "\uB2E4\uC74C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC54C\uB9DE\uC740 \uBD84\uC218\uB97C \uAD6C\uD558\uC138\uC694. 2/8 + \u25A1 = 7/8",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "5/8"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "5/8",
          "reason": ""
        },
        {
          "text": "1/8",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "5/16",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "6/8",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uB2E4\uC74C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC54C\uB9DE\uC740 \uBD84\uC218\uB97C \uAD6C\uD558\uC138\uC694.\n\n[FRACTION:2/8] + \u25A1 = [FRACTION:7/8]",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "5/8",
        "mathValue": {
          "numerator": 5,
          "denominator": 8
        }
      },
      {
        "id": "t_opt_2",
        "text": "1/8",
        "mathValue": {
          "numerator": 1,
          "denominator": 8
        }
      },
      {
        "id": "t_opt_3",
        "text": "5/16",
        "mathValue": {
          "numerator": 5,
          "denominator": 16
        }
      },
      {
        "id": "t_opt_4",
        "text": "6/8",
        "mathValue": {
          "numerator": 6,
          "denominator": 8
        }
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u1_diff2",
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit1",
    "code": "4\uC21801-15",
    "difficulty": 2,
    "question": "\uC9C0\uC6B0\uB294 \uC8FC\uC2A4\uB97C \uC5B4\uC81C 3/10L \uB9C8\uC168\uACE0, \uC624\uB298 4/10L \uB9C8\uC168\uC2B5\uB2C8\uB2E4. \uC9C0\uC6B0\uAC00 \uC774\uD2C0 \uB3D9\uC548 \uB9C8\uC2E0 \uC8FC\uC2A4\uB294 \uBAA8\uB450 \uBA87 L\uC77C\uAE4C\uC694?",
    "tokens": [
      "3/10",
      "2/5",
      "+"
    ],
    "unit": "L",
    "payload": {
      "question": "\uC9C0\uC6B0\uB294 \uC8FC\uC2A4\uB97C \uC5B4\uC81C 3/10 L \uB9C8\uC168\uACE0, \uC624\uB298 4/10 L \uB9C8\uC168\uC2B5\uB2C8\uB2E4. \uC9C0\uC6B0\uAC00 \uC774\uD2C0 \uB3D9\uC548 \uB9C8\uC2E0 \uC8FC\uC2A4\uB294 \uBAA8\uB450 \uBA87 L\uC77C\uAE4C\uC694?",
      "explanation": "\uAC19\uC740 \uD06C\uAE30\uC758 \uBD84\uC218 \uC870\uAC01\uC744 \uD569\uD558\uBBC0\uB85C \uBD84\uBAA8\uB294 \uC720\uC9C0\uD558\uACE0 \uBD84\uC790\uB97C \uB354\uD569\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 7/10 L\uC785\uB2C8\uB2E4.",
      "answer": "7/10",
      "unit": "L",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "3/10",
            "2/5",
            "+"
          ]
        },
        "unit": "L",
        "prompt": "\uC9C0\uC6B0\uB294 \uC8FC\uC2A4\uB97C \uC5B4\uC81C 3/10 L \uB9C8\uC168\uACE0, \uC624\uB298 4/10 L \uB9C8\uC168\uC2B5\uB2C8\uB2E4. \uC9C0\uC6B0\uAC00 \uC774\uD2C0 \uB3D9\uC548 \uB9C8\uC2E0 \uC8FC\uC2A4\uB294 \uBAA8\uB450 \uBA87 L\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "7/10"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "7/10",
          "reason": ""
        },
        {
          "text": "3/10",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "7/20",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "8/10",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC9C0\uC6B0\uB294 \uC8FC\uC2A4\uB97C \uC5B4\uC81C [FRACTION:3/10]L \uB9C8\uC168\uACE0, \uC624\uB298 [FRACTION:4/10]L \uB9C8\uC168\uC2B5\uB2C8\uB2E4. \uC9C0\uC6B0\uAC00 \uC774\uD2C0 \uB3D9\uC548 \uB9C8\uC2E0 \uC8FC\uC2A4\uB294 \uBAA8\uB450 \uBA87 L\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "opt_1",
        "text": "7/10",
        "mathValue": {
          "numerator": 7,
          "denominator": 10
        }
      },
      {
        "id": "opt_2",
        "text": "3/10",
        "mathValue": {
          "numerator": 3,
          "denominator": 10
        }
      },
      {
        "id": "opt_3",
        "text": "7/20",
        "mathValue": {
          "numerator": 7,
          "denominator": 20
        }
      },
      {
        "id": "opt_4",
        "text": "8/10",
        "mathValue": {
          "numerator": 8,
          "denominator": 10
        }
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u1_diff2-TWIN",
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit1",
    "code": "4\uC21801-15",
    "difficulty": 2,
    "question": "\uBBFC\uC218\uB294 \uC624\uC804\uC5D0 \uBB3C\uC744 2/9L \uB9C8\uC168\uACE0, \uC624\uD6C4\uC5D0 5/9L \uB9C8\uC168\uC2B5\uB2C8\uB2E4. \uBBFC\uC218\uAC00 \uC624\uB298 \uD558\uB8E8 \uB3D9\uC548 \uB9C8\uC2E0 \uBB3C\uC740 \uBAA8\uB450 \uBA87 L\uC77C\uAE4C\uC694?",
    "tokens": [
      "2/9",
      "5/9",
      "+"
    ],
    "unit": "L",
    "payload": {
      "question": "\uBBFC\uC218\uB294 \uC624\uC804\uC5D0 \uBB3C\uC744 2/9 L \uB9C8\uC168\uACE0, \uC624\uD6C4\uC5D0 5/9 L \uB9C8\uC168\uC2B5\uB2C8\uB2E4. \uBBFC\uC218\uAC00 \uC624\uB298 \uD558\uB8E8 \uB3D9\uC548 \uB9C8\uC2E0 \uBB3C\uC740 \uBAA8\uB450 \uBA87 L\uC77C\uAE4C\uC694?",
      "explanation": "\uAC19\uC740 \uD06C\uAE30\uC758 \uBD84\uC218 \uC870\uAC01\uC744 \uD569\uD558\uBBC0\uB85C \uBD84\uBAA8\uB294 \uC720\uC9C0\uD558\uACE0 \uBD84\uC790\uB97C \uB354\uD569\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 7/9 L\uC785\uB2C8\uB2E4.",
      "answer": "7/9",
      "unit": "L",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "2/9",
            "5/9",
            "+"
          ]
        },
        "unit": "L",
        "prompt": "\uBBFC\uC218\uB294 \uC624\uC804\uC5D0 \uBB3C\uC744 2/9 L \uB9C8\uC168\uACE0, \uC624\uD6C4\uC5D0 5/9 L \uB9C8\uC168\uC2B5\uB2C8\uB2E4. \uBBFC\uC218\uAC00 \uC624\uB298 \uD558\uB8E8 \uB3D9\uC548 \uB9C8\uC2E0 \uBB3C\uC740 \uBAA8\uB450 \uBA87 L\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "7/9"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "7/9",
          "reason": ""
        },
        {
          "text": "3/9",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "7/18",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "8/9",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uBBFC\uC218\uB294 \uC624\uC804\uC5D0 \uBB3C\uC744 [FRACTION:2/9]L \uB9C8\uC168\uACE0, \uC624\uD6C4\uC5D0 [FRACTION:5/9]L \uB9C8\uC168\uC2B5\uB2C8\uB2E4. \uBBFC\uC218\uAC00 \uC624\uB298 \uD558\uB8E8 \uB3D9\uC548 \uB9C8\uC2E0 \uBB3C\uC740 \uBAA8\uB450 \uBA87 L\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "7/9",
        "mathValue": {
          "numerator": 7,
          "denominator": 9
        }
      },
      {
        "id": "t_opt_2",
        "text": "3/9",
        "mathValue": {
          "numerator": 3,
          "denominator": 9
        }
      },
      {
        "id": "t_opt_3",
        "text": "7/18",
        "mathValue": {
          "numerator": 7,
          "denominator": 18
        }
      },
      {
        "id": "t_opt_4",
        "text": "8/9",
        "mathValue": {
          "numerator": 8,
          "denominator": 9
        }
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u1_diff4",
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit1",
    "code": "4\uC21801-15",
    "difficulty": 4,
    "question": "\uBBFC\uC218\uAC00 \uBE75\uC744 \uB9CC\uB4DC\uB294 \uB370 \uBC00\uAC00\uB8E8 2 3/8kg\uC744 \uC37C\uACE0, \uC124\uD0D5\uC740 \uBC00\uAC00\uB8E8\uBCF4\uB2E4 1 5/8kg \uC801\uAC8C \uC37C\uC2B5\uB2C8\uB2E4. \uBC00\uAC00\uB8E8\uC640 \uC124\uD0D5\uC744 \uD569\uCCD0 \uBAA8\uB450 \uBA87 kg \uC37C\uC744\uAE4C\uC694?",
    "tokens": [
      "19/8",
      "19/8",
      "+",
      "13/8",
      "-"
    ],
    "unit": "kg",
    "payload": {
      "question": "\uBBFC\uC218\uAC00 \uBE75\uC744 \uB9CC\uB4DC\uB294 \uB370 \uBC00\uAC00\uB8E8 2 3/8 kg\uC744 \uC37C\uACE0, \uC124\uD0D5\uC740 \uBC00\uAC00\uB8E8\uBCF4\uB2E4 1 5/8 kg \uC801\uAC8C \uC37C\uC2B5\uB2C8\uB2E4. \uBC00\uAC00\uB8E8\uC640 \uC124\uD0D5\uC744 \uD569\uCCD0 \uBAA8\uB450 \uBA87 kg \uC37C\uC744\uAE4C\uC694?",
      "explanation": "\uB354 \uC791\uC740 \uC591\uC740 \uCC98\uC74C \uC591\uC5D0\uC11C \uCC28\uC774\uB97C \uBE80 \uC591\uC785\uB2C8\uB2E4. \uCC98\uC74C \uC591\uACFC \uB354 \uC791\uC740 \uC591\uC744 \uB354\uD574 \uC804\uCCB4 \uC591\uC744 \uAD6C\uD569\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 3 1/8 kg\uC785\uB2C8\uB2E4.",
      "answer": "3 1/8",
      "unit": "kg",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "19/8",
            "19/8",
            "+",
            "13/8",
            "-"
          ]
        },
        "unit": "kg",
        "prompt": "\uBBFC\uC218\uAC00 \uBE75\uC744 \uB9CC\uB4DC\uB294 \uB370 \uBC00\uAC00\uB8E8 2 3/8 kg\uC744 \uC37C\uACE0, \uC124\uD0D5\uC740 \uBC00\uAC00\uB8E8\uBCF4\uB2E4 1 5/8 kg \uC801\uAC8C \uC37C\uC2B5\uB2C8\uB2E4. \uBC00\uAC00\uB8E8\uC640 \uC124\uD0D5\uC744 \uD569\uCCD0 \uBAA8\uB450 \uBA87 kg \uC37C\uC744\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "25/8"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "3 1/8",
          "reason": ""
        },
        {
          "text": "2 6/8",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "3 5/8",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "3 7/8",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uBBFC\uC218\uAC00 \uBE75\uC744 \uB9CC\uB4DC\uB294 \uB370 \uBC00\uAC00\uB8E8 [FRACTION:2 3/8]kg\uC744 \uC37C\uACE0, \uC124\uD0D5\uC740 \uBC00\uAC00\uB8E8\uBCF4\uB2E4 [FRACTION:1 5/8]kg \uC801\uAC8C \uC37C\uC2B5\uB2C8\uB2E4. \uBC00\uAC00\uB8E8\uC640 \uC124\uD0D5\uC744 \uD569\uCCD0 \uBAA8\uB450 \uBA87 kg \uC37C\uC744\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "opt_1",
        "text": "3 1/8",
        "mathValue": {
          "whole": 3,
          "numerator": 1,
          "denominator": 8
        }
      },
      {
        "id": "opt_2",
        "text": "2 6/8",
        "mathValue": {
          "whole": 2,
          "numerator": 6,
          "denominator": 8
        }
      },
      {
        "id": "opt_3",
        "text": "3 5/8",
        "mathValue": {
          "whole": 3,
          "numerator": 5,
          "denominator": 8
        }
      },
      {
        "id": "opt_4",
        "text": "3 7/8",
        "mathValue": {
          "whole": 3,
          "numerator": 7,
          "denominator": 8
        }
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u1_diff4-TWIN",
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit1",
    "code": "4\uC21801-15",
    "difficulty": 4,
    "question": "\uD30C\uB780 \uB9AC\uBCF8\uC740 3 1/6m\uC774\uACE0, \uBE68\uAC04 \uB9AC\uBCF8\uC740 \uD30C\uB780 \uB9AC\uBCF8\uBCF4\uB2E4 1 4/6m \uC9E7\uC2B5\uB2C8\uB2E4. \uB450 \uB9AC\uBCF8\uC758 \uAE38\uC774\uC758 \uD569\uC740 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "tokens": [
      "19/6",
      "19/6",
      "+",
      "5/3",
      "-"
    ],
    "unit": "m",
    "payload": {
      "question": "\uD30C\uB780 \uB9AC\uBCF8\uC740 3 1/6 m\uC774\uACE0, \uBE68\uAC04 \uB9AC\uBCF8\uC740 \uD30C\uB780 \uB9AC\uBCF8\uBCF4\uB2E4 1 4/6 m \uC9E7\uC2B5\uB2C8\uB2E4. \uB450 \uB9AC\uBCF8\uC758 \uAE38\uC774\uC758 \uD569\uC740 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
      "explanation": "\uB354 \uC791\uC740 \uC591\uC740 \uCC98\uC74C \uC591\uC5D0\uC11C \uCC28\uC774\uB97C \uBE80 \uC591\uC785\uB2C8\uB2E4. \uCC98\uC74C \uC591\uACFC \uB354 \uC791\uC740 \uC591\uC744 \uB354\uD574 \uC804\uCCB4 \uC591\uC744 \uAD6C\uD569\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 4 4/6 m\uC785\uB2C8\uB2E4.",
      "answer": "4 4/6",
      "unit": "m",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "19/6",
            "19/6",
            "+",
            "5/3",
            "-"
          ]
        },
        "unit": "m",
        "prompt": "\uD30C\uB780 \uB9AC\uBCF8\uC740 3 1/6 m\uC774\uACE0, \uBE68\uAC04 \uB9AC\uBCF8\uC740 \uD30C\uB780 \uB9AC\uBCF8\uBCF4\uB2E4 1 4/6 m \uC9E7\uC2B5\uB2C8\uB2E4. \uB450 \uB9AC\uBCF8\uC758 \uAE38\uC774\uC758 \uD569\uC740 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "14/3"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "4 4/6",
          "reason": ""
        },
        {
          "text": "4 3/6",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "5 1/6",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "3 5/6",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uD30C\uB780 \uB9AC\uBCF8\uC740 [FRACTION:3 1/6]m\uC774\uACE0, \uBE68\uAC04 \uB9AC\uBCF8\uC740 \uD30C\uB780 \uB9AC\uBCF8\uBCF4\uB2E4 [FRACTION:1 4/6]m \uC9E7\uC2B5\uB2C8\uB2E4. \uB450 \uB9AC\uBCF8\uC758 \uAE38\uC774\uC758 \uD569\uC740 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "4 4/6",
        "mathValue": {
          "whole": 4,
          "numerator": 4,
          "denominator": 6
        }
      },
      {
        "id": "t_opt_2",
        "text": "4 3/6",
        "mathValue": {
          "whole": 4,
          "numerator": 3,
          "denominator": 6
        }
      },
      {
        "id": "t_opt_3",
        "text": "5 1/6",
        "mathValue": {
          "whole": 5,
          "numerator": 1,
          "denominator": 6
        }
      },
      {
        "id": "t_opt_4",
        "text": "3 5/6",
        "mathValue": {
          "whole": 3,
          "numerator": 5,
          "denominator": 6
        }
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u1_diff5",
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit1",
    "code": "4\uC21801-15",
    "difficulty": 4,
    "question": "\uC5B4\uB5A4 \uC218\uC5D0 1 5/9\uB97C \uB354\uD574\uC57C \uD560 \uAC83\uC744 \uC798\uBABB\uD558\uC5EC \uBE90\uB354\uB2C8 2 7/9\uAC00 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACC4\uC0B0\uD55C \uACB0\uACFC\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "tokens": [
      "25/9",
      "14/9",
      "+",
      "14/9",
      "+"
    ],
    "unit": "",
    "payload": {
      "question": "\uC5B4\uB5A4 \uC218\uC5D0 1 5/9\uB97C \uB354\uD574\uC57C \uD560 \uAC83\uC744 \uC798\uBABB\uD558\uC5EC \uBE90\uB354\uB2C8 2 7/9\uAC00 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACC4\uC0B0\uD55C \uACB0\uACFC\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
      "explanation": "\uC798\uBABB \uBE80 \uC591\uC744 \uB354\uD574\uC11C \uCC98\uC74C \uC218\uB97C \uCC3E\uC740 \uB4A4, \uC6D0\uB798 \uB354\uD574\uC57C \uD588\uB358 \uC591\uC744 \uD55C \uBC88 \uB354 \uB354\uD569\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 5 8/9\uC785\uB2C8\uB2E4.",
      "answer": "5 8/9",
      "unit": "",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "25/9",
            "14/9",
            "+",
            "14/9",
            "+"
          ]
        },
        "unit": "",
        "prompt": "\uC5B4\uB5A4 \uC218\uC5D0 1 5/9\uB97C \uB354\uD574\uC57C \uD560 \uAC83\uC744 \uC798\uBABB\uD558\uC5EC \uBE90\uB354\uB2C8 2 7/9\uAC00 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACC4\uC0B0\uD55C \uACB0\uACFC\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "53/9"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "5 8/9",
          "reason": ""
        },
        {
          "text": "4 3/9",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "5 1/9",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "6 2/9",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC5B4\uB5A4 \uC218\uC5D0 [FRACTION:1 5/9]\uB97C \uB354\uD574\uC57C \uD560 \uAC83\uC744 \uC798\uBABB\uD558\uC5EC \uBE90\uB354\uB2C8 [FRACTION:2 7/9]\uAC00 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACC4\uC0B0\uD55C \uACB0\uACFC\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "opt_1",
        "text": "5 8/9",
        "mathValue": {
          "whole": 5,
          "numerator": 8,
          "denominator": 9
        }
      },
      {
        "id": "opt_2",
        "text": "4 3/9",
        "mathValue": {
          "whole": 4,
          "numerator": 3,
          "denominator": 9
        }
      },
      {
        "id": "opt_3",
        "text": "5 1/9",
        "mathValue": {
          "whole": 5,
          "numerator": 1,
          "denominator": 9
        }
      },
      {
        "id": "opt_4",
        "text": "6 2/9",
        "mathValue": {
          "whole": 6,
          "numerator": 2,
          "denominator": 9
        }
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u1_diff5-TWIN",
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit1",
    "code": "4\uC21801-15",
    "difficulty": 4,
    "question": "\uC5B4\uB5A4 \uC218\uC5D0\uC11C 2 4/7\uB97C \uBE7C\uC57C \uD560 \uAC83\uC744 \uC798\uBABB\uD558\uC5EC \uB354\uD588\uB354\uB2C8 6 2/7\uAC00 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACC4\uC0B0\uD55C \uACB0\uACFC\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "tokens": [
      "44/7",
      "18/7",
      "-",
      "18/7",
      "-"
    ],
    "unit": "",
    "payload": {
      "question": "\uC5B4\uB5A4 \uC218\uC5D0\uC11C 2 4/7\uB97C \uBE7C\uC57C \uD560 \uAC83\uC744 \uC798\uBABB\uD558\uC5EC \uB354\uD588\uB354\uB2C8 6 2/7\uAC00 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACC4\uC0B0\uD55C \uACB0\uACFC\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
      "explanation": "\uC798\uBABB \uB354\uD55C \uC591\uC744 \uBE7C\uC11C \uCC98\uC74C \uC218\uB97C \uCC3E\uC740 \uB4A4, \uC6D0\uB798 \uBE7C\uC57C \uD588\uB358 \uC591\uC744 \uD55C \uBC88 \uB354 \uBE8D\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 1 1/7\uC785\uB2C8\uB2E4.",
      "answer": "1 1/7",
      "unit": "",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "44/7",
            "18/7",
            "-",
            "18/7",
            "-"
          ]
        },
        "unit": "",
        "prompt": "\uC5B4\uB5A4 \uC218\uC5D0\uC11C 2 4/7\uB97C \uBE7C\uC57C \uD560 \uAC83\uC744 \uC798\uBABB\uD558\uC5EC \uB354\uD588\uB354\uB2C8 6 2/7\uAC00 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACC4\uC0B0\uD55C \uACB0\uACFC\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "8/7"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "1 1/7",
          "reason": ""
        },
        {
          "text": "1 3/7",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "2 1/7",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "3 5/7",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC5B4\uB5A4 \uC218\uC5D0\uC11C [FRACTION:2 4/7]\uB97C \uBE7C\uC57C \uD560 \uAC83\uC744 \uC798\uBABB\uD558\uC5EC \uB354\uD588\uB354\uB2C8 [FRACTION:6 2/7]\uAC00 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACC4\uC0B0\uD55C \uACB0\uACFC\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "1 1/7",
        "mathValue": {
          "whole": 1,
          "numerator": 1,
          "denominator": 7
        }
      },
      {
        "id": "t_opt_2",
        "text": "1 3/7",
        "mathValue": {
          "whole": 1,
          "numerator": 3,
          "denominator": 7
        }
      },
      {
        "id": "t_opt_3",
        "text": "2 1/7",
        "mathValue": {
          "whole": 2,
          "numerator": 1,
          "denominator": 7
        }
      },
      {
        "id": "t_opt_4",
        "text": "3 5/7",
        "mathValue": {
          "whole": 3,
          "numerator": 5,
          "denominator": 7
        }
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u2_diff3",
    "grade": 5,
    "semester": 1,
    "unitId": "sem1_unit6",
    "code": "6\uC21803-11",
    "difficulty": 3,
    "question": "\uC815\uC0BC\uAC01\uD615\uC758 \uC138 \uBCC0\uC758 \uAE38\uC774\uC758 \uD569\uC774 27cm\uC785\uB2C8\uB2E4. \uC774 \uC815\uC0BC\uAC01\uD615\uC758 \uD55C \uBCC0\uC758 \uAE38\uC774\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "tokens": [
      27,
      3,
      "/"
    ],
    "unit": "cm",
    "payload": {
      "question": "\uC815\uC0BC\uAC01\uD615\uC758 \uC138 \uBCC0\uC758 \uAE38\uC774\uC758 \uD569\uC774 27 cm\uC785\uB2C8\uB2E4. \uC774 \uC815\uC0BC\uAC01\uD615\uC758 \uD55C \uBCC0\uC758 \uAE38\uC774\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
      "explanation": "\uC815\uC0BC\uAC01\uD615\uC758 \uC138 \uBCC0\uC740 \uAC19\uC73C\uBBC0\uB85C \uB458\uB808\uB97C 3\uC73C\uB85C \uB098\uB204\uBA74 \uD55C \uBCC0\uC758 \uAE38\uC774\uC785\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 9 cm\uC785\uB2C8\uB2E4.",
      "answer": "9",
      "unit": "cm",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "27",
            "3",
            "/"
          ]
        },
        "unit": "cm",
        "prompt": "\uC815\uC0BC\uAC01\uD615\uC758 \uC138 \uBCC0\uC758 \uAE38\uC774\uC758 \uD569\uC774 27 cm\uC785\uB2C8\uB2E4. \uC774 \uC815\uC0BC\uAC01\uD615\uC758 \uD55C \uBCC0\uC758 \uAE38\uC774\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "9"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "9",
          "reason": ""
        },
        {
          "text": "8",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "7",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "6",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC815\uC0BC\uAC01\uD615\uC758 \uC138 \uBCC0\uC758 \uAE38\uC774\uC758 \uD569\uC774 27cm\uC785\uB2C8\uB2E4. \uC774 \uC815\uC0BC\uAC01\uD615\uC758 \uD55C \uBCC0\uC758 \uAE38\uC774\uB294 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "opt_1",
        "text": "9cm"
      },
      {
        "id": "opt_2",
        "text": "8cm"
      },
      {
        "id": "opt_3",
        "text": "7cm"
      },
      {
        "id": "opt_4",
        "text": "6cm"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u2_diff3-TWIN",
    "grade": 5,
    "semester": 1,
    "unitId": "sem1_unit6",
    "code": "6\uC21803-11",
    "difficulty": 3,
    "question": "\uD55C \uBCC0\uC758 \uAE38\uC774\uAC00 8cm\uC778 \uC815\uC0BC\uAC01\uD615\uC758 \uB458\uB808(\uC138 \uBCC0\uC758 \uAE38\uC774\uC758 \uD569)\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
    "tokens": [
      8,
      3,
      "*"
    ],
    "unit": "cm",
    "payload": {
      "question": "\uD55C \uBCC0\uC758 \uAE38\uC774\uAC00 8 cm\uC778 \uC815\uC0BC\uAC01\uD615\uC758 \uB458\uB808(\uC138 \uBCC0\uC758 \uAE38\uC774\uC758 \uD569)\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
      "explanation": "\uC815\uC0BC\uAC01\uD615\uC758 \uC138 \uBCC0\uC740 \uAC19\uC73C\uBBC0\uB85C \uD55C \uBCC0\uC758 \uAE38\uC774\uB97C 3\uBC30 \uD558\uBA74 \uB458\uB808\uC785\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 24 cm\uC785\uB2C8\uB2E4.",
      "answer": "24",
      "unit": "cm",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "8",
            "3",
            "*"
          ]
        },
        "unit": "cm",
        "prompt": "\uD55C \uBCC0\uC758 \uAE38\uC774\uAC00 8 cm\uC778 \uC815\uC0BC\uAC01\uD615\uC758 \uB458\uB808(\uC138 \uBCC0\uC758 \uAE38\uC774\uC758 \uD569)\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "24"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "24",
          "reason": ""
        },
        {
          "text": "16",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "32",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "28",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uD55C \uBCC0\uC758 \uAE38\uC774\uAC00 8cm\uC778 \uC815\uC0BC\uAC01\uD615\uC758 \uB458\uB808(\uC138 \uBCC0\uC758 \uAE38\uC774\uC758 \uD569)\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "24cm"
      },
      {
        "id": "t_opt_2",
        "text": "16cm"
      },
      {
        "id": "t_opt_3",
        "text": "32cm"
      },
      {
        "id": "t_opt_4",
        "text": "28cm"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u2_diff4",
    "grade": 5,
    "semester": 1,
    "unitId": "sem1_unit6",
    "code": "6\uC21803-11",
    "difficulty": 4,
    "question": "\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615\uC758 \uB458\uB808\uAC00 34cm\uC785\uB2C8\uB2E4. \uAE38\uC774\uAC00 \uB2E4\uB978 \uD55C \uBCC0\uC774 10cm\uB77C\uBA74, \uAE38\uC774\uAC00 \uAC19\uC740 \uB450 \uBCC0\uC758 \uAE38\uC774\uB294 \uAC01\uAC01 \uBA87 cm\uC77C\uAE4C\uC694?",
    "tokens": [
      34,
      10,
      "-",
      2,
      "/"
    ],
    "unit": "cm",
    "payload": {
      "question": "\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615\uC758 \uB458\uB808\uAC00 34 cm\uC785\uB2C8\uB2E4. \uAE38\uC774\uAC00 \uB2E4\uB978 \uD55C \uBCC0\uC774 10 cm\uB77C\uBA74, \uAE38\uC774\uAC00 \uAC19\uC740 \uB450 \uBCC0\uC758 \uAE38\uC774\uB294 \uAC01\uAC01 \uBA87 cm\uC77C\uAE4C\uC694?",
      "explanation": "\uB458\uB808\uC5D0\uC11C \uAE38\uC774\uAC00 \uB2E4\uB978 \uD55C \uBCC0\uC744 \uBE7C\uACE0, \uB0A8\uC740 \uAE38\uC774\uB97C \uB611\uAC19\uC774 \uB458\uB85C \uB098\uB215\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 12 cm\uC785\uB2C8\uB2E4.",
      "answer": "12",
      "unit": "cm",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "34",
            "10",
            "-",
            "2",
            "/"
          ]
        },
        "unit": "cm",
        "prompt": "\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615\uC758 \uB458\uB808\uAC00 34 cm\uC785\uB2C8\uB2E4. \uAE38\uC774\uAC00 \uB2E4\uB978 \uD55C \uBCC0\uC774 10 cm\uB77C\uBA74, \uAE38\uC774\uAC00 \uAC19\uC740 \uB450 \uBCC0\uC758 \uAE38\uC774\uB294 \uAC01\uAC01 \uBA87 cm\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "12"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "12",
          "reason": ""
        },
        {
          "text": "14",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "11",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "13",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615\uC758 \uB458\uB808\uAC00 34cm\uC785\uB2C8\uB2E4. \uAE38\uC774\uAC00 \uB2E4\uB978 \uD55C \uBCC0\uC774 10cm\uB77C\uBA74, \uAE38\uC774\uAC00 \uAC19\uC740 \uB450 \uBCC0\uC758 \uAE38\uC774\uB294 \uAC01\uAC01 \uBA87 cm\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "opt_1",
        "text": "12cm"
      },
      {
        "id": "opt_2",
        "text": "14cm"
      },
      {
        "id": "opt_3",
        "text": "11cm"
      },
      {
        "id": "opt_4",
        "text": "13cm"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u2_diff4-TWIN",
    "grade": 5,
    "semester": 1,
    "unitId": "sem1_unit6",
    "code": "6\uC21803-11",
    "difficulty": 4,
    "question": "\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615\uC758 \uAE38\uC774\uAC00 \uAC19\uC740 \uB450 \uBCC0\uC774 \uAC01\uAC01 15cm\uC774\uACE0, \uB458\uB808\uAC00 42cm\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uD55C \uBCC0\uC758 \uAE38\uC774\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
    "tokens": [
      42,
      15,
      2,
      "*",
      "-"
    ],
    "unit": "cm",
    "payload": {
      "question": "\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615\uC758 \uAE38\uC774\uAC00 \uAC19\uC740 \uB450 \uBCC0\uC774 \uAC01\uAC01 15 cm\uC774\uACE0, \uB458\uB808\uAC00 42 cm\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uD55C \uBCC0\uC758 \uAE38\uC774\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
      "explanation": "\uAC19\uC740 \uB450 \uBCC0\uC758 \uAE38\uC774\uC758 \uD569\uC744 \uB458\uB808\uC5D0\uC11C \uBE7C\uBA74 \uB098\uBA38\uC9C0 \uBCC0\uC758 \uAE38\uC774\uC785\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 12 cm\uC785\uB2C8\uB2E4.",
      "answer": "12",
      "unit": "cm",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "42",
            "15",
            "2",
            "*",
            "-"
          ]
        },
        "unit": "cm",
        "prompt": "\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615\uC758 \uAE38\uC774\uAC00 \uAC19\uC740 \uB450 \uBCC0\uC774 \uAC01\uAC01 15 cm\uC774\uACE0, \uB458\uB808\uAC00 42 cm\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uD55C \uBCC0\uC758 \uAE38\uC774\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "12"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "12",
          "reason": ""
        },
        {
          "text": "14",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "10",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "16",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615\uC758 \uAE38\uC774\uAC00 \uAC19\uC740 \uB450 \uBCC0\uC774 \uAC01\uAC01 15cm\uC774\uACE0, \uB458\uB808\uAC00 42cm\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uD55C \uBCC0\uC758 \uAE38\uC774\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "12cm"
      },
      {
        "id": "t_opt_2",
        "text": "14cm"
      },
      {
        "id": "t_opt_3",
        "text": "10cm"
      },
      {
        "id": "t_opt_4",
        "text": "16cm"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u3_diff1",
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit3",
    "code": "4\uC21801-13",
    "difficulty": 1,
    "question": "\uC18C\uC218 3.84\uC5D0\uC11C \uC22B\uC790 8\uC774 \uB098\uD0C0\uB0B4\uB294 \uC2E4\uC81C \uAC12\uC740 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "tokens": [
      "0.8"
    ],
    "unit": "",
    "payload": {
      "question": "\uC18C\uC218 3.84\uC5D0\uC11C \uC22B\uC790 8\uC774 \uB098\uD0C0\uB0B4\uB294 \uC2E4\uC81C \uAC12\uC740 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
      "explanation": "\uC18C\uC218 \uCCAB\uC9F8 \uC790\uB9AC\uC758 8\uC740 0.1\uC774 8\uAC1C\uB77C\uB294 \uB73B\uC785\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 0.8\uC785\uB2C8\uB2E4.",
      "answer": "0.8",
      "unit": "",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "0.8"
          ]
        },
        "unit": "",
        "prompt": "\uC18C\uC218 3.84\uC5D0\uC11C \uC22B\uC790 8\uC774 \uB098\uD0C0\uB0B4\uB294 \uC2E4\uC81C \uAC12\uC740 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "4/5"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "0.8",
          "reason": ""
        },
        {
          "text": "8",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "0.08",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "80",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC18C\uC218 3.84\uC5D0\uC11C \uC22B\uC790 8\uC774 \uB098\uD0C0\uB0B4\uB294 \uC2E4\uC81C \uAC12\uC740 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "opt_1",
        "text": "0.8"
      },
      {
        "id": "opt_2",
        "text": "8"
      },
      {
        "id": "opt_3",
        "text": "0.08"
      },
      {
        "id": "opt_4",
        "text": "80"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u3_diff1-TWIN",
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit3",
    "code": "4\uC21801-13",
    "difficulty": 1,
    "question": "\uC18C\uC218 5.27\uC5D0\uC11C \uC22B\uC790 7\uC774 \uB098\uD0C0\uB0B4\uB294 \uC2E4\uC81C \uAC12\uC740 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "tokens": [
      "0.07"
    ],
    "unit": "",
    "payload": {
      "question": "\uC18C\uC218 5.27\uC5D0\uC11C \uC22B\uC790 7\uC774 \uB098\uD0C0\uB0B4\uB294 \uC2E4\uC81C \uAC12\uC740 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
      "explanation": "\uC18C\uC218 \uB458\uC9F8 \uC790\uB9AC\uC758 7\uC740 0.01\uC774 7\uAC1C\uB77C\uB294 \uB73B\uC785\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 0.07\uC785\uB2C8\uB2E4.",
      "answer": "0.07",
      "unit": "",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "0.07"
          ]
        },
        "unit": "",
        "prompt": "\uC18C\uC218 5.27\uC5D0\uC11C \uC22B\uC790 7\uC774 \uB098\uD0C0\uB0B4\uB294 \uC2E4\uC81C \uAC12\uC740 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "7/100"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "0.07",
          "reason": ""
        },
        {
          "text": "0.7",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "7",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "0.007",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC18C\uC218 5.27\uC5D0\uC11C \uC22B\uC790 7\uC774 \uB098\uD0C0\uB0B4\uB294 \uC2E4\uC81C \uAC12\uC740 \uC5BC\uB9C8\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "0.07"
      },
      {
        "id": "t_opt_2",
        "text": "0.7"
      },
      {
        "id": "t_opt_3",
        "text": "7"
      },
      {
        "id": "t_opt_4",
        "text": "0.007"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u3_diff2",
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit3",
    "code": "4\uC21801-16",
    "difficulty": 2,
    "question": "\uCCA0\uC218\uB294 100m \uB2EC\uB9AC\uAE30\uB97C 16.48\uCD08\uC5D0 \uB2EC\uB838\uACE0, \uC601\uD76C\uB294 15.82\uCD08\uC5D0 \uB2EC\uB838\uC2B5\uB2C8\uB2E4. \uC601\uD76C\uB294 \uCCA0\uC218\uBCF4\uB2E4 \uBA87 \uCD08 \uB354 \uBE68\uB9AC \uB2EC\uB838\uC744\uAE4C\uC694?",
    "tokens": [
      16.48,
      15.82,
      "-"
    ],
    "unit": "\uCD08",
    "payload": {
      "question": "\uCCA0\uC218\uB294 100 m \uB2EC\uB9AC\uAE30\uB97C 16.48\uCD08\uC5D0 \uB2EC\uB838\uACE0, \uC601\uD76C\uB294 15.82\uCD08\uC5D0 \uB2EC\uB838\uC2B5\uB2C8\uB2E4. \uC601\uD76C\uB294 \uCCA0\uC218\uBCF4\uB2E4 \uBA87 \uCD08 \uB354 \uBE68\uB9AC \uB2EC\uB838\uC744\uAE4C\uC694?",
      "explanation": "\uAC19\uC740 \uAC70\uB9AC\uB97C \uB2EC\uB9B0 \uB450 \uAE30\uB85D\uC758 \uC2DC\uAC04 \uCC28\uB97C \uAD6C\uD558\uB824\uBA74 \uAE34 \uC2DC\uAC04\uC5D0\uC11C \uC9E7\uC740 \uC2DC\uAC04\uC744 \uBE8D\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 0.66 \uCD08\uC785\uB2C8\uB2E4.",
      "answer": "0.66",
      "unit": "\uCD08",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "16.48",
            "15.82",
            "-"
          ]
        },
        "unit": "\uCD08",
        "prompt": "\uCCA0\uC218\uB294 100 m \uB2EC\uB9AC\uAE30\uB97C 16.48\uCD08\uC5D0 \uB2EC\uB838\uACE0, \uC601\uD76C\uB294 15.82\uCD08\uC5D0 \uB2EC\uB838\uC2B5\uB2C8\uB2E4. \uC601\uD76C\uB294 \uCCA0\uC218\uBCF4\uB2E4 \uBA87 \uCD08 \uB354 \uBE68\uB9AC \uB2EC\uB838\uC744\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "33/50"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "0.66",
          "reason": ""
        },
        {
          "text": "0.76",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "1.66",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "0.56",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uCCA0\uC218\uB294 100m \uB2EC\uB9AC\uAE30\uB97C 16.48\uCD08\uC5D0 \uB2EC\uB838\uACE0, \uC601\uD76C\uB294 15.82\uCD08\uC5D0 \uB2EC\uB838\uC2B5\uB2C8\uB2E4. \uC601\uD76C\uB294 \uCCA0\uC218\uBCF4\uB2E4 \uBA87 \uCD08 \uB354 \uBE68\uB9AC \uB2EC\uB838\uC744\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "opt_1",
        "text": "0.66\uCD08"
      },
      {
        "id": "opt_2",
        "text": "0.76\uCD08"
      },
      {
        "id": "opt_3",
        "text": "1.66\uCD08"
      },
      {
        "id": "opt_4",
        "text": "0.56\uCD08"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u3_diff2-TWIN",
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit3",
    "code": "4\uC21801-16",
    "difficulty": 2,
    "question": "\uC790\uC804\uAC70\uB85C \uC5B4\uC81C\uB294 4.35km\uB97C \uD0D4\uACE0, \uC624\uB298\uC740 \uC5B4\uC81C\uBCF4\uB2E4 0.85km\uB97C \uB354 \uD0D4\uC2B5\uB2C8\uB2E4. \uC624\uB298 \uD0C4 \uAC70\uB9AC\uB294 \uBA87 km\uC77C\uAE4C\uC694?",
    "tokens": [
      4.35,
      0.85,
      "+"
    ],
    "unit": "km",
    "payload": {
      "question": "\uC790\uC804\uAC70\uB85C \uC5B4\uC81C\uB294 4.35 km\uB97C \uD0D4\uACE0, \uC624\uB298\uC740 \uC5B4\uC81C\uBCF4\uB2E4 0.85 km\uB97C \uB354 \uD0D4\uC2B5\uB2C8\uB2E4. \uC624\uB298 \uD0C4 \uAC70\uB9AC\uB294 \uBA87 km\uC77C\uAE4C\uC694?",
      "explanation": "\uC624\uB298 \uAC70\uB9AC\uB294 \uC5B4\uC81C \uAC70\uB9AC\uC5D0 \uB354 \uD0C4 \uAC70\uB9AC\uB97C \uB354\uD55C \uAC12\uC785\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 5.2 km\uC785\uB2C8\uB2E4.",
      "answer": "5.2",
      "unit": "km",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "4.35",
            "0.85",
            "+"
          ]
        },
        "unit": "km",
        "prompt": "\uC790\uC804\uAC70\uB85C \uC5B4\uC81C\uB294 4.35 km\uB97C \uD0D4\uACE0, \uC624\uB298\uC740 \uC5B4\uC81C\uBCF4\uB2E4 0.85 km\uB97C \uB354 \uD0D4\uC2B5\uB2C8\uB2E4. \uC624\uB298 \uD0C4 \uAC70\uB9AC\uB294 \uBA87 km\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "26/5"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "5.2",
          "reason": ""
        },
        {
          "text": "5.1",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "4.2",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "5.25",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC790\uC804\uAC70\uB85C \uC5B4\uC81C\uB294 4.35km\uB97C \uD0D4\uACE0, \uC624\uB298\uC740 \uC5B4\uC81C\uBCF4\uB2E4 0.85km\uB97C \uB354 \uD0D4\uC2B5\uB2C8\uB2E4. \uC624\uB298 \uD0C4 \uAC70\uB9AC\uB294 \uBA87 km\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "5.2km"
      },
      {
        "id": "t_opt_2",
        "text": "5.1km"
      },
      {
        "id": "t_opt_3",
        "text": "4.2km"
      },
      {
        "id": "t_opt_4",
        "text": "5.25km"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u3_diff3",
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit3",
    "code": "4\uC21801-16",
    "difficulty": 3,
    "question": "\uC2DD [ \u25A1 + 2.47 = 6.1 ] \uC5D0\uC11C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB294 \uBB34\uC5C7\uC77C\uAE4C\uC694?",
    "tokens": [
      6.1,
      2.47,
      "-"
    ],
    "unit": "",
    "payload": {
      "question": "\uC2DD [ \u25A1 + 2.47 = 6.1 ] \uC5D0\uC11C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB294 \uBB34\uC5C7\uC77C\uAE4C\uC694?",
      "explanation": "\uB367\uC148\uC758 \uD569\uC5D0\uC11C \uC54C\uB824\uC9C4 \uC218\uB97C \uBE7C\uBA74 \uBE48\uCE78\uC758 \uAC12\uC785\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 3.63\uC785\uB2C8\uB2E4.",
      "answer": "3.63",
      "unit": "",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "6.1",
            "2.47",
            "-"
          ]
        },
        "unit": "",
        "prompt": "\uC2DD [ \u25A1 + 2.47 = 6.1 ] \uC5D0\uC11C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB294 \uBB34\uC5C7\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "363/100"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "3.63",
          "reason": ""
        },
        {
          "text": "3.73",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "4.63",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "3.53",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC2DD [ \u25A1 + 2.47 = 6.1 ] \uC5D0\uC11C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB294 \uBB34\uC5C7\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "opt_1",
        "text": "3.63"
      },
      {
        "id": "opt_2",
        "text": "3.73"
      },
      {
        "id": "opt_3",
        "text": "4.63"
      },
      {
        "id": "opt_4",
        "text": "3.53"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u3_diff3-TWIN",
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit3",
    "code": "4\uC21801-16",
    "difficulty": 3,
    "question": "\uC2DD [ 7.2 - \u25A1 = 3.85 ] \uC5D0\uC11C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB294 \uBB34\uC5C7\uC77C\uAE4C\uC694?",
    "tokens": [
      7.2,
      3.85,
      "-"
    ],
    "unit": "",
    "payload": {
      "question": "\uC2DD [ 7.2 - \u25A1 = 3.85 ] \uC5D0\uC11C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB294 \uBB34\uC5C7\uC77C\uAE4C\uC694?",
      "explanation": "\uCC98\uC74C \uC218\uC5D0\uC11C \uB0A8\uC740 \uC218\uB97C \uBE7C\uBA74 \uBE48\uCE78\uC758 \uAC12\uC785\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 3.35\uC785\uB2C8\uB2E4.",
      "answer": "3.35",
      "unit": "",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "7.2",
            "3.85",
            "-"
          ]
        },
        "unit": "",
        "prompt": "\uC2DD [ 7.2 - \u25A1 = 3.85 ] \uC5D0\uC11C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB294 \uBB34\uC5C7\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "67/20"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "3.35",
          "reason": ""
        },
        {
          "text": "3.45",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "4.35",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "3.25",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC2DD [ 7.2 - \u25A1 = 3.85 ] \uC5D0\uC11C \uBE48\uCE78 \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB294 \uBB34\uC5C7\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "3.35"
      },
      {
        "id": "t_opt_2",
        "text": "3.45"
      },
      {
        "id": "t_opt_3",
        "text": "4.35"
      },
      {
        "id": "t_opt_4",
        "text": "3.25"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u3_diff4",
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit3",
    "code": "4\uC21801-16",
    "difficulty": 4,
    "question": "\uBB34\uAC8C\uAC00 0.45kg\uC778 \uBE48 \uC0C1\uC790\uC5D0 \uC0AC\uACFC 2.8kg\uACFC \uBC30 3.15kg\uC744 \uB2F4\uC558\uC2B5\uB2C8\uB2E4. \uC0C1\uC790 \uC804\uCCB4\uC758 \uBB34\uAC8C\uB294 \uBA87 kg\uC77C\uAE4C\uC694?",
    "tokens": [
      0.45,
      2.8,
      "+",
      3.15,
      "+"
    ],
    "unit": "kg",
    "payload": {
      "question": "\uBB34\uAC8C\uAC00 0.45 kg\uC778 \uBE48 \uC0C1\uC790\uC5D0 \uC0AC\uACFC 2.8 kg\uACFC \uBC30 3.15 kg\uC744 \uB2F4\uC558\uC2B5\uB2C8\uB2E4. \uC0C1\uC790 \uC804\uCCB4\uC758 \uBB34\uAC8C\uB294 \uBA87 kg\uC77C\uAE4C\uC694?",
      "explanation": "\uBE48 \uC0C1\uC790\uC640 \uADF8 \uC548\uC5D0 \uB2F4\uC740 \uB450 \uACFC\uC77C\uC758 \uBB34\uAC8C\uB97C \uBAA8\uB450 \uB354\uD569\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 6.4 kg\uC785\uB2C8\uB2E4.",
      "answer": "6.4",
      "unit": "kg",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "0.45",
            "2.8",
            "+",
            "3.15",
            "+"
          ]
        },
        "unit": "kg",
        "prompt": "\uBB34\uAC8C\uAC00 0.45 kg\uC778 \uBE48 \uC0C1\uC790\uC5D0 \uC0AC\uACFC 2.8 kg\uACFC \uBC30 3.15 kg\uC744 \uB2F4\uC558\uC2B5\uB2C8\uB2E4. \uC0C1\uC790 \uC804\uCCB4\uC758 \uBB34\uAC8C\uB294 \uBA87 kg\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "32/5"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "6.4",
          "reason": ""
        },
        {
          "text": "6.35",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "5.95",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "6.5",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uBB34\uAC8C\uAC00 0.45kg\uC778 \uBE48 \uC0C1\uC790\uC5D0 \uC0AC\uACFC 2.8kg\uACFC \uBC30 3.15kg\uC744 \uB2F4\uC558\uC2B5\uB2C8\uB2E4. \uC0C1\uC790 \uC804\uCCB4\uC758 \uBB34\uAC8C\uB294 \uBA87 kg\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "opt_1",
        "text": "6.4kg"
      },
      {
        "id": "opt_2",
        "text": "6.35kg"
      },
      {
        "id": "opt_3",
        "text": "5.95kg"
      },
      {
        "id": "opt_4",
        "text": "6.5kg"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u3_diff4-TWIN",
    "grade": 4,
    "semester": 2,
    "unitId": "sem2_unit3",
    "code": "4\uC21801-16",
    "difficulty": 4,
    "question": "\uBB3C 1.85L\uAC00 \uB4E0 \uC8FC\uC804\uC790\uC5D0 \uBB3C 0.65L\uB97C \uB354 \uBD93\uACE0 0.9L\uB97C \uB9C8\uC168\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uBB3C\uC740 \uBA87 L\uC77C\uAE4C\uC694?",
    "tokens": [
      1.85,
      0.65,
      "+",
      0.9,
      "-"
    ],
    "unit": "L",
    "payload": {
      "question": "\uBB3C 1.85 L\uAC00 \uB4E0 \uC8FC\uC804\uC790\uC5D0 \uBB3C 0.65 L\uB97C \uB354 \uBD93\uACE0 0.9 L\uB97C \uB9C8\uC168\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uBB3C\uC740 \uBA87 L\uC77C\uAE4C\uC694?",
      "explanation": "\uCC98\uC74C \uC788\uB358 \uBB3C\uACFC \uB354 \uBD80\uC740 \uBB3C\uC744 \uD569\uD55C \uB4A4 \uB9C8\uC2E0 \uBB3C\uC744 \uBE8D\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 1.6 L\uC785\uB2C8\uB2E4.",
      "answer": "1.6",
      "unit": "L",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "1.85",
            "0.65",
            "+",
            "0.9",
            "-"
          ]
        },
        "unit": "L",
        "prompt": "\uBB3C 1.85 L\uAC00 \uB4E0 \uC8FC\uC804\uC790\uC5D0 \uBB3C 0.65 L\uB97C \uB354 \uBD93\uACE0 0.9 L\uB97C \uB9C8\uC168\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uBB3C\uC740 \uBA87 L\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "8/5"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "1.6",
          "reason": ""
        },
        {
          "text": "1.5",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "1.7",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "2.5",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uBB3C 1.85L\uAC00 \uB4E0 \uC8FC\uC804\uC790\uC5D0 \uBB3C 0.65L\uB97C \uB354 \uBD93\uACE0 0.9L\uB97C \uB9C8\uC168\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uBB3C\uC740 \uBA87 L\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "1.6L"
      },
      {
        "id": "t_opt_2",
        "text": "1.5L"
      },
      {
        "id": "t_opt_3",
        "text": "1.7L"
      },
      {
        "id": "t_opt_4",
        "text": "2.5L"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u4_diff2",
    "grade": 5,
    "semester": 1,
    "unitId": "sem1_unit6",
    "code": "6\uC21803-11",
    "difficulty": 2,
    "question": "\uB9C8\uB984\uBAA8\uC758 \uB458\uB808\uAC00 36cm\uC785\uB2C8\uB2E4. \uB9C8\uB984\uBAA8\uC758 \uD55C \uBCC0\uC758 \uAE38\uC774\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
    "tokens": [
      36,
      4,
      "/"
    ],
    "unit": "cm",
    "payload": {
      "question": "\uB9C8\uB984\uBAA8\uC758 \uB458\uB808\uAC00 36 cm\uC785\uB2C8\uB2E4. \uB9C8\uB984\uBAA8\uC758 \uD55C \uBCC0\uC758 \uAE38\uC774\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
      "explanation": "\uB9C8\uB984\uBAA8\uC758 \uB124 \uBCC0\uC774 \uAC19\uC73C\uBBC0\uB85C \uB458\uB808\uB97C 4\uB85C \uB098\uB204\uBA74 \uD55C \uBCC0\uC785\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 9 cm\uC785\uB2C8\uB2E4.",
      "answer": "9",
      "unit": "cm",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "36",
            "4",
            "/"
          ]
        },
        "unit": "cm",
        "prompt": "\uB9C8\uB984\uBAA8\uC758 \uB458\uB808\uAC00 36 cm\uC785\uB2C8\uB2E4. \uB9C8\uB984\uBAA8\uC758 \uD55C \uBCC0\uC758 \uAE38\uC774\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "9"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "9",
          "reason": ""
        },
        {
          "text": "8",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "6",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "12",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uB9C8\uB984\uBAA8\uC758 \uB458\uB808\uAC00 36cm\uC785\uB2C8\uB2E4. \uB9C8\uB984\uBAA8\uC758 \uD55C \uBCC0\uC758 \uAE38\uC774\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "opt_1",
        "text": "9cm"
      },
      {
        "id": "opt_2",
        "text": "8cm"
      },
      {
        "id": "opt_3",
        "text": "6cm"
      },
      {
        "id": "opt_4",
        "text": "12cm"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u4_diff2-TWIN",
    "grade": 5,
    "semester": 1,
    "unitId": "sem1_unit6",
    "code": "6\uC21803-11",
    "difficulty": 2,
    "question": "\uD55C \uBCC0\uC758 \uAE38\uC774\uAC00 7cm\uC778 \uC815\uC0AC\uAC01\uD615\uC758 \uB458\uB808\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
    "tokens": [
      7,
      4,
      "*"
    ],
    "unit": "cm",
    "payload": {
      "question": "\uD55C \uBCC0\uC758 \uAE38\uC774\uAC00 7 cm\uC778 \uC815\uC0AC\uAC01\uD615\uC758 \uB458\uB808\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
      "explanation": "\uC815\uC0AC\uAC01\uD615\uC758 \uB124 \uBCC0\uC774 \uAC19\uC73C\uBBC0\uB85C \uD55C \uBCC0\uC744 4\uBC30 \uD558\uBA74 \uB458\uB808\uC785\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 28 cm\uC785\uB2C8\uB2E4.",
      "answer": "28",
      "unit": "cm",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "7",
            "4",
            "*"
          ]
        },
        "unit": "cm",
        "prompt": "\uD55C \uBCC0\uC758 \uAE38\uC774\uAC00 7 cm\uC778 \uC815\uC0AC\uAC01\uD615\uC758 \uB458\uB808\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "28"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "28",
          "reason": ""
        },
        {
          "text": "21",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "35",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "14",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uD55C \uBCC0\uC758 \uAE38\uC774\uAC00 7cm\uC778 \uC815\uC0AC\uAC01\uD615\uC758 \uB458\uB808\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "28cm"
      },
      {
        "id": "t_opt_2",
        "text": "21cm"
      },
      {
        "id": "t_opt_3",
        "text": "35cm"
      },
      {
        "id": "t_opt_4",
        "text": "14cm"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u4_diff5",
    "grade": 5,
    "semester": 1,
    "unitId": "sem1_unit6",
    "code": "6\uC21803-11",
    "difficulty": 4,
    "question": "\uC9C1\uC0AC\uAC01\uD615\uC758 \uAC00\uB85C\uAC00 \uC138\uB85C\uBCF4\uB2E4 4cm \uB354 \uAE38\uACE0, \uB458\uB808\uAC00 36cm\uC785\uB2C8\uB2E4. \uC774 \uC9C1\uC0AC\uAC01\uD615\uC758 \uAC00\uB85C\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
    "tokens": [
      36,
      2,
      "/",
      4,
      "+",
      2,
      "/"
    ],
    "unit": "cm",
    "payload": {
      "question": "\uC9C1\uC0AC\uAC01\uD615\uC758 \uAC00\uB85C\uAC00 \uC138\uB85C\uBCF4\uB2E4 4 cm \uB354 \uAE38\uACE0, \uB458\uB808\uAC00 36 cm\uC785\uB2C8\uB2E4. \uC774 \uC9C1\uC0AC\uAC01\uD615\uC758 \uAC00\uB85C\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
      "explanation": "\uB458\uB808\uC758 \uC808\uBC18\uC740 \uAC00\uB85C\uC640 \uC138\uB85C\uC758 \uD569\uC785\uB2C8\uB2E4. \uC774 \uD569\uC5D0 \uB450 \uBCC0\uC758 \uCC28\uC774\uB97C \uB354\uD558\uBA74 \uAC00\uB85C\uC758 2\uBC30\uC774\uBBC0\uB85C \uB2E4\uC2DC 2\uB85C \uB098\uB215\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 11 cm\uC785\uB2C8\uB2E4.",
      "answer": "11",
      "unit": "cm",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "36",
            "2",
            "/",
            "4",
            "+",
            "2",
            "/"
          ]
        },
        "unit": "cm",
        "prompt": "\uC9C1\uC0AC\uAC01\uD615\uC758 \uAC00\uB85C\uAC00 \uC138\uB85C\uBCF4\uB2E4 4 cm \uB354 \uAE38\uACE0, \uB458\uB808\uAC00 36 cm\uC785\uB2C8\uB2E4. \uC774 \uC9C1\uC0AC\uAC01\uD615\uC758 \uAC00\uB85C\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "11"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "11",
          "reason": ""
        },
        {
          "text": "10",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "12",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "13",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uC9C1\uC0AC\uAC01\uD615\uC758 \uAC00\uB85C\uAC00 \uC138\uB85C\uBCF4\uB2E4 4cm \uB354 \uAE38\uACE0, \uB458\uB808\uAC00 36cm\uC785\uB2C8\uB2E4. \uC774 \uC9C1\uC0AC\uAC01\uD615\uC758 \uAC00\uB85C\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "opt_1",
        "text": "11cm (\uC138\uB85C\uB294 7cm)"
      },
      {
        "id": "opt_2",
        "text": "10cm (\uC138\uB85C\uB294 8cm)"
      },
      {
        "id": "opt_3",
        "text": "12cm (\uC138\uB85C\uB294 6cm)"
      },
      {
        "id": "opt_4",
        "text": "13cm (\uC138\uB85C\uB294 5cm)"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "opt_1"
    }
  },
  {
    "sourceId": "MATH-G4-q_s2_u4_diff5-TWIN",
    "grade": 5,
    "semester": 1,
    "unitId": "sem1_unit6",
    "code": "6\uC21803-11",
    "difficulty": 4,
    "question": "\uAC00\uB85C\uC640 \uC138\uB85C\uC758 \uD569\uC774 20cm\uC774\uACE0 \uB458\uB808\uAC00 40cm\uC778 \uC9C1\uC0AC\uAC01\uD615\uC5D0\uC11C, \uAC00\uB85C\uAC00 \uC138\uB85C\uC758 3\uBC30\uB77C\uBA74 \uAC00\uB85C\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
    "tokens": [
      20,
      4,
      "/",
      3,
      "*"
    ],
    "unit": "cm",
    "payload": {
      "question": "\uAC00\uB85C\uC640 \uC138\uB85C\uC758 \uD569\uC774 20 cm\uC774\uACE0 \uB458\uB808\uAC00 40 cm\uC778 \uC9C1\uC0AC\uAC01\uD615\uC5D0\uC11C, \uAC00\uB85C\uAC00 \uC138\uB85C\uC758 3\uBC30\uB77C\uBA74 \uAC00\uB85C\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
      "explanation": "\uAC00\uB85C\uC640 \uC138\uB85C\uB97C \uD569\uD55C \uAE38\uC774\uB97C \uAC19\uC740 \uB124 \uBAAB\uC73C\uB85C \uC0DD\uAC01\uD558\uBA74 \uAC00\uB85C\uB294 \uADF8\uC911 \uC138 \uBAAB\uC785\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uB294 15 cm\uC785\uB2C8\uB2E4.",
      "answer": "15",
      "unit": "cm",
      "model": {
        "kind": "expression",
        "query": "calculate",
        "data": {
          "tokens": [
            "20",
            "4",
            "/",
            "3",
            "*"
          ]
        },
        "unit": "cm",
        "prompt": "\uAC00\uB85C\uC640 \uC138\uB85C\uC758 \uD569\uC774 20 cm\uC774\uACE0 \uB458\uB808\uAC00 40 cm\uC778 \uC9C1\uC0AC\uAC01\uD615\uC5D0\uC11C, \uAC00\uB85C\uAC00 \uC138\uB85C\uC758 3\uBC30\uB77C\uBA74 \uAC00\uB85C\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
        "structureId": "authored-calculate",
        "difficultyRationale": "Finite authored task; operand roles and constraints recorded",
        "expected": "15"
      },
      "category": "word-problem",
      "choices": [
        {
          "text": "15",
          "reason": ""
        },
        {
          "text": "12",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "16",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        },
        {
          "text": "14",
          "reason": "\uC6D0\uBCF8\uC758 \uACC4\uC0B0\xB7\uC790\uB9BF\uAC12\xB7\uB2E8\uC704 \uC624\uAC1C\uB150 \uC120\uD0DD\uC9C0; \uC0AC\uB78C\uC774 \uD0C0\uB2F9\uC131 \uD655\uC778 \uD544\uC694"
        }
      ]
    },
    "originalQuestion": "\uAC00\uB85C\uC640 \uC138\uB85C\uC758 \uD569\uC774 20cm\uC774\uACE0 \uB458\uB808\uAC00 40cm\uC778 \uC9C1\uC0AC\uAC01\uD615\uC5D0\uC11C, \uAC00\uB85C\uAC00 \uC138\uB85C\uC758 3\uBC30\uB77C\uBA74 \uAC00\uB85C\uB294 \uBA87 cm\uC77C\uAE4C\uC694?",
    "originalChoices": [
      {
        "id": "t_opt_1",
        "text": "15cm"
      },
      {
        "id": "t_opt_2",
        "text": "12cm"
      },
      {
        "id": "t_opt_3",
        "text": "16cm"
      },
      {
        "id": "t_opt_4",
        "text": "14cm"
      }
    ],
    "originalAnswer": {
      "kind": "single-choice",
      "choiceId": "t_opt_1"
    }
  }
];

// learning-review-r1/native/data/upper-legacy-register.js
for (const r2 of upperLegacyContent) {
  const n = Number(r2.unitId.slice(-1));
  A(r2.grade, r2.semester, n, "LEGACY-" + r2.sourceId, r2.code, r2.difficulty, { "4\uC21803-25": "\uC0BC\uAC01\uD615\xB7\uC0AC\uAC01\uD615 \uB0B4\uAC01\uC758 \uD569\uC73C\uB85C \uB098\uBA38\uC9C0 \uAC01 \uAD6C\uD558\uAE30", "4\uC21801-04": "\uACF1\uC148 \uAD00\uACC4\uC5D0\uC11C \uBE60\uC9C4 \uC218 \uB610\uB294 \uC798\uBABB\uB41C \uACC4\uC0B0 \uBCF5\uC6D0\uD558\uAE30", "4\uC21801-07": "\uBAAB\uACFC \uB098\uBA38\uC9C0 \uB610\uB294 \uB098\uB217\uC148 \uC5ED\uAD00\uACC4 \uC801\uC6A9\uD558\uAE30", "4\uC21801-15": "\uAC19\uC740 \uBD84\uBAA8 \uBD84\uC218\uC758 \uB367\uC148\xB7\uBE84\uC148\uACFC \uC5ED\uAD00\uACC4 \uC801\uC6A9\uD558\uAE30", "4\uC21801-13": "\uC18C\uC218\uC758 \uC790\uB9AC \uC22B\uC790\uAC00 \uB098\uD0C0\uB0B4\uB294 \uAC12 \uC77D\uAE30", "4\uC21801-16": "\uC18C\uC218\uC778 \uCE21\uC815\uB7C9\uC744 \uB354\uD558\uAC70\uB098 \uBE7C\uACE0 \uBE48\uCE78 \uBCF5\uC6D0\uD558\uAE30", "6\uC21803-11": "\uB3C4\uD615\uC758 \uAC19\uC740 \uBCC0\uACFC \uB458\uB808 \uAD00\uACC4\uB85C \uAE38\uC774 \uAD6C\uD558\uAE30" }[r2.code], () => structuredClone(r2.payload), 1);
}

// learning-review-r1/native/data/upper-grade4.js
var a9 = (s, u, id, code, l, o, fn, d = 24) => A(4, s, u, id, code, l, o, fn, d);
a9(1, 1, "zero-place", "4\uC21801-01", 1, "\uD070 \uC218\uC5D0\uC11C 0\uC778 \uC790\uB9AC\uC758 \uC5ED\uD560 \uC124\uBA85\uD558\uAE30", () => C("50400\uC5D0\uC11C \uBC31\uC758 \uC790\uB9AC \uC22B\uC790 4\uB97C \uC9C0\uC6B0\uACE0 5000\uC774\uB77C\uACE0 \uC37C\uC2B5\uB2C8\uB2E4. \uC798\uBABB\uB41C \uAE4C\uB2ED\uC744 \uACE0\uB974\uC138\uC694.", "0\uC744 \uC5C6\uC560\uBA74 \uB2E4\uB978 \uC22B\uC790\uC758 \uC790\uB9AC\uB3C4 \uB2EC\uB77C\uC9C4\uB2E4", [["0\uC740 \uAC12\uC774 \uC5C6\uC73C\uBBC0\uB85C \uC5B8\uC81C\uB098 \uC9C0\uC6CC\uB3C4 \uB41C\uB2E4", "\uC790\uB9AC \uD45C\uC2DC \uC5ED\uD560 \uBB34\uC2DC"], ["4\uB9CC \uBE7C\uBA74 \uB098\uBA38\uC9C0 \uC790\uB9AC\uB294 \uADF8\uB300\uB85C\uC774\uB2E4", "\uC22B\uC790 \uC704\uCE58 \uC774\uB3D9 \uBB34\uC2DC"]], "0\uB3C4 \uB2E4\uB978 \uC22B\uC790\uC758 \uC790\uB9AC\uB97C \uC720\uC9C0\uD558\uB294 \uC5ED\uD560\uC744 \uD558\uBBC0\uB85C \uB9C8\uC74C\uB300\uB85C \uC9C0\uC6B8 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."), 1);
a9(1, 1, "digit-value", "4\uC21801-01", 2, "\uC2ED\uB9CC \uC790\uB9AC \uC22B\uC790\uAC00 \uB098\uD0C0\uB0B4\uB294 \uAC12 \uAD6C\uD558\uAE30", (k) => M(`${523456 + k * 1e5}\uC5D0\uC11C \uC2ED\uB9CC \uC790\uB9AC \uC22B\uC790\uAC00 \uB098\uD0C0\uB0B4\uB294 \uAC12\uC740 \uC5BC\uB9C8\uC785\uB2C8\uAE4C?`, "foundation", "place-value", { task: "large-number", a: String(523456 + k * 1e5), place: "100000" }, "\uD574\uB2F9 \uC790\uB9AC \uC22B\uC790\uC5D0 100000\uC744 \uACF1\uD55C \uAC12\uC740 {answer}\uC785\uB2C8\uB2E4."));
a9(1, 1, "compare-near", "4\uC21801-02", 2, "\uC790\uB9AC \uC218\uAC00 \uAC19\uC740 \uD070 \uC218 \uBE44\uAD50\uD558\uAE30", (k) => M(`\uC67C\uCABD ${32e4 + k * 1e4 + (k % 2 ? 400 : 40)}\uC640 \uC624\uB978\uCABD ${32e4 + k * 1e4 + (k % 2 ? 40 : 400)} \uC911 \uD070 \uC218\uAC00 \uC788\uB294 \uCABD\uC744 \uC801\uC73C\uC138\uC694.`, "foundation", "compare", { task: "large-number", a: String(32e4 + k * 1e4 + (k % 2 ? 400 : 40)), b: String(32e4 + k * 1e4 + (k % 2 ? 40 : 400)) }, "\uB192\uC740 \uC790\uB9AC\uBD80\uD130 \uBE44\uAD50\uD558\uC5EC \uCC98\uC74C \uB2E4\uB978 \uC790\uB9AC\uC758 \uC22B\uC790\uAC00 \uD070 \uCABD\uC740 {answer}\uC785\uB2C8\uB2E4."));
a9(1, 1, "sequence-step", "4\uC21801-02", 3, "\uD070 \uC218\uC758 \uC77C\uC815\uD55C \uAC04\uACA9\uC5D0\uC11C \uB2E4\uC74C \uC218 \uCC3E\uAE30", (k) => E(`${7e4 + k * 1e4}, ${8e4 + k * 1e4}, ${9e4 + k * 1e4}\uC740 10000\uC529 \uCEE4\uC9C0\uB294 \uC218\uC785\uB2C8\uB2E4. \uB2E4\uC74C \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [9e4 + k * 1e4, 1e4, "+"], "\uB9C8\uC9C0\uB9C9 \uC218\uC5D0 \uAC19\uC740 \uAC04\uACA9 10000\uC744 \uB354\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "pattern"));
a9(1, 1, "range-digit", "4\uC21801-02", 4, "\uD070 \uC218 \uBE44\uAD50 \uC870\uAC74\uC5D0\uC11C \uAC00\uB2A5\uD55C \uC22B\uC790 \uCC3E\uAE30", () => C("52\u25A100\uC740 52600\uBCF4\uB2E4 \uD06C\uACE0 52800\uBCF4\uB2E4 \uC791\uC2B5\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC22B\uC790\uB97C \uACE0\uB974\uC138\uC694.", "7", [["6", "\uD070 \uC870\uAC74\uC5D0\uC11C \uB4F1\uD638 \uD3EC\uD568"], ["8", "\uC791\uC740 \uC870\uAC74\uC5D0\uC11C \uB4F1\uD638 \uD3EC\uD568"], ["5", "\uACBD\uACC4\uBCF4\uB2E4 \uC791\uC740 \uC22B\uC790"]], "52600\uACFC 52800 \uC0AC\uC774\uC778 52700\uC774\uC5B4\uC57C \uD558\uBBC0\uB85C \u25A1\uB294 7\uC785\uB2C8\uB2E4."), 1);
a9(1, 1, "group-reading", "4\uC21801-01", 1, "\uB9CC \uB2E8\uC704\uC640 \uB0A8\uC740 \uC218\uB85C \uD070 \uC218 \uB098\uD0C0\uB0B4\uAE30", (k) => E(`\uB9CC\uC774 ${8 + k}\uAC1C\uC774\uACE0 \uCC9C\uC774 3\uAC1C\uC778 \uC218\uB97C \uC22B\uC790\uB85C \uC4F0\uC138\uC694.`, [8 + k, 1e4, "*", 3e3, "+"], "\uB9CC \uB2E8\uC704 \uAC12\uACFC \uCC9C \uB2E8\uC704 \uAC12\uC744 \uD569\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "concept"));
a9(1, 2, "angle-combine", "4\uC21803-24", 3, "\uACB9\uCE58\uC9C0 \uC54A\uB294 \uB450 \uAC01\uC758 \uD569 \uAD6C\uD558\uAE30", (k) => E(`\uD55C \uAF2D\uC9D3\uC810\uC5D0\uC11C \uB098\uB780\uD788 \uBD99\uC740 \uB450 \uAC01\uC774 ${30 + k}\xB0\uC640 ${50 + k}\xB0\uC785\uB2C8\uB2E4. \uB0B4\uBD80\uAC00 \uACB9\uCE58\uC9C0 \uC54A\uC744 \uB54C \uB450 \uAC01\uC744 \uD569\uCE5C \uD06C\uAE30\uB294 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?`, [30 + k, 50 + k, "+"], "\uACB9\uCE58\uC9C0 \uC54A\uB294 \uB450 \uAC01\uC758 \uD06C\uAE30\uB97C \uB354\uD558\uBA74 {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"));
a9(1, 2, "angle-difference", "4\uC21803-24", 4, "\uC804\uCCB4 \uAC01\uACFC \uC77C\uBD80 \uAC01\uC73C\uB85C \uB098\uBA38\uC9C0 \uAC01 \uAD6C\uD558\uAE30", (k) => E(`${110 + k}\xB0\uC778 \uAC01\uC744 \uB450 \uBD80\uBD84\uC73C\uB85C \uB098\uB234\uC2B5\uB2C8\uB2E4. \uD55C \uBD80\uBD84\uC774 ${40 + k % 7}\xB0\uC77C \uB54C \uB2E4\uB978 \uBD80\uBD84\uC740 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?`, [110 + k, 40 + k % 7, "-"], "\uC804\uCCB4 \uAC01\uC5D0\uC11C \uC8FC\uC5B4\uC9C4 \uBD80\uBD84\uC744 \uBE7C\uBA74 {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"));
a9(1, 2, "triangle-missing", "4\uC21803-25", 4, "\uC0BC\uAC01\uD615 \uB0B4\uAC01\uC758 \uD569\uC73C\uB85C \uB098\uBA38\uC9C0 \uAC01 \uAD6C\uD558\uAE30", (k) => E(`\uC0BC\uAC01\uD615\uC758 \uB450 \uB0B4\uAC01\uC774 ${50 + k}\xB0\uC640 60\xB0\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uB0B4\uAC01\uC740 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?`, [180, 50 + k, "-", 60, "-"], "\uC0BC\uAC01\uD615\uC758 \uC138 \uB0B4\uAC01\uC758 \uD569 180\xB0\uC5D0\uC11C \uB450 \uAC01\uC744 \uBE7C\uBA74 {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"));
a9(1, 2, "quad-missing", "4\uC21803-25", 4, "\uC0AC\uAC01\uD615 \uB0B4\uAC01\uC758 \uD569\uC73C\uB85C \uB098\uBA38\uC9C0 \uAC01 \uAD6C\uD558\uAE30", (k) => E(`\uC0AC\uAC01\uD615\uC758 \uC138 \uB0B4\uAC01\uC740 90\xB0, 80\xB0, ${100 + k}\xB0\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uB0B4\uAC01\uC740 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?`, [360, 90, "-", 80, "-", 100 + k, "-"], "\uC0AC\uAC01\uD615\uC758 \uB0B4\uAC01\uC758 \uD569 360\xB0\uC5D0\uC11C \uC138 \uAC01\uC744 \uBE7C\uBA74 {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"));
a9(1, 2, "protractor-origin", "4\uC21803-24", 1, "\uAC01\uB3C4\uAE30\uC5D0\uC11C \uC2DC\uC791 \uB208\uAE08 \uC120\uD0DD\uD558\uAE30", () => C("\uAC01\uC758 \uD55C \uBCC0\uC744 \uAC01\uB3C4\uAE30\uC758 \uC624\uB978\uCABD 0 \uB208\uAE08\uC5D0 \uB9DE\uCDC4\uC2B5\uB2C8\uB2E4. \uB2E4\uB978 \uBCC0\uC5D0 \uC548\uCABD \uB208\uAE08 40, \uBC14\uAE65\uCABD \uB208\uAE08 140\uC774 \uD568\uAED8 \uBCF4\uC785\uB2C8\uB2E4. \uAC01\uC758 \uD06C\uAE30\uB294 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?", "40", [["140", "\uB9DE\uCD98 0\uACFC \uB2E4\uB978 \uB208\uAE08 \uC0AC\uC6A9"], ["180", "\uBC18\uC6D0 \uC804\uCCB4\uB97C \uAC01\uC73C\uB85C \uC624\uC778"]], "\uC624\uB978\uCABD 0\uC5D0\uC11C \uC2DC\uC791\uD558\uB294 \uB208\uAE08\uC744 \uC77D\uC73C\uBBC0\uB85C 40\xB0\uC785\uB2C8\uB2E4."), 1);
a9(1, 2, "angle-not-length", "4\uC21803-02", 1, "\uBCC0\uC758 \uAE38\uC774\uAC00 \uAC01\uC758 \uD06C\uAE30\uB97C \uBC14\uAFB8\uC9C0 \uC54A\uC74C \uC774\uD574\uD558\uAE30", () => C("\uAC01\uC758 \uB450 \uBCC0\uC744 \uAC19\uC740 \uBC29\uD5A5\uC73C\uB85C \uB354 \uAE38\uAC8C \uADF8\uB838\uC2B5\uB2C8\uB2E4. \uAC01\uC758 \uBC8C\uC5B4\uC9C4 \uC815\uB3C4\uAC00 \uADF8\uB300\uB85C\uB77C\uBA74 \uAC01\uC758 \uD06C\uAE30\uB294 \uC5B4\uB5BB\uAC8C \uB429\uB2C8\uAE4C?", "\uADF8\uB300\uB85C\uC774\uB2E4", [["\uCEE4\uC9C4\uB2E4", "\uBCC0\uC758 \uAE38\uC774\uC640 \uAC01\uB3C4 \uD63C\uB3D9"], ["\uC791\uC544\uC9C4\uB2E4", "\uBCC0\uC758 \uAE38\uC774\uC640 \uAC01\uB3C4 \uD63C\uB3D9"]], "\uAC01\uC758 \uD06C\uAE30\uB294 \uB450 \uBCC0\uC774 \uBC8C\uC5B4\uC9C4 \uC815\uB3C4\uB85C \uC815\uD574\uC9D1\uB2C8\uB2E4."), 1);
a9(1, 3, "box-total", "4\uC21801-04", 3, "\uC0C1\uC790 \uC218\uC640 \uC0C1\uC790\uB2F9 \uC218\uB97C \uACF1\uD558\uAE30", (k) => E(`\uC5F0\uD544 \uD55C \uC0C1\uC790\uC5D0 ${12 + k}\uC790\uB8E8\uC529 \uC788\uC2B5\uB2C8\uB2E4. 24\uC0C1\uC790\uC5D0\uB294 \uBAA8\uB450 \uBA87 \uC790\uB8E8\uC785\uB2C8\uAE4C?`, [12 + k, 24, "*"], "\uD55C \uC0C1\uC790\uC5D0 \uB4E0 \uC218\uC5D0 \uC0C1\uC790 \uC218\uB97C \uACF1\uD558\uBA74 {answer}\uC790\uB8E8\uC785\uB2C8\uB2E4.", "\uC790\uB8E8"));
a9(1, 3, "equal-packs", "4\uC21801-07", 3, "\uB450 \uC790\uB9AC \uC218\uB85C \uB611\uAC19\uC774 \uB098\uB204\uAE30", (k) => E(`\uCC45 ${12 * (18 + k)}\uAD8C\uC744 12\uAD8C\uC529 \uBB36\uC2B5\uB2C8\uB2E4. \uBB36\uC74C\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [12 * (18 + k), 12, "/"], "\uC804\uCCB4 \uCC45 \uC218\uB97C \uD55C \uBB36\uC74C\uC758 \uCC45 \uC218\uB85C \uB098\uB204\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a9(1, 3, "bus-min", "4\uC21801-07", 4, "\uB098\uBA38\uC9C0\uAC00 \uC788\uC744 \uB54C \uD544\uC694\uD55C \uBB36\uC74C \uC218 \uD310\uB2E8\uD558\uAE30", (k) => E(`\uACAC\uD559 \uC778\uC6D0\uC740 ${52 + 2 * k}\uBA85\uC774\uACE0 \uBC84\uC2A4 \uD55C \uB300\uC758 \uC88C\uC11D\uC740 30\uAC1C\uC785\uB2C8\uB2E4. \uBAA8\uB450 \uC549\uC73C\uB824\uBA74 \uBC84\uC2A4\uAC00 \uCD5C\uC18C \uBA87 \uB300 \uD544\uC694\uD569\uB2C8\uAE4C?`, [52 + 2 * k, 30, "ceil/"], "\uBAAB\uB9CC\uD07C\uC758 \uBC84\uC2A4\uB85C \uBD80\uC871\uD558\uBA74 \uB098\uBA38\uC9C0 \uC778\uC6D0\uC774 \uD0C8 \uBC84\uC2A4 \uD55C \uB300\uB97C \uB354\uD574\uC57C \uD569\uB2C8\uB2E4. \uD544\uC694\uD55C \uB300\uC218\uB294 {answer}\uB300\uC785\uB2C8\uB2E4.", "\uB300"));
a9(1, 3, "division-left", "4\uC21801-07", 3, "\uB098\uB217\uC148 \uC0C1\uD669\uC5D0\uC11C \uB098\uBA38\uC9C0 \uAD6C\uD558\uAE30", (k) => E(`\uC0C9\uC885\uC774 ${101 + k}\uC7A5\uC744 12\uC7A5\uC529 \uB098\uB204\uC5B4 \uC90D\uB2C8\uB2E4. 12\uC7A5\uC9DC\uB9AC \uBB36\uC74C\uC744 \uCD5C\uB300\uD55C \uB9CC\uB4E0 \uB4A4 \uB0A8\uB294 \uC0C9\uC885\uC774\uB294 \uBA87 \uC7A5\uC785\uB2C8\uAE4C?`, [101 + k, 12, "%"], "\uC804\uCCB4 \uC7A5\uC218\uB97C 12\uB85C \uB098\uB208 \uB098\uBA38\uC9C0\uB294 {answer}\uC7A5\uC785\uB2C8\uB2E4.", "\uC7A5"));
a9(1, 3, "estimate-bound", "4\uC21801-08", 3, "\uACF1\uC148 \uC5B4\uB9BC\uC73C\uB85C \uACB0\uACFC \uBC94\uC704 \uD655\uC778\uD558\uAE30", () => C("198 \xD7 21\uC744 200 \xD7 20\uC73C\uB85C \uC5B4\uB9BC\uD558\uBA74 \uC57D 4000\uC785\uB2C8\uB2E4. \uACC4\uC0B0 \uACB0\uACFC\uAC00 4158\uACFC 41580 \uC911 \uC5B4\uB290 \uAC83\uC5D0 \uAC00\uAE4C\uC6B8\uC9C0 \uACE0\uB974\uC138\uC694.", "4158", [["41580", "\uACF1\uC148 \uC790\uB9AC \uC774\uB3D9 \uC624\uB958"]], "\uC5B4\uB9BC\uAC12 4000\uACFC \uAC00\uAE4C\uC6B4 \uAC12\uC740 4158\uC785\uB2C8\uB2E4."), 1);
a9(1, 3, "recover-dividend", "4\uC21801-07", 4, "\uBAAB\uACFC \uB098\uBA38\uC9C0\uC5D0\uC11C \uB098\uB204\uC5B4\uC9C0\uB294 \uC218 \uBCF5\uC6D0\uD558\uAE30", (k) => E(`\uC5B4\uB5A4 \uC218\uB97C 14\uB85C \uB098\uB204\uBA74 \uBAAB\uC740 ${12 + k}, \uB098\uBA38\uC9C0\uB294 5\uC785\uB2C8\uB2E4. \uC5B4\uB5A4 \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [14, 12 + k, "*", 5, "+"], "\uB098\uB204\uB294 \uC218 \xD7 \uBAAB + \uB098\uBA38\uC9C0\uB85C \uBCF5\uC6D0\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4."));
a9(1, 4, "translation-property", "4\uC21803-04", 1, "\uBC00\uAE30\uC5D0\uC11C \uC720\uC9C0\uB418\uB294 \uB3C4\uD615\uC758 \uC131\uC9C8 \uC774\uD574\uD558\uAE30", () => C("\uC0BC\uAC01\uD615\uC744 \uC624\uB978\uCABD\uC73C\uB85C \uBC00\uAE30\uB9CC \uD588\uC2B5\uB2C8\uB2E4. \uBC14\uB00C\uB294 \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uC704\uCE58", [["\uBCC0\uC758 \uAE38\uC774", "\uBC00\uAE30\uC640 \uD655\uB300 \uD63C\uB3D9"], ["\uAC01\uC758 \uD06C\uAE30", "\uBC00\uAE30\uC640 \uBCC0\uD615 \uD63C\uB3D9"]], "\uBC00\uAE30\uB294 \uB3C4\uD615\uC758 \uD06C\uAE30\uC640 \uBAA8\uC591\uC744 \uC720\uC9C0\uD558\uACE0 \uC704\uCE58\uB97C \uBC14\uAFC9\uB2C8\uB2E4."), 1);
a9(1, 4, "reflection-direction", "4\uC21803-04", 2, "\uC88C\uC6B0 \uB4A4\uC9D1\uAE30 \uD6C4 \uBC29\uD5A5 \uD310\uB2E8\uD558\uAE30", () => M("\uC624\uB978\uCABD\uC744 \uAC00\uB9AC\uD0A4\uB294 \uD654\uC0B4\uD45C\uB97C \uC88C\uC6B0\uB85C \uB4A4\uC9D1\uC5C8\uC2B5\uB2C8\uB2E4. \uC774\uC81C \uC5B4\uB290 \uBC29\uD5A5\uC744 \uAC00\uB9AC\uD0B5\uB2C8\uAE4C?", "geometry", "direction", { shape: "transform", direction: "right", operations: ["flip-horizontal"] }, "\uC88C\uC6B0\uB97C \uB4A4\uC9D1\uC73C\uBA74 \uC624\uB978\uCABD\uACFC \uC67C\uCABD\uC774 \uC11C\uB85C \uBC14\uB00C\uBBC0\uB85C {answer}\uC785\uB2C8\uB2E4."), 1);
a9(1, 4, "half-turn", "4\uC21803-04", 2, "\uBC18 \uBC14\uD034 \uB3CC\uB9B0 \uBC29\uD5A5 \uD310\uB2E8\uD558\uAE30", () => M("\uC704\uCABD\uC744 \uAC00\uB9AC\uD0A4\uB294 \uD654\uC0B4\uD45C\uB97C \uBC18 \uBC14\uD034 \uB3CC\uB838\uC2B5\uB2C8\uB2E4. \uC774\uC81C \uC5B4\uB290 \uBC29\uD5A5\uC744 \uAC00\uB9AC\uD0B5\uB2C8\uAE4C?", "geometry", "direction", { shape: "transform", direction: "up", operations: ["rotate180"] }, "\uBC18 \uBC14\uD034 \uB3CC\uB9AC\uBA74 \uBC18\uB300 \uBC29\uD5A5\uC778 {answer}\uB97C \uAC00\uB9AC\uD0B5\uB2C8\uB2E4."), 1);
a9(1, 4, "double-flip", "4\uC21803-04", 3, "\uAC19\uC740 \uB4A4\uC9D1\uAE30\uB97C \uB450 \uBC88 \uD55C \uACB0\uACFC \uD310\uB2E8\uD558\uAE30", () => M("\uC67C\uCABD\uC744 \uAC00\uB9AC\uD0A4\uB294 \uD654\uC0B4\uD45C\uB97C \uC88C\uC6B0\uB85C \uB4A4\uC9D1\uACE0 \uB2E4\uC2DC \uC88C\uC6B0\uB85C \uB4A4\uC9D1\uC5C8\uC2B5\uB2C8\uB2E4. \uB9C8\uC9C0\uB9C9 \uBC29\uD5A5\uC744 \uC801\uC73C\uC138\uC694.", "geometry", "direction", { shape: "transform", direction: "left", operations: ["flip-horizontal", "flip-horizontal"] }, "\uAC19\uC740 \uB4A4\uC9D1\uAE30\uB97C \uB450 \uBC88 \uD558\uBA74 \uCC98\uC74C \uBC29\uD5A5\uC73C\uB85C \uB3CC\uC544\uC635\uB2C8\uB2E4. \uB2F5\uC740 {answer}\uC785\uB2C8\uB2E4."), 1);
a9(1, 4, "route-horizontal", "4\uC21803-05", 3, "\uACA9\uC790 \uC774\uB3D9\uC758 \uC88C\uC6B0 \uC704\uCE58 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uCD9C\uBC1C\uC810\uC5D0\uC11C \uC624\uB978\uCABD\uC73C\uB85C ${5 + k}\uCE78, \uC67C\uCABD\uC73C\uB85C 3\uCE78 \uC774\uB3D9\uD588\uC2B5\uB2C8\uB2E4. \uB3C4\uCC29\uC810\uC740 \uCD9C\uBC1C\uC810\uC758 \uC624\uB978\uCABD \uBA87 \uCE78\uC785\uB2C8\uAE4C?`, [5 + k, 3, "-"], "\uBC18\uB300 \uBC29\uD5A5\uC758 \uC774\uB3D9\uC744 \uBE7C\uBA74 \uC624\uB978\uCABD {answer}\uCE78\uC785\uB2C8\uB2E4.", "\uCE78"));
a9(1, 4, "inverse-route", "4\uC21803-05", 4, "\uB3C4\uCC29 \uC704\uCE58\uC5D0\uC11C \uD544\uC694\uD55C \uC774\uB3D9 \uCC3E\uAE30", (k) => E(`\uC624\uB978\uCABD\uC73C\uB85C ${8 + k}\uCE78 \uC774\uB3D9\uD55C \uB4A4 \uC67C\uCABD\uC73C\uB85C \uC774\uB3D9\uD588\uB354\uB2C8 \uCD9C\uBC1C\uC810\uC758 \uC624\uB978\uCABD 2\uCE78\uC5D0 \uB3C4\uCC29\uD588\uC2B5\uB2C8\uB2E4. \uC67C\uCABD\uC73C\uB85C \uBA87 \uCE78 \uC774\uB3D9\uD588\uC2B5\uB2C8\uAE4C?`, [8 + k, 2, "-"], "\uCC98\uC74C \uC624\uB978\uCABD \uC774\uB3D9\uC5D0\uC11C \uB0A8\uC740 \uC624\uB978\uCABD 2\uCE78\uC744 \uBE7C\uBA74 \uC67C\uCABD \uC774\uB3D9\uC740 {answer}\uCE78\uC785\uB2C8\uB2E4.", "\uCE78"));
var rows = (k) => [{ label: "\uCD95\uAD6C", value: 8 + 2 * (k % 5) }, { label: "\uB18D\uAD6C", value: 6 + k % 5 }, { label: "\uBC30\uAD6C", value: 4 + k % 5 }];
a9(1, 5, "bar-pair", "4\uC21804-01", 2, "\uC790\uB8CC\uC758 \uB450 \uD56D\uBAA9 \uD569 \uAD6C\uD558\uAE30", (k) => T("\uC6B4\uB3D9\uBCC4 \uD76C\uB9DD \uC778\uC6D0 \uD45C\uC5D0\uC11C \uCD95\uAD6C\uC640 \uB18D\uAD6C\uB97C \uD76C\uB9DD\uD55C \uD559\uC0DD\uC740 \uBAA8\uB450 \uBA87 \uBA85\uC785\uB2C8\uAE4C?", "pair-sum", rows(k), "\uCD95\uAD6C", "\uB18D\uAD6C", "\uB450 \uD56D\uBAA9\uC758 \uC778\uC6D0\uC744 \uB354\uD558\uBA74 {answer}\uBA85\uC785\uB2C8\uB2E4."), 5);
a9(1, 5, "bar-gap", "4\uC21804-01", 2, "\uC790\uB8CC\uC758 \uB450 \uD56D\uBAA9 \uCC28 \uAD6C\uD558\uAE30", (k) => T("\uC6B4\uB3D9\uBCC4 \uD76C\uB9DD \uC778\uC6D0 \uD45C\uC5D0\uC11C \uCD95\uAD6C \uC778\uC6D0\uC740 \uBC30\uAD6C \uC778\uC6D0\uBCF4\uB2E4 \uBA87 \uBA85 \uB9CE\uC2B5\uB2C8\uAE4C?", "difference", rows(k), "\uCD95\uAD6C", "\uBC30\uAD6C", "\uCD95\uAD6C \uC778\uC6D0\uC5D0\uC11C \uBC30\uAD6C \uC778\uC6D0\uC744 \uBE7C\uBA74 {answer}\uBA85\uC785\uB2C8\uB2E4."), 5);
a9(1, 5, "bar-all", "4\uC21804-01", 3, "\uBE60\uC9D0\uC5C6\uC774 \uC870\uC0AC\uD55C \uC790\uB8CC\uC758 \uC804\uCCB4 \uC778\uC6D0 \uAD6C\uD558\uAE30", (k) => T("\uD55C \uD559\uC0DD\uC774 \uD55C \uC6B4\uB3D9\uB9CC \uACE8\uB790\uACE0 \uBAA8\uB4E0 \uD559\uC0DD\uC758 \uC751\uB2F5\uC774 \uD45C\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. \uC870\uC0AC\uD55C \uD559\uC0DD\uC740 \uBAA8\uB450 \uBA87 \uBA85\uC785\uB2C8\uAE4C?", "sum", rows(k), "\uCD95\uAD6C", "\uB18D\uAD6C", "\uBAA8\uB4E0 \uD56D\uBAA9\uC758 \uC778\uC6D0\uC744 \uD55C \uBC88\uC529 \uB354\uD558\uBA74 {answer}\uBA85\uC785\uB2C8\uB2E4."), 5);
a9(1, 5, "bar-rank", "4\uC21804-01", 1, "\uAC00\uC7A5 \uD070 \uC790\uB8CC \uD56D\uBAA9 \uCC3E\uAE30", (k) => M("\uC6B4\uB3D9\uBCC4 \uD76C\uB9DD \uC778\uC6D0 \uD45C\uC5D0\uC11C \uAC00\uC7A5 \uB9CE\uC740 \uD559\uC0DD\uC774 \uACE0\uB978 \uC6B4\uB3D9\uC744 \uC801\uC73C\uC138\uC694.", "table", "max-label", { rows: rows(k).map((r2, i, all) => ({ ...r2, value: all[(i + k) % 3].value })), valueUnit: "\uBA85" }, "\uAC01 \uD56D\uBAA9\uC758 \uC778\uC6D0\uC744 \uBE44\uAD50\uD558\uBA74 {answer}\uAC00 \uAC00\uC7A5 \uB9CE\uC2B5\uB2C8\uB2E4.", "", "data-interpretation"), 5);
a9(1, 5, "survey-absent", "4\uC21804-03", 3, "\uC870\uC0AC \uB204\uB77D\uC73C\uB85C \uC0DD\uAE30\uB294 \uACB0\uB860\uC758 \uD55C\uACC4 \uC774\uD574\uD558\uAE30", () => C("\uD559\uAE09 \uC804\uCCB4\uC758 \uD76C\uB9DD \uCCB4\uD5D8\uC744 \uC870\uC0AC\uD558\uB824\uB294\uB370 \uACB0\uC11D\uD55C 3\uBA85\uC758 \uC751\uB2F5\uC744 \uBC1B\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uAC00\uC7A5 \uC54C\uB9DE\uC740 \uD589\uB3D9\uC744 \uACE0\uB974\uC138\uC694.", "\uACB0\uC11D\uD55C \uD559\uC0DD\uC758 \uC751\uB2F5\uB3C4 \uBC1B\uC740 \uB4A4 \uC804\uCCB4 \uACB0\uACFC\uB97C \uC815\uB9AC\uD55C\uB2E4", [["\uD604\uC7AC \uC751\uB2F5\uB9CC \uD559\uAE09 \uC804\uCCB4\uC758 \uACB0\uACFC\uB77C\uACE0 \uBC1C\uD45C\uD55C\uB2E4", "\uC870\uC0AC \uB300\uC0C1 \uB204\uB77D"], ["\uACB0\uC11D\uD55C \uD559\uC0DD\uC740 \uAC00\uC7A5 \uB9CE\uC740 \uD56D\uBAA9\uC744 \uACE8\uB790\uB2E4\uACE0 \uC13C\uB2E4", "\uADFC\uAC70 \uC5C6\uB294 \uBCF4\uCDA9"]], "\uD559\uAE09 \uC804\uCCB4\uB97C \uC870\uC0AC\uD558\uB824\uBA74 \uACB0\uC11D\uD55C \uD559\uC0DD\uC758 \uC2E4\uC81C \uC751\uB2F5\uB3C4 \uD544\uC694\uD569\uB2C8\uB2E4."), 1);
a9(1, 5, "survey-missing", "4\uC21804-03", 4, "\uC804\uCCB4 \uC778\uC6D0\uACFC \uAE30\uB85D\uB41C \uC790\uB8CC\uB85C \uB204\uB77D \uC778\uC6D0 \uAD6C\uD558\uAE30", (k) => E(`\uD55C \uD559\uC0DD\uC774 \uD55C \uC6B4\uB3D9\uC744 \uACE8\uB790\uC2B5\uB2C8\uB2E4. \uD559\uAE09\uC740 ${30 + k % 6}\uBA85\uC778\uB370 \uD45C\uC5D0 \uAE30\uB85D\uB41C \uC778\uC6D0 \uD569\uACC4\uB294 ${20 + Math.floor(k / 6)}\uBA85\uC785\uB2C8\uB2E4. \uC544\uC9C1 \uAE30\uB85D\uD558\uC9C0 \uC54A\uC740 \uD559\uC0DD\uC740 \uBA87 \uBA85\uC785\uB2C8\uAE4C?`, [30 + k % 6, 20 + Math.floor(k / 6), "-"], "\uD559\uAE09 \uC804\uCCB4\uC5D0\uC11C \uAE30\uB85D\uB41C \uC778\uC6D0\uC744 \uBE7C\uBA74 {answer}\uBA85\uC785\uB2C8\uB2E4.", "\uBA85", "data-interpretation"));
a9(1, 6, "increasing-rule", "4\uC21802-01", 2, "\uC77C\uC815\uD558\uAC8C \uC99D\uAC00\uD558\uB294 \uC218\uC758 \uADDC\uCE59 \uC0AC\uC6A9\uD558\uAE30", (k) => E(`${4 + k}, ${7 + k}, ${10 + k}, ${13 + k}\uC758 \uADDC\uCE59\uC740 3\uC529 \uB354\uD558\uAE30\uC785\uB2C8\uB2E4. \uB2E4\uC74C \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [13 + k, 3, "+"], "\uB9C8\uC9C0\uB9C9 \uC218\uC5D0 3\uC744 \uB354\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "pattern"));
a9(1, 6, "decreasing-rule", "4\uC21802-01", 2, "\uC77C\uC815\uD558\uAC8C \uAC10\uC18C\uD558\uB294 \uC218\uC758 \uADDC\uCE59 \uC0AC\uC6A9\uD558\uAE30", (k) => E(`${40 + k}, ${36 + k}, ${32 + k}\uC740 4\uC529 \uC791\uC544\uC9D1\uB2C8\uB2E4. \uB2E4\uC74C \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [32 + k, 4, "-"], "\uB9C8\uC9C0\uB9C9 \uC218\uC5D0\uC11C 4\uB97C \uBE7C\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "pattern"));
a9(1, 6, "multiply-rule", "4\uC21802-01", 3, "\uACF1\uC148 \uADDC\uCE59\uC73C\uB85C \uB2E4\uC74C \uC218 \uCC3E\uAE30", (k) => E(`${2 + k}, ${4 + 2 * k}, ${8 + 4 * k}\uB294 \uC55E \uC218\uC758 2\uBC30\uC785\uB2C8\uB2E4. \uB2E4\uC74C \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [8 + 4 * k, 2, "*"], "\uC55E \uC218\uC758 2\uBC30\uC774\uBBC0\uB85C {answer}\uC785\uB2C8\uB2E4.", "", "pattern"));
a9(1, 6, "result-step", "4\uC21802-02", 3, "\uACF1\uC148\uC2DD \uBC30\uC5F4\uC5D0\uC11C \uACB0\uACFC\uC758 \uC99D\uAC00\uB7C9 \uCC3E\uAE30", (k) => E(`${6 + k} \xD7 10, ${6 + k} \xD7 11, ${6 + k} \xD7 12\uC758 \uACB0\uACFC\uB294 \uCC28\uB840\uB85C \uC5BC\uB9C8\uC529 \uCEE4\uC9D1\uB2C8\uAE4C?`, [6 + k, 1, "*"], "\uBB36\uC74C \uC218\uAC00 \uD55C \uAC1C\uC529 \uB298\uBBC0\uB85C \uD55C \uBB36\uC74C\uC758 \uC591\uC778 {answer}\uB9CC\uD07C \uCEE4\uC9D1\uB2C8\uB2E4.", "", "pattern"));
a9(1, 6, "equality-reverse", "4\uC21802-03", 4, "\uB4F1\uC2DD \uC591\uCABD\uC758 \uC591\uC744 \uAC19\uAC8C \uB9CC\uB4DC\uB294 \uC218 \uCC3E\uAE30", (k) => E(`${24 + k} - \u25A1 = 9\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [24 + k, 9, "-"], "\uAC19\uC740 \uC591\uC744 \uC720\uC9C0\uD558\uB824\uBA74 \uCC98\uC74C \uC218\uC5D0\uC11C 9\uB97C \uBE80 {answer}\uB97C \uBE7C\uC57C \uD569\uB2C8\uB2E4."));
a9(1, 6, "balance-two", "4\uC21802-03", 4, "\uB4F1\uC2DD\uC758 \uB450 \uC5F0\uC0B0\uC744 \uC5F0\uACB0\uD558\uC5EC \uBE48\uCE78 \uCC3E\uAE30", (k) => E(`\u25A1 + 8 = ${14 + k} + 5\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [14 + k, 5, "+", 8, "-"], "\uC624\uB978\uCABD\uC758 \uD569\uC744 \uAD6C\uD55C \uB4A4 8\uC744 \uBE7C\uBA74 {answer}\uC785\uB2C8\uB2E4."));
a9(2, 1, "fraction-join", "4\uC21801-15", 2, "\uBD84\uBAA8\uAC00 \uAC19\uC740 \uBD84\uC218 \uB354\uD558\uAE30", (k) => {
  const p = E(`${f(2 + k % 4, 9)} + ${f(3, 9)}\uB97C \uACC4\uC0B0\uD558\uC138\uC694.`, [f(2 + k % 4, 9), f(3, 9), "+"], "\uBD84\uBAA8\uB294 \uADF8\uB300\uB85C \uB450\uACE0 \uBD84\uC790\uB97C \uB354\uD569\uB2C8\uB2E4.", "", "calculation");
  p.answer = f(5 + k % 4, 9);
  p.explanation += ` \uACB0\uACFC\uB294 ${p.answer}\uC785\uB2C8\uB2E4.`;
  return p;
}, 4);
a9(2, 1, "fraction-left", "4\uC21801-15", 3, "\uBD84\uC218 \uAE38\uC774\uC5D0\uC11C \uC0AC\uC6A9\uD558\uACE0 \uB0A8\uC740 \uC591 \uAD6C\uD558\uAE30", (k) => E(`\uB9AC\uBCF8 ${f(7 + k % 3, 11)} m \uC911 ${f(2, 11)} m\uB97C \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uAE38\uC774\uB97C m \uB2E8\uC704\uC758 \uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, [f(7 + k % 3, 11), f(2, 11), "-"], "\uBD84\uBAA8\uAC00 \uAC19\uC73C\uBBC0\uB85C \uBD84\uC790\uB97C \uBE7C\uBA74 {answer} m\uC785\uB2C8\uB2E4.", "", "word-problem"), 3);
a9(2, 1, "fraction-missing", "4\uC21801-15", 4, "\uBD84\uC218 \uB367\uC148\uC758 \uBE48\uCE78 \uCC3E\uAE30", (k) => {
  const p = E(`\u25A1 + ${f(2, 12)} = ${f(7 + k % 4, 12)}\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uBD84\uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [f(7 + k % 4, 12), f(2, 12), "-"], "\uC804\uCCB4 \uD569\uC5D0\uC11C \uC8FC\uC5B4\uC9C4 \uBD84\uC218\uB97C \uBE8D\uB2C8\uB2E4.", "", "calculation");
  p.answer = f(5 + k % 4, 12);
  p.explanation += ` \uBD84\uBAA8\uB97C \uC720\uC9C0\uD558\uACE0 \uBD84\uC790\uB97C \uBE7C\uBA74 ${p.answer}\uC785\uB2C8\uB2E4.`;
  return p;
}, 4);
a9(2, 1, "denominator-error", "4\uC21801-15", 1, "\uBD84\uBAA8\uAC00 \uAC19\uC740 \uBD84\uC218 \uB367\uC148\uC758 \uC624\uAC1C\uB150 \uCC3E\uAE30", () => C("2/7 + 3/7\uC744 5/14\uB77C\uACE0 \uACC4\uC0B0\uD588\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACE0\uCE5C \uAC12\uC744 \uACE0\uB974\uC138\uC694.", "5/7", [["5/14", "\uBD84\uBAA8\uAE4C\uC9C0 \uB354\uD568"], ["1/7", "\uB367\uC148\uC744 \uBE84\uC148\uC73C\uB85C \uD63C\uB3D9"]], "\uAC19\uC740 \uD06C\uAE30\uC758 1/7 \uC870\uAC01\uC744 \uB354\uD558\uBBC0\uB85C \uC870\uAC01 \uD06C\uAE30\uB294 \uADF8\uB300\uB85C\uC774\uACE0 \uC870\uAC01 \uC218\uB9CC 5\uAC00 \uB429\uB2C8\uB2E4."), 1);
a9(2, 1, "improper-wholes", "4\uC21801-10", 2, "\uAC00\uBD84\uC218\uC5D0 \uD3EC\uD568\uB41C \uC628\uC804\uD55C \uC804\uCCB4 \uC218 \uCC3E\uAE30", (k) => M(`${13 + k}/5\uC5D0\uB294 \uC628\uC804\uD55C 1\uC774 \uBA87 \uAC1C \uB4E4\uC5B4 \uC788\uC2B5\uB2C8\uAE4C?`, "fraction", "whole-count", { numerator: 13 + k, denominator: 5 }, "\uBD84\uC790\uB97C \uBD84\uBAA8\uB85C \uB098\uB208 \uBAAB\uB9CC\uD07C \uC628\uC804\uD55C 1\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uB2F5\uC740 {answer}\uAC1C\uC785\uB2C8\uB2E4."));
a9(2, 1, "like-compare-reason", "4\uC21801-11", 1, "\uAC19\uC740 \uBD84\uBAA8 \uBD84\uC218 \uBE44\uAD50\uC758 \uADFC\uAC70 \uC120\uD0DD\uD558\uAE30", () => C("3/8\uBCF4\uB2E4 5/8\uC774 \uD070 \uAE4C\uB2ED\uC744 \uACE0\uB974\uC138\uC694.", "\uAC19\uC740 \uD06C\uAE30\uC758 \uC870\uAC01\uC774 \uB354 \uB9CE\uAE30 \uB54C\uBB38\uC774\uB2E4", [["\uBD84\uBAA8\uAC00 \uB354 \uD06C\uAE30 \uB54C\uBB38\uC774\uB2E4", "\uAC19\uC740 \uBD84\uBAA8\uC778\uB370 \uBD84\uBAA8 \uBE44\uAD50"], ["\uC870\uAC01 \uD55C \uAC1C\uC758 \uD06C\uAE30\uAC00 \uB354 \uD06C\uAE30 \uB54C\uBB38\uC774\uB2E4", "\uC870\uAC01 \uC218\uC640 \uD06C\uAE30 \uD63C\uB3D9"]], "\uB458 \uB2E4 1/8 \uD06C\uAE30\uC758 \uC870\uAC01\uC774\uBBC0\uB85C \uC870\uAC01\uC774 5\uAC1C\uC778 5/8\uC774 \uB354 \uD07D\uB2C8\uB2E4."), 1);
a9(2, 2, "isosceles-angle", "4\uC21803-25", 4, "\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615\uC758 \uB450 \uAC19\uC740 \uAC01\uACFC \uB0B4\uAC01 \uD569 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615\uC5D0\uC11C \uAC19\uC740 \uB450 \uB0B4\uAC01\uC774 \uAC01\uAC01 ${50 + k}\xB0\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uB0B4\uAC01\uC740 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?`, [180, 50 + k, 2, "*", "-"], "\uAC19\uC740 \uB450 \uAC01\uC758 \uD569\uC744 180\xB0\uC5D0\uC11C \uBE7C\uBA74 {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"));
a9(2, 2, "equal-sides-name", "4\uC21803-08", 1, "\uC138 \uBCC0 \uAE38\uC774\uB85C \uC815\uC0BC\uAC01\uD615 \uBD84\uB958\uD558\uAE30", () => C("\uC138 \uBCC0\uC758 \uAE38\uC774\uAC00 \uBAA8\uB450 4 cm\uC778 \uC0BC\uAC01\uD615\uC758 \uAC00\uC7A5 \uAD6C\uCCB4\uC801\uC778 \uC774\uB984\uC744 \uACE0\uB974\uC138\uC694.", "\uC815\uC0BC\uAC01\uD615", [["\uC77C\uBC18 \uC0BC\uAC01\uD615", "\uAC19\uC740 \uC138 \uBCC0 \uC131\uC9C8 \uBB34\uC2DC"], ["\uC9C1\uAC01\uC0BC\uAC01\uD615", "\uBCC0\uACFC \uAC01 \uBD84\uB958 \uD63C\uB3D9"]], "\uC138 \uBCC0\uC758 \uAE38\uC774\uAC00 \uBAA8\uB450 \uAC19\uC740 \uC0BC\uAC01\uD615\uC740 \uC815\uC0BC\uAC01\uD615\uC785\uB2C8\uB2E4."), 1);
a9(2, 2, "two-sides-name", "4\uC21803-08", 1, "\uAC19\uC740 \uB450 \uBCC0\uC73C\uB85C \uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615 \uBD84\uB958\uD558\uAE30", () => C("\uC138 \uBCC0\uC758 \uAE38\uC774\uAC00 5 cm, 5 cm, 6 cm\uC778 \uC0BC\uAC01\uD615\uC758 \uAC00\uC7A5 \uAD6C\uCCB4\uC801\uC778 \uC774\uB984\uC744 \uACE0\uB974\uC138\uC694.", "\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615", [["\uC815\uC0BC\uAC01\uD615", "\uB450 \uBCC0\uACFC \uC138 \uBCC0 \uC870\uAC74 \uD63C\uB3D9"], ["\uC77C\uBC18 \uC0BC\uAC01\uD615", "\uAC19\uC740 \uB450 \uBCC0\uC744 \uBB34\uC2DC"]], "\uAC19\uC740 \uAE38\uC774\uC758 \uBCC0\uC774 \uB450 \uAC1C\uC774\uACE0 \uC138 \uBCC0\uC774 \uBAA8\uB450 \uAC19\uC9C0\uB294 \uC54A\uC73C\uBBC0\uB85C \uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615\uC785\uB2C8\uB2E4."), 1);
a9(2, 2, "triangle-possible", "4\uC21803-25", 3, "\uB0B4\uAC01\uC758 \uD569\uC73C\uB85C \uC0BC\uAC01\uD615 \uC870\uAC74 \uD310\uB2E8\uD558\uAE30", () => C("\uC138 \uB0B4\uAC01\uC774 60\xB0, 70\xB0, 80\xB0\uC778 \uC0BC\uAC01\uD615\uC774 \uC788\uB2E4\uACE0 \uD569\uB2C8\uB2E4. \uC774 \uC124\uBA85\uC774 \uAC00\uB2A5\uD55C\uC9C0 \uACE0\uB974\uC138\uC694.", "\uBD88\uAC00\uB2A5\uD558\uB2E4", [["\uAC00\uB2A5\uD558\uB2E4", "\uAC01\uC774 \uBAA8\uB450 \uC591\uC218\uC778 \uC870\uAC74\uB9CC \uD655\uC778"]], "\uC138 \uAC01\uC758 \uD569\uC774 210\xB0\uB85C \uC0BC\uAC01\uD615 \uB0B4\uAC01\uC758 \uD569 180\xB0\uC640 \uB2E4\uB985\uB2C8\uB2E4."), 1);
a9(2, 3, "decimal-join", "4\uC21801-16", 2, "\uC18C\uC218\uC810 \uC704\uCE58\uB97C \uB9DE\uCD94\uC5B4 \uB354\uD558\uAE30", (k) => E(`${dec(125 + k, 100)} + 0.75\uB97C \uACC4\uC0B0\uD558\uC138\uC694.`, [dec(125 + k, 100), "0.75", "+"], "\uC18C\uC218\uC810 \uC704\uCE58\uB97C \uB9DE\uCD94\uC5B4 \uAC19\uC740 \uC790\uB9BF\uAC12\uB07C\uB9AC \uB354\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a9(2, 3, "decimal-change", "4\uC21801-16", 3, "\uC18C\uC218 \uAE38\uC774\uC758 \uCC28 \uAD6C\uD558\uAE30", (k) => E(`\uB048 ${dec(350 + k, 100)} m\uC5D0\uC11C 1.25 m\uB97C \uC798\uB790\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uAE38\uC774\uB97C m \uB2E8\uC704\uC758 \uC218\uB85C \uC801\uC73C\uC138\uC694.`, [dec(350 + k, 100), "1.25", "-"], "\uC804\uCCB4 \uAE38\uC774\uC5D0\uC11C \uC790\uB978 \uAE38\uC774\uB97C \uBE7C\uBA74 {answer} m\uC785\uB2C8\uB2E4.", "m"));
a9(2, 3, "decimal-restore", "4\uC21801-16", 4, "\uC18C\uC218 \uBE84\uC148 \uACB0\uACFC\uC5D0\uC11C \uCC98\uC74C \uC591 \uBCF5\uC6D0\uD558\uAE30", (k) => E(`\uC5B4\uB5A4 \uC218\uC5D0\uC11C 0.65\uB97C \uBE90\uB354\uB2C8 ${dec(120 + k, 100)}\uAC00 \uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC5B4\uB5A4 \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [dec(120 + k, 100), "0.65", "+"], "\uB0A8\uC740 \uC218\uC5D0 \uBE80 \uC218\uB97C \uB354\uD558\uBA74 \uCC98\uC74C \uC218 {answer}\uC785\uB2C8\uB2E4."));
a9(2, 3, "decimal-equal", "4\uC21801-14", 1, "\uB05D\uC5D0 0\uC744 \uBD99\uC778 \uC18C\uC218\uC758 \uAC12 \uBE44\uAD50\uD558\uAE30", () => C("0.7\uACFC 0.700\uC758 \uAC12\uC744 \uBE44\uAD50\uD55C \uC124\uBA85\uC744 \uACE0\uB974\uC138\uC694.", "\uAC12\uC774 \uAC19\uB2E4", [["0.700\uC774 \uB354 \uD06C\uB2E4", "\uC790\uB9AC \uC218\uB9CC\uC73C\uB85C \uD06C\uAE30 \uD310\uB2E8"], ["0.7\uC774 \uB354 \uD06C\uB2E4", "\uC18C\uC218 \uB05D\uC758 0 \uC5ED\uD560 \uD63C\uB3D9"]], "0.7\uC740 0.700\uACFC \uAC19\uC740 \uAC12\uC785\uB2C8\uB2E4. \uC18C\uC218 \uB05D\uC5D0 0\uC744 \uBD99\uC5EC\uB3C4 \uAC12\uC740 \uBCC0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."), 1);
a9(2, 3, "thousandths", "4\uC21801-13", 2, "\uC18C\uC218 \uC14B\uC9F8 \uC790\uB9AC\uC640 0.001\uC758 \uAC1C\uC218 \uC5F0\uACB0\uD558\uAE30", (k) => E(`0.001\uC774 ${135 + k}\uAC1C\uC778 \uC218\uB97C \uC18C\uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, [135 + k, "0.001", "*"], "0.001\uC774 \uBAA8\uC778 \uC218\uB97C \uC790\uB9BF\uAC12\uC5D0 \uB9DE\uAC8C \uB098\uD0C0\uB0B4\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "concept"));
a9(2, 3, "decimal-borrow", "4\uC21801-16", 3, "\uBC1B\uC544\uB0B4\uB9BC\uC774 \uC788\uB294 \uC18C\uC218 \uBE84\uC148 \uC801\uC6A9\uD558\uAE30", (k) => E(`${dec(300 + k, 100)} - 0.86\uC744 \uACC4\uC0B0\uD558\uC138\uC694.`, [dec(300 + k, 100), "0.86", "-"], "\uC18C\uC218\uC810 \uC704\uCE58\uB97C \uB9DE\uCD94\uACE0 \uD544\uC694\uD55C \uC790\uB9AC\uC5D0\uC11C \uBC1B\uC544\uB0B4\uB9AC\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a9(2, 4, "square-hierarchy", "4\uC21803-10", 1, "\uC815\uC0AC\uAC01\uD615\uACFC \uC9C1\uC0AC\uAC01\uD615\uC758 \uD3EC\uD568 \uAD00\uACC4 \uC774\uD574\uD558\uAE30", () => C("\uC815\uC0AC\uAC01\uD615\uC740 \uC9C1\uC0AC\uAC01\uD615\uC774\uB77C\uACE0\uB3C4 \uD560 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC608", [["\uC544\uB2C8\uC694", "\uC815\uC0AC\uAC01\uD615\uACFC \uC9C1\uC0AC\uAC01\uD615\uC744 \uBC30\uD0C0\uC801\uC73C\uB85C \uBD84\uB958"]], "\uC815\uC0AC\uAC01\uD615\uB3C4 \uB124 \uAC01\uC774 \uBAA8\uB450 \uC9C1\uAC01\uC774\uBBC0\uB85C \uC9C1\uC0AC\uAC01\uD615\uC758 \uC870\uAC74\uC744 \uB9CC\uC871\uD569\uB2C8\uB2E4."), 1);
a9(2, 4, "rhombus-not-right", "4\uC21803-10", 2, "\uB124 \uBCC0\uC774 \uAC19\uC740 \uC870\uAC74\uACFC \uC9C1\uAC01 \uC870\uAC74 \uAD6C\uBCC4\uD558\uAE30", () => C("\uB124 \uBCC0 \uAE38\uC774\uAC00 \uBAA8\uB450 \uAC19\uC9C0\uB9CC \uC9C1\uAC01\uC740 \uC5C6\uB294 \uC0AC\uAC01\uD615\uC785\uB2C8\uB2E4. \uAC00\uC7A5 \uAD6C\uCCB4\uC801\uC778 \uC774\uB984\uC744 \uACE0\uB974\uC138\uC694.", "\uB9C8\uB984\uBAA8", [["\uC815\uC0AC\uAC01\uD615", "\uC9C1\uAC01 \uC870\uAC74 \uB204\uB77D"], ["\uC9C1\uC0AC\uAC01\uD615", "\uB124 \uAC01 \uC9C1\uAC01 \uC870\uAC74 \uB204\uB77D"]], "\uB124 \uBCC0\uC774 \uBAA8\uB450 \uAC19\uC73C\uBBC0\uB85C \uB9C8\uB984\uBAA8\uC774\uBA70 \uC9C1\uAC01\uC774 \uC5C6\uC73C\uBBC0\uB85C \uC815\uC0AC\uAC01\uD615\uC740 \uC544\uB2D9\uB2C8\uB2E4."), 1);
a9(2, 4, "parallel-pairs", "4\uC21803-10", 1, "\uD3C9\uD589\uC0AC\uBCC0\uD615\uC758 \uB9C8\uC8FC \uBCF4\uB294 \uBCC0 \uAD00\uACC4 \uC774\uD574\uD558\uAE30", () => C("\uD3C9\uD589\uC0AC\uBCC0\uD615\uC5D0\uC11C \uC11C\uB85C \uB9C8\uC8FC \uBCF4\uB294 \uB450 \uC30D\uC758 \uBCC0\uC758 \uAD00\uACC4\uB97C \uACE0\uB974\uC138\uC694.", "\uAC01 \uC30D\uC774 \uC11C\uB85C \uD3C9\uD589\uD558\uB2E4", [["\uAC01 \uC30D\uC774 \uC5B8\uC81C\uB098 \uC218\uC9C1\uC774\uB2E4", "\uD3C9\uD589\uACFC \uC218\uC9C1 \uD63C\uB3D9"], ["\uD55C \uC30D\uB9CC \uD3C9\uD589\uD560 \uC218 \uC788\uB2E4", "\uD3C9\uD589\uC0AC\uBCC0\uD615 \uC815\uC758 \uB204\uB77D"]], "\uD3C9\uD589\uC0AC\uBCC0\uD615\uC740 \uB9C8\uC8FC \uBCF4\uB294 \uB450 \uC30D\uC758 \uBCC0\uC774 \uAC01\uAC01 \uD3C9\uD589\uD55C \uC0AC\uAC01\uD615\uC785\uB2C8\uB2E4."), 1);
a9(2, 4, "perpendicular-meaning", "4\uC21803-03", 1, "\uC218\uC9C1\uC758 \uC870\uAC74\uC73C\uB85C \uAD50\uCC28\uD558\uB294 \uC9C1\uC120 \uAD6C\uBCC4\uD558\uAE30", () => C("\uB450 \uC9C1\uC120\uC774 \uB9CC\uB098\uC11C \uC0DD\uAE34 \uD55C \uAC01\uC774 90\xB0\uC785\uB2C8\uB2E4. \uB450 \uC9C1\uC120\uC758 \uAD00\uACC4\uB97C \uACE0\uB974\uC138\uC694.", "\uC218\uC9C1", [["\uD3C9\uD589", "\uB9CC\uB0A8\uACFC \uD3C9\uD589 \uC870\uAC74 \uD63C\uB3D9"], ["\uC218\uC9C1\uB3C4 \uD3C9\uD589\uB3C4 \uC544\uB2D8", "\uC9C1\uAC01 \uC870\uAC74 \uBB34\uC2DC"]], "\uC9C1\uAC01\uC744 \uC774\uB8E8\uBA70 \uB9CC\uB098\uB294 \uB450 \uC9C1\uC120\uC740 \uC11C\uB85C \uC218\uC9C1\uC785\uB2C8\uB2E4."), 1);
a9(2, 4, "quad-three-right", "4\uC21803-25", 4, "\uC138 \uC9C1\uAC01\uC744 \uAC00\uC9C4 \uC0AC\uAC01\uD615\uC758 \uB098\uBA38\uC9C0 \uAC01 \uAD6C\uD558\uAE30", () => E("\uC0AC\uAC01\uD615\uC758 \uC138 \uB0B4\uAC01\uC774 \uBAA8\uB450 \uC9C1\uAC01\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uB0B4\uAC01\uC740 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?", [360, 90, 3, "*", "-"], "\uC0AC\uAC01\uD615 \uB0B4\uAC01\uC758 \uD569 360\xB0\uC5D0\uC11C \uC138 \uC9C1\uAC01\uC758 \uD569 270\xB0\uB97C \uBE7C\uBA74 {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"), 1);
a9(2, 4, "square-condition", "4\uC21803-10", 3, "\uC815\uC0AC\uAC01\uD615 \uD310\uB2E8\uC5D0 \uD544\uC694\uD55C \uC870\uAC74 \uCC3E\uAE30", () => C("\uB124 \uBCC0\uC774 \uAC19\uC740 \uC0AC\uAC01\uD615\uC744 \uC815\uC0AC\uAC01\uD615\uC774\uB77C\uACE0 \uD310\uB2E8\uD558\uB824 \uD569\uB2C8\uB2E4. \uCD94\uAC00\uB85C \uD655\uC778\uD560 \uC870\uAC74\uC744 \uACE0\uB974\uC138\uC694.", "\uB124 \uAC01\uC774 \uBAA8\uB450 \uC9C1\uAC01\uC778\uC9C0 \uD655\uC778\uD55C\uB2E4", [["\uB9C8\uC8FC \uBCF4\uB294 \uBCC0\uC774 \uD3C9\uD589\uD55C\uC9C0\uB9CC \uD655\uC778\uD55C\uB2E4", "\uB9C8\uB984\uBAA8\uB3C4 \uB9CC\uC871\uD558\uB294 \uC870\uAC74"], ["\uAF2D\uC9D3\uC810\uC774 \uB124 \uAC1C\uC778\uC9C0\uB9CC \uD655\uC778\uD55C\uB2E4", "\uBAA8\uB4E0 \uC0AC\uAC01\uD615\uC774 \uB9CC\uC871\uD558\uB294 \uC870\uAC74"]], "\uB124 \uBCC0\uC774 \uAC19\uACE0 \uB124 \uAC01\uC774 \uBAA8\uB450 \uC9C1\uAC01\uC774\uC5B4\uC57C \uC815\uC0AC\uAC01\uD615\uC785\uB2C8\uB2E4."), 1);
var lineRows = (k) => [{ label: "\uC6D4", value: 10 + k % 4 }, { label: "\uD654", value: 20 + k % 3 }, { label: "\uC218", value: 14 + k % 5 }];
a9(2, 5, "line-drop", "4\uC21804-02", 2, "\uC2DC\uAC04 \uC21C\uC11C \uC790\uB8CC\uC5D0\uC11C \uAC10\uC18C\uB7C9 \uAD6C\uD558\uAE30", (k) => T("\uAE30\uC628 \uD45C\uC5D0\uC11C \uD654\uC694\uC77C\uC5D0\uC11C \uC218\uC694\uC77C\uB85C \uAE30\uC628\uC740 \uBA87 \uB3C4 \uB0B4\uB824\uAC14\uC2B5\uB2C8\uAE4C?", "difference", lineRows(k), "\uD654", "\uC218", "\uD654\uC694\uC77C \uAE30\uC628\uC5D0\uC11C \uC218\uC694\uC77C \uAE30\uC628\uC744 \uBE7C\uBA74 {answer}\u2103 \uB0B4\uB824\uAC14\uC2B5\uB2C8\uB2E4.", "\u2103"));
a9(2, 5, "line-first-last", "4\uC21804-02", 3, "\uCC98\uC74C\uACFC \uB9C8\uC9C0\uB9C9 \uC790\uB8CC\uC758 \uBCC0\uD654\uB7C9 \uAD6C\uD558\uAE30", (k) => T("\uAE30\uC628 \uD45C\uC5D0\uC11C \uC218\uC694\uC77C \uAE30\uC628\uC740 \uC6D4\uC694\uC77C\uBCF4\uB2E4 \uBA87 \uB3C4 \uB192\uC2B5\uB2C8\uAE4C?", "difference", lineRows(k), "\uC218", "\uC6D4", "\uB9C8\uC9C0\uB9C9 \uAE30\uC628\uC5D0\uC11C \uCC98\uC74C \uAE30\uC628\uC744 \uBE7C\uBA74 {answer}\u2103\uC785\uB2C8\uB2E4.", "\u2103"));
a9(2, 5, "line-read", "4\uC21804-02", 1, "\uC2DC\uAC04 \uD56D\uBAA9\uC5D0 \uB300\uC751\uD558\uB294 \uAC12 \uC77D\uAE30", (k) => T("\uAE30\uC628 \uD45C\uC5D0\uC11C \uD654\uC694\uC77C\uC758 \uAE30\uC628\uC740 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?", "value", lineRows(k), "\uD654", "\uC6D4", "\uD654\uC694\uC77C \uD56D\uBAA9\uC5D0 \uB300\uC751\uD558\uB294 \uAC12\uC740 {answer}\u2103\uC785\uB2C8\uB2E4.", "\u2103"));
a9(2, 5, "line-intermediate", "4\uC21804-03", 3, "\uAEBE\uC740\uC120 \uC0AC\uC774\uC758 \uAC12\uC744 \uD655\uC815\uD560 \uC218 \uC5C6\uB294 \uC774\uC720 \uC774\uD574\uD558\uAE30", () => C("\uC6D4\uC694\uC77C\uACFC \uD654\uC694\uC77C \uC815\uC624\uC758 \uAE30\uC628\uB9CC \uCE21\uC815\uD588\uC2B5\uB2C8\uB2E4. \uAEBE\uC740\uC120\uC73C\uB85C \uC774\uC5C8\uC744 \uB54C \uC6D4\uC694\uC77C \uC800\uB141\uC758 \uC2E4\uC81C \uAE30\uC628\uC744 \uC815\uD655\uD788 \uC54C \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC815\uD655\uD788 \uC54C \uC218 \uC5C6\uB2E4", [["\uC120 \uC704\uC758 \uAC12\uC744 \uC5B8\uC81C\uB098 \uC2E4\uC81C \uCE21\uC815\uAC12\uC73C\uB85C \uD655\uC815\uD560 \uC218 \uC788\uB2E4", "\uC5F0\uACB0\uC120\uACFC \uAD00\uCE21\uAC12 \uD63C\uB3D9"]], "\uCE21\uC815\uD558\uC9C0 \uC54A\uC740 \uC2DC\uAC01\uC758 \uC2E4\uC81C \uAC12\uC740 \uC5F0\uACB0\uC120\uB9CC\uC73C\uB85C \uD655\uC815\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."), 1);
a9(2, 5, "line-comparable", "4\uC21804-03", 3, "\uBE44\uAD50 \uAC00\uB2A5\uD55C \uC790\uB8CC\uC758 \uCE21\uC815 \uC870\uAC74 \uC120\uD0DD\uD558\uAE30", () => C("\uB9E4\uC77C \uAE30\uC628\uC758 \uBCC0\uD654\uB97C \uBE44\uAD50\uD558\uB824 \uD569\uB2C8\uB2E4. \uB354 \uC54C\uB9DE\uC740 \uCE21\uC815 \uBC29\uBC95\uC744 \uACE0\uB974\uC138\uC694.", "\uAC19\uC740 \uC7A5\uC18C\uC5D0\uC11C \uB9E4\uC77C \uAC19\uC740 \uC2DC\uAC01\uC5D0 \uCE21\uC815\uD55C\uB2E4", [["\uB9E4\uC77C \uC7A5\uC18C\uC640 \uC2DC\uAC01\uC744 \uBC14\uAFB8\uC5B4 \uCE21\uC815\uD55C\uB2E4", "\uCE21\uC815 \uC870\uAC74 \uBD88\uC77C\uCE58"], ["\uAC00\uC7A5 \uB354\uC6E0\uB358 \uB0A0\uB9CC \uAE30\uB85D\uD55C\uB2E4", "\uBCC0\uD654 \uC790\uB8CC \uB204\uB77D"]], "\uC7A5\uC18C\uC640 \uC2DC\uAC01\uC744 \uC77C\uC815\uD558\uAC8C \uC720\uC9C0\uD558\uBA74 \uB0A0\uC9DC\uC5D0 \uB530\uB978 \uBCC0\uD654\uB97C \uBE44\uAD50\uD558\uAE30 \uC88B\uC2B5\uB2C8\uB2E4."), 1);
a9(2, 5, "line-nonmonotone", "4\uC21804-02", 3, "\uC99D\uAC00 \uB4A4 \uAC10\uC18C\uD55C \uC790\uB8CC\uC758 \uC804\uCCB4 \uD750\uB984 \uC774\uD574\uD558\uAE30", () => C("\uC6D4\xB7\uD654\xB7\uC218 \uAE30\uC628\uC774 \uCC28\uB840\uB85C 12\u2103, 16\u2103, 14\u2103\uC785\uB2C8\uB2E4. \uC54C\uB9DE\uC740 \uC124\uBA85\uC744 \uACE0\uB974\uC138\uC694.", "\uCC98\uC74C\uC5D0\uB294 \uC62C\uB77C\uAC00\uACE0 \uADF8\uB2E4\uC74C\uC5D0\uB294 \uB0B4\uB824\uAC14\uB2E4", [["\uB9E4\uC77C \uC62C\uB77C\uAC14\uB2E4", "\uCC98\uC74C\uACFC \uB9C8\uC9C0\uB9C9\uB9CC \uBE44\uAD50"], ["\uB9E4\uC77C \uB0B4\uB824\uAC14\uB2E4", "\uB9C8\uC9C0\uB9C9 \uAD6C\uAC04\uB9CC \uBE44\uAD50"]], "12\uC5D0\uC11C 16\uC73C\uB85C \uC62C\uB77C\uAC04 \uB4A4 16\uC5D0\uC11C 14\uB85C \uB0B4\uB824\uAC14\uC2B5\uB2C8\uB2E4."), 1);
a9(2, 6, "polygon-definition", "4\uC21803-11", 1, "\uB2E4\uAC01\uD615\uC758 \uACE7\uC740 \uBCC0 \uC870\uAC74 \uC774\uD574\uD558\uAE30", () => C("\uC138 \uACE7\uC740 \uC120\uBD84\uACFC \uD55C \uACE1\uC120\uC73C\uB85C \uB458\uB7EC\uC2F8\uC778 \uB3C4\uD615\uC744 \uB2E4\uAC01\uD615\uC774\uB77C\uACE0 \uD560 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uACE1\uC120\uB3C4 \uB2E4\uAC01\uD615\uC758 \uBCC0\uC73C\uB85C \uC624\uC778"]], "\uB2E4\uAC01\uD615\uC740 \uACE7\uC740 \uC120\uBD84\uC73C\uB85C \uB458\uB7EC\uC2F8\uC778 \uB3C4\uD615\uC774\uBBC0\uB85C \uACE1\uC120\uC774 \uC788\uC73C\uBA74 \uB2E4\uAC01\uD615\uC774 \uC544\uB2D9\uB2C8\uB2E4."), 1);
a9(2, 6, "polygon-sides", "4\uC21803-11", 1, "\uB2E4\uAC01\uD615 \uC774\uB984\uACFC \uBCC0\uC758 \uAC1C\uC218 \uC5F0\uACB0\uD558\uAE30", () => C("\uC721\uAC01\uD615\uC758 \uBCC0\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", "6", [["5", "\uB2E4\uAC01\uD615 \uC774\uB984 \uD63C\uB3D9"], ["8", "\uB2E4\uAC01\uD615 \uC774\uB984 \uD63C\uB3D9"]], "\uC721\uAC01\uD615\uC740 \uC5EC\uC12F \uAC1C\uC758 \uC120\uBD84\uC73C\uB85C \uB458\uB7EC\uC2F8\uC778 \uB2E4\uAC01\uD615\uC785\uB2C8\uB2E4."), 1);
a9(2, 6, "regular-both", "4\uC21803-11", 2, "\uC815\uB2E4\uAC01\uD615\uC758 \uB450 \uC870\uAC74 \uBAA8\uB450 \uD655\uC778\uD558\uAE30", () => C("\uB9C8\uB984\uBAA8\uB294 \uB124 \uBCC0\uC774 \uAC19\uC9C0\uB9CC \uAC01\uC758 \uD06C\uAE30\uAC00 \uBAA8\uB450 \uAC19\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4. \uC774 \uB9C8\uB984\uBAA8\uB294 \uC815\uB2E4\uAC01\uD615\uC785\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uBCC0 \uAE38\uC774 \uC870\uAC74\uB9CC \uD655\uC778"]], "\uC815\uB2E4\uAC01\uD615\uC740 \uBAA8\uB4E0 \uBCC0\uC758 \uAE38\uC774\uC640 \uBAA8\uB4E0 \uAC01\uC758 \uD06C\uAE30\uAC00 \uAC01\uAC01 \uAC19\uC544\uC57C \uD569\uB2C8\uB2E4."), 1);
a9(2, 6, "tile-row-missing", "4\uC21803-12", 4, "\uC9C1\uC0AC\uAC01\uD615 \uCC44\uC6B0\uAE30\uC5D0\uC11C \uD544\uC694\uD55C \uC904 \uC218 \uCC3E\uAE30", (k) => E(`\uAC19\uC740 \uC815\uC0AC\uAC01\uD615\uC744 \uD55C \uC904\uC5D0 6\uAC1C\uC529 \uB193\uC544 \uC9C1\uC0AC\uAC01\uD615\uC744 \uB9CC\uB4ED\uB2C8\uB2E4. ${6 * (4 + k)}\uAC1C\uB97C \uBAA8\uB450 \uC4F0\uBA74 \uBA87 \uC904\uC785\uB2C8\uAE4C?`, [6 * (4 + k), 6, "/"], "\uC804\uCCB4 \uC870\uAC01 \uC218\uB97C \uD55C \uC904\uC758 \uC870\uAC01 \uC218\uB85C \uB098\uB204\uBA74 {answer}\uC904\uC785\uB2C8\uB2E4.", "\uC904"));
a9(2, 6, "tile-add-row", "4\uC21803-12", 3, "\uB3C4\uD615 \uCC44\uC6B0\uAE30\uC5D0 \uD55C \uC904\uC744 \uB354\uD55C \uC870\uAC01 \uC218 \uAD6C\uD558\uAE30", (k) => E(`\uC815\uC0AC\uAC01\uD615\uC744 \uD55C \uC904\uC5D0 5\uAC1C\uC529 ${3 + k}\uC904 \uB193\uC558\uC2B5\uB2C8\uB2E4. \uD55C \uC904\uC744 \uB354 \uB193\uC73C\uBA74 \uBAA8\uB450 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [3 + k, 1, "+", 5, "*"], "\uC904 \uC218\uB97C \uD558\uB098 \uB298\uB9B0 \uB4A4 \uD55C \uC904\uC758 \uC870\uAC01 \uC218\uB97C \uACF1\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a9(2, 6, "tile-no-gap", "4\uC21803-12", 2, "\uB3C4\uD615\uC73C\uB85C \uD3C9\uBA74\uC744 \uCC44\uC6B0\uB294 \uC870\uAC74 \uC124\uBA85\uD558\uAE30", () => C("\uAC19\uC740 \uC815\uC0AC\uAC01\uD615\uC73C\uB85C \uBC14\uB2E5\uC744 \uBE48\uD2C8\uC5C6\uC774 \uCC44\uC6B0\uB824 \uD569\uB2C8\uB2E4. \uC54C\uB9DE\uC740 \uC870\uAC74\uC744 \uACE0\uB974\uC138\uC694.", "\uC870\uAC01\uB07C\uB9AC \uACB9\uCE58\uAC70\uB098 \uBE48\uD2C8\uC774 \uC0DD\uAE30\uC9C0 \uC54A\uAC8C \uC774\uC5B4 \uB193\uB294\uB2E4", [["\uBE48\uD2C8\uC774 \uC788\uC5B4\uB3C4 \uC870\uAC01 \uC218\uB9CC \uAC19\uC73C\uBA74 \uB41C\uB2E4", "\uD3C9\uBA74 \uCC44\uC6B0\uAE30 \uC870\uAC74 \uB204\uB77D"], ["\uC870\uAC01\uC744 \uD3EC\uAC1C\uC11C \uB450\uAECD\uAC8C \uC313\uB294\uB2E4", "\uCC44\uC6B0\uAE30\uC640 \uC313\uAE30 \uD63C\uB3D9"]], "\uD3C9\uBA74\uC744 \uCC44\uC6B4\uB2E4\uB294 \uAC83\uC740 \uBE48\uD2C8\uACFC \uACB9\uCE68 \uC5C6\uC774 \uB3C4\uD615\uB4E4\uC744 \uC774\uC5B4 \uB193\uB294 \uAC83\uC785\uB2C8\uB2E4."), 1);
a9(2, 2, "triangle-classification-data", "4\uC21803-09", 2, "\uC8FC\uC5B4\uC9C4 \uC138 \uB0B4\uAC01\uC73C\uB85C \uC608\uAC01\xB7\uC9C1\uAC01\xB7\uB454\uAC01\uC0BC\uAC01\uD615 \uBD84\uB958\uD558\uAE30", (k) => {
  const angles = [[50, 60, 70], [30, 60, 90], [30, 40, 110]][k], names = ["\uC608\uAC01\uC0BC\uAC01\uD615", "\uC9C1\uAC01\uC0BC\uAC01\uD615", "\uB454\uAC01\uC0BC\uAC01\uD615"], correct = names[k];
  return C(`\uC138 \uB0B4\uAC01\uC774 ${angles.map((n) => n + "\xB0").join(", ")}\uC778 \uC0BC\uAC01\uD615\uC744 \uAC01\uC758 \uD06C\uAE30\uC5D0 \uB530\uB77C \uBD84\uB958\uD558\uC138\uC694.`, correct, names.filter((n) => n !== correct).map((n) => [n, "\uC138 \uB0B4\uAC01\uC744 \uBAA8\uB450 \uD655\uC778\uD558\uC9C0 \uC54A\uAC70\uB098 \uC9C1\uAC01\uACFC \uBE44\uAD50\uB97C \uC798\uBABB\uD568"]), k === 0 ? "\uC138 \uB0B4\uAC01 \uBAA8\uB450 \uC9C1\uAC01\uBCF4\uB2E4 \uC791\uC73C\uBBC0\uB85C \uC608\uAC01\uC0BC\uAC01\uD615\uC785\uB2C8\uB2E4." : k === 1 ? "\uD55C \uB0B4\uAC01\uC774 \uC9C1\uAC01\uC774\uBBC0\uB85C \uC9C1\uAC01\uC0BC\uAC01\uD615\uC785\uB2C8\uB2E4." : "\uD55C \uB0B4\uAC01\uC774 \uC9C1\uAC01\uBCF4\uB2E4 \uD06C\uBBC0\uB85C \uB454\uAC01\uC0BC\uAC01\uD615\uC785\uB2C8\uB2E4.");
}, 3);

// learning-review-r1/native/data/upper-grade5.js
var a10 = (s, u, id, code, l, o, fn, d = 24) => A(5, s, u, id, code, l, o, fn, d);
a10(1, 1, "parentheses", "6\uC21801-01", 2, "\uAD04\uD638\uAC00 \uC788\uB294 \uD63C\uD569 \uACC4\uC0B0 \uC21C\uC11C \uC801\uC6A9\uD558\uAE30", (k) => E(`(${18 + 3 * k} + 6) \xF7 3\uC744 \uACC4\uC0B0\uD558\uC138\uC694.`, [18 + 3 * k, 6, "+", 3, "/"], "\uAD04\uD638 \uC548\uC744 \uBA3C\uC800 \uB354\uD558\uACE0 3\uC73C\uB85C \uB098\uB215\uB2C8\uB2E4. \uACB0\uACFC\uB294 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"), 7);
a10(1, 1, "multiply-first", "6\uC21801-01", 2, "\uB367\uC148\uACFC \uACF1\uC148\uC758 \uACC4\uC0B0 \uC21C\uC11C \uC801\uC6A9\uD558\uAE30", (k) => E(`${10 + k} + 4 \xD7 5\uB97C \uACC4\uC0B0\uD558\uC138\uC694.`, [10 + k, 4, 5, "*", "+"], "\uACF1\uC148\uC744 \uBA3C\uC800 \uACC4\uC0B0\uD55C \uB4A4 \uB354\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a10(1, 1, "expression-story", "6\uC21801-01", 3, "\uB450 \uBB36\uC74C \uC0C1\uD669\uC744 \uD558\uB098\uC758 \uC2DD\uC73C\uB85C \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uB178\uD2B8\uB294 \uD55C \uBB36\uC74C\uC5D0 6\uAD8C\uC529 ${4 + k}\uBB36\uC74C, \uB530\uB85C 3\uAD8C \uC788\uC2B5\uB2C8\uB2E4. \uBAA8\uB450 \uBA87 \uAD8C\uC785\uB2C8\uAE4C?`, [6, 4 + k, "*", 3, "+"], "\uBB36\uC74C\uC5D0 \uB4E0 \uB178\uD2B8\uB97C \uAD6C\uD558\uACE0 \uB530\uB85C \uC788\uB294 \uB178\uD2B8\uB97C \uB354\uD558\uBA74 {answer}\uAD8C\uC785\uB2C8\uB2E4.", "\uAD8C"));
a10(1, 1, "inverse-mixed", "6\uC21801-01", 4, "\uD63C\uD569 \uACC4\uC0B0 \uACB0\uACFC\uC5D0\uC11C \uBE48\uCE78 \uBCF5\uC6D0\uD558\uAE30", (k) => E(`\u25A1 \xD7 4 + 7 = ${4 * (6 + k) + 7}\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [4 * (6 + k) + 7, 7, "-", 4, "/"], "\uACB0\uACFC\uC5D0\uC11C 7\uC744 \uBE80 \uB4A4 4\uB85C \uB098\uB204\uBA74 {answer}\uC785\uB2C8\uB2E4."));
a10(1, 1, "order-error", "6\uC21801-01", 3, "\uD63C\uD569 \uACC4\uC0B0\uC5D0\uC11C \uC798\uBABB \uC801\uC6A9\uD55C \uC21C\uC11C \uCC3E\uAE30", () => C("8 + 3 \xD7 4\uB97C 11 \xD7 4 = 44\uB85C \uACC4\uC0B0\uD588\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uACE0\uCE5C \uACB0\uACFC\uB97C \uACE0\uB974\uC138\uC694.", "20", [["44", "\uB367\uC148\uC744 \uBA3C\uC800 \uACC4\uC0B0"], ["15", "\uACF1\uC148\uC744 \uB367\uC148\uC73C\uB85C \uD63C\uB3D9"]], "\uACF1\uC148 3 \xD7 4 = 12\uB97C \uBA3C\uC800 \uACC4\uC0B0\uD558\uACE0 8\uC744 \uB354\uD558\uC5EC 20\uC785\uB2C8\uB2E4."), 1);
a10(1, 1, "split-share", "6\uC21801-01", 3, "\uC804\uCCB4\uC5D0\uC11C \uC0AC\uC6A9\uB7C9\uC744 \uBE7C\uACE0 \uAC19\uC740 \uC591\uC73C\uB85C \uB098\uB204\uAE30", (k) => E(`\uC885\uC774 ${50 + 6 * k}\uC7A5 \uC911 8\uC7A5\uC744 \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4. \uB098\uBA38\uC9C0\uB97C 6\uBAA8\uB460\uC5D0 \uB611\uAC19\uC774 \uB098\uB204\uBA74 \uD55C \uBAA8\uB460\uC5D0 \uBA87 \uC7A5\uC785\uB2C8\uAE4C?`, [50 + 6 * k, 8, "-", 6, "/"], "\uC0AC\uC6A9\uD55C \uC885\uC774\uB97C \uBE80 \uB2E4\uC74C \uBAA8\uB460 \uC218\uB85C \uB098\uB204\uBA74 {answer}\uC7A5\uC785\uB2C8\uB2E4.", "\uC7A5"));
a10(1, 2, "all-divisors", "6\uC21801-04", 2, "\uC591\uC758 \uC57D\uC218 \uB098\uC5F4\uD558\uAE30", (k) => M(`${12 + k}\uC758 \uC591\uC758 \uC57D\uC218\uB294 \uBAA8\uB450 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, "foundation", "divisor-count", { task: "number-theory", a: String(12 + k) }, "\uB098\uB204\uC5B4\uB5A8\uC5B4\uC9C0\uAC8C \uD558\uB294 \uC591\uC758 \uC815\uC218\uB97C \uC138\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4."));
a10(1, 2, "greatest-packs", "6\uC21801-04", 3, "\uB450 \uC218\uB97C \uAC19\uC740 \uCD5C\uB300 \uBB36\uC74C \uD06C\uAE30\uB85C \uB098\uB204\uAE30", (k) => M(`\uBE68\uAC04 \uAD6C\uC2AC ${4 * (6 + k)}\uAC1C\uC640 \uD30C\uB780 \uAD6C\uC2AC ${6 * (6 + k)}\uAC1C\uB97C \uC0C9\uAE54\uBCC4\uB85C \uAC19\uC740 \uC218\uC529 \uBB36\uC73C\uB824 \uD569\uB2C8\uB2E4. \uB0A8\uAE40\uC5C6\uC774 \uBB36\uC744 \uB54C \uD55C \uBB36\uC74C\uC758 \uCD5C\uB300 \uAD6C\uC2AC \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, "foundation", "gcd", { task: "number-theory", a: String(4 * (6 + k)), b: String(6 * (6 + k)) }, "\uB450 \uC218\uB97C \uBAA8\uB450 \uB098\uB204\uC5B4\uB5A8\uC5B4\uC9C0\uAC8C \uD558\uB294 \uAC00\uC7A5 \uD070 \uC218\uB294 {answer}\uC785\uB2C8\uB2E4.", "\uAC1C", "word-problem"));
a10(1, 2, "meeting-interval", "6\uC21801-05", 3, "\uBC18\uBCF5 \uAC04\uACA9\uC758 \uCD5C\uC18C\uACF5\uBC30\uC218 \uAD6C\uD558\uAE30", (k) => M(`\uB450 \uC54C\uB78C\uC774 \uC9C0\uAE08 \uD568\uAED8 \uC6B8\uB838\uC2B5\uB2C8\uB2E4. \uD558\uB098\uB294 ${3 + k}\uBD84\uB9C8\uB2E4, \uB2E4\uB978 \uD558\uB098\uB294 ${4 + k}\uBD84\uB9C8\uB2E4 \uC6B8\uB9BD\uB2C8\uB2E4. \uB2E4\uC2DC \uD568\uAED8 \uC6B8\uB9AC\uB294 \uAC00\uC7A5 \uC9E7\uC740 \uAC04\uACA9\uC740 \uBA87 \uBD84\uC785\uB2C8\uAE4C?`, "foundation", "lcm", { task: "number-theory", a: String(3 + k), b: String(4 + k) }, "\uB450 \uAC04\uACA9\uC758 \uACF5\uBC30\uC218 \uC911 \uAC00\uC7A5 \uC791\uC740 \uC218\uB294 {answer}\uBD84\uC785\uB2C8\uB2E4.", "\uBD84", "word-problem"));
a10(1, 2, "divisor-multiple", "6\uC21801-04", 1, "\uC57D\uC218\uC640 \uBC30\uC218\uC758 \uAD00\uACC4 \uAD6C\uBCC4\uD558\uAE30", () => C("24 = 6 \xD7 4\uC785\uB2C8\uB2E4. \uC54C\uB9DE\uC740 \uC124\uBA85\uC744 \uACE0\uB974\uC138\uC694.", "6\uC740 24\uC758 \uC57D\uC218\uC774\uACE0 24\uB294 6\uC758 \uBC30\uC218\uC774\uB2E4", [["24\uB294 6\uC758 \uC57D\uC218\uC774\uB2E4", "\uC57D\uC218\uC640 \uBC30\uC218 \uC21C\uC11C \uBC14\uAFC8"], ["6\uC740 24\uC758 \uBC30\uC218\uC774\uB2E4", "\uC57D\uC218\uC640 \uBC30\uC218 \uC21C\uC11C \uBC14\uAFC8"]], "24\uAC00 6\uC73C\uB85C \uB098\uB204\uC5B4\uB5A8\uC5B4\uC9C0\uBBC0\uB85C 6\uC740 \uC57D\uC218, 24\uB294 \uBC30\uC218\uC785\uB2C8\uB2E4."), 1);
a10(1, 2, "common-not-product", "6\uC21801-05", 3, "\uB450 \uC218\uC758 \uACF1\uACFC \uCD5C\uC18C\uACF5\uBC30\uC218 \uAD6C\uBCC4\uD558\uAE30", () => C("6\uACFC 8\uC758 \uACF1\uC740 48\uC785\uB2C8\uB2E4. \uB450 \uC218\uC758 \uCD5C\uC18C\uACF5\uBC30\uC218\uB294 \uBB34\uC5C7\uC785\uB2C8\uAE4C?", "24", [["48", "\uB450 \uC218\uC758 \uACF1\uC744 \uC5B8\uC81C\uB098 \uCD5C\uC18C\uACF5\uBC30\uC218\uB85C \uD310\uB2E8"], ["2", "\uCD5C\uB300\uACF5\uC57D\uC218\uC640 \uD63C\uB3D9"]], "6\uC758 \uBC30\uC218\uC640 8\uC758 \uBC30\uC218\uC5D0 \uCC98\uC74C \uACF5\uD1B5\uC73C\uB85C \uB098\uD0C0\uB098\uB294 \uC218\uB294 24\uC785\uB2C8\uB2E4."), 1);
a10(1, 2, "divisor-check", "6\uC21801-04", 2, "\uB098\uB204\uC5B4\uB5A8\uC5B4\uC9C0\uB294 \uC870\uAC74\uC73C\uB85C \uC57D\uC218 \uD310\uB2E8\uD558\uAE30", (k) => M(`${5 + k}\uB294 ${3 * (5 + k) + k % 2}\uC758 \uC57D\uC218\uC785\uB2C8\uAE4C? \uC608 \uB610\uB294 \uC544\uB2C8\uC694\uB85C \uB2F5\uD558\uC138\uC694.`, "foundation", "is-divisor", { task: "number-theory", a: String(3 * (5 + k) + k % 2), b: String(5 + k) }, k % 2 ? "\uB098\uBA38\uC9C0 1\uC774 \uC788\uC73C\uBBC0\uB85C \uC57D\uC218\uAC00 \uC544\uB2D9\uB2C8\uB2E4. \uB2F5\uC740 {answer}\uC785\uB2C8\uB2E4." : "\uB098\uB204\uC5B4\uB5A8\uC5B4\uC9C0\uBBC0\uB85C \uC57D\uC218\uC785\uB2C8\uB2E4. \uB2F5\uC740 {answer}\uC785\uB2C8\uB2E4."));
a10(1, 3, "correspond-table", "6\uC21802-01", 2, "\uBC30\uC218 \uAD00\uACC4\uC758 \uB300\uC751\uD45C\uC5D0\uC11C \uAC12 \uAD6C\uD558\uAE30", (k) => E(`\uC815\uC0AC\uAC01\uD615 \uD55C \uAC1C\uB97C \uB530\uB85C \uB9CC\uB4E4 \uB54C \uC131\uB0E5\uAC1C\uBE44 4\uAC1C\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4. \uC11C\uB85C \uBCC0\uC744 \uACF5\uC720\uD558\uC9C0 \uC54A\uACE0 \uC815\uC0AC\uAC01\uD615 ${3 + k}\uAC1C\uB97C \uB9CC\uB4E4\uB824\uBA74 \uC131\uB0E5\uAC1C\uBE44 \uBA87 \uAC1C\uAC00 \uD544\uC694\uD569\uB2C8\uAE4C?`, [3 + k, 4, "*"], "\uC815\uC0AC\uAC01\uD615 \uC218\uC758 4\uBC30\uC774\uBBC0\uB85C {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a10(1, 3, "correspond-inverse", "6\uC21802-01", 4, "\uB300\uC751 \uAD00\uACC4\uC5D0\uC11C \uC785\uB825\uAC12 \uCC3E\uAE30", (k) => E(`\uC8FC\uCC28 \uC2DC\uAC04 \u25A1\uC2DC\uAC04\uC5D0 \uC694\uAE08 \u25B3\uC6D0\uC740 \u25B3 = \u25A1 \xD7 1000\uC785\uB2C8\uB2E4. \uC694\uAE08\uC774 ${1e3 * (2 + k)}\uC6D0\uC774\uBA74 \uBA87 \uC2DC\uAC04\uC785\uB2C8\uAE4C?`, [1e3 * (2 + k), 1e3, "/"], "\uC694\uAE08\uC744 \uC2DC\uAC04\uB2F9 \uC694\uAE08\uC73C\uB85C \uB098\uB204\uBA74 {answer}\uC2DC\uAC04\uC785\uB2C8\uB2E4.", "\uC2DC\uAC04"));
a10(1, 3, "correspond-offset", "6\uC21802-01", 3, "\uC77C\uC815\uD55C \uCC28\uAC00 \uD3EC\uD568\uB41C \uB300\uC751 \uAD00\uACC4 \uC801\uC6A9\uD558\uAE30", (k) => E(`\uAE30\uACC4\uC5D0 \uB123\uC740 \uC218 \u25A1\uC640 \uB098\uC628 \uC218 \u25B3\uC758 \uAD00\uACC4\uB294 \u25B3 = \u25A1 \xD7 3 + 2\uC785\uB2C8\uB2E4. ${4 + k}\uB97C \uB123\uC73C\uBA74 \uB098\uC624\uB294 \uC218\uB294 \uBB34\uC5C7\uC785\uB2C8\uAE4C?`, [4 + k, 3, "*", 2, "+"], "\uB123\uC740 \uC218\uB97C 3\uBC30 \uD55C \uB2E4\uC74C 2\uB97C \uB354\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4."));
a10(1, 3, "correspond-test", "6\uC21802-01", 3, "\uB300\uC751\uD45C\uC5D0 \uB9DE\uB294 \uAD00\uACC4\uC2DD \uACE0\uB974\uAE30", () => C("\u25A1\uAC00 1, 2, 3\uC77C \uB54C \u25B3\uB294 \uCC28\uB840\uB85C 5, 10, 15\uC785\uB2C8\uB2E4. \uD45C\uC5D0 \uB9DE\uB294 \uAD00\uACC4\uB97C \uACE0\uB974\uC138\uC694.", "\u25B3 = \u25A1 \xD7 5", [["\u25B3 = \u25A1 + 4", "\uCCAB \uD589\uC5D0\uB9CC \uB9DE\uB294 \uADDC\uCE59"], ["\u25B3 = \u25A1 \xD7 3", "\uBC30\uC218 \uAD00\uACC4 \uD63C\uB3D9"]], "\uBAA8\uB4E0 \uD589\uC5D0\uC11C \u25B3\uB294 \u25A1\uC758 5\uBC30\uC785\uB2C8\uB2E4."), 1);
a10(1, 3, "constant-difference", "6\uC21802-01", 2, "\uB300\uC751\uD558\uB294 \uB450 \uC591\uC758 \uC77C\uC815\uD55C \uCC28 \uC0AC\uC6A9\uD558\uAE30", (k) => E(`\uC5B8\uB2C8\uC758 \uB098\uC774\uB294 \uB3D9\uC0DD\uBCF4\uB2E4 4\uC0B4 \uB9CE\uC2B5\uB2C8\uB2E4. \uB3D9\uC0DD\uC774 ${7 + k}\uC0B4\uC774\uBA74 \uC5B8\uB2C8\uB294 \uBA87 \uC0B4\uC785\uB2C8\uAE4C?`, [7 + k, 4, "+"], "\uB3D9\uC0DD \uB098\uC774\uC5D0 \uC77C\uC815\uD55C \uCC28 4\uB97C \uB354\uD558\uBA74 {answer}\uC0B4\uC785\uB2C8\uB2E4.", "\uC0B4"), 12);
a10(1, 3, "table-scope", "6\uC21802-01", 3, "\uAD00\uACC4\uC2DD\uC73C\uB85C \uC0C8\uB85C\uC6B4 \uC785\uB825 \uD655\uC778\uD558\uAE30", () => C("\uC138 \uB300\uC751\uC30D\uC5D0\uC11C \u25B3 = \u25A1 \xD7 2\uB77C\uB294 \uADDC\uCE59\uC744 \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4. \uAC19\uC740 \uADDC\uCE59\uC744 \uACC4\uC18D \uC801\uC6A9\uD558\uBA74 \u25A1\uAC00 8\uC77C \uB54C \u25B3\uB294 \uBB34\uC5C7\uC785\uB2C8\uAE4C?", "16", [["10", "\uACF1\uC148 \uAD00\uACC4\uB97C \uB367\uC148\uC73C\uB85C \uBC14\uAFC8"], ["4", "\uC785\uB825\uACFC \uCD9C\uB825 \uAD00\uACC4 \uB4A4\uC9D1\uC74C"]], "\uAC19\uC740 \uADDC\uCE59\uC744 \uC801\uC6A9\uD558\uC5EC 8 \xD7 2 = 16\uC785\uB2C8\uB2E4."), 1);
a10(1, 4, "simplify-factor", "6\uC21801-06", 2, "\uACF5\uC57D\uC218\uB85C \uC57D\uBD84\uD558\uC5EC \uAC19\uC740 \uBD84\uC218 \uB098\uD0C0\uB0B4\uAE30", (k) => E(`${f(2 * (2 + k), 6 * (3 + k))}\uB97C \uAE30\uC57D\uBD84\uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, [f(2 * (2 + k), 6 * (3 + k))], "\uBD84\uBAA8\uC640 \uBD84\uC790\uB97C \uACF5\uC57D\uC218\uB85C \uB098\uB204\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"), 12);
a10(1, 4, "common-numerator", "6\uC21801-06", 4, "\uD1B5\uBD84\uD55C \uBD84\uC218\uC758 \uBD84\uC790 \uCC3E\uAE30", (k) => E(`${f(2 + k % 4, 7)} = \u25A1/35\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [2 + k % 4, 5, "*"], "\uBD84\uBAA8\uAC00 5\uBC30\uAC00 \uB418\uC5C8\uC73C\uBBC0\uB85C \uBD84\uC790\uB3C4 5\uBC30 \uD569\uB2C8\uB2E4. \uB2F5\uC740 {answer}\uC785\uB2C8\uB2E4."), 4);
a10(1, 4, "unlike-compare", "6\uC21801-07", 3, "\uB2E4\uB978 \uBD84\uBAA8 \uBD84\uC218\uB97C \uD1B5\uBD84\uD558\uC5EC \uBE44\uAD50\uD558\uAE30", () => C("5/6\uACFC 7/9 \uC911 \uD070 \uBD84\uC218\uB97C \uACE0\uB974\uC138\uC694.", "5/6", [["7/9", "\uBD84\uC790\uB9CC \uBE44\uAD50"]], "18\uB85C \uD1B5\uBD84\uD558\uBA74 15/18\uACFC 14/18\uC774\uBBC0\uB85C 5/6\uC774 \uD07D\uB2C8\uB2E4."), 1);
a10(1, 4, "fraction-decimal-value", "6\uC21801-12", 2, "\uBD84\uBAA8\uAC00 100\uC778 \uBD84\uC218\uB97C \uC18C\uC218\uB85C \uB098\uD0C0\uB0B4\uAE30", (k) => E(`${f(25 + k, 100)}\uB97C \uC18C\uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, [f(25 + k, 100)], "\uBD84\uBAA8 100\uC740 \uC18C\uC218 \uB458\uC9F8 \uC790\uB9AC\uAE4C\uC9C0\uC758 \uC591\uC744 \uB098\uD0C0\uB0B4\uBBC0\uB85C {answer}\uC785\uB2C8\uB2E4.", "", "concept"));
a10(1, 4, "equivalent-error", "6\uC21801-06", 1, "\uC57D\uBD84\uC5D0\uC11C \uAC19\uC740 \uC218\uB85C \uB098\uB204\uB294 \uC870\uAC74 \uD655\uC778\uD558\uAE30", () => C("6/10\uC758 \uBD84\uC790\uB9CC 2\uB85C \uB098\uB204\uC5B4 3/10\uC774\uB77C\uACE0 \uC37C\uC2B5\uB2C8\uB2E4. \uBC14\uB974\uAC8C \uC57D\uBD84\uD55C \uBD84\uC218\uB97C \uACE0\uB974\uC138\uC694.", "3/5", [["3/10", "\uBD84\uC790\uB9CC \uB098\uB214"], ["6/5", "\uBD84\uBAA8\uB9CC \uB098\uB214"]], "\uBD84\uBAA8\uC640 \uBD84\uC790\uB97C \uBAA8\uB450 2\uB85C \uB098\uB204\uC5B4\uC57C \uAC19\uC740 \uAC12\uC778 3/5\uAC00 \uB429\uB2C8\uB2E4."), 1);
a10(1, 4, "fraction-decimal-compare", "6\uC21801-12", 3, "\uBD84\uC218\uC640 \uC18C\uC218\uC758 \uAC12\uC744 \uC5F0\uACB0\uD558\uC5EC \uBE44\uAD50\uD558\uAE30", () => C("3/4\uACFC 0.8 \uC911 \uD070 \uC218\uB97C \uACE0\uB974\uC138\uC694.", "0.8", [["3/4", "\uBD84\uC218 \uD45C\uAE30\uB9CC \uBCF4\uACE0 \uD06C\uAE30 \uD310\uB2E8"], ["\uAC19\uC74C", "0.75\uC640 0.8\uC744 \uD63C\uB3D9"]], "3/4 = 0.75\uC774\uBA70 0.75 < 0.8\uC785\uB2C8\uB2E4."), 1);
a10(1, 5, "unlike-add", "6\uC21801-08", 2, "\uB2E4\uB978 \uBD84\uBAA8 \uBD84\uC218 \uB354\uD558\uAE30", (k) => E(`${f(1 + k % 3, 4)} + 1/6\uC744 \uACC4\uC0B0\uD558\uC138\uC694.`, [f(1 + k % 3, 4), "1/6", "+"], "\uBD84\uBAA8\uB97C \uAC19\uAC8C \uD55C \uB4A4 \uBD84\uC790\uB97C \uB354\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"), 3);
a10(1, 5, "unlike-sub", "6\uC21801-08", 2, "\uB2E4\uB978 \uBD84\uBAA8 \uBD84\uC218 \uBE7C\uAE30", (k) => E(`${f(4 + k % 3, 7)} - 1/3\uC744 \uACC4\uC0B0\uD558\uC138\uC694.`, [f(4 + k % 3, 7), "1/3", "-"], "\uBD84\uBAA8\uB97C 21\uB85C \uB9DE\uCD94\uC5B4 \uBD84\uC790\uB97C \uBE7C\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"), 3);
a10(1, 5, "fraction-two-days", "6\uC21801-08", 3, "\uB450 \uB0A0\uC758 \uBD84\uC218 \uC591 \uB354\uD558\uAE30", () => E("\uCC45\uC758 \uC804\uCCB4 \uBD84\uB7C9 \uC911 \uC6D4\uC694\uC77C\uC5D0 1/3, \uD654\uC694\uC77C\uC5D0 1/4\uC744 \uC77D\uC5C8\uC2B5\uB2C8\uB2E4. \uB450 \uB0A0 \uC77D\uC740 \uBD84\uB7C9\uC740 \uC804\uCCB4\uC758 \uC5BC\uB9C8\uC785\uB2C8\uAE4C?", ["1/3", "1/4", "+"], "\uC77D\uC740 \uB450 \uBD80\uBD84\uC744 \uD1B5\uBD84\uD558\uC5EC \uB354\uD558\uBA74 \uC804\uCCB4\uC758 {answer}\uC785\uB2C8\uB2E4."), 1);
a10(1, 5, "fraction-complete", "6\uC21801-08", 3, "\uC804\uCCB4\uC640 \uBD80\uBD84\uC5D0\uC11C \uB0A8\uC740 \uBD84\uC218 \uAD6C\uD558\uAE30", () => E("\uC804\uCCB4 \uC791\uC5C5\uC758 2/5\uB97C \uD55C \uB4A4 1/4\uC744 \uB354 \uD588\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uC791\uC5C5\uC740 \uC804\uCCB4\uC758 \uC5BC\uB9C8\uC785\uB2C8\uAE4C?", [1, "2/5", "-", "1/4", "-"], "\uC804\uCCB4 1\uC5D0\uC11C \uC644\uB8CC\uD55C \uB450 \uBD80\uBD84\uC744 \uBE7C\uBA74 {answer}\uC785\uB2C8\uB2E4."), 1);
a10(1, 5, "fraction-inverse", "6\uC21801-08", 4, "\uC774\uBD84\uBAA8 \uB367\uC148\uC758 \uBE60\uC9C4 \uC218 \uAD6C\uD558\uAE30", () => E("\u25A1 + 1/3 = 5/6\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uBD84\uC218\uB97C \uAD6C\uD558\uC138\uC694.", ["5/6", "1/3", "-"], "\uD569\uC5D0\uC11C \uC8FC\uC5B4\uC9C4 \uBD84\uC218\uB97C \uBE7C\uBA74 {answer}\uC785\uB2C8\uB2E4."), 1);
a10(1, 5, "common-denominator-error", "6\uC21801-08", 3, "\uC774\uBD84\uBAA8 \uB367\uC148\uC5D0\uC11C \uD1B5\uBD84\uC758 \uD544\uC694 \uC124\uBA85\uD558\uAE30", () => C("1/2 + 1/3\uC744 2/5\uB77C\uACE0 \uC37C\uC2B5\uB2C8\uB2E4. \uBC14\uB978 \uACB0\uACFC\uB97C \uACE0\uB974\uC138\uC694.", "5/6", [["2/5", "\uBD84\uBAA8\uC640 \uBD84\uC790\uB97C \uAC01\uAC01 \uB354\uD568"], ["1/6", "\uB367\uC148\uC744 \uACF1\uC148\uC73C\uB85C \uBC14\uAFC8"]], "1/2 = 3/6, 1/3 = 2/6\uC774\uBBC0\uB85C \uD569\uC740 5/6\uC785\uB2C8\uB2E4."), 1);
a10(1, 6, "rect-perimeter", "6\uC21803-11", 3, "\uC9C1\uC0AC\uAC01\uD615 \uB124 \uBCC0\uC758 \uD569 \uAD6C\uD558\uAE30", (k) => E(`\uAC00\uB85C ${7 + k} cm, \uC138\uB85C 4 cm\uC778 \uC9C1\uC0AC\uAC01\uD615 \uC561\uC790\uC758 \uB458\uB808\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?`, [7 + k, 4, "+", 2, "*"], "\uAC19\uC740 \uAE38\uC774\uC758 \uB9C8\uC8FC \uBCF4\uB294 \uB450 \uC30D\uC758 \uBCC0\uC744 \uD569\uD558\uBA74 {answer} cm\uC785\uB2C8\uB2E4.", "cm"));
a10(1, 6, "rect-area-inverse", "6\uC21803-13", 4, "\uB113\uC774\uC640 \uD55C \uBCC0\uC73C\uB85C \uC9C1\uC0AC\uAC01\uD615 \uB2E4\uB978 \uBCC0 \uAD6C\uD558\uAE30", (k) => E(`\uB113\uC774\uAC00 ${6 * (5 + k)} cm\xB2\uC774\uACE0 \uC138\uB85C\uAC00 6 cm\uC778 \uC9C1\uC0AC\uAC01\uD615\uC758 \uAC00\uB85C\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?`, [6 * (5 + k), 6, "/"], "\uB113\uC774\uB97C \uC138\uB85C \uAE38\uC774\uB85C \uB098\uB204\uBA74 \uAC00\uB85C {answer} cm\uC785\uB2C8\uB2E4.", "cm"));
a10(1, 6, "triangle-height", "6\uC21803-14", 3, "\uBC11\uBCC0\uC5D0 \uC218\uC9C1\uC778 \uB192\uC774\uB85C \uC0BC\uAC01\uD615 \uB113\uC774 \uAD6C\uD558\uAE30", (k) => E(`\uC0BC\uAC01\uD615\uC758 \uBC11\uBCC0\uC740 ${6 + 2 * k} cm, \uADF8 \uBC11\uBCC0\uC5D0 \uC218\uC9C1\uC778 \uB192\uC774\uB294 5 cm\uC785\uB2C8\uB2E4. \uB113\uC774\uB294 \uBA87 cm\xB2\uC785\uB2C8\uAE4C?`, [6 + 2 * k, 5, "*", 2, "/"], "\uC0BC\uAC01\uD615 \uB113\uC774\uB294 \uBC11\uBCC0 \xD7 \uB192\uC774 \xF7 2\uC774\uBBC0\uB85C {answer} cm\xB2\uC785\uB2C8\uB2E4.", "cm\xB2"));
a10(1, 6, "trapezoid-area", "6\uC21803-14", 3, "\uB450 \uD3C9\uD589\uD55C \uBC11\uBCC0\uACFC \uB192\uC774\uB85C \uC0AC\uB2E4\uB9AC\uAF34 \uB113\uC774 \uAD6C\uD558\uAE30", (k) => E(`\uC0AC\uB2E4\uB9AC\uAF34\uC758 \uC11C\uB85C \uD3C9\uD589\uD55C \uB450 \uBCC0\uC740 ${4 + k} cm, ${8 + k} cm\uC774\uACE0 \uADF8 \uC0AC\uC774\uC758 \uC218\uC9C1 \uAC70\uB9AC\uB294 3 cm\uC785\uB2C8\uB2E4. \uB113\uC774\uB294 \uBA87 cm\xB2\uC785\uB2C8\uAE4C?`, [4 + k, 8 + k, "+", 3, "*", 2, "/"], "\uB450 \uBC11\uBCC0\uC758 \uD569\uC5D0 \uB192\uC774\uB97C \uACF1\uD558\uACE0 2\uB85C \uB098\uB204\uBA74 {answer} cm\xB2\uC785\uB2C8\uB2E4.", "cm\xB2"));
a10(1, 6, "area-unit", "6\uC21803-12", 2, "\uB113\uC774 \uB2E8\uC704\uC758 \uBC30\uC728 \uC774\uD574\uD558\uAE30", (k) => E(`${2 + k} m\xB2\uB294 \uBA87 cm\xB2\uC785\uB2C8\uAE4C?`, [2 + k, 1e4, "*"], "1 m\xB2\uB294 100 cm \xD7 100 cm\uC774\uBBC0\uB85C 10000 cm\xB2\uC785\uB2C8\uB2E4. \uB2F5\uC740 {answer} cm\xB2\uC785\uB2C8\uB2E4.", "cm\xB2"));
a10(1, 6, "perimeter-not-area", "6\uC21803-13", 3, "\uB458\uB808\uAC00 \uAC19\uC544\uB3C4 \uB113\uC774\uAC00 \uB2E4\uB984 \uD655\uC778\uD558\uAE30", () => C("\uAC00\uB85C\xB7\uC138\uB85C\uAC00 6 cm\xB72 cm\uC778 \uC9C1\uC0AC\uAC01\uD615\uACFC 4 cm\xB74 cm\uC778 \uC815\uC0AC\uAC01\uD615\uC740 \uB458\uB808\uAC00 \uBAA8\uB450 16 cm\uC785\uB2C8\uB2E4. \uB113\uC774\uB3C4 \uAC19\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uAC19\uC740 \uB458\uB808\uB97C \uAC19\uC740 \uB113\uC774\uB85C \uC624\uC778"]], "\uB113\uC774\uB294 \uAC01\uAC01 12 cm\xB2, 16 cm\xB2\uC774\uBBC0\uB85C \uB458\uB808\uAC00 \uAC19\uC544\uB3C4 \uB113\uC774\uB294 \uB2E4\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4."), 1);
a10(2, 1, "range-lower", "6\uC21801-02", 1, "\uC774\uC0C1\uC758 \uACBD\uACC4 \uD3EC\uD568 \uC5EC\uBD80 \uD310\uB2E8\uD558\uAE30", () => C("\uD0A4\uAC00 140 cm \uC774\uC0C1\uC778 \uC0AC\uB78C\uC744 \uBAA8\uC74D\uB2C8\uB2E4. \uD0A4\uAC00 \uC815\uD655\uD788 140 cm\uC778 \uC0AC\uB78C\uB3C4 \uD3EC\uD568\uB429\uB2C8\uAE4C?", "\uC608", [["\uC544\uB2C8\uC694", "\uC774\uC0C1\uACFC \uCD08\uACFC \uD63C\uB3D9"]], "\uC774\uC0C1\uC740 \uAE30\uC900\uAC12 \uC790\uCCB4\uB97C \uD3EC\uD568\uD569\uB2C8\uB2E4."), 1);
a10(2, 1, "range-upper", "6\uC21801-02", 1, "\uBBF8\uB9CC\uC758 \uACBD\uACC4 \uC81C\uC678 \uC5EC\uBD80 \uD310\uB2E8\uD558\uAE30", () => C("\uBB34\uAC8C\uAC00 20 kg \uBBF8\uB9CC\uC778 \uC9D0\uB9CC \uD5C8\uC6A9\uD569\uB2C8\uB2E4. \uC815\uD655\uD788 20 kg\uC778 \uC9D0\uC744 \uD5C8\uC6A9\uD569\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uBBF8\uB9CC\uACFC \uC774\uD558 \uD63C\uB3D9"]], "\uBBF8\uB9CC\uC740 \uAE30\uC900\uAC12 \uC790\uCCB4\uB97C \uD3EC\uD568\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."), 1);
a10(2, 1, "round-nearest", "6\uC21801-03", 2, "\uC815\uD55C \uC790\uB9AC\uAE4C\uC9C0 \uBC18\uC62C\uB9BC\uD558\uAE30", (k) => E(`${2340 + k}\uB97C \uBC31\uC758 \uC790\uB9AC\uAE4C\uC9C0 \uBC18\uC62C\uB9BC\uD558\uBA74 \uC5BC\uB9C8\uC785\uB2C8\uAE4C?`, [2340 + k, 50, "+", 100, "floor/", 100, "*"], "\uC2ED\uC758 \uC790\uB9AC \uC22B\uC790\uB97C \uBCF4\uACE0 \uBC31\uC758 \uC790\uB9AC\uAE4C\uC9C0 \uBC18\uC62C\uB9BC\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a10(2, 1, "round-up-packs", "6\uC21801-03", 3, "\uC62C\uB9BC\uC774 \uD544\uC694\uD55C \uBB3C\uAC74 \uD3EC\uC7A5 \uC218 \uAD6C\uD558\uAE30", (k) => E(`\uB2EC\uAC40 ${31 + k}\uAC1C\uB97C 10\uAC1C\uAE4C\uC9C0 \uB2F4\uB294 \uC0C1\uC790\uC5D0 \uBAA8\uB450 \uB123\uC2B5\uB2C8\uB2E4. \uD544\uC694\uD55C \uC0C1\uC790 \uC218\uB97C \uC62C\uB9BC\uD558\uC5EC \uAD6C\uD558\uC138\uC694.`, [31 + k, 10, "ceil/"], "\uB0A8\uC740 \uB2EC\uAC40\uC774 \uC788\uC73C\uBA74 \uC0C1\uC790 \uD55C \uAC1C\uAC00 \uB354 \uD544\uC694\uD558\uBBC0\uB85C {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a10(2, 1, "round-down-full", "6\uC21801-03", 3, "\uBC84\uB9BC\uC774 \uD544\uC694\uD55C \uC644\uC131 \uBB36\uC74C \uC218 \uAD6C\uD558\uAE30", (k) => E(`\uC5FD\uC11C ${31 + k}\uC7A5\uC744 10\uC7A5\uC529 \uC644\uC131 \uBB36\uC74C\uC73C\uB85C\uB9CC \uD3EC\uC7A5\uD569\uB2C8\uB2E4. \uB0A8\uC740 \uAC83\uC740 \uD3EC\uC7A5\uD558\uC9C0 \uC54A\uC744 \uB54C \uBB36\uC74C\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [31 + k, 10, "floor/"], "\uC644\uC131\uB41C 10\uC7A5 \uBB36\uC74C\uB9CC \uC138\uBBC0\uB85C {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a10(2, 1, "round-interval", "6\uC21801-03", 4, "\uBC18\uC62C\uB9BC \uACB0\uACFC\uB97C \uB9CC\uC871\uD558\uB294 \uCD5C\uC18C \uC790\uC5F0\uC218 \uCC3E\uAE30", () => C("\uC2ED\uC758 \uC790\uB9AC\uAE4C\uC9C0 \uBC18\uC62C\uB9BC\uD558\uC5EC 250\uC774 \uB418\uB294 \uC790\uC5F0\uC218 \uC911 \uAC00\uC7A5 \uC791\uC740 \uC218\uB97C \uACE0\uB974\uC138\uC694.", "245", [["240", "\uBC84\uB9BC \uACBD\uACC4\uC640 \uD63C\uB3D9"], ["249", "\uD55C \uAC12\uB9CC \uC0DD\uAC01"], ["255", "\uB2E4\uC74C \uBC18\uC62C\uB9BC \uAD6C\uAC04"]], "245\uBD80\uD130 254\uAE4C\uC9C0 \uC2ED\uC758 \uC790\uB9AC \uBC18\uC62C\uB9BC \uACB0\uACFC\uAC00 250\uC774\uBBC0\uB85C \uCD5C\uC18C\uB294 245\uC785\uB2C8\uB2E4."), 1);
a10(2, 2, "fraction-of-quantity", "6\uC21801-09", 3, "\uC804\uCCB4 \uC218\uB7C9\uC758 \uBD84\uC218\uB9CC\uD07C \uAD6C\uD558\uAE30", (k) => E(`\uAD6C\uC2AC ${12 * (2 + k)}\uAC1C\uC758 3/4\uC744 \uB098\uB220 \uC90D\uB2C8\uB2E4. \uB098\uB220 \uC8FC\uB294 \uAD6C\uC2AC\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [12 * (2 + k), "3/4", "*"], "\uC804\uCCB4 \uAD6C\uC2AC \uC218\uC5D0 3/4\uC744 \uACF1\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a10(2, 2, "fraction-product", "6\uC21801-09", 2, "\uBD84\uC218\uC640 \uBD84\uC218 \uACF1\uD558\uAE30", (k) => E(`${f(1 + k % 3, 4)} \xD7 2/5\uB97C \uACC4\uC0B0\uD558\uC138\uC694.`, [f(1 + k % 3, 4), "2/5", "*"], "\uBD84\uC790\uB294 \uBD84\uC790\uB07C\uB9AC, \uBD84\uBAA8\uB294 \uBD84\uBAA8\uB07C\uB9AC \uACF1\uD558\uACE0 \uC57D\uBD84\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"), 3);
a10(2, 2, "fraction-repeat", "6\uC21801-09", 3, "\uBD84\uC218 \uC591\uC744 \uC5EC\uB7EC \uBC88 \uC0AC\uC6A9\uD55C \uC804\uCCB4 \uC591 \uAD6C\uD558\uAE30", (k) => E(`\uD55C \uBC88\uC5D0 \uBB3C 2/7 L\uB97C \uC0AC\uC6A9\uD569\uB2C8\uB2E4. ${3 + k}\uBC88 \uC0AC\uC6A9\uD55C \uBB3C\uC758 \uC591\uC744 L \uB2E8\uC704\uC758 \uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, ["2/7", 3 + k, "*"], "\uD55C \uBC88\uC758 \uC591\uC5D0 \uD69F\uC218\uB97C \uACF1\uD558\uBA74 {answer} L\uC785\uB2C8\uB2E4."));
a10(2, 2, "product-size", "6\uC21801-09", 1, "1\uBCF4\uB2E4 \uC791\uC740 \uBD84\uC218\uB97C \uACF1\uD55C \uACB0\uACFC\uC758 \uD06C\uAE30 \uC774\uD574\uD558\uAE30", () => C("\uC591\uC218 4\uC5D0 1/2\uC744 \uACF1\uD558\uBA74 \uACB0\uACFC\uB294 4\uC640 \uBE44\uAD50\uD558\uC5EC \uC5B4\uB5BB\uC2B5\uB2C8\uAE4C?", "4\uBCF4\uB2E4 \uC791\uB2E4", [["4\uBCF4\uB2E4 \uD06C\uB2E4", "\uACF1\uC148\uC740 \uC5B8\uC81C\uB098 \uCEE4\uC9C4\uB2E4\uB294 \uC624\uAC1C\uB150"], ["4\uC640 \uAC19\uB2E4", "\uACF1\uD558\uB294 \uC218\uC758 \uC601\uD5A5 \uBB34\uC2DC"]], "4\uC758 \uC808\uBC18\uC744 \uAD6C\uD558\uBBC0\uB85C \uACB0\uACFC\uB294 2\uC774\uACE0 4\uBCF4\uB2E4 \uC791\uC2B5\uB2C8\uB2E4."), 1);
a10(2, 2, "fraction-rectangle", "6\uC21801-09", 3, "\uBD84\uC218 \uBCC0 \uAE38\uC774\uC758 \uACF1\uC73C\uB85C \uC9C1\uC0AC\uAC01\uD615 \uB113\uC774 \uAD6C\uD558\uAE30", () => E("\uAC00\uB85C 2/3 m, \uC138\uB85C 3/4 m\uC778 \uC9C1\uC0AC\uAC01\uD615 \uC885\uC774\uC758 \uB113\uC774\uB97C m\xB2 \uB2E8\uC704\uC758 \uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.", ["2/3", "3/4", "*"], "\uAC00\uB85C\uC640 \uC138\uB85C\uB97C \uACF1\uD558\uBA74 {answer} m\xB2\uC785\uB2C8\uB2E4."), 1);
a10(2, 2, "fraction-cancel-error", "6\uC21801-09", 3, "\uBD84\uC218 \uACF1\uC148\uC5D0\uC11C \uC57D\uBD84 \uACB0\uACFC \uD655\uC778\uD558\uAE30", () => C("3/4 \xD7 8/9\uB97C \uACC4\uC0B0\uD55C \uBC14\uB978 \uAC12\uC744 \uACE0\uB974\uC138\uC694.", "2/3", [["24/13", "\uBD84\uBAA8\uB97C \uB354\uD568"], ["11/13", "\uBD84\uC790\uC640 \uBD84\uBAA8\uB97C \uAC01\uAC01 \uB354\uD568"]], "3\uACFC 9, 8\uACFC 4\uB97C \uC57D\uBD84\uD558\uC5EC \uACF1\uD558\uBA74 2/3\uC785\uB2C8\uB2E4."), 1);
a10(2, 3, "congruence-no-size", "6\uC21803-01", 1, "\uD569\uB3D9\uACFC \uD06C\uAE30 \uBCC0\uD615 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC0BC\uAC01\uD615\uC758 \uBAA8\uB4E0 \uBCC0\uC744 2\uBC30\uB85C \uB298\uB824 \uC0C8 \uC0BC\uAC01\uD615\uC744 \uB9CC\uB4E4\uC5C8\uC2B5\uB2C8\uB2E4. \uC6D0\uB798 \uC0BC\uAC01\uD615\uACFC \uD569\uB3D9\uC785\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uAC19\uC740 \uBAA8\uC591\uACFC \uD569\uB3D9 \uD63C\uB3D9"]], "\uD569\uB3D9\uC740 \uBAA8\uC591\uBFD0 \uC544\uB2C8\uB77C \uD06C\uAE30\uB3C4 \uAC19\uC544\uC57C \uD569\uB2C8\uB2E4."), 1);
a10(2, 3, "correspond-side", "6\uC21803-01", 2, "\uD569\uB3D9 \uB3C4\uD615\uC758 \uB300\uC751\uBCC0 \uAE38\uC774 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uD569\uB3D9\uC778 \uC0BC\uAC01\uD615 ABC\uC640 DEF\uC5D0\uC11C A\u2194D, B\u2194E, C\u2194F\uC785\uB2C8\uB2E4. AB\uAC00 ${6 + k} cm\uC774\uBA74 DE\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?`, [6 + k], "\uD569\uB3D9\uC778 \uB3C4\uD615\uC758 \uB300\uC751\uBCC0 \uAE38\uC774\uB294 \uAC19\uC73C\uBBC0\uB85C {answer} cm\uC785\uB2C8\uB2E4.", "cm"));
a10(2, 3, "correspond-angle", "6\uC21803-01", 2, "\uD569\uB3D9 \uB3C4\uD615\uC758 \uB300\uC751\uAC01 \uD06C\uAE30 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uD569\uB3D9\uC778 \uC0BC\uAC01\uD615 ABC\uC640 DEF\uC5D0\uC11C A\u2194D\uC785\uB2C8\uB2E4. \uAC01 A\uAC00 ${40 + k}\xB0\uC774\uBA74 \uAC01 D\uB294 \uBA87 \uB3C4\uC785\uB2C8\uAE4C?`, [40 + k], "\uD569\uB3D9\uC778 \uB3C4\uD615\uC758 \uB300\uC751\uAC01 \uD06C\uAE30\uB294 \uAC19\uC73C\uBBC0\uB85C {answer}\xB0\uC785\uB2C8\uB2E4.", "\xB0"));
a10(2, 3, "symmetry-distance", "6\uC21803-02", 2, "\uC120\uB300\uCE6D \uB300\uC751\uC810\uC758 \uCD95\uAE4C\uC9C0 \uAC70\uB9AC \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uB450 \uC810 A\uC640 B\uB294 \uD55C \uB300\uCE6D\uCD95\uC5D0 \uB300\uD574 \uC120\uB300\uCE6D\uC785\uB2C8\uB2E4. A\uC5D0\uC11C \uCD95\uAE4C\uC9C0\uC758 \uC218\uC9C1 \uAC70\uB9AC\uAC00 ${3 + k} cm\uC774\uBA74 B\uC5D0\uC11C \uCD95\uAE4C\uC9C0\uC758 \uC218\uC9C1 \uAC70\uB9AC\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?`, [3 + k], "\uC120\uB300\uCE6D\uC778 \uB300\uC751\uC810\uC740 \uCD95\uC5D0\uC11C \uAC19\uC740 \uAC70\uB9AC\uB9CC\uD07C \uB5A8\uC5B4\uC838 \uC788\uC73C\uBBC0\uB85C {answer} cm\uC785\uB2C8\uB2E4.", "cm"));
a10(2, 3, "point-symmetry", "6\uC21803-02", 1, "\uC810\uB300\uCE6D\uC5D0\uC11C \uD68C\uC804 \uD06C\uAE30 \uC774\uD574\uD558\uAE30", () => C("\uC810\uB300\uCE6D\uB3C4\uD615\uC744 \uB300\uCE6D\uC758 \uC911\uC2EC\uC744 \uAE30\uC900\uC73C\uB85C \uB3CC\uB824 \uC6D0\uB798 \uB3C4\uD615\uACFC \uACB9\uCE58\uAC8C \uD558\uB294 \uAE30\uBCF8 \uD68C\uC804\uC744 \uACE0\uB974\uC138\uC694.", "\uBC18 \uBC14\uD034", [["4\uBD84\uC758 1\uBC14\uD034", "\uC120\uB300\uCE6D\xB7\uD68C\uC804 \uC870\uAC74 \uD63C\uB3D9"], ["\uB4A4\uC9D1\uAE30\uB9CC \uD558\uAE30", "\uC810\uB300\uCE6D\uACFC \uC120\uB300\uCE6D \uD63C\uB3D9"]], "\uC810\uB300\uCE6D\uB3C4\uD615\uC740 \uC911\uC2EC\uC744 \uAE30\uC900\uC73C\uB85C \uBC18 \uBC14\uD034 \uB3CC\uB9AC\uBA74 \uC6D0\uB798 \uB3C4\uD615\uACFC \uACB9\uCE69\uB2C8\uB2E4."), 1);
a10(2, 3, "axis-on-point", "6\uC21803-02", 1, "\uB300\uCE6D\uCD95 \uC704 \uC810\uC758 \uB300\uC751\uC810 \uC774\uD574\uD558\uAE30", () => C("\uC810 A\uAC00 \uC120\uB300\uCE6D\uB3C4\uD615\uC758 \uB300\uCE6D\uCD95 \uC704\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. A\uB97C \uCD95\uC5D0 \uB300\uD574 \uB4A4\uC9D1\uC740 \uB300\uC751\uC810\uC740 \uC5B4\uB514\uC785\uB2C8\uAE4C?", "A\uC640 \uAC19\uC740 \uC704\uCE58", [["\uCD95 \uBC18\uB300\uCABD\uC758 \uB2E4\uB978 \uC704\uCE58", "\uCD95 \uC704 \uAC70\uB9AC 0 \uBB34\uC2DC"], ["\uBC18\uB4DC\uC2DC \uB3C4\uD615 \uBC16", "\uB300\uCE6D \uC704\uCE58 \uD63C\uB3D9"]], "\uCD95 \uC704 \uC810\uC740 \uCD95\uC5D0\uC11C\uC758 \uAC70\uB9AC\uAC00 0\uC774\uBBC0\uB85C \uAC19\uC740 \uC704\uCE58\uC5D0 \uB300\uC751\uD569\uB2C8\uB2E4."), 1);
a10(2, 4, "decimal-product", "6\uC21801-13", 2, "\uC18C\uC218 \uACF1\uC148\uC758 \uC790\uB9BF\uAC12 \uC801\uC6A9\uD558\uAE30", (k) => E(`${dec(12 + k, 10)} \xD7 0.4\uB97C \uACC4\uC0B0\uD558\uC138\uC694.`, [dec(12 + k, 10), "0.4", "*"], "\uC790\uC5F0\uC218 \uACF1\uC148\uACFC \uC790\uB9BF\uAC12\uC744 \uC5F0\uACB0\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a10(2, 4, "decimal-price", "6\uC21801-13", 3, "\uC18C\uC218 \uCE21\uC815\uB7C9\uC5D0 \uB2E8\uAC00\uB97C \uACF1\uD558\uAE30", (k) => E(`\uB048 1 m\uC758 \uAC00\uACA9\uC740 1000\uC6D0\uC785\uB2C8\uB2E4. ${dec(15 + k, 10)} m\uC758 \uAC00\uACA9\uC740 \uBA87 \uC6D0\uC785\uB2C8\uAE4C?`, [1e3, dec(15 + k, 10), "*"], "1 m\uC758 \uAC00\uACA9\uC5D0 \uAE38\uC774\uB97C \uACF1\uD558\uBA74 {answer}\uC6D0\uC785\uB2C8\uB2E4.", "\uC6D0"));
a10(2, 4, "decimal-length-repeat", "6\uC21801-13", 3, "\uC18C\uC218 \uAE38\uC774\uB97C \uC5EC\uB7EC \uBC88 \uC774\uC5B4 \uBD99\uC778 \uAE38\uC774 \uAD6C\uD558\uAE30", (k) => E(`\uAE38\uC774 0.25 m\uC778 \uC885\uC774\uB760 ${4 + k}\uAC1C\uB97C \uACB9\uCE58\uC9C0 \uC54A\uAC8C \uC774\uC5B4 \uBD99\uC600\uC2B5\uB2C8\uB2E4. \uC804\uCCB4 \uAE38\uC774\uB294 \uBA87 m\uC785\uB2C8\uAE4C?`, ["0.25", 4 + k, "*"], "\uD55C \uC885\uC774\uB760\uC758 \uAE38\uC774\uC5D0 \uAC1C\uC218\uB97C \uACF1\uD558\uBA74 {answer} m\uC785\uB2C8\uB2E4.", "m"));
a10(2, 4, "decimal-area", "6\uC21801-13", 3, "\uC18C\uC218 \uBCC0 \uAE38\uC774\uB85C \uC9C1\uC0AC\uAC01\uD615 \uB113\uC774 \uAD6C\uD558\uAE30", (k) => E(`\uAC00\uB85C ${dec(15 + k, 10)} m, \uC138\uB85C 0.8 m\uC778 \uC9C1\uC0AC\uAC01\uD615\uC758 \uB113\uC774\uB294 \uBA87 m\xB2\uC785\uB2C8\uAE4C?`, [dec(15 + k, 10), "0.8", "*"], "\uAC00\uB85C\uC640 \uC138\uB85C\uB97C \uACF1\uD558\uBA74 {answer} m\xB2\uC785\uB2C8\uB2E4.", "m\xB2"));
a10(2, 4, "decimal-magnitude", "6\uC21801-13", 1, "\uC18C\uC218 \uACF1\uC148 \uACB0\uACFC\uC758 \uD06C\uAE30 \uD310\uB2E8\uD558\uAE30", () => C("3 \xD7 0.2\uC758 \uACB0\uACFC\uB97C \uACE0\uB974\uC138\uC694.", "0.6", [["6", "\uC18C\uC218\uC810 \uD55C \uC790\uB9AC \uBB34\uC2DC"], ["3.2", "\uACF1\uC148\uC744 \uB367\uC148\uC73C\uB85C \uBC14\uAFC8"]], "3\uC758 0.2\uBC30\uB294 0.6\uC785\uB2C8\uB2E4."), 1);
a10(2, 4, "decimal-place-error", "6\uC21801-13", 3, "\uC18C\uC218 \uACF1\uC148 \uC790\uB9BF\uC218 \uC624\uB958 \uC218\uC815\uD558\uAE30", () => C("0.3 \xD7 0.4\uB97C 1.2\uB77C\uACE0 \uACC4\uC0B0\uD588\uC2B5\uB2C8\uB2E4. \uBC14\uB978 \uAC12\uC744 \uACE0\uB974\uC138\uC694.", "0.12", [["1.2", "\uC18C\uC218 \uC790\uB9BF\uAC12 \uD55C \uC790\uB9AC \uB204\uB77D"], ["0.7", "\uACF1\uC148\uC744 \uB367\uC148\uC73C\uB85C \uBC14\uAFC8"]], "3/10 \xD7 4/10 = 12/100 = 0.12\uC785\uB2C8\uB2E4."), 1);
a10(2, 5, "cuboid-edges", "6\uC21803-03", 1, "\uC9C1\uC721\uBA74\uCCB4 \uBAA8\uC11C\uB9AC \uC218 \uC774\uD574\uD558\uAE30", () => C("\uC9C1\uC721\uBA74\uCCB4\uC758 \uBAA8\uC11C\uB9AC\uB294 \uBAA8\uB450 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", "12", [["8", "\uAF2D\uC9D3\uC810 \uC218\uC640 \uD63C\uB3D9"], ["6", "\uBA74 \uC218\uC640 \uD63C\uB3D9"]], "\uC717\uBA74 4\uAC1C, \uC544\uB7AB\uBA74 4\uAC1C, \uB450 \uBA74\uC744 \uC787\uB294 4\uAC1C\uB85C \uBAA8\uC11C\uB9AC\uB294 12\uAC1C\uC785\uB2C8\uB2E4."), 1);
a10(2, 5, "cube-equal", "6\uC21803-03", 1, "\uC815\uC721\uBA74\uCCB4\uC758 \uAC19\uC740 \uBAA8\uC11C\uB9AC \uAE38\uC774 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uC815\uC721\uBA74\uCCB4\uC758 \uD55C \uBAA8\uC11C\uB9AC \uAE38\uC774\uAC00 ${2 + k} cm\uC785\uB2C8\uB2E4. \uB2E4\uB978 \uBAA8\uC11C\uB9AC\uC758 \uAE38\uC774\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?`, [2 + k], "\uC815\uC721\uBA74\uCCB4\uC758 \uBAA8\uB4E0 \uBAA8\uC11C\uB9AC \uAE38\uC774\uB294 \uAC19\uC73C\uBBC0\uB85C {answer} cm\uC785\uB2C8\uB2E4.", "cm"));
a10(2, 5, "opposite-face", "6\uC21803-03", 2, "\uC9C1\uC721\uBA74\uCCB4\uC758 \uB9C8\uC8FC \uBCF4\uB294 \uBA74 \uC131\uC9C8 \uC774\uD574\uD558\uAE30", () => C("\uC9C1\uC721\uBA74\uCCB4\uC5D0\uC11C \uC11C\uB85C \uB9C8\uC8FC \uBCF4\uB294 \uB450 \uBA74\uC758 \uAD00\uACC4\uB97C \uACE0\uB974\uC138\uC694.", "\uC11C\uB85C \uD3C9\uD589\uD558\uACE0 \uD569\uB3D9\uC774\uB2E4", [["\uC11C\uB85C \uC218\uC9C1\uC774\uACE0 \uD569\uB3D9\uC774\uB2E4", "\uB9C8\uC8FC \uBCF4\uB294 \uBA74\uACFC \uC774\uC6C3\uD55C \uBA74 \uD63C\uB3D9"], ["\uD56D\uC0C1 \uC11C\uB85C \uB2E4\uB978 \uD06C\uAE30\uC774\uB2E4", "\uB9C8\uC8FC \uBCF4\uB294 \uBA74\uC758 \uD06C\uAE30 \uD63C\uB3D9"]], "\uC9C1\uC721\uBA74\uCCB4\uC758 \uB9C8\uC8FC \uBCF4\uB294 \uBA74\uC740 \uC11C\uB85C \uD3C9\uD589\uD558\uACE0 \uD06C\uAE30\uC640 \uBAA8\uC591\uC774 \uAC19\uC2B5\uB2C8\uB2E4."), 1);
a10(2, 5, "net-square-count", "6\uC21803-04", 1, "\uC815\uC721\uBA74\uCCB4 \uC804\uAC1C\uB3C4\uC758 \uBA74 \uAD6C\uC131 \uC774\uD574\uD558\uAE30", () => C("\uC815\uC721\uBA74\uCCB4 \uC804\uAC1C\uB3C4\uC5D0 \uD544\uC694\uD55C \uAC19\uC740 \uD06C\uAE30\uC758 \uC815\uC0AC\uAC01\uD615\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", "6", [["4", "\uC606\uBA74\uB9CC \uC148"], ["8", "\uAF2D\uC9D3\uC810\uACFC \uD63C\uB3D9"]], "\uC815\uC721\uBA74\uCCB4\uC758 \uC5EC\uC12F \uBA74\uC774 \uC804\uAC1C\uB3C4\uC758 \uC5EC\uC12F \uC815\uC0AC\uAC01\uD615\uC774 \uB429\uB2C8\uB2E4."), 1);
a10(2, 5, "net-necessary-not-sufficient", "6\uC21803-04", 3, "\uBA74 \uAC1C\uC218\uB9CC\uC73C\uB85C \uC804\uAC1C\uB3C4 \uC131\uB9BD\uC744 \uD655\uC815\uD560 \uC218 \uC5C6\uC74C \uC774\uD574\uD558\uAE30", () => C("\uAC19\uC740 \uC815\uC0AC\uAC01\uD615 \uC5EC\uC12F \uAC1C\uAC00 \uC774\uC5B4\uC838 \uC788\uC2B5\uB2C8\uB2E4. \uAC1C\uC218\uB9CC \uD655\uC778\uD558\uBA74 \uD56D\uC0C1 \uC815\uC721\uBA74\uCCB4 \uC804\uAC1C\uB3C4\uB77C\uACE0 \uD560 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uBA74 \uAC1C\uC218\uB9CC\uC73C\uB85C \uC811\uD798 \uC131\uB9BD \uD310\uB2E8"]], "\uBA74 \uAC1C\uC218\uAC00 \uB9DE\uC544\uB3C4 \uC811\uC73C\uBA74 \uACB9\uCE60 \uC218 \uC788\uC73C\uBBC0\uB85C \uC5F0\uACB0\uACFC \uC811\uD798\uC744 \uD655\uC778\uD574\uC57C \uD569\uB2C8\uB2E4."), 1);
a10(2, 5, "cuboid-face-shape", "6\uC21803-03", 2, "\uC9C1\uC721\uBA74\uCCB4 \uBA74\uACFC \uD3C9\uBA74\uB3C4\uD615 \uC5F0\uACB0\uD558\uAE30", () => C("\uC9C1\uC721\uBA74\uCCB4\uC758 \uAC01 \uBA74\uC740 \uC5B4\uB5A4 \uB3C4\uD615\uC785\uB2C8\uAE4C? \uC815\uC0AC\uAC01\uD615\uC778 \uBA74\uB3C4 \uD3EC\uD568\uD558\uC5EC \uB2F5\uD558\uC138\uC694.", "\uC9C1\uC0AC\uAC01\uD615", [["\uC0BC\uAC01\uD615", "\uC785\uCCB4\uC758 \uBA74 \uAD6C\uC131 \uD63C\uB3D9"], ["\uC6D0", "\uACE1\uBA74 \uC785\uCCB4\uC640 \uD63C\uB3D9"]], "\uC9C1\uC721\uBA74\uCCB4\uC758 \uBAA8\uB4E0 \uBA74\uC740 \uC9C1\uC0AC\uAC01\uD615\uC774\uBA70 \uC815\uC0AC\uAC01\uD615\uB3C4 \uC9C1\uC0AC\uAC01\uD615\uC758 \uC870\uAC74\uC744 \uB9CC\uC871\uD569\uB2C8\uB2E4."), 1);
var r = (k) => [{ label: "1\uC77C", value: 4 + k }, { label: "2\uC77C", value: 6 + k }, { label: "3\uC77C", value: 8 + k }];
a10(2, 6, "mean-three", "6\uC21804-01", 2, "\uC790\uB8CC\uC758 \uD3C9\uADE0 \uAD6C\uD558\uAE30", (k) => M("\uD45C\uB294 3\uC77C \uB3D9\uC548 \uC77D\uC740 \uCC45\uC758 \uCABD\uC218\uC785\uB2C8\uB2E4. \uD558\uB8E8 \uD3C9\uADE0 \uBA87 \uCABD\uC785\uB2C8\uAE4C?", "foundation", "mean", { task: "graph", graphType: "table", rows: r(k), valueUnit: "\uCABD" }, "\uC138 \uB0A0\uC758 \uCABD\uC218\uB97C \uBAA8\uB450 \uB354\uD558\uACE0 3\uC73C\uB85C \uB098\uB204\uBA74 \uD3C9\uADE0 {answer}\uCABD\uC785\uB2C8\uB2E4.", "\uCABD", "data-interpretation"));
a10(2, 6, "mean-missing", "6\uC21804-01", 4, "\uD3C9\uADE0\uACFC \uB450 \uC790\uB8CC\uB85C \uB098\uBA38\uC9C0 \uC790\uB8CC \uAD6C\uD558\uAE30", (k) => E(`\uC138 \uBC88\uC758 \uC810\uC218 \uD3C9\uADE0\uC774 ${7 + k}\uC810\uC785\uB2C8\uB2E4. \uB450 \uC810\uC218\uAC00 ${5 + k}\uC810, ${7 + k}\uC810\uC77C \uB54C \uB098\uBA38\uC9C0 \uC810\uC218\uB294 \uBA87 \uC810\uC785\uB2C8\uAE4C?`, [7 + k, 3, "*", 5 + k, "-", 7 + k, "-"], "\uD3C9\uADE0\uC73C\uB85C \uC804\uCCB4 \uD569\uC744 \uAD6C\uD558\uACE0 \uB450 \uC810\uC218\uB97C \uBE7C\uBA74 {answer}\uC810\uC785\uB2C8\uB2E4.", "\uC810", "data-interpretation"));
a10(2, 6, "chance-certain", "6\uC21804-04", 1, "\uD655\uC2E4\uD55C \uC0AC\uAC74\uC744 \uAC00\uB2A5\uC131\uC758 \uB9D0\uB85C \uD45C\uD604\uD558\uAE30", () => C("\uC8FC\uBA38\uB2C8\uC5D0 \uBE68\uAC04 \uACF5\uB9CC \uC788\uC2B5\uB2C8\uB2E4. \uACF5 \uD558\uB098\uB97C \uAEBC\uB0BC \uB54C \uBE68\uAC04 \uACF5\uC774 \uB098\uC624\uB294 \uAC00\uB2A5\uC131\uC744 \uACE0\uB974\uC138\uC694.", "\uD655\uC2E4\uD558\uB2E4", [["\uBD88\uAC00\uB2A5\uD558\uB2E4", "\uD655\uC2E4\uACFC \uBD88\uAC00\uB2A5 \uD63C\uB3D9"], ["\uBC18\uBC18\uC774\uB2E4", "\uAC19\uC740 \uC885\uB958\uB9CC \uC788\uB294 \uC870\uAC74 \uBB34\uC2DC"]], "\uC5B4\uB5A4 \uACF5\uC744 \uAEBC\uB0B4\uB3C4 \uBE68\uAC04 \uACF5\uC774\uBBC0\uB85C \uD655\uC2E4\uD569\uB2C8\uB2E4."), 1);
a10(2, 6, "chance-half", "6\uC21804-05", 2, "\uAC19\uC740 \uAC00\uB2A5\uC131\uC758 \uB450 \uACB0\uACFC \uC911 \uD558\uB098\uC758 \uAC00\uB2A5\uC131 \uB098\uD0C0\uB0B4\uAE30", () => C("\uC55E\uBA74\uACFC \uB4B7\uBA74\uC774 \uAC19\uC740 \uAC00\uB2A5\uC131\uC73C\uB85C \uB098\uC624\uB294 \uB3D9\uC804\uC744 \uD55C \uBC88 \uB358\uC9D1\uB2C8\uB2E4. \uC55E\uBA74\uC774 \uB098\uC624\uB294 \uAC00\uB2A5\uC131\uC744 \uC218\uB85C \uACE0\uB974\uC138\uC694.", "1/2", [["0", "\uAC00\uB2A5\uD55C \uACB0\uACFC\uB97C \uBD88\uAC00\uB2A5\uC73C\uB85C \uC624\uC778"], ["1", "\uAC00\uB2A5\uD55C \uACB0\uACFC\uB97C \uD655\uC2E4\uB85C \uC624\uC778"]], "\uAC19\uC740 \uAC00\uB2A5\uC131\uC758 \uB450 \uACB0\uACFC \uC911 \uD55C \uACB0\uACFC\uC774\uBBC0\uB85C 1/2\uC785\uB2C8\uB2E4."), 1);
a10(2, 6, "observation-limit", "6\uC21804-06", 3, "\uC2E4\uD5D8 \uD69F\uC218\uC640 \uB2E4\uC74C \uACB0\uACFC \uD655\uC815 \uAD6C\uBCC4\uD558\uAE30", () => C("\uB3D9\uC804\uC5D0\uC11C \uC55E\uBA74\uC774 \uB2E4\uC12F \uBC88 \uC5F0\uC18D \uB098\uC654\uC2B5\uB2C8\uB2E4. \uB2E4\uC74C\uC5D0\uB294 \uBC18\uB4DC\uC2DC \uB4B7\uBA74\uC774 \uB098\uC628\uB2E4\uACE0 \uD560 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uC774\uC804 \uACB0\uACFC\uAC00 \uB2E4\uC74C \uACB0\uACFC\uB97C \uAC15\uC81C\uD55C\uB2E4\uACE0 \uD310\uB2E8"]], "\uC55E\uC120 \uAE30\uB85D\uB9CC\uC73C\uB85C \uB2E4\uC74C \uD55C \uBC88\uC758 \uACB0\uACFC\uAC00 \uBC18\uB4DC\uC2DC \uB4B7\uBA74\uC774\uB77C\uACE0 \uD655\uC815\uD560 \uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4."), 1);
a10(2, 6, "chance-compare", "6\uC21804-04", 3, "\uAC00\uB2A5\uC131 \uD06C\uAE30\uB97C \uB9D0\uB85C \uBE44\uAD50\uD558\uAE30", () => C("\uC5B4\uB5A4 \uC0AC\uAC74\uC740 \uBD88\uAC00\uB2A5\uD558\uACE0 \uB2E4\uB978 \uC0AC\uAC74\uC740 \uD655\uC2E4\uD569\uB2C8\uB2E4. \uAC00\uB2A5\uC131\uC774 \uB354 \uD070 \uC0AC\uAC74\uC744 \uACE0\uB974\uC138\uC694.", "\uD655\uC2E4\uD55C \uC0AC\uAC74", [["\uBD88\uAC00\uB2A5\uD55C \uC0AC\uAC74", "\uAC00\uB2A5\uC131 \uB9D0\uC758 \uD06C\uAE30 \uBC18\uB300\uB85C \uC774\uD574"], ["\uB450 \uC0AC\uAC74\uC758 \uAC00\uB2A5\uC131\uC774 \uAC19\uB2E4", "\uAC00\uB2A5\uC131 \uD06C\uAE30 \uAD6C\uBCC4 \uC2E4\uD328"]], "\uBD88\uAC00\uB2A5\uD55C \uC0AC\uAC74\uC758 \uAC00\uB2A5\uC131\uC740 0, \uD655\uC2E4\uD55C \uC0AC\uAC74\uC758 \uAC00\uB2A5\uC131\uC740 1\uC774\uBBC0\uB85C \uD655\uC2E4\uD55C \uC0AC\uAC74\uC774 \uB354 \uD07D\uB2C8\uB2E4."), 1);

// learning-review-r1/native/data/upper-grade6.js
var a11 = (s, u, id, code, l, o, fn, d = 24) => A(6, s, u, id, code, l, o, fn, d);
a11(1, 1, "natural-quotient", "6\uC21801-10", 2, "\uC790\uC5F0\uC218 \uB098\uB217\uC148\uC758 \uBAAB\uC744 \uBD84\uC218\uB85C \uB098\uD0C0\uB0B4\uAE30", (k) => E(`${5 + k} \xF7 4\uC758 \uBAAB\uC744 \uAE30\uC57D\uBD84\uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, [5 + k, 4, "/"], "\uB098\uB204\uC5B4\uC9C0\uB294 \uC218\uB97C \uBD84\uC790, \uB098\uB204\uB294 \uC218\uB97C \uBD84\uBAA8\uB85C \uB098\uD0C0\uB0B4\uACE0 \uC57D\uBD84\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a11(1, 1, "fraction-natural", "6\uC21801-11", 2, "\uBD84\uC218\uB97C \uC790\uC5F0\uC218\uB85C \uB611\uAC19\uC774 \uB098\uB204\uAE30", (k) => E(`${f(3 + k % 4, 8)} \xF7 3\uC744 \uACC4\uC0B0\uD558\uC138\uC694.`, [f(3 + k % 4, 8), 3, "/"], "\uBD84\uC218 \uC870\uAC01\uC744 3\uB4F1\uBD84\uD558\uBBC0\uB85C \uBD84\uBAA8\uB97C 3\uBC30 \uD55C \uB4A4 \uC57D\uBD84\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"), 4);
a11(1, 1, "fraction-ribbon-share", "6\uC21801-11", 3, "\uBD84\uC218 \uAE38\uC774\uB97C \uAC19\uC740 \uC218\uC758 \uC0AC\uB78C\uC5D0\uAC8C \uB098\uB204\uAE30", (k) => E(`\uB9AC\uBCF8 ${f(4 + k % 3, 7)} m\uB97C 2\uBA85\uC5D0\uAC8C \uB611\uAC19\uC774 \uB098\uB215\uB2C8\uB2E4. \uD55C \uC0AC\uB78C\uC758 \uAE38\uC774\uB97C m \uB2E8\uC704\uC758 \uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, [f(4 + k % 3, 7), 2, "/"], "\uC8FC\uC5B4\uC9C4 \uAE38\uC774\uB97C \uB458\uB85C \uB611\uAC19\uC774 \uB098\uB204\uBA74 {answer} m\uC785\uB2C8\uB2E4."), 3);
a11(1, 1, "natural-share-fraction", "6\uC21801-10", 3, "\uC790\uC5F0\uC218 \uCE21\uC815\uB7C9\uC744 \uB098\uB208 \uBAAB\uC758 \uBD84\uC218 \uC758\uBBF8 \uC774\uD574\uD558\uAE30", (k) => E(`\uBB3C ${3 + k} L\uB97C 5\uAC1C\uC758 \uBCD1\uC5D0 \uB611\uAC19\uC774 \uB098\uB215\uB2C8\uB2E4. \uD55C \uBCD1\uC758 \uBB3C\uC758 \uC591\uC744 L \uB2E8\uC704\uC758 \uAE30\uC57D\uBD84\uC218 \uB610\uB294 \uC815\uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, [3 + k, 5, "/"], "\uC804\uCCB4 \uC591\uC744 \uBCD1 \uC218\uB85C \uB098\uB208 \uBAAB\uC740 {answer} L\uC785\uB2C8\uB2E4."));
a11(1, 1, "division-denominator-error", "6\uC21801-11", 3, "\uBD84\uC218\uB97C \uC790\uC5F0\uC218\uB85C \uB098\uB20C \uB54C \uBD84\uBAA8 \uBCC0\uD654 \uC124\uBA85\uD558\uAE30", () => C("3/5 \xF7 2\uC758 \uACB0\uACFC\uB97C \uACE0\uB974\uC138\uC694.", "3/10", [["6/5", "\uB098\uB204\uB294 \uB300\uC2E0 \uACF1\uD568"], ["3/3", "\uBD84\uBAA8\uC5D0\uC11C 2\uB97C \uBE8C"]], "\uAC01 1/5 \uC870\uAC01\uC744 \uB458\uB85C \uB098\uB204\uBA74 1/10 \uC870\uAC01\uC774 \uB418\uBBC0\uB85C 3/10\uC785\uB2C8\uB2E4."), 1);
a11(1, 1, "restore-fraction-total", "6\uC21801-11", 4, "\uB098\uB208 \uC591\uACFC \uC0AC\uB78C \uC218\uB85C \uCC98\uC74C \uBD84\uC218 \uC591 \uBCF5\uC6D0\uD558\uAE30", (k) => E(`\uB9AC\uBCF8\uC744 3\uBA85\uC5D0\uAC8C \uB611\uAC19\uC774 \uB098\uB204\uC5C8\uB354\uB2C8 \uD55C \uC0AC\uB78C\uC5D0\uAC8C ${f(1 + k % 3, 8)} m\uC529 \uB3CC\uC544\uAC14\uC2B5\uB2C8\uB2E4. \uCC98\uC74C \uAE38\uC774\uB97C m \uB2E8\uC704\uC758 \uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, [f(1 + k % 3, 8), 3, "*"], "\uD55C \uC0AC\uB78C\uC758 \uC591\uC744 3\uBC30 \uD558\uC5EC \uCC98\uC74C \uAE38\uC774\uB97C \uAD6C\uD558\uBA74 {answer} m\uC785\uB2C8\uB2E4."), 3);
a11(1, 2, "prism-face-count", "6\uC21803-05", 2, "\uAC01\uAE30\uB465 \uBC11\uBA74\uC758 \uBCC0 \uC218\uC640 \uBA74 \uC218 \uC5F0\uACB0\uD558\uAE30", (k) => E(`${["\uC0BC", "\uC0AC", "\uC624", "\uC721"][k]}\uAC01\uAE30\uB465\uC758 \uBC11\uBA74\uC740 2\uAC1C\uC774\uACE0 \uC606\uBA74\uC740 ${3 + k}\uAC1C\uC785\uB2C8\uB2E4. \uBA74\uC740 \uBAA8\uB450 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [3 + k, 2, "+"], "\uC606\uBA74 \uC218\uC5D0 \uB450 \uBC11\uBA74\uC744 \uB354\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 4);
a11(1, 2, "pyramid-face-count", "6\uC21803-05", 2, "\uAC01\uBFD4\uC758 \uBC11\uBA74\uACFC \uC606\uBA74 \uC218 \uC5F0\uACB0\uD558\uAE30", (k) => E(`${["\uC0BC", "\uC0AC", "\uC624", "\uC721"][k]}\uAC01\uBFD4\uC758 \uBC11\uBA74\uC740 1\uAC1C\uC774\uACE0 \uC606\uBA74\uC740 ${3 + k}\uAC1C\uC785\uB2C8\uB2E4. \uBA74\uC740 \uBAA8\uB450 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [3 + k, 1, "+"], "\uC606\uBA74 \uC218\uC5D0 \uD558\uB098\uC758 \uBC11\uBA74\uC744 \uB354\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 4);
a11(1, 2, "prism-vs-pyramid", "6\uC21803-05", 1, "\uAC01\uAE30\uB465\uACFC \uAC01\uBFD4\uC758 \uBC11\uBA74 \uC218 \uAD6C\uBCC4\uD558\uAE30", () => C("\uAC01\uAE30\uB465\uACFC \uAC01\uBFD4\uC758 \uBC11\uBA74 \uC218\uB97C \uBC14\uB974\uAC8C \uC124\uBA85\uD55C \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uAC01\uAE30\uB465\uC740 2\uAC1C, \uAC01\uBFD4\uC740 1\uAC1C", [["\uB458 \uB2E4 2\uAC1C", "\uAC01\uBFD4 \uBC11\uBA74\uACFC \uC606\uBA74 \uD63C\uB3D9"], ["\uAC01\uAE30\uB465\uC740 1\uAC1C, \uAC01\uBFD4\uC740 2\uAC1C", "\uB450 \uC785\uCCB4\uC758 \uC815\uC758 \uBC18\uB300\uB85C \uC774\uD574"]], "\uAC01\uAE30\uB465\uC740 \uD569\uB3D9\uC778 \uB450 \uBC11\uBA74, \uAC01\uBFD4\uC740 \uD55C \uBC11\uBA74\uC744 \uAC00\uC9D1\uB2C8\uB2E4."), 1);
a11(1, 2, "prism-side-shape", "6\uC21803-05", 1, "\uCD08\uB4F1 \uC6B4\uC601 \uBC94\uC704\uC758 \uACE7\uC740 \uAC01\uAE30\uB465 \uC606\uBA74 \uC774\uD574\uD558\uAE30", () => C("\uBC11\uBA74\uC5D0 \uC218\uC9C1\uC73C\uB85C \uC120 \uBAA8\uC11C\uB9AC\uB97C \uAC00\uC9C4 \uC0BC\uAC01\uAE30\uB465\uC758 \uC606\uBA74 \uBAA8\uC591\uC744 \uACE0\uB974\uC138\uC694.", "\uC9C1\uC0AC\uAC01\uD615", [["\uC0BC\uAC01\uD615", "\uBC11\uBA74\uACFC \uC606\uBA74 \uD63C\uB3D9"], ["\uC6D0", "\uACE1\uBA74 \uC785\uCCB4\uC640 \uD63C\uB3D9"]], "\uACE7\uC740 \uC0BC\uAC01\uAE30\uB465\uC758 \uC606\uBA74 \uC138 \uAC1C\uB294 \uC9C1\uC0AC\uAC01\uD615\uC785\uB2C8\uB2E4."), 1);
a11(1, 2, "net-base-shape", "6\uC21803-06", 1, "\uC624\uAC01\uAE30\uB465 \uC804\uAC1C\uB3C4\uC5D0 \uD544\uC694\uD55C \uBC11\uBA74 \uBAA8\uC591 \uC774\uD574\uD558\uAE30", () => C("\uC624\uAC01\uAE30\uB465 \uC804\uAC1C\uB3C4\uC758 \uB450 \uBC11\uBA74\uC740 \uC5B4\uB5A4 \uBAA8\uC591\uC774\uC5B4\uC57C \uD569\uB2C8\uAE4C?", "\uC11C\uB85C \uD569\uB3D9\uC778 \uC624\uAC01\uD615", [["\uC11C\uB85C \uD569\uB3D9\uC778 \uC0BC\uAC01\uD615", "\uAE30\uB465 \uC774\uB984\uACFC \uBC11\uBA74 \uD63C\uB3D9"], ["\uD06C\uAE30\uAC00 \uB2E4\uB978 \uC624\uAC01\uD615", "\uB450 \uBC11\uBA74\uC758 \uD569\uB3D9 \uC870\uAC74 \uB204\uB77D"]], "\uC624\uAC01\uAE30\uB465\uC740 \uC11C\uB85C \uD569\uB3D9\uC774\uACE0 \uD3C9\uD589\uD55C \uC624\uAC01\uD615\uC778 \uBC11\uBA74\uC744 \uB450 \uAC1C \uAC00\uC9D1\uB2C8\uB2E4."), 1);
a11(1, 2, "net-side-count", "6\uC21803-06", 2, "\uC804\uAC1C\uB3C4\uC5D0\uC11C \uC606\uBA74\uC758 \uAC1C\uC218 \uD655\uC778\uD558\uAE30", (k) => E(`${["\uC0BC", "\uC0AC", "\uC624", "\uC721"][k]}\uAC01\uAE30\uB465 \uC804\uAC1C\uB3C4\uC758 \uC606\uBA74\uC740 \uBC11\uBA74\uC758 \uAC01 \uBCC0\uC5D0 \uD558\uB098\uC529 \uB300\uC751\uD569\uB2C8\uB2E4. \uC606\uBA74\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [3 + k], "\uBC11\uBA74\uC758 \uBCC0 \uC218\uB9CC\uD07C \uC606\uBA74\uC774 \uC788\uC73C\uBBC0\uB85C {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 4);
a11(1, 3, "natural-decimal-quotient", "6\uC21801-14", 2, "\uC790\uC5F0\uC218 \uB098\uB217\uC148 \uBAAB\uC744 \uC18C\uC218\uB85C \uB098\uD0C0\uB0B4\uAE30", (k) => E(`${7 + k} \xF7 4\uC758 \uBAAB\uC744 \uC18C\uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, [7 + k, 4, "/"], "\uB098\uB217\uC148\uC744 \uC18C\uC218 \uC790\uB9AC\uAE4C\uC9C0 \uACC4\uC18D\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a11(1, 3, "decimal-natural", "6\uC21801-15", 2, "\uC18C\uC218\uB97C \uC790\uC5F0\uC218\uB85C \uB098\uB204\uAE30", (k) => E(`${dec(24 + 4 * k, 10)} \xF7 4\uB97C \uACC4\uC0B0\uD558\uC138\uC694.`, [dec(24 + 4 * k, 10), 4, "/"], "\uC18C\uC218\uC810 \uC704\uCE58\uB97C \uC720\uC9C0\uD558\uBA70 4\uB85C \uB098\uB204\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a11(1, 3, "decimal-share", "6\uC21801-15", 3, "\uC18C\uC218 \uC591\uC744 \uC790\uC5F0\uC218 \uAC1C\uC218\uB85C \uB098\uB204\uAE30", (k) => E(`\uC8FC\uC2A4 ${dec(45 + 3 * k, 10)} L\uB97C 3\uBCD1\uC5D0 \uB611\uAC19\uC774 \uB098\uB215\uB2C8\uB2E4. \uD55C \uBCD1\uC5D0\uB294 \uBA87 L\uC785\uB2C8\uAE4C?`, [dec(45 + 3 * k, 10), 3, "/"], "\uC804\uCCB4 \uC8FC\uC2A4 \uC591\uC744 \uBCD1 \uC218\uB85C \uB098\uB204\uBA74 {answer} L\uC785\uB2C8\uB2E4.", "L"));
a11(1, 3, "decimal-restore", "6\uC21801-15", 4, "\uC18C\uC218 \uBAAB\uACFC \uC790\uC5F0\uC218 \uB098\uB204\uB294 \uC218\uB85C \uCC98\uC74C \uC591 \uCC3E\uAE30", (k) => E(`\uC5B4\uB5A4 \uC218\uB97C 5\uB85C \uB098\uB204\uBA74 ${dec(12 + k, 10)}\uC785\uB2C8\uB2E4. \uC5B4\uB5A4 \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [dec(12 + k, 10), 5, "*"], "\uBAAB\uC5D0 \uB098\uB204\uB294 \uC218 5\uB97C \uACF1\uD558\uBA74 \uCC98\uC74C \uC218 {answer}\uC785\uB2C8\uB2E4."));
a11(1, 3, "decimal-zero-error", "6\uC21801-15", 3, "\uC18C\uC218 \uB098\uB217\uC148\uC758 \uC18C\uC218\uC810 \uC624\uB958 \uC218\uC815\uD558\uAE30", () => C("4.8 \xF7 4\uB97C \uACC4\uC0B0\uD55C \uBC14\uB978 \uAC12\uC744 \uACE0\uB974\uC138\uC694.", "1.2", [["12", "\uC18C\uC218\uC810 \uB204\uB77D"], ["0.12", "\uC18C\uC218\uC810 \uD55C \uC790\uB9AC \uB354 \uC774\uB3D9"]], "48\uAC1C\uC758 0.1\uC744 4\uB4F1\uBD84\uD558\uBA74 12\uAC1C\uC758 0.1, \uC989 1.2\uC785\uB2C8\uB2E4."), 1);
a11(1, 3, "quotient-check", "6\uC21801-14", 3, "\uBAAB\uACFC \uB098\uB204\uB294 \uC218\uC758 \uACF1\uC73C\uB85C \uACC4\uC0B0 \uD655\uC778\uD558\uAE30", (k) => E(`${9 + k} \xF7 4\uC758 \uBAAB\uC744 \uAD6C\uD55C \uB4A4 4\uB97C \uACF1\uD558\uBA74 \uC6D0\uB798 \uC5B4\uB5A4 \uC218\uAC00 \uB429\uB2C8\uAE4C?`, [9 + k, 4, "/", 4, "*"], "\uB098\uB217\uC148\uC758 \uBAAB\uC5D0 \uB098\uB204\uB294 \uC218\uB97C \uACF1\uD558\uBA74 \uB098\uB204\uC5B4\uC9C0\uB294 \uC218 {answer}\uB85C \uB3CC\uC544\uAC11\uB2C8\uB2E4."));
a11(1, 4, "ratio-order", "6\uC21802-02", 1, "\uBE44\uAD50\uB7C9\uACFC \uAE30\uC900\uB7C9\uC758 \uC21C\uC11C \uAD6C\uBCC4\uD558\uAE30", () => C("\uD30C\uB780 \uB9AC\uBCF8 5\uAC1C, \uBE68\uAC04 \uB9AC\uBCF8 3\uAC1C\uC785\uB2C8\uB2E4. \uBE68\uAC04 \uB9AC\uBCF8 \uC218\uB97C \uAE30\uC900\uC73C\uB85C \uD55C \uD30C\uB780 \uB9AC\uBCF8 \uC218\uC758 \uBE44\uB97C \uACE0\uB974\uC138\uC694.", "5:3", [["3:5", "\uBE44\uAD50\uB7C9\uACFC \uAE30\uC900\uB7C9 \uC21C\uC11C \uBC14\uAFC8"], ["5:8", "\uAE30\uC900\uB7C9\uC744 \uC804\uCCB4\uB85C \uBC14\uAFC8"]], "\uBE44\uAD50\uB7C9 5\uB97C \uBA3C\uC800, \uAE30\uC900\uB7C9 3\uC744 \uB098\uC911\uC5D0 \uC368\uC11C 5:3\uC785\uB2C8\uB2E4."), 1);
a11(1, 4, "rate-fraction", "6\uC21802-03", 2, "\uBE44\uAD50\uB7C9\uC744 \uAE30\uC900\uB7C9\uC73C\uB85C \uB098\uB204\uC5B4 \uBE44\uC728 \uAD6C\uD558\uAE30", (k) => E(`\uC804\uCCB4 ${20 + 2 * k}\uAC1C \uC911 ${5 + k}\uAC1C\uB97C \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4. \uC804\uCCB4\uB97C \uAE30\uC900\uC73C\uB85C \uD55C \uC0AC\uC6A9\uB7C9\uC758 \uBE44\uC728\uC744 \uAE30\uC57D\uBD84\uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`, [5 + k, 20 + 2 * k, "/"], "\uC0AC\uC6A9\uB7C9\uC744 \uC804\uCCB4 \uC591\uC73C\uB85C \uB098\uB204\uBA74 \uBE44\uC728\uC740 {answer}\uC785\uB2C8\uB2E4."));
a11(1, 4, "percentage-used", "6\uC21802-03", 3, "\uBE44\uC728\uC744 \uBC31\uBD84\uC728\uB85C \uB098\uD0C0\uB0B4\uAE30", (k) => E(`\uC804\uCCB4 100\uAC1C \uC911 ${25 + k}\uAC1C\uB97C \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4. \uC0AC\uC6A9\uB7C9\uC740 \uC804\uCCB4\uC758 \uBA87 %\uC785\uB2C8\uAE4C?`, [25 + k, 100, "/", 100, "*"], "\uBE44\uAD50\uB7C9\uC744 \uAE30\uC900\uB7C9\uC73C\uB85C \uB098\uB204\uACE0 100\uC744 \uACF1\uD558\uBA74 {answer}%\uC785\uB2C8\uB2E4.", "%"));
a11(1, 4, "percent-to-part", "6\uC21802-03", 4, "\uC804\uCCB4\uC640 \uBC31\uBD84\uC728\uC5D0\uC11C \uBE44\uAD50\uB7C9 \uCC3E\uAE30", (k) => E(`\uD559\uC0DD ${20 + 4 * k}\uBA85 \uC911 25%\uAC00 \uAC78\uC5B4\uC11C \uB4F1\uAD50\uD569\uB2C8\uB2E4. \uAC78\uC5B4\uC11C \uB4F1\uAD50\uD558\uB294 \uD559\uC0DD\uC740 \uBA87 \uBA85\uC785\uB2C8\uAE4C?`, [20 + 4 * k, "0.25", "*"], "\uC804\uCCB4 \uC778\uC6D0\uC5D0 25/100\uC744 \uACF1\uD558\uBA74 {answer}\uBA85\uC785\uB2C8\uB2E4.", "\uBA85"));
a11(1, 4, "rate-not-count", "6\uC21802-03", 3, "\uD06C\uAE30\uAC00 \uB2E4\uB978 \uC9D1\uB2E8\uC758 \uBE44\uC728 \uBE44\uAD50\uD558\uAE30", () => C("A\uBC18 20\uBA85 \uC911 10\uBA85, B\uBC18 30\uBA85 \uC911 12\uBA85\uC774 \uCC38\uC5EC\uD588\uC2B5\uB2C8\uB2E4. \uCC38\uC5EC \uBE44\uC728\uC774 \uB354 \uB192\uC740 \uBC18\uC740 \uC5B4\uB514\uC785\uB2C8\uAE4C?", "A\uBC18", [["B\uBC18", "\uCC38\uC5EC \uC778\uC6D0\uB9CC \uBE44\uAD50"], ["\uB450 \uBC18\uC774 \uAC19\uB2E4", "\uBE44\uAD50\uB7C9\uACFC \uAE30\uC900\uB7C9\uC744 \uD568\uAED8 \uBCF4\uC9C0 \uC54A\uC74C"]], "A\uBC18\uC740 50%, B\uBC18\uC740 40%\uC774\uBBC0\uB85C A\uBC18\uC774 \uB192\uC2B5\uB2C8\uB2E4."), 1);
a11(1, 4, "percent-complement", "6\uC21802-03", 3, "\uC804\uCCB4 \uBC31\uBD84\uC728\uACFC \uB098\uBA38\uC9C0 \uBE44\uC728 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uC804\uCCB4 \uC791\uC5C5\uC758 ${35 + k}%\uB97C \uB05D\uB0C8\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uC791\uC5C5\uC740 \uC804\uCCB4\uC758 \uBA87 %\uC785\uB2C8\uAE4C?`, [100, 35 + k, "-"], "\uC804\uCCB4 100%\uC5D0\uC11C \uC644\uB8CC \uBE44\uC728\uC744 \uBE7C\uBA74 {answer}%\uC785\uB2C8\uB2E4.", "%"));
a11(1, 5, "band-percentage", "6\uC21804-02", 2, "\uB760\uADF8\uB798\uD504\uC5D0\uC11C \uD56D\uBAA9\uC758 \uBC31\uBD84\uC728 \uC77D\uAE30", (k) => M("\uD76C\uB9DD \uCCB4\uD5D8 \uB760\uADF8\uB798\uD504\uC5D0\uC11C \uC232 \uCCB4\uD5D8\uC758 \uBE44\uC728\uC740 \uBA87 %\uC785\uB2C8\uAE4C?", "foundation", "percentage", { task: "graph", graphType: "band", rows: [{ label: "\uC232", value: (10 + k) * (1 + k % 3) }, { label: "\uBC14\uB2E4", value: (10 + k) * (3 - k % 3) }], a: "\uC232", valueUnit: "\uBA85" }, "\uC804\uCCB4\uB97C 100%\uB85C \uB098\uD0C0\uB0B8 \uB760\uADF8\uB798\uD504\uC5D0\uC11C \uC232 \uCCB4\uD5D8\uC5D0 \uD45C\uC2DC\uB41C \uBE44\uC728\uC744 \uC77D\uC73C\uBA74 {answer}%\uC785\uB2C8\uB2E4.", "%", "data-interpretation"));
a11(1, 5, "pie-missing", "6\uC21804-02", 4, "\uC6D0\uADF8\uB798\uD504 \uC804\uCCB4\uC640 \uBD80\uBD84 \uBE44\uC728\uB85C \uBE60\uC9C4 \uBE44\uC728 \uAD6C\uD558\uAE30", (k) => E(`\uC6D0\uADF8\uB798\uD504\uC758 A\uD56D\uBAA9\uC740 ${20 + k}%, B\uD56D\uBAA9\uC740 35%\uC774\uACE0 \uB098\uBA38\uC9C0\uB294 C\uD56D\uBAA9\uC785\uB2C8\uB2E4. C\uB294 \uBA87 %\uC785\uB2C8\uAE4C?`, [100, 20 + k, "-", 35, "-"], "\uC6D0\uADF8\uB798\uD504 \uC804\uCCB4\uAC00 100%\uC774\uBBC0\uB85C \uB450 \uD56D\uBAA9\uC744 \uBE7C\uBA74 {answer}%\uC785\uB2C8\uB2E4.", "%", "data-interpretation"));
a11(1, 5, "pie-count", "6\uC21804-02", 3, "\uC804\uCCB4 \uC778\uC6D0\uACFC \uADF8\uB798\uD504 \uBE44\uC728\uB85C \uD56D\uBAA9 \uC778\uC6D0 \uAD6C\uD558\uAE30", (k) => E(`\uD76C\uB9DD \uCCB4\uD5D8 \uC6D0\uADF8\uB798\uD504\uC5D0\uC11C \uBBF8\uC220\uC740 50%\uC785\uB2C8\uB2E4. \uC804\uCCB4 \uD559\uC0DD\uC774 ${20 + 2 * k}\uBA85\uC774\uBA74 \uBBF8\uC220\uC744 \uD76C\uB9DD\uD55C \uD559\uC0DD\uC740 \uBA87 \uBA85\uC785\uB2C8\uAE4C?`, [20 + 2 * k, "0.5", "*"], "\uC804\uCCB4 \uC778\uC6D0\uC758 50%\uB294 \uC808\uBC18\uC774\uBBC0\uB85C {answer}\uBA85\uC785\uB2C8\uB2E4.", "\uBA85", "data-interpretation"));
a11(1, 5, "graph-not-angle", "6\uC21804-02", 1, "\uC6D0\uADF8\uB798\uD504\uC758 \uC804\uCCB4 \uBE44\uC728 \uC774\uD574\uD558\uAE30", () => C("\uC6D0\uADF8\uB798\uD504\uC758 \uBAA8\uB4E0 \uD56D\uBAA9 \uBE44\uC728\uC744 \uD569\uD558\uBA74 \uC5BC\uB9C8\uC785\uB2C8\uAE4C?", "100%", [["360%", "\uC6D0\uC758 \uAC01\uB3C4\uC640 \uBC31\uBD84\uC728 \uD63C\uB3D9"], ["\uD56D\uBAA9 \uC218\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C4\uB2E4", "\uC804\uCCB4 \uAE30\uC900 \uC758\uBBF8 \uB204\uB77D"]], "\uC6D0\uADF8\uB798\uD504\uB294 \uC804\uCCB4\uB97C 100%\uB85C \uD558\uC5EC \uAC01 \uBD80\uBD84\uC758 \uBE44\uC728\uC744 \uB098\uD0C0\uB0C5\uB2C8\uB2E4."), 1);
a11(1, 5, "survey-overlap", "6\uC21804-03", 3, "\uC911\uBCF5 \uC751\uB2F5 \uC790\uB8CC\uB97C \uC804\uCCB4 \uBE44\uC728\uB85C \uBC14\uB85C \uD45C\uD604\uD560 \uC218 \uC5C6\uC74C \uC774\uD574\uD558\uAE30", () => C("\uD559\uC0DD\uB9C8\uB2E4 \uC88B\uC544\uD558\uB294 \uC6B4\uB3D9\uC744 \uB450 \uAC00\uC9C0\uC529 \uACE8\uB790\uC2B5\uB2C8\uB2E4. \uC6B4\uB3D9\uBCC4 \uC751\uB2F5 \uC218\uB97C \uD559\uC0DD \uC218\uB85C \uB098\uB208 \uBE44\uC728\uC744 \uD569\uD574 \uBC14\uB85C 100% \uC6D0\uADF8\uB798\uD504\uB85C \uADF8\uB824\uB3C4 \uB429\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uC911\uBCF5 \uC751\uB2F5\uC744 \uC11C\uB85C \uACB9\uCE58\uC9C0 \uC54A\uB294 \uBD80\uBD84\uC73C\uB85C \uC624\uC778"]], "\uD55C \uD559\uC0DD\uC774 \uB450 \uBC88 \uC9D1\uACC4\uB418\uBBC0\uB85C \uAC01 \uD56D\uBAA9\uC774 \uD559\uC0DD \uC804\uCCB4\uC758 \uC11C\uB85C \uACB9\uCE58\uC9C0 \uC54A\uB294 \uBD80\uBD84\uC774 \uC544\uB2D9\uB2C8\uB2E4."), 1);
a11(1, 5, "equal-percent-different-base", "6\uC21804-03", 3, "\uAC19\uC740 \uBE44\uC728\uACFC \uC2E4\uC81C \uC778\uC6D0 \uAD6C\uBCC4\uD558\uAE30", () => C("A\uBC18\uC740 20\uBA85, B\uBC18\uC740 30\uBA85\uC774\uACE0 \uB450 \uBC18 \uBAA8\uB450 50%\uAC00 \uBBF8\uC220\uC744 \uD76C\uB9DD\uD569\uB2C8\uB2E4. \uD76C\uB9DD \uC778\uC6D0\uB3C4 \uAC19\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uBE44\uC728\uC774 \uAC19\uC73C\uBA74 \uC778\uC6D0\uB3C4 \uAC19\uB2E4\uB294 \uC624\uAC1C\uB150"]], "\uD76C\uB9DD \uC778\uC6D0\uC740 \uAC01\uAC01 10\uBA85, 15\uBA85\uC73C\uB85C \uC804\uCCB4 \uD06C\uAE30\uAC00 \uB2E4\uB974\uBA74 \uAC19\uC740 \uBE44\uC728\uC758 \uC2E4\uC81C \uC591\uB3C4 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."), 1);
a11(1, 6, "cuboid-volume", "6\uC21803-19", 3, "\uC9C1\uC721\uBA74\uCCB4 \uC138 \uAE38\uC774\uB97C \uACF1\uD558\uC5EC \uBD80\uD53C \uAD6C\uD558\uAE30", (k) => E(`\uAC00\uB85C ${3 + k} cm, \uC138\uB85C 4 cm, \uB192\uC774 5 cm\uC778 \uC9C1\uC721\uBA74\uCCB4\uC758 \uBD80\uD53C\uB294 \uBA87 cm\xB3\uC785\uB2C8\uAE4C?`, [3 + k, 4, "*", 5, "*"], "\uD55C \uCE35\uC758 \uB113\uC774\uC5D0 \uB192\uC774\uB97C \uACF1\uD558\uBA74 {answer} cm\xB3\uC785\uB2C8\uB2E4.", "cm\xB3"));
a11(1, 6, "volume-inverse-height", "6\uC21803-19", 4, "\uBD80\uD53C\uC640 \uBC11\uBA74 \uB113\uC774\uB85C \uB192\uC774 \uAD6C\uD558\uAE30", (k) => E(`\uC9C1\uC721\uBA74\uCCB4\uC758 \uBD80\uD53C\uB294 ${12 * (3 + k)} cm\xB3, \uBC11\uBA74 \uB113\uC774\uB294 12 cm\xB2\uC785\uB2C8\uB2E4. \uB192\uC774\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?`, [12 * (3 + k), 12, "/"], "\uBD80\uD53C\uB97C \uBC11\uBA74 \uB113\uC774\uB85C \uB098\uB204\uBA74 \uB192\uC774 {answer} cm\uC785\uB2C8\uB2E4.", "cm"));
a11(1, 6, "cuboid-surface", "6\uC21803-17", 3, "\uC9C1\uC721\uBA74\uCCB4\uC758 \uC138 \uC30D\uC758 \uBA74 \uB113\uC774 \uB354\uD558\uAE30", (k) => E(`\uAC00\uB85C ${3 + k} cm, \uC138\uB85C 4 cm, \uB192\uC774 5 cm\uC778 \uC9C1\uC721\uBA74\uCCB4\uC758 \uAC89\uB113\uC774\uB294 \uBA87 cm\xB2\uC785\uB2C8\uAE4C?`, [3 + k, 4, "*", 3 + k, 5, "*", "+", 4, 5, "*", "+", 2, "*"], "\uB9C8\uC8FC \uBCF4\uB294 \uC138 \uC30D\uC758 \uBA74 \uB113\uC774\uB97C \uB354\uD558\uBA74 {answer} cm\xB2\uC785\uB2C8\uB2E4.", "cm\xB2"));
a11(1, 6, "cube-surface", "6\uC21803-17", 2, "\uC815\uC721\uBA74\uCCB4\uC758 \uC5EC\uC12F \uAC19\uC740 \uBA74 \uB113\uC774 \uAD6C\uD558\uAE30", (k) => E(`\uD55C \uBAA8\uC11C\uB9AC \uAE38\uC774\uAC00 ${2 + k} cm\uC778 \uC815\uC721\uBA74\uCCB4\uC758 \uAC89\uB113\uC774\uB294 \uBA87 cm\xB2\uC785\uB2C8\uAE4C?`, [2 + k, 2 + k, "*", 6, "*"], "\uD55C \uBA74\uC758 \uB113\uC774\uC5D0 6\uC744 \uACF1\uD558\uBA74 {answer} cm\xB2\uC785\uB2C8\uB2E4.", "cm\xB2"));
a11(1, 6, "volume-unit", "6\uC21803-18", 2, "\uC138 \uBC29\uD5A5\uC758 \uAE38\uC774 \uBC30\uC728\uB85C \uBD80\uD53C \uB2E8\uC704 \uD658\uC0B0\uD558\uAE30", (k) => E(`${1 + k} m\xB3\uB294 \uBA87 cm\xB3\uC785\uB2C8\uAE4C?`, [1 + k, 1e6, "*"], "1 m\xB3\uB294 100 cm \xD7 100 cm \xD7 100 cm = 1000000 cm\xB3\uC785\uB2C8\uB2E4. \uB2F5\uC740 {answer} cm\xB3\uC785\uB2C8\uB2E4.", "cm\xB3"));
a11(1, 6, "surface-vs-volume-unit", "6\uC21803-18", 1, "\uAC89\uB113\uC774\uC640 \uBD80\uD53C\uC758 \uB2E8\uC704 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC9C1\uC721\uBA74\uCCB4\uC758 \uAC89\uB113\uC774\uC640 \uBD80\uD53C \uB2E8\uC704\uB97C \uBC14\uB974\uAC8C \uC9DD\uC9C0\uC740 \uAC83\uC744 \uACE0\uB974\uC138\uC694.", "\uAC89\uB113\uC774 cm\xB2, \uBD80\uD53C cm\xB3", [["\uAC89\uB113\uC774 cm\xB3, \uBD80\uD53C cm\xB2", "\uB113\uC774\uC640 \uBD80\uD53C \uCC28\uC6D0 \uBC14\uAFC8"], ["\uB458 \uB2E4 cm", "\uAE38\uC774 \uB2E8\uC704\uC640 \uD63C\uB3D9"]], "\uAC89\uB113\uC774\uB294 \uBA74\uC758 \uB113\uC774\uC774\uACE0 \uBD80\uD53C\uB294 \uACF5\uAC04\uC758 \uD06C\uAE30\uC774\uBBC0\uB85C \uAC01\uAC01 \uC81C\uACF1\xB7\uC138\uC81C\uACF1 \uB2E8\uC704\uB97C \uC501\uB2C8\uB2E4."), 1);
a11(2, 1, "fraction-fraction", "6\uC21801-11", 2, "\uBD84\uC218\uB85C \uB098\uB204\uB294 \uACC4\uC0B0 \uC801\uC6A9\uD558\uAE30", (k) => E(`${f(3 + k % 4, 8)} \xF7 1/4\uC744 \uACC4\uC0B0\uD558\uC138\uC694.`, [f(3 + k % 4, 8), "1/4", "/"], "\uB098\uB204\uB294 \uBD84\uC218\uC758 \uC5ED\uC218\uB97C \uACF1\uD558\uC5EC \uACC4\uC0B0\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"), 4);
a11(2, 1, "fraction-piece-count", "6\uC21801-11", 3, "\uBD84\uC218 \uAE38\uC774\uC5D0 \uB4E4\uC5B4\uAC00\uB294 \uAC19\uC740 \uC870\uAC01 \uC218 \uAD6C\uD558\uAE30", (k) => E(`\uB9AC\uBCF8 ${f(3 + k, 4)} m\uB97C 1/4 m\uC529 \uC790\uB985\uB2C8\uB2E4. \uB0A8\uB294 \uAE38\uC774\uAC00 \uC5C6\uC744 \uB54C \uC870\uAC01\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [f(3 + k, 4), "1/4", "/"], "\uC804\uCCB4 \uAE38\uC774\uC5D0 \uD55C \uC870\uAC01\uC758 \uAE38\uC774\uAC00 \uBA87 \uBC88 \uB4E4\uC5B4\uAC00\uB294\uC9C0 \uAD6C\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a11(2, 1, "fraction-inverse-divisor", "6\uC21801-11", 4, "\uB098\uB204\uB294 \uBD84\uC218\uC640 \uBAAB\uC5D0\uC11C \uB098\uB204\uC5B4\uC9C0\uB294 \uC218 \uBCF5\uC6D0\uD558\uAE30", (k) => E(`\u25A1 \xF7 2/5 = ${3 + k}\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [3 + k, "2/5", "*"], "\uBAAB\uC5D0 \uB098\uB204\uB294 \uC218\uB97C \uACF1\uD558\uC5EC \uC6D0\uB798 \uC218\uB97C \uBCF5\uC6D0\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4."));
a11(2, 1, "fraction-divisor-missing", "6\uC21801-11", 4, "\uB098\uB204\uC5B4\uC9C0\uB294 \uBD84\uC218\uC640 \uBAAB\uC5D0\uC11C \uB098\uB204\uB294 \uC218 \uCC3E\uAE30", () => E("3/4 \xF7 \u25A1 = 3\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uBD84\uC218\uB97C \uAD6C\uD558\uC138\uC694.", ["3/4", 3, "/"], "\uB098\uB204\uC5B4\uC9C0\uB294 \uC218\uB97C \uBAAB\uC73C\uB85C \uB098\uB204\uBA74 \uB098\uB204\uB294 \uC218 {answer}\uC785\uB2C8\uB2E4."), 1);
a11(2, 1, "division-size", "6\uC21801-11", 1, "1\uBCF4\uB2E4 \uC791\uC740 \uBD84\uC218\uB85C \uB098\uB204\uBA74 \uBAAB\uC774 \uCEE4\uC9C8 \uC218 \uC788\uC74C \uC774\uD574\uD558\uAE30", () => C("2 \xF7 1/2\uC758 \uACB0\uACFC\uB97C \uACE0\uB974\uC138\uC694.", "4", [["1", "\uB098\uB217\uC148\uC744 \uACF1\uC148\uC73C\uB85C \uBC14\uAFC8"], ["2", "\uB098\uB204\uB294 \uC218\uC758 \uC601\uD5A5 \uBB34\uC2DC"]], "2 \uC548\uC5D0 1/2\uC774 \uB124 \uBC88 \uB4E4\uC5B4\uAC00\uBBC0\uB85C \uBAAB\uC740 4\uC785\uB2C8\uB2E4."), 1);
a11(2, 1, "inverse-wrong-side", "6\uC21801-11", 3, "\uBD84\uC218 \uB098\uB217\uC148\uC5D0\uC11C \uC5ED\uC218\uB97C \uCDE8\uD560 \uC218 \uAD6C\uBCC4\uD558\uAE30", () => C("2/3 \xF7 4/5\uC5D0\uC11C \uACF1\uC148\uC73C\uB85C \uBC14\uAFBC \uC62C\uBC14\uB978 \uC2DD\uC744 \uACE0\uB974\uC138\uC694.", "2/3 \xD7 5/4", [["3/2 \xD7 4/5", "\uB098\uB204\uC5B4\uC9C0\uB294 \uC218\uC758 \uC5ED\uC218\uB97C \uC0AC\uC6A9"], ["3/2 \xD7 5/4", "\uB458 \uB2E4 \uC5ED\uC218\uB85C \uBC14\uAFC8"]], "\uB098\uB204\uB294 \uC218 4/5\uC758 \uC5ED\uC218\uB9CC \uACF1\uD569\uB2C8\uB2E4."), 1);
a11(2, 2, "decimal-decimal", "6\uC21801-15", 2, "\uC18C\uC218\uB85C \uB098\uB204\uB294 \uACC4\uC0B0 \uC801\uC6A9\uD558\uAE30", (k) => E(`${dec(15 + 5 * k, 10)} \xF7 0.5\uB97C \uACC4\uC0B0\uD558\uC138\uC694.`, [dec(15 + 5 * k, 10), "0.5", "/"], "\uB450 \uC218\uB97C \uAC19\uC740 \uBC30\uC218\uB85C \uBC14\uAFB8\uC5B4 \uB098\uB204\uB294 \uC218\uB97C \uC790\uC5F0\uC218\uB85C \uB9CC\uB4E4\uBA74 {answer}\uC785\uB2C8\uB2E4.", "", "calculation"));
a11(2, 2, "decimal-bottle-count", "6\uC21801-15", 3, "\uC18C\uC218 \uC6A9\uB7C9\uC73C\uB85C \uC804\uCCB4\uB97C \uB098\uB208 \uBB36\uC74C \uC218 \uAD6C\uD558\uAE30", (k) => E(`\uBB3C ${dec(15 + 5 * k, 10)} L\uB97C 0.5 L\uC529 \uBCD1\uC5D0 \uB2F4\uC2B5\uB2C8\uB2E4. \uB0A8\uB294 \uBB3C\uC774 \uC5C6\uC744 \uB54C \uBCD1\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [dec(15 + 5 * k, 10), "0.5", "/"], "\uC804\uCCB4 \uBB3C\uC758 \uC591\uC744 \uD55C \uBCD1\uC758 \uC591\uC73C\uB85C \uB098\uB204\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a11(2, 2, "decimal-inverse", "6\uC21801-15", 4, "\uC18C\uC218 \uB098\uB217\uC148\uC758 \uBAAB\uC5D0\uC11C \uC6D0\uB798 \uC218 \uCC3E\uAE30", (k) => E(`\u25A1 \xF7 0.25 = ${4 + k}\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [4 + k, "0.25", "*"], "\uBAAB\uC5D0 \uB098\uB204\uB294 \uC218\uB97C \uACF1\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4."));
a11(2, 2, "decimal-both-scale", "6\uC21801-15", 1, "\uBAAB\uC744 \uC720\uC9C0\uD558\uB294 \uAC19\uC740 \uBC30\uC728 \uBCC0\uD658 \uC774\uD574\uD558\uAE30", () => C("3.6 \xF7 0.4\uC640 \uBAAB\uC774 \uAC19\uC740 \uC2DD\uC744 \uACE0\uB974\uC138\uC694.", "36 \xF7 4", [["36 \xF7 0.4", "\uB098\uB204\uC5B4\uC9C0\uB294 \uC218\uB9CC \uBC30\uC728 \uBCC0\uACBD"], ["3.6 \xF7 4", "\uB098\uB204\uB294 \uC218\uB9CC \uBC30\uC728 \uBCC0\uACBD"]], "\uB098\uB204\uC5B4\uC9C0\uB294 \uC218\uC640 \uB098\uB204\uB294 \uC218\uB97C \uBAA8\uB450 10\uBC30 \uD558\uBA74 \uBAAB\uC740 \uAC19\uC2B5\uB2C8\uB2E4."), 1);
a11(2, 2, "decimal-divisor-missing", "6\uC21801-15", 4, "\uC18C\uC218 \uD53C\uC81C\uC218\uC640 \uBAAB\uC73C\uB85C \uC81C\uC218 \uCC3E\uAE30", (k) => E(`${dec(30 + 6 * k, 10)} \xF7 \u25A1 = 6\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [dec(30 + 6 * k, 10), 6, "/"], "\uB098\uB204\uC5B4\uC9C0\uB294 \uC218\uB97C \uBAAB\uC73C\uB85C \uB098\uB204\uBA74 \uB098\uB204\uB294 \uC218 {answer}\uC785\uB2C8\uB2E4."));
a11(2, 2, "decimal-subunit-size", "6\uC21801-15", 3, "\uC18C\uC218\uB85C \uB098\uB208 \uBAAB\uC758 \uD06C\uAE30\uB85C \uC624\uB958 \uD310\uB2E8\uD558\uAE30", () => C("6 \xF7 0.2\uB97C 1.2\uB77C\uACE0 \uC37C\uC2B5\uB2C8\uB2E4. \uBC14\uB978 \uBAAB\uC744 \uACE0\uB974\uC138\uC694.", "30", [["1.2", "\uB098\uB217\uC148\uC744 \uACF1\uC148\uC73C\uB85C \uD63C\uB3D9"], ["3", "\uC18C\uC218 \uBC30\uC728 \uD558\uB098 \uB204\uB77D"]], "6 \uC548\uC5D0 0.2\uAC00 30\uBC88 \uB4E4\uC5B4\uAC00\uBBC0\uB85C \uBAAB\uC740 30\uC785\uB2C8\uB2E4."), 1);
a11(2, 3, "stack-sum", "6\uC21803-09", 2, "\uBC14\uB2E5 \uC790\uB9AC\uBCC4 \uB192\uC774\uB85C \uC804\uCCB4 \uC313\uAE30\uB098\uBB34 \uC218 \uAD6C\uD558\uAE30", (k) => E(`\uC313\uAE30\uB098\uBB34\uB294 \uC11C\uB85C \uB2E4\uB978 \uBC14\uB2E5 3\uC790\uB9AC\uC5D0 \uAC01\uAC01 ${1 + k % 3}\uAC1C, 3\uAC1C, 2\uAC1C\uC529 \uBC14\uB2E5\uBD80\uD130 \uBE48 \uCE35 \uC5C6\uC774 \uC313\uC600\uC2B5\uB2C8\uB2E4. \uBAA8\uB450 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [1 + k % 3, 3, "+", 2, "+"], "\uC11C\uB85C \uB2E4\uB978 \uC790\uB9AC\uC758 \uBE14\uB85D \uC218\uB97C \uB354\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 3);
a11(2, 3, "top-hide", "6\uC21803-10", 2, "\uC704\uC5D0\uC11C \uBCF8 \uC790\uB9AC \uC218\uC640 \uC804\uCCB4 \uBE14\uB85D \uC218 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC313\uAE30\uB098\uBB34\uB294 \uC11C\uB85C \uB2E4\uB978 \uBC14\uB2E5 3\uC790\uB9AC\uC5D0 \uB192\uC774 1\uAC1C, 3\uAC1C, 2\uAC1C\uB85C \uC313\uC600\uC2B5\uB2C8\uB2E4. \uC704\uC5D0\uC11C \uBCF4\uBA74 \uBC14\uB2E5 \uC790\uB9AC\uB294 \uBA87 \uAC1C\uB85C \uBCF4\uC785\uB2C8\uAE4C?", "3", [["6", "\uC804\uCCB4 \uBE14\uB85D \uC218\uC640 \uC704\uC5D0\uC11C \uBCF8 \uC790\uB9AC \uC218 \uD63C\uB3D9"], ["2", "\uCD5C\uB300 \uB192\uC774\uC640 \uD63C\uB3D9"]], "\uC704\uC5D0\uC11C\uB294 \uAC19\uC740 \uBC14\uB2E5 \uC790\uB9AC\uC758 \uBE14\uB85D\uC774 \uACB9\uCCD0 \uBCF4\uC774\uBBC0\uB85C \uC138 \uC790\uB9AC\uAC00 \uBCF4\uC785\uB2C8\uB2E4."), 1);
a11(2, 3, "max-height", "6\uC21803-09", 2, "\uC5EC\uB7EC \uC5F4\uC758 \uCD5C\uB300 \uB192\uC774 \uD310\uB2E8\uD558\uAE30", (k) => E(`\uC313\uAE30\uB098\uBB34\uB97C \uC11C\uB85C \uB2E4\uB978 \uBC14\uB2E5 \uC790\uB9AC\uC5D0 ${1 + k}\uAC1C, ${3 + k}\uAC1C, ${2 + k}\uAC1C\uC529 \uC313\uC558\uC2B5\uB2C8\uB2E4. \uAC00\uC7A5 \uB192\uC740 \uC5F4\uC740 \uBA87 \uAC1C \uB192\uC774\uC785\uB2C8\uAE4C?`, [1 + k, 3 + k, "max", 2 + k, "max"], "\uC138 \uC5F4\uC758 \uB192\uC774\uB97C \uBE44\uAD50\uD558\uBA74 \uAC00\uC7A5 \uB192\uC740 \uB192\uC774\uB294 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 3);
a11(2, 3, "hidden-ambiguity", "6\uC21803-10", 3, "\uD558\uB098\uC758 \uD22C\uC601\uB3C4\uB9CC\uC73C\uB85C \uC804\uCCB4 \uC218\uB97C \uD655\uC815\uD560 \uC218 \uC5C6\uC74C \uC774\uD574\uD558\uAE30", () => C("\uC704\uC5D0\uC11C \uBCF8 \uBAA8\uC591\uC5D0 \uBC14\uB2E5 \uC790\uB9AC 4\uAC1C\uAC00 \uBCF4\uC785\uB2C8\uB2E4. \uB192\uC774 \uC815\uBCF4\uAC00 \uC5C6\uC744 \uB54C \uC804\uCCB4 \uC313\uAE30\uB098\uBB34 \uC218\uB97C \uBC18\uB4DC\uC2DC 4\uAC1C\uB77C\uACE0 \uD560 \uC218 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uC704\uC5D0\uC11C \uBCF4\uC774\uC9C0 \uC54A\uB294 \uC704\uCE35 \uBE14\uB85D \uBB34\uC2DC"]], "\uAC01 \uC790\uB9AC\uC5D0 \uC5EC\uB7EC \uCE35\uC774 \uC788\uC744 \uC218 \uC788\uC73C\uBBC0\uB85C \uC704\uC5D0\uC11C \uBCF8 \uBAA8\uC591\uB9CC\uC73C\uB85C \uC804\uCCB4 \uC218\uB97C \uD655\uC815\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."), 1);
a11(2, 3, "stack-inverse", "6\uC21803-09", 4, "\uC804\uCCB4 \uBE14\uB85D \uC218\uC640 \uC54C\uB824\uC9C4 \uC5F4\uB85C \uB098\uBA38\uC9C0 \uB192\uC774 \uAD6C\uD558\uAE30", (k) => E(`\uC11C\uB85C \uB2E4\uB978 \uBC14\uB2E5 3\uC790\uB9AC\uC5D0 \uBE48 \uCE35 \uC5C6\uC774 \uC313\uC778 \uBE14\uB85D\uC774 \uBAA8\uB450 ${8 + k}\uAC1C\uC785\uB2C8\uB2E4. \uB450 \uC790\uB9AC\uC5D0\uB294 \uAC01\uAC01 2\uAC1C\uC640 3\uAC1C\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uC790\uB9AC\uC758 \uBE14\uB85D\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [8 + k, 2, "-", 3, "-"], "\uC804\uCCB4\uC5D0\uC11C \uC54C\uB824\uC9C4 \uB450 \uC790\uB9AC\uC758 \uBE14\uB85D\uC744 \uBE7C\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"), 4);
a11(2, 3, "add-layer", "6\uC21803-09", 3, "\uAC01 \uBC14\uB2E5 \uC790\uB9AC\uC5D0 \uD55C \uCE35 \uB354 \uC313\uC740 \uC99D\uAC00\uB7C9 \uAD6C\uD558\uAE30", (k) => E(`\uC11C\uB85C \uB2E4\uB978 \uBC14\uB2E5 ${3 + k}\uC790\uB9AC\uB9C8\uB2E4 \uBE14\uB85D\uC744 \uD55C \uAC1C\uC529 \uB354 \uC313\uC558\uC2B5\uB2C8\uB2E4. \uC804\uCCB4 \uBE14\uB85D\uC740 \uBA87 \uAC1C \uB298\uC5B4\uB0A9\uB2C8\uAE4C?`, [3 + k], "\uBC14\uB2E5 \uC790\uB9AC\uB9C8\uB2E4 \uD55C \uAC1C\uC529 \uB354\uD558\uBBC0\uB85C {answer}\uAC1C \uB298\uC5B4\uB0A9\uB2C8\uB2E4.", "\uAC1C"));
a11(2, 4, "proportion-equivalent", "6\uC21802-04", 2, "\uAC19\uC740 \uBE44\uC728\uC758 \uBE44\uB840\uC2DD\uC5D0\uC11C \uBE48\uCE78 \uCC3E\uAE30", (k) => E(`2:3 = ${2 * (2 + k)}:\u25A1\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB97C \uAD6C\uD558\uC138\uC694.`, [2 + k, 3, "*"], "\uC55E\uD56D\uC774 \uAC19\uC740 \uBC30\uC218\uB85C \uB298\uC5C8\uC73C\uBBC0\uB85C \uB4A4\uD56D\uB3C4 \uAC19\uC740 \uBC30\uC218\uB85C \uB298\uB9AC\uBA74 {answer}\uC785\uB2C8\uB2E4."));
a11(2, 4, "proportion-scale", "6\uC21802-04", 3, "\uAC19\uC740 \uAC00\uACA9 \uAD00\uACC4\uB85C \uD544\uC694\uD55C \uC804\uCCB4 \uAC00\uACA9 \uAD6C\uD558\uAE30", (k) => E(`\uAC19\uC740 \uACF5\uCC45 3\uAD8C\uC758 \uAC00\uACA9\uC774 6000\uC6D0\uC785\uB2C8\uB2E4. \uAC19\uC740 \uACF5\uCC45 ${4 + k}\uAD8C\uC758 \uAC00\uACA9\uC740 \uBA87 \uC6D0\uC785\uB2C8\uAE4C?`, [6e3, 3, "/", 4 + k, "*"], "\uD55C \uAD8C \uAC00\uACA9\uC744 \uAD6C\uD55C \uB4A4 \uAD8C\uC218\uB97C \uACF1\uD558\uBA74 {answer}\uC6D0\uC785\uB2C8\uB2E4.", "\uC6D0"));
a11(2, 4, "allocation-first", "6\uC21802-05", 3, "\uC804\uCCB4\uB97C \uBE44\uC5D0 \uB530\uB77C \uBC30\uBD84\uD558\uAE30", (k) => E(`\uAD6C\uC2AC ${5 * (6 + k)}\uAC1C\uB97C A\uC640 B\uC5D0\uAC8C 2:3\uC73C\uB85C \uB098\uB215\uB2C8\uB2E4. A\uB294 \uBA87 \uAC1C \uBC1B\uC2B5\uB2C8\uAE4C?`, [5 * (6 + k), 5, "/", 2, "*"], "\uBE44\uC758 \uD569 5\uB85C \uC804\uCCB4\uB97C \uB098\uB204\uACE0 A\uC758 \uBE44 2\uB97C \uACF1\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a11(2, 4, "allocation-second", "6\uC21802-05", 3, "\uBC30\uBD84\uC5D0\uC11C \uAE30\uC900 \uB300\uC0C1\uC758 \uC21C\uC11C \uC801\uC6A9\uD558\uAE30", (k) => E(`\uC0C9\uC885\uC774 ${7 * (4 + k)}\uC7A5\uC744 \uBBFC\uC218\uC640 \uC9C0\uC6B0\uC5D0\uAC8C 3:4\uB85C \uB098\uB215\uB2C8\uB2E4. \uC9C0\uC6B0\uB294 \uBA87 \uC7A5 \uBC1B\uC2B5\uB2C8\uAE4C?`, [7 * (4 + k), 7, "/", 4, "*"], "\uB450 \uBC88\uC9F8 \uB300\uC0C1 \uC9C0\uC6B0\uC758 \uBE44 4\uB97C \uC804\uCCB4 \uBE44 7\uACFC \uC5F0\uACB0\uD558\uBA74 {answer}\uC7A5\uC785\uB2C8\uB2E4.", "\uC7A5"));
a11(2, 4, "allocation-inverse-total", "6\uC21802-05", 4, "\uD55C \uBC30\uBD84\uB7C9\uC5D0\uC11C \uC804\uCCB4 \uC218\uB7C9 \uBCF5\uC6D0\uD558\uAE30", (k) => E(`A\uC640 B\uAC00 2:3\uC73C\uB85C \uAD6C\uC2AC\uC744 \uB098\uB234\uC2B5\uB2C8\uB2E4. A\uAC00 ${2 * (4 + k)}\uAC1C \uBC1B\uC558\uB2E4\uBA74 \uC804\uCCB4 \uAD6C\uC2AC\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`, [2 * (4 + k), 2, "/", 5, "*"], "A\uC758 \uC591\uC73C\uB85C \uBE44 1\uC5D0 \uD574\uB2F9\uD558\uB294 \uC591\uC744 \uAD6C\uD55C \uB4A4 \uBE44\uC758 \uD569 5\uB97C \uACF1\uD558\uBA74 {answer}\uAC1C\uC785\uB2C8\uB2E4.", "\uAC1C"));
a11(2, 4, "ratio-cross-check", "6\uC21802-04", 3, "\uBE44\uB840\uC2DD \uC131\uB9BD\uC744 \uBE44\uC728\uB85C \uD655\uC778\uD558\uAE30", () => C("2:3\uACFC 4:9\uAC00 \uAC19\uC740 \uBE44\uC728\uC785\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uC55E\uD56D\uACFC \uB4A4\uD56D\uC758 \uBC30\uC728 \uBD88\uC77C\uCE58 \uBB34\uC2DC"]], "2\uC5D0\uC11C 4\uB294 2\uBC30\uC774\uC9C0\uB9CC 3\uC5D0\uC11C 9\uB294 3\uBC30\uC774\uBBC0\uB85C \uAC19\uC740 \uBE44\uC728\uC774 \uC544\uB2D9\uB2C8\uB2E4."), 1);
a11(2, 5, "circle-diameter-circ", "6\uC21803-16", 2, "\uC9C0\uB984\uACFC \uC6D0\uC8FC\uC728\uB85C \uC6D0\uC8FC \uAD6C\uD558\uAE30", (k) => E(`\uC9C0\uB984\uC774 ${4 + k} cm\uC778 \uC6D0\uC758 \uC6D0\uC8FC\uB294 \uBA87 cm\uC785\uB2C8\uAE4C? \uC6D0\uC8FC\uC728\uC740 3.14\uB85C \uACC4\uC0B0\uD558\uC138\uC694.`, [4 + k, "3.14", "*"], "\uC9C0\uB984\uC5D0 \uC6D0\uC8FC\uC728\uC744 \uACF1\uD558\uBA74 {answer} cm\uC785\uB2C8\uB2E4.", "cm"));
a11(2, 5, "circle-radius-area", "6\uC21803-16", 2, "\uBC18\uC9C0\uB984\uC73C\uB85C \uC6D0\uC758 \uB113\uC774 \uAD6C\uD558\uAE30", (k) => E(`\uBC18\uC9C0\uB984\uC774 ${2 + k} cm\uC778 \uC6D0\uC758 \uB113\uC774\uB294 \uBA87 cm\xB2\uC785\uB2C8\uAE4C? \uC6D0\uC8FC\uC728\uC740 3.14\uB85C \uACC4\uC0B0\uD558\uC138\uC694.`, [2 + k, 2 + k, "*", "3.14", "*"], "\uBC18\uC9C0\uB984 \xD7 \uBC18\uC9C0\uB984 \xD7 \uC6D0\uC8FC\uC728\uB85C \uACC4\uC0B0\uD558\uBA74 {answer} cm\xB2\uC785\uB2C8\uB2E4.", "cm\xB2"));
a11(2, 5, "circle-radius-circ", "6\uC21803-16", 3, "\uBC18\uC9C0\uB984\uC5D0\uC11C \uC9C0\uB984\uC744 \uAD6C\uD558\uACE0 \uC6D0\uC8FC \uACC4\uC0B0\uD558\uAE30", (k) => E(`\uBC18\uC9C0\uB984\uC774 ${3 + k} cm\uC778 \uC6D0\uC758 \uC6D0\uC8FC\uB294 \uBA87 cm\uC785\uB2C8\uAE4C? \uC6D0\uC8FC\uC728\uC740 3.14\uB85C \uACC4\uC0B0\uD558\uC138\uC694.`, [3 + k, 2, "*", "3.14", "*"], "\uBC18\uC9C0\uB984\uC758 2\uBC30\uC778 \uC9C0\uB984\uC5D0 \uC6D0\uC8FC\uC728\uC744 \uACF1\uD558\uBA74 {answer} cm\uC785\uB2C8\uB2E4.", "cm"));
a11(2, 5, "circle-measure-pi", "6\uC21803-15", 3, "\uCE21\uC815\uD55C \uC6D0\uC8FC\uC640 \uC9C0\uB984\uC758 \uBE44 \uD655\uC778\uD558\uAE30", (k) => E(`\uCE21\uC815\uD55C \uC6D0\uC8FC\uB294 ${dec(314 * (2 + k), 100)} cm, \uC9C0\uB984\uC740 ${2 + k} cm\uC785\uB2C8\uB2E4. \uC774 \uCE21\uC815 \uC790\uB8CC\uC758 \uC6D0\uC8FC \xF7 \uC9C0\uB984 \uAC12\uC744 \uAD6C\uD558\uC138\uC694.`, [dec(314 * (2 + k), 100), 2 + k, "/"], "\uC6D0\uC8FC\uB97C \uC9C0\uB984\uC73C\uB85C \uB098\uB204\uC5B4 \uC6D0\uC8FC\uC728\uC758 \uADFC\uC0BF\uAC12\uC744 \uD655\uC778\uD558\uBA74 {answer}\uC785\uB2C8\uB2E4."));
a11(2, 5, "circle-unit-error", "6\uC21803-16", 1, "\uC6D0\uC8FC\uC640 \uC6D0\uC758 \uB113\uC774\uC758 \uB2E8\uC704 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC6D0\uC758 \uB113\uC774\uB97C \uAD6C\uD55C \uACB0\uACFC\uC758 \uB2E8\uC704\uB85C \uC54C\uB9DE\uC740 \uAC83\uC744 \uACE0\uB974\uC138\uC694. \uAE38\uC774\uB294 cm\uB85C \uC8FC\uC5B4\uC84C\uC2B5\uB2C8\uB2E4.", "cm\xB2", [["cm", "\uC6D0\uC8FC \uB2E8\uC704\uC640 \uD63C\uB3D9"], ["cm\xB3", "\uBD80\uD53C \uB2E8\uC704\uC640 \uD63C\uB3D9"]], "\uC6D0\uC758 \uB113\uC774\uB294 \uD3C9\uBA74\uC758 \uD06C\uAE30\uC774\uBBC0\uB85C cm\xB2\uB97C \uC0AC\uC6A9\uD569\uB2C8\uB2E4."), 1);
a11(2, 5, "circle-area-scale", "6\uC21803-16", 4, "\uBC18\uC9C0\uB984 \uBC30\uC728\uC774 \uB113\uC774\uC5D0 \uBBF8\uCE58\uB294 \uC601\uD5A5 \uC124\uBA85\uD558\uAE30", () => C("\uBC18\uC9C0\uB984\uC744 2\uBC30\uB85C \uB298\uB9B0 \uC6D0\uC758 \uB113\uC774\uB294 \uC6D0\uB798 \uB113\uC774\uC758 \uBA87 \uBC30\uC785\uB2C8\uAE4C?", "4", [["2", "\uAE38\uC774\uC640 \uB113\uC774 \uBC30\uC728 \uD63C\uB3D9"], ["8", "\uB113\uC774\uC640 \uBD80\uD53C \uBC30\uC728 \uD63C\uB3D9"]], "\uB113\uC774 \uC2DD\uC758 \uB450 \uBC18\uC9C0\uB984\uC774 \uAC01\uAC01 2\uBC30\uAC00 \uB418\uBBC0\uB85C \uB113\uC774\uB294 2 \xD7 2 = 4\uBC30\uC785\uB2C8\uB2E4."), 1);
a11(2, 6, "cylinder-base-two", "6\uC21803-07", 1, "\uC6D0\uAE30\uB465\uC758 \uB450 \uBC11\uBA74 \uC131\uC9C8 \uC774\uD574\uD558\uAE30", () => C("\uC6D0\uAE30\uB465\uC758 \uB450 \uBC11\uBA74 \uAD00\uACC4\uB97C \uACE0\uB974\uC138\uC694.", "\uD06C\uAE30\uAC00 \uAC19\uC740 \uC6D0\uC774\uBA70 \uC11C\uB85C \uD3C9\uD589\uD558\uB2E4", [["\uD06C\uAE30\uAC00 \uB2E4\uB978 \uC6D0\uC774\uB2E4", "\uBC11\uBA74 \uD569\uB3D9 \uC870\uAC74 \uB204\uB77D"], ["\uC0BC\uAC01\uD615 \uB450 \uAC1C\uC774\uB2E4", "\uAC01\uAE30\uB465\uACFC \uD63C\uB3D9"]], "\uC6D0\uAE30\uB465\uC758 \uB450 \uBC11\uBA74\uC740 \uAC19\uC740 \uD06C\uAE30\uC758 \uC6D0\uC774\uACE0 \uC11C\uB85C \uD3C9\uD589\uD569\uB2C8\uB2E4."), 1);
a11(2, 6, "cone-base-one", "6\uC21803-07", 1, "\uC6D0\uBFD4\uACFC \uC6D0\uAE30\uB465\uC758 \uBC11\uBA74 \uC218 \uAD6C\uBCC4\uD558\uAE30", () => C("\uC6D0\uBFD4\uC758 \uC6D0\uC778 \uBC11\uBA74\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?", "1", [["2", "\uC6D0\uAE30\uB465\uACFC \uD63C\uB3D9"], ["0", "\uAD6C\uC640 \uD63C\uB3D9"]], "\uC6D0\uBFD4\uC740 \uC6D0\uC778 \uBC11\uBA74 \uD558\uB098\uC640 \uD55C \uAF2D\uC9D3\uC810\uC744 \uAC00\uC9D1\uB2C8\uB2E4."), 1);
a11(2, 6, "sphere-no-base", "6\uC21803-07", 1, "\uAD6C\uC5D0 \uD3C9\uD3C9\uD55C \uBC11\uBA74\uC774 \uC5C6\uC74C\uC744 \uC774\uD574\uD558\uAE30", () => C("\uAD6C\uC5D0 \uD3C9\uD3C9\uD55C \uBC11\uBA74\uC774 \uC788\uC2B5\uB2C8\uAE4C?", "\uC544\uB2C8\uC694", [["\uC608", "\uB2E4\uB978 \uC785\uCCB4\uC758 \uBC11\uBA74\uC744 \uAD6C\uC5D0 \uC801\uC6A9"]], "\uAD6C\uC758 \uD45C\uBA74\uC740 \uB465\uADFC \uACE1\uBA74\uC73C\uB85C \uC774\uB8E8\uC5B4\uC838 \uC788\uACE0 \uD3C9\uD3C9\uD55C \uBC11\uBA74\uC740 \uC5C6\uC2B5\uB2C8\uB2E4."), 1);
a11(2, 6, "net-cylinder-components", "6\uC21803-08", 1, "\uC6D0\uAE30\uB465 \uC804\uAC1C\uB3C4\uC758 \uBA74 \uAD6C\uC131 \uC774\uD574\uD558\uAE30", () => C("\uC6D0\uAE30\uB465 \uC804\uAC1C\uB3C4\uC5D0 \uD544\uC694\uD55C \uAE30\uBCF8 \uB3C4\uD615 \uAD6C\uC131\uC744 \uACE0\uB974\uC138\uC694.", "\uAC19\uC740 \uD06C\uAE30\uC758 \uC6D0 2\uAC1C\uC640 \uC9C1\uC0AC\uAC01\uD615 1\uAC1C", [["\uC6D0 1\uAC1C\uC640 \uC9C1\uC0AC\uAC01\uD615 1\uAC1C", "\uBC11\uBA74 \uD558\uB098 \uB204\uB77D"], ["\uC6D0 2\uAC1C\uC640 \uC0BC\uAC01\uD615 1\uAC1C", "\uC606\uBA74\uC744 \uC0BC\uAC01\uD615\uC73C\uB85C \uD63C\uB3D9"]], "\uB450 \uC6D0\uC740 \uBC11\uBA74, \uC9C1\uC0AC\uAC01\uD615\uC740 \uD3BC\uCE5C \uC606\uBA74\uC785\uB2C8\uB2E4."), 1);
a11(2, 6, "net-cylinder-height", "6\uC21803-08", 2, "\uC6D0\uAE30\uB465 \uB192\uC774\uC640 \uC804\uAC1C\uB3C4 \uC9C1\uC0AC\uAC01\uD615\uC758 \uBCC0 \uC5F0\uACB0\uD558\uAE30", (k) => E(`\uC6D0\uAE30\uB465 \uB192\uC774\uAC00 ${3 + k} cm\uC785\uB2C8\uB2E4. \uC606\uBA74\uC744 \uD3BC\uCE5C \uC9C1\uC0AC\uAC01\uD615\uC5D0\uC11C \uC6D0\uC8FC\uC640 \uB300\uC751\uD558\uC9C0 \uC54A\uB294 \uBCC0\uC758 \uAE38\uC774\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?`, [3 + k], "\uC606\uBA74 \uC9C1\uC0AC\uAC01\uD615\uC758 \uD55C \uBCC0\uC740 \uC6D0\uC8FC, \uB2E4\uB978 \uBCC0\uC740 \uC6D0\uAE30\uB465\uC758 \uB192\uC774\uC774\uBBC0\uB85C {answer} cm\uC785\uB2C8\uB2E4.", "cm"));
a11(2, 6, "net-cylinder-seam", "6\uC21803-08", 3, "\uC6D0\uAE30\uB465 \uC804\uAC1C\uB3C4\uC758 \uC606\uBA74 \uC5F0\uACB0 \uC870\uAC74 \uC774\uD574\uD558\uAE30", () => C("\uC6D0\uAE30\uB465 \uC606\uBA74 \uC9C1\uC0AC\uAC01\uD615\uC744 \uB9D0\uC544 \uC774\uC744 \uB54C \uC6D0\uC8FC \uAE38\uC774\uC778 \uBCC0\uC744 \uC704\uC544\uB798\uC5D0 \uB450\uC5C8\uC2B5\uB2C8\uB2E4. \uC11C\uB85C \uB9DE\uBD99\uC774\uB294 \uB450 \uBCC0\uC740 \uBB34\uC5C7\uC785\uB2C8\uAE4C?", "\uB192\uC774\uC5D0 \uD574\uB2F9\uD558\uB294 \uC88C\uC6B0 \uB450 \uBCC0", [["\uC6D0\uC8FC \uAE38\uC774\uC778 \uC704\uC544\uB798 \uB450 \uBCC0", "\uBC11\uBA74 \uC5F0\uACB0\uACFC \uC606\uBA74 \uC774\uC74C \uD63C\uB3D9"], ["\uC11C\uB85C \uC774\uC6C3\uD55C \uB450 \uBCC0", "\uB9C8\uC8FC \uBCF4\uB294 \uBCC0 \uC5F0\uACB0 \uC870\uAC74 \uB204\uB77D"]], "\uC88C\uC6B0\uC758 \uB192\uC774 \uBC29\uD5A5 \uB450 \uBCC0\uC744 \uC774\uC5B4 \uC606\uBA74\uC744 \uB9CC\uB4E4\uACE0 \uC704\uC544\uB798 \uB458\uB808\uC5D0 \uBC11\uBA74 \uC6D0\uC744 \uC5F0\uACB0\uD569\uB2C8\uB2E4."), 1);

// learning-review-r1/native/adapters/upper-authored-contract.js
function authoredTask(id) {
  const t = upperAuthored.find((t2) => t2.id === id);
  if (!t) throw Error("Unknown finite authored task");
  const selected = humanTaskMetadata[id] ? { ...t, ...humanTaskMetadata[id] } : t;
  return closureDifficulty[id] ? { ...selected, difficulty: closureDifficulty[id].difficulty } : selected;
}
function solveAuthoredModel(m) {
  const t = authoredTask(String(m.data.taskId)), k = Number(m.data.variant);
  if (!Number.isInteger(k) || k < 0 || k >= t.domain) throw Error("Invalid authored domain");
  return applyHumanTaskPatch(t.id, t.make(k), k).answer;
}

// learning-review-r1/native/adapters/quality-patch-contract.js
function solveQualityPatch(m) {
  const base = m.data.baseQuestion;
  if (!base?.math?.model || base.math.model.data.adapter === "quality-patch") throw Error("Bounded base required");
  return humanMathText(formatKoreanContent(solveMathModel(base.math.model)));
}

// learning-review-r1/native/data/fixed-net-catalog.js
function attachEdges(faces) {
  const edges = /* @__PURE__ */ new Map();
  for (const f2 of faces) for (let i = 0; i < f2.vertices.length; i++) {
    const points = [f2.vertices[i], f2.vertices[(i + 1) % f2.vertices.length]], key2 = points.map((p) => p.join(",")).sort().join("|");
    const e = edges.get(key2) ?? [];
    e.push({ id: f2.id, points });
    edges.set(key2, e);
  }
  return [...edges.values()].filter((e) => e.length === 2).map((e) => ({ faces: [e[0].id, e[1].id], edge: e[0].points }));
}
var triangularSolid = { shape: "prism", baseSides: 3, vertices: [[0, 0, 0], [3, 0, 0], [3, 4, 0], [0, 0, 6], [3, 0, 6], [3, 4, 6]], edges: [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [0, 3], [1, 4], [2, 5]], faces: [[0, 2, 1], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]] };
function tri(panel) {
  const faces = [{ id: "A", role: "lateral", target: 2, vertices: [[0, 0], [3, 0], [3, 6], [0, 6]], map: [0, 1, 4, 3] }, { id: "B", role: "lateral", target: 3, vertices: [[3, 0], [7, 0], [7, 6], [3, 6]], map: [1, 2, 5, 4] }, { id: "C", role: "lateral", target: 4, vertices: [[7, 0], [12, 0], [12, 6], [7, 6]], map: [2, 0, 3, 5] }];
  const bottom = [[[0, 0], [3, -4], [3, 0]], [[3, -3], [7, 0], [3, 0]], [[12, 0], [7, 0], [10.2, -2.4]]], top = [[[0, 6], [3, 6], [3, 10]], [[3, 9], [3, 6], [7, 6]], [[12, 6], [10.2, 8.4], [7, 6]]];
  faces.push({ id: "D", role: "base", target: 0, vertices: bottom[panel], map: [0, 2, 1] }, { id: "E", role: "base", target: 1, vertices: top[panel], map: [3, 4, 5] });
  const adjacency = attachEdges(faces);
  return { kind: "prism", id: "TRI-PANEL-" + panel, baseShape: "triangle", solid: structuredClone(triangularSolid), faces, adjacency, foldEdges: structuredClone(adjacency) };
}
function rectangle() {
  const v = [[0, 0, 0], [6, 0, 0], [6, 3, 0], [0, 3, 0], [0, 0, 4], [6, 0, 4], [6, 3, 4], [0, 3, 4]], faces3d = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]], edgeMap = /* @__PURE__ */ new Map();
  for (const f2 of faces3d) for (let i = 0; i < f2.length; i++) {
    const a12 = f2[i], b = f2[(i + 1) % f2.length];
    edgeMap.set([a12, b].sort((x2, y) => x2 - y).join(":"), [Math.min(a12, b), Math.max(a12, b)]);
  }
  const solid = { shape: "prism", baseSides: 4, vertices: v, faces: faces3d, edges: [...edgeMap.values()] }, faces = [];
  let x = 0;
  for (const [i, w] of [6, 3, 6, 3].entries()) {
    faces.push({ id: String.fromCharCode(65 + i), role: "lateral", target: 2 + i, vertices: [[x, 0], [x + w, 0], [x + w, 4], [x, 4]], map: [i, (i + 1) % 4, (i + 1) % 4 + 4, i + 4] });
    x += w;
  }
  faces.push({ id: "E", role: "base", target: 0, vertices: [[0, 0], [0, -3], [6, -3], [6, 0]], map: [0, 3, 2, 1] }, { id: "F", role: "base", target: 1, vertices: [[0, 4], [6, 4], [6, 7], [0, 7]], map: [4, 5, 6, 7] });
  const adjacency = attachEdges(faces);
  return { kind: "prism", id: "RECT-6-3-4", baseShape: "rectangle", solid, faces, adjacency, foldEdges: structuredClone(adjacency) };
}
var symbolic = { kind: "cylinder", id: "CYL-SYMBOLIC", circles: [{ id: "A", radius: "r", edge: "top" }, { id: "B", radius: "r", edge: "bottom" }], rectangle: { id: "C", width: { kind: "circumference", base: "A" }, height: "h" }, seam: ["left", "right"], unit: "symbolic" };
var numeric = { kind: "cylinder", id: "CYL-R3-H5", circles: [{ id: "A", radius: "3", edge: "top" }, { id: "B", radius: "3", edge: "bottom" }], rectangle: { id: "C", width: { kind: "numeric", value: "18.84" }, height: "5" }, seam: ["left", "right"], unit: "cm", pi: "3.14" };
function fixedNetCatalog() {
  const valid = [tri(0), tri(1), tri(2), rectangle(), structuredClone(symbolic), structuredClone(numeric)];
  const missing = structuredClone(valid[0]);
  missing.id = "TRI-MISSING-BASE";
  missing.faces = missing.faces.filter((f2) => f2.id !== "E");
  missing.adjacency = attachEdges(missing.faces);
  missing.foldEdges = structuredClone(missing.adjacency);
  const order = structuredClone(valid[0]);
  order.id = "TRI-WRONG-EDGE-ORDER";
  order.faces.find((f2) => f2.id === "D").vertices = [[0, 0], [0, -4], [3, 0]];
  order.adjacency = attachEdges(order.faces);
  order.foldEdges = structuredClone(order.adjacency);
  const cMissing = structuredClone(symbolic);
  cMissing.id = "CYL-MISSING-BASE";
  cMissing.circles.pop();
  const cUnequal = structuredClone(numeric);
  cUnequal.id = "CYL-UNEQUAL-BASES";
  cUnequal.circles[1].radius = "4";
  const cConnection = structuredClone(symbolic);
  cConnection.id = "CYL-SAME-EDGE";
  cConnection.circles[1].edge = "top";
  return [...valid, missing, order, cMissing, cUnequal, cConnection];
}

// learning-review-r1/native/validators/solid2.js
var sub = (a12, b) => a12.map((v, i) => v - b[i]);
var cross3 = (a12, b) => [a12[1] * b[2] - a12[2] * b[1], a12[2] * b[0] - a12[0] * b[2], a12[0] * b[1] - a12[1] * b[0]];
var dot3 = (a12, b) => a12.reduce((s, v, i) => s + v * b[i], 0);
var length2 = (v) => Math.hypot(...v);
var key = (a12, b) => [a12, b].sort((x, y) => x - y).join(":");
function solidGeometry(d) {
  if (!d || !Array.isArray(d.vertices) || d.vertices.length < 4 || d.vertices.length > 32 || d.vertices.some((v) => !Array.isArray(v) || v.length !== 3 || v.some((n) => !Number.isFinite(n) || Math.abs(n) > 1e4)) || new Set(d.vertices.map((v) => v.join(","))).size !== d.vertices.length) throw Error("Distinct bounded solid vertices");
  const edges = /* @__PURE__ */ new Set(), incidence = /* @__PURE__ */ new Map(), orientation = /* @__PURE__ */ new Map();
  if (!Array.isArray(d.edges) || !Array.isArray(d.faces)) throw Error("Explicit edges/faces");
  for (const [a12, b] of d.edges) {
    if (!Number.isInteger(a12) || !Number.isInteger(b) || a12 < 0 || b < 0 || a12 >= d.vertices.length || b >= d.vertices.length || a12 === b || edges.has(key(a12, b))) throw Error("Unique valid edges");
    edges.add(key(a12, b));
  }
  const normals = [], areas = [];
  for (const face of d.faces) {
    if (!Array.isArray(face) || face.length < 3 || new Set(face).size !== face.length || face.some((i) => !Number.isInteger(i) || i < 0 || i >= d.vertices.length)) throw Error("Valid face cycle");
    const origin = d.vertices[face[0]], normal = cross3(sub(d.vertices[face[1]], origin), sub(d.vertices[face[2]], origin));
    if (length2(normal) < 1e-8 || face.some((i) => Math.abs(dot3(sub(d.vertices[i], origin), normal)) > 1e-7 * length2(normal))) throw Error("Planar nondegenerate face");
    for (let i = 0; i < face.length; i++) {
      const a12 = d.vertices[face[i]], b = d.vertices[face[(i + 1) % face.length]], c2 = d.vertices[face[(i + 2) % face.length]];
      if (dot3(cross3(sub(b, a12), sub(c2, b)), normal) <= 0) throw Error("Strict convex face");
    }
    let area = 0;
    for (let i = 1; i < face.length - 1; i++) area += length2(cross3(sub(d.vertices[face[i]], origin), sub(d.vertices[face[i + 1]], origin))) / 2;
    areas.push(area);
    normals.push(normal);
    for (let i = 0; i < face.length; i++) {
      const a12 = face[i], b = face[(i + 1) % face.length], k = key(a12, b);
      if (!edges.has(k)) throw Error("Face boundary missing edge");
      incidence.set(k, (incidence.get(k) ?? 0) + 1);
      orientation.set(k, (orientation.get(k) ?? 0) + (a12 < b ? 1 : -1));
    }
  }
  if ([...edges].some((k) => incidence.get(k) !== 2 || orientation.get(k) !== 0) || d.vertices.length - edges.size + d.faces.length !== 2) throw Error("Oriented closed manifold/Euler condition");
  const reached = /* @__PURE__ */ new Set([0]);
  for (let i = 0; i < d.vertices.length; i++) for (const [a12, b] of d.edges) if (reached.has(a12) || reached.has(b)) {
    reached.add(a12);
    reached.add(b);
  }
  if (reached.size !== d.vertices.length) throw Error("Connected solid");
  if (["cube", "cuboid"].includes(d.shape)) {
    const dim2 = d.dimensions;
    if (!dim2 || Object.values(dim2).some((v) => !Number.isFinite(v) || v <= 0 || v > 1e4)) throw Error("Positive dimensions");
    const bounds = [dim2.width, dim2.depth, dim2.height], corners = new Set(d.vertices.map((v) => v.join(",")));
    for (const x of [0, bounds[0]]) for (const y of [0, bounds[1]]) for (const z of [0, bounds[2]]) if (!corners.has([x, y, z].join(","))) throw Error("Dimensions differ from actual vertices");
    if (corners.size !== 8 || d.edges.length !== 12 || d.faces.length !== 6 || d.faces.some((f2) => f2.length !== 4) || d.shape === "cube" && new Set(bounds).size !== 1) throw Error("Cuboid/cube topology");
    for (const [a12, b] of d.edges) if (d.vertices[a12].filter((v, i) => v !== d.vertices[b][i]).length !== 1) throw Error("Cuboid edge not axis aligned");
  } else {
    const n = d.baseSides;
    if (!n || !Number.isInteger(n) || n < 3 || n > 8) throw Error("Base polygon declaration");
    if (d.shape === "prism" && (d.vertices.length !== 2 * n || d.edges.length !== 3 * n || d.faces.length !== n + 2) || d.shape === "pyramid" && (d.vertices.length !== n + 1 || d.edges.length !== 2 * n || d.faces.length !== n + 1)) throw Error("Prism/pyramid topology");
    const setKey = (face) => [...face].sort((a12, b) => a12 - b).join(","), base = Array.from({ length: n }, (_, i) => i), baseFace = d.faces.find((f2) => setKey(f2) === setKey(base));
    if (!baseFace) throw Error("Declared base polygon is not a face");
    const origin = d.vertices[0], normal = cross3(sub(d.vertices[1], origin), sub(d.vertices[2], origin));
    if (length2(normal) < 1e-8 || base.some((i) => Math.abs(dot3(sub(d.vertices[i], origin), normal)) > 1e-7 * length2(normal))) throw Error("Planar base required");
    if (d.shape === "prism") {
      const translation = sub(d.vertices[n], d.vertices[0]);
      if (Math.abs(dot3(translation, normal)) < 1e-8 || base.some((i) => length2(sub(sub(d.vertices[i + n], d.vertices[i]), translation)) > 1e-7)) throw Error("Prism bases must be corresponding translations");
      if (!d.faces.some((f2) => setKey(f2) === setKey(base.map((i) => i + n)))) throw Error("Second prism base missing");
      for (let i = 0; i < n; i++) {
        const side = [i, (i + 1) % n, (i + 1) % n + n, i + n];
        if (!d.faces.some((f2) => setKey(f2) === setKey(side))) throw Error("Prism side adjacency");
      }
    } else {
      if (Math.abs(dot3(sub(d.vertices[n], origin), normal)) < 1e-8) throw Error("Pyramid apex cannot lie in base plane");
      for (let i = 0; i < n; i++) if (!d.faces.some((f2) => setKey(f2) === setKey([i, (i + 1) % n, n]))) throw Error("Pyramid side incidence");
    }
  }
  let determinant = new Rational(0);
  const r2 = (v) => Rational.parse(v);
  for (const f2 of d.faces) for (let i = 1; i < f2.length - 1; i++) {
    const a12 = d.vertices[f2[0]], b = d.vertices[f2[i]], c2 = d.vertices[f2[i + 1]];
    for (let axis = 0; axis < 3; axis++) {
      const j = (axis + 1) % 3, k = (axis + 2) % 3;
      determinant = determinant.add(r2(a12[axis]).multiply(r2(b[j]).multiply(r2(c2[k])).subtract(r2(b[k]).multiply(r2(c2[j])))));
    }
  }
  const signedOrientation = determinant.numerator < 0n ? -1 : 1;
  if (determinant.numerator < 0n) determinant = new Rational(-determinant.numerator, determinant.denominator);
  const exact2 = determinant.divide(new Rational(6));
  if (exact2.numerator <= 0n) throw Error("Nonzero oriented volume");
  return { vertices: d.vertices.length, edges: edges.size, faces: d.faces.length, normals: normals.map((n) => n.map((x) => x * signedOrientation)), areas, surfaceArea: areas.reduce((a12, b) => a12 + b, 0), volume: Number(exact2.toDisplayString("decimal")), volumeExact: exact2.toDisplayString() };
}

// learning-review-r1/native/validators/fixed-net.js
var near = (a12, b) => Math.abs(a12 - b) < 1e-7;
var dist = (a12, b) => a12.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);
var edgeKey = (a12, b) => [a12.join(","), b.join(",")].sort().join("|");
function overlapping(a12, b) {
  for (const polygon of [a12, b]) for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i], q = polygon[(i + 1) % polygon.length], axis = [-(q[1] - p[1]), q[0] - p[0]], project = (v) => v[0] * axis[0] + v[1] * axis[1], x = a12.map(project), y = b.map(project);
    if (Math.min(Math.max(...x), Math.max(...y)) - Math.max(Math.min(...x), Math.min(...y)) <= 1e-7) return false;
  }
  return true;
}
function validateFixedNet(net) {
  const reasons = [], evidence = [];
  try {
    if (net.kind === "prism") {
      if (![3, 4].includes(net.solid.baseSides ?? 0)) return { status: "REVIEW_REQUIRED", reasons: ["Bounded fixed catalog covers triangular and rectangular prisms; other bases require a separate certificate"], evidence: [] };
      const s = solidGeometry(net.solid), n = net.solid.baseSides;
      if (net.baseShape !== (n === 3 ? "triangle" : "rectangle")) reasons.push("Base shape mismatch");
      if (n === 4) {
        const p = net.solid.vertices.slice(0, 4);
        for (let i = 0; i < 4; i++) {
          const v = p[i], a12 = p[(i + 1) % 4].map((x, k) => x - v[k]), b = p[(i + 3) % 4].map((x, k) => x - v[k]);
          if (Math.abs(a12.reduce((sum, x, k) => sum + x * b[k], 0)) > 1e-7) reasons.push("Declared rectangular base must have four right angles");
        }
      }
      if (net.faces.length !== n + 2 || net.faces.filter((f2) => f2.role === "base").length !== 2 || net.faces.filter((f2) => f2.role === "lateral").length !== n) reasons.push("Base/lateral/total face count mismatch");
      if (new Set(net.faces.map((f2) => f2.id)).size !== net.faces.length || new Set(net.faces.map((f2) => f2.target)).size !== net.faces.length) reasons.push("Repeated face/target face");
      const boundaries = /* @__PURE__ */ new Map();
      for (const f2 of net.faces) {
        if (f2.vertices.some((p) => p.length !== 2)) reasons.push("Flat net coordinates must have exactly two components");
        const target = net.solid.faces[f2.target];
        if (!target || f2.vertices.length !== target.length || f2.map.length !== target.length || [...f2.map].sort().join(",") !== [...target].sort().join(",")) {
          reasons.push("Face target incidence mismatch " + f2.id);
          continue;
        }
        if (!target.some((_, offset) => f2.map.every((v, i) => v === target[(offset + i) % target.length]))) reasons.push("Oriented target cycle mismatch " + f2.id);
        if (f2.role !== (f2.target < 2 ? "base" : "lateral")) reasons.push("Face role mismatch " + f2.id);
        let sign = 0;
        for (let i = 0; i < f2.vertices.length; i++) {
          const a12 = f2.vertices[i], b = f2.vertices[(i + 1) % f2.vertices.length], c2 = f2.vertices[(i + 2) % f2.vertices.length];
          if (a12.some((v) => !Number.isFinite(v) || Math.abs(v) > 50)) throw Error("Bounded planar net coordinates");
          const turn = (b[0] - a12[0]) * (c2[1] - b[1]) - (b[1] - a12[1]) * (c2[0] - b[0]);
          if (turn <= 1e-7) reasons.push("Oriented convex sheet face required " + f2.id);
          sign += turn;
          for (let j = 0; j < f2.vertices.length; j++) if (!near(dist(a12, f2.vertices[j]), dist(net.solid.vertices[f2.map[i]], net.solid.vertices[f2.map[j]]))) reasons.push("Flat/folded face metric mismatch " + f2.id);
          const k = edgeKey(a12, b), t = [f2.map[i], f2.map[(i + 1) % f2.map.length]].sort((x, y) => x - y).join(":");
          const list = boundaries.get(k) ?? [];
          list.push({ face: f2.id, targetEdge: t, endpoints: [[a12.join(","), f2.map[i]], [b.join(","), f2.map[(i + 1) % f2.map.length]]].sort((a13, b2) => String(a13[0]).localeCompare(String(b2[0]))).map((v) => v.join("=")).join("|") });
          boundaries.set(k, list);
        }
        if (sign <= 0) reasons.push("Invalid face winding");
      }
      for (let i = 0; i < net.faces.length; i++) for (let j = i + 1; j < net.faces.length; j++) if (overlapping(net.faces[i].vertices, net.faces[j].vertices)) reasons.push("Flat faces overlap " + net.faces[i].id + "/" + net.faces[j].id);
      const joins = [...boundaries.entries()].filter(([, v]) => v.length === 2);
      if ([...boundaries.values()].some((v) => v.length > 2) || joins.some(([, v]) => v[0].targetEdge !== v[1].targetEdge || v[0].endpoints !== v[1].endpoints)) reasons.push("Shared hinge correspondence mismatch");
      const declared = net.adjacency.map((a12) => a12.faces.toSorted().join(":") + "@" + edgeKey(...a12.edge)).toSorted();
      const actual = joins.map(([k, v]) => v.map((x) => x.face).sort().join(":") + "@" + k).sort();
      if (JSON.stringify(declared) !== JSON.stringify(actual) || JSON.stringify(net.foldEdges) !== JSON.stringify(net.adjacency)) reasons.push("Declared adjacency/fold edges mismatch");
      const reached = new Set(net.faces.length ? [net.faces[0].id] : []);
      for (let i = 0; i < net.faces.length; i++) for (const [, v] of joins) if (reached.has(v[0].face) || reached.has(v[1].face)) {
        reached.add(v[0].face);
        reached.add(v[1].face);
      }
      if (reached.size !== net.faces.length || joins.length !== net.faces.length - 1) reasons.push("Connected tree of sheet hinges required");
      evidence.push(`${s.faces} distinct convex faces in a closed oriented prism mesh; Euler characteristic2`, `Every face preserves all pairwise vertex distances in its target solid face`, `Shared sheet hinges map to identical target edges; target closed mesh has two incident faces per edge`, `Distinct target faces form the validated convex translated prism, without folded face overlap`, `Planar SAT checks separate face interiors; adjacency is connected and acyclic`);
    } else {
      if (net.circles.length !== 2) reasons.push("Exactly two circular bases required");
      if (new Set(net.circles.map((c2) => c2.id)).size !== net.circles.length || net.circles.some((c2) => c2.id === net.rectangle.id)) reasons.push("Unique face IDs required");
      if (net.circles.some((c2) => c2.radius !== net.circles[0]?.radius)) reasons.push("Equal circular bases required");
      if (new Set(net.circles.map((c2) => c2.edge)).size !== 2 || net.circles.some((c2) => !["top", "bottom"].includes(c2.edge))) reasons.push("Bases must connect to opposite upper/lower circumference boundaries");
      if (JSON.stringify(net.seam) !== JSON.stringify(["left", "right"])) reasons.push("Opposite left/right height edges form the lateral seam");
      if (net.unit === "symbolic") {
        if (net.circles.some((c2) => c2.radius !== "r") || net.rectangle.height !== "h" || net.rectangle.width.kind !== "circumference" || !net.circles.some((c2) => c2.id === net.rectangle.width.base)) reasons.push("Symbolic side width must be the common base circumference");
      } else {
        if (net.pi !== "3.14") reasons.push("Explicit school pi policy3.14 required");
        const r2 = Rational.parse(net.circles[0]?.radius ?? "0"), h = Rational.parse(net.rectangle.height);
        if (r2.compare(new Rational(0)) <= 0 || r2.compare(new Rational(100)) > 0 || h.compare(new Rational(0)) <= 0 || h.compare(new Rational(100)) > 0) reasons.push("Positive bounded dimensions");
        if (net.rectangle.width.kind !== "numeric" || !Rational.parse(net.rectangle.width.value).equals(r2.multiply(new Rational(2)).multiply(new Rational(314, 100)))) reasons.push("Side width/base circumference mismatch");
      }
      evidence.push("Two congruent circular bases and one rectangular lateral face", "Upper/lower circumference edges join the bases; left/right height edges join as a seam", "A symbolic circumference relation does not force an unnecessary numerical pi calculation");
    }
  } catch (e) {
    reasons.push(e.message);
  }
  return { status: reasons.length ? "INVALID" : "VALID", reasons: [...new Set(reasons)], evidence: reasons.length ? reasons.map((r2) => "Failed check: " + r2) : evidence };
}

// learning-review-r1/native/adapters/fixed-net-contract.js
var get = (id) => {
  const n = fixedNetCatalog().find((n2) => n2.id === id);
  if (!n) throw Error("Unregistered immutable fixed net");
  return n;
};
function netTask(task) {
  const net = get(task.netId), v = validateFixedNet(net), prism = net.kind === "prism", semester = prism ? 1 : 2, unitId = prism ? "sem1_unit2" : "sem2_unit6", code = prism ? "6\uC21803-06" : "6\uC21803-08";
  if (v.status === "REVIEW_REQUIRED") throw Error("Unknown net certificate requires review");
  if (v.status === "INVALID" && !["validity", "missing"].includes(task.query)) throw Error("Only validity/missing-face questions admit invalid net diagrams");
  let answer = "", question = "", explanation = "", unit = "";
  const name = prism ? net.baseShape === "triangle" ? "\uC0BC\uAC01\uAE30\uB465" : "\uC0AC\uAC01\uAE30\uB465" : "\uC6D0\uAE30\uB465";
  switch (task.query) {
    case "solid":
      answer = name;
      question = "\uADF8\uB9BC\uC758 \uC804\uAC1C\uB3C4\uB97C \uC811\uC5B4 \uB9CC\uB4E4 \uC218 \uC788\uB294 \uC785\uCCB4\uB3C4\uD615\uC758 \uC774\uB984\uC744 \uACE0\uB974\uC138\uC694.";
      explanation = prism ? `\uD569\uB3D9\uC778 ${net.baseShape === "triangle" ? "\uC0BC\uAC01\uD615" : "\uC9C1\uC0AC\uAC01\uD615"} \uBC11\uBA742\uAC1C\uC640 \uC606\uBA74 ${net.solid.baseSides}\uAC1C\uAC00 \uAC01 \uBCC0\uC758 \uAE38\uC774\uC5D0 \uB9DE\uAC8C \uC774\uC5B4\uC838 \uC788\uC73C\uBBC0\uB85C ${name}\uC774 \uB429\uB2C8\uB2E4.` : "\uD06C\uAE30\uAC00 \uAC19\uC740 \uC6D02\uAC1C\uAC00 \uBC11\uBA74\uC774\uACE0 \uC9C1\uC0AC\uAC01\uD615\uC774 \uC606\uBA74\uC774 \uB418\uBBC0\uB85C \uC6D0\uAE30\uB465\uC785\uB2C8\uB2E4.";
      break;
    case "validity":
      answer = v.status === "VALID" ? "\uC608" : "\uC544\uB2C8\uC694";
      question = `\uADF8\uB9BC\uC740 ${name}\uC744 \uB9CC\uB4E4 \uC218 \uC788\uB294 \uC804\uAC1C\uB3C4\uC785\uB2C8\uAE4C?`;
      explanation = v.status === "VALID" ? prism ? "\uBC11\uBA742\uAC1C\uC640 \uD544\uC694\uD55C \uC606\uBA74\uC774 \uC11C\uB85C \uB300\uC751\uD558\uB294 \uBCC0\uC744 \uB530\uB77C \uC774\uC5B4\uC9C0\uACE0, \uC811\uC73C\uBA74 \uBAA9\uD45C \uC785\uCCB4\uC758 \uC11C\uB85C \uB2E4\uB978 \uBA74\uC744 \uCC44\uC6C1\uB2C8\uB2E4." : "\uC6D02\uAC1C\uC758 \uD06C\uAE30\uAC00 \uAC19\uACE0 \uC606\uBA74\uC758 \uB9C8\uC8FC \uBCF4\uB294 \uB450 \uACBD\uACC4\uC5D0 \uAC01\uAC01 \uC774\uC5B4\uC838 \uC6D0\uAE30\uB465\uC744 \uB9CC\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4." : prism ? net.id.includes("MISSING") ? "\uC0BC\uAC01\uD615 \uBC11\uBA74\uC774 \uD558\uB098 \uBD80\uC871\uD558\uC5EC \uC785\uCCB4\uB97C \uB2EB\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." : "\uC0BC\uAC01\uD615\uC758 \uBCC0 \uC21C\uC11C\uC640 \uC606\uBA74 \uD3ED\uC758 \uC21C\uC11C\uAC00 \uB9DE\uC9C0 \uC54A\uC544 \uC811\uD569\uD560 \uBCC0\uC758 \uAE38\uC774\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." : net.id.includes("MISSING") ? "\uC6D0\uAE30\uB465\uC758 \uBC11\uBA74\uC7402\uAC1C\uAC00 \uD544\uC694\uD55C\uB370 \uD558\uB098\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." : net.id.includes("UNEQUAL") ? "\uC6D0\uAE30\uB465\uC758 \uB450 \uBC11\uBA74\uC740 \uD06C\uAE30\uAC00 \uAC19\uC544\uC57C \uD558\uB294\uB370 \uBC18\uC9C0\uB984\uC774 \uB2E4\uB985\uB2C8\uB2E4." : "\uB450 \uBC11\uBA74\uC774 \uC606\uBA74\uC758 \uAC19\uC740 \uACBD\uACC4\uC5D0 \uC5F0\uACB0\uB418\uC5B4 \uB2E4\uB978 \uCABD\uC744 \uB2EB\uC9C0 \uBABB\uD569\uB2C8\uB2E4.";
      break;
    case "bases": {
      if (!prism) throw Error("Base labels query only registered for prisms");
      answer = net.faces.filter((f2) => f2.role === "base").map((f2) => f2.id).join(",");
      question = `${net.baseShape === "rectangle" ? "\uAC00\uB85C6 cm, \uC138\uB85C3 cm\uC758 \uC9C1\uC0AC\uAC01\uD615\uC744 \uBC11\uBA74\uC73C\uB85C \uD558\uB294 " : "\uC0BC\uAC01\uD615\uC744 \uBC11\uBA74\uC73C\uB85C \uD558\uB294 "}${name}\uC785\uB2C8\uB2E4. \uBC11\uBA74\uC774 \uB418\uB294 \uBA74\uC758 \uC774\uB9842\uAC1C\uB97C \uC54C\uD30C\uBCB3 \uC21C\uC11C\uB300\uB85C \uC27C\uD45C\uB85C \uAD6C\uBD84\uD574 \uC801\uC73C\uC138\uC694.`;
      explanation = `${answer}\uB294 \uD569\uB3D9\uC778 ${net.baseShape === "triangle" ? "\uC0BC\uAC01\uD615" : "6 cm \xD7 3 cm \uC9C1\uC0AC\uAC01\uD615"} \uB450 \uBC11\uBA74\uC774\uBA70 \uB098\uBA38\uC9C0 \uBA74\uC740 \uC606\uBA74\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "opposite-base": {
      if (!prism) throw Error("Prism base-opposite query");
      const bases = net.faces.filter((f2) => f2.role === "base");
      answer = bases[1].id;
      question = `\uBA74 ${bases[0].id}\uB97C \uBC11\uBA74\uC73C\uB85C \uD558\uC5EC \uC811\uC73C\uBA74 \uB9C8\uC8FC \uBCF4\uB294 \uB2E4\uB978 \uBC11\uBA74\uC740 \uC5B4\uB290 \uBA74\uC785\uB2C8\uAE4C?`;
      explanation = `\uAC01\uAE30\uB465\uC758 \uB450 \uBC11\uBA74\uC740 \uD3C9\uD589\uD558\uACE0 \uD569\uB3D9\uC785\uB2C8\uB2E4. \uBA74 ${bases[0].id}\uC5D0 \uB9C8\uC8FC \uBCF4\uB294 \uBC11\uBA74\uC740 \uBA74 ${answer}\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "missing":
      if (prism) {
        if (net.id !== "TRI-MISSING-BASE") throw Error("Known one-base omission only");
        answer = "\uC0BC\uAC01\uD6151\uAC1C";
        question = "\uC0BC\uAC01\uAE30\uB465\uC758 \uC804\uAC1C\uB3C4\uB97C \uC644\uC131\uD558\uB824\uBA74 \uC5B4\uB5A4 \uBA74\uC744 \uBA87 \uAC1C \uB354 \uB123\uC5B4\uC57C \uD569\uB2C8\uAE4C?";
        explanation = "\uC0BC\uAC01\uAE30\uB465\uC5D0\uB294 \uC0BC\uAC01\uD615 \uBC11\uBA742\uAC1C\uC640 \uC9C1\uC0AC\uAC01\uD615 \uC606\uBA743\uAC1C\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4. \uC9C0\uAE08\uC740 \uC0BC\uAC01\uD615 \uBC11\uBA74 \uD558\uB098\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4.";
      } else {
        if (net.id !== "CYL-MISSING-BASE") throw Error("Known one-circle omission only");
        answer = "\uC6D01\uAC1C";
        question = "\uC6D0\uAE30\uB465\uC758 \uC804\uAC1C\uB3C4\uB97C \uC644\uC131\uD558\uB824\uBA74 \uC5B4\uB5A4 \uBA74\uC744 \uBA87 \uAC1C \uB354 \uB123\uC5B4\uC57C \uD569\uB2C8\uAE4C?";
        explanation = "\uC6D0\uAE30\uB465\uC5D0\uB294 \uD06C\uAE30\uAC00 \uAC19\uC740 \uC6D02\uAC1C\uC640 \uC9C1\uC0AC\uAC01\uD6151\uAC1C\uAC00 \uD544\uC694\uD558\uBBC0\uB85C \uBE60\uC9C4 \uBC11\uBA74 \uC6D01\uAC1C\uB97C \uB354 \uB123\uC5B4\uC57C \uD569\uB2C8\uB2E4.";
      }
      break;
    case "base-count":
      answer = "2";
      unit = "\uAC1C";
      question = "\uC774 \uC6D0\uAE30\uB465 \uC804\uAC1C\uB3C4\uC5D0\uC11C \uBC11\uBA74\uC774 \uB418\uB294 \uC6D0\uC740 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?";
      explanation = "\uC11C\uB85C \uD3C9\uD589\uD55C \uB450 \uBC11\uBA74\uC744 \uB9CC\uB4E4\uBBC0\uB85C \uD06C\uAE30\uAC00 \uAC19\uC740 \uC6D0\uC7402\uAC1C\uC785\uB2C8\uB2E4.";
      if (prism) throw Error("Cylinder count query");
      break;
    case "side-shape":
      if (prism) throw Error("Cylinder lateral shape");
      answer = "\uC9C1\uC0AC\uAC01\uD615";
      question = "\uC6D0\uAE30\uB465\uC758 \uC606\uBA74\uC744 \uC774\uC74C\uC120\uC744 \uB530\uB77C \uD3BC\uCE58\uBA74 \uC5B4\uB5A4 \uD3C9\uBA74\uB3C4\uD615\uC774 \uB429\uB2C8\uAE4C?";
      explanation = "\uC606\uBA74\uC744 \uD3BC\uCE58\uBA74 \uB192\uC774\uAC00 \uD55C \uBCC0\uC774\uACE0 \uBC11\uBA74 \uC6D0\uC8FC\uAC00 \uB2E4\uB978 \uBCC0\uC778 \uC9C1\uC0AC\uAC01\uD615\uC774 \uB429\uB2C8\uB2E4.";
      break;
    case "width":
      if (prism || net.unit !== "cm") throw Error("Numeric cylinder width only");
      answer = Rational.parse(net.circles[0].radius).multiply(new Rational(2)).multiply(new Rational(314, 100)).toDisplayString("decimal");
      unit = "cm";
      question = `\uBC11\uBA74 \uBC18\uC9C0\uB984\uC740${net.circles[0].radius} cm, \uB192\uC774\uB294${net.rectangle.height} cm\uC785\uB2C8\uB2E4. \uC6D0\uC8FC\uC7283.14\uB97C \uC0AC\uC6A9\uD558\uC5EC \uC606\uBA74 \uC9C1\uC0AC\uAC01\uD615\uC758 \uAC00\uB85C \uAE38\uC774\uB97C \uAD6C\uD558\uC138\uC694.`;
      explanation = `\uC606\uBA74\uC758 \uAC00\uB85C\uB294 \uBC11\uBA74 \uC6D0\uC8FC\uC785\uB2C8\uB2E4. ${net.circles[0].radius} \xD7 2 \xD7 3.14 = ${answer} cm\uC785\uB2C8\uB2E4.`;
      break;
    case "width-rule":
      if (prism) throw Error("Cylinder side rule");
      answer = "\uBC11\uBA74 \uC6D0\uC758 \uC6D0\uC8FC";
      question = "\uADF8\uB9BC\uC5D0\uC11C \uC606\uBA74 \uC9C1\uC0AC\uAC01\uD615\uC758 \uAC00\uB85C \uAE38\uC774\uB294 \uBC11\uBA74 \uC6D0\uC758 \uC5B4\uB5A4 \uAE38\uC774\uC640 \uAC19\uC544\uC57C \uD569\uB2C8\uAE4C?";
      explanation = "\uC9C1\uC0AC\uAC01\uD615\uC744 \uB465\uAE00\uAC8C \uB9D0\uC558\uC744 \uB54C \uB458\uB808\uB97C \uD55C \uBC14\uD034 \uCC44\uC6CC\uC57C \uD558\uBBC0\uB85C \uAC00\uB85C \uAE38\uC774\uB294 \uBC11\uBA74 \uC6D0\uC758 \uC6D0\uC8FC\uC640 \uAC19\uC2B5\uB2C8\uB2E4.";
      break;
    default:
      throw Error("Unknown fixed query");
  }
  return { net, validation: v, answer, question, explanation, unit, semester, unitId, code };
}
function solveFixedNetModel(m) {
  return netTask(m.data.task).answer;
}

// learning-review-r1/native/validators/geometry2.js
var eps = 1e-7;
var near2 = (a12, b) => Math.abs(a12 - b) <= eps * Math.max(1, Math.abs(a12), Math.abs(b));
var point3 = (v) => {
  if (!Array.isArray(v) || v.length !== 2 || v.some((n) => !Number.isFinite(n) || Math.abs(n) > 1e4)) throw Error("Bounded geometry coordinates");
  return v;
};
var delta = (a12, b) => [a12[0] - b[0], a12[1] - b[1]];
var dot4 = (a12, b) => a12[0] * b[0] + a12[1] * b[1];
var cross4 = (a12, b) => a12[0] * b[1] - a12[1] * b[0];
var norm = (v) => Math.hypot(...v);
function angleGeometry(d) {
  const v = point3(d.vertex), a12 = delta(point3(d.rayA), v), b = delta(point3(d.rayB), v);
  if (norm(a12) < eps || norm(b) < eps) throw Error("Angle ray cannot collapse");
  const degrees = Math.acos(Math.max(-1, Math.min(1, dot4(a12, b) / norm(a12) / norm(b)))) * 180 / Math.PI;
  if (degrees <= eps || degrees > 180 + eps) throw Error("Nonzero minor angle");
  const type = near2(degrees, 90) ? "\uC9C1\uAC01" : near2(degrees, 180) ? "\uD3C9\uAC01" : degrees < 90 ? "\uC608\uAC01" : "\uB454\uAC01";
  if (d.angleDegrees !== void 0 && !near2(d.angleDegrees, degrees)) throw Error("Declared angle differs from rays");
  if (d.angleType !== void 0 && d.angleType !== type) throw Error("Declared angle type differs");
  return { degrees, type };
}
function lineRelation(a12, b, c2, d) {
  const u = delta(point3(b), point3(a12)), v = delta(point3(d), point3(c2));
  if (norm(u) < eps || norm(v) < eps) throw Error("Nondegenerate lines");
  return near2(cross4(u, v), 0) ? "parallel" : near2(dot4(u, v), 0) ? "perpendicular" : "neither";
}
function polygonGeometry(vertices, trapezoid = "inclusive") {
  if (!Array.isArray(vertices) || vertices.length < 3 || vertices.length > 8) throw Error("3..8 vertex polygon");
  vertices.forEach(point3);
  if (new Set(vertices.map((v) => v.join(","))).size !== vertices.length) throw Error("Distinct polygon vertices");
  const n = vertices.length, edges = vertices.map((v, i) => delta(vertices[(i + 1) % n], v)), turns = edges.map((v, i) => cross4(v, edges[(i + 1) % n]));
  if (turns.some((v) => near2(v, 0)) || turns.some((v) => v * turns[0] <= 0)) throw Error("Strict convex polygon");
  const sides = edges.map(norm), angles = vertices.map((v, i) => angleGeometry({ vertex: v, rayA: vertices[(i + n - 1) % n], rayB: vertices[(i + 1) % n] }).degrees);
  if (!near2(angles.reduce((s, a12) => s + a12, 0), (n - 2) * 180)) throw Error("Polygon winding/angle sum");
  let types = [];
  if (n === 3) {
    types.push(sides.every((s) => near2(s, sides[0])) ? "\uC815\uC0BC\uAC01\uD615" : sides.some((s, i) => sides.some((t, j) => i !== j && near2(s, t))) ? "\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615" : "\uC77C\uBC18 \uC0BC\uAC01\uD615");
    types.push(angles.some((a12) => near2(a12, 90)) ? "\uC9C1\uAC01\uC0BC\uAC01\uD615" : angles.some((a12) => a12 > 90 + eps) ? "\uB454\uAC01\uC0BC\uAC01\uD615" : "\uC608\uAC01\uC0BC\uAC01\uD615");
    if (types.includes("\uC815\uC0BC\uAC01\uD615")) types.push("\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615");
  }
  if (n === 4) {
    const parallel = [near2(cross4(edges[0], edges[2]), 0), near2(cross4(edges[1], edges[3]), 0)], p = parallel.filter(Boolean).length, right = angles.every((a12) => near2(a12, 90)), equal = sides.every((s) => near2(s, sides[0]));
    if (p === 2) types.push("\uD3C9\uD589\uC0AC\uBCC0\uD615");
    if (trapezoid === "inclusive" ? p >= 1 : p === 1) types.push("\uC0AC\uB2E4\uB9AC\uAF34");
    if (right) types.push("\uC9C1\uC0AC\uAC01\uD615");
    if (equal && p === 2) types.push("\uB9C8\uB984\uBAA8");
    if (right && equal) types.push("\uC815\uC0AC\uAC01\uD615");
  }
  const regular = sides.every((s) => near2(s, sides[0])) && angles.every((a12) => near2(a12, angles[0]));
  return { sides, angles, types, regular, angleSum: (n - 2) * 180, vertices: n };
}
function transformPolygon(points, kind, argument) {
  points.forEach(point3);
  point3(argument);
  return points.map(([x, y]) => kind === "translate" ? [x + argument[0], y + argument[1]] : kind === "rotate180" ? [2 * argument[0] - x, 2 * argument[1] - y] : [2 * argument[0] - x, y]);
}
function verifyCorrespondence(a12, b, pairs2) {
  if (a12.length !== b.length || pairs2.length !== a12.length || new Set(pairs2).size !== a12.length || pairs2.some((i) => i < 0 || i >= b.length)) throw Error("Bijection required");
  a12.forEach(point3);
  b.forEach(point3);
  for (let i = 0; i < a12.length; i++) for (let j = 0; j < a12.length; j++) if (!near2(norm(delta(a12[i], a12[j])), norm(delta(b[pairs2[i]], b[pairs2[j]])))) throw Error("Corresponding distances differ");
  return true;
}

// learning-review-r1/native/validators/numeric2.js
function schoolOperation(a12, b, op, format = "fraction") {
  const x = parseSchoolNumber(a12).value, y = parseSchoolNumber(b).value, v = op === "add" ? x.add(y) : op === "subtract" ? x.subtract(y) : op === "multiply" ? x.multiply(y) : x.divide(y);
  if (v.numerator < 0n) throw Error("Elementary nonnegative result");
  return v.toDisplayString(format);
}
function roundExact(value, places, mode) {
  if (!Number.isInteger(places) || places < 0 || places > 6) throw Error("Declared 0..6 decimal places");
  const x = parseSchoolNumber(value).value, scale = 10n ** BigInt(places), n = x.numerator * scale, d = x.denominator;
  let q = n / d;
  const r2 = n % d;
  if (mode === "ceil" && r2 || mode === "round" && r2 * 2n >= d) q++;
  else if (!["round", "floor", "ceil"].includes(mode)) throw Error("Rounding mode");
  const raw = String(q).padStart(places + 1, "0");
  return places ? raw.slice(0, -places) + "." + raw.slice(-places) : raw;
}
function inRange(value, lower, upper, includeLower, includeUpper) {
  const x = parseSchoolNumber(value).value, a12 = parseSchoolNumber(lower).value, b = parseSchoolNumber(upper).value;
  if (a12.compare(b) > 0) throw Error("Ordered range");
  return (includeLower ? x.compare(a12) >= 0 : x.compare(a12) > 0) && (includeUpper ? x.compare(b) <= 0 : x.compare(b) < 0);
}
function divisors(n) {
  if (!Number.isSafeInteger(n) || n < 1 || n > 1e5) throw Error("Positive bounded integer");
  const list = [];
  for (let i = 1; i * i <= n; i++) if (n % i === 0) {
    list.push(i);
    if (i * i !== n) list.push(n / i);
  }
  return list.sort((a12, b) => a12 - b);
}
function multiples(n, count) {
  if (!Number.isSafeInteger(n) || n < 1 || n > 1e4 || !Number.isInteger(count) || count < 1 || count > 20) throw Error("Bounded multiple sequence");
  return Array.from({ length: count }, (_, i) => n * (i + 1));
}
function sequenceRule(values, rule) {
  if (!Array.isArray(values) || values.length < 2 || values.length > 12) throw Error("2..12 sequence observations");
  const step = parseSchoolNumber(rule.step).value;
  for (let i = 1; i < values.length; i++) {
    const previous = parseSchoolNumber(values[i - 1]).value, current = parseSchoolNumber(values[i]).value;
    if (!(rule.kind === "arithmetic" ? previous.add(step) : previous.multiply(step)).equals(current)) throw Error("Declared rule differs from observed sequence");
  }
  const last2 = parseSchoolNumber(values.at(-1)).value;
  return (rule.kind === "arithmetic" ? last2.add(step) : last2.multiply(step)).toDisplayString("fraction");
}
function correspondence(rows2, scale, offset) {
  if (!Array.isArray(rows2) || rows2.length < 2 || rows2.length > 8 || new Set(rows2.map((r2) => r2.x)).size !== rows2.length) throw Error("Distinct input observations");
  const a12 = parseSchoolNumber(scale).value, b = parseSchoolNumber(offset).value;
  for (const row of rows2) if (!parseSchoolNumber(row.x).value.multiply(a12).add(b).equals(parseSchoolNumber(row.y).value)) throw Error("Correspondence source data disagree");
  return true;
}
function probability(outcomes, event) {
  if (!Array.isArray(outcomes) || !outcomes.length || outcomes.length > 50 || new Set(outcomes.map((o) => o.id)).size !== outcomes.length || outcomes.some((o) => !o.id || !Number.isSafeInteger(o.weight) || o.weight <= 0) || new Set(event).size !== event.length || event.some((id) => !outcomes.some((o) => o.id === id))) throw Error("Explicit weighted sample space and event");
  const total = outcomes.reduce((s, o) => s + o.weight, 0), favorable = outcomes.filter((o) => event.includes(o.id)).reduce((s, o) => s + o.weight, 0);
  return new Rational(favorable, total).toDisplayString("fraction");
}
function koreanInteger(value) {
  if (!/^\d{1,16}$/.test(value)) throw Error("Bounded Korean large-number input");
  let n = BigInt(value);
  if (n === 0n) return "\uC601";
  const digits = ["", "\uC77C", "\uC774", "\uC0BC", "\uC0AC", "\uC624", "\uC721", "\uCE60", "\uD314", "\uAD6C"], small = ["", "\uC2ED", "\uBC31", "\uCC9C"], large = ["", "\uB9CC", "\uC5B5", "\uC870", "\uACBD"];
  const groups = [];
  let index = 0;
  while (n) {
    const g = Number(n % 10000n);
    if (g) {
      let s = "";
      for (let p = 3; p >= 0; p--) {
        const digit = Math.floor(g / 10 ** p) % 10;
        if (digit) s += (digit === 1 && p > 0 ? "" : digits[digit]) + small[p];
      }
      groups.unshift(s + large[index]);
    }
    n /= 10000n;
    index++;
  }
  return groups.join(" ");
}

// learning-review-r1/native/validators/stack2.js
function stackViews(cubes) {
  if (!Array.isArray(cubes) || !cubes.length || cubes.length > 50 || cubes.some((c2) => !Array.isArray(c2) || c2.length !== 3 || c2.some((n) => !Number.isInteger(n) || n < 0 || n > 5)) || new Set(cubes.map((c2) => c2.join(","))).size !== cubes.length) throw Error("Distinct 0..5 grid voxels");
  const occupied = new Set(cubes.map((c2) => c2.join(",")));
  for (const [x, y, z] of cubes) for (let h = 0; h < z; h++) if (!occupied.has([x, y, h].join(","))) throw Error("Unsupported floating stack");
  const projected = (indices) => [...new Set(cubes.map((c2) => indices.map((i) => c2[i]).join(",")))].sort();
  return { count: cubes.length, top: projected([0, 1]), front: projected([0, 2]), side: projected([1, 2]) };
}

// learning-review-r1/native/validators/cube-net.js
var neg = (v) => v.map((x) => -x);
var eq = (a12, b) => a12.every((x, i) => x === b[i]);
function foldCubeNet(net) {
  const cells = net.cells;
  if (!Array.isArray(cells) || cells.length !== 6 || cells.some((c2) => !c2 || !c2.id || !Number.isInteger(c2.x) || !Number.isInteger(c2.y) || Math.abs(c2.x) > 10 || Math.abs(c2.y) > 10) || new Set(cells.map((c2) => c2.id)).size !== 6 || new Set(cells.map((c2) => c2.x + "," + c2.y)).size !== 6) throw Error("Six distinct bounded square cells");
  const frames = /* @__PURE__ */ new Map(), queue = [cells[0]];
  frames.set(cells[0].id, { u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] });
  for (let i = 0; i < queue.length; i++) {
    const c2 = queue[i], f2 = frames.get(c2.id);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = cells.find((p) => p.x === c2.x + dx && p.y === c2.y + dy);
      if (!next) continue;
      const g = dx === 1 ? { u: neg(f2.n), v: f2.v, n: f2.u } : dx === -1 ? { u: f2.n, v: f2.v, n: neg(f2.u) } : dy === 1 ? { u: f2.u, v: neg(f2.n), n: f2.v } : { u: f2.u, v: f2.n, n: neg(f2.v) };
      const old = frames.get(next.id);
      if (old) {
        if (!eq(old.u, g.u) || !eq(old.v, g.v) || !eq(old.n, g.n)) throw Error("Inconsistent folding cycle");
      } else {
        frames.set(next.id, g);
        queue.push(next);
      }
    }
  }
  if (frames.size !== 6) throw Error("Disconnected net");
  if (new Set([...frames.values()].map((f2) => f2.n.join(","))).size !== 6) throw Error("Overlapping folded faces");
  const pairs2 = [];
  for (let i = 0; i < cells.length; i++) for (let j = i + 1; j < cells.length; j++) if (eq(frames.get(cells[i].id).n, neg(frames.get(cells[j].id).n))) pairs2.push([cells[i].id, cells[j].id]);
  if (net.opposites && net.opposites.some(([a12, b]) => !frames.has(a12) || !frames.has(b) || !eq(frames.get(a12).n, neg(frames.get(b).n)))) throw Error("Declared opposite faces disagree with folding");
  return { frames: Object.fromEntries(frames), opposites: pairs2 };
}
function cubeNetValidity(net) {
  try {
    foldCubeNet(net);
    return true;
  } catch {
    return false;
  }
}

// learning-review-r1/native/validators/circle2.js
function circleGeometry(d) {
  if (!d || !["cm", "m"].includes(d.lengthUnit) || !Array.isArray(d.center) || !Array.isArray(d.edge) || [...d.center, ...d.edge].some((n) => !Number.isFinite(n) || Math.abs(n) > 1e4) || d.center.length !== 2 || d.edge.length !== 2) throw Error("Bounded circle coordinates and length unit");
  const radius = Rational.parse(d.radius), diameter = Rational.parse(d.diameter);
  if (radius.numerator <= 0n || !radius.multiply(new Rational(2)).equals(diameter)) throw Error("Positive radius/diameter relation");
  const dx = Rational.parse(d.edge[0]).subtract(Rational.parse(d.center[0])), dy = Rational.parse(d.edge[1]).subtract(Rational.parse(d.center[1]));
  if (!dx.multiply(dx).add(dy.multiply(dy)).equals(radius.multiply(radius))) throw Error("Circle edge is not the declared distance from center");
  if (!["decimal314", "given"].includes(d.piMode) || d.piMode === "decimal314" && d.givenPi !== void 0) throw Error("Explicit elementary pi policy");
  const pi = Rational.parse(d.piMode === "decimal314" ? "3.14" : d.givenPi ?? "");
  if (pi.compare(new Rational(3)) < 0 || pi.compare(new Rational(4)) > 0) throw Error("Elementary provided pi range");
  const circumference = diameter.multiply(pi), area = radius.multiply(radius).multiply(pi);
  if (d.declared?.circumference && !Rational.parse(d.declared.circumference).equals(circumference) || d.declared?.area && !Rational.parse(d.declared.area).equals(area)) throw Error("Declared circle measure disagrees");
  return { radius, diameter, pi, circumference: circumference.toDisplayString(), area: area.toDisplayString(), areaUnit: d.lengthUnit + "\xB2" };
}

// learning-review-r1/native/adapters/primitive-contract.js
var rules = {
  "large-writing4": { grade: 4, code: "4\uC21801-01", objective: "\uD070 \uC218\uC758 \uD55C\uAD6D\uC5B4 \uD45C\uD604\uC744 \uC22B\uC790\uB85C \uC4F0\uAE30" },
  "bar-source-plan4": { grade: 4, code: "4\uC21804-03", objective: "\uC870\uC0AC \uBAA9\uC801\uC5D0 \uB9DE\uAC8C \uD55C \uD559\uC0DD\uC758 \uD55C \uAC00\uC9C0 \uC751\uB2F5\uC744 \uC218\uC9D1\uD558\uAE30" },
  "mixed-op4": { grade: 4, code: "4\uC21801-15", objective: "\uB300\uBD84\uC218 \uB367\uC148\uACFC \uBE84\uC148\uC5D0\uC11C \uC815\uC218 \uBD80\uBD84\uACFC \uBD84\uC218 \uBD80\uBD84 \uC774\uD574\uD558\uAE30" },
  "mixed-op5": { grade: 5, code: "6\uC21801-08", objective: "\uB300\uBD84\uC218\uC758 \uC774\uBD84\uBAA8 \uB367\uC148\uACFC \uBE84\uC148 \uACC4\uC0B0\uD558\uAE30" },
  "mixed-op6": { grade: 6, code: "6\uC21801-11", objective: "\uB300\uBD84\uC218 \uB098\uB217\uC148 \uACC4\uC0B0\uD558\uAE30" },
  "prism-faces": { grade: 6, code: "6\uC21803-05", objective: "\uC0BC\uAC01\uAE30\uB465\uC758 \uBC11\uBA74\uACFC \uC606\uBA74\uC73C\uB85C \uBA74\uC758 \uC218 \uC774\uD574\uD558\uAE30" },
  "curved-solid": { grade: 6, code: "6\uC21803-07", objective: "\uC6D0\uAE30\uB465\uC758 \uBC11\uBA74 \uBAA8\uC591 \uC774\uD574\uD558\uAE30" },
  "graph-plan4": { grade: 4, code: "4\uC21804-03", objective: "\uD0D0\uAD6C \uBAA9\uC801\uC5D0 \uB9DE\uB294 \uC2DC\uAC04 \uC790\uB8CC\uC640 \uADF8\uB798\uD504 \uACE0\uB974\uAE30" },
  "graph-plan6": { grade: 6, code: "6\uC21804-03", objective: "\uC804\uCCB4\uC5D0\uC11C \uAC01 \uBD80\uBD84\uC774 \uCC28\uC9C0\uD558\uB294 \uBE44\uC728\uC5D0 \uC54C\uB9DE\uC740 \uADF8\uB798\uD504 \uACE0\uB974\uAE30" },
  "angle-type": { grade: 4, code: "4\uC21803-02", objective: "\uAC01\uC758 \uD06C\uAE30\uB85C \uC608\uAC01\xB7\uC9C1\uAC01\xB7\uB454\uAC01 \uAD6C\uBCC4\uD558\uAE30", visual: true },
  "line-relation": { grade: 4, code: "4\uC21803-03", objective: "\uB450 \uC9C1\uC120\uC758 \uC218\uC9C1\xB7\uD3C9\uD589 \uAD00\uACC4 \uAD6C\uBCC4\uD558\uAE30", visual: true },
  "transformation": { grade: 4, code: "4\uC21803-04", objective: "\uB3C4\uD615\uC744 \uBC00\uAC70\uB098 \uB4A4\uC9D1\uAC70\uB098 \uB3CC\uB9B0 \uACB0\uACFC \uBE44\uAD50\uD558\uAE30", visual: true },
  "direction": { grade: 4, code: "4\uC21803-05", objective: "\uC704\uCE58\uC5D0\uC11C \uBC29\uD5A5\uC5D0 \uB530\uB77C \uC774\uB3D9\uD55C \uACB0\uACFC \uC124\uBA85\uD558\uAE30" },
  "expression-pattern": { grade: 4, code: "4\uC21802-02", objective: "\uACC4\uC0B0\uC2DD \uBC30\uC5F4\uC758 \uADDC\uCE59\uC73C\uB85C \uB2E4\uC74C \uACB0\uACFC \uAD6C\uD558\uAE30" },
  "equality": { grade: 4, code: "4\uC21802-03", objective: "\uB4F1\uD638 \uC591\uCABD\uC758 \uC591\uC744 \uAC19\uAC8C \uB9CC\uB4E4\uAE30" },
  "decimal-place": { grade: 4, code: "4\uC21801-13", objective: "\uC18C\uC218 \uC14B\uC9F8 \uC790\uB9AC \uC22B\uC790\uC758 \uC790\uB9BF\uAC12 \uC774\uD574\uD558\uAE30" },
  "decimal-compare": { grade: 4, code: "4\uC21801-14", objective: "\uC790\uB9BF\uAC12\uC744 \uB9DE\uCD94\uC5B4 \uC18C\uC218 \uBE44\uAD50\uD558\uAE30" },
  "fraction-compare4": { grade: 4, code: "4\uC21801-11", objective: "\uBD84\uBAA8\uAC00 \uAC19\uC740 \uBD84\uC218 \uBE44\uAD50\uD558\uAE30" },
  "fraction-compare5": { grade: 5, code: "6\uC21801-07", objective: "\uBD84\uBAA8\uAC00 \uB2E4\uB978 \uBD84\uC218 \uBE44\uAD50\uD558\uAE30" },
  "simplify": { grade: 5, code: "6\uC21801-06", objective: "\uBD84\uBAA8\uC640 \uBD84\uC790\uB97C \uAC19\uC740 \uC218\uB85C \uB098\uB204\uC5B4 \uC57D\uBD84\uD558\uAE30" },
  "fraction-decimal": { grade: 5, code: "6\uC21801-12", objective: "\uBD84\uC218\uC640 \uC18C\uC218\uAC00 \uB098\uD0C0\uB0B4\uB294 \uAC19\uC740 \uC591 \uC774\uD574\uD558\uAE30" },
  "multiples": { grade: 5, code: "6\uC21801-05", objective: "\uBC30\uC218\uB97C \uC21C\uC11C\uB300\uB85C \uB098\uC5F4\uD558\uAE30" },
  "correspondence": { grade: 5, code: "6\uC21802-01", objective: "\uB300\uC751\uD45C\uC758 \uB450 \uC591\uC758 \uAD00\uACC4\uB97C \uC774\uC6A9\uD558\uAE30" },
  "range": { grade: 5, code: "6\uC21801-02", objective: "\uC774\uC0C1\xB7\uBBF8\uB9CC\uC5D0\uC11C \uACBD\uACC4 \uD3EC\uD568 \uC5EC\uBD80 \uD310\uB2E8\uD558\uAE30" },
  "congruence": { grade: 5, code: "6\uC21803-01", objective: "\uD569\uB3D9\uC778 \uB450 \uB3C4\uD615\uC758 \uB300\uC751 \uAF2D\uC9D3\uC810 \uCC3E\uAE30", visual: true },
  "symmetry": { grade: 5, code: "6\uC21803-02", objective: "\uB300\uCE6D\uCD95\uC73C\uB85C \uB4A4\uC9D1\uC740 \uB300\uC751 \uB3C4\uD615 \uD655\uC778\uD558\uAE30", visual: true },
  "perimeter": { grade: 5, code: "6\uC21803-11", objective: "\uC9C1\uC0AC\uAC01\uD615\uC758 \uB124 \uBCC0 \uAE38\uC774\uB97C \uB354\uD574 \uB458\uB808 \uAD6C\uD558\uAE30" },
  "regular-polygon": { grade: 4, code: "4\uC21803-11", objective: "\uC815\uB2E4\uAC01\uD615\uC5D0\uC11C \uBCC0\uACFC \uAC01\uC758 \uC870\uAC74 \uC774\uD574\uD558\uAE30", visual: true },
  "tile": { grade: 4, code: "4\uC21803-12", objective: "\uB2E8\uC704 \uC815\uC0AC\uAC01\uD615\uC73C\uB85C \uC9C1\uC0AC\uAC01\uD615 \uCC44\uC6B0\uAE30", visual: true },
  "chance-word": { grade: 5, code: "6\uC21804-04", objective: "\uBD88\uAC00\uB2A5\uD55C \uC0AC\uAC74\uC744 \uAC00\uB2A5\uC131\uC758 \uB9D0\uB85C \uB098\uD0C0\uB0B4\uAE30" },
  "observed-chance": { grade: 5, code: "6\uC21804-06", objective: "\uAD00\uCE21 \uC790\uB8CC\uB97C \uADFC\uAC70\uB85C \uAC00\uB2A5\uC131\uC744 \uC608\uC0C1\uD558\uACE0 \uD55C\uACC4 \uC774\uD574\uD558\uAE30" },
  "stack-view": { grade: 6, code: "6\uC21803-10", objective: "\uC313\uAE30\uB098\uBB34\uB97C \uC704\uC5D0\uC11C \uBCF8 \uBAA8\uC591 \uD655\uC778\uD558\uAE30" },
  "ordered-ratio": { grade: 6, code: "6\uC21802-02", objective: "\uBE44\uAD50\uD558\uB294 \uB450 \uC591\uC758 \uC21C\uC11C\uC5D0 \uB9DE\uAC8C \uBE44 \uB098\uD0C0\uB0B4\uAE30" },
  "measured-pi": { grade: 6, code: "6\uC21803-15", objective: "\uC6D0\uC8FC\uB97C \uC9C0\uB984\uC73C\uB85C \uB098\uB204\uC5B4 \uC6D0\uC8FC\uC728\uC758 \uADFC\uC0BF\uAC12 \uD655\uC778\uD558\uAE30" },
  "rounded-quotient": { grade: 6, code: "6\uC21801-14", objective: "\uC790\uC5F0\uC218 \uBAAB\uC744 \uC815\uD55C \uC790\uB9AC\uAE4C\uC9C0 \uC18C\uC218\uB85C \uBC18\uC62C\uB9BC\uD558\uAE30" },
  "estimate4": { grade: 4, code: "4\uC21801-08", objective: "\uAC00\uAE4C\uC6B4 \uC790\uC5F0\uC218\uB85C \uACF1\uC148 \uACB0\uACFC \uC5B4\uB9BC\uD558\uAE30" }
};
var number = (x) => {
  if (!Number.isSafeInteger(x) || Number(x) < 1 || Number(x) > 1e4) throw Error("Positive bounded natural input");
  return Number(x);
};
function primitiveTask(input) {
  const c2 = rules[input.family];
  if (!c2 || input.grade !== c2.grade || input.code !== c2.code || !upperMathOperatingScope.some((u) => u.grade === input.grade && u.semester === input.semester && u.unitId === input.unitId && u.achievementStandard.includes(input.code))) throw Error("Primitive operating scope");
  if (input.family === "graph-plan4" && (input.semester !== 2 || input.unitId !== "sem2_unit5")) throw Error("Line-graph planning belongs to semester2");
  if (input.family === "mixed-op6" && (input.semester !== 2 || input.unitId !== "sem2_unit1")) throw Error("Mixed/fraction divisor belongs to semester2");
  const d = input.data;
  if (["transformation", "symmetry", "congruence"].includes(input.family)) {
    for (const p of [...d.before, ...d.after]) if (p.length !== 2 || !p.every(Number.isInteger) || p[0] < 0 || p[0] > 12 || p[1] < 0 || p[1] > 7) throw Error("Fixed joint visual uses a bounded integer layout");
  }
  if (input.family === "line-relation") {
    for (const p of d.points) if (p.length !== 2 || !p.every(Number.isInteger) || p[0] < 0 || p[0] > 14 || p[1] < 0 || p[1] > 9) throw Error("Line visual bounds");
  }
  for (const key2 of ["a", "b", "value", "scale", "offset", "circumference", "diameter"]) if (input.family !== "large-writing4" && typeof d[key2] === "string" && /^[+-]?\d+(?:\.\d+|\/\d+)?$/.test(d[key2])) {
    const n = parseSchoolNumber(d[key2]).value;
    if (n.numerator < 0n || n.compare(new Rational(1e5)) > 0 || n.denominator > 1000n) throw Error("Bounded nonnegative elementary value");
  }
  let answer = "", question = "", explanation = "", unit = "";
  const compare = () => {
    const a12 = parseSchoolNumber(String(d.a)).value, b = parseSchoolNumber(String(d.b)).value;
    return a12.compare(b) > 0 ? "\uCCAB \uBC88\uC9F8" : a12.compare(b) < 0 ? "\uB450 \uBC88\uC9F8" : "\uAC19\uC74C";
  };
  switch (input.family) {
    case "large-writing4": {
      const value = String(d.value);
      if (!/^\d{5,16}$/.test(value) || BigInt(value) < 10000n) throw Error("Grade4 big number range");
      const word = koreanInteger(value);
      answer = BigInt(value).toString();
      question = `${word}\uB97C \uC27C\uD45C \uC5C6\uC774 \uC22B\uC790\uB9CC \uC368\uC11C \uB098\uD0C0\uB0B4\uC138\uC694.`;
      explanation = `${word}\uB97C \uC790\uB9BF\uAC12\uC5D0 \uB9DE\uAC8C \uC22B\uC790\uB85C \uC4F0\uBA74 ${answer}\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "bar-source-plan4": {
      if (d.purpose !== "single-favorite-sport") throw Error("Known single-answer survey goal");
      answer = "\uD559\uC0DD\uB9C8\uB2E4 \uAC00\uC7A5 \uC88B\uC544\uD558\uB294 \uC6B4\uB3D9 \uD55C \uAC00\uC9C0\uB9CC \uC751\uB2F5\uD558\uAC8C \uD55C\uB2E4";
      question = "\uD559\uAE09 \uD559\uC0DD\uB4E4\uC774 \uAC00\uC7A5 \uC88B\uC544\uD558\uB294 \uC6B4\uB3D9 \uD55C \uAC00\uC9C0\uB97C \uC870\uC0AC\uD558\uC5EC \uD56D\uBAA9\uBCC4 \uC778\uC6D0\uC744 \uBE44\uAD50\uD558\uB824\uACE0 \uD569\uB2C8\uB2E4. \uBAA9\uC801\uC5D0 \uAC00\uC7A5 \uC54C\uB9DE\uC740 \uC870\uC0AC \uBC29\uBC95\uC744 \uACE0\uB974\uC138\uC694.";
      explanation = "\uD559\uC0DD\uB9C8\uB2E4 \uD55C \uAC00\uC9C0\uC529 \uC751\uB2F5\uC744 \uBC1B\uC544 \uC6B4\uB3D9 \uD56D\uBAA9\uBCC4\uB85C \uC778\uC6D0\uC744 \uC138\uBA74 \uC870\uC0AC \uBAA9\uC801\uC5D0 \uB9DE\uB294 \uC790\uB8CC\uB97C \uC5BB\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      break;
    }
    case "mixed-op4":
    case "mixed-op5":
    case "mixed-op6": {
      const op = d.op;
      if (input.grade === 4 && !["add", "subtract"].includes(op) || input.grade === 5 && !["add", "subtract"].includes(op) || input.grade === 6 && op !== "divide") throw Error("Mapped mixed operation");
      const a12 = parseSchoolNumber(String(d.a)), b = parseSchoolNumber(String(d.b));
      if (![a12.format, b.format].includes("mixed") || a12.format === "decimal" || b.format === "decimal" || a12.value.compare(new Rational(100)) > 0 || b.value.compare(new Rational(100)) > 0 || a12.denominator > 99n || b.denominator > 99n) throw Error("Bounded mixed fraction inputs required");
      if (input.grade === 4 && a12.denominator !== b.denominator) throw Error("Grade4 like denominators");
      answer = schoolOperation(String(d.a), String(d.b), op, "mixed");
      question = `${d.a} ${{ add: "+ ", subtract: "- ", divide: "\xF7 " }[op]}${d.b}\uC744 \uACC4\uC0B0\uD558\uC5EC \uAE30\uC57D\uBD84\uC218\uC778 \uB300\uBD84\uC218 \uB610\uB294 \uC815\uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`;
      explanation = `\uBA3C\uC800 \uB300\uBD84\uC218\uB97C \uAC00\uBD84\uC218\uB85C \uBC14\uAFB8\uC5B4 \uACC4\uC0B0\uD569\uB2C8\uB2E4. ${a12.value.toDisplayString("fraction")} ${{ add: "+ ", subtract: "- ", divide: "\xF7 " }[op]}${b.value.toDisplayString("fraction")}\uC758 \uACB0\uACFC\uB97C \uB300\uBD84\uC218\uB85C \uB098\uD0C0\uB0B4\uBA74 ${answer}\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "prism-faces": {
      if (JSON.stringify(d) !== JSON.stringify({ baseSides: 3, baseFaces: 2, sideFaces: 3 })) throw Error("Known fixed triangular prism");
      answer = "5";
      unit = "\uAC1C";
      question = "\uC0BC\uAC01\uAE30\uB465\uC5D0\uB294 \uC0BC\uAC01\uD615\uC778 \uBC11\uBA74\uC774 2\uAC1C, \uC9C1\uC0AC\uAC01\uD615\uC778 \uC606\uBA74\uC774 3\uAC1C \uC788\uC2B5\uB2C8\uB2E4. \uBA74\uC740 \uBAA8\uB450 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?";
      explanation = "\uBC11\uBA74\uACFC \uC606\uBA74\uC744 \uB354\uD569\uB2C8\uB2E4. 2 + 3 = 5\uAC1C\uC785\uB2C8\uB2E4.";
      break;
    }
    case "curved-solid": {
      if (d.shape !== "cylinder" || Object.keys(d).length !== 1) throw Error("Known fixed cylinder concept");
      answer = "\uC6D0";
      question = "\uC6D0\uAE30\uB465\uC758 \uC11C\uB85C \uD3C9\uD589\uD55C \uB450 \uBC11\uBA74\uC740 \uC5B4\uB5A4 \uD3C9\uBA74\uB3C4\uD615\uC785\uB2C8\uAE4C?";
      explanation = "\uC6D0\uAE30\uB465\uC5D0\uB294 \uD06C\uAE30\uC640 \uBAA8\uC591\uC774 \uAC19\uC740 \uC6D0\uC778 \uBC11\uBA74\uC774 \uB450 \uAC1C \uC788\uC2B5\uB2C8\uB2E4.";
      break;
    }
    case "graph-plan4": {
      if (d.purpose !== "daily-temperature") throw Error("Known fixed temporal exploration");
      answer = "\uAEBE\uC740\uC120\uADF8\uB798\uD504";
      question = "\uC77C\uC8FC\uC77C \uB3D9\uC548 \uB9E4\uC77C \uAC19\uC740 \uC2DC\uAC01\uC758 \uAE30\uC628\uC744 \uC870\uC0AC\uD558\uC5EC \uC2DC\uAC04\uC5D0 \uB530\uB978 \uBCC0\uD654\uB97C \uC54C\uC544\uBCF4\uB824 \uD569\uB2C8\uB2E4. \uB9C9\uB300\uADF8\uB798\uD504\uC640 \uAEBE\uC740\uC120\uADF8\uB798\uD504 \uC911 \uB354 \uC54C\uB9DE\uC740 \uADF8\uB798\uD504\uB97C \uC801\uC73C\uC138\uC694.";
      explanation = "\uC2DC\uAC04 \uC21C\uC11C\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uB294 \uAE30\uC628\uC758 \uBCC0\uD654\uB97C \uB098\uD0C0\uB0B4\uB824\uBA74 \uAEBE\uC740\uC120\uADF8\uB798\uD504\uAC00 \uC54C\uB9DE\uC2B5\uB2C8\uB2E4.";
      break;
    }
    case "graph-plan6": {
      if (d.purpose !== "parts-of-whole") throw Error("Known fixed proportion exploration");
      answer = "\uC6D0\uADF8\uB798\uD504";
      question = "\uD559\uAE09 \uD559\uC0DD \uC804\uC6D0\uC758 \uD76C\uB9DD \uCCB4\uD5D8 \uD65C\uB3D9\uC744 \uD55C \uAC00\uC9C0\uC529 \uC870\uC0AC\uD588\uC2B5\uB2C8\uB2E4. \uC804\uCCB4\uC5D0\uC11C \uAC01 \uD65C\uB3D9\uC744 \uC120\uD0DD\uD55C \uD559\uC0DD\uC758 \uBE44\uC728\uC744 \uD55C\uB208\uC5D0 \uBE44\uAD50\uD558\uB824 \uD569\uB2C8\uB2E4. \uAEBE\uC740\uC120\uADF8\uB798\uD504\uC640 \uC6D0\uADF8\uB798\uD504 \uC911 \uB354 \uC54C\uB9DE\uC740 \uADF8\uB798\uD504\uB97C \uC801\uC73C\uC138\uC694.";
      explanation = "\uC804\uCCB4\uB97C \uD558\uB098\uC758 \uC6D0\uC73C\uB85C \uB098\uD0C0\uB0B4\uACE0 \uAC01 \uBD80\uBD84\uC758 \uBE44\uC728\uC744 \uBE44\uAD50\uD558\uB294 \uC6D0\uADF8\uB798\uD504\uAC00 \uC54C\uB9DE\uC2B5\uB2C8\uB2E4.";
      break;
    }
    case "angle-type":
      answer = angleGeometry(d).type;
      question = "\uAC01\uB3C4\uAE30 \uADF8\uB9BC\uC758 \uAC01\uC740 \uC608\uAC01, \uC9C1\uAC01, \uB454\uAC01 \uC911 \uBB34\uC5C7\uC785\uB2C8\uAE4C?";
      explanation = `\uC9C1\uAC01\uACFC \uD06C\uAE30\uB97C \uBE44\uAD50\uD558\uBA74 ${answer}\uC785\uB2C8\uB2E4.`;
      break;
    case "line-relation": {
      const points = d.points;
      if (points.length !== 4) throw Error("Four line endpoints");
      answer = { parallel: "\uD3C9\uD589", perpendicular: "\uC218\uC9C1", neither: "\uC218\uC9C1\uB3C4 \uD3C9\uD589\uB3C4 \uC544\uB2D8" }[lineRelation(...points)];
      question = "\uADF8\uB9BC\uC758 \uB450 \uC9C1\uC120\uC758 \uAD00\uACC4\uB97C \uC801\uC73C\uC138\uC694.";
      explanation = `\uB450 \uC9C1\uC120\uC744 \uB298\uB824 \uBCF4\uC558\uC744 \uB54C ${answer} \uAD00\uACC4\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "transformation":
    case "symmetry": {
      const a12 = d.before, b = d.after, arg = d.argument, kind = d.kind;
      polygonGeometry(a12);
      polygonGeometry(b);
      if (!["translate", "reflect", "rotate180"].includes(kind) || input.family === "transformation" && (JSON.stringify(transformPolygon(a12, kind, arg)) !== JSON.stringify(b) || JSON.stringify(a12) === JSON.stringify(b))) throw Error("Transformed visual mismatch");
      if (input.family === "symmetry" && kind !== "reflect") throw Error("Fixed line symmetry only");
      answer = input.family === "symmetry" ? JSON.stringify(transformPolygon(a12, "reflect", arg)) === JSON.stringify(b) ? "\uC608" : "\uC544\uB2C8\uC694" : { translate: "\uBC00\uAE30", reflect: "\uB4A4\uC9D1\uAE30", rotate180: "\uB3CC\uB9AC\uAE30" }[kind];
      question = input.family === "symmetry" ? "\uB450 \uADF8\uB9BC\uC740 \uAC00\uC6B4\uB370\uC758 \uC138\uB85C\uC120\uC744 \uB300\uCE6D\uCD95\uC73C\uB85C \uC11C\uB85C \uC120\uB300\uCE6D\uC785\uB2C8\uAE4C?" : "A\uB97C P\uB85C, B\uB97C Q\uB85C, C\uB97C R\uB85C \uC62E\uACA8 \uB3C4\uD615 ABC\uB97C \uB3C4\uD615 PQR\uC5D0 \uB9DE\uCD98 \uBC29\uBC95\uC740 \uBC00\uAE30, \uB4A4\uC9D1\uAE30, \uB3CC\uB9AC\uAE30 \uC911 \uBB34\uC5C7\uC785\uB2C8\uAE4C?";
      explanation = input.family === "symmetry" ? answer === "\uC608" ? "\uC138\uB85C\uC120\uC744 \uAE30\uC900\uC73C\uB85C \uB300\uC751\uC810\uC758 \uB192\uC774\uAC00 \uAC19\uACE0 \uC120\uC5D0\uC11C \uB5A8\uC5B4\uC9C4 \uAC70\uB9AC\uB3C4 \uAC19\uC73C\uBBC0\uB85C \uC120\uB300\uCE6D\uC785\uB2C8\uB2E4." : "\uC138\uB85C\uC120\uC73C\uB85C \uB4A4\uC9D1\uC740 \uB300\uC751\uC810\uC758 \uC704\uCE58\uAC00 \uB450 \uBC88\uC9F8 \uADF8\uB9BC\uACFC \uB2E4\uB974\uBBC0\uB85C \uC774 \uC120\uC5D0 \uB300\uD574 \uC120\uB300\uCE6D\uC774 \uC544\uB2D9\uB2C8\uB2E4." : `\uB300\uC751\uD558\uB294 \uAF2D\uC9D3\uC810\uC744 \uBE44\uAD50\uD558\uBA74 ${answer}\uB85C \uC774\uB3D9\uD55C \uAC83\uC744 \uC54C \uC218 \uC788\uC2B5\uB2C8\uB2E4.`;
      break;
    }
    case "direction": {
      if (JSON.stringify(d) !== JSON.stringify({ steps: ["\uC624\uB978\uCABD", "\uC624\uB978\uCABD", "\uC704\uCABD"] })) throw Error("Limited fixed direction path");
      answer = "\uC624\uB978\uCABD \uB450 \uCE78, \uC704\uCABD \uD55C \uCE78";
      question = "\uCD9C\uBC1C\uC810\uC5D0\uC11C \uC624\uB978\uCABD\uC73C\uB85C \uD55C \uCE78\uC529 \uB450 \uBC88, \uC704\uCABD\uC73C\uB85C \uD55C \uCE78 \uC774\uB3D9\uD588\uC2B5\uB2C8\uB2E4. \uCD9C\uBC1C\uC810\uC5D0\uC11C \uB3C4\uCC29\uC810\uAE4C\uC9C0\uC758 \uC704\uCE58\uB97C \uB9D0\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.";
      explanation = "\uC624\uB978\uCABD \uC774\uB3D9 \uB450 \uBC88\uC744 \uD569\uD558\uACE0 \uC704\uCABD \uC774\uB3D9 \uD55C \uBC88\uC744 \uD568\uAED8 \uB098\uD0C0\uB0C5\uB2C8\uB2E4.";
      break;
    }
    case "expression-pattern": {
      const factor = number(d.factor);
      answer = String(factor * 4);
      question = `${factor} \xD7 1 = ${factor}, ${factor} \xD7 2 = ${factor * 2}, ${factor} \xD7 3 = ${factor * 3}\uC785\uB2C8\uB2E4. \uAC19\uC740 \uADDC\uCE59\uC73C\uB85C ${factor} \xD7 4\uC758 \uACB0\uACFC\uB97C \uAD6C\uD558\uC138\uC694.`;
      explanation = `\uACF1\uD558\uB294 \uC218\uAC00 1\uC529 \uB298\uBA74 \uACB0\uACFC\uB294 ${factor}\uC529 \uB298\uC5B4\uB0A9\uB2C8\uB2E4. ${factor * 3} + ${factor} = ${answer}\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "equality": {
      const a12 = number(d.a), b = number(d.b);
      if (b < a12) throw Error("Nonnegative missing amount");
      answer = String(b - a12);
      question = `${a12} + \u25A1 = ${b}\uC785\uB2C8\uB2E4. \u25A1\uC5D0 \uB4E4\uC5B4\uAC08 \uC218\uB97C \uAD6C\uD558\uC138\uC694.`;
      explanation = `\uB4F1\uD638 \uC591\uCABD\uC774 \uAC19\uC544\uC57C \uD569\uB2C8\uB2E4. ${b} - ${a12} = ${answer}\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "decimal-place": {
      const text = String(d.value);
      if (!/^\d\.\d{3}$/.test(text)) throw Error("Three-place decimal");
      answer = new Rational(Number(text.at(-1)), 1e3).toDisplayString("decimal");
      question = `${text}\uC5D0\uC11C \uC18C\uC218 \uC14B\uC9F8 \uC790\uB9AC \uC22B\uC790\uAC00 \uB098\uD0C0\uB0B4\uB294 \uAC12\uC740 \uBB34\uC5C7\uC785\uB2C8\uAE4C?`;
      explanation = `\uC18C\uC218 \uC14B\uC9F8 \uC790\uB9AC\uB294 0.001\uC774 \uBA87 \uAC1C\uC778\uC9C0 \uB098\uD0C0\uB0C5\uB2C8\uB2E4. \uADF8 \uC22B\uC790\uAC00 \uB098\uD0C0\uB0B4\uB294 \uAC12\uC740 ${answer}\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "decimal-compare":
    case "fraction-compare4":
    case "fraction-compare5": {
      if (input.family === "decimal-compare" && [d.a, d.b].some((v) => !/^\d+\.\d{1,3}$/.test(String(v)))) throw Error("Grade4 comparison requires decimal notation, at most three places");
      if (input.family.startsWith("fraction-compare") && [d.a, d.b].some((v) => !/^\d+\/\d+$/.test(String(v)))) throw Error("This fraction comparison profile requires explicit fraction notation");
      if (input.family === "fraction-compare5" && String(d.a).split("/")[1] === String(d.b).split("/")[1]) throw Error("Grade5 target is unlike denominator comparison");
      if (input.family === "fraction-compare4" && String(d.a).split("/")[1] !== String(d.b).split("/")[1]) throw Error("Grade4 like denominators");
      answer = compare();
      question = `\uCCAB \uBC88\uC9F8 \uC218 ${d.a}\uC640 \uB450 \uBC88\uC9F8 \uC218 ${d.b} \uC911 \uD070 \uC218\uB97C \uACE0\uB974\uC138\uC694. \uAC19\uC73C\uBA74 '\uAC19\uC74C'\uC774\uB77C\uACE0 \uC801\uC73C\uC138\uC694.`;
      explanation = input.family === "decimal-compare" ? "\uC18C\uC218\uC810 \uC704\uCE58\uB97C \uB9DE\uCD94\uACE0 \uB192\uC740 \uC790\uB9BF\uAC12\uBD80\uD130 \uBE44\uAD50\uD569\uB2C8\uB2E4." : input.family === "fraction-compare4" ? "\uBD84\uBAA8\uAC00 \uAC19\uC73C\uBBC0\uB85C \uBD84\uC790\uB97C \uBE44\uAD50\uD569\uB2C8\uB2E4." : "\uBD84\uBAA8\uB97C \uAC19\uAC8C \uB9CC\uB4E0 \uB4A4 \uBD84\uC790\uB97C \uBE44\uAD50\uD569\uB2C8\uB2E4.";
      explanation += ` \uACB0\uACFC\uB294 ${answer}\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "simplify":
    case "fraction-decimal": {
      const value = parseSchoolNumber(String(d.value)).value;
      answer = value.toDisplayString(input.family === "simplify" ? "fraction" : "decimal");
      question = input.family === "simplify" ? `${d.value}\uB97C \uAE30\uC57D\uBD84\uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.` : `${d.value}\uC640 \uAC19\uC740 \uAC12\uC744 \uC18C\uC218\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.`;
      explanation = input.family === "simplify" ? `\uBD84\uBAA8\uC640 \uBD84\uC790\uB97C \uAC19\uC740 \uC218\uB85C \uB098\uB204\uBA74 ${answer}\uC785\uB2C8\uB2E4.` : `\uBD84\uBAA8\uB97C 10, 100, 1000 \uC911 \uC54C\uB9DE\uC740 \uC218\uB85C \uB9CC\uB4E4\uBA74 ${answer}\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "multiples": {
      const n = number(d.n), count = number(d.count);
      answer = multiples(n, count).join(",");
      question = `${n}\uC758 \uBC30\uC218\uB97C \uC791\uC740 \uC218\uBD80\uD130 ${count}\uAC1C \uC27C\uD45C\uB85C \uAD6C\uBD84\uD558\uC5EC \uC801\uC73C\uC138\uC694.`;
      explanation = `${n}\uC5D0 1\uBD80\uD130 ${count}\uAE4C\uC9C0 \uCC28\uB840\uB85C \uACF1\uD558\uBA74 ${answer}\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "correspondence": {
      const rows2 = d.rows;
      correspondence(rows2, String(d.scale), String(d.offset));
      if (d.offset !== "0") throw Error("Fixed multiplicative relation");
      answer = new Rational(number(d.input)).multiply(parseSchoolNumber(String(d.scale)).value).toDisplayString();
      question = `\u25A1\uC640 \u25B3\uC758 \uB300\uC751\uD45C\uAC00 ${rows2.map((r2) => `\u25A1 ${r2.x} \u2192 \u25B3 ${r2.y}`).join(", ")}\uC785\uB2C8\uB2E4. \u25B3\uB294 \u25A1\uC758 ${d.scale}\uBC30\uC785\uB2C8\uB2E4. \u25A1\uAC00 ${d.input}\uC77C \uB54C \u25B3\uB294 \uC5BC\uB9C8\uC785\uB2C8\uAE4C?`;
      explanation = `\uB300\uC751\uD558\uB294 \uB450 \uC591\uC758 \uAD00\uACC4\uB97C \uC0AC\uC6A9\uD569\uB2C8\uB2E4. ${d.input} \xD7 ${d.scale} = ${answer}\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "range": {
      if (d.includeLower !== true || d.includeUpper !== false) throw Error("Fixed inclusive/exclusive bounds");
      answer = inRange(String(d.value), String(d.lower), String(d.upper), true, false) ? "\uC608" : "\uC544\uB2C8\uC694";
      question = `${d.value}\uB294 ${d.lower} \uC774\uC0C1 ${d.upper} \uBBF8\uB9CC\uC5D0 \uD3EC\uD568\uB429\uB2C8\uAE4C?`;
      explanation = `${d.lower}\uB294 \uD3EC\uD568\uD558\uACE0 ${d.upper}\uB294 \uD3EC\uD568\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uACBD\uACC4\uC640 \uBE44\uAD50\uD55C \uB2F5\uC740 ${answer}\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "congruence": {
      const a12 = d.before, b = d.after, pairs2 = d.pairs;
      polygonGeometry(a12);
      polygonGeometry(b);
      const g = polygonGeometry(a12);
      if (a12.length !== 3 || new Set(g.sides).size !== 3) throw Error("Fixed correspondence uses a scalene triangle");
      verifyCorrespondence(a12, b, pairs2);
      answer = String.fromCharCode(80 + pairs2[0]);
      question = "\uB3C4\uD615 ABC\uC640 \uB3C4\uD615 PQR\uC740 \uD569\uB3D9\uC785\uB2C8\uB2E4. \uADF8\uB9BC\uC5D0 \uD45C\uC2DC\uB41C \uBCC0\uC758 \uAE38\uC774 \uAD00\uACC4\uB97C \uC774\uC6A9\uD558\uC5EC A\uC5D0 \uB300\uC751\uD558\uB294 \uAF2D\uC9D3\uC810\uC744 \uCC3E\uC73C\uC138\uC694.";
      explanation = `\uB300\uC751\uD558\uB294 \uBCC0\uACFC \uAC01\uC744 \uD655\uC778\uD558\uBA74 A\uC640 ${answer}\uAC00 \uB300\uC751\uD569\uB2C8\uB2E4.`;
      break;
    }
    case "perimeter": {
      const a12 = number(d.width), b = number(d.height);
      answer = String(2 * (a12 + b));
      unit = "cm";
      question = `\uAC00\uB85C ${a12} cm, \uC138\uB85C ${b} cm\uC778 \uC9C1\uC0AC\uAC01\uD615\uC758 \uB458\uB808\uB294 \uBA87 cm\uC785\uB2C8\uAE4C?`;
      explanation = `\uB124 \uBCC0\uC758 \uAE38\uC774\uB97C \uB354\uD569\uB2C8\uB2E4. ${a12} + ${b} + ${a12} + ${b} = ${answer} cm\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "regular-polygon": {
      answer = polygonGeometry(d.vertices).regular ? "\uC608" : "\uC544\uB2C8\uC694";
      question = "\uADF8\uB9BC\uC5D0\uC11C \uBAA8\uB4E0 \uBCC0\uC758 \uAE38\uC774\uAC00 \uAC19\uACE0 \uBAA8\uB4E0 \uAC01\uC758 \uD06C\uAE30\uB3C4 \uAC19\uC2B5\uB2C8\uB2E4. \uC774 \uB3C4\uD615\uC740 \uC815\uB2E4\uAC01\uD615\uC785\uB2C8\uAE4C?";
      if (answer !== "\uC608") throw Error("Fixed regular example");
      explanation = "\uBAA8\uB4E0 \uBCC0\uC758 \uAE38\uC774\uAC00 \uAC19\uACE0 \uBAA8\uB4E0 \uAC01\uC758 \uD06C\uAE30\uB3C4 \uAC19\uC73C\uBBC0\uB85C \uC815\uB2E4\uAC01\uD615\uC785\uB2C8\uB2E4.";
      break;
    }
    case "tile": {
      const a12 = number(d.columns), b = number(d.rows);
      if (a12 > 6 || b > 6) throw Error("36-cell visual bound");
      answer = String(a12 * b);
      unit = "\uAC1C";
      question = "\uADF8\uB9BC\uC758 \uC9C1\uC0AC\uAC01\uD615\uC744 \uBE48\uD2C8\uC5C6\uC774 \uCC44\uC6B4 \uAC19\uC740 \uD06C\uAE30\uC758 \uC815\uC0AC\uAC01\uD615\uC740 \uBAA8\uB450 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?";
      explanation = `\uD55C \uC904\uC5D0 ${a12}\uAC1C\uC529 ${b}\uC904\uC785\uB2C8\uB2E4. ${a12} \xD7 ${b} = ${answer}\uAC1C\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "chance-word": {
      if (probability(d.outcomes, d.event) !== "0") throw Error("Fixed impossible event");
      answer = "\uBD88\uAC00\uB2A5\uD558\uB2E4";
      question = "\uD30C\uB780 \uACF5\uB9CC \uB4E4\uC5B4 \uC788\uB294 \uC8FC\uBA38\uB2C8\uC5D0\uC11C \uACF5 \uD55C \uAC1C\uB97C \uAEBC\uB0C5\uB2C8\uB2E4. \uBE68\uAC04 \uACF5\uC774 \uB098\uC624\uB294 \uAC00\uB2A5\uC131\uC744 \uB9D0\uB85C \uB098\uD0C0\uB0B4\uC138\uC694.";
      if (JSON.stringify(d) !== JSON.stringify({ outcomes: [{ id: "\uD30C\uB780 \uACF5", weight: 3 }], event: [] })) throw Error("Story/sample-space agreement");
      explanation = "\uC8FC\uBA38\uB2C8\uC5D0 \uBE68\uAC04 \uACF5\uC774 \uC5C6\uC73C\uBBC0\uB85C \uBE68\uAC04 \uACF5\uC774 \uB098\uC624\uB294 \uC77C\uC740 \uBD88\uAC00\uB2A5\uD569\uB2C8\uB2E4.";
      break;
    }
    case "observed-chance": {
      const a12 = number(d.a), b = number(d.b);
      if (a12 <= b) throw Error("Fixed greater observed count");
      answer = "\uCCAB \uBC88\uC9F8 \uACB0\uACFC";
      question = `\uAC19\uC740 \uC2E4\uD5D8 ${a12 + b}\uD68C\uC5D0\uC11C \uCCAB \uBC88\uC9F8 \uACB0\uACFC ${a12}\uD68C, \uB450 \uBC88\uC9F8 \uACB0\uACFC ${b}\uD68C\uAC00 \uB098\uC654\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08 \uC790\uB8CC\uB97C \uADFC\uAC70\uB85C \uB354 \uC790\uC8FC \uB098\uC62C \uAC83\uC73C\uB85C \uC608\uC0C1\uD558\uB294 \uACB0\uACFC\uB294 \uBB34\uC5C7\uC785\uB2C8\uAE4C? \uB2E4\uC74C \uD55C \uBC88\uC758 \uACB0\uACFC\uAC00 \uD655\uC815\uB41C\uB2E4\uB294 \uB73B\uC740 \uC544\uB2D9\uB2C8\uB2E4.`;
      explanation = `\uAD00\uCE21 \uD69F\uC218 ${a12}\uD68C\uAC00 ${b}\uD68C\uBCF4\uB2E4 \uB9CE\uC73C\uBBC0\uB85C \uCCAB \uBC88\uC9F8 \uACB0\uACFC\uB97C \uB354 \uC790\uC8FC \uB098\uC62C \uAC83\uC73C\uB85C \uC608\uC0C1\uD569\uB2C8\uB2E4. \uAD00\uCE21\uB9CC\uC73C\uB85C \uB2E4\uC74C \uACB0\uACFC\uB97C \uD655\uC815\uD560 \uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4.`;
      break;
    }
    case "stack-view": {
      const view = stackViews(d.cubes);
      answer = String(view.top.length);
      question = `\uC313\uAE30\uB098\uBB34\uC758 \uBC14\uB2E5 \uC790\uB9AC\uB9C8\uB2E4 \uC313\uC740 \uB192\uC774\uAC00 ${d.heights.join(", ")}\uAC1C\uC785\uB2C8\uB2E4. \uC704\uC5D0\uC11C \uBCF4\uC544 \uB4DC\uB7EC\uB098\uB294 \uBC14\uB2E5 \uC790\uB9AC\uB294 \uBA87 \uAC1C\uC785\uB2C8\uAE4C?`;
      if (JSON.stringify(d.cubes) !== JSON.stringify(d.heights.flatMap((h, x) => Array.from({ length: h }, (_, z) => [x, 0, z])))) throw Error("Declared heights mismatch");
      explanation = `\uC704\uC5D0\uC11C \uBCF4\uBA74 \uAC19\uC740 \uBC14\uB2E5 \uC790\uB9AC\uC5D0 \uC313\uC778 \uBE14\uB85D\uB4E4\uC740 \uACB9\uCCD0 \uBCF4\uC785\uB2C8\uB2E4. \uBC14\uB2E5 \uC790\uB9AC\uB294 ${answer}\uAC1C\uC785\uB2C8\uB2E4.`;
      unit = "\uAC1C";
      break;
    }
    case "ordered-ratio": {
      const a12 = number(d.a), b = number(d.b);
      answer = `${a12}:${b}`;
      question = `\uBE68\uAC04 \uB9AC\uBCF8 ${a12}\uAC1C, \uD30C\uB780 \uB9AC\uBCF8 ${b}\uAC1C\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uBE68\uAC04 \uB9AC\uBCF8 \uC218\uC5D0 \uB300\uD55C \uD30C\uB780 \uB9AC\uBCF8 \uC218\uC758 \uBE44\uB97C, \uC8FC\uC5B4\uC9C4 \uC218\uB97C \uADF8\uB300\uB85C \uC0AC\uC6A9\uD558\uC5EC \uB098\uD0C0\uB0B4\uC138\uC694.`;
      answer = `${b}:${a12}`;
      explanation = `\uBE44\uAD50\uD558\uB294 \uC591\uC774 \uD30C\uB780 \uB9AC\uBCF8 ${b}\uAC1C\uC774\uACE0 \uAE30\uC900\uB7C9\uC774 \uBE68\uAC04 \uB9AC\uBCF8 ${a12}\uAC1C\uC774\uBBC0\uB85C ${answer}\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "measured-pi": {
      const c3 = String(d.circumference), diameter = String(d.diameter);
      if (!parseSchoolNumber(c3).value.divide(parseSchoolNumber(diameter).value).equals(new Rational(314, 100))) throw Error("Bounded fixed measured-circle examples use a verified3.14 ratio");
      answer = roundExact(parseSchoolNumber(c3).value.divide(parseSchoolNumber(diameter).value).toDisplayString("fraction"), 2, "round");
      question = `\uCE21\uC815\uD55C \uC6D0\uC8FC\uB294 ${c3} cm, \uC9C0\uB984\uC740 ${diameter} cm\uC785\uB2C8\uB2E4. \uC774 \uC790\uB8CC\uC5D0\uC11C \uC6D0\uC8FC \xF7 \uC9C0\uB984\uC758 \uAC12\uC744 \uC18C\uC218 \uB458\uC9F8 \uC790\uB9AC\uAE4C\uC9C0 \uBC18\uC62C\uB9BC\uD558\uC5EC \uAD6C\uD558\uC138\uC694.`;
      explanation = `\uC6D0\uC8FC\uB97C \uC9C0\uB984\uC73C\uB85C \uB098\uB208 \uBE44\uAC00 \uC6D0\uC8FC\uC728\uC758 \uADFC\uC0BF\uAC12\uC785\uB2C8\uB2E4. \uCE21\uC815 \uC790\uB8CC\uC758 \uBE44\uB97C \uBC18\uC62C\uB9BC\uD558\uBA74 ${answer}\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "rounded-quotient": {
      const a12 = number(d.a), b = number(d.b);
      answer = roundExact(new Rational(a12, b).toDisplayString("fraction"), 2, "round");
      question = `${a12} \xF7 ${b}\uC758 \uBAAB\uC744 \uC18C\uC218 \uB458\uC9F8 \uC790\uB9AC\uAE4C\uC9C0 \uBC18\uC62C\uB9BC\uD558\uC5EC \uB098\uD0C0\uB0B4\uC138\uC694.`;
      explanation = `\uB098\uB217\uC148\uC758 \uBAAB\uC5D0\uC11C \uC18C\uC218 \uC14B\uC9F8 \uC790\uB9AC \uC22B\uC790\uB97C \uBCF4\uACE0 \uBC18\uC62C\uB9BC\uD558\uBA74 ${answer}\uC785\uB2C8\uB2E4.`;
      break;
    }
    case "estimate4": {
      const a12 = number(d.a), b = number(d.b);
      if (a12 < 100 || b < 10 || b > 99) throw Error("Grade4 estimation scope");
      const x = Math.round(a12 / 100) * 100, y = Math.round(b / 10) * 10;
      answer = String(x * y);
      question = `${a12} \xD7 ${b}\uC744 \uC5B4\uB9BC\uD569\uB2C8\uB2E4. ${a12}\uB294 \uBC31\uC758 \uC790\uB9AC\uAE4C\uC9C0, ${b}\uB294 \uC2ED\uC758 \uC790\uB9AC\uAE4C\uC9C0 \uBC18\uC62C\uB9BC\uD55C \uB4A4 \uACF1\uD558\uBA74 \uC5BC\uB9C8\uC785\uB2C8\uAE4C?`;
      explanation = `${a12}\uB97C ${x}\uB85C, ${b}\uB97C ${y}\uB85C \uC5B4\uB9BC\uD558\uBA74 ${x} \xD7 ${y} = ${answer}\uC785\uB2C8\uB2E4.`;
      break;
    }
    default:
      throw Error("Primitive family not integrated");
  }
  return { question, answer, explanation, unit, objective: c2.objective, visual: !!c2.visual };
}
function solvePrimitiveModel(m) {
  return primitiveTask(m.data.fixture).answer;
}

// learning-review-r1/native/validators/lab2.js
var lab2Contracts = { mixed: { grade: 4, code: "4\uC21801-10", unit: "" }, angle: { grade: 4, code: "4\uC21803-24", unit: "\xB0" }, "triangle-angle": { grade: 4, code: "4\uC21803-09", unit: "" }, "triangle-side": { grade: 4, code: "4\uC21803-08", unit: "" }, quadrilateral: { grade: 4, code: "4\uC21803-10", unit: "" }, "angle-sum": { grade: 4, code: "4\uC21803-25", unit: "\xB0" }, "cube-net": { grade: 5, code: "6\uC21803-04", unit: "" }, "solid-faces": { grade: 5, code: "6\uC21803-03", unit: "\uAC1C" }, volume: { grade: 6, code: "6\uC21803-19", unit: "cm\xB3" }, surface: { grade: 6, code: "6\uC21803-17", unit: "cm\xB2" }, circumference: { grade: 6, code: "6\uC21803-16", unit: "cm" }, "circle-area": { grade: 6, code: "6\uC21803-16", unit: "cm\xB2" }, round: { grade: 5, code: "6\uC21801-03", unit: "" }, divisors: { grade: 5, code: "6\uC21801-04", unit: "" }, sequence: { grade: 4, code: "4\uC21802-01", unit: "" }, probability: { grade: 5, code: "6\uC21804-05", unit: "" }, "large-reading": { grade: 4, code: "4\uC21801-01", unit: "" }, stack: { grade: 6, code: "6\uC21803-09", unit: "\uAC1C" } };
function solveLab2(q) {
  const d = q.data;
  switch (q.family) {
    case "mixed":
      return parseSchoolNumber(String(d.source)).value.toDisplayString("mixed");
    case "angle":
      return String(Math.round(angleGeometry(d).degrees * 1e6) / 1e6);
    case "triangle-angle":
      return polygonGeometry(d.vertices).types.find((t) => ["\uC9C1\uAC01\uC0BC\uAC01\uD615", "\uC608\uAC01\uC0BC\uAC01\uD615", "\uB454\uAC01\uC0BC\uAC01\uD615"].includes(t));
    case "triangle-side": {
      const t = polygonGeometry(d.vertices).types;
      return t.includes("\uC815\uC0BC\uAC01\uD615") ? "\uC815\uC0BC\uAC01\uD615" : t.includes("\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615") ? "\uC774\uB4F1\uBCC0\uC0BC\uAC01\uD615" : "\uC77C\uBC18 \uC0BC\uAC01\uD615";
    }
    case "quadrilateral": {
      const t = polygonGeometry(d.vertices, d.trapezoidPolicy).types;
      return ["\uC815\uC0AC\uAC01\uD615", "\uC9C1\uC0AC\uAC01\uD615", "\uB9C8\uB984\uBAA8", "\uD3C9\uD589\uC0AC\uBCC0\uD615", "\uC0AC\uB2E4\uB9AC\uAF34"].find((s) => t.includes(s)) ?? "\uD574\uB2F9 \uC5C6\uC74C";
    }
    case "angle-sum":
      return String(polygonGeometry(d.vertices).angleSum);
    case "cube-net":
      return cubeNetValidity(d) ? "\uC608" : "\uC544\uB2C8\uC694";
    case "solid-faces":
      return String(solidGeometry(d).faces);
    case "volume":
      return solidGeometry(d).volumeExact;
    case "surface":
      return String(solidGeometry(d).surfaceArea);
    case "circumference":
      return circleGeometry(d).circumference;
    case "circle-area":
      return circleGeometry(d).area;
    case "round":
      return roundExact(String(d.value), Number(d.places), d.mode);
    case "divisors":
      return divisors(Number(d.n)).join(",");
    case "sequence":
      return sequenceRule(d.values, d.rule);
    case "probability":
      return probability(d.outcomes, d.event);
    case "large-reading":
      return koreanInteger(String(d.value));
    case "stack":
      return String(stackViews(d.cubes).count);
    default:
      throw Error("Unregistered laboratory model");
  }
}
function validateLab2(q) {
  try {
    const c2 = lab2Contracts[q.family];
    if (!c2) return ["Unregistered capability"];
    const issues = [];
    if (q.grade !== c2.grade || q.achievementStandard !== c2.code || q.unit !== c2.unit || !upperMathOperatingScope.some((u) => u.grade === q.grade && u.semester === q.semester && u.unitId === q.unitId && u.achievementStandard.includes(q.achievementStandard))) issues.push("Curriculum/grade/unit mismatch");
    if (!q.id || !q.question || !q.explanation || /NaN|Infinity|undefined|\bnull\b|\[object Object\]/.test(JSON.stringify([q.question, q.explanation, q.unit, q.expected, q.data]))) issues.push("Unsafe student field");
    if (/코사인|내적|벡터|삼각비|행렬/.test(q.explanation)) issues.push("Term outside elementary curriculum");
    if (q.family === "angle-sum" && (q.data.vertices?.length ?? 0) > 4) issues.push("Grade4 angle sum only triangle/quadrilateral");
    issues.push(...verifyExplanationEquations({ explanation: q.explanation }));
    if (["volume", "surface", "solid-faces"].includes(q.family) && !["cuboid", "cube"].includes(String(q.data.shape))) issues.push("This operating objective admits cuboids/cubes only");
    const expected = solveLab2(q);
    if (expected !== q.expected) issues.push("Independent answer disagreement");
    return issues;
  } catch (e) {
    return [e.message];
  }
}

// learning-review-r1/native/adapters/lab-contract.js
function solveIntegratedModel(m) {
  if (m.data.adapter === "quality-patch") return solveQualityPatch(m);
  if (m.data.adapter === "upper-authored") return solveAuthoredModel(m);
  if (m.data.adapter === "fixed-net") return solveFixedNetModel(m);
  if (m.data.adapter === "primitive") return solvePrimitiveModel(m);
  if (m.data.adapter !== "lab2" || !m.data.fixture || typeof m.data.fixture !== "object") throw Error("Known capability adapter required");
  const q = m.data.fixture;
  const errors = validateLab2(q);
  if (errors.length) throw Error(errors.join(";"));
  return solveLab2(q);
}

// learning-review-r1/native/validators/math-model.js
var number2 = (v) => {
  if (typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > 1e7) throw Error("Invalid finite value");
  return v;
};
var integer = (v) => {
  const n = number2(v);
  if (!Number.isSafeInteger(n)) throw Error("Integer required");
  return n;
};
var positive2 = (v) => {
  const n = number2(v);
  if (n <= 0) throw Error("Positive value required");
  return n;
};
var array = (v) => {
  if (!Array.isArray(v) || v.length < 1 || v.length > 100) throw Error("Bounded array required");
  return v;
};
var object = (v) => {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw Error("Object required");
  return v;
};
function parseExact(v) {
  const s = String(v), match = /^([+-]?\d+)(?:\.(\d+))?(?:\/(\d+))?$/.exec(s);
  if (!match) throw Error("Exact numeric literal required");
  const decimal = match[2] ?? "", negative = match[1].startsWith("-");
  const n = BigInt(match[1].replace(/^[+-]/, "") + decimal) * (negative ? -1n : 1n), d = 10n ** BigInt(decimal.length) * BigInt(match[3] ?? 1);
  if (!d) throw Error("Zero denominator");
  return [n, d];
}
function canonical2([n, d]) {
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  let a12 = n < 0n ? -n : n, b = d;
  while (b) [a12, b] = [b, a12 % b];
  n /= a12 || 1n;
  d /= a12 || 1n;
  return d === 1n ? String(n) : `${n}/${d}`;
}
function equivalent(a12, b) {
  try {
    const x = parseExact(a12), y = parseExact(b);
    return x[0] * y[1] === y[0] * x[1];
  } catch {
    try {
      return parseSchoolNumber(a12).value.equals(parseSchoolNumber(b).value);
    } catch {
      return a12 === b;
    }
  }
}
function rpn(data) {
  const stack = [];
  for (const raw of array(data.tokens)) {
    if (typeof raw !== "string" && typeof raw !== "number") throw Error("Invalid token");
    if (["+", "-", "*", "/", "%", "floor/", "ceil/", "max", "min"].includes(String(raw))) {
      if (stack.length < 2) throw Error("Expression arity");
      const [bn, bd] = stack.pop(), [an, ad] = stack.pop();
      let x;
      if (raw === "+") x = [an * bd + bn * ad, ad * bd];
      else if (raw === "-") x = [an * bd - bn * ad, ad * bd];
      else if (raw === "*") x = [an * bn, ad * bd];
      else if (raw === "/") {
        if (!bn) throw Error("Division by zero");
        x = [an * bd, ad * bn];
      } else if (raw === "floor/" || raw === "ceil/" || raw === "%") {
        if (ad !== 1n || bd !== 1n || an < 0n || bn <= 0n) throw Error("Natural quotient/remainder operands");
        x = [raw === "floor/" ? an / bn : raw === "ceil/" ? (an + bn - 1n) / bn : an % bn, 1n];
      } else x = (raw === "max" ? an * bd >= bn * ad : an * bd <= bn * ad) ? [an, ad] : [bn, bd];
      stack.push(x);
    } else {
      const value = typeof raw === "string" && Object.hasOwn(data, raw) ? data[raw] : raw;
      if (typeof value !== "string" && typeof value !== "number") throw Error("Unknown expression binding");
      stack.push(parseExact(value));
    }
  }
  if (stack.length !== 1) throw Error("Expression arity");
  return canonical2(stack[0]);
}
function geometry(m) {
  if (m.data.vertices !== void 0) return solvePlanarArea(m);
  const d = m.data, shape = String(d.shape);
  let sides = [], angles = [];
  if (d.sides !== void 0) sides = array(d.sides).map(positive2);
  if (d.angles !== void 0) angles = array(d.angles).map(positive2);
  if (shape === "triangle") {
    if (sides.length && sides.length !== 3 || angles.length && angles.length !== 3) throw Error("Triangle arity");
    if (sides.length && sides.some((s) => s >= sides.reduce((a12, b) => a12 + b, 0) - s)) throw Error("Triangle inequality");
    if (angles.length && (angles.some((a12) => a12 >= 180) || Math.abs(angles.reduce((a12, b) => a12 + b, 0) - 180) > 1e-8)) throw Error("Triangle angles");
  } else if (shape === "rectangle" || shape === "square") {
    if (sides.length !== 4 || angles.length !== 4 || angles.some((a12) => a12 !== 90) || sides[0] !== sides[2] || sides[1] !== sides[3] || shape === "square" && new Set(sides).size !== 1) throw Error("Rectangle/square conditions");
  } else if (shape === "circle") {
    const r2 = positive2(d.radius);
    if (d.diameter !== void 0 && number2(d.diameter) !== 2 * r2) throw Error("Circle radius/diameter mismatch");
  } else if (shape === "line" || shape === "ray" || shape === "segment") {
    if (d.lineCode !== void 0 && ["line", "ray", "segment"][integer(d.lineCode)] !== shape) throw Error("Line code/shape mismatch");
    const points = array(d.points).map((x) => array(x).map(number2));
    if (points.length < 2 || points.some((x) => x.length !== 2) || new Set(points.map((x) => x.join(","))).size !== points.length) throw Error("Distinct two-dimensional points required");
    const [a12, b] = points;
    for (const p of points) if ((b[0] - a12[0]) * (p[1] - a12[1]) !== (b[1] - a12[1]) * (p[0] - a12[0])) throw Error("Collinearity");
  } else if (shape === "circle-segments") {
    const r2 = positive2(d.radius), points = object(d.points);
    for (const [label, raw] of Object.entries(points)) {
      const point4 = array(raw).map(number2);
      if (point4.length !== 2 || !label.trim() || label !== "O" && Math.abs(point4[0] ** 2 + point4[1] ** 2 - r2 ** 2) > 1e-8 || label === "O" && point4.some((v) => v !== 0)) throw Error("Point is not center or on circle");
    }
    if (!points.O) throw Error("Missing circle center");
  } else if (shape === "angle-pair") {
    const pair = array(d.angles).map(number2);
    if (pair.length !== 2 || pair.some((a12) => a12 <= 0 || a12 >= 180)) throw Error("Two nondegenerate angles required");
  } else if (shape === "angle") {
    const a12 = number2(d.angle);
    if (a12 <= 0 || a12 >= 180) throw Error("Elementary angle range");
  } else if (shape === "transform") {
    if (!["up", "right", "down", "left"].includes(String(d.direction)) || !Array.isArray(d.operations) || d.operations.length > 8) throw Error("Transform model");
  } else throw Error("Unsupported geometry shape");
  if (shape === "triangle" && sides.length && angles.length) {
    for (let i = 0; i < 3; i++) {
      const a12 = sides[i], b = sides[(i + 1) % 3], c2 = sides[(i + 2) % 3], calculated = Math.acos((b * b + c2 * c2 - a12 * a12) / (2 * b * c2)) * 180 / Math.PI;
      if (Math.abs(calculated - angles[i]) > 1e-4) throw Error("Triangle sides/angles inconsistent");
    }
  }
  if (m.query === "segment-kind") {
    if (shape !== "circle-segments") throw Error("Segment classification model");
    const points = object(d.points), a12 = array(points[String(d.start)]).map(number2), b = array(points[String(d.end)]).map(number2);
    if (d.start === d.end) throw Error("Degenerate circle segment");
    if (d.start === "O" || d.end === "O") return "\uBC18\uC9C0\uB984";
    return Math.abs(a12[0] + b[0]) < 1e-8 && Math.abs(a12[1] + b[1]) < 1e-8 ? "\uC9C0\uB984" : "\uC5B4\uB290 \uAC83\uB3C4 \uC544\uB2D8";
  }
  if (m.query === "name") return { triangle: "\uC0BC\uAC01\uD615", rectangle: "\uC9C1\uC0AC\uAC01\uD615", square: "\uC815\uC0AC\uAC01\uD615", circle: "\uC6D0", line: "\uC9C1\uC120", ray: "\uBC18\uC9C1\uC120", segment: "\uC120\uBD84" }[shape] ?? (() => {
    throw Error("Unsupported naming");
  })();
  if (m.query === "endpoints") return shape === "line" ? "0" : shape === "ray" ? "1" : shape === "segment" ? "2" : (() => {
    throw Error("Endpoint query");
  })();
  if (m.query === "right-count") {
    if (shape !== "angle-pair") throw Error("Two-angle query requires pair");
    return String(angles.filter((a12) => a12 === 90).length);
  }
  if (m.query === "is-right") return number2(d.angle) === 90 ? "\uC608" : "\uC544\uB2C8\uC694";
  if (m.query === "vertices") return shape === "triangle" ? "3" : ["rectangle", "square"].includes(shape) ? "4" : shape === "circle" ? "0" : (() => {
    throw Error("Unsupported vertex count");
  })();
  if (m.query === "radius") {
    if (shape !== "circle") throw Error("Radius needs circle");
    return String(positive2(d.radius));
  }
  if (m.query === "diameter") {
    if (shape !== "circle") throw Error("Diameter needs circle");
    return String(2 * positive2(d.radius));
  }
  if (m.query === "perimeter") {
    if (!sides.length) throw Error("Missing sides");
    return String(sides.reduce((a12, b) => a12 + b, 0));
  }
  if (m.query === "area") {
    if (!["rectangle", "square"].includes(shape)) throw Error("Unsupported area");
    return String(sides[0] * sides[1]);
  }
  if (m.query === "angle-sum") {
    if (!angles.length) throw Error("Missing angles");
    return String(angles.reduce((a12, b) => a12 + b, 0));
  }
  if (m.query === "angle-name") {
    const a12 = number2(d.angle);
    return a12 === 90 ? "\uC9C1\uAC01" : a12 > 0 && a12 < 90 ? "\uC608\uAC01" : a12 > 90 && a12 < 180 ? "\uB454\uAC01" : (() => {
      throw Error("Degenerate angle naming");
    })();
  }
  if (m.query === "same-angle-count") return String(angles.filter((a12) => a12 === number2(d.target)).length);
  if (m.query === "direction") {
    let index = ["up", "right", "down", "left"].indexOf(String(d.direction));
    for (const op of d.operations) {
      if (op === "rotate180") index = (index + 2) % 4;
      else if (op === "rotate90") index = (index + 1) % 4;
      else if (op === "flip-vertical") {
        if (index === 0) index = 2;
        else if (index === 2) index = 0;
      } else if (op === "flip-horizontal") {
        if (index === 1) index = 3;
        else if (index === 3) index = 1;
      } else throw Error("Unsupported transform");
    }
    return ["\uC704", "\uC624\uB978\uCABD", "\uC544\uB798", "\uC67C\uCABD"][index];
  }
  throw Error("Unsupported geometry query");
}
function table(m) {
  const d = m.data, rows2 = array(d.rows).map(object), labels = rows2.map((r2) => String(r2.label));
  if (new Set(labels).size !== labels.length || labels.some((s) => !s.trim())) throw Error("Unique labels");
  const values = rows2.map((r2) => {
    const n = integer(r2.value);
    if (n < 0) throw Error("Negative count");
    return n;
  });
  if (d.legend !== void 0) {
    const legend = positive2(d.legend);
    if (!Number.isInteger(legend) || values.some((v) => v % legend)) throw Error("Unrepresentable picture graph");
  }
  const index = (label) => {
    const i = labels.indexOf(String(label));
    if (i < 0) throw Error("Unknown table label");
    return i;
  };
  const a12 = d.a === void 0 ? 0 : index(d.a), b = d.b === void 0 ? 1 : index(d.b);
  if (m.query === "value") return String(values[a12]);
  if (m.query === "sum") return String(values.reduce((a13, b2) => a13 + b2, 0));
  if (m.query === "pair-sum") return String(values[a12] + values[b]);
  if (m.query === "difference") return String(values[a12] - values[b]);
  if (m.query === "max-label" || m.query === "min-label") {
    const target = m.query === "max-label" ? Math.max(...values) : Math.min(...values);
    if (values.filter((v) => v === target).length !== 1) throw Error("Multiple correct labels");
    return labels[values.indexOf(target)];
  }
  if (m.query === "symbols") return String(values[a12] / positive2(d.legend));
  if (m.query === "count-over") return String(values.filter((v) => v > number2(d.threshold)).length);
  if (m.query === "missing-to-total") {
    const remaining = integer(d.total) - values.reduce((a13, b2) => a13 + b2, 0);
    if (remaining < 0) throw Error("Goal below current count");
    return String(remaining);
  }
  if (m.query === "groups") return String(rows2.length);
  throw Error("Unsupported table query");
}
function fraction(m) {
  const d = m.data, n = integer(d.numerator), den = positive2(d.denominator);
  if (!Number.isInteger(den) || n < 0) throw Error("Fraction conditions");
  if (d.parts !== void 0 && integer(d.parts) !== den) throw Error("Partition denominator mismatch");
  if (d.selected !== void 0 && integer(d.selected) !== n) throw Error("Selected portion mismatch");
  if (d.equalParts === false) throw Error("Unequal fractions cannot be certified");
  if (m.query === "value") return canonical2([BigInt(n), BigInt(den)]);
  if (m.query === "numerator") return String(n);
  if (m.query === "denominator") return String(den);
  if (m.query === "complement") {
    if (n > den) throw Error("Part of whole exceeds whole");
    return canonical2([BigInt(den - n), BigInt(den)]);
  }
  if (m.query === "classification") return n < den ? "\uC9C4\uBD84\uC218" : n === den || n > den ? "\uAC00\uBD84\uC218" : "";
  if (m.query === "unit-numerator") return "1";
  if (m.query === "whole-count") return String(Math.floor(n / den));
  if (m.query === "remaining-parts") return String(n % den);
  if (m.query === "compare") {
    const bn = integer(d.otherNumerator), bd = positive2(d.otherDenominator);
    if (!Number.isInteger(bd) || bn < 0 || den !== bd && (n !== 1 || bn !== 1)) throw Error("Grade3 comparison excludes unlike non-unit fractions");
    const delta2 = n * bd - bn * den;
    return delta2 > 0 ? "\uC67C\uCABD" : delta2 < 0 ? "\uC624\uB978\uCABD" : "\uAC19\uC74C";
  }
  if (m.query === "amount") {
    const amount = integer(d.amount);
    if (amount < 0 || amount % den) throw Error("Whole quantity cannot split evenly");
    return String(amount / den * n);
  }
  if (m.query === "decimal") {
    if (den !== 10 || n >= 10) throw Error("Grade3 decimal tenths");
    return `${n / 10}`;
  }
  throw Error("Unsupported fraction query");
}
function property(m) {
  const d = m.data, a12 = integer(d.a), b = d.b === void 0 ? 0 : integer(d.b);
  if (a12 < 0 || b < 0) throw Error("Natural operands");
  switch (m.query) {
    case "scaled-span": {
      const start = integer(d.start);
      if (start < 0 || a12 < start || b <= 0) throw Error("Scale span");
      return String((a12 - start) * b);
    }
    case "estimate-product":
      return String(Math.round(a12 / 10) * 10 * b);
    case "estimate-quotient":
      if (b < 1 || b > 9) throw Error("Estimate one digit divisor");
      return String(Math.floor(Math.round(a12 / 10) * 10 / b));
    case "ones":
      return String(a12 % 10);
    case "tens":
      return String(Math.floor(a12 / 10) % 10);
    case "hundreds":
      return String(Math.floor(a12 / 100) % 10);
    case "tens-value":
      return String(Math.floor(a12 / 10) % 10 * 10);
    case "carry-ones":
      return a12 % 10 + b % 10 >= 10 ? "\uD544\uC694" : "\uD544\uC694 \uC5C6\uC74C";
    case "borrow-ones":
      return a12 % 10 < b % 10 ? "\uD544\uC694" : "\uD544\uC694 \uC5C6\uC74C";
    case "remainder-max":
      if (b < 1 || b > 9) throw Error("One digit divisor");
      return String(b - 1);
    case "quotient":
      if (!b) throw Error("Zero divisor");
      return String(Math.floor(a12 / b));
    case "remainder":
      if (!b) throw Error("Zero divisor");
      return String(a12 % b);
    case "compare":
      return a12 > b ? "\uC67C\uCABD" : a12 < b ? "\uC624\uB978\uCABD" : "\uAC19\uC74C";
    case "division-valid":
      return b > 0 && integer(d.remainder) >= 0 && integer(d.remainder) < b && a12 === integer(d.quotient) * b + integer(d.remainder) ? "\uC633\uC74C" : "\uD2C0\uB9BC";
    case "group-count":
      if (!b || a12 % b) throw Error("Unequal grouping");
      return String(a12 / b);
    default:
      throw Error("Unsupported property query");
  }
}
function solveMathModel(m) {
  if (!m || typeof m.prompt !== "string" || typeof m.unit !== "string" || !m.structureId || !m.difficultyRationale) throw Error("Model metadata");
  object(m.data);
  switch (m.kind) {
    case "integrated":
      return solveIntegratedModel(m);
    case "expression":
      return rpn(m.data);
    case "foundation":
      return solveFoundationModel(m);
    case "geometry":
      return m.data.shape === "line-relations" ? solveLineRelations(m) : geometry(m);
    case "table":
      return table(m);
    case "fraction":
      return fraction(m);
    case "number-property":
      return property(m);
    default:
      throw Error("Unsupported model");
  }
}

// learning-review-r1/native/validators/expression-statement.js
function parseStudentExpression(statement) {
  const match = /^([\d()./+×÷−\-\s]+)의 (값|몫|나머지)/.exec(statement);
  if (!match) throw Error("Expression contract requires an explicit student equation");
  const input = match[1].trim(), tokens = input.match(/\d+(?:\.\d+)?(?:\/\d+)?|[()+×÷−-]/g) ?? [];
  if (tokens.join("") !== input.replace(/\s/g, "")) throw Error("Unparsed expression characters");
  const ops = [], output = [], priority = { "+": 1, "-": 1, "*": 2, "/": 2 };
  let operand = true;
  for (const token of tokens) {
    if (/^\d/.test(token)) {
      if (!operand) throw Error("Missing statement operator");
      output.push(token);
      operand = false;
    } else if (token === "(") {
      if (!operand) throw Error("Implicit multiplication");
      ops.push(token);
    } else if (token === ")") {
      if (operand) throw Error("Empty statement parentheses");
      while (ops.length && ops.at(-1) !== "(") output.push(ops.pop());
      if (ops.pop() !== "(") throw Error("Mismatched statement parentheses");
    } else {
      if (operand) throw Error("Statement operator position");
      const op = token === "\xD7" ? "*" : token === "\xF7" ? "/" : token === "\u2212" ? "-" : token;
      while (ops.length && ops.at(-1) !== "(" && priority[ops.at(-1)] >= priority[op]) output.push(ops.pop());
      ops.push(op);
      operand = true;
    }
  }
  if (operand) throw Error("Incomplete student expression");
  while (ops.length) {
    const op = ops.pop();
    if (op === "(") throw Error("Unclosed expression parentheses");
    output.push(op);
  }
  if (match[2] !== "\uAC12") {
    if (output.length !== 3 || output.at(-1) !== "/") throw Error("Quotient/remainder requires one division");
    output[2] = match[2] === "\uBAAB" ? "floor/" : "%";
  }
  return output;
}
function solveStudentExpression(statement) {
  const output = parseStudentExpression(statement);
  const m = { kind: "expression", query: "evaluate", data: { tokens: output }, prompt: statement, unit: "", structureId: "INDEPENDENT-STUDENT-STATEMENT", difficultyRationale: "Student equation parse", expected: "unused" };
  return solveMathModel(m);
}

// learning-review-r1/native/validators/explanation-consistency.js
function verifyExplanationEquations(q) {
  const issues = [], equations = [];
  const text = q.explanation.replace(/최대공약수\s+/g, "");
  for (const match of text.matchAll(/([\d()./+×÷−\-\s]+)\s*=\s*([\d()./+×÷−\-\s]+)/g)) {
    const left = match[1].trim().replace(/^(?:\.\s+)+/, "").replace(/\.+$/, ""), right = match[2].trim().replace(/\.+$/, "");
    try {
      if (!equivalent(solveStudentExpression(left + "\uC758 \uAC12"), solveStudentExpression(right + "\uC758 \uAC12"))) issues.push("False equation in explanation: " + left + " = " + right);
      equations.push({ left, right });
    } catch {
      issues.push("Malformed equation in explanation");
    }
  }
  const m = q.math?.model;
  if (m?.kind === "geometry" && m.data.vertices) {
    const d = m.data, shape = d.shape;
    const tokens = shape === "triangle" ? ["base", "height", "*", "2", "/"] : shape === "trapezoid" ? ["base", "topBase", "+", "height", "*", "2", "/"] : shape === "rhombus" ? ["diagonal1", "diagonal2", "*", "2", "/"] : ["base", "height", "*"], expected = tokens.map((t) => Object.hasOwn(d, t) ? String(d[t]) : t), final = equations.at(-1);
    if (!final || JSON.stringify(parseStudentExpression(final.left + "\uC758 \uAC12")) !== JSON.stringify(expected) || !equivalent(solveStudentExpression(final.right + "\uC758 \uAC12"), m.expected)) issues.push("Geometry explanation operands/formula/result disagree with actual dimensions");
  }
  return issues;
}

// learning-review-r1/dist/catalog-version.js
var contentImplementationHash = "2c3252ae15d7224a348fc12b3de3c32a0b8f3d061241d7172bd513329d48bfa6";

// learning-review-r1/dist/content.js
var concepts = [
  { id: "math:g3:add-sub", grade: 3, semester: 1, unitId: "sem1_unit1", title: "\uC138 \uC790\uB9AC \uC218\uC758 \uB367\uC148\uACFC \uBE84\uC148", standardCodes: ["4\uC21801-03"], internalMappingStatus: "reviewRequired" },
  { id: "math:g3:multiply", grade: 3, semester: 1, unitId: "sem1_unit4", title: "\uACF1\uC148\uC758 \uC6D0\uB9AC", standardCodes: ["4\uC21801-04"], internalMappingStatus: "reviewRequired" },
  { id: "math:g3:time", grade: 3, semester: 1, unitId: "sem1_unit5", title: "\uC2DC\uAC01\uACFC \uC2DC\uAC04", standardCodes: ["4\uC21803-13", "4\uC21803-14"], internalMappingStatus: "reviewRequired" },
  { id: "math:g4:fractions", grade: 4, semester: 2, unitId: "sem2_unit1", title: "\uBD84\uC218\uC758 \uB367\uC148\uACFC \uBE84\uC148", standardCodes: ["4\uC21801-15"], internalMappingStatus: "reviewRequired" },
  { id: "math:g4:angles", grade: 4, semester: 1, unitId: "sem1_unit2", title: "\uAC01\uB3C4\uC640 \uC0BC\uAC01\uD615\uC758 \uAC01", standardCodes: ["4\uC21803-24", "4\uC21803-25"], internalMappingStatus: "reviewRequired" },
  { id: "math:g4:bar-graph", grade: 4, semester: 1, unitId: "sem1_unit5", title: "\uB9C9\uB300\uADF8\uB798\uD504 \uC77D\uAE30\uC640 \uD574\uC11D", standardCodes: ["4\uC21804-01"], internalMappingStatus: "reviewRequired" }
];
var families = [["\uD569", "\uCC28", "\uBE48\uCE78 \uC5ED\uC0B0", "\uB450 \uD569 \uBE44\uAD50", "\uC798\uBABB \uACC4\uC0B0\uD55C \uAC12\uC758 \uCC28", "\uD569\uD55C \uB4A4 \uC0AC\uC6A9\uD55C \uC591"], ["\uACF1", "\uBE60\uC9C4 \uACF1\uD558\uB294 \uC218", "\uBD80\uBD84 \uACF1 \uD569\uCE58\uAE30", "\uB450 \uACF1 \uBE44\uAD50", "\uC798\uBABB \uB354\uD55C \uACC4\uC0B0\uACFC \uCC28", "\uBB36\uC74C \uC77C\uBD80 \uBE7C\uAE30"], ["\uC9C0\uB09C \uC2DC\uAC04", "\uB05D\uB098\uB294 \uC2DC\uAC01", "\uC2DC\uC791 \uC2DC\uAC01 \uC5ED\uC0B0", "\uB450 \uC2DC\uAC04 \uBE44\uAD50", "\uC2DC\uAC04 \uB2E8\uC704 \uC624\uB958", "\uD65C\uB3D9\uACFC \uC26C\uB294 \uC2DC\uAC04 \uD569"], ["\uB3D9\uBD84\uBAA8 \uD569", "\uB3D9\uBD84\uBAA8 \uCC28", "\uB300\uBD84\uC218 \uBE48\uCE78 \uC5ED\uC0B0", "\uD569\uACFC \uCC28 \uBE44\uAD50", "\uC798\uBABB \uBE80 \uC5F0\uC0B0 \uBCF5\uC6D0", "\uC0AC\uC6A9\uD55C \uB4A4 \uB2E4\uC2DC \uB354\uD558\uAE30"], ["\uC9C1\uAC01\uC5D0\uC11C \uB0A8\uC740 \uAC01", "\uD3C9\uAC01\uC5D0\uC11C \uB0A8\uC740 \uAC01", "\uC0BC\uAC01\uD615\uC758 \uB098\uBA38\uC9C0 \uAC01", "\uB450 \uAC01 \uBE44\uAD50", "\uB450 \uAC01 \uD569\uCE58\uAE30", "\uC0BC\uAC01\uD615 \uACC4\uC0B0 \uC624\uB958"], ["\uB9C9\uB300 \uAC12 \uC77D\uAE30", "\uB450 \uB9C9\uB300 \uCC28", "\uC138 \uD56D\uBAA9 \uD569", "\uC870\uAC74\uC5D0 \uB9DE\uB294 \uD56D\uBAA9 \uC218", "\uD55C \uD56D\uBAA9 \uBCC0\uD654 \uD6C4 \uD569", "\uAC00\uB824\uC9C4 \uC790\uB8CC \uC5ED\uC0B0"]];
var templates = concepts.flatMap((c2, i) => families[i].flatMap((name, kind) => [0, 1].map((style) => ({ id: "R1-" + c2.id.replaceAll(":", "-") + "-K" + kind + "-T" + style, version: 1, implementationHash: contentImplementationHash, conceptId: c2.id, familyId: c2.id + ":F" + (c2.id === "math:g4:angles" && kind === 1 ? 0 : kind), kind, style, difficulty: [0, 1].includes(kind) ? 2 : [2, 3].includes(kind) ? 3 : 4, difficultyEvidence: name + "\uC758 \uC0AC\uACE0 \uD589\uB3D9\xB7\uC9C8\uBB38 \uBC29\uD5A5\uACFC \uC77D\uAE30 \uBD80\uB2F4\uC5D0 \uB530\uB978 \uB0B4\uBD80 \uCD94\uC815; \uD559\uC0DD \uAC80\uC99D \uC804", domain: { a: 20, b: 20, c: 4 }, qualityStatus: "reviewRequired", reviewRequired: true, productionReady: false }))));

// learning-review-r1/dist/selector.js
async function selectFreshVariant(input) {
  const { provider, history } = input, random = createRandom(input.seed), seen = /* @__PURE__ */ new Set([...history.map((r2) => r2.fingerprint), ...input.excludeFingerprints ?? []]), last2 = history.at(-1)?.familyId, counts = /* @__PURE__ */ new Map();
  history.forEach((r2) => counts.set(r2.familyId, (counts.get(r2.familyId) ?? 0) + 1));
  const candidates = shuffle(provider.templates.filter((t) => t.conceptId === input.conceptId && (!input.familyId || t.familyId === input.familyId) && t.familyId !== input.excludeFamilyId && (input.difficulty === void 0 || t.difficulty === input.difficulty)), random);
  candidates.sort((a12, b) => Number(a12.familyId === last2) - Number(b.familyId === last2) || (counts.get(a12.familyId) ?? 0) - (counts.get(b.familyId) ?? 0) || (input.preferApplication ? b.difficulty - a12.difficulty : 0));
  const reasons = /* @__PURE__ */ new Set();
  for (let retry = 0; retry < 96; retry++) {
    if (!candidates.length)
      break;
    const t = candidates[retry % candidates.length];
    let q;
    try {
      q = await provider.generate(t, input.seed + ":" + retry);
    } catch {
      reasons.add("GENERATION_REJECTED");
      continue;
    }
    if (seen.has(q.contentFingerprint))
      continue;
    if (!await provider.verify(q)) {
      reasons.add("VERIFICATION_REJECTED");
      continue;
    }
    if (input.mode === "student" && !await provider.authorize(q)) {
      reasons.add("UNAPPROVED_CANDIDATE_BLOCKED");
      continue;
    }
    return { item: q, attempts: retry + 1, reasons: [...reasons], sameStructureAsLast: q.familyId === last2 };
  }
  return { item: null, attempts: candidates.length ? 96 : 0, reasons: [...reasons, candidates.length ? "NO_UNUSED_VERIFIED_INSTANCE" : "NO_COMPATIBLE_TEMPLATE"], sameStructureAsLast: false };
}

// learning-review-r1/dist/engine.js
var reviewTimingPolicy = Object.freeze({ readingSeconds: 25, answerSeconds: 65, status: "unmeasured-planning-estimate", spacedDays: { needsReview: 1, understandingCheck: 3 }, calibratedWithStudents: false });
var LearningReviewEngine = class {
  store;
  provider;
  mode;
  clock;
  constructor(store, provider, mode = "student", clock = () => Date.now()) {
    this.store = store;
    this.provider = provider;
    this.mode = mode;
    this.clock = clock;
  }
  now() {
    return new Date(this.clock()).toISOString();
  }
  async allowed(q) {
    requireThat(await this.provider.verify(q), "SOURCE_CHANGED_OR_UNVERIFIED");
    if (this.mode === "student")
      requireThat(await this.provider.authorize(q), "APPROVAL_REQUIRED");
  }
  async recordWrongAnswer(input) {
    requireThat(Object.keys(input).every((k) => ["idempotencyKey", "gameId", "source", "selectedAnswer", "occurredAt"].includes(k)), "UNKNOWN_EVENT_FIELD");
    requireThat(/^[a-z0-9:-]{8,160}$/i.test(input.idempotencyKey) && /^[a-z0-9-]{2,80}$/i.test(input.gameId), "INVALID_EVENT_KEY");
    requireThat(await this.provider.verify(input.source), "UNVERIFIED_SNAPSHOT");
    requireThat(gradeAnswer(input.source.question, input.selectedAnswer).status === "incorrect", "EVENT_IS_NOT_A_WRONG_ANSWER");
    const state = await this.store.load(), old = state.events.find((e) => e.idempotencyKey === input.idempotencyKey);
    if (old) {
      requireThat(old.source.contentHash === input.source.contentHash && canonical(old.selectedAnswer) === canonical(input.selectedAnswer) && old.gameId === input.gameId, "IDEMPOTENCY_CONFLICT");
      return { eventId: old.id, duplicate: true };
    }
    requireThat(state.events.length < 200, "EVENT_CAP_EXPORT_REQUIRED");
    const source = clone(input.source);
    delete source.question.qualityReview;
    source.question.review = { status: source.question.review.status };
    const event = { id: uuid(), idempotencyKey: input.idempotencyKey, gameId: input.gameId, occurredAt: input.occurredAt ?? this.now(), source, selectedAnswer: input.selectedAnswer, status: "pending", sessionIds: [], dueAt: null };
    state.events.push(event);
    await this.store.commit(state, state.revision);
    return { eventId: event.id, duplicate: false };
  }
  async getReviewQueue() {
    const s = await this.store.load();
    return Promise.all(s.events.map(async (e) => {
      let sourceCurrent = false;
      try {
        sourceCurrent = await this.provider.verify(e.source);
      } catch {
      }
      return { eventId: e.id, conceptId: e.source.conceptId, grade: e.source.question.grade, status: e.status, dueAt: e.dueAt, occurredAt: e.occurredAt, sourceCurrent, blockedReason: sourceCurrent ? null : "SOURCE_VERSION_OR_HASH_CHANGED" };
    }));
  }
  async startReviewSession(eventId, settings = {}) {
    requireThat(Object.keys(settings).every((k) => ["count", "timeMinutes"].includes(k)), "INVALID_SETTINGS");
    requireThat(settings.timeMinutes === void 0 || [5, 10, 15].includes(settings.timeMinutes), "INVALID_TIME_BUDGET");
    const count = settings.count ?? (settings.timeMinutes ? Math.min(10, Math.max(3, Math.floor(settings.timeMinutes * 60 / 90))) : 4);
    requireThat(Number.isInteger(count) && count >= 3 && count <= 20, "INVALID_COUNT");
    const state = await this.store.load(), event = state.events.find((e) => e.id === eventId);
    requireThat(event, "UNKNOWN_EVENT");
    await this.allowed(event.source);
    const active = state.sessions.find((s2) => s2.eventId === eventId && s2.status !== "completed");
    if (active)
      return { sessionId: active.id, resumed: true };
    requireThat(state.sessions.length < 200, "SESSION_CAP_EXPORT_REQUIRED");
    const s = { id: uuid(), eventId, status: "in-progress", mode: this.mode, count, timeMinutes: settings.timeMinutes ?? null, startedAt: this.now(), activeSeconds: 0, current: null, attempts: [], notices: [], dueAt: null };
    state.sessions.push(s);
    event.status = "in-progress";
    event.sessionIds.push(s.id);
    await this.store.commit(state, state.revision);
    return { sessionId: s.id, resumed: false };
  }
  locate(state, id) {
    const s = state.sessions.find((x) => x.id === id);
    requireThat(s && s.mode === this.mode, "SESSION_SCOPE");
    const e = state.events.find((e2) => e2.id === s.eventId);
    requireThat(e, "UNKNOWN_EVENT");
    return { s, e };
  }
  async fresh(source, state, s, phase) {
    const r2 = await selectFreshVariant({ provider: this.provider, conceptId: source.conceptId, history: state.recent, seed: s.id + ":" + s.attempts.length, mode: this.mode, familyId: phase === "similar" ? source.familyId : void 0, excludeFamilyId: phase === "application" ? source.familyId : void 0, excludeFingerprints: [source.contentFingerprint], preferApplication: phase === "application", difficulty: phase === "similar" ? source.question.difficulty : void 0 });
    for (const reason of r2.reasons)
      if (!s.notices.includes(reason))
        s.notices.push(reason);
    if (r2.item && (r2.item.question.grade !== source.question.grade || r2.item.question.subject !== source.question.subject || r2.item.question.unitId !== source.question.unitId)) {
      s.notices.push("GRADE_OR_UNIT_SCOPE_BLOCKED");
      return null;
    }
    return r2.item;
  }
  async getNextVariant(sessionId) {
    const state = await this.store.load(), { s, e } = this.locate(state, sessionId);
    requireThat(s.status !== "paused", "SESSION_PAUSED");
    if (s.status === "completed")
      return { status: "completed", summary: await this.getReviewSummary(sessionId) };
    if (s.current) {
      await this.allowed(s.current.item);
      return { status: "question", delivery: clone(s.current) };
    }
    if (s.attempts.length >= s.count || s.timeMinutes !== null && s.activeSeconds >= s.timeMinutes * 60) {
      await this.finish(state, s, e);
      return { status: "completed", summary: await this.getReviewSummary(sessionId) };
    }
    const phase = s.attempts.length === 0 ? "original" : s.attempts.length < (s.count === 3 ? 2 : 3) ? "similar" : "application";
    let item = e.source, actualPhase = phase;
    if (phase !== "original") {
      item = await this.fresh(e.source, state, s, phase);
      if (!item && phase === "similar") {
        item = await this.fresh(e.source, state, s, "application");
        actualPhase = "application";
        if (item)
          s.notices.push("SAME_STRUCTURE_EXHAUSTED_USING_OTHER_APPROVED_STRUCTURE");
      }
      if (!item && phase === "application") {
        item = await this.fresh(e.source, state, s, "similar");
        actualPhase = "similar";
        s.notices.push("APPLICATION_UNAVAILABLE");
      }
      if (!item) {
        if (!s.notices.includes("APPLICATION_UNAVAILABLE"))
          s.notices.push("APPLICATION_UNAVAILABLE");
        s.notices.push("APPROVED_POOL_EXHAUSTED_ORIGINAL_RETRY_AVAILABLE");
        await this.finish(state, s, e);
        return { status: "limited", reason: "NO_FRESH_APPROVED_VARIANT", originalRetryAvailable: true };
      }
    }
    await this.allowed(item);
    s.current = { id: uuid(), phase: actualPhase, item, hintUsed: false, explained: false };
    if (actualPhase !== "original")
      state.recent = [...state.recent, { fingerprint: item.contentFingerprint, familyId: item.familyId }].slice(-1e4);
    await this.store.commit(state, state.revision);
    return { status: "question", delivery: clone(s.current) };
  }
  async submitAnswer(sessionId, deliveryId, response, seconds) {
    requireThat(Number.isFinite(seconds) && seconds >= 0 && seconds <= 86400, "INVALID_SECONDS");
    const state = await this.store.load(), { s } = this.locate(state, sessionId);
    requireThat(s.status === "in-progress", "SESSION_NOT_ACTIVE");
    const duplicate = s.attempts.find((a12) => a12.deliveryId === deliveryId);
    if (duplicate)
      return { duplicate: true, status: duplicate.status };
    requireThat(s.current?.id === deliveryId, "UNKNOWN_DELIVERY");
    await this.allowed(s.current.item);
    const result = gradeAnswer(s.current.item.question, response);
    requireThat(result.status !== "invalid", "INVALID_RESPONSE");
    s.attempts.push({ deliveryId, phase: s.current.phase, contentFingerprint: s.current.item.contentFingerprint, familyId: s.current.item.familyId, status: result.status, hintUsed: s.current.hintUsed, seconds, answeredAt: this.now() });
    s.activeSeconds += seconds;
    const explanation = s.current.item.question.explanation;
    s.current = null;
    await this.store.commit(state, state.revision);
    return { duplicate: false, status: result.status, explanation };
  }
  async showHint(sessionId) {
    const state = await this.store.load(), { s } = this.locate(state, sessionId);
    requireThat(s.current && s.status === "in-progress", "NO_CURRENT");
    await this.allowed(s.current.item);
    s.current.hintUsed = true;
    await this.store.commit(state, state.revision);
    return s.current.item.question.hint;
  }
  async showExplanation(sessionId) {
    const state = await this.store.load(), { s } = this.locate(state, sessionId);
    requireThat(s.current && s.status === "in-progress", "NO_CURRENT");
    await this.allowed(s.current.item);
    s.current.explained = true;
    s.current.hintUsed = true;
    await this.store.commit(state, state.revision);
    return s.current.item.question.explanation;
  }
  async pause(sessionId) {
    const state = await this.store.load(), { s } = this.locate(state, sessionId);
    requireThat(s.status === "in-progress", "SESSION_NOT_ACTIVE");
    s.status = "paused";
    await this.store.commit(state, state.revision);
  }
  async resume(sessionId) {
    const state = await this.store.load(), { s } = this.locate(state, sessionId);
    requireThat(s.status === "paused", "SESSION_NOT_PAUSED");
    s.status = "in-progress";
    await this.store.commit(state, state.revision);
    return this.getNextVariant(sessionId);
  }
  async finish(state, s, e) {
    s.status = "completed";
    e.status = "completed";
    const transfer = s.attempts.filter((a12) => a12.phase !== "original");
    const understood = transfer.length >= 2 && transfer.every((a12) => a12.status === "correct" && !a12.hintUsed) && s.attempts.some((a12) => a12.phase === "application");
    s.dueAt = new Date(this.clock() + (understood ? 3 : 1) * 864e5).toISOString();
    e.dueAt = s.dueAt;
    await this.store.commit(state, state.revision);
  }
  async getReviewSummary(sessionId) {
    const state = await this.store.load(), { s, e } = this.locate(state, sessionId);
    const phases = Object.fromEntries(["original", "similar", "application"].map((phase) => {
      const xs = s.attempts.filter((a12) => a12.phase === phase);
      return [phase, { attempts: xs.length, correct: xs.filter((a12) => a12.status === "correct").length, accuracy: xs.length ? xs.filter((a12) => a12.status === "correct").length / xs.length : null }];
    }));
    const transfer = s.attempts.filter((a12) => a12.phase !== "original"), confirmed = transfer.length >= 2 && transfer.every((a12) => a12.status === "correct" && !a12.hintUsed) && s.attempts.some((a12) => a12.phase === "application");
    return { sessionId: s.id, conceptId: e.source.conceptId, conceptTitle: concepts.find((c2) => c2.id === e.source.conceptId)?.title ?? "\uBBF8\uC9C0\uC6D0 \uAC1C\uB150", status: s.status, phases, attempts: clone(s.attempts), hintUses: s.attempts.filter((a12) => a12.hintUsed).length, additionalReviewNeeded: !confirmed, understandingLabel: confirmed ? "\uC774\uBC88 \uBCF5\uC2B5 \uC774\uD574 \uD655\uC778" : "\uCD94\uAC00 \uBCF5\uC2B5 \uD544\uC694", applicationPracticed: s.attempts.some((a12) => a12.phase === "application"), applicationStatus: s.attempts.some((a12) => a12.phase === "application") ? "practiced" : s.notices.includes("APPLICATION_UNAVAILABLE") ? "unavailable" : "not-yet-requested", notices: s.notices, dueAt: s.dueAt, timeBudgetReached: s.timeMinutes !== null && s.activeSeconds >= s.timeMinutes * 60, timingPolicy: "time is not correctness", localOnly: true, educationalDiagnosis: false, mode: s.mode };
  }
  exportBackup() {
    return this.store.exportBackup();
  }
  async getReviewOverview() {
    const state = await this.store.load(), byConcept = /* @__PURE__ */ new Map();
    for (const e of state.events) {
      let c2 = byConcept.get(e.source.conceptId);
      if (!c2) {
        c2 = { conceptId: e.source.conceptId, pending: 0, inProgress: 0, completed: 0, attempts: 0, correct: 0, hintUses: 0 };
        byConcept.set(c2.conceptId, c2);
      }
      if (e.status === "pending")
        c2.pending++;
      else if (e.status === "in-progress")
        c2.inProgress++;
      else
        c2.completed++;
      for (const s of state.sessions.filter((s2) => s2.eventId === e.id)) {
        c2.attempts += s.attempts.length;
        c2.correct += s.attempts.filter((a12) => a12.status === "correct").length;
        c2.hintUses += s.attempts.filter((a12) => a12.hintUsed).length;
      }
    }
    return { concepts: [...byConcept.values()], localOnly: true, masteryClaim: false, planningEstimate: reviewTimingPolicy };
  }
  async setNextReviewTime(eventId, dueAt) {
    requireThat(Number.isFinite(Date.parse(dueAt)) && Date.parse(dueAt) >= this.clock(), "INVALID_REVIEW_TIME");
    const state = await this.store.load(), event = state.events.find((e) => e.id === eventId);
    requireThat(event, "UNKNOWN_EVENT");
    event.dueAt = new Date(dueAt).toISOString();
    const last2 = state.sessions.findLast((s) => s.eventId === eventId);
    if (last2)
      last2.dueAt = event.dueAt;
    await this.store.commit(state, state.revision);
    return event.dueAt;
  }
  async importBackup(raw) {
    const state = await this.store.load();
    return this.store.importBackup(raw, state.revision);
  }
};

// learning-review-r1/dist/storage.js
var emptyState = () => ({ schemaVersion: 1, revision: 0, events: [], sessions: [], recent: [] });
function validateState(input) {
  requireThat(input && typeof input === "object" && !Array.isArray(input), "INVALID_STATE");
  const s = input;
  requireThat(Object.keys(s).every((k) => ["schemaVersion", "revision", "events", "sessions", "recent"].includes(k)), "UNKNOWN_STATE_FIELD");
  requireThat(s.schemaVersion === 1 && Number.isInteger(s.revision) && s.revision >= 0 && Array.isArray(s.events) && s.events.length <= 200 && Array.isArray(s.sessions) && s.sessions.length <= 200 && Array.isArray(s.recent) && s.recent.length <= 1e4, "INVALID_STATE");
  const ids = /* @__PURE__ */ new Set(), eventIds = /* @__PURE__ */ new Set(), idempotency = /* @__PURE__ */ new Set();
  for (const e of s.events) {
    requireThat(e && Object.keys(e).every((k) => ["id", "idempotencyKey", "gameId", "occurredAt", "source", "selectedAnswer", "status", "sessionIds", "dueAt"].includes(k)), "UNKNOWN_EVENT_FIELD");
    requireThat(typeof e.id === "string" && !ids.has(e.id) && typeof e.idempotencyKey === "string" && !idempotency.has(e.idempotencyKey) && stamp(e.occurredAt) && ["pending", "in-progress", "completed"].includes(e.status) && Array.isArray(e.sessionIds) && e.sessionIds.length <= 200 && (e.dueAt === null || stamp(e.dueAt)), "INVALID_EVENT");
    ids.add(e.id);
    eventIds.add(e.id);
    idempotency.add(e.idempotencyKey);
    const q = e.source;
    requireThat(q && Object.keys(q).every((k) => ["question", "conceptId", "familyId", "templateId", "seed", "parameters", "contentFingerprint", "structureFingerprint", "contentHash", "task", "scene", "validation", "approval"].includes(k)) && typeof q.contentHash === "string" && /^[a-f0-9]{64}$/.test(q.contentHash) && typeof q.conceptId === "string" && q.question?.subject === "math" && [3, 4, 5, 6].includes(q.question.grade) && q.question.question.length <= 6e3 && typeof q.question.explanation === "string" && q.question.explanation.length <= 6e3 && (q.question.choices?.length ?? 0) <= 8 && canonical(e.selectedAnswer).length <= 3e3, "INVALID_SNAPSHOT");
    requireThat(!q.question.qualityReview && !q.question.review.reviewedBy && !q.question.review.reviewedAt, "PERSONAL_REVIEW_DATA_NOT_STORED");
  }
  ids.clear();
  for (const s1 of s.sessions) {
    requireThat(s1 && Object.keys(s1).every((k) => ["id", "eventId", "status", "mode", "count", "timeMinutes", "startedAt", "activeSeconds", "current", "attempts", "notices", "dueAt"].includes(k)), "UNKNOWN_SESSION_FIELD");
    requireThat(!ids.has(s1.id) && eventIds.has(s1.eventId) && ["student", "author-preview"].includes(s1.mode) && ["in-progress", "paused", "completed"].includes(s1.status) && Number.isInteger(s1.count) && s1.count >= 3 && s1.count <= 20 && [null, 5, 10, 15].includes(s1.timeMinutes) && stamp(s1.startedAt) && Number.isFinite(s1.activeSeconds) && s1.activeSeconds >= 0 && Array.isArray(s1.attempts) && s1.attempts.length <= 20 && Array.isArray(s1.notices) && s1.notices.length <= 40, "INVALID_SESSION");
    ids.add(s1.id);
    const deliveries = /* @__PURE__ */ new Set();
    for (const a12 of s1.attempts) {
      requireThat(a12 && Object.keys(a12).every((k) => ["deliveryId", "phase", "contentFingerprint", "familyId", "status", "hintUsed", "seconds", "answeredAt"].includes(k)) && !deliveries.has(a12.deliveryId) && ["original", "similar", "application"].includes(a12.phase) && ["correct", "incorrect", "skipped"].includes(a12.status) && typeof a12.hintUsed === "boolean" && Number.isFinite(a12.seconds) && a12.seconds >= 0 && a12.seconds <= 86400 && stamp(a12.answeredAt), "INVALID_ATTEMPT");
      deliveries.add(a12.deliveryId);
    }
    requireThat(s1.current === null || s1.current && typeof s1.current.id === "string" && ["original", "similar", "application"].includes(s1.current.phase) && s1.current.item && typeof s1.current.item.contentHash === "string" && typeof s1.current.hintUsed === "boolean" && typeof s1.current.explained === "boolean", "INVALID_CURRENT");
  }
  for (const r2 of s.recent)
    requireThat(Object.keys(r2).every((k) => ["fingerprint", "familyId"].includes(k)) && /^[a-f0-9]{64}$/.test(r2.fingerprint) && typeof r2.familyId === "string", "INVALID_HISTORY");
  const scan = (x) => {
    if (!x || typeof x !== "object")
      return;
    for (const [k, v] of Object.entries(x)) {
      requireThat(!["studentName", "className", "studentId", "email", "phone", "learnerName", "reviewer", "reviewedBy"].includes(k), "PERSONAL_FIELD_FORBIDDEN");
      scan(v);
    }
  };
  scan(s);
}

// qb-review-1.0.2/src/history.ts
var HISTORY_POLICY = { version: "episode-distinct-all+recent12/3.0.0", window: 12, unit: "distinct delivered semantic math conditions across bank sessions", mandatory: ["root", "latest-instant-for-challenge", "unanswered-deliveries", "active-or-paused-challenge-reservations"], ledgerTruncated: false, olderReuseAllowedForEquivalentReview: false, baseStillUniqueWithinSession: true };
function candidateHistory(s, ordered, reserved = [], mode = "strict-all") {
  const all = ordered.map((r2) => s.resolve(r2)), seen = /* @__PURE__ */ new Set(), window = [];
  for (let i = all.length - 1; i >= 0; i--) {
    const r2 = all[i], key2 = s.semanticKey(r2);
    if (seen.has(key2)) continue;
    seen.add(key2);
    if (mode === "strict-all" || window.length < HISTORY_POLICY.window) window.push(r2);
  }
  const mandatory = reserved.map((r2) => s.resolve(r2)), exclusions = [...new Set([...window, ...mandatory].map((r2) => r2.contentFingerprint))];
  return { exclusions, audit: { mode, policyVersion: HISTORY_POLICY.version, deliveredHistoryEntries: all.length, distinctHistoryConditions: seen.size, protectedRecentConditions: window.length, reservedConditions: new Set(mandatory.map((r2) => s.semanticKey(r2))).size, eligibleOlderConditionCount: mode === "strict-all" ? 0 : Math.max(0, seen.size - window.length), protectedRecent: window.map((r2) => s.ref(r2)), mandatory: mandatory.map((r2) => s.ref(r2)), historyRemoved: false } };
}
function stateExclusions(supply, state, additional = []) {
  const reserved = [...state.deliveries.filter((d) => !d.answeredAttemptId).map((d) => d.ref), ...state.challenges.filter((c2) => c2.status === "in-progress" || c2.status === "paused").flatMap((c2) => c2.plan)];
  return [.../* @__PURE__ */ new Set([...candidateHistory(supply, state.deliveries.map((d) => d.ref), reserved).exclusions, ...additional])];
}

// candidate:candidate-lock
var LOCK = {"schemaVersion":"qb-survival-review/1","packVersion":"0.6.0-review.3","contentVersion":"G4QF:483cf40bcc8ae897f46c9d4415750dcac399c96149e1516f474a8aae87ed5ecb","packSha256":"c680f82c4f9683dde9f7a0a65fdee2aaab9f45a924c6ddccd775872275898cd2","engineVersion":"equivalent-two-1.0.2+episode-selector-3.0-preview.2","policyVersion":"equivalent-two/1.0.0","implementationHash":"430e82d01bf97d1a52f991547f1a77255f73de87d35f8c14361decc79e139b36"};

// qb-review-1.0.2/src/storage.ts
var STORAGE_KEY = "qb-review:math-hero-survival:equivalent-two:review-1.0.2";
async function encode(body) {
  return canonical({ envelopeVersion: 1, body, checksum: await sha(body) });
}
async function decode(raw) {
  requireThat(typeof raw === "string" && raw.length <= 1e7, "BACKUP_SIZE_LIMIT");
  let x;
  try {
    x = JSON.parse(raw);
  } catch {
    throw Error("CORRUPT_JSON_PRESERVED");
  }
  requireThat(x && Object.keys(x).every((k) => ["envelopeVersion", "body", "checksum"].includes(k)) && x.envelopeVersion === 1 && x.body && typeof x.checksum === "string" && await sha(x.body) === x.checksum, "CHECKSUM_MISMATCH_PRESERVED");
  return x.body;
}
function createLocalStorage(storage, options = {}) {
  const key2 = options.key ?? STORAGE_KEY, limit = options.maxBytes ?? 8e6;
  const load = async () => {
    const raw = storage.getItem(key2);
    return raw === null ? null : decode(raw);
  };
  return { load, async commit(next, revision) {
    requireThat(options.atomic, "ATOMIC_LOCK_UNAVAILABLE_READ_ONLY");
    await options.atomic(async () => {
      const prior = await load();
      requireThat((prior?.revision ?? 0) === revision, "MULTI_TAB_CONFLICT");
      requireThat(next.revision === revision + 1, "REVISION_CONFLICT");
      const raw = await encode(next);
      requireThat(new TextEncoder().encode(raw).length <= limit, "STORAGE_CAPACITY_EXPORT_REQUIRED");
      try {
        const previous = storage.getItem(key2);
        if (previous !== null) storage.setItem(key2 + ":previous", previous);
        storage.setItem(key2, raw);
      } catch {
        throw Error("STORAGE_WRITE_FAILED_OLD_STATE_RETAINED");
      }
    });
  }, async previousBackup() {
    const raw = storage.getItem(key2 + ":previous");
    if (raw !== null) await decode(raw);
    return raw;
  } };
}
function browserStorage(options = {}) {
  const locks = globalThis.navigator?.locks;
  return createLocalStorage(localStorage, { ...options, ...locks ? { atomic: async (work) => locks.request(options.key ?? STORAGE_KEY, work) } : {} });
}
function memoryStorage(options = {}) {
  const values = /* @__PURE__ */ new Map();
  let tail = Promise.resolve();
  return createLocalStorage({ getItem: (k) => values.get(k) ?? null, setItem: (k, v) => {
    if (options.failWrites) throw Error("QUOTA");
    values.set(k, v);
  } }, { maxBytes: options.maxBytes, atomic: (work) => {
    const p = tail.then(work);
    tail = p.then(() => void 0, () => void 0);
    return p;
  } });
}
function csvCell(value) {
  let text = typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
  if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

// qb-review-1.0.2/src/policy.ts
var fields = (x, keys) => requireThat(x && typeof x === "object" && !Array.isArray(x) && Object.keys(x).every((k) => keys.includes(k)), "UNKNOWN_POLICY_FIELD");
var EquivalentTwoPolicy = class {
  constructor(supply, storage, clock = () => Date.now()) {
    this.supply = supply;
    this.storage = storage;
    this.clock = clock;
    this.pins = { packSha256: LOCK.packSha256, contentVersion: LOCK.contentVersion, engineVersion: LOCK.engineVersion, implementationHash: LOCK.implementationHash, policyVersion: LOCK.policyVersion, historyPolicyVersion: HISTORY_POLICY.version, blocked: [...supply.blocked].sort() };
  }
  pins;
  now() {
    return new Date(this.clock()).toISOString();
  }
  initial() {
    return { schemaVersion: LOCK.schemaVersion, revision: 0, pins: clone(this.pins), r1: emptyState(), sessions: [], deliveries: [], attempts: [], entries: [], challenges: [] };
  }
  row(ref) {
    return this.supply.resolve(ref);
  }
  decodeState(value) {
    const s = clone(value);
    this.validate(s);
    return s;
  }
  validate(s) {
    fields(s, ["schemaVersion", "revision", "pins", "r1", "sessions", "deliveries", "attempts", "entries", "challenges"]);
    requireThat(s.schemaVersion === LOCK.schemaVersion && Number.isSafeInteger(s.revision) && s.revision >= 0 && canonical(s.pins) === canonical(this.pins), "POLICY_OR_PACK_VERSION_MISMATCH");
    validateState(s.r1);
    for (const [name, max] of [["sessions", 200], ["deliveries", 3e3], ["attempts", 2e3], ["entries", 200], ["challenges", 400]]) {
      const a12 = s[name];
      requireThat(Array.isArray(a12) && a12.length <= max && new Set(a12.map((x) => x.id)).size === a12.length, "POLICY_CAP_OR_DUPLICATE_ID");
    }
    requireThat(new Set(s.entries.map((e) => canonical(e.root))).size === s.entries.length && new Set(s.entries.map((e) => e.r1EventId)).size === s.entries.length, "DUPLICATE_ROOT_REVIEW_ENTRY");
    const scan = (x) => {
      if (!x || typeof x !== "object") return;
      for (const [k, v] of Object.entries(x)) {
        requireThat(!["studentName", "studentId", "className", "email", "phone", "reviewer", "reviewedAt"].includes(k), "PERSONAL_FIELD_FORBIDDEN");
        scan(v);
      }
    };
    scan(s);
    for (const e of s.r1.events) {
      const source = this.supply.find(e.source);
      requireThat(source, "R1_SNAPSHOT_NOT_CURRENT");
      requireThat(this.supply.assessment(this.supply.ref(source), e.selectedAnswer).status === "incorrect", "R1_EVENT_IS_NOT_WRONG");
    }
    requireThat(s.r1.sessions.length === 0, "POLICY_MIXING_FORBIDDEN");
    for (const g of s.sessions) {
      fields(g, ["id", "scope", "phase", "current", "root", "baseAttemptId", "used", "counts"]);
      this.supply.scope(g.scope);
      requireThat(["idle", "base-issued", "needs-twin", "twin-issued", "limited"].includes(g.phase) && Array.isArray(g.used) && new Set(g.used).size === g.used.length, "INVALID_GAME_SESSION");
      if (g.root) this.row(g.root);
      if (g.current) requireThat(s.deliveries.some((d) => d.id === g.current && d.ownerId === g.id && !d.answeredAttemptId), "INVALID_GAME_CURRENT");
    }
    for (const d of s.deliveries) {
      fields(d, ["id", "ownerId", "role", "ref", "root", "parentBaseAttemptId", "challengeId", "answeredAttemptId"]);
      const r2 = this.row(d.ref), root = this.row(d.root);
      requireThat(["base", "instant-twin", "challenge"].includes(d.role), "INVALID_ROLE");
      if (d.role !== "base") requireThat(this.supply.candidates(root).some((x) => x.contentFingerprint === r2.contentFingerprint), "TWIN_NOT_EQUIVALENT");
      if (d.role === "instant-twin") {
        const base = s.attempts.find((a12) => a12.id === d.parentBaseAttemptId);
        requireThat(base?.role === "base" && base.status === "incorrect" && canonical(base.questionRef) === canonical(d.root), "NO_ACTUAL_FIRST_ERROR");
      }
      if (d.role === "challenge") requireThat(s.challenges.some((c2) => c2.id === d.challengeId && c2.id === d.ownerId), "UNKNOWN_CHALLENGE");
      else {
        const owner = s.sessions.find((g) => g.id === d.ownerId);
        requireThat(owner, "UNKNOWN_GAME_SESSION");
        requireThat(this.supply.rows(owner.scope).some((q) => q.questionId === r2.questionId), "DELIVERY_OUTSIDE_SESSION_SCOPE");
        if (d.role === "base") requireThat(canonical(d.ref) === canonical(d.root) && !d.parentBaseAttemptId, "INVALID_BASE_ROOT");
        if (d.parentBaseAttemptId) {
          const parent = s.attempts.find((a12) => a12.id === d.parentBaseAttemptId), parentDelivery = parent && s.deliveries.find((x) => x.id === parent.deliveryId);
          requireThat(parentDelivery?.ownerId === d.ownerId, "CROSS_SESSION_TWIN_PARENT");
        }
      }
      if (d.answeredAttemptId) requireThat(s.attempts.some((a12) => a12.id === d.answeredAttemptId && a12.deliveryId === d.id), "MISSING_SUBMISSION");
    }
    for (const a12 of s.attempts) {
      fields(a12, ["id", "deliveryId", "questionRef", "rootQuestionRef", "role", "response", "status", "seconds", "at", "challengeId", "reviewEntryId"]);
      const d = s.deliveries.find((d2) => d2.id === a12.deliveryId);
      requireThat(d && d.answeredAttemptId === a12.id && canonical(d.ref) === canonical(a12.questionRef) && canonical(d.root) === canonical(a12.rootQuestionRef) && d.role === a12.role && Number.isFinite(a12.seconds) && a12.seconds >= 0 && a12.seconds <= 86400 && stamp(a12.at), "INVALID_ATTEMPT");
      requireThat(this.supply.assessment(a12.questionRef, a12.response).status === a12.status, "FORGED_CORRECTNESS");
    }
    for (const c2 of s.challenges) {
      fields(c2, ["id", "entryId", "status", "plan", "attemptIds", "current", "consecutiveCorrect", "startedAt", "completedAt", "excludedInstant"]);
      const e = s.entries.find((e2) => e2.id === c2.entryId);
      requireThat(e && ["in-progress", "paused", "failed", "completed", "interrupted"].includes(c2.status) && c2.plan.length === 2 && c2.attemptIds.length <= 2 && new Set(c2.attemptIds).size === c2.attemptIds.length && stamp(c2.startedAt), "INVALID_CHALLENGE");
      const root = this.row(e.root), plans = c2.plan.map((r2) => this.row(r2));
      requireThat(plans[0].contentFingerprint !== plans[1].contentFingerprint && plans.every((r2) => r2.contentFingerprint !== this.row(c2.excludedInstant).contentFingerprint && this.supply.candidates(root).some((x) => x.contentFingerprint === r2.contentFingerprint)), "CHALLENGE_CONDITION_DUPLICATE");
      const aa = c2.attemptIds.map((id) => s.attempts.find((a12) => a12.id === id));
      requireThat(aa.every((a12, i) => a12?.challengeId === c2.id && a12?.reviewEntryId === e.id && canonical(a12.questionRef) === canonical(c2.plan[i])), "CHALLENGE_ATTEMPT_MISMATCH");
      const expected = aa.some((a12) => a12.status === "incorrect") ? 0 : aa.length;
      requireThat(c2.consecutiveCorrect === expected, "FORGED_CONSECUTIVE_SUCCESS");
      if (c2.status === "completed") requireThat(expected === 2 && stamp(c2.completedAt ?? ""), "FALSE_REVIEW_COMPLETION");
      if (c2.status === "failed") requireThat(aa.some((a12) => a12?.status === "incorrect"), "FALSE_FAILURE");
      if (["in-progress", "paused", "interrupted"].includes(c2.status)) requireThat(expected < 2 && aa.every((a12) => a12?.status === "correct"), "CHALLENGE_STATUS_CONFLICT");
      if (c2.current) requireThat(s.deliveries.some((d) => d.id === c2.current && d.challengeId === c2.id && !d.answeredAttemptId && canonical(d.ref) === canonical(c2.plan[c2.attemptIds.length]) && canonical(d.root) === canonical(e.root)), "INVALID_CHALLENGE_CURRENT");
    }
    for (const e of s.entries) {
      fields(e, ["id", "root", "r1EventId", "lastFailureAttemptId", "latestInstant", "status", "createdAt", "updatedAt", "completedAt", "completions"]);
      requireThat(s.challenges.filter((c2) => c2.entryId === e.id && ["in-progress", "paused"].includes(c2.status)).length <= 1, "MULTIPLE_ACTIVE_CHALLENGES");
      const root = this.row(e.root), wrong = s.attempts.find((a12) => a12.id === e.lastFailureAttemptId), base = wrong && s.deliveries.find((d) => d.id === wrong.deliveryId)?.parentBaseAttemptId;
      requireThat(["needsReview", "completed"].includes(e.status) && wrong?.role === "instant-twin" && wrong.status === "incorrect" && s.attempts.some((a12) => a12.id === base && a12.role === "base" && a12.status === "incorrect") && canonical(wrong.rootQuestionRef) === canonical(e.root) && canonical(wrong.questionRef) === canonical(e.latestInstant), "TWO_ACTUAL_ERRORS_REQUIRED");
      requireThat(s.r1.events.some((r2) => r2.id === e.r1EventId && r2.source.contentHash === root.contentHash) && stamp(e.createdAt) && stamp(e.updatedAt), "INVALID_ROOT_LEDGER");
      const completed = s.challenges.filter((c2) => c2.entryId === e.id && c2.status === "completed"), failureIndex = s.attempts.findIndex((a12) => a12.id === e.lastFailureAttemptId), latest = completed.some((c2) => s.attempts.findIndex((a12) => a12.id === c2.attemptIds[1]) > failureIndex);
      requireThat(canonical(e.completions) === canonical(completed.map((c2) => c2.id)) && e.status === "completed" === latest, "ROOT_COMPLETION_CONFLICT");
      if (e.status === "completed") requireThat(stamp(e.completedAt ?? ""), "MISSING_COMPLETION_TIME");
    }
  }
  async load() {
    const raw = await this.storage.load(), s = raw === null ? this.initial() : raw;
    this.validate(s);
    return clone(s);
  }
  async save(s) {
    const revision = s.revision;
    s.revision++;
    this.validate(s);
    await this.storage.commit(s, revision);
  }
  delivery(d) {
    const r2 = this.row(d.ref);
    return { id: d.id, sessionId: d.ownerId, role: d.role, questionRef: clone(d.ref), rootQuestionRef: clone(d.root), metadata: this.supply.metadata(r2), render: this.supply.view(r2), consumer: "math-hero-survival", operational: false, policyVersion: LOCK.policyVersion };
  }
  issue(s, ownerId, ref, root, role, extra = {}) {
    requireThat(s.deliveries.length < 3e3, "DELIVERY_CAP_EXPORT_REQUIRED");
    const d = { id: uuid(), ownerId, role, ref: clone(ref), root: clone(root), ...extra };
    s.deliveries.push(d);
    return d;
  }
  async openSession(scope) {
    const valid = this.supply.scope(scope), s = await this.load();
    requireThat(s.sessions.length < 200, "SESSION_CAP_EXPORT_REQUIRED");
    const id = uuid();
    s.sessions.push({ id, scope: valid, phase: "idle", current: null, root: null, baseAttemptId: null, used: [], counts: {} });
    await this.save(s);
    return { sessionId: id };
  }
  async nextQuestion(id) {
    const s = await this.load(), g = s.sessions.find((g2) => g2.id === id);
    requireThat(g, "UNKNOWN_SESSION");
    if (g.current) return { status: "question", delivery: this.delivery(s.deliveries.find((d2) => d2.id === g.current)) };
    if (g.phase === "needs-twin") return { status: "action-required", reason: "REQUEST_INSTANT_EQUIVALENT_TWIN" };
    if (g.phase === "limited") return { status: "held", reason: "INSTANT_TWIN_UNAVAILABLE_NO_SECOND_ERROR_RECORDED" };
    const recent = stateExclusions(this.supply, s), rows2 = this.supply.rows(g.scope).filter((r3) => !this.supply.isExcluded(r3, g.used) && !this.supply.isExcluded(r3, recent));
    const uses = /* @__PURE__ */ new Map();
    for (const old of s.deliveries) {
      const key2 = this.supply.semanticKey(this.row(old.ref));
      uses.set(key2, (uses.get(key2) ?? 0) + 1);
    }
    const last2 = s.deliveries.length ? this.row(s.deliveries.at(-1).ref) : null;
    const tie = (r3) => {
      let n = 2166136261;
      for (const c2 of g.id + ":" + r3.semanticConditionKey) n = Math.imul(n ^ c2.charCodeAt(0), 16777619);
      return n >>> 0;
    };
    rows2.sort((a12, b) => (a12.priorUseCount ?? 0) + (uses.get(a12.semanticConditionKey) ?? 0) - ((b.priorUseCount ?? 0) + (uses.get(b.semanticConditionKey) ?? 0)) || Number(a12.solutionStructureId === last2?.solutionStructureId) - Number(b.solutionStructureId === last2?.solutionStructureId) || (g.counts[a12.templateId] ?? 0) - (g.counts[b.templateId] ?? 0) || tie(a12) - tie(b));
    const r2 = rows2[0];
    if (!r2) {
      const unused = this.supply.rows(g.scope).some((x) => !this.supply.isExcluded(x, g.used));
      return { status: unused ? "held" : "exhausted", reason: unused ? "APPROVED_BASES_EXCLUDED_BY_RECENT_OR_RESERVED" : "NO_UNUSED_APPROVED_MATH_CONDITION" };
    }
    const ref = this.supply.ref(r2), d = this.issue(s, id, ref, ref, "base");
    g.current = d.id;
    g.root = ref;
    g.phase = "base-issued";
    g.baseAttemptId = null;
    g.used.push(r2.contentFingerprint);
    g.counts[r2.templateId] = (g.counts[r2.templateId] ?? 0) + 1;
    await this.save(s);
    return { status: "question", delivery: this.delivery(d) };
  }
  async requestEquivalentTwin(id) {
    const s = await this.load(), g = s.sessions.find((g2) => g2.id === id);
    requireThat(g, "UNKNOWN_SESSION");
    if (g.phase === "twin-issued" && g.current) return { status: "question", delivery: this.delivery(s.deliveries.find((d2) => d2.id === g.current)) };
    if (g.phase === "limited") {
      const base = s.attempts.find((a12) => a12.id === g.baseAttemptId), bd = base && s.deliveries.find((d2) => d2.id === base.deliveryId);
      requireThat(base?.status === "incorrect" && bd?.ownerId === id && canonical(base.questionRef) === canonical(g.root) && !s.deliveries.some((d2) => d2.parentBaseAttemptId === base.id && d2.role === "instant-twin"), "NO_UNISSUED_ACTUAL_ERROR_TO_RETRY");
      g.phase = "needs-twin";
    }
    requireThat(g.phase === "needs-twin" && g.root && g.baseAttemptId, "INSTANT_TWIN_NOT_REQUIRED");
    const root = this.row(g.root), r2 = await this.supply.twin(root, stateExclusions(this.supply, s), id + ":instant");
    if (!r2) {
      g.phase = "limited";
      await this.save(s);
      return { status: "held", reason: this.supply.candidates(root).length ? "APPROVED_EQUIVALENTS_EXCLUDED_BY_RECENT_OR_RESERVED" : "NO_APPROVED_EQUIVALENT_INSTANT_TWIN_NO_NOTE_ADDED", available: 0, required: 1 };
    }
    const d = this.issue(s, id, this.supply.ref(r2), g.root, "instant-twin", { parentBaseAttemptId: g.baseAttemptId });
    g.current = d.id;
    g.phase = "twin-issued";
    if (!g.used.includes(r2.contentFingerprint)) g.used.push(r2.contentFingerprint);
    await this.save(s);
    return { status: "question", delivery: this.delivery(d) };
  }
  async activate(s, d, attemptId) {
    const root = this.row(d.root), base = s.attempts.find((a12) => a12.id === d.parentBaseAttemptId);
    requireThat(base?.status === "incorrect", "NO_FIRST_ERROR");
    const id = "review-" + (await sha(d.root)).slice(0, 40);
    let e = s.entries.find((e2) => e2.id === id);
    const virtual = { load: async () => clone(s.r1), commit: async (next, revision) => {
      requireThat(s.r1.revision === revision, "R1_REVISION_CONFLICT");
      validateState(next);
      s.r1 = { ...clone(next), revision: revision + 1 };
      return clone(s.r1);
    }, exportBackup: async () => encode(s.r1), importBackup: async () => {
      throw Error("R1_IMPORT_NOT_EXPOSED_BY_POLICY");
    } };
    const r1 = new LearningReviewEngine(virtual, this.supply.provider(), "student", this.clock), record = e ? { eventId: e.r1EventId } : await r1.recordWrongAnswer({ idempotencyKey: "survival-review:" + id.slice(7), gameId: "math-hero-survival", source: root.reviewItem, selectedAnswer: base.response, occurredAt: base.at });
    if (!e) {
      requireThat(s.entries.length < 200, "ENTRY_CAP_EXPORT_REQUIRED");
      e = { id, root: clone(d.root), r1EventId: record.eventId, lastFailureAttemptId: attemptId, latestInstant: clone(d.ref), status: "needsReview", createdAt: this.now(), updatedAt: this.now(), completedAt: null, completions: [] };
      s.entries.push(e);
    } else {
      e.lastFailureAttemptId = attemptId;
      e.latestInstant = clone(d.ref);
      e.status = "needsReview";
      e.updatedAt = this.now();
      e.completedAt = null;
      for (const c2 of s.challenges.filter((c3) => c3.entryId === id && ["in-progress", "paused"].includes(c3.status))) {
        c2.status = "interrupted";
        c2.current = null;
      }
    }
    const event = s.r1.events.find((x) => x.id === record.eventId);
    event.status = "pending";
    return e.id;
  }
  async applyAttemptEvent(input) {
    fields(input, ["attemptId", "deliveryId", "response", "seconds"]);
    requireThat(typeof input.attemptId === "string" && /^[a-z0-9:-]{8,160}$/i.test(input.attemptId) && typeof input.response === "string" && Number.isFinite(input.seconds) && input.seconds >= 0 && input.seconds <= 86400, "INVALID_ATTEMPT_INPUT");
    const s = await this.load(), d = s.deliveries.find((d2) => d2.id === input.deliveryId);
    requireThat(d, "UNKNOWN_DELIVERY");
    const prior = s.attempts.find((a12) => a12.id === input.attemptId) || s.attempts.find((a12) => a12.deliveryId === d.id);
    if (prior) {
      requireThat(prior.deliveryId === d.id && prior.response === input.response && prior.seconds === input.seconds, "IDEMPOTENCY_CONFLICT");
      return { ...this.supply.assessment(d.ref, input.response), duplicate: true, acceptedAttemptId: prior.id, reviewEntryId: prior.reviewEntryId ?? null, noteAction: "none" };
    }
    const grade = this.supply.assessment(d.ref, input.response);
    if (grade.status === "invalid") return { ...grade, duplicate: false, acceptedAttemptId: "", reviewEntryId: null, noteAction: "none" };
    requireThat(s.attempts.length < 2e3, "ATTEMPT_CAP_EXPORT_REQUIRED");
    let entryId = null, noteAction = "none";
    if (d.role === "challenge") {
      const c2 = s.challenges.find((c3) => c3.id === d.challengeId);
      requireThat(c2?.status === "in-progress" && c2.current === d.id, "CHALLENGE_NOT_ACTIVE");
      entryId = c2.entryId;
    } else {
      const g = s.sessions.find((g2) => g2.id === d.ownerId);
      requireThat(g && g.current === d.id && ["base-issued", "twin-issued"].includes(g.phase), "SESSION_NOT_ACTIVE");
    }
    s.attempts.push({ id: input.attemptId, deliveryId: d.id, questionRef: clone(d.ref), rootQuestionRef: clone(d.root), role: d.role, response: input.response, status: grade.status, seconds: input.seconds, at: this.now(), ...d.challengeId ? { challengeId: d.challengeId, reviewEntryId: entryId } : {} });
    d.answeredAttemptId = input.attemptId;
    if (d.role === "challenge") {
      const c2 = s.challenges.find((c3) => c3.id === d.challengeId), e = s.entries.find((e2) => e2.id === c2.entryId);
      c2.attemptIds.push(input.attemptId);
      c2.current = null;
      if (grade.status === "incorrect") {
        c2.consecutiveCorrect = 0;
        c2.status = "failed";
        s.r1.events.find((x) => x.id === e.r1EventId).status = "pending";
      } else {
        c2.consecutiveCorrect++;
        if (c2.consecutiveCorrect === 2) {
          c2.status = "completed";
          c2.completedAt = this.now();
          e.status = "completed";
          e.completedAt = this.now();
          e.completions.push(c2.id);
          s.r1.events.find((x) => x.id === e.r1EventId).status = "completed";
          noteAction = "completed";
        }
      }
      e.updatedAt = this.now();
    } else {
      const g = s.sessions.find((g2) => g2.id === d.ownerId);
      g.current = null;
      if (d.role === "base") {
        g.baseAttemptId = input.attemptId;
        g.phase = grade.status === "incorrect" ? "needs-twin" : "idle";
      } else {
        if (grade.status === "incorrect") {
          entryId = await this.activate(s, d, input.attemptId);
          noteAction = "needsReview";
          s.attempts.at(-1).reviewEntryId = entryId;
        }
        g.phase = "idle";
      }
    }
    await this.save(s);
    return { ...grade, duplicate: false, acceptedAttemptId: input.attemptId, reviewEntryId: entryId, noteAction };
  }
  async getReviewQueue(options = {}) {
    const s = await this.load();
    return s.entries.filter((e) => options.includeCompleted || e.status === "needsReview").map((e) => {
      const active = s.challenges.find((c2) => c2.entryId === e.id && ["in-progress", "paused"].includes(c2.status));
      return { reviewEntryId: e.id, rootQuestionRef: clone(e.root), status: e.status, label: e.status === "completed" ? "\uC815\uD574\uC9C4 \uC5F0\uC2B5\uC744 \uB9C8\uCCE4\uC5B4\uC694" : "\uBCF5\uC2B5\uC774 \uD544\uC694\uD55C \uBB38\uC81C", createdAt: e.createdAt, updatedAt: e.updatedAt, completedAt: e.completedAt, challengeAttemptCount: s.attempts.filter((a12) => a12.reviewEntryId === e.id && a12.role === "challenge").length, consecutiveCorrect: active?.consecutiveCorrect ?? (e.status === "completed" ? 2 : 0), basic: this.supply.view(this.row(e.root)), assessment: this.supply.assessment(e.root, this.row(e.root).assessment.answer.choiceId), history: s.attempts.filter((a12) => canonical(a12.rootQuestionRef) === canonical(e.root)).map((a12) => ({ ...clone(a12), metadata: this.supply.metadata(this.row(a12.questionRef)) })) };
    });
  }
  async startChallenge(id) {
    const s = await this.load(), e = s.entries.find((e2) => e2.id === id);
    requireThat(e && e.status === "needsReview", "ACTIVE_REVIEW_ENTRY_REQUIRED");
    const old = s.challenges.find((c3) => c3.entryId === id && ["in-progress", "paused"].includes(c3.status));
    if (old) return { status: "resumed", challengeId: old.id };
    const root = this.row(e.root), exclude = stateExclusions(this.supply, s, [this.row(e.latestInstant).contentFingerprint]), available = this.supply.candidates(root, exclude).length;
    if (available < 2) return { status: "held", reason: this.supply.candidates(root, [this.row(e.latestInstant).contentFingerprint]).length >= 2 ? "APPROVED_CHALLENGES_EXCLUDED_BY_RECENT_OR_RESERVED" : "TWO_DISTINCT_EQUIVALENT_CHALLENGE_VARIANTS_UNAVAILABLE", available, required: 2 };
    const first = await this.supply.twin(root, exclude, id + ":challenge"), second = first && await this.supply.twin(root, [...exclude, first.contentFingerprint], id + ":challenge:2");
    requireThat(first && second, "BOUNDED_SELECTOR_EXHAUSTED");
    requireThat(s.challenges.length < 400, "CHALLENGE_CAP_EXPORT_REQUIRED");
    const c2 = { id: uuid(), entryId: id, status: "in-progress", excludedInstant: clone(e.latestInstant), plan: [this.supply.ref(first), this.supply.ref(second)], attemptIds: [], current: null, consecutiveCorrect: 0, startedAt: this.now(), completedAt: null };
    s.challenges.push(c2);
    s.r1.events.find((x) => x.id === e.r1EventId).status = "in-progress";
    await this.save(s);
    return { status: "started", challengeId: c2.id };
  }
  async nextChallenge(id) {
    const s = await this.load(), c2 = s.challenges.find((c3) => c3.id === id);
    requireThat(c2, "UNKNOWN_CHALLENGE");
    if (c2.status === "paused") return { status: "held", reason: "CHALLENGE_PAUSED_NOT_INCORRECT" };
    if (c2.status === "completed") return { status: "completed", reason: "TWO_DISTINCT_EQUIVALENT_CORRECT_ANSWERS" };
    if (c2.status === "interrupted") return { status: "held", reason: "CHALLENGE_SUPERSEDED_NO_ERROR_RECORDED" };
    if (c2.status === "failed") return { status: "held", reason: "CHALLENGE_RETRY_REQUIRED_CONSECUTIVE_RESET" };
    if (c2.current) return { status: "question", delivery: this.delivery(s.deliveries.find((d2) => d2.id === c2.current)) };
    const e = s.entries.find((e2) => e2.id === c2.entryId);
    const d = this.issue(s, c2.id, c2.plan[c2.attemptIds.length], e.root, "challenge", { challengeId: c2.id });
    c2.current = d.id;
    await this.save(s);
    return { status: "question", delivery: this.delivery(d) };
  }
  async pauseChallenge(id) {
    const s = await this.load(), c2 = s.challenges.find((c3) => c3.id === id);
    requireThat(c2 && ["in-progress", "paused"].includes(c2.status), "CHALLENGE_NOT_ACTIVE");
    if (c2.status === "paused") return;
    c2.status = "paused";
    await this.save(s);
  }
  async resumeChallenge(id) {
    const s = await this.load(), c2 = s.challenges.find((c3) => c3.id === id);
    requireThat(c2 && ["paused", "in-progress"].includes(c2.status), "CHALLENGE_NOT_RESUMABLE");
    if (c2.status === "paused") {
      c2.status = "in-progress";
      await this.save(s);
    }
    return this.nextChallenge(id);
  }
  async getReviewSummary() {
    const s = await this.load();
    return { schemaVersion: "qb-survival-result/1", engineVersion: LOCK.engineVersion, implementationHash: LOCK.implementationHash, historyPolicy: HISTORY_POLICY, policyVersion: LOCK.policyVersion, packVersion: LOCK.packVersion, contentVersion: LOCK.contentVersion, reviewEntries: await this.getReviewQueue({ includeCompleted: true }), attempts: clone(s.attempts), challengeHistory: clone(s.challenges), active: s.entries.filter((e) => e.status === "needsReview").length, completed: s.entries.filter((e) => e.status === "completed").length, learningClaim: "\uC815\uD574\uC9C4 \uC5F0\uC2B5 \uC870\uAC74 \uCDA9\uC871 \uAE30\uB85D\uC774\uBA70 \uC644\uC804 \uC219\uB2EC \uC778\uC99D\uC740 \uC544\uB2D9\uB2C8\uB2E4", studentPIIIncluded: false, serverUpload: false };
  }
  async serialize() {
    return encode(await this.load());
  }
  async restore(raw, options = {}) {
    const incoming = await decode(raw);
    this.validate(incoming);
    const current = await this.load();
    if (options.expectedRevision !== void 0) requireThat(current.revision === options.expectedRevision, "MULTI_TAB_CONFLICT");
    if (canonical({ ...current, revision: 0 }) === canonical({ ...incoming, revision: 0 })) return;
    requireThat(options.mode === "replace" || current.sessions.length === 0 && current.entries.length === 0, "BACKUP_CONFLICT_EXPLICIT_REPLACE_REQUIRED");
    incoming.revision = current.revision;
    await this.save(incoming);
  }
  async exportResults(kind) {
    const state = await this.load(), summary = await this.getReviewSummary();
    if (kind === "json") return JSON.stringify({ ...summary, sourceSnapshots: state.r1.events.map((e) => ({ reviewEntryId: state.entries.find((n) => n.r1EventId === e.id)?.id, event: clone(e) })) }, null, 2);
    const keys = ["reviewEntryId", "rootQuestionRef", "questionRef", "role", "response", "status", "seconds", "at", "challengeId", "metadata"];
    const rows2 = state.attempts.map((a12) => ({ ...a12, reviewEntryId: a12.reviewEntryId ?? state.entries.find((e) => canonical(e.root) === canonical(a12.rootQuestionRef))?.id ?? "", metadata: this.supply.metadata(this.row(a12.questionRef)) }));
    return "\uFEFF" + [keys.join(","), ...rows2.map((r2) => keys.map((k) => csvCell(r2[k])).join(","))].join("\r\n");
  }
};

// qb-g4-s2-rich-01/src/provider.mjs
var clone3 = structuredClone;
var check = (ok, message) => {
  if (!ok) throw Error(message);
};
function createAuthorPreview(pack, { purpose } = {}) {
  check(purpose === "author-preview", "STUDENT_AND_OPERATIONAL_SUPPLY_NOT_AUTHORIZED");
  check(pack?.schemaVersion === "g4-s2-rich-candidate/1" && pack.rows.every((r2) => r2.grade === 4 && [1, 2].includes(r2.semester) && r2.productionReady === false), "INVALID_REVIEW_PACK");
  const rowsAt=performance.now();const all = pack.rows;qbmark("bank-rows-clone",rowsAt);const indexesAt=performance.now();const active = all.filter((r2) => r2.authorPreviewEligible), byId = new Map(active.map((r2) => [r2.questionId, r2])), byFp = new Map(all.map((r2) => [r2.contentFingerprint, r2.semanticConditionKey]));
  qbmark("bank-indexes",indexesAt);const base = { packId: pack.packId, packVersion: pack.version, contentVersion: pack.contentVersion };
  const ref = (r2) => ({ ...base, questionId: r2.questionId, questionVersion: r2.questionVersion, contentHash: r2.contentHash });
  const resolve = (x) => {
    check(x && x.packId === base.packId && x.packVersion === base.packVersion && x.contentVersion === base.contentVersion, "PACK_VERSION_MISMATCH");
    check(Object.keys(x).every((k) => ["packId", "packVersion", "contentVersion", "questionId", "questionVersion", "contentHash"].includes(k)), "UNKNOWN_REFERENCE_FIELD");
    const r2 = byId.get(x.questionId);
    check(r2 && r2.contentHash === x.contentHash && r2.questionVersion === x.questionVersion, "HELD_OR_CHANGED_QUESTION");
    return r2;
  };
  const scope = (x) => {
    check(x && Object.keys(x).every((k) => ["packId", "packVersion", "contentVersion", "subject", "grade", "semester", "unitId", "skillIds", "levels", "style"].includes(k)), "UNKNOWN_SCOPE_FIELD");
    check(x.packId === base.packId && x.packVersion === base.packVersion && x.contentVersion === base.contentVersion, "PACK_VERSION_MISMATCH");
    check(x.subject === "math" && x.grade === 4 && [1, 2].includes(x.semester) && /^sem[12]_unit[1-6]$/.test(x.unitId) && x.unitId[3] === String(x.semester), "UNSUPPORTED_POOL");
    check(Array.isArray(x.skillIds) && x.skillIds.length && new Set(x.skillIds).size === x.skillIds.length && x.skillIds.every((s) => all.some((r2) => r2.unitId === x.unitId && r2.skillId === s)), "EMPTY_OR_UNKNOWN_SKILLS");
    check(Array.isArray(x.levels) && x.levels.length && x.levels.every((n) => [1, 2, 3, 4, 5].includes(n)) && ["mixed", "calculation", "word-problem"].includes(x.style), "INVALID_FILTER");
    check(supply.rows(x).length, "NO_VERIFIED_CANDIDATES_IN_SELECTION");
    return clone3(x);
  };
  const supply = {
    blocked: new Set(all.filter((r2) => !r2.authorPreviewEligible).map((r2) => r2.contentHash)),
    ref,
    resolve,
    scope,
    rows: (x) => active.filter((r2) => r2.unitId === x.unitId && x.skillIds.includes(r2.skillId) && x.levels.includes(r2.level) && (x.style === "mixed" || x.style === r2.style)),
    semanticKey: (r2) => r2.semanticConditionKey,
    historyKey: (fp) => {
      check(byFp.has(fp), "UNKNOWN_HISTORY_FINGERPRINT");
      return byFp.get(fp);
    },
    isExcluded: (r2, h) => h.some((fp) => supply.historyKey(fp) === r2.semanticConditionKey),
    candidates: (root, excluded = []) => {
      const seen = /* @__PURE__ */ new Set([root.semanticConditionKey, ...excluded.map((fp) => supply.historyKey(fp))]);
      return root.equivalentCandidateIds.map((id) => byId.get(id)).filter((r2) => r2 && !seen.has(r2.semanticConditionKey) && seen.add(r2.semanticConditionKey));
    },
    twin: async (root, excluded, seed) => {
      const cs = supply.candidates(root, excluded);
      let n = 0;
      for (const c2 of seed) n = n * 31 + c2.charCodeAt(0) >>> 0;
      return cs[n % cs.length] ?? null;
    },
    find: (q) => {
      const r2 = byId.get(q.question.id);
      return r2 && r2.contentHash === q.contentHash && canonical(q) === canonical(r2.reviewItem) ? r2 : void 0;
    },
    provider: () => ({ templates: [], generate: async () => {
      throw Error("UNBOUNDED_GENERATION_DISABLED");
    }, verify: async (q) => !!supply.find(q), authorize: async () => false }),
    view: (r2) => clone3(r2.render),
    metadata: (r2) => ({ packageId: base.packId, templateId: r2.templateId, templateVersion: r2.templateVersion, familyId: r2.familyId, variantId: r2.exampleId, seed: r2.seed, parameters: clone3(r2.parameters), generatorVersion: "existing-pinned-finite-and-rich-v2", mathConditionKey: r2.contentFingerprint, structureFingerprint: r2.structureFingerprint, equivalenceKey: r2.equivalenceKey, grade: 4, semester: r2.semester, unitId: r2.unitId, skillIds: [r2.skillId], reasoningType: r2.reviewItem.task.query, difficulty: r2.level, difficultyScale: r2.proof.type === "cafe190" ? "source-ordinal-not-calibrated-L1-L5" : "estimated-grade-local-L1-L5", rendererVersion: r2.rendererVersion, explanationVersion: r2.source.displayAdapter ?? r2.source.newDefinitionVersion ?? "source-preserved", answerPolicy: "native-gradeAnswer", semanticConditionKey: r2.semanticConditionKey, reviewOnly: true }),
    assessment: (x, response) => {
      const r2 = resolve(x), g = gradeAnswer(r2.reviewItem.question, response);
      return { status: g.status, correctChoiceId: r2.assessment.answer.choiceId ?? r2.assessment.answerLabel, explanation: r2.assessment.explanation, hint: r2.assessment.hint, questionRef: ref(r2) };
    }
  };
  return {
    info: { ...base, operational: false, teacherApprovalGranted: false, mode: "author-preview", policy: "equivalent-two/1.0.0", reusedEngine: "1.0.2", studentSupply: 0 },
    defaultScope: (unitId) => ({ ...base, subject: "math", grade: 4, semester: Number(unitId[3]), unitId, skillIds: [...new Set(active.filter((r2) => r2.unitId === unitId).map((r2) => r2.skillId))], levels: [1, 2, 3, 4, 5], style: "mixed" }),
    selectScope: (unitId, skillIds) => scope({ ...base, subject: "math", grade: 4, semester: Number(unitId[3]), unitId, skillIds, levels: [1, 2, 3, 4, 5], style: "mixed" }),
    getCandidates: (x) => clone3(supply.rows(scope(x))),
    getCandidateMetadata:(x)=>supply.rows(scope(x)).map(r=>({questionId:r.questionId,questionRef:ref(r),difficulty:r.level,level:r.level,skillId:r.skillId,unitId:r.unitId,semanticConditionKey:r.semanticConditionKey,contentFingerprint:r.contentFingerprint,templateId:r.templateId,solutionStructureId:r.solutionStructureId})),
    getQuestion: (x) => clone3(resolve(x)),
    getRef: (id) => ref(resolve(ref(byId.get(id) ?? {}))),
    getEquivalentCandidates: (id) => clone3(supply.candidates(resolve(ref(byId.get(id) ?? {})))),
    gradeAnswer: supply.assessment,
    createReviewEngine: (storage) => new EquivalentTwoPolicy(supply, storage),
    operationalSupply: () => ({ status: "held", items: [], reason: "ACTUAL_RIGHTS_CURRICULUM_RANGE_TEACHER_AND_OPERATING_GRANTS_REQUIRED", productionReadyChanged: false })
  };
}

// qb-math-g4-3.0/history-service.mjs
var clone4 = structuredClone;
var check2 = (x, m) => {
  if (!x) throw Error(m);
};
function createExposureHistory(storage, { packId, contentVersion }) {
  const empty = () => ({ schemaVersion: "common-exposure-history/3", revision: 0, packId, contentVersion, episodes: {}, counts: {} });
  const validate = (s) => {
    check2(s?.schemaVersion === "common-exposure-history/3" && s.packId === packId && s.contentVersion === contentVersion, "HISTORY_PACK_MISMATCH");
    check2(Number.isSafeInteger(s.revision) && s.revision >= 0 && Object.keys(s.episodes).length <= 200 && Object.keys(s.counts).length <= 1e5, "HISTORY_CAP_EXPORT_REQUIRED");
    for (const [k, v] of Object.entries(s.counts)) check2(/^[a-f0-9]{64}$/.test(k) && Number.isSafeInteger(v) && v >= 0, "INVALID_SEMANTIC_USAGE");
    return s;
  };
  const load = async () => validate(await storage.load() ?? empty());
  return { async preferences() {
    return clone4((await load()).counts);
  }, async synchronize(recordId, api, engineBackup) {
    check2(/^[A-Za-z0-9:_-]{4,160}$/.test(recordId), "OPAQUE_RECORD_ID_REQUIRED");
    const engine = await decode(engineBackup);
    check2(Array.isArray(engine.deliveries), "ENGINE_BACKUP_REQUIRED");
    const current = await load(), prior = current.episodes[recordId] ?? {}, next = clone4(current);
    for (const d of engine.deliveries) {
      const row = api.getQuestion(d.ref), key2 = row.semanticConditionKey;
      check2(/^[a-f0-9]{64}$/.test(key2), "SEMANTIC_KEY_REQUIRED");
      if (prior[d.id]) {
        check2(prior[d.id] === key2, "DELIVERY_SEMANTIC_CHANGED");
        continue;
      }
      next.episodes[recordId] ??= {};
      next.episodes[recordId][d.id] = key2;
      next.counts[key2] = (next.counts[key2] ?? 0) + 1;
    }
    if (JSON.stringify(next) === JSON.stringify(current)) return;
    next.revision++;
    validate(next);
    await storage.commit(next, current.revision);
  }, async exportBackup() {
    return encode(await load());
  }, async restore(raw, { replace = false } = {}) {
    const incoming = validate(await decode(raw)), current = await load();
    check2(replace || Object.keys(current.episodes).length === 0, "EXPLICIT_HISTORY_REPLACE_REQUIRED");
    await storage.commit({ ...incoming, revision: current.revision + 1 }, current.revision);
  } };
}

// qb-math-g4-3.0/consumer.mjs
async function loadPinnedAuthorPreview({ packBytes, expectedPackSHA256, purpose, priorUsage }) {
  const bytes = typeof packBytes === "string" ? new TextEncoder().encode(packBytes) : packBytes, actual = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((x) => x.toString(16).padStart(2, "0")).join("");
  if (expectedPackSHA256 !== LOCK.packSha256 || actual !== LOCK.packSha256) throw Error("PACK_HASH_MISMATCH");
  return createAuthorPreview2({ pack: JSON.parse(new TextDecoder().decode(bytes)), purpose, priorUsage });
}
function createAuthorPreview2({ pack, purpose, priorUsage = {} }) {
  if (purpose !== "author-preview") throw Error("CANDIDATE_NOT_STUDENT_APPROVED");
  if (pack.contentVersion !== LOCK.contentVersion) throw Error("PACK_VERSION_MISMATCH");
  const hydrationAt=performance.now();const hydrated = {...pack, rows:pack.rows.map(row=>({...row}))};qbmark("bank-pack-clone",hydrationAt);const groupAt=performance.now();
  for (const r2 of hydrated.rows) {
    const group = hydrated.equivalenceGroups[r2.equivalenceKey];
    if (!Array.isArray(group) || !group.includes(r2.questionId)) throw Error("INVALID_GROUP_INDEX");
    r2.equivalentCandidateIds = group;
    r2.priorUseCount = priorUsage[r2.semanticConditionKey] ?? 0;
    if (!Number.isSafeInteger(r2.priorUseCount) || r2.priorUseCount < 0) throw Error("INVALID_PRIOR_USAGE");
  }
  qbmark("equivalence-and-usage",groupAt);return createAuthorPreview(hydrated, { purpose });
}
async function createPersistentAuthorPreview({ pack, purpose, historyStorage, recordId }) {
  if (!/^[A-Za-z0-9:_-]{4,160}$/.test(recordId ?? "")) throw Error("STABLE_OPAQUE_RECORD_ID_REQUIRED");
  const history = createExposureHistory(historyStorage, { packId: pack.packId, contentVersion: pack.contentVersion }), api = createAuthorPreview2({ pack, purpose, priorUsage: await history.preferences() });
  return { ...api, exposureHistory: history, createReviewEngine(storage) {
    const engine = api.createReviewEngine(storage), sync = async () => history.synchronize(recordId, api, await engine.serialize());
    return new Proxy(engine, { get(target, key2) {
      const method = Reflect.get(target, key2);
      if (typeof method !== "function") return method;
      if (["nextQuestion", "requestEquivalentTwin", "nextChallenge", "restore"].includes(key2)) return async (...args) => {
        const result = await method.apply(target, args);
        await sync();
        return result;
      };
      return method.bind(target);
    } });
  } };
}
export {
  LOCK,
  browserStorage,
  createAuthorPreview2 as createAuthorPreview,
  createExposureHistory,
  createPersistentAuthorPreview,
  loadPinnedAuthorPreview,
  memoryStorage
};

qbmark("core-module-evaluation",qbCoreStart);