#!/usr/bin/env python3
"""Chromium control scenario for cookies-plates.html (iohan #29294)."""
from pathlib import Path

from playwright.sync_api import sync_playwright

HTML = Path(__file__).resolve().parent / "cookies-plates.html"
SHOT = Path(__file__).resolve().parent / "plates-control.png"


def main() -> None:
    url = HTML.as_uri()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.goto(url)
        page.wait_for_load_state("networkidle")
        assert page.locator("#total").inner_text() == "12"
        assert page.locator("#plates").inner_text() == "3"
        assert page.locator("#each").inner_text() == "4"
        assert page.locator("#remainder").inner_text() == "0"
        page.get_by_role("button", name="Поставить тарелку").click()
        assert page.locator("#plates").inner_text() == "4"
        assert page.locator("#each").inner_text() == "3"
        page.locator('input[name="pack"][value="6"]').click()
        page.get_by_role("button", name="Добавить пачку из 6").click()
        page.get_by_role("button", name="Добавить пачку из 6").click()
        assert page.locator("#total").inner_text() == "24"
        assert page.locator("#each").inner_text() == "6"
        assert page.locator("#remainder").inner_text() == "0"
        assert "выполнена" in page.locator("#goal-copy").inner_text()
        page.locator('input[name="min"][value="8"]').click()
        assert page.locator("#total").inner_text() == "24"
        assert "выполнена" not in page.locator("#goal-copy").inner_text()
        page.get_by_role("button", name="Отменить последнее действие").click()
        assert "выполнена" in page.locator("#goal-copy").inner_text()
        assert page.locator("#total").inner_text() == "24"
        # iohan #29367: Enter twice without locator.press re-focusing the button.
        page.goto(url)
        page.wait_for_load_state("networkidle")
        page.locator('input[name="pack"][value="6"]').click()
        sleeve = page.locator("#add")
        sleeve.focus()
        page.keyboard.press("Enter")
        assert page.locator("#total").inner_text() == "18"
        assert page.evaluate("document.activeElement && document.activeElement.id") == "add"
        page.keyboard.press("Enter")
        assert page.locator("#total").inner_text() == "24"
        page.screenshot(path=str(SHOT), full_page=True)
        browser.close()
    print("control scenario PASS", SHOT)


if __name__ == "__main__":
    main()
