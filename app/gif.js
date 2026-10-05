// GIF animado de la silueta pixelada: node app/gif.js <foto-en-app/fotos> [semilla]
// Se enfoca (píxeles gordos -> detalle), los degradados fluyen por la rampa y se desenfoca: bucle continuo. Fondo blanco.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const foto = process.argv[2], seed = +(process.argv[3] || 2);
if (!foto) { console.error('uso: node app/gif.js <nombre-foto> [semilla]'); process.exit(1); }
const file = fs.readdirSync(path.join(__dirname, 'fotos')).find((n) => path.parse(n).name === foto || n === foto);
if (!file) { console.error('no encuentro la foto en app/fotos/'); process.exit(1); }
const uri = 'data:image/' + path.extname(file).slice(1).replace('jpg', 'jpeg') + ';base64,' + fs.readFileSync(path.join(__dirname, 'fotos', file)).toString('base64');

const FIN = 84, ALTO = 640, FPS = 12;
const enfoque = [8, 11, 16, 22, 30, 42, 58, FIN];            // resolución creciente (columnas)
const frames = [];                                             // {cols, desp}
for (const c of enfoque) frames.push({ cols: c, desp: 0 });                     // 1) se enfoca
for (let i = 0; i < 6; i++) frames.push({ cols: FIN, desp: 0 });                // pausa
const FLOW = 30;
for (let i = 0; i < FLOW; i++) frames.push({ cols: FIN, desp: (2 * i) / FLOW }); // 2) el degradado fluye (ciclo completo)
for (let i = 0; i < 6; i++) frames.push({ cols: FIN, desp: 0 });                // pausa
for (const c of enfoque.slice().reverse().slice(1)) frames.push({ cols: c, desp: 0 }); // 3) se desenfoca -> bucle

(async () => {
  const out = path.join(__dirname, 'pruebas'), tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gif-'));
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  await p.goto('file://' + path.join(__dirname, 'index.html'));
  for (let i = 0; i < frames.length; i++) {
    await p.evaluate((s) => window.draw(s), { comp: 'silueta', seed, foto: uri, alto: ALTO, degradado: 'mapa', ...frames[i] });
    const d = await p.evaluate(() => window.png());
    fs.writeFileSync(path.join(tmp, `f${String(i).padStart(3, '0')}.png`), Buffer.from(d.split(',')[1], 'base64'));
  }
  await b.close();
  const dest = path.join(out, `silueta-${path.parse(file).name}-${seed}.gif`);
  // paleta global (sin parpadeos) y sin tramado: los píxeles quedan nítidos
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, 'f%03d.png'),
    '-vf', 'split[a][b];[a]palettegen=max_colors=128:stats_mode=full[p];[b][p]paletteuse=dither=none', '-loop', '0', dest]);
  console.log('ok', dest, frames.length + ' fotogramas, ' + (fs.statSync(dest).size / 1024 | 0) + ' KB');
})();
