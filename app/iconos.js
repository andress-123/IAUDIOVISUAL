/* Iconos "flat 3D" (facetas planas) con la paleta de la identidad. Mini motor 3D: caras planas, luz fija, 4 tonos por cara,
   y color por posición (degradado escalonado en la altura del objeto). Fondo blanco siempre. */
(function () {
  const I = window.Identidad, { ramp, shade, mix, rng, rgb, clamp } = I;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  /* ---------- constructores de mallas (cada cara: puntos p, y pista de "hacia fuera" h) ---------- */
  function icosphere(c, r, subdiv = 1) {
    const t = (1 + Math.sqrt(5)) / 2;
    let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
    let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (let s = 0; s < subdiv; s++) {
      const cache = {}, mid = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (cache[k] === undefined) { V.push(norm(mul(add(V[a], V[b]), 0.5))); cache[k] = V.length - 1; } return cache[k]; };
      const NF = []; F.forEach(([a, b, d]) => { const ab = mid(a, b), bd = mid(b, d), da = mid(d, a); NF.push([a, ab, da], [b, bd, ab], [d, da, bd], [ab, bd, da]); }); F = NF;
    }
    return F.map((f) => { const pts = f.map((i) => add(mul(V[i], r), c)); const h = norm(sub(mul(add(add(V[f[0]], V[f[1]]), V[f[2]]), 1 / 3), [0, 0, 0])); return { p: pts, h }; });
  }
  // superficie de revolución: perfil = [[radio, y], ...] de abajo a arriba
  function lathe(profile, seg, T) {
    const faces = [];
    for (let i = 0; i < profile.length - 1; i++) for (let s = 0; s < seg; s++) {
      const a0 = (s / seg) * Math.PI * 2, a1 = ((s + 1) / seg) * Math.PI * 2, am = (a0 + a1) / 2;
      const P = (r, y, a) => T([r * Math.cos(a), y, r * Math.sin(a)]);
      faces.push({ p: [P(profile[i][0], profile[i][1], a0), P(profile[i][0], profile[i][1], a1), P(profile[i + 1][0], profile[i + 1][1], a1), P(profile[i + 1][0], profile[i + 1][1], a0)], h: [Math.cos(am), 0.15, Math.sin(am)] });
    }
    return faces;
  }
  // barrido de un perfil rectangular (a x b) a lo largo de un camino; Nref(i) = dirección aproximada "hacia fuera"
  function sweep(P, Nref, a, b, closed) {
    const n = P.length, rings = [];
    for (let i = 0; i < n; i++) {
      const prev = closed ? P[(i - 1 + n) % n] : P[Math.max(0, i - 1)], next = closed ? P[(i + 1) % n] : P[Math.min(n - 1, i + 1)];
      const T = norm(sub(next, prev)); let N = Nref(i); N = norm(sub(N, mul(T, dot(N, T)))); const B = cross(T, N);
      const c = (sa, sb) => add(add(P[i], mul(N, a * sa)), mul(B, b * sb));
      rings.push({ v: [c(-1, -1), c(1, -1), c(1, 1), c(-1, 1)], N, B, T });
    }
    const faces = [], m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) { const j = (i + 1) % n, R0 = rings[i], R1 = rings[j];
      const out = [mul(R0.B, -1), R0.N, R0.B, mul(R0.N, -1)];
      for (let k = 0; k < 4; k++) faces.push({ p: [R0.v[k], R0.v[(k + 1) % 4], R1.v[(k + 1) % 4], R1.v[k]], h: out[k] });
    }
    if (!closed) { faces.push({ p: rings[0].v.slice(), h: mul(rings[0].T, -1) }); faces.push({ p: rings[n - 1].v.slice(), h: rings[n - 1].T }); }
    return faces;
  }
  const stadium = (R, L) => {            // camino cerrado en el plano XY y su dirección "hacia fuera"
    const P = [], N = [];
    for (let i = 0; i < 10; i++) { P.push([-L / 2 + (L * i) / 10, R, 0]); N.push([0, 1, 0]); }
    for (let i = 0; i < 16; i++) { const a = Math.PI / 2 - (Math.PI * i) / 16; P.push([L / 2 + R * Math.cos(a), R * Math.sin(a), 0]); N.push([Math.cos(a), Math.sin(a), 0]); }
    for (let i = 0; i < 10; i++) { P.push([L / 2 - (L * i) / 10, -R, 0]); N.push([0, -1, 0]); }
    for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 - (Math.PI * i) / 16; P.push([-L / 2 + R * Math.cos(a), R * Math.sin(a), 0]); N.push([Math.cos(a), Math.sin(a), 0]); }
    return { P, N };
  };

  /* ---------- los 6 iconos (cada malla lleva su familia(s) de color y el eje del degradado) ---------- */
  const ICONS = [
    { id: 'interes', nombre: 'Interés compuesto', rot: [0.35, -0.5, 0], build() {    // bola de nieve que va creciendo
      return [
        { faces: icosphere([-1.45, -0.95, 0.5], 0.36, 1), fams: ['yellow', 'red'], axis: 1, rev: true },
        { faces: icosphere([-0.7, -0.4, 0.3], 0.66, 1), fams: ['green', 'cyan'], axis: 1, rev: true },
        { faces: icosphere([0.55, 0.3, 0], 1.1, 1), fams: ['cyan', 'blue'], axis: 1, rev: true },
      ]; } },
    { id: 'volatilidad', nombre: 'Volatilidad', rot: [0.25, -0.55, 0.25], build() {     // muelle
      const P = [], N = [], turns = 3.6, R = 0.62, pitch = 0.62, n = 220;
      for (let i = 0; i <= n; i++) { const th = (i / n) * turns * Math.PI * 2; P.push([R * Math.cos(th), (pitch * th) / (Math.PI * 2) - (turns * pitch) / 2, R * Math.sin(th)]); N.push([Math.cos(th), 0, Math.sin(th)]); }
      return [{ faces: sweep(P, (i) => N[i], 0.075, 0.2, false), fams: ['yellow', 'red'], axis: 1, rev: true }]; } },
    { id: 'cobertura', nombre: 'Cobertura', rot: [0.32, -0.35, -0.12], build() {      // paraguas
      const faces = [], g = 8, rings = 5; const pt = (k, a) => { const e = (k / rings) * 1.5; return [1.25 * Math.sin(e) * Math.cos(a), 1.0 * Math.cos(e) + 0.1, 1.25 * Math.sin(e) * Math.sin(a)]; };
      const canopyA = [], canopyB = [];
      for (let s = 0; s < g; s++) for (let k = 0; k < rings; k++) {
        const a0 = (s / g) * Math.PI * 2, a1 = ((s + 1) / g) * Math.PI * 2, am = (a0 + a1) / 2;
        const f = { p: [pt(k, a0), pt(k, a1), pt(k + 1, a1), pt(k + 1, a0)], h: [Math.cos(am) * Math.sin((k + 0.5) / rings * 1.5), Math.cos((k + 0.5) / rings * 1.5), Math.sin(am) * Math.sin((k + 0.5) / rings * 1.5)] };
        (s % 2 ? canopyB : canopyA).push(f);
      }
      const shaft = sweep([[0, 1.15, 0], [0, 0.4, 0], [0, -0.4, 0], [0, -1.05, 0]], () => [1, 0, 0], 0.045, 0.045, false);
      const hook = []; for (let i = 0; i <= 14; i++) { const f = (i / 14) * Math.PI; hook.push([-0.3 + 0.3 * Math.cos(f), -1.05 - 0.3 * Math.sin(f), 0]); }
      const hookF = sweep(hook, (i) => [Math.cos((i / 14) * Math.PI), -Math.sin((i / 14) * Math.PI), 0], 0.045, 0.045, false);
      return [
        { faces: canopyA, fams: ['blue', 'cyan'], axis: 1, rev: false }, { faces: canopyB, fams: ['cyan', 'green'], axis: 1, rev: false },
        { faces: shaft.concat(hookF), fams: ['yellow', 'red'], axis: 1, rev: false },
      ]; } },
    { id: 'deuda', nombre: 'Deuda', rot: [0.5, -0.4, -0.42], build() {       // cadena de eslabones
      const { P, N } = stadium(0.5, 0.95), rotX = (v) => [v[0], -v[2], v[1]], links = [];
      [[-1.55, false, ['yellow', 'red']], [0, true, ['blue', 'cyan']], [1.55, false, ['green', 'cyan']]].forEach(([x, turned, fams]) => {
        const PP = P.map((p) => { const q = turned ? rotX(p) : p; return [q[0] + x, q[1], q[2]]; }), NN = N.map((v) => (turned ? rotX(v) : v));
        links.push({ faces: sweep(PP, (i) => NN[i], 0.13, 0.13, true), fams, axis: 0, rev: false });
      });
      return links; } },
    { id: 'liquidez', nombre: 'Liquidez', rot: [0.2, 0.5, 0.18], build() {      // gota
      const prof = []; for (let i = 0; i <= 26; i++) { const th = Math.PI - (i / 26) * Math.PI;                           // de abajo (π) a la punta (0)
        prof.push([0.74 * Math.sin(th) * Math.pow(Math.sin(th / 2), 1.35), 1.15 * Math.cos(th)]); }
      return [{ faces: lathe(prof, 10, (p) => p), fams: ['blue', 'cyan', 'green'], axis: 1, rev: false }]; } },
    { id: 'ahorro', nombre: 'Ahorro paciente', rot: [0.3, -0.5, 0.12], build() {   // bellota
      const body = []; for (let i = 0; i <= 14; i++) { const s = i / 14; body.push([0.6 * Math.pow(Math.sin(Math.PI * 0.5 * Math.min(1, s * 1.12)), 0.8), -1.05 + 1.2 * s]); }
      const cap = []; for (let i = 0; i <= 10; i++) { const a = (i / 10) * (Math.PI / 2); cap.push([0.7 * Math.cos(a) + 0.0, 0.1 + 0.6 * Math.sin(a)]); }
      cap[0] = [0.74, 0.1]; cap.unshift([0.7, 0.0]);                                   // labio del borde de la tapa
      const stem = sweep([[0, 0.66, 0], [0.05, 0.9, 0], [0.16, 1.08, 0]], () => [1, 0, 0], 0.06, 0.06, false);
      return [
        { faces: lathe(body, 9, (p) => p), fams: ['yellow'], axis: 1, rev: true },
        { faces: lathe(cap, 9, (p) => p), fams: ['green', 'cyan'], axis: 1, rev: false },
        { faces: stem, fams: ['green', 'cyan'], axis: 1, rev: false },
      ]; } },
  ];

  /* ---------- render ---------- */
  const LIGHT = norm([-0.5, 0.75, 0.55]);
  function rotate(v, [ax, ay, az]) {
    let [x, y, z] = v;
    let c = Math.cos(ay), s = Math.sin(ay); [x, z] = [x * c + z * s, -x * s + z * c];
    c = Math.cos(ax); s = Math.sin(ax); [y, z] = [y * c - z * s, y * s + z * c];
    c = Math.cos(az); s = Math.sin(az); [x, y] = [x * c - y * s, x * s + y * c];
    return [x, y, z];
  }
  function drawIcon(ctx, icon, cx, cy, size, seed) {
    const meshes = icon.build(), proj = [];
    meshes.forEach((m) => {
      const cs = m.faces.map((f) => f.p.reduce((a, p) => add(a, p), [0, 0, 0]).map((v) => v / f.p.length));
      const vals = cs.map((c) => c[m.axis]), lo = Math.min(...vals), hi = Math.max(...vals);
      m.faces.forEach((f, i) => {
        const gt = hi > lo ? (vals[i] - lo) / (hi - lo) : 0.5;
        const p = f.p.map((v) => rotate(v, icon.rot)), h = rotate(f.h, icon.rot);
        // normal por Newell y orientada según la pista "hacia fuera"
        let n = [0, 0, 0]; for (let k = 0; k < p.length; k++) { const a = p[k], b = p[(k + 1) % p.length]; n = add(n, [(a[1] - b[1]) * (a[2] + b[2]), (a[2] - b[2]) * (a[0] + b[0]), (a[0] - b[0]) * (a[1] + b[1])]); }
        n = norm(n); if (dot(n, h) < 0) n = mul(n, -1);
        if (n[2] < 0.02) return;                                                // cara trasera
        const z = p.reduce((a, q) => a + q[2], 0) / p.length;
        proj.push({ p, n, z, gt: m.rev ? 1 - gt : gt, fams: m.fams });
      });
    });
    proj.sort((a, b) => a.z - b.z);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    proj.forEach((f) => f.p.forEach((q) => { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, -q[1]); y1 = Math.max(y1, -q[1]); }));
    const sc = size / Math.max(x1 - x0, y1 - y0), ox = cx - ((x0 + x1) / 2) * sc, oy = cy - ((y0 + y1) / 2) * sc;
    const layer = document.createElement('canvas'); layer.width = ctx.canvas.width; layer.height = ctx.canvas.height;
    const lx = layer.getContext('2d');
    proj.forEach((f) => {
      const base = ramp(f.fams, Math.floor(clamp(f.gt) * 6 * 0.9999) / 5), li = dot(f.n, LIGHT);
      const col = li > 0.6 ? mix(base, [255, 255, 255], 0.2) : li > 0.25 ? base : li > -0.1 ? shade(base, 0.17) : shade(base, 0.34);   // 4 tonos planos
      lx.fillStyle = lx.strokeStyle = rgb(col); lx.lineWidth = 1; lx.lineJoin = 'round';
      lx.beginPath(); f.p.forEach((q, i) => (i ? lx.lineTo(ox + q[0] * sc, oy - q[1] * sc) : lx.moveTo(ox + q[0] * sc, oy - q[1] * sc))); lx.closePath(); lx.fill(); lx.stroke();
    });
    // textura: puntos claros (como los círculos de la referencia), recortados a la silueta
    const R = rng(seed * 31 + 5); lx.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 7; i++) { lx.fillStyle = `rgba(255,255,255,${R.range(0.28, 0.5)})`; lx.beginPath(); lx.arc(cx + R.range(-0.4, 0.4) * size, cy + R.range(-0.4, 0.4) * size, size * R.range(0.015, 0.06), 0, 7); lx.fill(); }
    ctx.drawImage(layer, 0, 0);
  }

  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  window.iconos = {
    ICONS,
    single(canvas, i, f) { const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); drawIcon(ctx, ICONS[i], canvas.width / 2, canvas.height / 2, canvas.width * (f || 0.62), i + 1); },
    // versión PIXEL: el icono 3D (formas y tonos de cada cara) pasa por el pixelado adaptativo de la identidad
    pixel(canvas, i, cols) {
      const src = document.createElement('canvas'); src.width = src.height = canvas.width; this.single(src, i, 0.78);          // el icono ocupa más lienzo: más celdas, mejor lectura
      I.render(canvas, { comp: 'pixelicono', image: src, seed: i + 1, cols: cols || 64, particulas: 0.7 });
    },
    sheetPixel(canvas) {
      const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height, cw = 520, ch = 520, gx = 40, gy = 40;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      const x0 = (W - (3 * cw + 2 * gx)) / 2, y0 = (H - (2 * ch + gy)) / 2;
      ICONS.forEach((ic, i) => {
        const x = x0 + (i % 3) * (cw + gx), y = y0 + ((i / 3) | 0) * (ch + gy);
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#e6e6e1'; ctx.lineWidth = 2; roundRect(ctx, x, y, cw, ch, 30); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#222'; ctx.font = '20px "Liberation Serif","Times New Roman",serif'; ctx.fillText(`(0${i + 1}) ${ic.nombre}`, x + 28, y + 42);
        const t = document.createElement('canvas'); t.width = t.height = 440; this.pixel(t, i, 55);          // tamaño final y celda de 8 px enteros: píxeles nítidos
        ctx.imageSmoothingEnabled = false; ctx.drawImage(t, x + (cw - 440) / 2, y + 62);                 // dentro de la tarjeta, sin tapar su borde
      });
    },
    sheet(canvas) {
      const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height, cw = 520, ch = 520, gx = 40, gy = 40;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      const x0 = (W - (3 * cw + 2 * gx)) / 2, y0 = (H - (2 * ch + gy)) / 2;
      ICONS.forEach((ic, i) => {
        const x = x0 + (i % 3) * (cw + gx), y = y0 + ((i / 3) | 0) * (ch + gy);
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#e6e6e1'; ctx.lineWidth = 2; roundRect(ctx, x, y, cw, ch, 30); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#222'; ctx.font = '20px "Liberation Serif","Times New Roman",serif'; ctx.fillText(`(0${i + 1}) ${ic.nombre}`, x + 28, y + 42);
        drawIcon(ctx, ic, x + cw / 2, y + ch / 2 + 22, 300, i + 1);
      });
    },
  };
})();
