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
  // oscurece sin ensuciar: baja L en OKLab y refuerza algo el croma (el naranja oscuro no se vuelve barro)
  const shade = (c, k) => { const L = toLab(c), f = 1 + 0.35 * k; return fromLab([L[0] * (1 - k), L[1] * f, L[2] * f]); };
  // Recorridos de la paleta ordenados de OSCURO a CLARO: el tono de la foto avanza por el degradado (vivo, sin sombras sucias)
  // y la forma se lee porque la claridad crece siempre en el mismo sentido.
  const PATHS = [
    ['#0050FF', '#009EDE', '#5AB32A', '#99E371', '#F4C00E'],             // azul -> azul claro -> verde -> lima -> amarillo
    ['#0050FF', '#009EDE', '#5CD0FF', '#99E371', '#E6FF8A'],             // azul -> cian -> lima
    ['#D02E26', '#FF6A00', '#F4C00E', '#99E371'],                         // rojo -> naranja -> amarillo -> lima
    ['#0050FF', '#009EDE', '#5AB32A', '#00E67A', '#E6FF8A'],             // azul -> verde -> verde claro
    ['#D02E26', '#FF00B4', '#FF6A00', '#F4C00E', '#E6FF8A'],             // rojo -> rosa -> naranja -> amarillo (como las láminas)
    ['#0050FF', '#00E67A', '#99E371', '#F4C00E'],                         // azul -> verde menta -> lima -> amarillo
  ];
  // mezcla en OKLCH: interpola luminosidad y croma y gira el matiz por el camino corto -> el degradado se mantiene saturado (azul->verde pasa por cian, no por gris)
  const mixLch = (c1, c2, t) => {
    const A = toLab(c1), B = toLab(c2), Ca = Math.hypot(A[1], A[2]), Cb = Math.hypot(B[1], B[2]);
    const ha = Math.atan2(A[2], A[1]); let dh = Math.atan2(B[2], B[1]) - ha;
    while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI;
    const L = lerp(A[0], B[0], t), C = lerp(Ca, Cb, t), h = ha + dh * t;
    return fromLab([L, C * Math.cos(h), C * Math.sin(h)]);
  };
  const pathColor = (stops, t) => { const n = stops.length - 1, x = clamp(t) * n, i = Math.min(n - 1, Math.floor(x)); return mixLch(hex(stops[i]), hex(stops[i + 1]), x - i); };
  // rampas de 2-3 familias SEGURAS: avanzan por matices vecinos, así las transiciones no pasan por grises
  const SAFE_RAMPS = [['blue', 'green', 'yellow'], ['blue', 'cyan', 'green'], ['cyan', 'green', 'lime'], ['green', 'lime', 'yellow'], ['lime', 'yellow', 'red'], ['green', 'yellow', 'red']];
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
    const L1 = s * (o.L1 ?? R.range(0.55, 1)), L2 = s * (o.L2 ?? R.range(0.55, 1));
    const T1 = s * (o.T1 ?? R.range(0.12, 0.34)), T2 = s * (o.T2 ?? R.range(0.14, 0.34));
    const U1 = s * (o.U1 ?? R.range(0.55, 1)), U2 = s * (o.U2 ?? R.range(0.55, 1));
    const rH = o.revH ?? (R() < 0.5), rV = o.revV ?? (R() < 0.5);
    const n = o.steps || R.int(5, 9);
    ctx.save();
    ctx.translate(cx, cy);
    if (o.rot) ctx.rotate(o.rot);
    if (o.skew) ctx.transform(1, 0, o.skew, 1, 0, 0);
    strips(ctx, fa, -L1, -T1 / 2, L1 + L2, T1, n, true, rH, o.jitter || 0, R);
    ctx.globalCompositeOperation = 'hard-light'; // modo de fusión de la identidad (Illustrator: Luz fuerte)
    strips(ctx, fb, -T2 / 2, -U1, T2, U1 + U2, Math.max(o.steps ? 2 : 4, n - 1), false, rV, o.jitter || 0, R);
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
    // MARGEN para que las partículas tengan sitio: solo en los lados donde el borde de la foto es fondo limpio.
    // Donde la figura sale del encuadre (cuerpo, hombro) la imagen se queda a ras, sin extender nada.
    const mg = o.margen === undefined ? 0.1 : +o.margen;
    const tmp = document.createElement('canvas'); tmp.width = img.width; tmp.height = img.height;
    const tx = tmp.getContext('2d', { willReadFrequently: true }); tx.drawImage(img, 0, 0);
    const id = tx.getImageData(0, 0, img.width, img.height).data, iw1 = img.width, ih1 = img.height;
    const at = (x, y) => { const i = (y * iw1 + x) * 4; return [id[i], id[i + 1], id[i + 2]]; };
    const ref = [0, 0, 0]; for (let i = 0; i < 40; i++) { const c = at(Math.floor((i + 0.5) / 40 * iw1), 0); ref[0] += c[0] / 40; ref[1] += c[1] / 40; ref[2] += c[2] / 40; }
    const clean = (f) => { let ok = 0; for (let i = 0; i < 60; i++) { const t = (i + 0.5) / 60, c = f(t); if (Math.hypot(c[0] - ref[0], c[1] - ref[1], c[2] - ref[2]) < 70) ok++; } return ok / 60 > 0.93; };
    const mT = clean((t) => at(Math.floor(t * iw1), 0)) ? mg : 0, mB = clean((t) => at(Math.floor(t * iw1), ih1 - 1)) ? mg : 0;
    const mL = clean((t) => at(0, Math.floor(t * ih1))) ? mg : 0, mR = clean((t) => at(iw1 - 1, Math.floor(t * ih1))) ? mg : 0;
    const k = Math.max(W * (1 - mL - mR) / iw1, H * (1 - mT - mB) / ih1), iw = iw1 * k, ih = ih1 * k;
    const ix = Math.round(mL > 0 && mR === 0 ? W * mL : mR > 0 && mL === 0 ? W * (1 - mR) - iw : (W - iw) / 2), iy = Math.round(mT > 0 && mB === 0 ? H * mT : mB > 0 && mT === 0 ? H * (1 - mB) - ih : (H - ih) / 2);   // margen en el lado limpio; en el lado opuesto se recorta
    const iw2 = Math.round(iw), ih2 = Math.round(ih);
    if (ix > 0) sx.drawImage(img, 0, 0, 1, ih1, 0, iy, ix, ih2);                              // relleno de margen: se repite el borde de la foto
    if (ix + iw2 < W) sx.drawImage(img, iw1 - 1, 0, 1, ih1, ix + iw2, iy, W - ix - iw2, ih2);
    if (iy > 0) sx.drawImage(img, 0, 0, iw1, 1, ix, 0, iw2, iy);
    if (iy + ih2 < H) sx.drawImage(img, 0, ih1 - 1, iw1, 1, ix, iy + ih2, iw2, H - iy - ih2);
    if (ix > 0 && iy > 0) sx.drawImage(img, 0, 0, 1, 1, 0, 0, ix, iy);
    if (ix + iw2 < W && iy > 0) sx.drawImage(img, iw1 - 1, 0, 1, 1, ix + iw2, 0, W - ix - iw2, iy);
    if (ix > 0 && iy + ih2 < H) sx.drawImage(img, 0, ih1 - 1, 1, 1, 0, iy + ih2, ix, H - iy - ih2);
    if (ix + iw2 < W && iy + ih2 < H) sx.drawImage(img, iw1 - 1, ih1 - 1, 1, 1, ix + iw2, iy + ih2, W - ix - iw2, H - iy - ih2);
    sx.drawImage(img, ix, iy, iw2, ih2);
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
      : SAFE_RAMPS[(o.seed - 1) % SAFE_RAMPS.length]);   // combinaciones de familias ordenadas por matiz que se mezclan limpias (sin saltos tipo amarillo->azul, que dan gris)
    const holeT = o.huecos || 20;                                          // huecos en las luces (ojos, dientes) para que la figura se lea
    // 1) celdas de la figura: fondo = celdas parecidas al fondo CONECTADAS con el borde (flood fill);
    //    lo claro del interior (océano de un globo, un diente) sigue siendo parte del objeto
    const bgLike = g.map((cc, i) => dist(cc, bgs[(i / cols) | 0]) < T);
    const out = new Uint8Array(rows * cols), stack = [];
    const push = (c, r) => { const i = r * cols + c; if (c >= 0 && c < cols && r >= 0 && r < rows && bgLike[i] && !out[i]) { out[i] = 1; stack.push(i); } };
    for (let c = 0; c < cols; c++) { push(c, 0); push(c, rows - 1); }
    for (let r = 0; r < rows; r++) { push(0, r); push(cols - 1, r); }
    while (stack.length) { const i = stack.pop(), c = i % cols, r = (i / cols) | 0; push(c + 1, r); push(c - 1, r); push(c, r + 1); push(c, r - 1); }
    const cand = []; let eligibles = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (out[i]) continue;
      const hole = lum[i] - local(c, r, 3) > holeT; if (hole) eligibles++;
      cand.push([c, r, lum[i], hole]);
    }
    // si "huecos" serían una parte grande de la figura (objeto con zonas claras, no un retrato), se desactivan solos
    const useHoles = eligibles / Math.max(1, cand.length) < 0.1;
    const sub = cand.filter((p) => !(p[3] && useHoles));
    const ls = sub.map((p) => p[2]).sort((p, q) => p - q), lo = ls[Math.floor(ls.length * 0.04)] || 0, hi = ls[Math.floor(ls.length * 0.96)] || 255;
    const steps = o.pasos || 9, desp = o.desp || 0;
    const refl = (x) => { const m = ((x % 2) + 2) % 2; return m <= 1 ? m : 2 - m; };      // onda triangular: periodo 2, continua
    const q = (t) => Math.floor(clamp(refl(t + desp)) * steps * 0.9999) / (steps - 1);       // escalones como las tiras de la identidad
    const N = noise2(o.seed + 9);
    // 2) color de cada celda
    const colMap = new Map(), info = new Map();
    for (const [c, r, l] of sub) {
      const tl = clamp((l - lo) / (hi - lo));                                              // 0 = sombra, 1 = luz
      const td = 0.5 * c / cols + 0.5 * r / rows + (N(c / 9, r / 9) - 0.5) * 0.12;           // posición diagonal con algo de ruido
      info.set(r * cols + c, [tl, td]);
    }
    const PAL = o.camino || PATHS[(o.seed - 1) % PATHS.length];
    const GR = rng((o.seed || 1) * 7717 + 3), GN = noise2(o.seed + 555);                   // azar de huecos y orientaciones
    const tOf = (tl, td) => clamp(tl + (td - 0.5) * 0.22);                                // el tono manda; deriva diagonal suave
    const solidCss = (t) => rgb(pathColor(PAL, Math.floor(t * 10 * 0.9999) / 9));            // píxel suelto: color vivo, escalonado
    const span = 1.5 / (PAL.length - 1);                                                    // tramo del recorrido que se ve dentro de un bloque
    const gapOn = o.huecosBlancos === undefined ? 1 : +o.huecosBlancos;
    // huecos en blanco: más probables en bloques grandes y en ciertas zonas (agrupados, no uniformes)
    const gapP = (c, r, sz) => gapOn * { 8: 0.22, 4: 0.15, 2: 0.09, 1: 0.04 }[sz] * (0.2 + 1.6 * GN(c / 7, r / 7));
    const paint = (c, r, sz, t) => {
      const x0 = Math.round(c * cell), y0 = Math.round(r * cell), x1 = Math.round((c + sz) * cell), y1 = Math.round((r + sz) * cell), w = x1 - x0, h = y1 - y0;
      const key = solidCss(t);
      for (let dr = 0; dr < sz; dr++) for (let dc = 0; dc < sz; dc++) colMap.set((r + dr) * cols + c + dc, key);   // las partículas heredan este color aunque el bloque sea un hueco
      if (GR() < gapP(c, r, sz)) return;                                                   // hueco en blanco
      if (sz < 4) { ctx.fillStyle = key; ctx.fillRect(x0, y0, w, h); return; }                 // píxeles pequeños y 2x2: color vivo liso; el degradado va en los bloques grandes
      // DEGRADADO dentro del bloque: tiras que recorren un tramo del degradado de la paleta (como las barras de las láminas)
      const k = sz >= 8 ? 6 : 4, vert = GR() < 0.85;                                           // pocas tiras anchas; casi siempre en el mismo sentido para que se encadenen
      for (let i = 0; i < k; i++) {
        ctx.fillStyle = rgb(pathColor(PAL, t + (i / (k - 1) - 0.5) * span));
        if (vert) { const a = x0 + Math.round(w * i / k), b = x0 + Math.round(w * (i + 1) / k); ctx.fillRect(a, y0, b - a, h); }
        else { const a = y0 + Math.round(h * i / k), b = y0 + Math.round(h * (i + 1) / k); ctx.fillRect(x0, a, w, b - a); }
      }
    };
    // PÍXELES DE VARIOS TAMAÑOS: bloques grandes donde el tono es casi plano (cuerpo, pelo) y pequeños donde hay detalle (cara, bordes)
    const used = new Uint8Array(rows * cols), bigOn = o.bloques === undefined ? 1 : +o.bloques;
    if (bigOn > 0) for (const sz of [8, 4, 2]) {
      const tol = { 8: 0.10, 4: 0.13, 2: 0.15 }[sz] * bigOn;
      for (let r0 = 0; r0 + sz <= rows; r0 += sz) for (let c0 = 0; c0 + sz <= cols; c0 += sz) {
        let ok = true, mn = 1, mx = 0, st = 0, sd = 0;
        for (let dr = 0; dr < sz && ok; dr++) for (let dc = 0; dc < sz; dc++) {
          const i = (r0 + dr) * cols + c0 + dc, v = info.get(i);
          if (!v || used[i]) { ok = false; break; }
          mn = Math.min(mn, v[0]); mx = Math.max(mx, v[0]); st += v[0]; sd += v[1];
        }
        if (!ok || mx - mn > tol) continue;
        paint(c0, r0, sz, tOf(st / (sz * sz), sd / (sz * sz)));
        for (let dr = 0; dr < sz; dr++) for (let dc = 0; dc < sz; dc++) used[(r0 + dr) * cols + c0 + dc] = 1;
      }
    }
    for (const [c, r] of sub) { const i = r * cols + c; if (used[i]) continue; const v = info.get(i); paint(c, r, 1, tOf(v[0], v[1])); }
    // ---- partículas de expansión: MISMO píxel y misma rejilla que la figura, solo en unas pocas áreas al azar ----
    const dens = o.particulas === undefined ? 1 : +o.particulas;
    if (dens > 0 && sub.length) {
      const PR = rng((o.seed || 1) * 104729 + 7), nb = rows * cols;
      const pUsed = new Uint8Array(nb), isSub = new Uint8Array(nb), dst = new Float32Array(nb).fill(1e9), src = new Int32Array(nb).fill(-1), qq = [];
      sub.forEach(([c, r]) => { const i = r * cols + c; isSub[i] = 1; dst[i] = 0; src[i] = i; qq.push(i); });
      for (let h = 0; h < qq.length; h++) {                         // distancia a la figura, solo por el fondo exterior
        const i = qq[h], c = i % cols, r = (i / cols) | 0;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const c2 = c + dc, r2 = r + dr; if ((!dr && !dc) || c2 < 0 || c2 >= cols || r2 < 0 || r2 >= rows) continue;
          const j = r2 * cols + c2, nd = dst[i] + (dr && dc ? 1.41 : 1);
          if (out[j] && nd < dst[j] && nd <= 14) { dst[j] = nd; src[j] = src[i]; qq.push(j); }
        }
      }
      // áreas: unas pocas zonas aleatorias ancladas en el borde de la figura (no por todo el lienzo)
      const edge = sub.filter(([c, r]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => { const c2 = c + dc, r2 = r + dr; return c2 >= 0 && c2 < cols && r2 >= 0 && r2 < rows && out[r2 * cols + c2]; }));
      const blobs = []; if (edge.length) for (let k = PR.int(3, 5); k > 0; k--) { const a = PR.pick(edge); blobs.push({ c: a[0], r: a[1], rad: PR.range(4, 8) }); }
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (isSub[i] || !out[i] || dst[i] > 14 || src[i] < 0) continue;
        let w = 0; for (const b of blobs) w = Math.max(w, Math.exp(-((c - b.c) ** 2 + (r - b.r) ** 2) / (2 * (b.rad * 0.65) ** 2)));
        if (PR() > dens * 0.85 * w * Math.exp(-dst[i] / 5)) continue;
        if (pUsed[i]) continue;
        const css = colMap.get(src[i]);                              // mismo color que el píxel de la figura del que sale
        const free = (j) => out[j] && !isSub[j] && !pUsed[j];
        const two = PR() < 0.28 && c + 1 < cols && r + 1 < rows && free(i) && free(i + 1) && free(i + cols) && free(i + cols + 1);
        const szp = two ? 2 : 1;                                     // algunas partículas más grandes (2x2), el resto del tamaño fino
        for (let dr = 0; dr < szp; dr++) for (let dc = 0; dc < szp; dc++) pUsed[i + dr * cols + dc] = 1;
        const x0 = Math.round(c * cell), y0 = Math.round(r * cell);
        ctx.fillStyle = css; ctx.fillRect(x0, y0, Math.round((c + szp) * cell) - x0, Math.round((r + szp) * cell) - y0);
      }
    }
  }


  /* ---------- Conceptos: forma = idea (todo parte de la cruz con tiras) ---------- */
  const ease = (t) => t * t * (3 - 2 * t);

  // OPTIMISMO: cruces que ascienden y crecen hacia delante; el brazo vertical se estira hacia arriba y se aclara
  function optimismo(ctx, W, H, o) {
    const R = o.R, n = 6, seqH = ['yellow', 'lime', 'green', 'cyan', 'blue'], seqV = ['red', 'yellow', 'lime', 'cyan', 'yellow'];
    const off = R.range(-0.03, 0.03);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), k = Math.min(seqH.length - 1, Math.floor(t * seqH.length));
      plus(ctx, W * (0.12 + 0.68 * t), H * (0.8 - 0.4 * Math.pow(t, 0.9) + off * Math.sin(i * 1.7)), H * (0.07 + 0.14 * t),
        { R, famH: seqH[k], famV: seqV[k], L1: 1, L2: 1, U1: 1.5, U2: 0.45, T1: 0.4, T2: 0.4, rot: 0.04 + 0.14 * t, steps: 7, revH: false, revV: true });
    }
  }

  // CABEZONERÍA: el flujo choca contra una cruz maciza e inamovible; los bloques se comprimen y se calientan
  function cabezoneria(ctx, W, H, o) {
    const R = o.R, cx = W * R.range(0.6, 0.68), cy = H * 0.5, s = H * 0.36, T = 0.44;
    const rows = 13, rh = H / rows, x0 = W * 0.04, m = 9;
    for (let k = 0; k < rows; k++) {
      const y = (k + 0.5) * rh;
      const hit = Math.abs(y - cy) <= s, face = !hit ? W * 0.97 : (Math.abs(y - cy) <= T * s / 2 ? cx - s : cx - T * s / 2);
      const L = face - x0;
      for (let j = 0; j < m; j++) {
        const a = x0 + L * (1 - Math.pow(1 - j / m, 1.8)), b = x0 + L * (1 - Math.pow(1 - (j + 1) / m, 1.8));
        const heat = hit ? (j + 1) / m : 0.15 + 0.2 * (j / m);
        ctx.fillStyle = rgb(ramp(['yellow', 'red'], heat));
        const dy = hit ? R.range(-1, 1) * rh * 0.1 * heat : 0;
        ctx.fillRect(a, y - rh * 0.38 + dy, b - a - (hit ? 1 : 0.5), rh * 0.76);
      }
    }
    plus(ctx, cx, cy, s, { R, famH: 'red', famV: 'red', L1: 1, L2: 1, U1: 1, U2: 1, T1: T, T2: T, steps: 3, revH: false, revV: false });
  }

  // TRABAJO DURO: cruces apiladas como ladrillos en una pirámide; la última fila sigue a medio hacer
  function trabajo(ctx, W, H, o) {
    const R = o.R, rowsN = 6, cs = H * 0.09, pitch = cs * 2, seq = ['red', 'yellow', 'lime', 'green', 'cyan', 'blue'];
    const vs = R.pick([0, 2, 4]);
    for (let r = 0; r < rowsN; r++) {
      const count = 8 - r, y = H * 0.88 - r * cs * 1.4, x0 = W / 2 - ((count - 1) / 2) * pitch;
      for (let c = 0; c < count; c++) {
        const half = r === rowsN - 1 && c >= count - 2;                         // fila de arriba sin terminar
        plus(ctx, x0 + c * pitch, y, cs, { R, famH: seq[r], famV: seq[(r + 1 + vs) % 6], L1: 1, L2: 1, U1: half ? 0.2 : 1, U2: half ? 0.2 : 1,
          T1: 0.5, T2: 0.5, steps: 4, revH: r % 2 === 0, revV: false });
      }
    }
  }

  // CALMA: pocas cruces, alineadas en el horizonte, brazos largos y horizontales, muchos pasos suaves y mucho aire
  function calma(ctx, W, H, o) {
    const R = o.R, cool = ['blue', 'cyan', 'green', 'lime'], n = 3, y = H * 0.5;
    const picks = [R.pick(cool), R.pick(cool), R.pick(cool)];
    for (let i = 0; i < n; i++) {
      plus(ctx, W * (0.2 + 0.3 * i), y, H * 0.2, { R, famH: picks[i], famV: cool[(cool.indexOf(picks[i]) + 1) % 4], L1: 1.25, L2: 1.25, U1: 0.6, U2: 0.6, T1: 0.34, T2: 0.1, steps: 14, revH: false, revV: false });
    }
    strips(ctx, 'cyan', W * 0.08, H * 0.8, W * 0.84, H * 0.03, 28, true, false, 0, R);   // línea de horizonte
  }

  // CAOS: muchas cruces de todos los tamaños, giradas y solapadas en Luz fuerte
  function caos(ctx, W, H, o) {
    const R = o.R;
    ctx.globalCompositeOperation = 'hard-light';
    for (let i = 0; i < 42; i++) {
      const fa = R.pick(ORDER), fb = otherFam(R, fa);
      plus(ctx, R.range(0, W), R.range(0, H), H * R.range(0.04, 0.2), { R, famH: fa, famV: fb, rot: R.range(-1.4, 1.4), skew: R.range(-0.5, 0.5), jitter: H * 0.01, steps: R.int(4, 9) });
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // UNIÓN: un anillo de cruces cuyos brazos se solapan con los vecinos y mezclan sus colores
  function union(ctx, W, H, o) {
    const R = o.R, n = R.pick([6, 7, 8]), rad = H * 0.3, cx = W / 2, cy = H / 2, chord = 2 * rad * Math.sin(Math.PI / n);
    const st = R.int(0, 5);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      plus(ctx, cx + rad * Math.cos(a), cy + rad * Math.sin(a), chord * 0.62,
        { R, famH: ORDER[(st + i) % 6], famV: ORDER[(st + i + 3) % 6], rot: a + Math.PI / 2, L1: 1, L2: 1, U1: 0.55, U2: 0.55, T1: 0.34, T2: 0.28, steps: 7, revH: false, revV: false });
    }
  }


  /* ---------- Estilo "riso de puntos": trazo de cuentas + capas de color desalineadas + líneas verticales ---------- */
  const bez = (a, b, c, d, t) => { const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]; };

  // trazo hecho de puntos solapados a lo largo de una curva; el radio varía con el recorrido
  function beads(ctx, curve, color, rfn, dx, dy, gap) {
    ctx.fillStyle = color; let last = null;
    for (let i = 0; i <= 220; i++) {
      const t = i / 220, p = curve(t), r = rfn(t);
      if (r < 0.4) continue;
      if (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < r * (gap || 1.1)) continue;
      ctx.beginPath(); ctx.arc(p[0] + dx, p[1] + dy, r, 0, 7); ctx.fill(); last = p;
    }
  }

  // Planta en maceta (la forma es generada; el estilo es el de la referencia)
  function planta(ctx, W, H, o) {
    const R = o.R, fams = o.fams || subset(R, 4), u = H;
    const inks = [[20, 20, 24], hex(FAMILIES.blue.end), [20, 20, 24], hex(FAMILIES.red.base)];
    const ink = rgb(o.tinta ? hex(o.tinta) : inks[(o.seed - 1) % 4]);
    const px = W * 0.5 + R.range(-0.04, 0.04) * W, top = u * R.range(0.62, 0.68);
    // 1) maceta: forma base + bandas de color desplazadas (como la maceta de la referencia)
    const wt = u * R.range(0.26, 0.32), wb = wt * R.range(0.62, 0.78), hp = u * R.range(0.16, 0.2);
    const poly = [[px - wt / 2, top], [px + wt / 2, top], [px + wb / 2, top + hp], [px - wb / 2, top + hp]];
    ctx.save(); ctx.beginPath(); poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.clip();
    ctx.fillStyle = rgb(grad(fams[0], 0.1)); ctx.fillRect(px - wt, top, wt * 2, hp);
    const bands = [fams[1], fams[2], fams[3], fams[0]];
    let bx = px - wt / 2 + wt * R.range(0.5, 0.6);
    bands.forEach((f, k) => {
      const bw = wt * R.range(0.07, 0.12), dy = u * R.range(0, 0.05) * (k + 1);
      ctx.fillStyle = rgb(grad(f, 0.15 + 0.2 * k)); ctx.fillRect(bx, top + dy, bw, hp); bx += bw * 0.92;
    });
    ctx.restore();
    // tierra: triángulo de color encima, desplazado
    ctx.fillStyle = rgb(grad(fams[2], 0.9));
    ctx.beginPath(); ctx.moveTo(px - wt * 0.3, top - u * 0.01); ctx.lineTo(px + wt * 0.12, top - u * 0.01); ctx.lineTo(px - wt * 0.1, top + u * 0.07); ctx.closePath(); ctx.fill();
    // 2) hojas
    const nL = R.int(8, 12), leaves = [];
    for (let i = 0; i < nL; i++) {
      const a = Math.PI * (0.1 + 0.8 * ((i + R.range(-0.3, 0.3)) / (nL - 1))), L = u * R.range(0.2, 0.44) * (0.75 + 0.25 * Math.sin(a));
      const base = [px + R.range(-0.035, 0.035) * W, top - u * 0.015], d = [Math.cos(a), -Math.sin(a)];
      const isFill = i % 4 === 1, nrm = [-d[1], d[0]], bend = L * R.range(-0.18, 0.18);
      const tip = [base[0] + d[0] * L, base[1] + d[1] * L + (!isFill && Math.abs(d[0]) > 0.5 ? L * R.range(0.1, 0.35) : 0)];
      const c1 = isFill ? [base[0] + d[0] * L * 0.33 + nrm[0] * bend, base[1] + d[1] * L * 0.33 + nrm[1] * bend] : [base[0] + d[0] * L * 0.3, base[1] + d[1] * L * 0.5 - L * 0.15];
      const c2 = isFill ? [base[0] + d[0] * L * 0.66 + nrm[0] * bend, base[1] + d[1] * L * 0.66 + nrm[1] * bend] : [tip[0] - d[0] * L * 0.2, tip[1] - L * R.range(0.15, 0.4)];
      leaves.push({ curve: (t) => bez(base, c1, c2, tip, t), L, fill: isFill });
    }
    // hojas rellenas de color (lente) con copias desplazadas, como capas mal registradas
    leaves.filter((l) => l.fill).slice(0, 2).forEach((l, k) => {
      const wmax = l.L * R.range(0.22, 0.32);
      [[fams[1], -u * 0.012, -u * 0.006, 0.7], [fams[3], u * 0.01, u * 0.008, 0.55], [fams[k % 2 ? 2 : 0], 0, 0, 0.3]].forEach(([f, dx, dy, tcol]) => {
        ctx.fillStyle = rgb(grad(f, tcol)); ctx.beginPath();
        const N = 40, up = [], dn = [];
        for (let i = 0; i <= N; i++) { const t = i / N, p = l.curve(t), q = l.curve(Math.min(1, t + 0.01)), n = [-(q[1] - p[1]), q[0] - p[0]], nl = Math.hypot(n[0], n[1]) || 1, w = wmax * Math.pow(Math.sin(Math.PI * t), 0.8); up.push([p[0] + (n[0] / nl) * w + dx, p[1] + (n[1] / nl) * w + dy]); dn.push([p[0] - (n[0] / nl) * w + dx, p[1] - (n[1] / nl) * w + dy]); }
        up.concat(dn.reverse()).forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
      });
    });
    // 3) flecos de color desalineados + 4) trazo de tinta con cuentas
    const rf = (rmax) => (t) => rmax * (0.25 + 0.75 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.6));
    leaves.forEach((l) => {
      const rmax = u * R.range(0.012, 0.028) * (l.fill ? 0.5 : 1);
      beads(ctx, l.curve, rgb(grad(fams[0], 0.6)), rf(rmax * 1.15), -u * 0.011, -u * 0.006);
      beads(ctx, l.curve, rgb(grad(fams[3], 0.5)), rf(rmax * 1.1), u * 0.009, u * 0.008);
      beads(ctx, l.curve, ink, rf(rmax), 0, 0);
    });
    // contorno de la maceta: cuentas en el borde derecho + trazo que cae debajo
    const edge = (t) => [poly[1][0] + (poly[2][0] - poly[1][0]) * t, poly[1][1] + (poly[2][1] - poly[1][1]) * t];
    beads(ctx, edge, ink, () => u * 0.009, u * 0.012, 0);
    beads(ctx, (t) => [px + wb / 2 + u * 0.018, top + hp * 0.1 + hp * 0.9 * t], ink, () => u * 0.011, 0, 0);
    // 5) líneas verticales finas sobre todo (efecto plotter/riso), recortando la capa
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,0.3)';
    const pitch = Math.max(3, Math.round(u / 280)); for (let x = 0; x < W; x += pitch) ctx.fillRect(x, 0, Math.max(1, pitch * 0.35), H);
    ctx.globalCompositeOperation = 'source-over';
  }


  /* ---------- Símbolo en 3D de bloques: glifo -> rejilla de píxeles -> extrusión con degradado escalonado ---------- */
  function glyph3d(ctx, W, H, o) {
    const R = o.R, ch = o.glifo || '€', N = o.cols || 40, D = o.prof || 18;
    // 1) máscara del glifo
    const S = 480, m = document.createElement('canvas'); m.width = m.height = S;
    const mx = m.getContext('2d', { willReadFrequently: true });
    mx.fillStyle = '#000'; mx.textAlign = 'center'; mx.textBaseline = 'middle';
    if (ch === '€') { // geometría clásica del euro (no depende de la tipografía): arco abierto a la derecha + 2 barras que cruzan el lado izquierdo
      const cx = S * 0.56, cy = S * 0.5, r = S * 0.32;
      mx.strokeStyle = '#000'; mx.lineWidth = S * 0.15; mx.lineCap = 'butt';
      mx.beginPath(); mx.arc(cx, cy, r, 0.72, Math.PI * 2 - 0.72, false); mx.stroke();
      mx.fillRect(cx - r - S * 0.09, cy - S * 0.115, r + S * 0.09 + S * 0.1, S * 0.075);
      mx.fillRect(cx - r - S * 0.09, cy + S * 0.04, r + S * 0.09 + S * 0.1, S * 0.075);
    } else {
      mx.font = `900 ${S * 0.8}px "Arial Black","Liberation Sans","DejaVu Sans",Arial,sans-serif`; mx.fillText(ch, S / 2, S / 2 + S * 0.05);
    }
    const px = mx.getImageData(0, 0, S, S).data;
    let x0 = S, x1 = 0, y0 = S, y1 = 0;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (px[(y * S + x) * 4 + 3] > 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, cs = Math.max(bw, bh) / N, cols = Math.ceil(bw / cs), rows = Math.ceil(bh / cs);
    const mask = [];
    for (let r = 0; r < rows; r++) { mask.push([]); for (let c = 0; c < cols; c++) {
      let a = 0, n = 0; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const x = Math.min(S - 1, (x0 + (c + (i + 0.5) / 4) * cs) | 0), y = Math.min(S - 1, (y0 + (r + (j + 0.5) / 4) * cs) | 0); a += px[(y * S + x) * 4 + 3] > 128 ? 1 : 0; n++; }
      mask[r].push(a / n > 0.5);
    } }
    const on = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols && mask[r][c];
    // 2) colores: 3 familias vecinas, escalones como las tiras de la identidad
    const fams = o.fams || (o.plano ? [0, 1, 2] : [0, 2, 4]).map((k) => ORDER[(o.seed - 1 + k) % ORDER.length]);   // plano: familias consecutivas (se mezclan limpias)
    const steps = o.pasos || 8, q = (t) => Math.floor(clamp(t) * steps * 0.9999) / (steps - 1);
    const dirx = o.dirx ?? (R() < 0.5 ? 1 : -1), diry = o.diry ?? 1;
    const cell = Math.min((W * (o.plano ? 0.66 : 0.5)) / cols, (H * (o.plano ? 0.72 : 0.6)) / rows), sx = cell * 0.3 * dirx, sy = -cell * 0.3 * diry;
    const flatMode = !!o.plano, ox = W / 2 - (cols * cell) / 2 - (flatMode ? 0 : (D * sx) / 2), oy = H / 2 - (rows * cell) / 2 - (flatMode ? 0 : (D * sy) / 2);
    const base = (r, c) => ramp(fams, q(0.55 * (dirx > 0 ? c : cols - c) / cols + 0.45 * r / rows));

    // ---- versión plana: sin extrusión, bisel ni sombra; el volumen se lee solo por el cambio de tono del degradado ----
    if (o.plano) {
      const INF = 1e9, d = mask.map((row) => row.map((v) => (v ? INF : 0)));
      const g2 = (r, c) => (r < 0 || r >= rows || c < 0 || c >= cols ? 0 : d[r][c]);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (d[r][c]) d[r][c] = Math.min(d[r][c], g2(r - 1, c) + 1, g2(r, c - 1) + 1, g2(r - 1, c - 1) + 1.41, g2(r - 1, c + 1) + 1.41);
      for (let r = rows - 1; r >= 0; r--) for (let c = cols - 1; c >= 0; c--) if (d[r][c]) d[r][c] = Math.min(d[r][c], g2(r + 1, c) + 1, g2(r, c + 1) + 1, g2(r + 1, c + 1) + 1.41, g2(r + 1, c - 1) + 1.41);
      let dm = 0; d.forEach((row) => row.forEach((v) => { if (v < INF) dm = Math.max(dm, v); }));
      const h = (r, c) => Math.min(1, g2(r, c) / Math.max(1, dm));                       // altura de "tubo": 0 en el borde, 1 en el centro del trazo
      const lx = o.luzx ?? -1, ly = o.luzy ?? -1, ln = Math.hypot(lx, ly);               // la luz viene de esta esquina
      const stepsT = o.pasos || 9, stepsF = 6, cellW = cell, ph = Math.max(2, cell * 0.0);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (!mask[r][c]) continue;
        const gx = (h(r, c + 1) - h(r, c - 1)) / 2, gy = (h(r + 1, c) - h(r - 1, c)) / 2;     // pendiente de la superficie
        const lit = -(gx * lx + gy * ly) / ln * 2.6;                                           // >0 mira a la luz, <0 está en sombra
        let tone = clamp(0.5 + 0.5 * clamp(lit, -1, 1) + 0.25 * (h(r, c) - 0.5));
        tone = Math.floor(tone * stepsT * 0.9999) / (stepsT - 1);                              // escalones de tono
        // la familia cambia a lo largo del símbolo (también en escalones)
        const p = Math.floor(clamp(0.55 * ((lx < 0 ? c : cols - c) / cols) + 0.45 * (r / rows)) * stepsF * 0.9999) / (stepsF - 1);
        const fp = p * (fams.length - 1), i = Math.min(fams.length - 2, Math.floor(fp));
        const f0 = fams[i], f1 = fams[i + 1], k = fp - i;
        const col = (f) => mix(grad(f, 1), grad(f, 0), tone);                                  // sombra -> extremo del degradado, luz -> base
        let cc = mix(col(f0), col(f1), k);
        const L = toLab(cc); cc = fromLab([L[0] * (0.86 + 0.22 * tone), L[1] * 1.14, L[2] * 1.14]);  // orden de claridad sin apagar el color
        ctx.fillStyle = rgb(cc);
        ctx.fillRect(ox + c * cell, oy + r * cell, cell + 0.6, cell + 0.6);
      }
      return;
    }
    // 3) sombra suave en el suelo (mismo desplazamiento hacia abajo)
    ctx.fillStyle = rgb(mix([255, 255, 255], hex(FAMILIES[fams[0]].end), 0.14));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (mask[r][c]) ctx.fillRect(ox + c * cell - dirx * cell * 2.2, oy + r * cell + cell * 2.6, cell + 0.5, cell + 0.5);
    // 4) extrusión: capas de atrás hacia delante; el color avanza por la rampa y se oscurece con la profundidad
    for (let k = D; k >= 1; k--) {
      const f = k / D;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (!mask[r][c]) continue;
        const t = (dirx > 0 ? c : cols - c) / cols * 0.55 + r / rows * 0.45 + 0.28 * f;
        ctx.fillStyle = rgb(shade(ramp(fams, q(t)), 0.4 * f));
        ctx.fillRect(ox + c * cell + k * sx, oy + r * cell + k * sy, cell + 0.5, cell + 0.5);
      }
    }
    // 5) cara frontal con bisel (luz arriba/izquierda, sombra abajo/derecha)
    const bev = Math.max(2, cell * 0.12);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!mask[r][c]) continue;
      const col = base(r, c), x = ox + c * cell, y = oy + r * cell;
      ctx.fillStyle = rgb(col); ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
      if (!on(r - 1, c)) { ctx.fillStyle = rgb(mix(col, [255, 255, 255], 0.4)); ctx.fillRect(x, y, cell + 0.5, bev); }
      if (!on(r, c - 1)) { ctx.fillStyle = rgb(mix(col, [255, 255, 255], 0.28)); ctx.fillRect(x, y, bev, cell + 0.5); }
      if (!on(r + 1, c)) { ctx.fillStyle = rgb(shade(col, 0.22)); ctx.fillRect(x, y + cell - bev, cell + 0.5, bev); }
      if (!on(r, c + 1)) { ctx.fillStyle = rgb(shade(col, 0.16)); ctx.fillRect(x + cell - bev, y, bev, cell + 0.5); }
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
    optimismo, cabezoneria, trabajo, calma, caos, union, planta,
    euro3d: (ctx, W, H, o) => glyph3d(ctx, W, H, { ...o, glifo: '€' }),
    euro: (ctx, W, H, o) => glyph3d(ctx, W, H, { ...o, glifo: '€', plano: true }),
    disolver(ctx, W, H, o) { dissolvePlus(ctx, W, H, { ...o, famH: o.R.pick(ORDER), famV: otherFam(o.R, o.R.pick(ORDER)) }); },
  };

  // Conceptos -> composición (modo abstracto "que genera conceptos")
  const CONCEPTOS = {
    optimismo: 'optimismo', cabezonería: 'cabezoneria', 'trabajo duro': 'trabajo', calma: 'calma', caos: 'caos', unión: 'union',
    expandir: 'flujo', crecer: 'molinillo', sumar: 'mas', unir: 'cruz',
    diversidad: 'campo', mezclar: 'mezcla', conectar: 'bandas', transformar: 'disolver',
  };


  /* ---------- Partículas de expansión (efecto global): píxeles que salen de la forma hacia fuera ---------- */
  function particulas(layer, ctx, W, H, spec, seed) {
    const dens = +spec.particulasGlobal || 0;
    if (!dens) return;
    const R = rng(seed * 7919 + 13), N = noise2(seed + 331);
    const g = Math.max(5, Math.round(H / 72)), gw = Math.ceil(W / g), gh = Math.ceil(H / g);
    const px = layer.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
    const idx = (c, r) => r * gw + c;
    const solid = new Uint8Array(gw * gh), col = new Array(gw * gh);
    let n = 0, sx = 0, sy = 0;
    for (let r = 0; r < gh; r++) for (let c = 0; c < gw; c++) {
      const x = Math.min(W - 1, c * g + (g >> 1)), y = Math.min(H - 1, r * g + (g >> 1)), p = (y * W + x) * 4;
      if (px[p + 3] > 110) { solid[idx(c, r)] = 1; col[idx(c, r)] = [px[p], px[p + 1], px[p + 2]]; n++; sx += c; sy += r; }
    }
    if (!n || n > gw * gh * 0.72) return;                    // lienzo vacío o ya ocupado (foto/flujo a sangre): sin partículas
    const cx = sx / n, cy = sy / n;
    // distancia (en celdas) a la forma + qué celda de la forma es la más cercana (para heredar su color)
    const dist = new Float32Array(gw * gh).fill(1e9), src = new Int32Array(gw * gh).fill(-1), q = [];
    for (let i = 0; i < solid.length; i++) if (solid[i]) { dist[i] = 0; src[i] = i; q.push(i); }
    for (let h = 0; h < q.length; h++) {
      const i = q[h], c = i % gw, r = (i / gw) | 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const c2 = c + dc, r2 = r + dr; if (c2 < 0 || c2 >= gw || r2 < 0 || r2 >= gh || (!dr && !dc)) continue;
        const j = idx(c2, r2), nd = dist[i] + (dr && dc ? 1.41 : 1);
        if (nd < dist[j] && nd <= 15) { dist[j] = nd; src[j] = src[i]; q.push(j); }
      }
    }
    const fams = spec.fams || ORDER;
    for (let r = 0; r < gh; r++) for (let c = 0; c < gw; c++) {
      const i = idx(c, r), d = dist[i];
      if (solid[i] || d > 15 || src[i] < 0) continue;
      const sc = src[i] % gw, sr = (src[i] / gw) | 0;
      const vx = c - cx, vy = r - cy, vl = Math.hypot(vx, vy) || 1, ox = c - sc, oy = r - sr, ol = Math.hypot(ox, oy) || 1;
      const out = (vx * ox + vy * oy) / (vl * ol);                 // 1 = la partícula va hacia fuera respecto al centro
      let p = dens * 0.5 * Math.exp(-d / 3.4) * (0.55 + 0.45 * Math.max(0, out)) * (0.45 + 1.1 * N(c / 5, r / 5));
      if (d < 1) p *= 0.5;
      if (R() > p) continue;
      const base = col[src[i]], useSpark = R() < 0.28, cc = useSpark ? grad(R.pick(fams), R()) : base;
      ctx.fillStyle = rgb(cc);
      if (d > 3 && R() < 0.12) {                                   // estela: elonga en la dirección de expansión
        const horiz = Math.abs(vx) > Math.abs(vy), len = g * R.int(2, 4), th = Math.max(2, g * 0.45);
        const sgn = (horiz ? vx : vy) >= 0 ? 1 : -1;
        const x0 = c * g, y0 = r * g;
        if (horiz) ctx.fillRect(sgn > 0 ? x0 : x0 - len + g, y0 + (g - th) / 2, len, th); else ctx.fillRect(x0 + (g - th) / 2, sgn > 0 ? y0 : y0 - len + g, th, len);
      } else {                                                      // píxel suelto de tamaño variable, alineado a la rejilla
        const k = R.pick([1, 1, 1, 0.5, 0.5, 0.34]), sz = Math.max(2, Math.round(g * k)), j = g - sz;
        ctx.fillRect(c * g + (R() * j | 0), r * g + (R() * j | 0), sz, sz);
      }
    }
  }

  function render(canvas, spec) {
    const W = canvas.width, H = canvas.height, ctx = canvas.getContext('2d');
    const comp = COMPS[spec.comp] ? spec.comp : CONCEPTOS[spec.concepto] || 'mas';
    const seed = spec.seed || 1;
    const R = rng(seed);
    const layer = document.createElement('canvas');
    layer.width = W; layer.height = H;
    COMPS[comp](layer.getContext('2d'), W, H, { ...spec, R, seed });
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = spec.bg || '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(layer, 0, 0);
    particulas(layer, ctx, W, H, spec, seed);                // partículas de expansión alrededor de la forma (spec.particulas: 0 las quita)
    return comp;
  }

  const api = { FAMILIES, ORDER, COMPS, CONCEPTOS, render, rng, ramp, mix };
  if (typeof module !== 'undefined') module.exports = api; else root.Identidad = api;
})(typeof window !== 'undefined' ? window : globalThis);
