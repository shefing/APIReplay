# Security Baseline — 2026-04-27

> Legacy Onboarding Step 2c. This is a HARD GATE: no 'agent-ready' label until all checkboxes are green and evidence is linked.

## SBOM
- [x] Tool: CycloneDX (`@cyclonedx/cyclonedx-npm`)
- [x] Committed at: `docs/legacy/sbom.cdx.json`

## Vulnerability baseline
- [x] Tool: `npm audit --json`
- [x] CVE inventory seeded into `TECH_DEBT.md` (`TD-2026-04-27-001`)
- Findings snapshot: 7 vulnerabilities (2 high, 5 moderate) pending remediation planning.

## Secret scan
- [ ] Tool: Gitleaks | TruffleHog | GitHub Secret Scanning
- [ ] All discovered secrets rotated BEFORE ingestion
- Status: deferred pending installation/enabling of dedicated scanner in this environment.

## License audit
- [x] Tool: `npx license-checker --summary`
- [ ] No incompatible GPL/AGPL constraints
- Findings snapshot: one `UNLICENSED` dependency entry detected; triage tracked in `TECH_DEBT.md` (`TD-2026-04-27-002`).

## Dependency health & EOL
- [ ] Cross-referenced against endoflife.date, OpenSSF Scorecard, Libraries.io, deps.dev, Socket.dev
- [x] EOL / abandoned deps listed as first-class TECH_DEBT items
- [x] Step 0 disposition re-validated against EOL findings
- Runtime notes: Node `23.11.1`, npm `10.9.2` were active during baseline collection; no immediate runtime EOL blocker identified.

## Sign-off
- [ ] Human reviewer: ________
- [ ] Date: ________

## Evidence Links
- `docs/legacy/sbom.cdx.json`
- `docs/adr/0000-disposition-legacy-system.md`
- `TECH_DEBT.md`
