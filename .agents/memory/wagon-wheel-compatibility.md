---
name: Wagon wheel coordinate compatibility
description: Preserve historical shot positions during visual and handedness changes.
---

Keep the existing normalized shot coordinate space when restyling or resizing the wheel. Mirror labels and sector geometry for batting hand, not recorded endpoints.

**Why:** Historical shots have no separate handedness or coordinate-version metadata. Transforming their endpoints during display changes would reinterpret saved match data.

**How to apply:** Add room for sixes through viewport padding, converting touch positions back into the original coordinate space. Keep hand-specific sector classification aligned with the displayed labels.

Treat mapped batting shots as potentially partial, not the authoritative innings total.

**Why:** A saved innings can contain 50 runs but only one mapped boundary. Recomputing runs/fours/sixes on a wheel edit or clear would silently overwrite valid match statistics.

**How to apply:** Keep wheel edits limited to shot data on both platforms. Manual batting totals remain independent.