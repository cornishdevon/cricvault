---
name: expo-router NativeTabs breaks RN Modal on iOS
description: React Native's built-in <Modal> silently fails to appear on screens that live under expo-router's unstable-native-tabs (native iOS tab bar).
---

When a screen is rendered under expo-router's `unstable-native-tabs` `NativeTabs` (native UIKit tab bar on iOS), React Native's built-in `<Modal>` component can silently fail to present — taps that set state to open the modal appear to do nothing, with no error in logs. This reproduced on Expo SDK 54 via Expo Go.

**Why:** `NativeTabs` manages its own native view controller hierarchy; RN's `Modal` presents via a separate native modal/window mechanism that doesn't reliably composite above it in this experimental API. Browser (web) testing does not catch this — the bug is iOS-native-only.

**How to apply:** If a popup/detail overlay isn't appearing on a screen nested in `NativeTabs`, don't debug it as a state/press-handler bug first — replace `<Modal>` with a plain in-JS overlay (`<View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">` covering the screen) instead of the native `Modal` component. Same visual result, avoids the native presentation layer entirely.
