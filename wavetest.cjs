const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  const wave = page.locator('.radio-player__wave--left');
  const frames = [];
  for (let i = 0; i < 8; i++) {
    frames.push(await wave.evaluate(c => {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let sum = 0, count = 0;
      for (let p = 0; p < d.length; p += 4) if (d[p+3] > 30) { sum += d[p+1]; count++; }
      return count ? Math.round(sum / count) : 0;
    }));
    await page.waitForTimeout(250);
  }
  console.log('frames:', frames.join(' | '));
  console.log('distinct:', new Set(frames).size, '(>1 means moving)');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1) });
