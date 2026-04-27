# QUIRKS.md — Bug-as-Feature Register

> Undocumented behaviors that *look* like bugs but are contractually relied upon.
> Captured in Legacy Onboarding Step 1, pinned by characterization tests in Step 3, and protected by a DO-NOT rule so agents don't silently "fix" them.
>
> **Rule:** no entry in this file may be removed or modified except by an explicit ADR.

## Entries

### QUIRK-0003: Replay fallback matching can intentionally serve near-match responses

- **Trigger:** Exact request key does not match, but replay fallback matching is enabled.
- **Observed behavior:** Replay may serve a response from a "closest" captured request instead of failing hard.
- **Expected-by-spec behavior (if known):** Deterministic replay is preferred, but controlled fallback is an accepted compatibility mode.
- **Who relies on it:** Developers unblocking local work when request shape drifts slightly between environments.
- **Must preserve?** Yes
- **Evidence source:** `README.md` core capabilities mention optional fallback matching.
- **Characterization test:** `tests/unit/background/replay-fallback.spec.ts` (to be added in Step 3 safety-net work)
- **DO-NOT rule for agents:** Do not remove fallback mode or change default fallback semantics without ADR and migration notes.
- **Date logged:** 2026-04-27
- **Logged by:** Junie + human review pending

---

### QUIRK-0002: Toggle shortcut is part of operational workflow

- **Trigger:** User presses `Alt+Shift+R` while extension is active.
- **Observed behavior:** Recording toggle is expected to react immediately from keyboard shortcut.
- **Expected-by-spec behavior (if known):** Shortcut remains stable to support low-friction record/replay workflow.
- **Who relies on it:** Power users who switch recording state frequently during iterative debugging.
- **Must preserve?** Yes
- **Evidence source:** `README.md` quick start explicitly documents this shortcut.
- **Characterization test:** `tests/e2e/keyboard-toggle-recording.spec.ts` (to be added/refined in Step 3)
- **DO-NOT rule for agents:** Do not repurpose or remove shortcut binding without ADR and UX migration guidance.
- **Date logged:** 2026-04-27
- **Logged by:** Junie + human review pending

---

### QUIRK-0001: Exported recording JSON is a cross-tool compatibility contract

- **Trigger:** Recordings are exported and later imported or reused in Playwright flows.
- **Observed behavior:** Teams treat exported JSON shape as stable fixture contract across environments and test pipelines.
- **Expected-by-spec behavior (if known):** Backward-compatible import/export format with migration support.
- **Who relies on it:** QA/automation and frontend developers sharing fixtures across local/dev/CI.
- **Must preserve?** Yes
- **Evidence source:** `README.md` common workflows and storage model notes.
- **Characterization test:** `tests/unit/popup/import-export-contract.spec.ts` (to be added in Step 3)
- **DO-NOT rule for agents:** Do not make breaking schema/field changes to recording JSON without version migration and ADR.
- **Date logged:** 2026-04-27
- **Logged by:** Junie + human review pending

<!-- Copy the block below for each new quirk. Newest on top. -->

### QUIRK-{{NUMBER}}: {{SHORT_NAME}}

- **Trigger:** {{TRIGGER_DESCRIPTION}}
- **Observed behavior:** {{BEHAVIOR}}
- **Expected-by-spec behavior (if known):** {{EXPECTED}}
- **Who relies on it:** {{CONSUMERS}}
- **Must preserve?** Yes | No
- **Evidence source:** {{EVIDENCE}}  <!-- support ticket, user interview, telemetry query, etc. -->
- **Characterization test:** `{{TEST_PATH}}`
- **DO-NOT rule for agents:** {{DO_NOT}}
- **Date logged:** {{DATE}}
- **Logged by:** {{AUTHOR}}

---

<!-- Repeat block above for additional quirks. -->
