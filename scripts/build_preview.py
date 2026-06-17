"""
Render a compact preview PNG (1x scale, JPEG) for quick viewing.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
    html_path = Path("/home/z/my-project/download/ai_brain_mindmap.html")
    jpg_path = Path("/home/z/my-project/download/ai_brain_mindmap_preview.jpg")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(
            viewport={"width": 2400, "height": 1800},
            device_scale_factor=1,  # 1x for preview
        )
        await page.goto(f"file://{html_path}", wait_until="networkidle")
        await page.wait_for_timeout(800)

        # Expand viewport to fit content
        body_bbox = await page.evaluate("""() => {
            const b = document.body;
            return { width: b.scrollWidth, height: b.scrollHeight };
        }""")
        new_w = max(2400, int(body_bbox["width"]) + 40)
        new_h = int(body_bbox["height"]) + 40
        await page.set_viewport_size({"width": new_w, "height": new_h})
        await page.wait_for_timeout(400)

        # Redraw connectors at new viewport
        await page.evaluate("if(typeof drawAllLines==='function') drawAllLines()")
        await page.wait_for_timeout(400)

        await page.screenshot(
            path=str(jpg_path),
            full_page=True,
            type="jpeg",
            quality=88,
        )
        await browser.close()

    print(f"✅ Preview saved: {jpg_path} ({jpg_path.stat().st_size / 1024:.0f} KB)")

asyncio.run(main())
