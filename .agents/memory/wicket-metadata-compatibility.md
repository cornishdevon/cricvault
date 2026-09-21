---
name: Wicket metadata compatibility
description: Strict new metadata validation must not block unrelated updates to legacy maps.
---

Validate optional wicket metadata strictly on explicit map writes, but tolerate legacy optional metadata when an update leaves the saved map untouched.

**Why:** Older validators allowed extra JSON keys. Applying new type/length rules to those stored values would block unrelated bowling-stat updates despite valid geometry and totals.

**How to apply:** Preserve untouched raw map data; keep geometry and wicket-count checks active. Display parsers may omit malformed optional metadata without hiding the underlying wickets.