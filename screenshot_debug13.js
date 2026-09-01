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

  await page.screenshot({ path: 'debug_users_list.png' });
  await browser.close();
})();
