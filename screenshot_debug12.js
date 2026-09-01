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
    await page.waitForTimeout(2000);
  }

  // Need to evaluate and click in page context
  const hasClicked = await page.evaluate(() => {
     const lis = Array.from(document.querySelectorAll('li'));
     const sysLi = lis.find(li => li.textContent.includes('SYSTEM'));
     if (sysLi) {
         sysLi.click();
         return true;
     }
     return false;
  });

  if (hasClicked) {
     console.log('Clicked filter');
     await page.waitForTimeout(1000);
     await page.screenshot({ path: 'debug_exact_filter_system.png' });
  }

  await browser.close();
})();
