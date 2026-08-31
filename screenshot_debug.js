const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log all console messages
  page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()} - ${msg.text()}`));

  // Log page errors
  page.on('pageerror', error => console.error(`BROWSER ERROR: ${error.message}`));

  try {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Wait for file input and upload a test file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('test_crowdstrike.jsonl');

    // Wait for the upload request to complete
    await page.waitForResponse(response => response.url().includes('/api/upload') && response.status() === 200, { timeout: 10000 });

    console.log('Upload completed. Waiting for graph processing...');

    // Wait for canvas or error to appear
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'debug_graph.png' });
    console.log('Screenshot saved to debug_graph.png');
  } catch (e) {
    console.error('Test error:', e);
  } finally {
    await browser.close();
  }
})();
