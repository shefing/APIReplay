---
sessionId: session-260426-151958-1u9u
isActive: false
---

# Requirements

### Overview & Goals
Continue from the implemented tab foundation and deliver the next usability iteration so users can complete common tasks faster with less scanning.

### Scope
#### In Scope
- Refine tab information architecture so **Record** and **Preview** are clearer in intent.
- Improve discoverability and feedback for high-frequency actions (recording selection, preview filtering, replay status).
- Strengthen keyboard/accessibility behavior of tabs and key interactive controls.
- Keep all existing record/replay/import/export/delete/edit functionality intact.

#### Out of Scope
- Background replay/recording engine changes in background scripts.
- Storage schema redesign beyond lightweight popup UI preferences.

### Functional Requirements
- Tab labels and panel content should match user mental model (record setup vs request inspection).
- Preview area should always communicate state clearly:
  - no recording selected,
  - recording selected but no requests,
  - filtered search has no matches.
- Primary actions remain available without excessive scrolling in the fixed popup size.
- Keyboard users can tab to, activate, and understand current tab/panel state consistently.

# Technical Design

### Current Implementation (reviewed)
- `src/popup.html` has a tabbed shell using `recordTabButton`, `replayTabButton`, `recordTabPanel`, `replayTabPanel`.
- `src/popup/main.ts` already centralizes tab lifecycle (`setActiveTab`, `restoreActiveTab`) and persists `popupActiveTab` in `chrome.storage.local`.
- `updateApiPreview()` in `src/popup/main.ts` renders request states and integrates with `renderApiPaths` from `src/popup/components/ApiPreview.ts`.
- Visual states for tabs are defined in `src/styles.css` via `.tab-button` / `.tab-button-active` (with dark mode overrides).

### Key Decisions
1. Keep the existing tab IDs and lifecycle as the single source of truth (lowest regression risk).
2. Improve usability via **content re-grouping + clearer empty/filter states** rather than a major controller rewrite.
3. Add incremental accessibility polish (ARIA state alignment + keyboard affordances) within current imperative DOM pattern.

### Proposed Changes
- **`src/popup.html`**
  - Re-balance panel composition:
    - keep record setup controls in `recordTabPanel`,
    - present request inspection controls in the preview-focused panel with clearer section headings.
  - Add explicit helper text containers for empty/no-result states in preview.
- **`src/popup/main.ts`**
  - Extend preview rendering branch logic to distinguish:
    - no recording selected,
    - no captured requests,
    - search mismatch.
  - Keep `setActiveTab()` as authority; add minor keyboard activation handling for tabs if needed (`Enter`/`Space`) while preserving existing click handlers.
  - Ensure tab switches do not unintentionally clear `recordingSelect` or search input.
- **`src/styles.css`**
  - Add lightweight styles for informational empty-state blocks and section hierarchy.
  - Improve spacing/visual grouping to reduce clutter in the preview-focused panel while staying inside `785x600`.

### Risks
- Re-grouping controls may accidentally disrupt existing event assumptions.
  - Mitigation: preserve IDs and listeners; move markup blocks without renaming wired elements.
- Additional state branches may create inconsistent messages.
  - Mitigation: centralize message selection in `updateApiPreview()` and reuse one rendering path.

# Testing

### Validation Approach
Use build + focused manual popup checks on both tabs and existing recording workflows.

### Key Scenarios
- Reopen popup and verify tab restore still works (`popupActiveTab`).
- Record flow still works (start/stop, presets, filter, status updates).
- Preview flow communicates each state correctly:
  - no recording selected,
  - empty captured list,
  - no search matches.
- Replay, import/export, rename/duplicate/delete actions still function after layout refinements.
- Keyboard navigation validates tab focus and activation behavior.

### Edge Cases
- Rapid tab switching while replay is active.
- Long recording names and many requests in fixed popup size.
- Dark mode readability for tab and empty-state UI.

# Delivery Steps

### ✓ Step 1: Refine tab content structure for clearer Record vs Preview workflows
The popup panels are reorganized so each tab reflects a single clear user intent.
- Update `src/popup.html` to improve section hierarchy and reduce visual mixing of setup vs inspection tasks.
- Keep existing wired IDs (`recordTabButton`, `replayTabButton`, `recordTabPanel`, `replayTabPanel`, and action controls) to avoid behavior regressions.
- Add explicit containers/text hooks for preview state messaging (no selection / no requests / no matches).

### ✓ Step 2: Harden preview-state logic and tab interaction behavior in controller
Preview feedback becomes deterministic and tab interaction remains stable for mouse and keyboard users.
- Update `updateApiPreview()` in `src/popup/main.ts` to differentiate empty and filtered states with clear user-facing messages.
- Keep `setActiveTab()` / `restoreActiveTab()` as the sole tab lifecycle path, preserving storage restore behavior.
- Add/adjust tab keyboard activation handling (Enter/Space) and verify ARIA state sync stays correct on each switch.
- Ensure tab switches preserve selection/search context unless explicitly reset by user action.

### ✓ Step 3: Polish visual clarity and verify no-regression core flows
The updated popup remains readable, accessible, and fully functional in light and dark themes.
- Extend `src/styles.css` with compact empty-state and section-group styling consistent with existing tab styles.
- Tune spacing and scroll behavior to keep high-frequency actions visible within fixed popup dimensions.
- Validate record/replay/import/export/delete/edit and preview interactions end-to-end after usability refinements.