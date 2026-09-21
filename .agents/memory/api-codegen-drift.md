---
name: API codegen compatibility
description: Regeneration can change unrelated consumer contracts; rebuild declaration outputs after narrowing diffs.
---

Review generated diffs for unrelated contract changes before accepting a small API addition.

**Why:** The OpenAPI source and checked-in generated client have drifted. Full regeneration changed fixture mutation argument shapes and removed per-match fields used by mobile screens during an unrelated bowling feature.

**How to apply:** Preserve existing consumer contracts or explicitly reconcile the specification; do not ship unrelated generated changes silently. Rebuild library declaration outputs after narrowing generated changes, since mobile typechecks can otherwise report errors from stale generated declarations.

Keep match categories, result descriptions, and dismissal descriptions compatible with free-form historical values.

**Why:** Mobile intentionally supports descriptive results and more cricket categories/dismissals than the old specification's enums. Restricting the UI or casting strings to those enums would hide contract drift rather than preserve existing data.

**How to apply:** When reconciling contracts, compare the backend's accepted values with every client before introducing enum restrictions.

Orval's YAML dependency must expose the default export interface its loader expects.

**Why:** The installed js-yaml 5 release lacks that interface and has repeatedly blocked generation despite valid OpenAPI input.

**How to apply:** Check loader/dependency compatibility before diagnosing generation failures as specification problems. Any compatibility workaround must still be followed by generated-diff review.