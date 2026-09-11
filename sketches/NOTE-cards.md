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

The minimum is a floor, not a target: when it is exceeded the card says so in words. No claim about
the cheapest purchase or an optimum among pack sizes appears anywhere on the page.

## v2 — the two objections from the first review (2026-09-11)

**1. The page never said what was being bought.** It counted "шт." and talked about "условия" and
"запас". Now every string is about cookies: the eyebrow is «Печенье к чаю», the cards carry
«Печенья уже дома», «Ждёте гостей», «Не меньше печений на гостя», «Печений в пачке», «Купить 2
пачки печенья», «Всего печенья», «Каждому гостю». The lede states the situation in one breath —
guests for tea, twelve cookies at home, at least six each, a pack of eight — and says why the
buttons exist. Automated checks assert that the *rendered* text contains «печен» and the words
гости / чай / пачка, so the fix cannot silently disappear.

**2. After choosing a plan, keyboard focus fell back to `<body>`.** `render()` replaces the whole
list, which destroyed the focused button; the browser then moved focus to the document body — with a
screen reader that means losing your place. `render()` now takes a focus request:

* choosing a plan → focus returns to **that plan's own button** (which has just become «Этот план
  выбран»), so the label change is what is announced;
* asking a what-if question → focus moves to the **card that was just added**, so the next thing read
  is the new plan rather than nothing.

Each card is `tabindex="-1"` and outlines on `:focus-visible`, so the moved focus is visible for
keyboard users and stays invisible for mouse users.

## v2, second pass — three findings from an independent review

The review of the first v2 draft raised three things, all fixed here, all now covered by a check that
fails without the fix:

1. **A disabled button lied about the state.** After the third plan was added, the spent question
   button on the first card still read «Второй план уже на столе … Сравнивайте оба рядом» — with
   three cards on the page, and stacked in one column on a phone. The spent buttons now read
   «Новый план уже добавлен · Сравните все планы на странице», which is true in every state, and the
   page contains no word claiming that the cards sit beside each other.
2. **The lede had a dangling subject.** «…и каждому хочется положить на тарелку не меньше шести» —
   no clear agent, and the noun dropped exactly where the page had just started naming the cookies.
   Now: «…и вы хотите положить каждому на тарелку не меньше шести печений».
3. **Two announcement channels competed.** The list was `aria-live="polite"` *and* focus was moved
   after every rebuild, so an assistive technology could read the whole refreshed list on top of the
   focused card. The live attribute is gone: focus is the single channel, and a check asserts the
   replaced container is not a live region.

Also from the same review: «Если пачка окажется меньше?» was ambiguous about what is smaller, so the
question now reads «А если в пачке меньше печенья?»; «Янтарные вопросы» named a colour rather than an
action and described buttons that are grey once they are spent — now «Кнопки с вопросами»; the first
plan's title is «Расчёт на 3 гостей».

## How it was checked

```sh
node sketches/verify-cards.js          # the page's own script in a JS VM: arithmetic and state
python3 sketches/browser_check.py      # real Chromium via Playwright: DOM + keyboard focus
```

`browser_check.py` opens the page in Chromium, asserts the four contract rows off the *rendered*
page, checks the two text properties above, clicks both questions and the selection through real
hit-testing, drives one question and one selection with the keyboard, reads `document.activeElement`
after each of the four interactions, and checks that neighbouring cards do not move and that there is
no horizontal overflow at 360 px.

Result: **21/21** in a real layout engine. The page's own `?verify=1` self-check passes 10/10 in the
same engine, focus included.

**The checks were shown to fail on the previous build.** The same script, pointed at the file at
commit `5436191` (`CARDS_PAGE=… CARDS_SHOTS=…`), returns **13/21** and `VERDICT: NOT VERIFIED`: the
four focus checks reading `{"tag": "BODY", "plan": null}`, both copy checks failing, and the two new
text/structure checks failing — the exact symptoms the reviewer reported, reproduced by running the
check rather than by reading the code. A check that cannot fail proves nothing.

Chromium in this container needs `TMPDIR`, `HOME`, `XDG_CONFIG_HOME` and `XDG_CACHE_HOME` pointed
inside a writable directory; without that it dies at startup with
`chrome_crashpad_handler: --database is required` before the page ever loads.

What is **not** checked: screen-reader behaviour (no screen reader was run — with the live-region
conflict removed the DOM focus is unambiguous, which is not the same as knowing what a reader says),
colour contrast measured with a tool rather than read off the CSS, and human readability (one
independent reviewer has read the copy; no person has used the page).
