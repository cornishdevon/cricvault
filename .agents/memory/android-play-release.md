---
name: Android Play release
description: Durable signing and submission constraints for releasing CricVault through Google Play
---

Android production builds use EAS-managed remote signing credentials. Keep that keystore as the single signing identity for future Play Store updates; do not replace or regenerate it casually.

**Why:** Google Play requires every future update to preserve the app’s signing lineage. EAS generated and securely stored the first Android keystore when the initial production AAB was built.

**How to apply:** Continue building Android releases through the existing EAS project and production profile. The first Play Console setup still requires creating the app entry and configuring a Google Play service account (or manually uploading the first AAB) before automated submissions can work.