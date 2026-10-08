(function () {
  const $ = id => document.getElementById(id);
  const { PALETA, ESQUEMAS, generar } = Cuadros;
  const COLORES = [['blue', 'Azul'], ['cyan', 'Cian'], ['green', 'Verde'], ['yellow', 'Naranja'], ['red', 'Magenta']];
  const S = { img: null, modo: 'nube', familia: 'blue', degradado: true, relleno: .55, dispersion: 1, celda: 5, fondo: .05, esquema: 'triAzulMagentaNaranja', semilla: 7, svg: null, url: null };

  // decoración con la paleta
  const mid = k => PALETA[k][4];
  $('logo').innerHTML = ['blue', 'cyan', '', 'yellow', 'red', 'green', '', 'blue', 'yellow'].map(k => `<b style="background:${k ? mid(k) : 'transparent'}"></b>`).join('');
  $('franja').innerHTML = ['blue', 'cyan', 'green', 'yellow', 'red'].map(k => `<span style="background:linear-gradient(90deg,${PALETA[k][0]},${PALETA[k][7]})"></span>`).join('');
  $('paleta').innerHTML = Object.keys(PALETA).map(k => `<div title="${k}">${PALETA[k].map(h => `<span style="background:${h}" title="${h}"></span>`).join('')}</div>`).join('');
  $('sws').innerHTML = COLORES.map(([k, n]) => `<button class="sw" type="button" data-k="${k}" aria-label="${n}" aria-pressed="${k === S.familia}" style="background:linear-gradient(135deg,${PALETA[k][0]},${PALETA[k][7]})"></button>`).join('');
  $('esquema').innerHTML = Object.keys(ESQUEMAS).map(k => `<option value="${k}">${ESQUEMAS[k].nombre}</option>`).join('');
  $('esquema').value = S.esquema;

  // ejemplo procedural (sin fotos de terceros)
  function ejemplo() {
    const c = document.createElement('canvas'); c.width = 600; c.height = 600;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 600, 600);
    x.save(); x.beginPath(); x.arc(300, 300, 250, 0, 7); x.clip();
    let g = x.createRadialGradient(220, 210, 20, 300, 300, 260); g.addColorStop(0, '#9fd6ff'); g.addColorStop(.55, '#2d7fe0'); g.addColorStop(1, '#0a2e8a');
    x.fillStyle = g; x.fillRect(0, 0, 600, 600);
    const mancha = (pts, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; x.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); } x.closePath(); x.fill(); };
    mancha([[200, 190], [270, 170], [330, 200], [320, 260], [290, 320], [250, 380], [220, 330], [190, 260]], 'rgba(170,230,120,.95)');
    mancha([[370, 230], [430, 210], [470, 270], [440, 340], [400, 380], [380, 320]], 'rgba(240,200,90,.95)');
    mancha([[300, 440], [360, 430], [380, 480], [320, 500]], 'rgba(150,220,140,.9)');
    x.restore();
    return x.getImageData(0, 0, 600, 600);
  }

  function cargarArchivo(f) {
    if (!f || !f.type.startsWith('image/')) { $('estado').textContent = 'Ese archivo no parece una imagen.'; return; }
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => {
      const k = Math.min(1, 600 / im.width, 760 / im.height), w = Math.max(40, Math.round(im.width * k)), h = Math.max(40, Math.round(im.height * k));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, w, h);
      S.img = x.getImageData(0, 0, w, h); URL.revokeObjectURL(url); pintar();
    };
    im.onerror = () => { $('estado').textContent = 'No he podido abrir esa imagen.'; };
    im.src = url;
  }

  let t = 0;
  function pintar() { clearTimeout(t); t = setTimeout(ahora, 120); }
  function ahora() {
    if (!S.img) { S.img = ejemplo(); }
    $('lienzo').classList.add('cargando');
    setTimeout(() => {
      const r = generar(S.img, { modo: S.modo, familia: S.familia, degradado: S.degradado, relleno: S.relleno, dispersion: S.dispersion, celda: S.celda, fondo: S.fondo, esquema: S.esquema, semilla: S.semilla });
      $('lienzo').classList.remove('cargando');
      if (!r) { $('estado').textContent = 'No he podido separar la figura del fondo. Prueba con fondo liso o sube la detección de fondo.'; return; }
      S.svg = r.svg; if (S.url) URL.revokeObjectURL(S.url);
      S.url = URL.createObjectURL(new Blob([r.svg], { type: 'image/svg+xml' }));
      const im = $('res'); im.src = S.url; im.hidden = false;
      $('estado').textContent = r.bloques.toLocaleString('es') + ' cuadros';
      $('d-svg').disabled = $('d-png').disabled = false;
    }, 20);
  }

  // controles
  const ajustes = () => {
    $('v-relleno').textContent = Math.round(S.relleno * 100) + '%';
    $('v-celda').textContent = S.celda;
    $('v-dispersion').textContent = S.dispersion === 0 ? 'ninguno' : Math.round(S.dispersion * 100) + '%';
    $('v-fondo').textContent = Math.round(S.fondo * 100);
    const nube = S.modo === 'nube';
    $('g-color').classList.toggle('oculto', !nube); $('g-relleno').classList.toggle('oculto', !nube); $('g-esquema').classList.toggle('oculto', nube);
    $('t-nube').setAttribute('aria-selected', nube); $('t-pixel').setAttribute('aria-selected', !nube);
  };
  const modo = m => { S.modo = m; S.celda = m === 'nube' ? 5 : 3; $('celda').value = S.celda; ajustes(); pintar(); };
  $('t-nube').onclick = () => modo('nube'); $('t-pixel').onclick = () => modo('pixel');
  $('sws').onclick = e => { const b = e.target.closest('.sw'); if (!b) return; S.familia = b.dataset.k; document.querySelectorAll('.sw').forEach(s => s.setAttribute('aria-pressed', s === b)); pintar(); };
  $('degradado').onchange = e => { S.degradado = e.target.checked; pintar(); };
  $('esquema').onchange = e => { S.esquema = e.target.value; pintar(); };
  $('relleno').oninput = e => { S.relleno = e.target.value / 100; ajustes(); pintar(); };
  $('celda').oninput = e => { S.celda = +e.target.value; ajustes(); pintar(); };
  $('dispersion').oninput = e => { S.dispersion = e.target.value / 100; ajustes(); pintar(); };
  $('fondo').oninput = e => { S.fondo = e.target.value / 100; ajustes(); pintar(); };
  $('otra').onclick = () => { S.semilla = (S.semilla * 7919 + 13) >>> 0; pintar(); };
  $('subir').onclick = () => $('fichero').click();
  $('fichero').onchange = e => cargarArchivo(e.target.files[0]);
  $('ejemplo').onclick = () => { S.img = ejemplo(); pintar(); };

  // arrastrar y soltar
  const lz = $('lienzo');
  ['dragenter', 'dragover'].forEach(n => lz.addEventListener(n, e => { e.preventDefault(); lz.classList.add('arrastrando'); }));
  ['dragleave', 'drop'].forEach(n => lz.addEventListener(n, e => { e.preventDefault(); lz.classList.remove('arrastrando'); }));
  lz.addEventListener('drop', e => cargarArchivo(e.dataTransfer.files[0]));

  // descargas
  function bajar(blob, nombre) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
  $('d-svg').onclick = () => S.svg && bajar(new Blob([S.svg], { type: 'image/svg+xml' }), 'cuadros.svg');
  $('d-png').onclick = () => {
    if (!S.svg) return;
    const im = new Image(), m = S.svg.match(/width="(\d+)" height="(\d+)"/), w = +m[1], h = +m[2], k = Math.max(1, Math.round(2000 / w));
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = w * k; c.height = h * k;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      c.toBlob(b => bajar(b, 'cuadros.png'), 'image/png');
    };
    im.src = S.url;
  };

  ajustes(); pintar();
})();
