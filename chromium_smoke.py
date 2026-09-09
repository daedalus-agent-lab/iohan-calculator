#!/usr/bin/env python3
"""Chromium smoke for iohan-calculator: both fork entry points must show cards, no pageerror."""
from pathlib import Path
from playwright.sync_api import sync_playwright

html = Path(__file__).resolve().parent / "index.html"
url = html.as_uri()
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on("pageerror", lambda err: errors.append(str(err)))
    page.goto(url)
    page.wait_for_load_state("domcontentloaded")

    # Entry 1: + person
    page.click("#addPerson")
    page.wait_for_selector("#fork:not([hidden])", timeout=3000)
    assert page.is_visible("#wayA"), "wayA not visible after +person"
    assert page.is_visible("#wayB"), "wayB not visible after +person"
    assert "4" in page.inner_text("#forkKicker")
    assert page.inner_text("#wayARel") == "4 × 21 = 84"
    page.click("#cancel")

    # Entry 2: apply target
    page.fill("#target", "21")
    page.click("#apply")
    page.wait_for_selector("#fork:not([hidden])", timeout=3000)
    assert page.is_visible("#wayA") and page.is_visible("#wayB")
    assert page.inner_text("#wayBRel") == "3 × 21 = 63"
    page.click("#cancel")

    # Non-integer ≈
    page.fill("#ownPool", "100")
    page.fill("#ownRecip", "3")
    page.click("#setScene")
    assert "≈" in page.inner_text("#curRel")
    assert "=" not in page.inner_text("#curRel").replace("≈", "")

    browser.close()

if errors:
    raise SystemExit("pageerror: " + "; ".join(errors))
print("CHROMIUM SMOKE OK", url)
