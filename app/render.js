// Renderiza las pruebas a PNG con Chromium headless: node app/render.js
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs'), path = require('path');
const out = path.join(__dirname, 'pruebas');
const jobs = [
  ['01-expandir-flujo',        { comp: 'flujo', seed: 4 }],
  ['02-expandir-flujo-b',      { comp: 'flujo', seed: 19 }],
  ['03-sumar-cruces',          { comp: 'mas', seed: 12 }],
  ['04-unir-cruz',             { comp: 'cruz', seed: 31 }],
  ['05-crecer-molinillo',      { comp: 'molinillo', seed: 8 }],
  ['06-transformar-disolver',  { comp: 'disolver', seed: 5 }],
  ['07-transformar-disolver-b',{ comp: 'disolver', seed: 77 }],
  ['08-conectar-bandas',       { comp: 'bandas', seed: 9 }],
  ['09-mezclar-superposicion', { comp: 'mezcla', seed: 3 }],
  ['10-mezclar-superposicion-b',{ comp: 'mezcla', seed: 26 }],
  ['11-diversidad-mosaico',    { comp: 'campo', seed: 21 }],
  ['12-diversidad-mosaico-b',  { comp: 'campo', seed: 64 }],
  ['13-figura-demo-a',         { comp: 'figura', seed: 2 }],
  ['14-figura-demo-b',         { comp: 'figura', seed: 6 }],
  ['15-figura-demo-c',         { comp: 'figura', seed: 11 }],
];
// Fotos propias: déjalas en app/fotos/ (jpg/png) y se generan versiones en modo figura
const fotosDir = path.join(__dirname, 'fotos');
if (fs.existsSync(fotosDir)) for (const f of fs.readdirSync(fotosDir).filter((n) => /\.(jpe?g|png|webp)$/i.test(n)))
  for (const seed of [1, 2, 3, 4, 5, 6]) jobs.push([`silueta-${path.parse(f).name}-${seed}`, { comp: 'silueta', seed, foto: 'data:image/' + path.extname(f).slice(1).replace('jpg', 'jpeg') + ';base64,' + fs.readFileSync(path.join(fotosDir, f)).toString('base64') }]);
if (fs.existsSync(fotosDir)) for (const f of fs.readdirSync(fotosDir).filter((n) => /\.(jpe?g|png|webp)$/i.test(n)))
  for (const seed of [1, 2, 3]) jobs.push([`figura-${path.parse(f).name}-${seed}`, { comp: 'figura', seed, foto: 'data:image/' + path.extname(f).slice(1).replace('jpg', 'jpeg') + ';base64,' + fs.readFileSync(path.join(fotosDir, f)).toString('base64') }]);
const only = process.argv[2];
if (only) for (let i = jobs.length - 1; i >= 0; i--) if (!jobs[i][0].includes(only)) jobs.splice(i, 1);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  await p.goto('file://' + path.join(__dirname, 'index.html'));
  for (const [name, spec] of jobs) {
    await p.evaluate((s) => window.draw(s), spec);
    const d = await p.evaluate(() => window.png());
    fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(d.split(',')[1], 'base64'));
    console.log('ok', name);
  }
  await b.close();
})();
