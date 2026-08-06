# ADR-0000: Disposition for APIReplay legacy system — Retain and modernize incrementally

- **Status:** Accepted
- **Date:** 2026-04-26
- **Deciders:** tsemachhadad
- **Stage:** 00-LegacyOnboarding  <!-- Lifecycle stage in which the decision was taken -->
- **Tags:** legacy, disposition, retain, incremental-modernization, 7Rs

## Context

- **System:** APIReplay (`/Users/tsemachhadad/dev/APIReplay`)
- **Chosen disposition:** Retain
- **Rationale:** APIReplay is a working Chrome MV3 extension with production-relevant capabilities (record/replay/edit/import/export/search/toggles) and a healthy engineering baseline (`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`). Replacing or retiring now would incur high migration and validation cost, while retaining allows immediate value through governance hardening via iSDLC onboarding.
- **EOL / unsupported-stack evaluation:** Runtime stack is not EOL as of this decision (`Node 23.11.1`, `npm 10.9.2`, active TypeScript/Vite/Playwright toolchain). Step 2c security baseline identified dependency vulnerabilities (7 total from `npm audit`, including 2 high, 5 moderate), but these are manageable remediation items and do not force disposition change from Retain.


Forcing function: migrate an existing non-iSDLC repository into iSDLC legacy onboarding without disrupting current delivery. Constraints include preserving current extension behavior and keeping existing quality gates operational during onboarding.

## Decision

We will **retain APIReplay as a legacy system** and modernize it incrementally through the iSDLC legacy onboarding path (`LEGACY_ONBOARDING.md`, Steps 0–7), prioritizing context re-hydration, safety-net definition, and governance artifacts before any major architectural rewrite.

## Alternatives Considered

1. **Retire / Repurchase — replace with SaaS or deprecate extension**
   - Rejected because it would abandon existing workflows and user value already encoded in current recordings/replay behaviors, with no validated replacement path.
2. **Replatform immediately (big-bang rewrite onto a new architecture/runtime)**
   - Rejected because risk is too high without finalized discovery, quirks capture, and characterization safety net. Immediate rewrite conflicts with legacy onboarding principles.
3. **Do nothing / keep current repo without iSDLC onboarding**
   - Rejected because it preserves context debt and weak governance, preventing reliable agent-assisted delivery and increasing regression risk over time.

## Consequences

- **Positive:** preserves current business value and release cadence; enables controlled modernization with explicit gates and human approvals; minimizes immediate disruption.
- **Negative / trade-offs:** known security/dependency risks remain temporarily; process overhead increases during onboarding; modernization benefits are deferred.
- **Follow-ups required:** complete Step 1 discovery evidence, Step 2 retro docs (`SPEC.md`, `ROADMAP.md`, `QUIRKS.md`), and Step 2c security baseline with tracked remediation.
- **Tech debt introduced (if any):** vulnerability backlog and deferred modernization seams must be tracked in `TECH_DEBT.md` (to be added in Step 2 completion).

## Compliance & Risk Notes

- Security gate remains open until `docs/legacy/SECURITY_BASELINE.md` checkboxes are completed and human-signed.
- SBOM evidence exists at `docs/legacy/sbom.cdx.json`.
- Vulnerability findings from `npm audit` are accepted temporarily under managed risk for onboarding, not ignored.

## References

- Related ADRs: none (seed ADR).
- Related plans: `.junie/plans/migrate-apireplay-to-isdlc.md` (Step 2).
- External: `LEGACY_ONBOARDING.md` §Step 0; `README.md`; `.isdlc/onboarding.json`; `docs/legacy/SECURITY_BASELINE.md`.
