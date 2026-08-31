const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });
  await page.goto('http://localhost:5173');

  await page.waitForSelector('text=Upload Data', { timeout: 10000 });

  // Click first file
  const firstFile = await page.$('.truncate');
  if (firstFile) {
      await firstFile.click();
  }

  await page.waitForTimeout(3000);

  // Click on a node in cytoscape. Cytoscape nodes are hard to click via playwright coordinates reliably if they are scattered,
  // but we can evaluate a script to click a node via cy.
  // We can attach cy to window in GraphView temporarily, or just click the center.

  const canvas = await page.$('canvas');
  if (canvas) {
    const box = await canvas.boundingBox();
    // Assuming a node is near the center, layout might cluster them
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    // Fallbacks just in case
    await page.mouse.click(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50);
    await page.mouse.click(box.x + box.width / 2 - 50, box.y + box.height / 2 - 50);
  }

  await page.waitForTimeout(2000);

  const rightPanelSearch = await page.$('input[placeholder="Filter node events..."]');
  if (rightPanelSearch) {
      console.log("Found search, typing e...");
      await rightPanelSearch.fill('e');
      await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: '/tmp/app_highlight_test.png' });
  await browser.close();
})();
