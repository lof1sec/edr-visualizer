const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  // Upload CS file
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    const csFile = path.resolve('test_crowdstrike.jsonl');
    await fileInput.setInputFiles(csFile);
    await page.waitForTimeout(2000); // Wait for upload and render
  }

  // Need to select file in available logs
  const firstLog = await page.$('.text-blue-500.cursor-pointer');
  if (firstLog) {
      await firstLog.click();
      await page.waitForTimeout(2000);
  } else {
      console.log('first log not found');
  }

  // Click on a node in cytoscape
  await page.mouse.click(600, 400);
  await page.waitForTimeout(500);

  // Click hide
  await page.click('button[title="Hide Selected Elements"]');
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'debug_graph10.png' });

  // Click show all
  await page.click('button[title="Show All Hidden Elements"]');
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'debug_graph11.png' });

  await browser.close();
})();
