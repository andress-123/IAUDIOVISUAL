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
];
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
