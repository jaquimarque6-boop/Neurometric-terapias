---
name: PWA update consent
description: Why PWA activation must not force reloads in other open clinical forms.
---

Require independent update/reload consent in each tab. Do not replace the explicit registration with the generic virtual PWA registration helper without checking its controller-change behavior.

**Why:** Inspection of the installed helper showed that its controlling listener could reload other open tabs when one tab activates an update. That can lose unsaved clinical form input, even when the initiating tab confirmed.

**How to apply:** When changing PWA registration or upgrading its libraries, verify two open tabs: acceptance in one must not reload the other. Offline retry must likewise remain non-destructive; no clinical offline persistence is authorized.