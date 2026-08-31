const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Intercept API calls to see if graph data is failing
  page.on('request', request => console.log('>>', request.method(), request.url()));
  page.on('response', response => console.log('<<', response.status(), response.url()));

  await page.goto('http://localhost:5173');

  await page.waitForSelector('text=Upload Data', { timeout: 10000 });

  console.log("Clicking first file...");
  const firstFile = await page.$('.truncate');
  if (firstFile) {
      await firstFile.click();
  }

  console.log("Waiting for graph rendering...");
  await page.waitForTimeout(5000);

  await page.screenshot({ path: '/tmp/app_after_click_api.png' });
  await browser.close();
})();
