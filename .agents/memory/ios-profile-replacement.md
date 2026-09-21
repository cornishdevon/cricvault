---
name: iOS provisioning profile replacement
description: Avoid assuming the Expo credentials website supports profile upload.
---

Do not guide users to an assumed Edit or Upload button on Expo's credentials website. Confirm the available controls first; a Delete configuration control is not a profile-replacement action.

**Why:** Guiding a user through Apple profile generation and then assuming Expo had a web upload control led to a dead end. Expo's signing documentation describes credential management through its tooling.

**How to apply:** Verify the supported replacement path before asking a user to change signing assets. Preserve the distribution certificate when only a capability-bearing provisioning profile needs replacement.

Deleting a provisioning profile at Apple does not clear Expo's saved copy; a non-interactive build may still attempt to use it.

**Why:** The GitHub build reused a profile without the Apple sign-in entitlement. An Apple-authenticated credentials check detected the deleted profile and successfully saved a replacement while preserving the existing certificate.

**How to apply:** Confirm that Expo has a newly saved profile before retrying CI. A capability change on Apple's website or a locally downloaded replacement alone is not evidence that remote build credentials changed.