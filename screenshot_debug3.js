const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()} - ${msg.text()}`));
  page.on('pageerror', error => console.error(`BROWSER ERROR: ${error.message}`));
  page.on('request', request => console.log(`>> ${request.method()} ${request.url()}`));
  page.on('response', response => console.log(`<< ${response.status()} ${response.url()}`));

  try {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Change dropdown to CrowdStrike Falcon (JSONL)
    await page.selectOption('select', 'crowdstrike');

    // Wait for file input and upload a test file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('test_crowdstrike.jsonl');

    // Wait for the upload request to complete
    await page.waitForResponse(response => response.url().includes('/api/upload') && response.status() === 200, { timeout: 10000 });

    console.log('Upload completed. Waiting for file to appear in sidebar...');

    // Ensure the file is in the sidebar and visible
    await page.waitForSelector('li.cursor-pointer');
    const fileItems = await page.locator('li.cursor-pointer').all();
    console.log(`Found ${fileItems.length} items in sidebar.`);

    if (fileItems.length > 0) {
      console.log('Clicking on the first uploaded file...');
      await fileItems[0].click();

      // Wait for the fetch request to get the file data
      await page.waitForResponse(response => response.url().includes('/api/logs/') && response.status() === 200, { timeout: 10000 });

      console.log('Log data fetched. Waiting for graph to render...');
      await page.waitForTimeout(4000);
    }

    await page.screenshot({ path: 'debug_graph3.png' });
    console.log('Screenshot saved to debug_graph3.png');
  } catch (e) {
    console.error('Test error:', e);
  } finally {
    await browser.close();
  }
})();
