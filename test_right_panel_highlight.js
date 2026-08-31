const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: '/tmp/playwright-videos/',
      size: { width: 1280, height: 720 },
    }
  });
  const page = await context.newPage();

  console.log("Navigating to app...");
  await page.goto('http://localhost:5173');

  console.log("Waiting for app to load...");
  await page.waitForSelector('text=Upload Data', { timeout: 10000 });

  // Upload file
  console.log("Uploading file...");
  const fileInput = await page.$('input[type="file"]');
  await fileInput.setInputFiles('/app/test.csv');

  // Choose Defender format
  await page.selectOption('select', 'defender');

  console.log("Waiting for file to appear in the list...");
  await page.waitForSelector('text=test.csv', { timeout: 10000 });

  console.log("Clicking on the file to render...");
  const fileEls = await page.$$('text=test.csv');
  if(fileEls.length > 0) {
    await fileEls[0].click();
  }

  console.log("Waiting for graph to render...");
  await page.waitForSelector('.cytoscape-container canvas', { timeout: 20000, state: 'attached' });
  await page.waitForTimeout(3000); // Wait a bit for layout to settle

  console.log("Clicking a node to open right panel...");
  // Click roughly in the center of the canvas where nodes likely are
  const canvases = await page.$$('canvas');
  if(canvases.length > 0) {
      const canvas = canvases[0];
      const box = await canvas.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  await page.waitForTimeout(1000);

  const rightPanelSearch = await page.$('input[placeholder="Filter node events..."]');

  if (rightPanelSearch) {
      console.log("Found right panel search. Typing 'cmd'...");
      await rightPanelSearch.fill('cmd');
      await page.waitForTimeout(1000); // Wait for re-render

      console.log("Taking screenshot of highlighted text...");
      await page.screenshot({ path: '/tmp/right_panel_highlight.png' });
  } else {
      console.log("Right panel search not found. Maybe click didn't hit a node.");

      // Attempt 2: click somewhere else
      const canvas = canvases[0];
      const box = await canvas.boundingBox();
      await page.mouse.click(box.x + box.width / 3, box.y + box.height / 3);
      await page.waitForTimeout(1000);

      const retrySearch = await page.$('input[placeholder="Filter node events..."]');
      if (retrySearch) {
          console.log("Found right panel search on retry. Typing 'cmd'...");
          await retrySearch.fill('cmd');
          await page.waitForTimeout(1000);
          await page.screenshot({ path: '/tmp/right_panel_highlight.png' });
      } else {
          console.log("Failed to open right panel. Saving failure state.");
          await page.screenshot({ path: '/tmp/right_panel_miss.png' });
      }
  }

  await context.close();
  await browser.close();
  console.log("Done.");
})();
