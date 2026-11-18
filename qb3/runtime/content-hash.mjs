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

// qb-g4-3.0-real-generator-coverage/core.mjs
var hash3 = hash2;
export {
  hash3 as hash
};
