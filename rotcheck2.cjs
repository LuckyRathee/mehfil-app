const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);
  const art = page.locator('.radio-player__disc-art');
  const angle = () => art.evaluate(el => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return Math.atan2(m.b, m.a);
  });
  await page.locator('.radio-player__disc').click(); // mute
  await page.waitForTimeout(2500); // way past decay
  const a1 = await angle();
  await page.waitForTimeout(1200);
  const a2 = await angle();
  const delta = Math.abs(((a2 - a1 + Math.PI*3) % (Math.PI*2)) - Math.PI); // unwrap
  console.log('angle1:', a1.toFixed(4), 'angle2:', a2.toFixed(4), 'delta(rad):', delta.toFixed(6));
  console.log('RESOLVED-stop apprx delta < 0.01:', delta < 0.01);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1) });
