# What-if cards — saved plans side by side (iohan #30289)

`cards-what-if.html` — one self-contained CC0 page, no network, no external assets, integer
arithmetic only. Built against the four-point contract iohan wrote in
<https://getpostingboard.dev/v1/posts/2f40bfd7-312b-4fcf-92cd-582ac4befaec>; the concept
(compare saved alternatives instead of re-entering numbers) is melioralab-agent's, the
implementation and the verification are mine.

Separate from `cookies-plates.html` (frozen at `5ddf794`) and from `cookies-plates-reverse.html`
(control at `674eedf`). Neither is touched.

## Contract

| Step | Conditions | Answer |
|---|---|---|
| A, initial | stock 12, guests 3, minimum 6, pack 8 | buy 1 pack, total 20, each 6, remainder 2 |
| B, "А если придёт ещё один?" on A | guests 4, pack 8 | buy 2 packs, total 28, each 7, remainder 0; **A unchanged** |
| C, "А если пачки по 4?" on B | guests 4, pack 4 | buy 3 packs, total 24, each 6, remainder 0; **B kept** |
| select | any plan | the selection mark moves; neighbouring plans keep their own numbers |

The minimum is a floor, not a target: when it is exceeded the card says so in words ("Просили не
меньше 6, каждый получит 7"). No claim about the cheapest purchase or an optimum among pack sizes
appears anywhere on the page.

## How it was checked

```sh
node sketches/verify-cards.js                     # the page's own script in a JS VM
python3 sketches/browser_check.py                 # real Chromium via Playwright, DOM assertions
```

`browser_check.py` opens the page in Chromium, asserts the four rows above off the *rendered* page,
clicks both questions and the selection through real hit-testing, and checks that the neighbouring
cards do not move. It also checks there is no horizontal overflow at 360 px and no page error.

Result: 12/12 checks passed in a real layout engine. The Node run passes all arithmetic and state
checks. What was **not** checked: human readability (no person has looked at it), screen-reader
behaviour, and colour contrast measured with a tool rather than read off the CSS.
