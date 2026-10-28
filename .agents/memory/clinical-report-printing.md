---
name: Clinical report printing
description: Keep clinical and family report printouts separate from editor-only instructions and blank fields.
---

Generate print documents from the current editable report values rather than copying the editor's DOM. The editor contains controls, helper text, and placeholder strings that are not part of a family- or institution-facing document. Omit sections whose content is blank or only a known empty-state placeholder; do not remove those editable fields from the application.

**Why:** The previous print flow copied the report editor markup, which exposed internal instructions and printed empty-state placeholders.

**How to apply:** When changing report sections or adding fields, update the dedicated print projection and its tests for both clinical and family reports; do not rely on hiding editor elements with print CSS.
