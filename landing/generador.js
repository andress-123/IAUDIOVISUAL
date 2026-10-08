// Generador de imágenes en cuadros con la paleta exacta de la identidad.
// Todo corre en el navegador: la imagen del usuario no se sube a ningún sitio.
(function (global) {
  const PALETA = {
    blue:   ['#00a0e3','#0098e7','#0091eb','#0089ef','#0081f3','#0079f7','#0072fb','#006aff'],
    cyan:   ['#5dcfff','#50d5ff','#42daff','#35e0ff','#28e5ff','#1bebff','#0df0ff','#00f6ff'],
    green:  ['#2bb500','#25bc12','#1fc424','#19cb36','#12d247','#0cd959','#06e16b','#00e87d'],
    yellow: ['#fdbc00','#fdaf00','#fea200','#fe9500','#fe8700','#fe7a00','#ff6d00','#ff6000'],
    red:    ['#e20613','#e6052b','#ea0443','#ee035b','#f30374','#f7028c','#fb01a4','#ff00bc']
  };
  const ESQUEMAS = {
    duoAzulNaranja:        { nombre: 'Duotono · azul + naranja',            bandas: [['blue', .45], ['yellow', 1]] },
    duoMagentaNaranja:     { nombre: 'Duotono · magenta + naranja',         bandas: [['red', .5], ['yellow', 1]] },
    duoAzulMagenta:        { nombre: 'Duotono · azul + magenta',            bandas: [['blue', .5], ['red', 1]] },
    triAzulMagentaNaranja: { nombre: 'Tritono · azul + magenta + naranja',  bandas: [['blue', .3], ['red', .62], ['yellow', 1]] },
    triAzulVerdeNaranja:   { nombre: 'Tritono · azul + verde + naranja',    bandas: [['blue', .3], ['green', .62], ['yellow', 1]] },
    triAzulCianNaranja:    { nombre: 'Tritono · azul + cian + naranja',     bandas: [['blue', .35], ['cyan', .65], ['yellow', 1]] }
  };

  const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
  function oklab(r, g, b) {
    r = lin(r); g = lin(g); b = lin(b);
    const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b),
          m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b),
          s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
    return [.2104542553 * l + .793617785 * m - .0040720468 * s,
            1.9779984951 * l - 2.428592205 * m + .4505937099 * s,
            .0259040371 * l + .7827717662 * m - .808675766 * s];
  }
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  // pasos de cada familia ordenados de oscuro a claro
  const FS = {};
  for (const k in PALETA) FS[k] = PALETA[k].map(h => ({ h, L: oklab(...hexRgb(h))[0] })).sort((a, b) => a.L - b.L).map(o => o.h);

  function generar(img, o) {
    const W = img.width, H = img.height, D = img.data;
    let sd = (o.semilla || 1) >>> 0;
    const rnd = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
    const C = o.celda, N = Math.floor(W / C), M = Math.floor(H / C);
    const SC = Math.max(2, Math.round(1200 / N));

    // 1. celdas: color medio (OKLab) y opacidad
    const cells = [];
    for (let j = 0; j < M; j++) {
      const row = [];
      for (let i = 0; i < N; i++) {
        let r = 0, g = 0, b = 0, a = 0, n = 0;
        for (let y = j * C; y < j * C + C; y++) for (let x = i * C; x < i * C + C; x++) {
          const p = (y * W + x) * 4; r += D[p]; g += D[p + 1]; b += D[p + 2]; a += D[p + 3]; n++;
        }
        const al = a / n / 255, q = oklab(r / n, g / n, b / n);
        row.push({ L: q[0], A: q[1], B: q[2], al, fig: true });
      }
      cells.push(row);
    }
    // 2. figura = lo que no es fondo (transparencia, o color del borde con crecimiento de región)
    let hayAlfa = false;
    for (let j = 0; j < M && !hayAlfa; j++) for (let i = 0; i < N; i++) if (cells[j][i].al < .5) { hayAlfa = true; break; }
    if (hayAlfa) {
      for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) if (cells[j][i].al < .5) cells[j][i].fig = false;
    } else {
      let L = 0, A = 0, B = 0, n = 0;
      const add = c => { L += c.L; A += c.A; B += c.B; n++; };
      for (let i = 0; i < N; i++) { add(cells[0][i]); add(cells[M - 1][i]); }
      for (let j = 0; j < M; j++) { add(cells[j][0]); add(cells[j][N - 1]); }
      L /= n; A /= n; B /= n;
      const dRef = c => Math.hypot(c.L - L, c.A - A, c.B - B);
      const dd = (a, b) => Math.hypot(a.L - b.L, a.A - b.A, a.B - b.B);
      const paso = o.fondo, alcance = .3, seen = [];
      for (let j = 0; j < M; j++) seen.push(new Uint8Array(N));
      const st = [];
      const semilla = (i, j) => { if (!seen[j][i] && dRef(cells[j][i]) < alcance) { seen[j][i] = 1; st.push([i, j]); } };
      for (let i = 0; i < N; i++) { semilla(i, 0); semilla(i, M - 1); }
      for (let j = 0; j < M; j++) { semilla(0, j); semilla(N - 1, j); }
      while (st.length) {
        const [i, j] = st.pop(); cells[j][i].fig = false;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const x = i + di, y = j + dj;
          if (x < 0 || y < 0 || x >= N || y >= M || seen[y][x]) continue;
          if (dRef(cells[y][x]) < alcance && dd(cells[y][x], cells[j][i]) < paso) { seen[y][x] = 1; st.push([x, y]); }
        }
      }
    }
    // 3. quita motas sueltas (marcas de agua, ruido): componentes muy pequeños frente al mayor
    const lab = []; for (let j = 0; j < M; j++) lab.push(new Int32Array(N));
    const comps = []; let nl = 0;
    for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
      if (!cells[j][i].fig || lab[j][i]) continue;
      nl++; const st = [[i, j]]; lab[j][i] = nl; const mem = [];
      while (st.length) {
        const [x, y] = st.pop(); mem.push([x, y]);
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const u = x + di, v = y + dj;
          if (u < 0 || v < 0 || u >= N || v >= M || !cells[v][u].fig || lab[v][u]) continue;
          lab[v][u] = nl; st.push([u, v]);
        }
      }
      comps.push(mem);
    }
    const mayor = comps.reduce((a, c) => Math.max(a, c.length), 0);
    comps.forEach(c => { if (c.length < mayor * .02) c.forEach(([x, y]) => { cells[y][x].fig = false; }); });
    const fig = (i, j) => i >= 0 && j >= 0 && i < N && j < M && cells[j][i].fig;
    let nFig = 0; cells.forEach(r => r.forEach(c => { if (c.fig) nFig++; }));
    if (nFig < 20) return null;

    // 4. tono: percentil de luminosidad dentro de la figura
    const Ls = []; cells.forEach(r => r.forEach(c => { if (c.fig) Ls.push(c.L); })); Ls.sort((a, b) => a - b);
    const pct = L => { let lo = 0, hi = Ls.length; while (lo < hi) { const m = (lo + hi) >> 1; if (Ls[m] < L) lo = m + 1; else hi = m; } return lo / Ls.length; };

    // recorte al contorno de la figura
    let bx0 = N, bx1 = 0, by0 = M, by1 = 0;
    for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) if (cells[j][i].fig) { bx0 = Math.min(bx0, i); bx1 = Math.max(bx1, i + 1); by0 = Math.min(by0, j); by1 = Math.max(by1, j + 1); }
    const cabecera = (x0, y0, x1, y1) => {
      const mg = 4, vx = (x0 - mg) * SC, vy = (y0 - mg) * SC, w = (x1 - x0 + 2 * mg) * SC, h = (y1 - y0 + 2 * mg) * SC;
      return { vx, vy, w, h, head: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges">\n<rect x="${vx}" y="${vy}" width="${w}" height="${h}" fill="#fff"/>\n` };
    };
    const cuerpo = by => Object.keys(by).map(c => `<g fill="${c}">` + by[c].map(r => `<rect x="${r.x * SC}" y="${r.y * SC}" width="${r.s * SC}" height="${r.s * SC}"/>`).join('') + '</g>\n').join('');

    if (o.modo === 'nube') return nube();
    return pixel();

    // ───────────── NUBE DE CUADROS: silueta de una tinta que se deshace en cuadros, con huecos ─────────────
    function nube() {
      const FAM = o.familia, FL = o.relleno, DISP = o.dispersion;
      const dist = sign => {
        const Aa = []; for (let j = 0; j < M; j++) { Aa.push(new Float32Array(N)); for (let i = 0; i < N; i++) Aa[j][i] = (fig(i, j) === (sign > 0)) ? 1e3 : 0; }
        for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) { let v = Aa[j][i]; if (i > 0) v = Math.min(v, Aa[j][i - 1] + 1); if (j > 0) v = Math.min(v, Aa[j - 1][i] + 1); if (i > 0 && j > 0) v = Math.min(v, Aa[j - 1][i - 1] + 1.4); if (i < N - 1 && j > 0) v = Math.min(v, Aa[j - 1][i + 1] + 1.4); Aa[j][i] = v; }
        for (let j = M - 1; j >= 0; j--) for (let i = N - 1; i >= 0; i--) { let v = Aa[j][i]; if (i < N - 1) v = Math.min(v, Aa[j][i + 1] + 1); if (j < M - 1) v = Math.min(v, Aa[j + 1][i] + 1); if (i < N - 1 && j < M - 1) v = Math.min(v, Aa[j + 1][i + 1] + 1.4); if (i > 0 && j < M - 1) v = Math.min(v, Aa[j + 1][i - 1] + 1.4); Aa[j][i] = v; }
        return Aa;
      };
      const din = dist(1), dout = dist(-1);
      const sm = (i, j) => (Math.sin(i * .25 + 1) + Math.sin(j * .29 + 2) + Math.sin((i + j) * .17) + Math.sin((i - j) * .21 + 3)) / 4;
      const stp = [];
      for (let j = 0; j < M; j++) { stp.push(new Int8Array(N)); for (let i = 0; i < N; i++) stp[j][i] = fig(i, j) ? Math.min(7, Math.floor(pct(cells[j][i].L) * 8)) : -1; }
      const cerca = (i, j) => { let best = 4, bd = 1e9; for (let y = Math.max(0, j - 9); y <= Math.min(M - 1, j + 9); y++) for (let x = Math.max(0, i - 9); x <= Math.min(N - 1, i + 9); x++) if (stp[y][x] >= 0) { const d = (x - i) * (x - i) + (y - j) * (y - j); if (d < bd) { bd = d; best = stp[y][x]; } } return best; };
      const hay = (i0, j0, di, dj, n) => { for (let k = 1; k <= n; k++) if (fig(i0 + di * k, j0 + dj * k)) return true; return false; };
      const reach = Math.round(N * .3);
      const bolsillo = (i, j) => hay(i, j, -1, 0, reach) && hay(i, j, 1, 0, reach) && hay(i, j, 0, -1, reach); // hueco entre figuras: sin cuadros sueltos
      const on = []; 
      for (let j = 0; j < M; j++) {
        on.push(new Uint8Array(N));
        for (let i = 0; i < N; i++) {
          let v = false;
          if (fig(i, j)) {
            const d = din[j][i], oscuro = 1 - pct(cells[j][i].L);   // oscuro = lleno, claro = hueco: el tono dibuja el detalle
            const base = FL + (1 - FL) * Math.max(0, Math.min(1, (oscuro - .2) / .5));
            const borde = Math.min(1, (d + 1.2 + sm(i, j) * 1.5) / 3.5);
            const rb = ((((i >> 1) * 73856093) ^ ((j >> 1) * 19349663)) >>> 0) % 1000 / 1000;
            v = (rnd() * .45 + rb * .55) < base * borde;
            if (v && base < .9 && rnd() < .04) v = false;
          } else {
            const d = dout[j][i], alc = 9;
            if (DISP > 0 && d < alc && !bolsillo(i, j)) v = rnd() < .2 * DISP * Math.pow(1 - d / alc, 1.6) * (.4 + .9 * Math.max(0, sm(i * .6, j * .6) + .5));
          }
          on[j][i] = v ? 1 : 0;
        }
      }
      const used = []; for (let j = 0; j < M; j++) used.push(new Uint8Array(N));
      const rects = [];
      for (const s of [4, 2]) for (let j = 0; j + s <= M; j += s) for (let i = 0; i + s <= N; i += s) {
        let todo = true;
        for (let y = j; y < j + s && todo; y++) for (let x = i; x < i + s; x++) if (!on[y][x] || used[y][x]) { todo = false; break; }
        if (!todo) continue;
        if (rnd() > (s === 4 ? .45 : .1)) continue;
        for (let y = j; y < j + s; y++) for (let x = i; x < i + s; x++) used[y][x] = 1;
        rects.push({ x: i, y: j, s });
      }
      for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) if (on[j][i] && !used[j][i]) rects.push({ x: i, y: j, s: 1 });
      if (!rects.length) return null;
      let x0 = N, x1 = 0, y0 = M, y1 = 0;
      rects.forEach(r => { x0 = Math.min(x0, r.x); x1 = Math.max(x1, r.x + r.s); y0 = Math.min(y0, r.y); y1 = Math.max(y1, r.y + r.s); });
      const by = {};
      rects.forEach(r => {
        let paso = 5;
        if (o.degradado) { let sum = 0; for (let y = r.y; y < r.y + r.s; y++) for (let x = r.x; x < r.x + r.s; x++) { const v = stp[y][x]; sum += v >= 0 ? v : cerca(x, y); } paso = Math.max(0, Math.min(7, Math.round(sum / (r.s * r.s)))); }
        const c = FS[FAM][paso]; (by[c] = by[c] || []).push(r);
      });
      const cab = cabecera(x0, y0, x1, y1);
      return { svg: cab.head + cuerpo(by) + '</svg>\n', w: cab.w, h: cab.h, bloques: rects.length };
    }

    // ───────────── PÍXEL ORGÁNICO: tamaños mezclados, duotono / tritono por tono ─────────────
    function pixel() {
      const BANDAS = ESQUEMAS[o.esquema].bandas;
      const grp = BANDAS.map((b, k) => ({ fam: b[0], lo: k ? BANDAS[k - 1][1] : 0, hi: b[1] }));
      for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
        const c = cells[j][i]; if (!c.fig) continue;
        const t0 = pct(c.L); c.blanco = t0 > .99;
        const t = Math.max(0, Math.min(.9999, t0 + (rnd() - .5) * .05));
        const g = grp.find(g => t < g.hi) || grp[grp.length - 1];
        const u = Math.max(0, Math.min(.9999, (t - g.lo) / (g.hi - g.lo)));
        c.g = g.fam; c.c = FS[g.fam][Math.floor(u * 8)];
      }
      const used = []; for (let j = 0; j < M; j++) used.push(new Uint8Array(N));
      const campo = (i, j) => { const x = i / N * 6.28, y = j / M * 6.28; return (Math.sin(x * 1.3 + 1) + Math.sin(y * 1.7 + 2) + Math.sin((x + y) * 2.1) + Math.sin((x - y) * 2.9 + 4) * .6 + 3.6) / 7.2; };
      const probar = (i, j, s, tol) => {
        if (i + s > N || j + s > M) return null;
        const cnt = {}; let n = 0;
        for (let y = j; y < j + s; y++) for (let x = i; x < i + s; x++) { const b = cells[y][x]; if (!b.fig || used[y][x] || b.blanco) return null; n++; cnt[b.c] = (cnt[b.c] || 0) + 1; }
        let best = null, bn = 0; for (const c in cnt) if (cnt[c] > bn) { bn = cnt[c]; best = c; }
        let ok = 0;
        for (let y = j; y < j + s; y++) for (let x = i; x < i + s; x++) { const b = cells[y][x], L = FS[b.g]; if (b.c === best || (L.indexOf(best) >= 0 && Math.abs(L.indexOf(b.c) - L.indexOf(best)) <= 1)) ok++; }
        return ok / n >= tol ? best : null;
      };
      const rects = [];
      const gr = Math.max(1, Math.round(N / 200));     // escala del árbol de bloques con la resolución
      const tams = [16, 8, 4, 2, 1];
      for (const s0 of tams) {
        const s = s0;
        for (let j = 0; j < M; j += s) for (let i = 0; i < N; i += s) {
          if (s > 1) { const cv = campo(i, j); const cap = cv > .62 ? 16 : cv > .42 ? 8 : cv > .25 ? 4 : 2; if (s > cap * gr) continue; }
          let c;
          if (s === 1) { const b = cells[j][i]; if (!b.fig || used[j][i] || b.blanco) continue; c = b.c; }
          else c = probar(i, j, s, s >= 8 ? .72 : s >= 4 ? .65 : .55);
          if (!c) continue;
          for (let y = j; y < j + s; y++) for (let x = i; x < i + s; x++) used[y][x] = 1;
          if (s >= 4 && rnd() < .05) continue;
          rects.push({ x: i, y: j, s, c });
        }
      }
      // partículas: el mismo píxel, solo en zonas aleatorias junto al contorno
      const borde = [];
      for (let j = 4; j < M - 4; j++) for (let i = 4; i < N - 4; i++) { const c = cells[j][i]; if (c.fig && !c.blanco && (!fig(i - 1, j) || !fig(i, j - 1) || !fig(i + 1, j) || !fig(i, j + 1))) borde.push([i, j]); }
      const parts = [];
      for (let z = 0; z < 9 && borde.length && o.dispersion > 0; z++) {
        const [ei, ej] = borde[Math.floor(rnd() * borde.length)], r = (12 + rnd() * 16) * (N / 200), col = cells[ej][ei].c;
        for (let j = Math.max(0, Math.floor(ej - r)); j < Math.min(M, ej + r); j++) for (let i = Math.max(0, Math.floor(ei - r)); i < Math.min(N, ei + r); i++) {
          if (fig(i, j)) continue; const d = Math.hypot(i - ei, j - ej); if (d > r) continue;
          if (rnd() < .05 * o.dispersion * (1 - d / r)) { const q = rnd(); parts.push({ x: i, y: j, s: Math.max(1, Math.round((q < .4 ? 2 : q < .7 ? 3 : q < .88 ? 5 : 8) * N / 200)), c: col }); }
        }
      }
      const todos = rects.concat(parts);
      if (!todos.length) return null;
      const by = {}; todos.forEach(r => (by[r.c] = by[r.c] || []).push(r));
      const cab = cabecera(bx0, by0, bx1, by1);
      return { svg: cab.head + cuerpo(by) + '</svg>\n', w: cab.w, h: cab.h, bloques: todos.length };
    }
  }

  global.Cuadros = { generar, PALETA, ESQUEMAS };
})(window);
