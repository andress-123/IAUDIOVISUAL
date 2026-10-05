/* Motor generativo — identidad "Tener más / Expandirse"
   Paleta y formas leídas de las láminas de referencia (hex aproximados: confirmar con la guideline). */
(function (root) {
  // Cada familia: color base (el de la paleta) -> color final del degradado (más saturado)
  const FAMILIES = {
    blue:   { name: 'Azul',        base: '#009EDE', end: '#0050FF' },
    cyan:   { name: 'Cian',        base: '#5CD0FF', end: '#00F5FF' },
    green:  { name: 'Verde',       base: '#5AB32A', end: '#00E67A' },
    lime:   { name: 'Verde claro', base: '#99E371', end: '#E6FF8A' },
    yellow: { name: 'Amarillo',    base: '#F4C00E', end: '#FF6A00' },
    red:    { name: 'Rojo',        base: '#D02E26', end: '#FF00B4' },
  };
  const ORDER = ['blue', 'cyan', 'green', 'lime', 'yellow', 'red'];

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  // Mezcla en OKLab: evita grises sucios al cruzar tonos (rojo+cian, azul+amarillo...)
  const toLin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const toSrgb = (v) => 255 * clamp(v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
  const toLab = ([r, g, b]) => {
    r = toLin(r); g = toLin(g); b = toLin(b);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  };
  const fromLab = ([L, a, b]) => {
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
    return [toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
            toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
            toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)];
  };
  const mix = (c1, c2, t) => { const A = toLab(c1), B = toLab(c2); return fromLab(A.map((v, i) => lerp(v, B[i], t))); };
  const grad = (fam, t) => mix(hex(FAMILIES[fam].base), hex(FAMILIES[fam].end), clamp(t));

  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    const r = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.range = (a, b) => a + (b - a) * r();
    r.int = (a, b) => Math.floor(r.range(a, b + 1));
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    return r;
  }

  // value noise 2D para campos suaves
  function noise2(seed) {
    const R = rng(seed), N = 256, P = new Float32Array(N * N);
    for (let i = 0; i < P.length; i++) P[i] = R();
    const s = (t) => t * t * (3 - 2 * t);
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = s(x - xi), yf = s(y - yi);
      const g = (a, b) => P[(((b % N) + N) % N) * N + (((a % N) + N) % N)];
      return lerp(lerp(g(xi, yi), g(xi + 1, yi), xf), lerp(g(xi, yi + 1), g(xi + 1, yi + 1), xf), yf);
    };
  }

  // Rampa continua: recorre varias familias (cada una con su degradado) de forma suave
const ramp = (fams, t) => {
    const n = fams.length, x = clamp(t) * n * 0.999, i = Math.floor(x), f = x - i;
    const A = grad(fams[i], f), B = grad(fams[Math.min(i + 1, n - 1)], 0);
    return f > 0.8 ? mix(A, B, (f - 0.8) / 0.2 * 0.6) : A;
  };
  const subset = (R, k) => { const a = ORDER.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, k); };
  const otherFam = (R, f) => { let o; do { o = R.pick(ORDER); } while (o === f); return o; };

  /* ---------- Formas ---------- */

  // Barra dividida en tiras con degradado escalonado (la unidad de la identidad)
  function strips(ctx, fam, x, y, w, h, n, vertical, reverse, jitter, R) {
    for (let i = 0; i < n; i++) {
      let t = n === 1 ? 0.5 : i / (n - 1);
      if (reverse) t = 1 - t;
      ctx.fillStyle = rgb(grad(fam, t));
      if (vertical) { // tiras verticales -> degradado en horizontal
        const sw = w / n, off = jitter ? R.range(-jitter, jitter) : 0;
        ctx.fillRect(x + i * sw, y + off, Math.ceil(sw) + 0.5, h);
      } else {
        const sh = h / n, off = jitter ? R.range(-jitter, jitter) : 0;
        ctx.fillRect(x + off, y + i * sh, w, Math.ceil(sh) + 0.5);
      }
    }
  }

  // Cruz "+": barra horizontal + barra vertical, cada una con su familia y degradado
  function plus(ctx, cx, cy, s, o) {
    const R = o.R, fa = o.famH, fb = o.famV;
    const L1 = s * R.range(0.55, 1), L2 = s * R.range(0.55, 1);
    const T1 = s * R.range(0.12, 0.34), T2 = s * R.range(0.14, 0.34);
    const U1 = s * R.range(0.55, 1), U2 = s * R.range(0.55, 1);
    const n = o.steps || R.int(5, 9);
    ctx.save();
    ctx.translate(cx, cy);
    if (o.rot) ctx.rotate(o.rot);
    if (o.skew) ctx.transform(1, 0, o.skew, 1, 0, 0);
    strips(ctx, fa, -L1, -T1 / 2, L1 + L2, T1, n, true, R() < 0.5, o.jitter || 0, R);
    ctx.globalCompositeOperation = 'hard-light'; // modo de fusión de la identidad (Illustrator: Luz fuerte)
    strips(ctx, fb, -T2 / 2, -U1, T2, U1 + U2, Math.max(4, n - 1), false, R() < 0.5, o.jitter || 0, R);
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  // Cruz que se desmorona en píxeles (mapa de distancia al "+")
  function dissolvePlus(ctx, W, H, o) {
    const R = o.R, N = noise2(o.seed + 7);
    const cx = W * 0.5 + R.range(-W * 0.05, W * 0.05), cy = H * 0.5;
    const arm = H * R.range(0.34, 0.42), th = H * R.range(0.11, 0.16);
    const cell = Math.round(H / 26);
    const fa = o.famH, fb = o.famV;
    const dir = R() < 0.5 ? 1 : -1; // hacia qué lado se disuelve
    for (let gy = 0; gy < H; gy += cell) {
      for (let gx = 0; gx < W; gx += cell) {
        const x = gx + cell / 2 - cx, y = gy + cell / 2 - cy;
        // distancia al "+" (unión de dos rectángulos)
        const dH = Math.max(Math.abs(x) - arm, Math.abs(y) - th);
        const dV = Math.max(Math.abs(x) - th, Math.abs(y) - arm);
        const d = Math.min(dH, dV);
        const side = clamp((x * dir) / arm * 0.5 + 0.5);
        const reach = lerp(cell * 0.4, cell * 9, side * side);
        const keep = d < 0 ? 1 : clamp(1 - d / reach);
        if (R() > keep * keep + (d < 0 ? 0 : 0)) continue;
        const inH = Math.abs(y) <= th || (d >= 0 && dH < dV);
        const t = inH ? clamp((x + arm) / (2 * arm)) : clamp((y + arm) / (2 * arm));
        const c = grad(inH ? fa : fb, t + (N(gx / 160, gy / 160) - 0.5) * 0.25);
        // tamaño multiescala: lejos del núcleo -> píxeles más pequeños
        const k = d < 0 ? 1 : R.pick([1, 1, 0.5, 0.5, 0.25]);
        const sz = cell * k;
        ctx.fillStyle = rgb(c);
        ctx.globalAlpha = d < 0 ? 1 : lerp(1, 0.55, clamp(d / (cell * 8)));
        const jx = (cell - sz) * R(), jy = (cell - sz) * R();
        ctx.fillRect(gx + jx, gy + jy, sz, sz);
      }
    }
    ctx.globalAlpha = 1;
  }

  // Flujo: 6 corrientes de bloques escalonados que convergen y se mezclan
  function flow(ctx, W, H, o) {
    const R = o.R, fams = o.fams || ORDER.slice();
    const m = W * 0.06, n = fams.length;
    const rowH = (H - 2 * m) / n * 1.05;
    const yc = H * R.range(0.5, 0.58);
    const steps = 26, x0 = m, x1 = W - m;
    const grid = Math.round(H / 40);
    const q = (v) => Math.round(v / grid) * grid;
    // las corrientes lejanas se pintan primero; las centrales por encima
    const idx = fams.map((_, i) => i).sort((a, b) => Math.abs(b - (n - 1) / 2) - Math.abs(a - (n - 1) / 2));
    ctx.globalCompositeOperation = 'hard-light';
    for (const i of idx) {
      const fam = fams[i], nb = fams[clamp(i + (i < (n - 1) / 2 ? 1 : -1), 0, n - 1)];
      const y0 = m + (i + 0.5) * ((H - 2 * m) / n);
      let x = x0;
      for (let k = 0; k < steps; k++) {
        const p = k / (steps - 1), e = p * p * (3 - 2 * p);
        const bw = lerp(W * 0.02, W * 0.07, R()) * lerp(1, 1.2, p);
        const bh = q(lerp(rowH, rowH * R.range(0.55, 1.1), e));
        const y = q(lerp(y0, yc, Math.pow(e, 0.8)) + R.range(-grid, grid) * p);
        const c = mix(grad(fam, p * 1.1), grad(nb, clamp(p * 1.3)), clamp(p * 1.4 - 0.3) * 0.5);
        ctx.fillStyle = rgb(c);
        ctx.fillRect(x, y - bh / 2, bw + 1, bh);
        x += bw * R.range(0.7, 1);
        if (x > x1) break;
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // Bandas dentadas apiladas (franjas de la lámina 10)
  function bands(ctx, W, H, o) {
    const R = o.R, N = noise2(o.seed + 3);
    const fams = o.fams || R.pick([['green', 'cyan', 'blue', 'lime'], ['yellow', 'red', 'blue', 'cyan'], ORDER]);
    const cell = Math.round(H / 34);
    const nb = fams.length;
    const bandH = H / (nb + 1);
    fams.forEach((fam, bi) => {
      const baseY = (bi + 0.7) * bandH + R.range(-bandH * 0.2, bandH * 0.2);
      for (let gx = 0; gx < W; gx += cell) {
        const t = gx / W;
        const wob = (N(gx / 220 + bi * 5, bi * 3) - 0.5) * bandH * 1.4;
        const top = Math.round((baseY + wob) / cell) * cell;
        const tooth = R() < 0.35 ? cell * R.int(1, 2) : 0; // dientes de sierra
        const h = bandH * 0.75 + tooth;
        // cada columna: apilado de celdas con degradado vertical corto
        const c = grad(fam, clamp(t + (N(gx / 90, bi) - 0.5) * 0.4));
        ctx.fillStyle = rgb(c);
        ctx.fillRect(gx, top - tooth, cell + 0.5, h);
      }
    });
  }

  // Campo de píxeles abstracto: ruido -> familia + degradado por celda
  function field(ctx, W, H, o) {
    const R = o.R, N = noise2(o.seed + 11), N2 = noise2(o.seed + 23);
    const cell = Math.round(H / R.pick([12, 16, 20]));
    const fams = o.fams || ORDER;
    const thr = R.range(0.42, 0.56);
    for (let gy = 0; gy < H; gy += cell) {
      for (let gx = 0; gx < W; gx += cell) {
        const v = N(gx / 330, gy / 330) * 0.7 + N2(gx / 90, gy / 90) * 0.3;
        if (v < thr) continue;
        const fi = Math.floor(clamp(N2(gx / 400 + 9, gy / 400) * 0.999) * fams.length);
        const t = clamp((v - thr) / (1 - thr) * 1.6);
        const sub = R() < 0.18 ? 2 : 1; // algunas celdas se subdividen
        for (let sy = 0; sy < sub; sy++) for (let sx = 0; sx < sub; sx++) {
          ctx.fillStyle = rgb(grad(fams[fi], t + R.range(-0.12, 0.12)));
          ctx.fillRect(gx + sx * cell / sub, gy + sy * cell / sub, cell / sub + 0.5, cell / sub + 0.5);
        }
      }
    }
  }

  // Mosaico: quadtree de bloques cuyo color sale de un campo suave recorrido por la rampa
  function mosaic(ctx, W, H, o) {
    const R = o.R, N = noise2(o.seed + 41), M = noise2(o.seed + 77);
    const fams = o.fams || subset(R, 3);
    const base = Math.round(H / R.pick([5, 6, 8]));
    const warp = (x, y) => N(x / 500 + M(x / 260, y / 260) * 1.6, y / 500 + M(y / 260, x / 260) * 1.6);
    const thr = R.range(0.3, 0.45);
    const cell = (x, y, s) => {
      const v = warp(x + s / 2, y + s / 2);
      const detail = M((x + s / 2) / 200, (y + s / 2) / 200);
      if (s > base / 4 && R() < clamp(detail * 1.3 - 0.35) * (s / base < 0.6 ? 0.5 : 1)) {
        const h = s / 2; cell(x, y, h); cell(x + h, y, h); cell(x, y + h, h); cell(x + h, y + h, h); return;
      }
      if (v < thr * 0.9 && R() < 0.9) return; // respiro blanco
      const t = clamp((v - 0.15) / 0.7);
      if (s >= base / 2 && R() < 0.45) { // alguna celda con tiras de degradado
        const k = R.int(3, 5), vert = R() < 0.5;
        for (let i = 0; i < k; i++) {
          ctx.fillStyle = rgb(ramp(fams, t + (i / k - 0.5) * 0.18));
          if (vert) ctx.fillRect(x + i * s / k, y, s / k + 0.5, s); else ctx.fillRect(x, y + i * s / k, s, s / k + 0.5);
        }
      } else { ctx.fillStyle = rgb(ramp(fams, t)); ctx.fillRect(x, y, s + 0.5, s + 0.5); }
    };
    for (let y = 0; y < H; y += base) for (let x = 0; x < W; x += base) cell(x, y, base);
  }

  // Mezcla: barras de degradado superpuestas en Luz fuerte (como en Illustrator)
  function overprint(ctx, W, H, o) {
    const R = o.R, g = Math.round(H / 12);
    const q = (v) => Math.round(v / g) * g;
    const n = R.int(6, 9);
    ctx.globalCompositeOperation = 'hard-light';
    for (let i = 0; i < n; i++) {
      const fam = R.pick(ORDER), vertical = R() < 0.5;
      const len = q(R.range(W * 0.35, W * 0.8)), th = q(R.range(H * 0.12, H * 0.34));
      const x = q(R.range(-W * 0.05, W * 0.75)), y = q(R.range(0, H * 0.8));
      strips(ctx, fam, x, y, vertical ? th : len, vertical ? len : th, R.int(6, 12), !vertical, R() < 0.5, 0, R);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------- Composiciones ---------- */
  const COMPS = {
    mas(ctx, W, H, o) { // retícula de cruces ("posibilidades infinitas")
      const R = o.R, cols = 3, rows = 2;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const fa = R.pick(ORDER), fb = otherFam(R, fa);
        plus(ctx, (c + 0.5) * W / cols, (r + 0.5) * H / rows, Math.min(W / cols, H / rows) * 0.42,
          { R, famH: fa, famV: fb });
      }
    },
    cruz(ctx, W, H, o) { // una cruz grande protagonista
      const fa = o.R.pick(ORDER), fb = otherFam(o.R, fa);
      plus(ctx, W / 2, H / 2, H * 0.42, { R: o.R, famH: fa, famV: fb, steps: 9 });
    },
    molinillo(ctx, W, H, o) { // cruces giradas con tiras desplazadas ("un signo más que va a más")
      const R = o.R;
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
        const fa = R.pick(ORDER), fb = otherFam(R, fa);
        plus(ctx, (c + 0.5) * W / 2, (r + 0.5) * H / 2, H * 0.3,
          { R, famH: fa, famV: fb, rot: R.range(-0.5, 0.5), skew: R.range(-0.45, 0.45), jitter: H * 0.012, steps: 8 });
      }
    },
    flujo: (ctx, W, H, o) => flow(ctx, W, H, o),
    bandas: (ctx, W, H, o) => bands(ctx, W, H, o),
    campo: (ctx, W, H, o) => mosaic(ctx, W, H, o),
    mezcla: (ctx, W, H, o) => overprint(ctx, W, H, o),
    disolver(ctx, W, H, o) { dissolvePlus(ctx, W, H, { ...o, famH: o.R.pick(ORDER), famV: otherFam(o.R, o.R.pick(ORDER)) }); },
  };

  // Conceptos -> composición (modo abstracto "que genera conceptos")
  const CONCEPTOS = {
    expandir: 'flujo', crecer: 'molinillo', sumar: 'mas', unir: 'cruz',
    diversidad: 'campo', mezclar: 'mezcla', conectar: 'bandas', transformar: 'disolver',
  };

  function render(canvas, spec) {
    const W = canvas.width, H = canvas.height, ctx = canvas.getContext('2d');
    const comp = COMPS[spec.comp] ? spec.comp : CONCEPTOS[spec.concepto] || 'mas';
    const seed = spec.seed || 1;
    const R = rng(seed);
    const layer = document.createElement('canvas');
    layer.width = W; layer.height = H;
    COMPS[comp](layer.getContext('2d'), W, H, { R, seed, fams: spec.fams });
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = spec.bg || '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(layer, 0, 0);
    return comp;
  }

  const api = { FAMILIES, ORDER, COMPS, CONCEPTOS, render, rng, ramp, mix };
  if (typeof module !== 'undefined') module.exports = api; else root.Identidad = api;
})(typeof window !== 'undefined' ? window : globalThis);
