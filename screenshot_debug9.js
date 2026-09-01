const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    await page.selectOption('select', 'crowdstrike');

    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('test_crowdstrike.jsonl');

    await page.waitForResponse(response => response.url().includes('/api/upload') && response.status() === 200, { timeout: 10000 });

    await page.waitForSelector('div.cursor-pointer');
    const fileDivs = await page.locator('div.cursor-pointer').filter({ hasText: '.jsonl' }).all();

    if (fileDivs.length > 0) {
      await fileDivs[0].click();
      await page.waitForTimeout(4000);

      // Let's click a node by clicking somewhere roughly in the middle of the canvas
      await page.mouse.click(400, 400);
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'debug_graph9.png' });
    console.log('Screenshot saved to debug_graph9.png');
  } catch (e) {
    console.error('Test error:', e);
  } finally {
    await browser.close();
  }
})();
