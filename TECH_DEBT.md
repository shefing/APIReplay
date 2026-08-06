# TECH_DEBT.md

> Live tech-debt log. Update on every PR that introduces a known shortcut (AGENTS.md Rule 6).

| ID | Date | Item | Why deferred | Tracking |
|---|---|---|---|---|
| TD-2026-04-27-001 | 2026-04-27 | Address `npm audit` high/moderate vulnerabilities (7 total currently) | Legacy onboarding focuses on context re-hydration first; remediation sequencing needed to avoid destabilizing extension behavior during migration. | `docs/legacy/SECURITY_BASELINE.md` + follow-up plan item |
| TD-2026-04-27-002 | 2026-04-27 | Resolve dependency license outlier (`UNLICENSED` entry from license summary) | Requires dependency-level triage and replacement/approval decision; deferred until baseline inventory is reviewed by human maintainer. | `npx license-checker --summary` output + maintainer decision |
| TD-2026-04-27-003 | 2026-04-27 | Add characterization tests for preserved quirks and core flows before refactor | Step 3 safety-net work is the designated phase; tests are intentionally deferred until onboarding artifacts are approved. | `QUIRKS.md` + Step 3 in `.junie/plans/migrate-apireplay-to-isdlc.md` |
