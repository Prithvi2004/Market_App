---
description: Code architecture guidelines for FastAPI backend and React Native frontend.
globs: ["backend/*.py", "backend/**/*.py", "mobile/*.tsx", "mobile/**/*.tsx", "mobile/*.ts", "mobile/**/*.ts"]
alwaysApply: false
---

# Code Architecture & Code Quality Guidelines

## 1. FastAPI Backend Standards
- Maintain type hints across all router parameters, request schemas, and response models using Pydantic.
- Store environment variables in `config.py` using `pydantic-settings`.
- Implement graceful failover for external service dependencies (Ollama -> OpenRouter, Redis -> In-Process Memory Cache).

## 2. React Native & Expo Frontend Standards
- Maintain strict TypeScript type definitions for all API responses in `types/`.
- Use `apiFetch` from `src/api/client.ts` for all HTTP requests to enforce central logging and 503-retry handling.
- Ensure all text and price displays adapt gracefully to screen widths (`adjustsFontSizeToFit`, 1-line truncation where appropriate).
