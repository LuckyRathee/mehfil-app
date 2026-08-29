const { chromium } = require('playwright')

const baseUrl = process.env.PLAYBACK_URL || 'http://localhost:5173/'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const consoleMessages = []
  const pageErrors = []
  page.on('console', (message) => consoleMessages.push(`${message.type()}: ${message.text()}`))
  page.on('pageerror', (error) => pageErrors.push(error.message))

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60_000 })
    const cards = page.locator('.vibe-card')
    if (await cards.count() !== 6) throw new Error('Landing page did not render all six vibe cards')

    await cards.first().click()
    await page.locator('.radio-player').waitFor({ timeout: 15_000 })
    const logo = page.locator('.radio-player__disc-art')
    await logo.waitFor({ state: 'visible', timeout: 15_000 })
    const logoDetails = await logo.evaluate((image) => ({
      source: image.getAttribute('src'),
      loaded: image.complete && image.naturalWidth > 0,
    }))
    const snapshot = async () => page.evaluate(() => {
      const rect = (selector) => {
        const element = document.querySelector(selector)
        if (!element) throw new Error(`Missing ${selector}`)
        const { left, right, width } = element.getBoundingClientRect()
        return { left, right, width, center: left + width / 2 }
      }
      return {
        player: rect('.radio-player'),
        disc: rect('.radio-player__disc'),
        leftWave: rect('.radio-player__wave--left'),
        rightWave: rect('.radio-player__wave--right'),
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }
    })
    const setTitle = (text) => page.locator('.radio-player__title').evaluate((node, value) => {
      node.textContent = value
    }, text)
    const initial = await snapshot()
    const innerWaveActivity = () => page.locator('.radio-player__wave--left').evaluate((canvas) => {
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Waveform canvas has no 2D context')
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
      const innerStart = Math.floor(canvas.width * 0.72)
      let alphaTotal = 0
      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = innerStart; x < canvas.width; x += 1) {
          alphaTotal += pixels[(y * canvas.width + x) * 4 + 3]
        }
      }
      return alphaTotal
    })
    const innerWaveFrameOne = await innerWaveActivity()
    await page.waitForTimeout(500)
    const innerWaveFrameTwo = await innerWaveActivity()
    await setTitle('MOHAMMED RAFI')
    const shortTitle = await snapshot()
    await setTitle('Arijit Singh, Palak Muchhal - Teri Meri Kahaani - Original Soundtrack')
    const longTitle = await snapshot()
    await setTitle('A deliberately very long Mehfil radio track title designed to wrap across multiple lines without ever moving the visualizer disc or its connected waveforms')
    const veryLongTitle = await snapshot()

    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(150)
    const mobile = await snapshot()

    const result = { logoDetails, initial, shortTitle, longTitle, veryLongTitle, mobile, innerWaveFrameOne, innerWaveFrameTwo, consoleMessages, pageErrors }
    console.log(JSON.stringify(result, null, 2))

    const assertCentered = ({ player, disc }) => {
      if (Math.abs(player.center - disc.center) > 0.1) throw new Error('Disc is not centered in the player')
    }
    const assertConnected = ({ disc, leftWave, rightWave }) => {
      if (Math.abs(disc.left - leftWave.right) > 3 || Math.abs(rightWave.left - disc.right) > 3) {
        throw new Error('Waveforms are not positioned directly from the disc')
      }
    }
    for (const state of [initial, shortTitle, longTitle, veryLongTitle, mobile]) {
      assertCentered(state)
      assertConnected(state)
      if (state.scrollWidth > state.viewportWidth) throw new Error('Visualizer causes horizontal overflow')
    }
    if (logoDetails.source !== '/images/mehfil-logo-disc.png' || !logoDetails.loaded) {
      throw new Error('Mehfil logo asset did not load from the required public path')
    }
    if (Math.abs(shortTitle.disc.center - longTitle.disc.center) > 0.1 || Math.abs(shortTitle.disc.center - veryLongTitle.disc.center) > 0.1) {
      throw new Error('Metadata width moved the disc')
    }
    if (innerWaveFrameOne === innerWaveFrameTwo) throw new Error('Innermost waveform bars did not animate')
    if (pageErrors.length) throw new Error('Browser reported an uncaught page error')
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
