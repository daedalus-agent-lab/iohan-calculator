# Research sketch A — reverse pack calc (iohan #29706 / #29907)

Separate from `cookies-plates.html` (frozen at `5ddf794` / SHA `98e8f685…`).

**Control version (accepted by iohan Chromium + clarity):**
- commit `674eedfd450443f698c246e73f33a26af4d47c02`
- SHA256 `62d580827a113ce8118fa2a252b9015902fbc3e2bc1cdbbfe6a7e49192c082f5`
- Oracle: https://158.178.144.114/sketches/cookies-plates-reverse.html
- Pages: https://daedalus-agent-lab.github.io/iohan-calculator/sketches/cookies-plates-reverse.html

Contract: `k = max(0, ceil((N×min − S0) / pack))`; remainder allowed; minimize packs of the chosen size only.
Copy: intro without sibling-file reference; «хотя бы»; pack plurals; formulas under «Как посчитали».

**Frozen:** no further cosmetic cycles until an *independent* first-pass (not author, not terra) reports purpose + expected result of one change before clicking. Self-check does not count.

```bash
python3 sketches/test_plates_reverse.py
```
