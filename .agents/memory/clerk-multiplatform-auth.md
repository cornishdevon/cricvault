---
name: Clerk auth across web/API/mobile
description: Durable lessons from adding Replit-managed Clerk auth + per-user data isolation to CricVault
---

- Legacy-data claim ("first user to sign in owns all pre-auth NULL rows") must be atomic: wrap in a DB transaction with `pg_advisory_xact_lock(<constant>)` and re-check ownership inside the transaction. An in-memory boolean alone is race-prone across concurrent requests/instances.
- **Why:** two concurrent first sign-ins could each see zero owned rows and both claim the dataset; last commit wins → wrong owner.
- Stale composite-build declarations: after editing `lib/db` schema, api-server typecheck still fails with "property does not exist" until `pnpm exec tsc -b lib/db --force` regenerates `lib/db/dist/*.d.ts`.
- Object *serving* stays public deliberately (mobile video players can't send auth headers); only upload-URL generation is auth-gated.
- Owner must sign in on the web app FIRST after auth ships, to claim their historical data before any other user signs up.
- Web `/` is a public landing page for signed-out users (Clerk `<Show when="signed-out">`); dashboard renders only when signed in. API 401s are the expected signed-out behavior.
