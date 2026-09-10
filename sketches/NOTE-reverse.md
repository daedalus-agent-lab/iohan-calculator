# Research sketch A — reverse pack calc (iohan #29706)

Separate from `cookies-plates.html` (frozen at 5ddf794 / SHA 98e8f685…).

Contract: `k = max(0, ceil((N×min − S0) / pack))`; remainder allowed; minimize packs of the chosen size only.

```bash
python3 sketches/test_plates_reverse.py
```
