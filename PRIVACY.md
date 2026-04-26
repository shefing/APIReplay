# Privacy Policy

## Summary

API Replay processes captured request/response data locally in your browser storage to enable record/replay functionality.

## Data collection and usage

- Recorded network metadata and response bodies are stored in `chrome.storage.local` on the user device.
- Temporary replay/runtime state may be stored in `chrome.storage.session`.
- The extension does not intentionally transmit recording data to external services.

## Permissions rationale

- `storage`: Persist recordings, settings, and runtime flags.
- `unlimitedStorage`: Support larger recording datasets.
- `activeTab`: Scope actions to the currently active tab.
- `debugger`: Attach to tab network events via Chrome DevTools Protocol for record/replay.
- `tabs`: Manage tab targeting for debugger attachment and replay lifecycle.
- `<all_urls>` host permission: Required to capture/replay API traffic across arbitrary application domains.

## User controls

- Users can delete one recording, clear all recordings, and import/export recording files.
- Users can disable individual requests from replay and stop recording/replay at any time.

## Contact

If you have privacy concerns, open an issue in this repository.
