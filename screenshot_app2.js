const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');

  await page.waitForSelector('text=Upload Data', { timeout: 10000 });

  const fileInput = await page.$('input[type="file"]');
  await fileInput.setInputFiles('/app/test.csv');
  await page.selectOption('select', 'defender');

  await page.waitForSelector('text=test.csv.jsonl', { timeout: 10000 });
  await page.click('text=test.csv.jsonl');

  await page.waitForTimeout(5000);

  await page.screenshot({ path: '/tmp/app_after_upload.png' });
  await browser.close();
})();
