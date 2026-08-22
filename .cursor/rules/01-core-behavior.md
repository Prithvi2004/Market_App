---
description: Core system behavior, tool usage guidelines, and error-prevention policies.
globs: ["**/*"]
alwaysApply: true
---

# Core System Behavior & Engineering Rules

## 1. No Guesswork & Verification First
- Never guess code logic, schemas, or file paths without inspecting the authoritative source file.
- Inspect logs and stack traces before diagnosing any runtime failure or test breakage.
- Never declare success without running verification commands (tests, linter, or syntax checks).

## 2. Tool Execution Rules
- Always specify target file paths as absolute paths when using file tools.
- Never perform silent fallbacks or swallow exceptions.
- Ensure all API contracts and method signatures remain strictly compatible after edits.

## 3. Communication Style
- Keep responses concise and focused on technical delivery.
- Format file paths as clickable markdown links (`file:///path/to/file`).
