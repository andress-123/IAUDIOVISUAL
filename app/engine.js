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


  // Figura de relleno para probar el modo figurativo sin foto (NO es una foto real)
  function demoFigure(W, H, seed) {
    const R = rng(seed), c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#e6e8ec'); bg.addColorStop(1, '#c8cbd1');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    const cx = W / 2, top = H * 0.08, hh = H * 0.84, u = hh / 8; // 8 cabezas de alto
    const skin = R.pick(['#c68a63', '#a96d4b', '#e0ac88', '#8a5a3c']), cloth = R.pick(['#1d2433', '#2b2b2b', '#3a2a4a']), pants = R.pick(['#2d4a3a', '#1f2a44', '#4a3328']);
    x.fillStyle = 'rgba(0,0,0,.12)'; x.beginPath(); x.ellipse(cx, top + hh, u * 2.3, u * 0.28, 0, 0, 7); x.fill();
    const rr = (a, b, w, h, r, col) => { x.fillStyle = col; x.beginPath(); x.roundRect(a, b, w, h, r); x.fill(); };
    rr(cx - u * 0.95, top + u * 4.6, u * 0.85, u * 3.3, u * 0.3, pants); rr(cx + u * 0.1, top + u * 4.6, u * 0.85, u * 3.3, u * 0.3, pants);   // piernas
    rr(cx - u * 1.1, top + u * 7.75, u * 1.1, u * 0.25, u * 0.12, '#111'); rr(cx, top + u * 7.75, u * 1.1, u * 0.25, u * 0.12, '#111');       // zapatos
    rr(cx - u * 1.35, top + u * 1.75, u * 2.7, u * 3.1, u * 0.7, cloth);                                                                        // torso
    rr(cx - u * 1.95, top + u * 1.9, u * 0.65, u * 2.7, u * 0.3, cloth); rr(cx + u * 1.3, top + u * 1.9, u * 0.65, u * 2.7, u * 0.3, cloth);   // brazos
    x.fillStyle = skin; x.beginPath(); x.ellipse(cx - u * 1.62, top + u * 4.75, u * 0.28, u * 0.32, 0, 0, 7); x.ellipse(cx + u * 1.62, top + u * 4.75, u * 0.28, u * 0.32, 0, 0, 7); x.fill(); // manos
    rr(cx - u * 0.28, top + u * 1.45, u * 0.56, u * 0.5, u * 0.15, skin);                                                                       // cuello
    x.beginPath(); x.ellipse(cx, top + u * 0.9, u * 0.62, u * 0.82, 0, 0, 7); x.fill();                                                        // cabeza
    x.fillStyle = '#1a1411'; x.beginPath(); x.ellipse(cx, top + u * 0.42, u * 0.66, u * 0.42, 0, Math.PI, 0); x.fill();                         // pelo
    x.globalCompositeOperation = 'destination-over'; x.fillStyle = bg; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
    return c;
  }

  // Modo figurativo: la figura se desintegra en bloques de la paleta (mosaico -> color -> aire)
  function figure(ctx, W, H, o) {
    const R = o.R, N = noise2(o.seed + 5);
    let img = o.image || demoFigure(W, H, o.seed);
    const src = document.createElement('canvas'); src.width = W; src.height = H;
    const sx = src.getContext('2d', { willReadFrequently: true });
    const k = Math.max(W / img.width, H / img.height), iw = img.width * k, ih = img.height * k;
    sx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);
    const px = sx.getImageData(0, 0, W, H).data;
    const at = (x, y) => { const i = (clamp(y | 0, 0, H - 1) * W + clamp(x | 0, 0, W - 1)) * 4; return [px[i], px[i + 1], px[i + 2]]; };
    const avg = (x, y, s) => { let r = 0, g = 0, b = 0, n = 0; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const c = at(x + (i + 0.5) * s / 4, y + (j + 0.5) * s / 4); r += c[0]; g += c[1]; b += c[2]; n++; } return [r / n, g / n, b / n]; };
    const bgc = avg(4, 4, 8);
    const fams = o.fams || subset(R, 4);
    // el eje de disolución apunta hacia abajo/los lados: la parte alta (cara) se conserva
    const ang = R.pick([Math.PI / 2, Math.PI / 3, 2 * Math.PI / 3, Math.PI / 4, 3 * Math.PI / 4]) + R.range(-0.15, 0.15), ax = Math.cos(ang), ay = Math.sin(ang);
    const cell = Math.round(H / 34);
    ctx.drawImage(src, 0, 0); // base fotográfica
    for (let gy = 0; gy < H; gy += cell) for (let gx = 0; gx < W; gx += cell) {
      const px0 = (gx - W / 2) / W, py0 = (gy - H / 2) / H;
      const t = clamp((px0 * ax + py0 * ay) * 1.3 + 0.5 + (N(gx / 140, gy / 140) - 0.5) * 0.3); // 0..1 a lo largo del eje de disolución
      const p = clamp((t - 0.5) / 0.5);
      if (p < 0.04) continue;
      const rnd = R();
      const c = avg(gx, gy, cell), isBg = Math.hypot(c[0] - bgc[0], c[1] - bgc[1], c[2] - bgc[2]) < 38;
      const sz = rnd < 0.25 ? cell / 2 : cell;
      if (p < 0.38) { ctx.fillStyle = rgb(c); ctx.fillRect(gx, gy, cell, cell); continue; }       // 1) mosaico de la foto
      const bgRow = avg(4, gy, 8); ctx.fillStyle = rgb(bgRow); ctx.fillRect(gx, gy, cell, cell);       // limpio la celda con el fondo de su fila
      if (isBg && R() < 0.9) continue;                                                              // el fondo desaparece
      if (R() > 1.15 - p) continue;                                                                 // 2) cada vez menos bloques
      ctx.fillStyle = rgb(c); ctx.fillRect(gx, gy, cell, cell);
      ctx.globalCompositeOperation = 'hard-light';                                                  // 3) tinte de paleta en Luz fuerte
      ctx.fillStyle = rgb(ramp(fams, t + (R() - 0.5) * 0.2)); ctx.fillRect(gx + (cell - sz) * R(), gy + (cell - sz) * R(), sz, sz);
      ctx.globalCompositeOperation = 'source-over';
    }
    // cruces de la identidad fundidas sobre la figura
    const nc = R.int(1, 2);
    for (let i = 0; i < nc; i++) {
      const fa = fams[i % fams.length], fb = fams[(i + 1) % fams.length];
      ctx.globalCompositeOperation = 'hard-light';
      plus(ctx, W * R.range(0.3, 0.7), H * R.range(0.58, 0.82), H * 0.2, { R, famH: fa, famV: fb, steps: 8 });
      ctx.globalCompositeOperation = 'source-over';
    }
  }


  // Silueta pixelada (estilo "Portrait animate"): retrato -> píxeles gruesos de un solo tono con degradado
  function pixelFigure(ctx, W, H, o) {
    const R = o.R, img = o.image || demoFigure(W, H, o.seed);
    const src = document.createElement('canvas'); src.width = W; src.height = H;
    const sx = src.getContext('2d', { willReadFrequently: true });
    const k = Math.max(W / img.width, H / img.height), iw = img.width * k, ih = img.height * k;
    sx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);
    const px = sx.getImageData(0, 0, W, H).data;
    const modoPre = o.degradado || ['diagonal', 'mapa', 'mixto'][(o.seed - 1) % 3];
    const cols = o.cols || ({ diagonal: 60, mapa: 84, mixto: 72, vertical: 56 }[modoPre]), cell = W / cols, rows = Math.ceil(H / cell);
    const g = []; // color medio de cada celda
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let rr = 0, gg = 0, bb = 0, n = 0;
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
        const x = clamp(((c + (i + 0.5) / 4) * cell) | 0, 0, W - 1), y = clamp(((r + (j + 0.5) / 4) * cell) | 0, 0, H - 1), p = (y * W + x) * 4;
        rr += px[p]; gg += px[p + 1]; bb += px[p + 2]; n++;
      }
      g.push([rr / n, gg / n, bb / n]);
    }
    const lum = g.map((c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]);
    // fondo: se parte de la fila superior y se sigue hacia abajo cogiendo, de los dos bordes, la celda más parecida a la fila anterior
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const bgs = [];
    { let a = [0, 0, 0]; for (let c = 0; c < cols; c++) { a[0] += g[c][0]; a[1] += g[c][1]; a[2] += g[c][2]; } bgs[0] = a.map((v) => v / cols); }
    for (let r = 1; r < rows; r++) {
      const cand = [g[r * cols], g[r * cols + cols - 1]].sort((p, q) => dist(p, bgs[r - 1]) - dist(q, bgs[r - 1]))[0];
      bgs[r] = dist(cand, bgs[r - 1]) < 40 ? cand : bgs[r - 1];
    }
    const bgRow = (r) => bgs[r];
    const local = (c, r, rad) => { let s2 = 0, n = 0; for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) { const cc = c + i, r2 = r + j; if (cc >= 0 && cc < cols && r2 >= 0 && r2 < rows) { s2 += lum[r2 * cols + cc]; n++; } } return s2 / n; };
    const T = o.umbral || 55;
    // Degradados: 'vertical' (un tono), 'diagonal' (rampa escalonada), 'mapa' (la luz de la foto recorre la rampa), 'mixto'
    const modo = o.degradado || ['diagonal', 'mapa', 'mixto'][(o.seed - 1) % 3];
    const fams = o.fams || (modo === 'vertical'
      ? [ORDER[(o.seed - 1) % ORDER.length]]
      : [0, 2, 4].map((k) => ORDER[(o.seed - 1 + k) % ORDER.length]));   // 3 familias vecinas en el ciclo de la paleta
    const holeT = o.huecos || 20;                                          // huecos en las luces (ojos, dientes) para que la figura se lea
    const white = [255, 255, 255], tint = (f, k) => mix(white, hex(FAMILIES[f].end), k);
    const bg = ctx.createLinearGradient(0, 0, W, H);                      // fondo con degradado diagonal entre las familias
    bg.addColorStop(0, rgb(tint(fams[0], 0.14))); bg.addColorStop(1, rgb(tint(fams[fams.length - 1], 0.5)));
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // 1) celdas de la figura
    const sub = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, b = bgRow(r);
      if (dist(g[i], b) < T) continue;                                                      // fondo
      if (lum[i] - local(c, r, 3) > holeT) continue;                                        // luces -> huecos
      sub.push([c, r, lum[i]]);
    }
    const ls = sub.map((p) => p[2]).sort((p, q) => p - q), lo = ls[Math.floor(ls.length * 0.04)] || 0, hi = ls[Math.floor(ls.length * 0.96)] || 255;
    const steps = o.pasos || 9, q = (t) => Math.floor(clamp(t) * steps) / (steps - 1);       // escalones como las tiras de la identidad
    const N = noise2(o.seed + 9);
    // 2) color de cada celda
    for (const [c, r, l] of sub) {
      const tl = clamp((l - lo) / (hi - lo));                                              // 0 = sombra, 1 = luz
      const td = 0.5 * c / cols + 0.5 * r / rows + (N(c / 9, r / 9) - 0.5) * 0.18;           // posición diagonal con algo de ruido
      let col;
      // se combinan POSICIONES en la rampa (no colores): así no aparecen grises sucios al cruzar tonos
      if (modo === 'vertical') col = grad(fams[0], clamp(0.1 + (r / rows) * 0.9) * 0.85);
      else if (modo === 'diagonal') col = ramp(fams, q(0.7 * td + 0.3 * tl));                  // gradiente diagonal con la luz de la foto
      else if (modo === 'mapa') col = ramp(fams, q(tl));                                       // la luz de la foto recorre la rampa
      else col = ramp(fams, q(0.35 * td + 0.65 * tl));                                         // mixto
      ctx.fillStyle = rgb(col);
      const x0 = Math.round(c * cell), y0 = Math.round(r * cell);
      ctx.fillRect(x0, y0, Math.round((c + 1) * cell) - x0, Math.round((r + 1) * cell) - y0);
    }
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
    figura: (ctx, W, H, o) => figure(ctx, W, H, o),
    silueta: (ctx, W, H, o) => pixelFigure(ctx, W, H, o),
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
    COMPS[comp](layer.getContext('2d'), W, H, { R, seed, fams: spec.fams, image: spec.image });
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = spec.bg || '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(layer, 0, 0);
    return comp;
  }

  const api = { FAMILIES, ORDER, COMPS, CONCEPTOS, render, rng, ramp, mix };
  if (typeof module !== 'undefined') module.exports = api; else root.Identidad = api;
})(typeof window !== 'undefined' ? window : globalThis);
