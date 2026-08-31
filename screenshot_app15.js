const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

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

  // Directly inject some elements into the app state if possible via window object if we expose it, but we don't.
  // Instead let's just use evaluate to modify the DOM temporarily to see the cytoscape component text color

  await page.evaluate(() => {
    const graphHtml = `
      <div id="dummy-graph" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:9999;background:white;display:flex;align-items:center;justify-content:center;gap:20px;">
        <div style="background-color: #4d0000; border: 2px solid #ff4d4d; color: #e5e7eb; padding: 10px; font-family: monospace; font-size: 12px; width: 120px; height: 120px; text-align: center; display:flex; align-items:center; justify-content:center;">
           powershell.exe<br/>PID: 1003
        </div>
        <div style="background-color: #00264d; border: 2px solid #4da6ff; color: #e5e7eb; padding: 10px; font-family: monospace; font-size: 12px; width: 120px; height: 120px; text-align: center; display:flex; align-items:center; justify-content:center;">
           payload.chm<br/>PID: 1004
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', graphHtml);
  });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'canvas-light-mode4.png', fullPage: true });
  console.log('Screenshot saved to canvas-light-mode4.png');
  await browser.close();
})();
