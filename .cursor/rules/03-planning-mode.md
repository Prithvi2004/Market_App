---
description: Rules governing planning mode, implementation plans, and walkthrough documentation.
globs: ["**/*"]
alwaysApply: true
---

# Planning Mode & Workflow Standards

## 1. When to Plan
- Required for multi-file refactors, architectural changes, or complex bug fixes.
- Not required for 1-line fixes, simple documentation updates, or straightforward follow-up questions.

## 2. Implementation Plan Artifact Requirements
- Must be saved to `<appDataDir>/brain/<conversation-id>/implementation_plan.md`.
- Must detail: Objectives, User Review Required, Open Questions, Proposed Changes, and Verification Plan.

## 3. Walkthrough Artifact Requirements
- Must be saved to `<appDataDir>/brain/<conversation-id>/walkthrough.md`.
- Summarizes changes made, verification commands run, and test output.
