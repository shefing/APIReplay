# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog,
and this project adheres to Semantic Versioning.

## [1.0.2] - 2026-05-03
### Added
- URL path prefix mapping for cross-environment replay: record on staging (e.g. `/microservice1/api/users`), replay locally (e.g. `/api/users`) using the new **URL Mappings** field in the Replay tab.
- Mappings are persisted with each recording's replay options and restored on selection.
- README workflow documentation for the central-record / local-replay use case.

## [1.0.1] - 2026-04-26

### Added
- In-progress recorded URLs preview in the `Record` tab for live visibility while capturing traffic.

### Changed
- Popup usability refinements with clearer `Record` / `Preview` workflow separation and tab-state behavior improvements.

### Fixed
- Popup replay/preview interaction stability improvements to keep request inspection and control flows consistent.

## [1.0.0] - 2026-04-26

### Added
- Vite + CRX + TypeScript production toolchain with lint, typecheck, build and packaging scripts.
- Modular MV3 background architecture with dedicated recorder/replayer/messaging/state/logger modules.
- Versioned, UUID-keyed recording schema with migration and validation paths.
- Popup UX improvements: presets, request search, replay enable toggles, inline status edit, latency controls, replay stats, and keyboard shortcut support.
- Unit tests with Vitest and extension smoke E2E with Playwright.
- CI and release workflows for reproducible extension artifacts.
