---
name: Audit privacy
description: Privacy and failure-handling constraints for Neurometric usage auditing.
---

# Rule

The usage audit may store only the professional account, event type, and timestamp. It must not include patient names or identifiers, clinical content, prompts, AI responses, navigation, clicks, or minor actions. Record only successful logins, saves, and AI use. Audit recording and reads must fail open so metrics never block core app operations.

**Why:** The user explicitly limited the audit to minimal usage metrics and prohibited collecting patient or clinical content.

**How to apply:** Keep new event categories content-free, emit them only after the corresponding operation succeeds, and degrade audit summaries to an explicit unavailable state if metrics cannot be read.

## Approved retention policy

The user approved keeping detailed events for 90 days, then retaining only the latest event per account and event type. This approval is for the retention policy only; it does not authorize production migration, push, or deploy.

**Why:** This preserves exact rolling 30-day counts while keeping the latest login and historical activity state.

**How to apply:** Implement and test retention only in development until separately authorized; do not run cleanup against production without explicit approval.