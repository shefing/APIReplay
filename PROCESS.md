# PROCESS.md: The iSDLC Lifecycle

The **Intelligent Software Development Life Cycle (iSDLC)** is a framework designed for human-agent collaboration. It moves beyond "AI as a helper" to a **symphonic orchestration model** that prioritizes **Context Density** and **Verifiable AI Outputs** over traditional manual toil.

## 1. Lifecycle Overview

| Stage | Activity | Primary Agent Role | Human Role |
| :--- | :--- | :--- | :--- |
| **01. Business Goals & Tenders** | Strategic Alignment & Compliance | Solicitation Shredding & Stress-testing | Vision & Value Guardrail |
| **02. Requirements Engineering** | Stakeholder Contract | Synthetic User Simulation & Quality Audit | Empathy & Nuance Validation |
| **03. Logic & Visual Design** | Specs & Screen Design | Asset & Layout Generation | UX/Logical Consistency Audit |
| **04. System Architecture** | Architecture & Delivery Strategy | Pattern Matching & ADR Generation | Structural Decision Maker |
| **05. Coding, CI & Testing** | The Inner Loop | Code Gen, Test Gen & CI Orchestration | Lead Architect & Quality Gatekeeper |
| **06. IaC & CD Execution** | Infrastructure & Release | Template & Policy Generation, Drift Detection | Security, Cost & Release Auditor |
| **07. Observability & Maintenance** | Monitoring & Auto-Healing | Anomaly Detection & Auto-Remediation | Incident Commander |

---

## 1.1. The Plan-Build-Review Loop

Cutting across all stages, the iSDLC operates on a **Plan → Build → Review** inner loop — validated by field experience with phased agent-driven development:

```
PLAN ──▶ BUILD ──▶ REVIEW ──▶ (next plan or refine)
```

* **PLAN:** Human creates a detailed, agent-consumable plan with objective, acceptance criteria (Gherkin), scope boundaries ("DO NOT" list), and context references. The plan must be precise enough that an agent can execute without extensive clarification.
* **BUILD:** Agent executes the plan. Human monitors for drift but does not micromanage.
* **REVIEW:** Human reviews the output as an end user — not just for correctness, but for UX quality, flow, and intent alignment. Deviations and improvements are captured. If refinement is needed, the loop repeats. If accepted, state files are updated and the next plan begins.

**Post-Phase Hardening:** At phase boundaries, a dedicated review session addresses accumulated UX and technical debt before advancing to the next phase.

**State Synchronization:** After every completed plan, the project's state files (`STATE.md`, `ROADMAP.md`, `PROJECT.md`) must reflect the current reality — decisions made, issues deferred, rules learned. This is the bridge that enables agent resume and multi-agent collaboration.

---

## 2. Stage Details & Concrete Methods

### 01: Business Goals & Tenders
* **Method:** **Inverse Logic Stress-Testing** — Use AI to challenge business assumptions ("Devil's Advocate" prompt). **Solicitation Shredding** — Extract requirements from RFPs/Tenders and generate compliance matrices instantly.
* **Deliverable:** `GOALS.md` and compliance matrix.
* **AI Tooling:** Perplexity (Research), Claude/o1 (Reasoning), **Inventive AI**, **GovDash**, **Tenderbolt AI** (Tender analysis).
* **Detail:** [`framework/01-goals.md`](./framework/01-goals.md)

### 02: Requirements Engineering (The Stakeholder Contract)
* **Method:** **Evidence-Grounded Discovery** using the **Stanford Model** for synthetic personas (simulated individuals based on deep interviews). Validate requirements against the **10 IEEE-29148 attributes** (Necessary, Unambiguous, Complete, etc.) and user stories against **INVEST** criteria. Automate **WSJF** (Weighted Shortest Job First) prioritization to remove bias.
* **Deliverable:** EPICs, High-Level Requirements, detailed User Stories (Gherkin format).
* **AI Tooling:** Claude (Persona creation), Delve/UserTesting AI (Feedback loops).
* **Detail:** [`framework/02-requirements.md`](./framework/02-requirements.md)

### 03: Logic & Visual Design
* **Method:** **LLM-Readable Specs** — Write modular specifications to be ingested by coding agents (Markdown/Mermaid). **Design-to-Code Pipeline** — Use generative UI to bridge intent to frontend scaffolding.
* **Principle:** If the AI can't generate a working prototype from your spec, the spec is ambiguous.
* **AI Tooling:** v0.dev, **Uizard Autodesigner**, **Galileo AI**, Eraser.io (Diagrams).
* **Detail:** [`framework/03-design.md`](./framework/03-design.md)

### 04: System Architecture & Delivery Strategy
* **Method:** **ADR-Driven Development** — Use AI to compare architectural patterns; human selects and validates. Agents generate **Architecture Decision Records (ADRs)** in [`/docs/adr/`](./docs/adr/) for every significant choice to prevent "memory loss." Define **Continuous Deployment (CD)** strategy as a component of architecture.
* **AI Tooling:** **Workik**, **Claude Code**, **InfraSketch**, Eraser.io.
* **Detail:** [`framework/04-architecture.md`](./framework/04-architecture.md)

### 05: Coding, CI & Testing (The Inner Loop)
* **Method:** An inseparable "Inner Loop" of coding and Continuous Integration. **Composer-Driven Development** — Use IDE agents for multi-file changes while the human manages the Context Window.
* **Positive Dominance:** Mandatory "Positive-First" policy. Agents prioritize positive flows before negative tests, except for critical security probes.
* **PR Artifacts:** Every Pull Request must include:
  1. **User Impact:** Brief functionality summary.
  2. **System Quality:** Warnings about performance, security risks, or supply chain vulnerabilities.
  3. **Test Impact:** Coverage analysis confirming positive path dominance.
  4. **Data Migration:** Warnings if schema changes require specific migrations.
  5. **ADR Links:** Direct references to new or updated decision records.
* **AI Tooling:** Cursor, Windsurf, Aider, Playwright (w/ AI codegen), CodiumAI.
* **Detail:** [`framework/05-coding-ci-testing.md`](./framework/05-coding-ci-testing.md)

### 06: IaC & CD Execution
* **Method:** **Declarative Infrastructure** — Bridge validated code to the environment via typed IaC (Pulumi/Crossplane). This stage executes the CD strategy defined in Stage 04 (Architecture). Agents reconcile code against the live cloud state (minimum daily and on every deployment) to prevent environment drift. **IaC Testing** — Unit tests, Policy-as-Code (OPA/Sentinel), and integration tests are required before apply. **Pipeline Security** — Artifact signing (Cosign/Sigstore), SBOM generation, and container scanning enforce supply-chain integrity. **Repository Strategy** — IaC co-located in `/infra` (default) with GitOps controller reconciliation.
* **AI Tooling:** **Pulumi AI**, **Crossplane**, **NSync Agentic Framework**, GitHub Actions, ArgoCD/Flux, **OPA/Sentinel**, **Cosign/Sigstore**, **Syft/Trivy**, Checkov, Infracost.
* **Detail:** [`framework/06-iac-cd.md`](./framework/06-iac-cd.md)

### 07: Autonomous Observability & Maintenance
* **Method:** **Active Observability** — Agents monitor logs and "explain" errors in plain language. **Auto-Healing** — Proactive monitoring that identifies errors in logs and **automatically opens PRs** to fix crashes or optimize resource/token consumption.
* **AI Tooling:** **Monte Carlo**, **Grafana**, **Middleware OpsAI**, **Datadog LLM Observability**, Honeycomb, LangSmith.
* **Detail:** [`framework/07-observability.md`](./framework/07-observability.md)

---

## 3. The "Definition of Done" (DoD)

A task is only **Done** when:
1. **Code exists:** It passes all automated tests.
2. **Context is updated:** [`AGENTS.md`](./AGENTS.md), [`SPEC.md`](./SPEC.md), and relevant context files reflect the changes so the next agent session starts with 100% accuracy.
3. **HVP (Human Validation Protocol):** A human has verified the logic, not just the output.
4. **UX Reviewed:** A human has used the feature as an end user would and confirmed the experience meets intent — not just that the code works, but that the product feels right.
5. **State Files Current:** Project state files (`STATE.md`, `ROADMAP.md`, `PROJECT.md`) reflect the latest decisions, deferred issues, and learned rules. The **Session Continuity** block records where work stopped and what comes next.
6. **Bot-Ready:** A new agent can onboard and continue the work instantly using `AGENTS.md`, `llms.txt`, and state files.
