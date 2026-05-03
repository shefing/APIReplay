---
sessionId: session-260426-151958-1u9u
isActive: false
---

# Requirements

### Overview & Goals
Review the current popup tab implementation and update the plan to match what is already done, then complete the remaining usability work for a clean **Record / Preview-first** flow.

### In Scope
- Keep the existing tabbed popup foundation and refine behavior.
- Ensure tab behavior is deterministic (default/restore), accessible, and non-disruptive to existing workflows.
- Improve clarity of the second tab content so preview tasks are easy to discover.
- Preserve all existing recording/replay/import/export/delete/edit capabilities.

### Out of Scope
- Background replay/record engine logic.
- Recording schema/storage migrations unrelated to tab UI state.

### Functional Requirements
- Tab state must be restored when reopening popup (using existing extension storage pattern).
- Entering the preview-focused tab must refresh API preview reliably.
- Empty preview state should remain explicit and user-friendly.
- Tab controls must expose correct ARIA semantics (`aria-selected`, `aria-hidden`, panel linkage).
- Existing key flows (record start/stop, replay, file actions, request editing) must continue working unchanged.

# Technical Design

### Current Implementation (observed)
- `src/popup.html` already has tabbed layout with `recordTabPanel` and a second panel (`replayTabPanel`) plus tab buttons.
- `src/popup/main.ts` already toggles tab visibility (`setActiveTab`) and binds tab click handlers.
- `updateApiPreview()` and request rendering are still centralized in `src/popup/main.ts` + `src/popup/components/ApiPreview.ts`.
- Styling for tab affordances exists in `src/styles.css` (`.tab-button`, `.tab-button-active`) and additional popup styles are already present.

### Gaps to Close
1. **Tab persistence is not consistently aligned in current controller flow**
   - Ensure one authoritative tab-state lifecycle (`restore -> set -> persist`).
2. **Naming drift between tab semantics and content**
   - Current second tab is replay-heavy; make preview entry point more explicit without breaking IDs and handlers.
3. **Accessibility/state sync hardening**
   - Keep classes and ARIA attributes synchronized on every tab switch.

### Proposed Changes
- **`src/popup/main.ts`**
  - Consolidate tab state API around one `setActiveTab(tab, options)` function.
  - Restore last active tab from `chrome.storage.local` on startup with safe fallback.
  - Persist tab changes on user switch.
  - Trigger `updateApiPreview()` whenever switching into the preview-capable tab.
- **`src/popup.html`**
  - Keep current structure, but normalize tab labels/ARIA attributes so user intent is clear (preview discoverability).
  - Ensure panel `role="tabpanel"`, `aria-labelledby`, and hidden state are consistent.
- **`src/styles.css`**
  - Keep existing tab style system; remove overlap/conflicts between legacy and new tab class variants where needed.
  - Ensure dark/light active/hover/focus states remain distinct and accessible.

### Risks & Mitigations
- **Risk:** Duplicate tab logic paths can desync visual and persisted state.
  - **Mitigation:** single source of truth in one tab state helper.
- **Risk:** Refactoring labels/ids can break event bindings.
  - **Mitigation:** preserve existing IDs used by `main.ts` and adjust incrementally.

# Testing

### Validation Approach
Use build + targeted manual popup validation to verify that tab UX changes do not regress functionality.

### Key Scenarios
- Popup opens on last-used tab after close/reopen.
- Switching to preview-capable tab refreshes API list immediately.
- Record/replay controls, dropdown actions, and modals still function.
- Request search/filter and response editing continue to work.
- Light/dark theme tab readability and focus states remain clear.

### Edge Cases
- No recording selected.
- No matching requests for search term.
- Rapid tab switching during active recording/replay.

# Delivery Steps

### ✓ Step 1: Align tab state lifecycle in popup controller
Tab selection becomes deterministic and persistent across popup sessions.
- Refine `setActiveTab` usage in `src/popup/main.ts` so class toggles, ARIA state, and persistence happen together.
- Restore active tab from `chrome.storage.local` during initialization with a safe fallback.
- Ensure preview refresh is invoked when entering the preview-capable tab.

### ✓ Step 2: Normalize tab semantics and accessibility in markup
Tab labels and panel semantics clearly communicate Record vs Preview workflow.
- Update `src/popup.html` tab button text/attributes to match the intended workflow language.
- Verify `role`, `aria-controls`, `aria-labelledby`, and `aria-hidden` are correctly paired for both panels.
- Keep existing control IDs and layout blocks stable to avoid behavior regressions.

### ✓ Step 3: Clean up tab styling consistency and validate critical flows
Tab appearance is consistent across themes and all core popup flows remain intact.
- Reconcile tab-related CSS in `src/styles.css` to avoid conflicting class systems.
- Keep active/inactive/hover/focus states visually distinct in light/dark modes.
- Validate record/replay/preview/edit workflows end-to-end after styling and behavior alignment.