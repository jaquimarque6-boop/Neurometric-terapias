---
name: AI report improvements
description: Preserve clinician-authored report text while proposing and saving AI additions.
---

AI improvement proposals for clinical evolution reports are additive: preserve professional-authored text exactly, add only new clinically supported content, and do not restore areas the professional removed. Show a before/after preview; cancel leaves the draft unchanged. Accepting changes only the draft; saving explicitly updates the selected saved evolution report rather than creating a duplicate. Keep the family-report flow separate.

**Why:** The user authorized this workflow to prevent AI from silently replacing clinical text and chose to update a saved report only when explicitly saving.

**How to apply:** Use when changing clinical-report AI generation or save behavior. Keep the existing access and AI-consent checks, and do not change unrelated report editing, printing, or family-report behavior.
