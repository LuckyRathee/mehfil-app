const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);
  const art = page.locator('.radio-player__disc-art');
  const t1 = await art.evaluate(el => getComputedStyle(el).transform);
  await page.waitForTimeout(700);
  const t2 = await art.evaluate(el => getComputedStyle(el).transform);
  console.log('rotating while active:', t1 !== t2);

  // mute
  await page.locator('.radio-player__disc').click();
  await page.waitForTimeout(1800); // allow decay
  const m1 = await art.evaluate(el => getComputedStyle(el).transform);
  await page.waitForTimeout(500);
  const m2 = await art.evaluate(el => getComputedStyle(el).transform);
  console.log('frozen when muted:', m1 === m2);
  console.log('label:', await page.locator('.radio-player__disc').getAttribute('aria-label'));

  // unmute
  await page.locator('.radio-player__disc').click();
  await page.waitForTimeout(800);
  const u1 = await art.evaluate(el => getComputedStyle(el).transform);
  await page.waitForTimeout(500);
  const u2 = await art.evaluate(el => getComputedStyle(el).transform);
  console.log('resumed after unmute:', u1 !== u2);
  console.log('label:', await page.locator('.radio-player__disc').getAttribute('aria-label'));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1) });
