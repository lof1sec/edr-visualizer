const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });
  await page.goto('http://localhost:5173');

  await page.waitForSelector('text=Upload Data', { timeout: 10000 });

  console.log("Uploading file...");
  const fileInput = await page.$('input[type="file"]');
  await fileInput.setInputFiles('/app/test.csv');
  await page.selectOption('select', 'defender');

  await page.waitForSelector('text=test.csv.jsonl', { timeout: 10000 });
  const fileEls = await page.$$('text=test.csv.jsonl');
  if(fileEls.length > 0) {
      await fileEls[0].click();
  }

  await page.waitForTimeout(5000);

  // Search globally for 'cmd.exe' to make sure the graph is populated and visible
  const globalSearch = await page.$('input[placeholder*="Search strings"]');
  if (globalSearch) {
      await globalSearch.fill('cmd.exe');
      await page.waitForTimeout(2000);
  }

  // Trigger node click via cyInstance (first visible node)
  await page.evaluate(() => {
     if(window.cyInstance) {
         const nodes = window.cyInstance.nodes(':visible');
         if(nodes.length > 0) {
             nodes[0].emit('tap');
         }
     }
  });

  await page.waitForTimeout(2000);

  const rightPanelSearch = await page.$('input[placeholder="Filter node events..."]');
  if (rightPanelSearch) {
      console.log("Found search, typing cmd...");
      await rightPanelSearch.fill('cmd');
      await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: '/tmp/app_highlight_test4.png' });
  await browser.close();
})();
