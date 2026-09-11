"""Drive the card sketch in a real browser and assert the four contract rows from the DOM.

The page's own verifier runs its script in a JS VM; this one runs the layout engine, so the numbers
come off the rendered page and the clicks go through real hit-testing.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

PAGE = Path(__file__).with_name("cards-what-if.html")
SHOTS = Path(__file__).parent
CHROME = "/usr/local/bin/chromium"


def row(page, plan_id: str) -> dict[str, str]:
    el = page.query_selector(f'[data-plan-id="{plan_id}"]')
    assert el is not None, f"plan {plan_id} is not on screen"
    out = {}
    for name in ("packs", "total", "each", "remainder"):
        raw = page.eval_on_selector(
            f'[data-plan-id="{plan_id}"] [data-result="{name}"]', "e => e.textContent.trim()")
        digits = "".join(ch for ch in raw if ch.isdigit())
        assert digits != "", f"{plan_id}.{name} shows no number: {raw!r}"
        out[name] = digits
    return out


def main() -> int:
    checks: list[tuple[str, bool, str]] = []

    def check(text: str, held: bool, detail: str = "") -> None:
        checks.append((text, held, detail))
        print(f"{'OK  ' if held else 'FAIL'} {text}" + (f"  [{detail}]" if detail else ""))

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox", "--disable-dev-shm-usage"])
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        errors: list[str] = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(PAGE.as_uri())
        page.wait_for_timeout(300)

        check("no page errors on load", not errors, "; ".join(errors))

        a = row(page, "a")
        check("step 1 card A: 1 pack, total 20, each 6, remainder 2",
              a == {"packs": "1", "total": "20", "each": "6", "remainder": "2"}, json.dumps(a))
        page.screenshot(path=str(SHOTS / "shot-1440-step1.png"))

        # Step 2: the question on A creates B beside it.
        page.click('[data-plan-id="a"] [data-branch="a"]')
        page.wait_for_timeout(200)
        b = row(page, "b")
        check("step 2 card B: 2 packs, total 28, each 7, remainder 0",
              b == {"packs": "2", "total": "28", "each": "7", "remainder": "0"}, json.dumps(b))
        a_after = row(page, "a")
        check("step 2 leaves card A exactly as it was", a_after == a, json.dumps(a_after))
        check("step 2 says the minimum is exceeded, not met exactly",
              page.eval_on_selector('[data-plan-id="b"] [data-floor-status]', "e => e.dataset.floorStatus") == "above"
              and "7" in page.inner_text('[data-plan-id="b"] .floor-note'))

        # Step 3: the question on B creates C, keeping B.
        page.click('[data-plan-id="b"] [data-branch="b"]')
        page.wait_for_timeout(200)
        c = row(page, "c")
        check("step 3 card C: 3 packs, total 24, each 6, remainder 0",
              c == {"packs": "3", "total": "24", "each": "6", "remainder": "0"}, json.dumps(c))
        check("step 3 keeps card B unchanged", row(page, "b") == b)
        check("all three plans are visible at once", page.locator(".plan").count() == 3,
              str(page.locator(".plan").count()))
        page.screenshot(path=str(SHOTS / "shot-1440-step3.png"), full_page=True)

        # Step 4: selection only marks.
        page.click('[data-plan-id="a"] [data-select="a"]')
        page.wait_for_timeout(200)
        check("step 4 marks the selected plan",
              page.query_selector('[data-plan-id="a"] .selected-mark') is not None
              and page.query_selector_all(".selected-mark").__len__() == 1)
        check("step 4 does not touch the neighbouring numbers",
              row(page, "b") == b and row(page, "c") == c and row(page, "a") == a)

        # Narrow viewport.
        page.set_viewport_size({"width": 360, "height": 780})
        page.wait_for_timeout(300)
        overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        check("no horizontal overflow at 360 px", overflow <= 1, f"overflow={overflow}px")
        page.screenshot(path=str(SHOTS / "shot-360-step4.png"), full_page=True)

        check("no page errors after the whole run", not errors, "; ".join(errors))
        browser.close()

    failed = [c for c in checks if not c[1]]
    print()
    print(f"{len(checks) - len(failed)}/{len(checks)} checks passed")
    if failed:
        print("VERDICT: NOT VERIFIED — the following did not hold:")
        for text, _, detail in failed:
            print(f"  - {text}  [{detail}]")
        return 1
    print("VERDICT: ALL CHECKS PASSED in a real layout engine (Chromium via Playwright)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
