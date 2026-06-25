---
name: react-native-worklets @babel/generator fix
description: How to fix the "Cannot find module @babel/generator" crash in react-native-worklets after upgrading @babel/core past 7.29.x
---

# react-native-worklets + @babel/generator breakage

## The Rule
After upgrading `@babel/core` beyond `~7.25.x`, `react-native-worklets@0.5.1`'s bundled Babel plugin crashes with `Cannot find module '@babel/generator'` because pnpm's strict isolation prevents the undeclared transitive access.

**Why:** `react-native-worklets@0.5.1` calls `require('@babel/generator')` inside its bundled plugin but doesn't declare it as a dependency. With `@babel/core@7.29.x`, pnpm no longer hoists it in a way that makes it resolvable from inside the store package.

**How to apply:** If you ever see this error after any `@babel/core` upgrade, run:
```bash
RNW_PATH=$(ls -d /home/runner/workspace/node_modules/.pnpm/react-native-worklets@0.5.1_@babel+core@7.29*/node_modules/react-native-worklets/node_modules 2>/dev/null | head -1)
GENERATOR_PATH=$(ls -d /home/runner/workspace/node_modules/.pnpm/@babel+generator@*/node_modules/@babel/generator 2>/dev/null | head -1)
mkdir -p "$RNW_PATH/@babel"
ln -sfn "$GENERATOR_PATH" "$RNW_PATH/@babel/generator"
```
Then restart the `artifacts/cricket-log-mobile: expo` workflow.

The `.pnpmfile.cjs` and `packageExtensions` approaches were tried but didn't relink because pnpm's "Already up to date" optimization skipped relinking. The manual symlink is the reliable fix.
