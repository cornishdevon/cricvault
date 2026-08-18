---
name: Private media authorization decision
description: Why CricVault uses signed URL tokens plus upload-time ownership binding for private media
---

Decision: private object streaming is authorized by a short-lived HMAC query token, and tokens are only minted for object paths whose upload was recorded against the requesting user.

**Why:** `<img>`/`<video>` tags and native mobile players cannot attach Authorization headers, so path secrecy alone is broken access control. Token-minting alone is also bypassable — a user could submit someone else's object path as their own media row and receive a valid token — so ownership must be bound at upload-URL issuance and enforced on every media create.

**How to apply:** any new endpoint that accepts or returns private object paths must verify upload ownership before persisting, and append a signed token before returning paths to clients.
