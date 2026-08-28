from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("pageerror", lambda err: print(f"ERROR: {err}"))
    page.goto("http://localhost:5173")
    page.wait_for_load_state("networkidle")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
