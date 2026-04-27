# SPEC.md — APIReplay

> Master spec (kernel of truth). Fill in as the project matures.

## Purpose

Provide deterministic network/API replay for frontend development and test workflows by capturing real request/response traffic once and replaying it reliably across local, shared, and CI contexts.

## In Scope

- Chrome MV3 extension behavior for record/replay/edit/import/export/search/toggle flows.
- Stable recording storage and schema migration compatibility.
- Playwright fixture-reuse workflow and local developer usage patterns documented in `README.md`.
- iSDLC governance artifacts for legacy onboarding and safe modernization.

## Out of Scope

- Re-architecting all modules (`src/background`, `src/popup`, `src/shared`) during onboarding.
- Introducing server-side capture/replay as a supported product capability.
- Big-bang replacement of extension internals before characterization safety net is in place.

## Contracts & Invariants

- Existing npm quality gates remain mandatory (`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`).
- Exported recording JSON is treated as a compatibility contract; breaking shape changes require migration + ADR.
- Replay fallback behavior and user-facing toggle ergonomics are preserve-required until explicitly changed by ADR.
- Legacy onboarding artifacts (`docs/adr`, `docs/legacy`, `.isdlc/onboarding.json`) must reflect actual reviewed state.
