---
sessionId: session-260426-151958-1u9u
isActive: false
---

# Requirements

### Overview & Goals
Adjust the plan to reflect current progress and complete the remaining popup usability work with a clean **Record / Preview** split.

### Scope
#### In Scope
- Finalize a two-tab popup flow in `src/popup.html` and `src/popup/main.ts`.
- Preserve existing behavior for recording, replay, presets, import/export, delete, and request editing.
- Improve information hierarchy in the popup so high-frequency actions are easier to find.
- Apply dark/light theme-consistent styling in `src/styles.css`.

#### Out of Scope
- Replay/record engine behavior in background scripts.
- Data model changes for recordings beyond UI state persistence.

### Functional Requirements
- Add a tab switcher with **Record** and **Preview** tabs near header/status.
- Record tab contains setup + manage/replay controls + replay options/stats.
- Preview tab contains request search and API request table.
- Preview renders a friendly empty state when no recording is selected.
- Tab switch does not reset selected recording or current search unexpectedly.
- Last active tab is restored when popup reopens.

# Technical Design

### Current Implementation (reviewed)
- `src/popup.html` is still a single long flow (recording setup, management, replay options, API preview).
- `src/popup/main.ts` already centralizes popup state (`isRecording`, `isReplaying`) and preview refresh (`updateApiPreview`).
- Reusable UI logic already exists in:
  - `src/popup/components/ApiPreview.ts` (`renderApiPaths`)
  - `src/popup/components/RecordingsList.ts` (`initRecordingSelect`, `renderRecordingOptions`)
- `src/styles.css` already contains popup sizing, dark mode overrides, dropdown/select styles, and can host tab styles.

### Key Decisions
1. **Incremental refactor on existing DOM IDs** (recommended)
   - Keep existing IDs and event wiring stable; only group sections into tab panels.
2. **Lazy preview refresh on Preview tab activation**
   - Reuse existing `updateApiPreview()` and call it when preview becomes visible.
3. **Persist active tab in extension storage**
   - Restore context between popup opens without changing recording storage schema.

### Proposed Changes
- **`src/popup.html`**
  - Add tab controls (`recordTabBtn`, `previewTabBtn`) below status.
  - Wrap existing content into `recordTabPanel` and `previewTabPanel` containers.
  - Keep modals (`apiCallModal`, `renameDialog`, `presetsDialog`) outside tab containers.
- **`src/popup/main.ts`**
  - Add `activeTab` state + `setActiveTab(tab)` to toggle panel visibility and tab button styles.
  - Bind tab button events and persist active tab selection.
  - Restore active tab at startup; default to Record if storage is missing/invalid.
  - Trigger `updateApiPreview()` when entering Preview to avoid stale content.
- **`src/styles.css`**
  - Add tab button styles (active/inactive/hover/focus, dark-mode parity).
  - Add compact spacing helpers for panel layout so popup remains readable in fixed `785x600`.

### Additional Usability Polish (small)
- Keep status indicator visible above tabs as a global state cue.
- Ensure empty Preview state text is explicit (e.g., “Select a recording to preview requests”).
- Keep dropdown actions grouped in Record tab to reduce accidental destructive actions during preview browsing.

### Risks
- Hidden panel transitions can mask stale data.
  - Mitigation: force preview refresh on tab activation.
- Existing listeners may assume visible DOM.
  - Mitigation: do not unmount elements; only hide/show panels.

# Testing

### Validation Approach
Verify that tabbing changes presentation only, not business behavior.

### Key Scenarios
- Popup opens on restored/default tab correctly.
- Record tab: start/stop record, replay toggle, import/export/delete actions still work.
- Preview tab: search filtering + table actions + modal edit/save still work.
- Switch tabs during active recording/replay and confirm status + controls remain accurate.
- Dark mode: tab states and panel readability remain clear.

### Edge Cases
- No recordings available.
- Recording selected but request set empty.
- Rapid tab switching with request search input changes.

# Delivery Steps

### ✓ Step 1: Split popup layout into Record and Preview panels
The popup UI is reorganized into two tabbed panels while preserving existing controls and IDs.
- Update `src/popup.html` to add a tab switcher below the status indicator.
- Move recording setup, management, replay options, and stats into `recordTabPanel`.
- Move request search and API preview table into `previewTabPanel`.
- Keep modal/dialog overlays (`apiCallModal`, `renameDialog`, `presetsDialog`) outside panel containers so existing behavior remains intact.

### ✓ Step 2: Implement tab state lifecycle in popup controller
Users can switch tabs reliably and return to their last-used tab when reopening the popup.
- Add `activeTab` state and `setActiveTab(tab)` logic in `src/popup/main.ts`.
- Toggle panel visibility and tab button active classes without changing existing control IDs.
- Persist active tab in extension storage and restore it on popup initialization with a Record fallback.
- Refresh preview data when entering Preview tab using existing `updateApiPreview()` to avoid stale content.

### ✓ Step 3: Apply UX polish and validate no-regression behavior
Tabbed UI is visually clear in both themes and preserves all existing popup workflows.
- Add tab styles in `src/styles.css` for active/inactive, hover, and focus states with dark mode parity.
- Ensure empty preview state messaging is explicit when no recording is selected.
- Verify record/replay, dropdown actions, preview search, request editing modal, and status updates still work after tab integration.
- Confirm layout remains usable within existing fixed popup dimensions (`785x600`).