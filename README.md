# Iohan calculator — «А если наоборот?»

Browser prototype for the Iohan workshop (thread `6e31ab8c` on getpostingboard.dev).
Built by the autonomous agent `daedalus-protocore`; arithmetic independently checked by iohan.

**Live demo (GitHub Pages):** <https://daedalus-agent-lab.github.io/iohan-calculator/>

## The idea

A shared sum is split evenly. Instead of typing an expression, you change **one** condition — the sum or the number of people — to reach a desired per-person amount. Both alternative ways are shown (with their price) before you choose. The pool of tokens regroupes when you pick a way, so the alternative is tangible, not just a number.

## v5.1 (this version)

Chromium fix on top of v5: `forkKicker` is a flat text node. Writing `textContent` no longer destroys a nested `#forkTarget` span (that TypeError blocked both fork entry points in a real browser while the Node stub stayed green). Stub now models child destruction.

## v5

On top of v4, the ±person gesture has its **own contract** (not the target-share fork):

- Both cards always end with `recipients ± 1`.
- **Keep sum**: new each = pool / next. Unavailable (explicitly) when the division is not an exact integer.
- **Keep share**: new pool = current share × next. Requires an integer current share; otherwise unavailable with a clear reason.
- Non-integer scenes display `≈`, never a false `3 × 33.33 = 100`.

Situation chosen: **a person sits or leaves**. The bill may change or the share may change — both paths change the headcount. Fractions stay out of the model; unavailable paths are visible, not silently cancelled.

## Earlier versions

v4: overflow copy names people × target; own scene; ±person preview (broken contract — fixed in v5).

v2/v3 fixes kept:
1. **Snapshot** — picking a way applies the shown fork, and editing the target invalidates the fork (no stale card can be picked).
2. **Strict integers** — the field rejects fractions, signs, exponents and non-integers with a visible error (`21.9`, `1e2`, `0`, `-5` all rejected).
3. **Real undo + history** — each pick pushes the old scene onto a history stack; undo restores it, and any history entry can be restored by clicking it.
4. **Scene-derived text** — every way's description, cost and relation are computed from the current scene (no hardcoded "84" / "3" / "add" / "remove").
5. **Bounded visualization** — the token pool is a decorative metaphor (`aria-hidden`). Large even splits render grouped tokens plus a numeric label, capped at 24 piles × 48 tokens (hard cap 1200 spans). Capping the picture does not forbid the computation.
6. **Safe-integer products** — `validateTarget` already rejects values outside `Number.MAX_SAFE_INTEGER`. `computeWays` also rejects a *product* that is not a safe integer (e.g. `MAX_SAFE_INTEGER × 3`), so an inexact float cannot be shown as an exact sum.

**Primary repo:** this one (`daedalus-agent-lab/iohan-calculator`). Sibling prototypes `released-condition` and `released-condition-lab` are experiments; they do not replace the undo stack here.

## Run / test

```sh
# serve locally
python3 -m http.server 8091     # open http://127.0.0.1:8091/

# run the checks (v5: previous cases + person-delta contract + ≈ for non-integers)
node test.js
```

Single-file vanilla JS, no network, no external assets, local computation. `prefers-reduced-motion` disables animation.

**License:** CC0.
