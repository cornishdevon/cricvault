---
name: Deployment build fixes for stable-25_05
description: Two root package.json changes required for Replit deployment builds to succeed in the stable-25_05 / nodejs-24 environment.
---

# Deployment Build Fixes

## Fix 1: Remove `packageManager` field

Remove `"packageManager": "pnpm@9.15.4"` from root `package.json`.

**Why:** Replit's build infrastructure reads this field and runs `pnpm add pnpm@9.15.4 --allow-build=@pnpm/exe` to install that exact version. The `@pnpm/exe` standalone binary crashes with SIGABRT (`pthread_create: Resource temporarily unavailable`) on both dev workflows and deployment containers in the `stable-25_05` Nix environment. Without the field, Replit uses the pnpm already provided by Nix (v10.x), which works fine.

**How to apply:** If the field reappears (e.g. after a pnpm upgrade prompt), remove it again.

## Fix 2: Exclude mobile from build script

Root `package.json` build script must filter out the mobile artifact:

```json
"build": "pnpm run typecheck && pnpm -r --if-present --filter \"!@workspace/cricket-log-mobile\" run build"
```

**Why:** The mobile build script (`artifacts/cricket-log-mobile/scripts/build.js`) starts Metro and calls Expo's API, which requires a valid `EXPO_TOKEN`. The deployment container does not have this token, so the mobile build fails with `ApiV2Error: The bearer token is invalid`. The mobile app is distributed via the App Store, not via Replit deployment, so it does not need to build here.

## Deployed URL

`https://cricvault.replit.app/cricket-stats` (support: `/support`, privacy: `/privacy`)
