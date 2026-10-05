// Renderiza las pruebas a PNG con Chromium headless: node app/render.js
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs'), path = require('path');
const out = path.join(__dirname, 'pruebas');
const jobs = [
  ['01-expandir-flujo',        { comp: 'flujo', seed: 4 }],
  ['02-sumar-cruces',          { comp: 'mas', seed: 12 }],
  ['03-unir-cruz',             { comp: 'cruz', seed: 31 }],
  ['04-crecer-molinillo',      { comp: 'molinillo', seed: 8 }],
  ['05-transformar-disolver',  { comp: 'disolver', seed: 5 }],
  ['06-conectar-bandas',       { comp: 'bandas', seed: 9 }],
  ['07-diversidad-campo',      { comp: 'campo', seed: 21 }],
  ['08-transformar-disolver-b',{ comp: 'disolver', seed: 77 }],
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
