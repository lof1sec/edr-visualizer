const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()} - ${msg.text()}`));
  page.on('pageerror', error => console.error(`BROWSER ERROR: ${error.message}`));

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

    // The sidebar renders divs with onClick handlers, not <li> elements!
    await page.waitForSelector('div.cursor-pointer');
    const fileItems = await page.locator('div.cursor-pointer').all();
    console.log(`Found ${fileItems.length} items in sidebar.`);

    if (fileItems.length > 0) {
      console.log('Clicking on the uploaded file...');

      // Let's click on the first one (it might be the upload box itself though, so let's refine)
      // The uploaded files have a FileText icon and a span with title={file}
      const fileDivs = await page.locator('div.cursor-pointer').filter({ hasText: '.jsonl' }).all();

      if (fileDivs.length > 0) {
        await fileDivs[0].click();

        console.log('Log data fetched. Waiting for graph to render...');
        await page.waitForTimeout(4000);
      } else {
        console.log('Could not find the specific file div in the sidebar.');
      }
    }

    await page.screenshot({ path: 'debug_graph4.png' });
    console.log('Screenshot saved to debug_graph4.png');
  } catch (e) {
    console.error('Test error:', e);
  } finally {
    await browser.close();
  }
})();
