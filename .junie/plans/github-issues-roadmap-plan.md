---
sessionId: session-260426-151958-1u9u
isActive: false
---

# Requirements

### Overview & Goals
Prepare and publish **v1.0.1** from the current `main` baseline, ensuring version metadata, release notes, and packaged extension artifacts reflect the latest implemented popup and replay changes.

### Scope
#### In Scope
- Release-only updates required for `1.0.1`.
- Align version identifiers across release-facing files.
- Update changelog with user-visible additions/fixes since `1.0.0`.
- Build and package the extension from latest `main` state.

#### Out of Scope
- New feature development beyond already merged `main` changes.
- Architecture or schema redesign for future roadmap issues.

### Functional Requirements
- Extension version is updated from `1.0.0` to `1.0.1` consistently.
- Changelog contains a new `1.0.1` section summarizing latest shipped behavior.
- Release artifact (`dist.zip`) is regenerated from the updated code/version.
- Release validation confirms the packaged extension loads and popup workflows remain operational.

# Technical Design

### Current Implementation (reviewed)
- Release version is declared in:
  - `package.json` (`version`)
  - `src/manifest.json` (`version` for Chrome extension)
- User-facing release notes live in:
  - `CHANGELOG.md` (currently has `1.0.0` entry only)
- Build/package workflow is already defined in scripts:
  - `npm run build`
  - `npm run package` (build + create `dist.zip`)
- Core runtime behavior that must remain stable in this release includes popup/background flow:
  - `src/popup/main.ts`, `src/popup.html`, `src/styles.css`
  - `src/background/index.ts` replay interception path

### Key Decisions
1. **Patch release strategy (`1.0.1`) without functional scope expansion** (recommended)
   - Rationale: user asked to release latest `main`; this is a stabilization + packaging release.
2. **Single-source version consistency check before packaging**
   - Rationale: prevent mismatched `package.json` vs `manifest.json` values.
3. **Document only already-merged changes in changelog**
   - Rationale: keep release notes accurate and auditable.

### Proposed Changes
- **Version alignment**
  - Update `package.json` to `1.0.1`.
  - Update `src/manifest.json` to `1.0.1`.
  - Ensure `package-lock.json` root version reflects the same release when lockfile is updated.
- **Release notes**
  - Add `## [1.0.1] - YYYY-MM-DD` section in `CHANGELOG.md`.
  - Summarize latest shipped updates from `main` (tab usability refinements, in-progress request preview visibility, replay/popup stability improvements as applicable to merged code).
- **Packaging**
  - Generate fresh production bundle via `npm run package` to recreate `dist/` and `dist.zip` for v1.0.1.

### Risks
- **Risk:** version mismatch between extension manifest and npm metadata.
  - **Mitigation:** explicit pre-package version cross-check in both files.
- **Risk:** changelog may omit/overstate merged changes.
  - **Mitigation:** derive notes strictly from current `main` diff since `1.0.0`.

# Testing

### Validation Approach
Validate release readiness through build/package checks and targeted smoke verification of key extension flows.

### Key Scenarios
- `npm run build` succeeds with no compile errors.
- `npm run package` generates updated `dist.zip`.
- Installed packaged extension reports `1.0.1` in Chrome extension details.
- Popup opens and core actions (record/replay/select/preview) still work on smoke test.

### Regression Focus
- No runtime regression in `replayingListener` interception behavior.
- No regression in popup tab rendering and request preview containers.
- Artifact integrity and version labeling are consistent across all release outputs.

# Delivery Steps

### ✓ Step 1: Align v1.0.1 version metadata across release files
Release metadata is consistently set to `1.0.1`.
- Update `package.json` version.
- Update `src/manifest.json` extension version.
- Reconcile lockfile root version entry if regenerated.
- Verify no remaining `1.0.0` release-version references in version-controlled metadata.

### ✓ Step 2: Draft and apply v1.0.1 changelog entry from latest main changes
`CHANGELOG.md` contains a precise `1.0.1` section describing shipped updates.
- Add a dated `1.0.1` heading above `1.0.0`.
- Summarize user-facing changes already merged into `main`.
- Keep wording concise and release-oriented (features/fixes/stability).

### ✓ Step 3: Build, package, and smoke-validate the 1.0.1 release artifact
A distributable v1.0.1 extension package is generated and sanity-checked.
- Run `npm run package` to rebuild `dist/` and regenerate `dist.zip`.
- Confirm packaged manifest reports `1.0.1`.
- Perform smoke checks for popup open, recording/replay controls, and request preview rendering.