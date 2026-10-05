// node app/iconos-render.js  -> app/iconos/hoja.png + un PNG por icono
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const out = path.join(__dirname, 'iconos'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1800, height: 1300 } });
  p.on('pageerror', (e) => console.error('ERROR PAGINA:', e.message));
  await p.goto('file://' + path.join(__dirname, 'iconos.html'));
  const save = (n, d) => fs.writeFileSync(path.join(out, n), Buffer.from(d.split(',')[1], 'base64'));
  save('hoja.png', await p.evaluate(() => window.hoja())); console.log('ok hoja');
  const ids = await p.evaluate(() => window.iconos.ICONS.map((i) => i.id));
  for (let i = 0; i < ids.length; i++) { save(`0${i + 1}-${ids[i]}.png`, await p.evaluate((k) => window.uno(k), i)); console.log('ok', ids[i]); }
  save('pixel-hoja.png', await p.evaluate(() => window.hojaPixel())); console.log('ok pixel-hoja');
  for (let i = 0; i < ids.length; i++) { save(`pixel-0${i + 1}-${ids[i]}.png`, await p.evaluate((k) => window.unoPixel(k), i)); console.log('ok pixel', ids[i]); }
  await b.close();
})();
