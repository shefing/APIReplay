# ROADMAP.md — APIReplay iSDLC Migration

## Now

- Stage 00–02 legacy onboarding completion and evidence hardening.
- Finalize discovery/security/debt artifacts and maintain human-confirmed onboarding state.
- Preserve existing release confidence with current npm quality gates.

## Next

- Stage 03 safety net: characterization tests for record/replay/import-export/search/toggle behaviors.
- Define modernization seams across `src/background`, `src/popup`, and `src/shared` for Strangler-style changes.
- Track remediation for vulnerability and dependency-health findings in prioritized debt items.

## Later

- Stage 04+ incremental modernization after safety criteria and approvals are met.
- Ongoing iSDLC operating loop adoption (`plan` → `adr` → `debt` → `state` → `doctor`) in day-to-day delivery.
- MCP/agent instruction maintenance as CLI/MCP contracts evolve (tool rename upgrades included).
