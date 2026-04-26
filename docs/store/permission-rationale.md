# Permission rationale checklist

## Requested permissions

- `storage`
  - Purpose: store recordings, settings, presets, and user preferences.
  - User value: persistent workflows across sessions.
- `unlimitedStorage`
  - Purpose: support larger recording bodies and longer sessions.
  - User value: avoids truncation/data loss in realistic traffic captures.
- `activeTab`
  - Purpose: operate on the currently selected tab from popup actions.
  - User value: safer scope for user-initiated record/replay actions.
- `debugger`
  - Purpose: observe and intercept network requests via CDP.
  - User value: enables reliable record and deterministic replay features.
- `tabs`
  - Purpose: attach/detach debugger and track replay target tab lifecycle.
  - User value: stable replay control and stop/cleanup behavior.

## Host permissions

- `<all_urls>`
  - Purpose: allow recording/replay against any user-selected app domain.
  - User value: works across local, staging, and production environments.

## Operational safeguards

- Data remains local to browser storage.
- Import JSON is validated before storage mutation.
- Replay can be stopped manually anytime.
- Per-request replay enable/disable is user-controlled.
