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
  } else {
      console.log("File not found to click.");
  }

  await page.waitForTimeout(5000);

  // Trigger node click via window.cyInstance
  await page.evaluate(() => {
     if(window.cyInstance) {
         const nodes = window.cyInstance.nodes();
         if(nodes.length > 0) {
             nodes[0].emit('tap');
         }
     } else {
         console.log("cyInstance not found.");
     }
  });

  await page.waitForTimeout(2000);

  const rightPanelSearch = await page.$('input[placeholder="Filter node events..."]');
  if (rightPanelSearch) {
      console.log("Found search, typing msedgewebview...");
      await rightPanelSearch.fill('msedgewebview');
      await page.waitForTimeout(2000);
  } else {
      console.log("Right panel search input not found.");
  }

  await page.screenshot({ path: '/tmp/app_highlight_test3.png' });
  await browser.close();
})();
