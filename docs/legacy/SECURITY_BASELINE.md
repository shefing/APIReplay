# Security Baseline — 2026-04-26

> Legacy Onboarding Step 2c. This is a HARD GATE: no 'agent-ready' label until all checkboxes are green and evidence is linked.

## SBOM
- [ ] Tool: Syft | CycloneDX | GitHub Dependency Graph
- [ ] Committed at: TODO (path)

## Vulnerability baseline
- [ ] Tool: Trivy | Grype | OSV-Scanner | Snyk | Dependabot
- [ ] CVE inventory seeded into TECH_DEBT.md

## Secret scan
- [ ] Tool: Gitleaks | TruffleHog | GitHub Secret Scanning
- [ ] All discovered secrets rotated BEFORE ingestion

## License audit
- [ ] Tool: FOSSA | ScanCode
- [ ] No incompatible GPL/AGPL constraints

## Dependency health & EOL
- [ ] Cross-referenced against endoflife.date, OpenSSF Scorecard, Libraries.io, deps.dev, Socket.dev
- [ ] EOL / abandoned deps listed as first-class TECH_DEBT items
- [ ] Step 0 disposition re-validated against EOL findings

## Sign-off
- [ ] Human reviewer: ________
- [ ] Date: ________
