const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  // Find a log file from sidebar
  const firstLog = await page.$('.text-blue-500.cursor-pointer');
  if (firstLog) {
      await firstLog.click();
      await page.waitForTimeout(2000);
  } else {
      console.log('first log not found');
  }

  // Need to evaluate and click in page context
  const hasClicked = await page.evaluate(() => {
     const lis = Array.from(document.querySelectorAll('li'));
     const sysLi = lis.find(li => li.textContent.includes('Unknown'));
     if (sysLi) {
         sysLi.click();
         return true;
     }
     return false;
  });

  if (hasClicked) {
     console.log('Clicked filter');
     await page.waitForTimeout(1000);
     await page.screenshot({ path: 'debug_exact_filter_unknown.png' });
  }

  await browser.close();
})();
