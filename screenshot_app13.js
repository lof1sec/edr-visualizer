const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  await page.evaluate(() => {
    localStorage.setItem('theme', 'light');
    window.location.reload();
  });
  await page.waitForTimeout(2000);

  // Click on the first file in the 'Available Logs' list
  const firstLog = await page.locator('.space-y-2 > div').first();
  if (await firstLog.isVisible()) {
      await firstLog.click();
      console.log('Clicked existing log file');
  }

  // wait for cytoscape canvas to render
  try {
     await page.waitForSelector('canvas', { timeout: 10000 });
     await page.waitForTimeout(3000);
     console.log('Canvas loaded');
  } catch (e) {
     console.log('Canvas not found', e);
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'canvas-light-mode2.png', fullPage: true });
  console.log('Screenshot saved to canvas-light-mode2.png');
  await browser.close();
})();
