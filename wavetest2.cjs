const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);

  // 1. Verify container is genuinely gone
  const bg = await page.evaluate(() => {
    const el = document.querySelector('.radio-player');
    const cs = getComputedStyle(el);
    const glass = document.querySelector('.radio-player__glass');
    return {
      background: cs.backgroundImage + '|' + cs.backgroundColor,
      border: cs.border,
      boxShadow: cs.boxShadow,
      glassExists: !!glass,
      backdrop: cs.backdropFilter || cs.webkitBackdropFilter
    };
  });
  console.log('container check:', JSON.stringify(bg));

  // 2. Movement: compare actual pixel buffer of the left wave over frames
  const wave = page.locator('.radio-player__wave--left');
  const snap = () => wave.evaluate(c => {
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    // build a cheap fingerprint: channel sums per vertical band
    const bands = [];
    for (let x = 0; x < c.width; x += 4) {
      let s = 0;
      for (let y = 0; y < c.height; y += 4) {
        const i = (y * c.width + x) * 4;
        if (d[i+3] > 40) s += d[i+1];
      }
      bands.push(s);
    }
    return bands.join(',');
  });
  const f1 = await snap();
  await page.waitForTimeout(350);
  const f2 = await snap();
  await page.waitForTimeout(350);
  const f3 = await snap();
  const diff = (a,b) => a.split(',').filter((v,i)=>v!==b.split(',')[i]).length;
  console.log('band fingerprints differ f1<->f2:', diff(f1,f2), '/ f2<->f3:', diff(f2,f3), 'of', f1.split(',').length, 'bands');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1) });
