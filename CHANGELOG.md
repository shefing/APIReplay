# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog,
and this project adheres to Semantic Versioning.

## [1.0.0] - 2026-04-26

### Added
- Vite + CRX + TypeScript production toolchain with lint, typecheck, build and packaging scripts.
- Modular MV3 background architecture with dedicated recorder/replayer/messaging/state/logger modules.
- Versioned, UUID-keyed recording schema with migration and validation paths.
- Popup UX improvements: presets, request search, replay enable toggles, inline status edit, latency controls, replay stats, and keyboard shortcut support.
- Unit tests with Vitest and extension smoke E2E with Playwright.
- CI and release workflows for reproducible extension artifacts.
