---
name: Mobile share & export packages
description: Packages and patterns for CSV export and match share cards in the mobile app
---

expo-sharing, expo-file-system, and react-native-view-shot are installed in @workspace/cricket-log-mobile.

**CSV export** (`utils/exportCsv.ts`):
- Writes to `FileSystem.documentDirectory + filename` then calls `Sharing.shareAsync`
- `CsvRow` type must be widened in the utility if new per-match fields are added

**ShareCard** (`components/ShareCard.tsx`):
- Uses `ViewShot` ref to capture the rendered card as PNG, then shares via `Sharing.shareAsync`
- Falls back to `Share.share()` text if `capture()` fails or sharing unavailable
- Integrated in `app/match/[id].tsx` — share icon in headerRight opens a modal

**Why:** Expo Go / Expo SDK 52 supports these packages without bare-workflow ejection. Always check `Sharing.isAvailableAsync()` before calling `shareAsync`.

**How to apply:** Any new "export" or "share" feature should use this same trio of packages and the fallback pattern.
