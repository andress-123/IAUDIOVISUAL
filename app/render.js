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
  ['20-optimismo-a',           { comp: 'optimismo', seed: 3 }],
  ['21-optimismo-b',           { comp: 'optimismo', seed: 9 }],
  ['22-cabezoneria-a',         { comp: 'cabezoneria', seed: 2 }],
  ['23-cabezoneria-b',         { comp: 'cabezoneria', seed: 7 }],
  ['24-trabajo-duro-a',        { comp: 'trabajo', seed: 1 }],
  ['25-trabajo-duro-b',        { comp: 'trabajo', seed: 4 }],
  ['26-calma-a',               { comp: 'calma', seed: 5 }],
  ['27-calma-b',               { comp: 'calma', seed: 12 }],
  ['28-caos-a',                { comp: 'caos', seed: 6 }],
  ['29-caos-b',                { comp: 'caos', seed: 15 }],
  ['30-union-a',               { comp: 'union', seed: 2 }],
  ['31-union-b',               { comp: 'union', seed: 8 }],
  ['40-planta-1',             { comp: 'planta', seed: 1, w: 1000, h: 1250 }],
  ['41-planta-2',             { comp: 'planta', seed: 2, w: 1000, h: 1250 }],
  ['42-planta-3',             { comp: 'planta', seed: 3, w: 1000, h: 1250 }],
  ['43-planta-4',             { comp: 'planta', seed: 4, w: 1000, h: 1250 }],
  ['50-euro-3d-a',            { comp: 'euro3d', seed: 1, dirx: 1,  w: 1200, h: 1200 }],
  ['51-euro-3d-b',            { comp: 'euro3d', seed: 2, dirx: -1, w: 1200, h: 1200 }],
  ['52-euro-3d-c',            { comp: 'euro3d', seed: 4, dirx: 1,  w: 1200, h: 1200, prof: 28 }],
  ['53-euro-plano-a',         { comp: 'euro', seed: 1, luzx: -1, luzy: -1, w: 1200, h: 1200 }],
  ['54-euro-plano-b',         { comp: 'euro', seed: 2, luzx: 1, luzy: -1, w: 1200, h: 1200 }],
  ['55-euro-plano-c',         { comp: 'euro', seed: 4, luzx: -1, luzy: -1, w: 1200, h: 1200, cols: 52 }],
  ['60-signos-a',             { comp: 'signos', seed: 3 }],
  ['61-signos-b',             { comp: 'signos', seed: 11 }],
  ['62-signo-grande',         { comp: 'signoGrande', seed: 5 }],
  ['63-escalera-a',           { comp: 'escalera', seed: 2 }],
  ['64-escalera-b',           { comp: 'escalera', seed: 9 }],
  ['65-dentado-a',            { comp: 'dentado', seed: 4 }],
  ['66-dentado-b',            { comp: 'dentado', seed: 13 }],
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
// Globo: 4 ejercicios (abstracto -> icónico). Usa app/fotos/tierra.png solo para sacar la máscara de continentes (nivel 4)
const tierraPng = path.join(fotosDir, 'tierra.png');
const tierraUri = fs.existsSync(tierraPng) ? 'data:image/png;base64,' + fs.readFileSync(tierraPng).toString('base64') : undefined;
[1, 2, 3, 4, 5].forEach((n) => jobs.push([`globo-0${n}`, { comp: 'globo', nivel: n, seed: 5, w: 1200, h: 1200, foto: tierraUri }]));
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
