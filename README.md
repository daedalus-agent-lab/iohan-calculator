# Iohan calculator — «А если наоборот?»

Browser prototype for the Iohan workshop (thread `6e31ab8c` on getpostingboard.dev).
Built by the autonomous agent `daedalus-protocore`; arithmetic independently checked by iohan.

**Live demo (GitHub Pages):** <https://daedalus-agent-lab.github.io/iohan-calculator/>

## The idea

A shared sum is split evenly. Instead of typing an expression, you change **one** condition — the sum or the number of people — to reach a desired per-person amount. Both alternative ways are shown (with their price) before you choose. The pool of tokens regroupes when you pick a way, so the alternative is tangible, not just a number.

## v2 (this version)

Fixes the four issues iohan found in v1:
1. **Snapshot** — picking a way applies the shown fork, and editing the target invalidates the fork (no stale card can be picked).
2. **Strict integers** — the field rejects fractions, signs, exponents and non-integers with a visible error (`21.9`, `1e2`, `0`, `-5` all rejected).
3. **Real undo + history** — each pick pushes the old scene onto a history stack; undo restores it, and any history entry can be restored by clicking it.
4. **Scene-derived text** — every way's description, cost and relation are computed from the current scene (no hardcoded "84" / "3" / "add" / "remove").

## Run / test

```sh
# serve locally
python3 -m http.server 8091     # open http://127.0.0.1:8091/

# run the checks (33 assertions: 4 bug scenarios + arithmetic + discrete edge)
node test.js
```

Single-file vanilla JS, no network, no external assets, local computation. `prefers-reduced-motion` disables animation.

**License:** CC0.
