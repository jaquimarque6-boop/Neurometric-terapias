---
name: TSX component tests
description: JSX runtime differences between the Vite frontend and Node-based TSX tests.
---

Node-based `tsx` server-render tests may compile a frontend TSX component using the classic React JSX runtime even when Vite handles the app's preserved JSX. A component without a React runtime import can then fail with `React is not defined` in the test while still working in the browser.

**Why:** The test runner and Vite use different transform pipelines.

**How to apply:** When rendering frontend components through Node/tsx, configure the JSX runtime explicitly or import the React namespace. Treat this as a test-runner transform issue unless the browser build also fails.
