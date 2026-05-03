---
sessionId: session-260426-172502-15gm
isActive: false
---

# Requirements

### Overview & Goals
Migrate `/Users/tsemachhadad/dev/APIReplay` from a standard Vite/TypeScript extension repo into an **iSDLC-managed legacy project** using the iSDLC CLI, so future work is driven by iSDLC artifacts, gates, and workflow.

### In Scope
- Initialize iSDLC substrate and legacy onboarding workflow for this existing repo.
- Produce required baseline artifacts for legacy onboarding (disposition, discovery outputs, retro docs, security baseline, safety-net plan).
- Align current developer workflow (`npm run lint/typecheck/test/build`, release docs) with iSDLC doctor + plan/ADR/debt/state loop.
- Set up agent tooling compatibility (Junie/CLI flow) for this repository.

### Out of Scope
- Full feature refactor of the extension code under `src/`.
- Re-architecture of background/popup/shared modules during onboarding.
- Immediate completion of all modernization steps (Strangler replacement is post-onboarding).

### Functional Requirements
- The repo must contain the iSDLC methodology substrate and generated rule files.
- The project must be entered through the **legacy path** (not greenfield assumptions).
- The onboarding progression must be explicitly tracked and human-confirmed step-by-step.
- Existing quality checks documented in `README.md`/`CONTRIBUTING.md` must remain usable during migration.
- The project should reach a state where an agent can reliably use iSDLC context (stage, plan, quirks, ADR/debt/state records).

# Technical Design

### Current Implementation
- `APIReplay` is a TypeScript + Vite Chrome extension (`package.json` scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`).
- Product and architecture are documented in `README.md` (modules in `src/background`, `src/popup`, `src/shared`).
- Contribution and release checks are currently repo-native (`CONTRIBUTING.md`, changelog/release process), with no iSDLC substrate present.
- There is currently no `.isdlc/`, no `AGENTS.md`, no `STATE.md`, no iSDLC ADR/debt/plan structure.

### Key Decisions
- Use **legacy onboarding** (`isdlc onboard`) rather than `isdlc init` as the primary migration path, because this is an existing non-iSDLC repo.
- Keep existing npm-based quality gates as operational checks while progressively adding iSDLC governance (`isdlc doctor`, plans, ADRs, tech debt, state sync).
- Treat migration as **context re-hydration first**, code transformation later, following `LEGACY_ONBOARDING.md` steps 0→7.

### Proposed Changes
1. **Bootstrap iSDLC substrate for this repo**
   - Install/execute CLI (`npx @isdlc/cli ...`) and initialize required iSDLC files for the project context.
   - Ensure generated governance and agent files are present and committed (e.g., `AGENTS.md`, `PROCESS.md`, `SPEC.md`, `STATE.md`, `TECH_DEBT.md`, `.isdlc/`, `docs/adr/`).

2. **Run legacy onboarding workflow against APIReplay**
   - Start walker with `isdlc onboard /Users/tsemachhadad/dev/APIReplay` and progress one step at a time with confirmations.
   - Produce Step 0–2 outputs:
     - Disposition ADR (retain/refactor decision).
     - Discovery artifacts (including quirks capture for extension behavior).
     - Retro SPEC/ADRs/roadmap + initial TECH_DEBT baseline.
     - Security/supply-chain baseline (SBOM, vulnerability/license/EOL findings).

3. **Define safety and migration boundaries before internals change**
   - Establish characterization/contract test strategy around current extension behavior (record/replay/filter/import-export flows from `README.md` capabilities).
   - Define seams for future refactor across existing modules (`src/background`, `src/popup`, `src/shared`) without big-bang rewrite.

4. **Adopt iSDLC operating loop for daily development**
   - Use `isdlc plan new`, `isdlc adr new`, `isdlc debt add`, `isdlc state sync`, and `isdlc doctor` as required lifecycle steps.
   - Add/align agent integration (Junie MCP config via `.junie/mcp.json` when desired) to consume stage/plan/quirks directly.

### File Structure Impact (planned)
- **New iSDLC governance files at repo root**: `AGENTS.md`, `PROCESS.md`, `PRACTICES.md`, `GOVERNANCE.md`, `AI_PRACTICES.md`, `SPEC.md`, `STATE.md`, `ROADMAP.md`, `PROJECT.md`, `TECH_DEBT.md`, `llms.txt`.
- **New/updated directories**: `.isdlc/`, `.isdlc/plans/`, `docs/adr/`, and legacy outputs under `docs/legacy/`.
- **Likely updates**: `README.md` and `CONTRIBUTING.md` to reflect iSDLC workflow alongside existing npm scripts.

### Risks & Mitigations
- **Risk:** Teams bypass onboarding steps and jump to refactors.  
  **Mitigation:** Enforce step confirmations and keep onboarding state in `.isdlc/onboarding.json`.
- **Risk:** Existing delivery slows due to process overhead.  
  **Mitigation:** Start with minimum required artifacts, preserve current npm checks, add iSDLC loop incrementally.
- **Risk:** Hidden behavioral quirks in extension flows break during later modernization.  
  **Mitigation:** Explicit `QUIRKS.md` capture + characterization tests before Step 5 changes.

# Testing

### Validation Approach
- Validate migration success via iSDLC CLI gates and existing project checks.
- Confirm both governance readiness (iSDLC substrate/doctor) and product safety (current lint/typecheck/test/build).

### Key Scenarios
- `isdlc doctor` returns healthy status for substrate completeness.
- `isdlc onboard --status` shows persisted, human-confirmed progression.
- Plan/ADR/debt/state commands create/update expected artifacts.
- Existing commands (`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`) remain green during migration.

### Edge Cases
- Running onboarding before substrate exists.
- Partial onboarding interrupted between sessions (resume via `.isdlc/onboarding.json`).
- Missing required files for debt/state operations (ensure migration scaffolding resolves these).
- Legacy quirks discovered late: must be added to quirks/spec/debt before refactor steps.

# Delivery Steps

### ✓ Step 1: Initialize iSDLC substrate in APIReplay and establish legacy entry door
APIReplay contains the required iSDLC baseline files and is recognized as an onboarded legacy target.
- Install/use `@isdlc/cli` from the APIReplay context.
- Scaffold the iSDLC substrate expected for agent-ready operation (root docs, `.isdlc/`, ADR seed, rule files).
- Run `isdlc doctor` to identify baseline gaps and fix substrate-level issues.
- Start legacy onboarding with `isdlc onboard /Users/tsemachhadad/dev/APIReplay` and persist initial onboarding state.

### ✓ Step 2: Execute onboarding Steps 0–2 to rehydrate context and governance
APIReplay has disposition, reconstructed intent docs, and security/quality baseline artifacts needed before modernization.
- Complete Step 0 decision and record disposition ADR in `docs/adr/`.
- Perform discovery (Step 1), including extension-specific quirks and behavioral dependencies.
- Complete Step 2 outputs: retro `SPEC.md`/ADRs/roadmap consistency and initial `TECH_DEBT.md` baseline.
- Generate and record security/supply-chain/compliance baseline findings for dependencies/runtime.

### ✓ Step 3: Establish safety net and migration seams for extension modules
The project has a verifiable safety strategy and defined boundaries for incremental refactor.
- Map critical flows from current capabilities (record, replay, edit, import/export, search, toggles) to characterization test coverage.
- Define contract/seam boundaries across `src/background`, `src/popup`, and `src/shared` for Strangler-style modernization.
- Confirm onboarding progress/approvals so refactor-enabling steps are unlocked only after safety criteria are met.
- Capture deferred risks and shortcuts in `TECH_DEBT.md` items with tracking references.

### ✓ Step 4: Adopt steady-state iSDLC workflow for daily delivery
Day-to-day development in APIReplay follows iSDLC plan→build→review→record→state→doctor loop while preserving existing CI checks.
- Update contributor workflow docs to include `isdlc plan/adr/debt/state/doctor` alongside npm scripts.
- Enable agent tooling path (Junie MCP config and iSDLC tool usage) for contextual execution.
- Define merge readiness criteria that include both iSDLC doctor and existing lint/typecheck/test/build checks.
- Ensure future changes are tracked through plans, ADRs, debt log, and state sync confirmations.