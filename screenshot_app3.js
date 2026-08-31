const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');

  await page.waitForSelector('text=Upload Data', { timeout: 10000 });

  // I will click the FIRST item in the available logs list
  console.log("Clicking first file...");
  const firstFile = await page.$('.truncate');
  if (firstFile) {
      await firstFile.click();
  }

  console.log("Waiting for graph rendering...");
  await page.waitForTimeout(5000);

  console.log("Clicking random node...");
  await page.mouse.click(600, 400); // Click somewhere in the middle
  await page.waitForTimeout(1000);

  const rightPanelSearch = await page.$('input[placeholder="Filter node events..."]');
  if (rightPanelSearch) {
      await rightPanelSearch.fill('e'); // Search for a common letter to ensure a hit
      await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: '/tmp/app_after_click.png' });
  await browser.close();
})();
