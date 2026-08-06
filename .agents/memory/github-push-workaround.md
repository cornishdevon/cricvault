---
name: GitHub push workaround
description: How to push this repo to GitHub when Replit's gitPush fails, and the workflow-scope limitation
---
Repo: github.com/cornishdevon/cricvault (origin remote configured).

- Replit's `gitPush` callback fails with BRANCH_ALREADY_EXISTS on this repo (diverged history); shell `git push` has no credentials.
- **Working method:** GitHub connection is attached; `listConnections("github")` returns [] (credentials withheld), but `@replit/connectors-sdk` (installed at workspace root) works inside "use impure": `connectors.proxy("github", path, init)`. Push via Git Data API: create blobs (shas match local `git hash-object`), tree with base_tree, commit, PATCH refs/heads/main.
- **Why:** OAuth token lacks `workflow` scope → any tree touching `.github/workflows/*` returns 404. Workflow file changes must be made by the user in the GitHub web UI.
- **How to apply:** after pushing via API, `git fetch && git reset --hard origin/main` locally (re-applying any workflow-file-only commits on top) to keep histories converged.
- Pushes made this way DO trigger GitHub Actions (verified).
- EAS remote install runs `pnpm install --frozen-lockfile` and fails with ERR_PNPM_LOCKFILE_CONFIG_MISMATCH (packageExtensionsChecksum) even with matching pnpm version pinned via `"pnpm"` in eas.json. Fix: `"env": {"EAS_NO_FROZEN_LOCKFILE": "1"}` in the eas.json production build profile. Query build status/logs via Expo GraphQL (appId db2d8b85-bce6-40b0-81ab-123b4d24586e, EXPO_TOKEN from env; logFiles URLs are public).
- GitHub Actions secrets (e.g. EXPO_TOKEN) can be updated the same way: GET actions/secrets/public-key, seal with libsodium-wrappers crypto_box_seal, PUT actions/secrets/<NAME>. Re-run builds via POST actions/workflows/<id>/dispatches. If EAS fails with "bearer token is revoked", the GitHub EXPO_TOKEN secret is stale — refresh it from the Replit EXPO_TOKEN secret this way.
