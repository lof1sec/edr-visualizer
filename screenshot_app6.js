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

  await page.waitForTimeout(5000);

  // Trigger node click via window.cyInstance
  await page.evaluate(() => {
     if(window.cyInstance) {
         const nodes = window.cyInstance.nodes();
         if(nodes.length > 0) {
             nodes[0].emit('tap');
         }
     }
  });

  await page.waitForTimeout(2000);

  const rightPanelSearch = await page.$('input[placeholder="Filter node events..."]');
  if (rightPanelSearch) {
      console.log("Found search, typing e...");
      await rightPanelSearch.fill('e');
      await page.waitForTimeout(2000);
  } else {
      console.log("Right panel search input not found.");
  }

  await page.screenshot({ path: '/tmp/app_highlight_test2.png' });
  await browser.close();
})();
