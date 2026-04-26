# **Legacy Onboarding: Context Re-Hydration**

## **Preview (Plain English)**

> **In one line:** Before letting AI agents touch an old codebase, we first *re-teach the project to itself* — recover what it does, why it exists, and prove it still works — so any human or AI joining the project can understand it in under a minute.

Most legacy systems suffer from **context debt**: the people who knew *why* the code was written have left, the docs are stale, and the tests (if any) don't cover what actually matters. You can't safely hand that to an AI agent — it will confidently break things. This document describes a staged "re-hydration" process to fix that **before** agents start working:

1. **Decide if it's worth saving.** Not every old system deserves rescue — some should be retired. A short written decision (Step 0) prevents wasted effort.
2. **Re-discover the project.** Use AI to read the whole codebase, ticket history, and old docs, and rebuild a picture of what it does and who uses it (Step 1).
3. **Write down the truth.** Produce a current spec, a log of past architectural decisions, a tech-debt list, and a security/licensing baseline — so humans and agents work from the same facts (Step 2).
4. **Build a safety net.** Add automated tests at multiple levels that lock in today's behavior (bugs included), so any future change is immediately visible (Step 3).
5. **Wrap the old code in a clean boundary.** Treat the legacy core as a black box behind a well-defined interface — the classic **Strangler Fig** approach (Step 4).
6. **Replace the insides, piece by piece.** Only now, with tests and a boundary in place, can agents safely refactor the legacy logic (Step 5).
7. **Turn on the lights.** Add monitoring and logs so you can *see* whether a change helped or hurt — not guess (Step 6).
8. **Final exam.** The project only "graduates" once it passes a concrete checklist: tests green, security baseline in CI, a pilot AI task succeeded, etc. (Step 7).
9. **Join the normal flow.** After graduation, the project enters the standard 7-stage iSDLC like any new project (Step 8).

**Why this order matters:** security before access, tests before refactoring, boundaries before replacement, observability before trust. Skipping a step doesn't save time — it just hides the risk somewhere harder to see later.

> **Looking for a pattern-oriented view?** For components that are **inactive**, **too complex**, or that you **don't want to touch** right now, see the companion document [`LEGACY_MIGRATION_PATTERNS.md`](./LEGACY_MIGRATION_PATTERNS.md) — it re-frames the steps below as seven reusable patterns with a decision tree. This document remains the **normative** source; the patterns doc is a reference guide derived from it.

### **Mini-Glossary (the terms most people ask about)**

Just enough to read the rest of this document without stopping to Google. Full definitions appear in context below.

* **Context debt** — the gap between what legacy code *does* and what anyone can still *explain* about it. Like financial debt, it compounds: every departing engineer and stale doc makes it worse.
* **Disposition / TIME / 7Rs triage** — a quick, *written* decision about what to do with a legacy system **before** investing in it. **TIME** (Gartner) = Tolerate, Invest, Migrate, Eliminate. **7Rs** (AWS) = Retain, Rehost, Replatform, Refactor, Repurchase, Retire, Relocate. The point: don't re-hydrate a system that should just be retired.
* **Strangler Fig** — a modernization pattern (Martin Fowler) named after a tree that grows around a host and gradually replaces it. You wrap the old system in a new interface, then swap out its internals piece by piece — **no risky big-bang rewrite**.
* **Strangler Fig Wrapping** — the first concrete act of the pattern: building the façade/boundary around the legacy code so all callers go through the new interface. Nothing is replaced yet; you've only created the safe handover point.
* **Strangler Fig boundary** — the exact contract line (API, schema, function signature) where the new wrapper meets the old code. Everything outside is "new world"; everything inside is a "legacy black box."
* **Seam (Feathers)** — a place in the code where you can change behavior **without editing the code at that spot** (e.g., by injecting a different implementation). Seams are how you get legacy code under test.
* **Verifiable seam** — a seam that is also covered by automated tests, so any change made through it is provably safe (or provably broken). A Strangler Fig boundary becomes a verifiable seam once contract tests freeze it.
* **Characterization test / "Capture branch behavior at discovered seams"** — tests that pin down what the code *currently does* on every branch (`if/else`, `switch`, error path) — **including its bugs**. You're not testing what it *should* do; you're locking in today's behavior so any future change shows up as a deliberate diff.
* **Branch by Abstraction (Hammant)** — the in-place cousin of Strangler Fig, for refactors inside one codebase: introduce an abstraction layer over the old implementation, build the new one behind the same abstraction, run both in parallel (often behind a feature flag), then delete the old.
* **"Apply Feathers' Seams and Hammant's Branch by Abstraction for in-place refactoring"** — shorthand for: use small surgical insertion points (Seams) for unit-level changes, and an abstraction layer (Branch by Abstraction) for larger ones — instead of wrapping the whole system.
* **SBOM** — Software Bill of Materials: a machine-readable inventory of every dependency and version in the project. Required for vulnerability tracking and modern compliance (SLSA, SSDF, EU CRA).
* **Mutation testing** — deliberately introducing tiny bugs ("mutants") into the code to check whether your tests catch them. A high mutation score proves the safety net actually works, not just that coverage is green.
* **QUIRKS.md / Bug-as-Feature register** — a log of undocumented behaviors only end users and support know about. Captured in Step 1, pinned by characterization tests in Step 3, and protected by a DO NOT rule so agents don't silently "fix" them.
* **Micro-frontend / iframe federation** — a UI composed of multiple independently-built frames (often different frameworks). The real contracts between them are `postMessage` events, URL params, and shared storage — not HTTP APIs.
* **Anti-Corruption Layer (ACL)** — a thin wrapper around an unsupported/EOL 3rd-party library so the rest of the codebase depends on *your* interface, not the dead library's. Lets you replace the library in one place instead of everywhere.
* **Shared library** — code reused across many frames/services (auth, UI kit, logging, generated clients, vendored 3rd parties). A single change fans out to every consumer, so shared libs are onboarded as their own independent projects with stricter contracts than a frame's.
* **Consumer-Driven Contract (CDC)** — each *consumer* of a shared library or API records the subset of the interface it actually uses; the provider's test gate must keep every recorded contract green. This is how a shared lib can evolve without silently breaking downstream frames.
* **Accidental API** — symbols or paths consumers import from a library that were never intended to be public. Usually where the worst quirks and couplings hide; must be surfaced and either promoted to public or deprecated.
* **Envelope / Shell (federated UI)** — the outer application that composes the frames: routing, auth/session handoff, cross-frame `postMessage` contracts, shared layout, focus and a11y handoff. Not UI chrome — it is the contract layer.
* **Federated-UI rhythm (Phases A / A½ / B / C)** — envelope contracts first (A), shared libraries next (A½), then per-frame onboarding in parallel (B), then full envelope re-hydration (C). Prevents the "big-bang shell rewrite at the end" anti-pattern.

---

## **Full Methodology**

To onboard an existing project into the context-centric iSDLC, you must bridge the **"context debt"** of legacy code — the accumulated gap between what the code *does* and what any current stakeholder (human or agent) can *explain about it* — to the **Value 2 (Verifiable Software & Agent-Ready Context)** and **Value 3 (Shared Strategic Intent)** requirements of the methodology.

You cannot simply unleash agents onto undocumented, tightly-coupled legacy code. The project must undergo a **"Context Re-Hydration"** phase to move it from a state of technical entropy to a state where an agent can achieve the **60-Second Onboarding Rule** (see [`PRACTICES.md`](./PRACTICES.md) and [`AGENTS.md`](./AGENTS.md) Rule 4).

## **Principles Alignment**

* **Testability as a Non-Negotiable Contract (Principle 10):** Legacy code must be wrapped in characterization tests *before* agents attempt to refactor or extract logic.
* **Evolutionary Sustainability (Principle 6):** Existing architecture and technical debt must be explicitly mapped into `TECH_DEBT.md` and Retroactive ADRs so agents understand the constraints they are inheriting.
* **Observability as Verification (Principle 11):** Re-hydrated systems must emit telemetry at wrapped boundaries so agent-initiated changes have a measurable signal, not a guess.
* **Bot-Ready Context & Human Accountability:** Security, supply-chain, and license posture must be baselined before agents gain repo access — agents never ingest live secrets, and a human owns the disposition decision.

## **Step 0 — Disposition Decision (Triage Gate)**

*Decide **whether** to re-hydrate before deciding **how**.*

Borrowing from Gartner's **TIME** (Tolerate / Invest / Migrate / Eliminate) and the AWS **7Rs** (Retain, Rehost, Replatform, Refactor, Repurchase, Retire, Relocate), classify the legacy asset:

* **Retain & Re-hydrate** — enters this flow.
* **Refactor** — enters this flow.
* **Replatform / Replace (Strangler Fig)** — enters this flow partially (Steps 1–4 only, in service of the replacement).
* **Retire / Repurchase** — exits this flow; no re-hydration performed.

**Output:** a disposition ADR at `docs/adr/NNN-disposition-<system>.md` documenting the decision, alternatives considered, and the expected cost/risk of re-hydration.

**EOL / unsupported-stack trigger:** If a meaningful share of the dependency tree (or the runtime/platform itself — Node, Python, Java, OS image) is **end-of-life, unmaintained, or orphaned**, the disposition review **must explicitly evaluate Replatform, Repurchase, or Retire** before committing to Retain. Re-hydrating onto a dying runtime is a short-lived investment. Evidence for this trigger comes from Step 2c (Dependency Health & EOL scan).

## **Step 1 — The "Discovery" Audit (State & Intent Recovery)**

Before the project can move to standard iSDLC stages, you must generate the missing grounding data.

* **Repo Ingestion:** Use a **repo-ingestion agent** (e.g., NotebookLM, Sourcegraph Cody, Cursor `@codebase`, `aider --repo-map`, `repomix`, `gitingest`) to upload the codebase, outdated documentation, and historical tickets to extract "latent" requirements.
* **Codebase Understanding:** Generate call graphs, module dependency maps, and hotspot analyses (e.g., Sourcegraph, `tree-sitter` / `ast-grep`, Understand, **CodeScene** for behavioral/hotspot analysis, Dependency-Cruiser, Madge).
* **Persona Backfilling:** Generate synthetic personas from historical user data, analytics, and support tickets to critique the current state of the app.
* **End-User Knowledge Capture (Tribal Knowledge & *Bug-as-Feature* Register):** Run short structured interviews or a survey with power users and support staff to log undocumented behaviors, workarounds, and anomalies that *look* like bugs but are contractually relied upon. Record each entry in `QUIRKS.md` (or a dedicated section in `SPEC.md`) with: **trigger · observed behavior · who relies on it · must-preserve? (yes/no) · evidence source**. Characterization tests (Step 3) alone will not catch these — they only exercise branches the tests hit; quirks in rarely-touched paths must be harvested from humans first, or agents *will* silently "fix" them into regressions.
* **Strategic Intent Recovery:** Use a **deep-research agent** (e.g., Gemini Deep Research, ChatGPT Deep Research, Perplexity Deep Research, or an internal RAG over Jira/Confluence via Glean/Dust) to evaluate the current technology stack against the original business goals and document the "why" behind the "what."

## **Step 2 — Establish the "Single Source of Truth" (Baseline Contract)**

You cannot run the iSDLC inner loop on an empty or assumed intent.

### 2a. Retroactive Product & Architecture Artifacts

* **Baseline `SPEC.md`:** Author a retroactive master spec capturing the current product definition and in-force contracts. (If the project also maintains a `PROJECT.md`, keep it consistent with `SPEC.md` — the latter is authoritative per the Repo Map.)
* **Retroactive ADRs:** Generate ADRs under `docs/adr/` for the immutable architectural choices already made by past teams. Reconstruct architecture views with **Structurizr**, **IcePanel**, or **ArchUnit** constraints.
* **Phased Reverse-Roadmap:** Map existing features into a `ROADMAP.md` so agents understand current dependencies and feature boundaries.

### 2b. Tech Debt & Quality Baseline

* Initialize `TECH_DEBT.md` with a scan of known anti-patterns, missing tests, and outdated dependencies.
* Record objective **"before" numbers** — coverage, cyclomatic complexity, duplication, hotspot churn — via **SonarQube / SonarCloud**, **Qodana**, **CodeClimate**, `lizard`, `radon`, or `git-of-theseus`. These are the scoreboard against which re-hydration progress is measured.

### 2c. Security, Supply-Chain & Compliance Baseline *(new, non-negotiable)*

Before any agent is granted repo access:

* **SBOM generation** — **Syft** / **CycloneDX** / GitHub Dependency Graph; commit the SBOM to the repo.
* **Vulnerability baseline** — **Trivy**, **Grype**, **OSV-Scanner**, **Snyk**, or **Dependabot**; seed `TECH_DEBT.md` with the CVE inventory.
* **Secret scan** — **Gitleaks**, **TruffleHog**, or GitHub Secret Scanning. Rotate any discovered secrets *before* ingestion.
* **License audit** — **FOSSA** or **ScanCode Toolkit** to surface hidden GPL/AGPL or incompatible constraints.
* **Dependency health & EOL scan** — an SBOM tells you *what* is there; it does not tell you what is **abandoned, EOL, or has no upgrade path**. Cross-reference the SBOM against **endoflife.date**, **OpenSSF Scorecard**, **Libraries.io**, **deps.dev**, and **Socket.dev** to flag: abandoned packages (no release > 24 months), EOL runtimes, single-maintainer risk, and license drift. Seed `TECH_DEBT.md` with each finding as a first-class item (not folded into the CVE list), and feed the summary back into the Step 0 EOL trigger. Use **Renovate** / **Dependabot** to automate safe upgrades once a target version is chosen.

### 2d. Data & Interface Discovery

* **Schema discovery** — **SchemaSpy**, **DbSchema**, or **Atlas (Ariga)** for database shape.
* **API contract capture** — derive OpenAPI/AsyncAPI specs from live traffic or source (`tsoa`, FastAPI auto-spec, Optic, Postman), then freeze via **Pact** or **Schemathesis**.

### 2e. UI Topology Baseline *(heterogeneous / iframe-federated UIs)*

Many legacy UIs are **composed from multiple iframes or micro-frontends**, each owned by a different team, using a different framework (jQuery, AngularJS, React, Vue, server-rendered…), different build tools, and different design standards. Treat the UI as a distributed system in its own right:

* **Per-frame inventory** — for every frame/micro-frontend record: host URL, framework + version, build tool, owner, last-updated date, support status, auth/session model, accessibility (a11y) status. This is the **UI analog of the SBOM** and feeds Step 2c's EOL scan (old AngularJS, EOL browsers, etc.).
* **Cross-frame contract capture** — the real contracts between frames are not HTTP APIs but: **`postMessage` event catalogs**, shared **storage / cookie keys**, **URL / query-param contracts**, auth/session handoff, and focus/a11y handoff. Document each and freeze with contract tests (Playwright cross-frame tests, Pact-style postMessage schemas).
* **Style & a11y parity** — record per-frame design tokens and a11y baseline (axe-core / Pa11y / Lighthouse CI) so replacing a frame cannot silently regress accessibility or brand.
* **Tooling** — Storybook per frame, Playwright component + cross-frame tests, **Module Federation** manifests (Webpack 5), **single-spa**, Web Components as a neutral interop layer, `iframe-resizer` for layout coordination.

### 2f. Shared Library Topology Baseline *(shared code, UI kits, vendored 3rd parties)*

Legacy systems typically depend on several **shared libraries** — internal code libs, design-system / UI component kits, runtime/platform libs (logging, tracing, i18n, feature flags), generated data/contract libs (DTOs, proto, OpenAPI clients), forked or vendored 3rd parties, and monorepo workspace packages. Each is an **independent onboarding unit** with its own lifecycle, ownership, and blast radius. Before consumers are re-hydrated, baseline each shared lib:

* **Consumer inventory** — for every shared lib record: who imports it, at which **version**, which exported symbols/APIs are actually used, and from which frame/service. Tools: `npm ls` / `yarn why`, Sourcegraph, `jdeps`, `pipdeptree`, `ast-grep`, Dependency-Cruiser, Madge.
* **Version topology / matrix** — the "current behavior" of a shared lib is rarely one version; it is a matrix (Frame A on `@2.3`, Frame B on `@1.7`). Record the matrix explicitly — it becomes the upgrade plan and scopes which CDC tests must be kept green in parallel.
* **Public-API classification** — mark every exported symbol as **public / internal / deprecated / accidental-API**. Accidental API (imports that were never meant to be public) is where the worst coupling hides and must be either promoted, deprecated, or linted away.
* **Ownership & maintenance signal** — for each lib: owner (or *unowned*), last release, single-maintainer risk, OpenSSF Scorecard, `endoflife.date`, CVE load. Feeds Step 2c's EOL trigger and Step 0 disposition at the library level.
* **Boundary enforcement** — record which physical boundaries keep consumers out of a lib's internals (`eslint-plugin-boundaries`, ArchUnit, Dependency-Cruiser rules, package `exports` maps).
* **Category-specific treatment:**
    * **Internal code lib** — full per-lib onboarding + SemVer contract.
    * **Design-system / UI component lib** — Storybook stories + visual regression per consumer + axe-core per story.
    * **Shared runtime / platform lib** — wrap behind ACL (Step 4b) and enforce via ArchUnit / Dependency-Cruiser.
    * **Shared data/contract lib** — Consumer-Driven Contract tests (Pact / Schemathesis).
    * **Forked / vendored 3rd party** — Step 2c EOL scan → Step 4b quarantine → replace.
    * **Monorepo workspace package** — same as internal lib + dependency graph constraints.

## **Applying This to Federated UIs — Per-Frame + Envelope Rhythm**

When the legacy system is a **federated UI** (multiple frames/micro-frontends composed by an outer shell, with shared libraries underneath), run the onboarding in an **envelope-first, envelope-last** rhythm rather than strictly sequentially. The shell is touched twice: once lightly at the start (to freeze contracts) and once fully at the end (to replace the composition).

* **Phase A — Envelope contracts first** *(shell, lightweight)*. Run Steps 0, 1, and 2e on the shell only. Freeze the cross-frame contract (postMessage catalog, URL/query, storage/cookies, auth & focus handoff) with Playwright cross-frame tests and postMessage schema tests (Step 4a contract-capture part). **No replacement yet.** Output: per-frame inventory, a frozen contract test suite the envelope currently passes, and a disposition ADR for the composition as a whole.
* **Phase A½ — Shared libraries next** *(before their consumers)*. Onboard each shared library identified in Step 2f as its own full Steps 0–7 project. Prioritize by **consumer count × change frequency × CVE/EOL score**. Until a lib has its own gate passed (Step 7), any consumer re-hydration is building on sand. Libraries get their own Step 4c Strangler Fig (Facade + SemVer + `v-legacy`/`v-next` coexistence) and their own Consumer-Driven Contract gate.
* **Phase B — Per-frame onboarding in parallel**. Each frame runs the **full** Steps 0–7 as an independent project, prioritized by risk (EOL stack, CVE load, `QUIRKS.md` volume), business value, and blocking relationships. Frames can and should onboard in parallel — the envelope contracts (Phase A) and library contracts (Phase A½) are the shared safety net. **Invariant:** every frame-level PR must keep the Phase A cross-frame contract tests and the Phase A½ CDC tests green.
* **Phase C — Envelope full re-hydration**. Once ~60–70% of frames have passed their own gate, run Steps 3–7 on the shell itself: characterization + contract tests on routing/auth/session/focus, observability spanning frames (propagate `traceparent` through `postMessage`), optional Strangler Fig at the composition level (iframes → Module Federation or single SPA) if the Phase A disposition was Replatform, and the final system-level Agent-Readiness gate.

Every onboarding unit (each frame, each shared library, and finally the envelope) gets its own Step 7 gate. The system-level gate in Phase C is additional, not a replacement.

## **Step 3 — Layered Test Baselining (The Safety Net)**

*Crucial: do not proceed to logic extraction without this step.*

A single E2E suite is insufficient. Build a layered safety net that captures *actual* behavior — bugs and all:

| Layer | Purpose | Representative Tooling |
| :---- | :---- | :---- |
| Approval / Snapshot | Pin current outputs of pure functions and renderers | `approvaltests`, Jest snapshots |
| Characterization unit | Capture branch behavior at discovered seams (Feathers) | JUnit, Pytest + `pytest-cov`, Vitest |
| Agentic test generation | Bulk-seed characterization tests | **Diffblue Cover** (JVM), **EvoSuite**, **Pynguin**, CodiumAI, Superpowers, Meta TestGen-LLM patterns |
| Contract | Freeze API/DB/event boundaries | **Pact**, **Schemathesis** |
| Consumer-Driven Contract (CDC) | Freeze the subset of a shared lib's / provider's API each consumer actually uses | **Pact** (provider + consumer side), Schemathesis, Storybook visual-regression per consumer (Chromatic, Percy, Playwright screenshots) for UI component libs |
| E2E / journey | User-visible regression net | **Playwright** (primary), Cypress |
| Mutation (post-baseline) | Verify the safety net actually catches bugs | **Stryker**, **PIT**, **mutmut** |

**Exit criterion for this step:** characterization suite 100% green on current `main`, and a published baseline mutation score on modules targeted for Step 5 extraction.

## **Step 4 — Strangler Fig Wrapping (Architectural "Clean Sandbox")**

*Explicitly apply Fowler's **Strangler Fig** pattern at the module/service boundary.*

* Follow the `framework/04-architecture.md` "Clean Sandbox" strategy: have agents map strict API/JSON contracts around the legacy logic, treating it as a black box.
* Freeze the boundary with contract tests (Step 3) so the sandbox becomes a verifiable seam.
* **DO NOT** let agents modify code *inside* the sandbox in this step — only wrap.

### 4a. Iframe / Micro-Frontend Strangler Fig

For UIs inventoried in Step 2e, each frame is **already a de-facto Strangler Fig boundary** — formalize it:

* Freeze the frame's external contract (postMessage events, URL params, storage keys, auth handoff) with Playwright cross-frame and Pact-style schema tests **before** any replacement work begins.
* Replace frames one at a time behind the frozen contract. The rest of the composed UI does not change.
* Use Web Components or a thin design-system shim as the neutral interop layer so a new React/Vue/Svelte frame can drop into a slot currently occupied by an AngularJS frame without breaking siblings.

### 4b. Dependency Quarantine (Anti-Corruption Layer for Dead 3rd Parties)

For unsupported or EOL libraries flagged in Step 2c, do **not** let them leak through the codebase:

* Wrap each unsupported 3rd-party behind a thin **Anti-Corruption Layer** (DDD term) / ports-and-adapters boundary so the rest of the codebase depends on *your* interface, not the dead library's API surface.
* Freeze the ACL with contract tests. Now the library is replaceable in isolation — this is the Strangler Fig pattern applied to *libraries*, not services, and it is the prerequisite for eventual removal.
* Record each quarantine wrapper in `TECH_DEBT.md` with an intended successor and target removal date.

### 4c. Shared Library Strangler Fig (Facade + SemVer + Multi-Version Coexistence)

The Strangler Fig pattern applied at the **library** boundary (not service, not iframe). Required for any shared library baselined in Step 2f:

* **Facade module** — expose the library's current surface as an explicit `v-legacy` facade and a `v-next` module alongside. Consumers migrate one at a time behind the frozen facade; this is literally **Branch by Abstraction** applied at the package boundary.
* **SemVer + published deprecation policy** — publish a SemVer contract and a written deprecation window for `v-legacy`. Automate releases (Changesets, semantic-release) and automate consumer upgrades (Renovate, Dependabot).
* **Consumer-Driven Contracts gate** — every consumer's CDC (Step 3 row) must be green for the lib's Step 7 gate to pass. The CDC matrix covers every consumer version still in production, which is how multi-version retirement stays safe.
* **Boundary enforcement** — lint/compile-time rules (`eslint-plugin-boundaries`, ArchUnit, Dependency-Cruiser, package `exports`) so consumers cannot reach past the facade into internal paths (`lib/src/internal/...`). Enforce **before** agents get write access.
* **For UI component libs** — Storybook stories + visual regression (Chromatic, Percy, Playwright screenshots, BackstopJS) + axe-core per story become the characterization layer; each consumer records its own visual-regression baseline.
* **Quarantine → shared lib watch-out** — when a Step 4b ACL around a dead 3rd-party grows into a reusable internal lib, re-enter this step from Step 2f so the cure does not become the next disease.

## **Step 5 — Seams & Logical Extraction (Code-Level)**

*Apply Feathers' **Seams** and Hammant's **Branch by Abstraction** for in-place refactoring.*

* **Logical Spec Generation:** Use a **spec-generation agent** (e.g., ChatPRD, Stoplight, Redocly, Mintlify, or auto-generated OpenAPI from annotations) to scan the *newly wrapped* functions and emit JSON schemas, sequence diagrams, and Mermaid charts into `SPEC.md`.
* **UI Tokenization:** Use a **design-token extraction tool** (e.g., **Builder.io**, **Style Dictionary**, **Figma Tokens / Tokens Studio**, Locofy, Penpot) to scan the existing CSS/UI and export a token library. Enforce these tokens so agents use existing brand standards instead of hallucinating new ones. **For heterogeneous / iframe-federated UIs (Step 2e):** extract tokens **per frame**, then reconcile into a shared token set — so replacing one frame cannot silently change colour, spacing, or typography for the others.
* Extract logic only behind seams protected by Step 3 tests; verify each extraction with mutation score deltas.

## **Step 6 — Observability Backfill**

*A re-hydrated legacy system without telemetry is still opaque.*

Instrument the wrapped legacy boundary (Step 4) with:

* **OpenTelemetry** traces, **RED** (Rate / Errors / Duration) and **USE** (Utilization / Saturation / Errors) metrics, and structured logs.
* A backend capable of high-cardinality exploration — **Grafana Tempo/Loki/Mimir**, **Honeycomb**, **Datadog**, or equivalent.
* **Federated-UI tracing** — propagate `traceparent` (W3C Trace Context) across the `postMessage` boundary and through the envelope's routing/auth handoff, so a single distributed trace spans every frame. Without this, Step 6 stops at the frame edge and the envelope remains opaque.
* **Shared-library telemetry** — libraries rarely emit telemetry directly. Add structured logs + OTel spans at library entry points for hot paths; otherwise regressions show up only in consumers' dashboards and look like consumer bugs.

This converts "did the agent break it?" from a guess into a measurable signal, enforcing **Principle 11 (Observability as Verification)** and pre-wiring Stage 7 of the iSDLC.

## **Step 7 — The "Agent-Readiness" Gate**

The onboarding is not "Done" until the project passes the **Definition of Ready**. The gate is a **measurable scorecard**, not a vibe check:

| Criterion | Threshold |
| :---- | :---- |
| 60-Second Onboarding — cold agent reads `README` → produces correct project summary | Pass / Fail |
| Characterization test suite green on `main` | 100% |
| Mutation score on critical modules | ≥ 60% |
| SBOM, vuln scan, secret scan wired into CI | Required |
| OpenTelemetry traces visible at the Clean Sandbox boundary | Required |
| Pilot task — agent-generated PR for a small, well-defined bug/feature merged with ≤ 1 human revision round | Pass / Fail |
| Context bundle size (tokens required to onboard) | < target model context window |

If any criterion fails, re-hydration is incomplete. Fix and re-run the gate.

## **Step 8 — Graduation into the 7-Stage iSDLC**

Once the gate passes, the project formally enters the standard 7-stage iSDLC (see [`PROCESS.md`](./PROCESS.md)). Re-hydration artifacts become **first-class, living inputs** to the lifecycle — not throwaway scaffolding:

* Retroactive ADRs feed **Stage 4 (Architecture)**.
* `SPEC.md`, `ROADMAP.md`, and personas feed **Stages 1–3 (Goals / Requirements / Design)**.
* Characterization + mutation suites feed **Stage 5 (Coding/CI/Testing)**.
* OpenTelemetry instrumentation feeds **Stage 7 (Observability)**.
* `STATE.md` is seeded with current position, deferred re-hydration items, and rules learned (per [`AGENTS.md`](./AGENTS.md) Rule 9).

## **DO NOT / Scope Limits**

* **DO NOT** grant agents repo access before Step 2c (security baseline) completes and secrets are rotated.
* **DO NOT** let agents refactor *inside* the Clean Sandbox (Step 4) until characterization tests (Step 3) are green and observability (Step 6) is live.
* **DO NOT** skip the disposition ADR (Step 0) — re-hydrating a system destined for retirement is pure waste.
* **DO NOT** treat a single E2E suite as a sufficient safety net — the layered pyramid in Step 3 is mandatory.
* **DO NOT** couple the methodology to a single vendor; every tool reference in this doc is a *capability*, with the named tool as one option among several.
* **DO NOT** let agents "clean up" unexplained behaviors until they are cross-checked against `QUIRKS.md` and confirmed with end users — what looks like a bug may be a contract.
* **DO NOT** replace an iframe / micro-frontend until its cross-frame contract (Step 2e) is captured and frozen with tests — sibling frames will break in non-obvious ways otherwise.
* **DO NOT** let unsupported 3rd-party libraries leak through the codebase; quarantine them behind an Anti-Corruption Layer (Step 4b) before any agent-driven refactor touches call sites.
* **DO NOT** onboard a frame (Phase B) whose critical shared libraries have not yet passed their own Step 7 gate (Phase A½) — you will bake assumptions you cannot later verify.
* **DO NOT** change a shared library's public API without a Consumer-Driven Contract test covering every impacted consumer version in production.
* **DO NOT** allow consumers to import from a shared library's internal paths (`lib/src/internal/...`); enforce with lint / ArchUnit / Dependency-Cruiser / package `exports` before agents get write access.
* **DO NOT** treat "bump the shared lib" as a trivial agent task — it is a **fan-out change** and must pass the CDC gate before merge.
* **DO NOT** merge a per-frame re-hydration PR that breaks a Phase A cross-frame contract test or a Phase A½ CDC test, even if the frame's own tests are green.
* **DO NOT** defer the envelope to the end ("big-bang shell rewrite"); freeze its contracts first (Phase A), re-hydrate it fully last (Phase C).

## **Onboarding Checklist**

| # | Task | Action | Owner | Tool Category | Target Output |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 0 | Disposition | TIME / 7Rs triage | Human (Product + Architecture) | — | `docs/adr/NNN-disposition-<system>.md` |
| 1 | Context Recovery | Codebase scan + intent research | Agent + Human reviewer | Repo-ingestion + Deep-research | Personas & Intent docs |
| 2a | Contract Baseline | Retroactive `/seed` run | Agent + Human reviewer | Spec-generation | `SPEC.md` & `ROADMAP.md` |
| 2b | Quality Baseline | Static analysis + hotspot scan | Agent | Code-quality + Hotspot | Baseline metrics in `TECH_DEBT.md` |
| 2c | Supply-Chain Baseline | SBOM + vuln + secret + license scan | Human-accountable | SCA + Secret scan + License | SBOM, CVE inventory, rotated secrets |
| 2d | Interface Baseline | Schema + API discovery | Agent | Schema + Contract | Frozen OpenAPI / schema docs |
| 2e | UI Topology Baseline | Per-frame inventory + cross-frame contract capture | Agent + Frontend owner | Micro-frontend + Cross-frame contract + a11y | Frame inventory, postMessage/URL/storage contracts, a11y baseline |
| 2f | Shared Library Topology | Consumer inventory + version matrix + public/internal/accidental-API classification | Agent + Library owner | Consumer discovery + Boundary enforcement | Per-lib inventory, version matrix, API classification |
| 3 | Safety Net | Layered test generation (incl. CDC for shared libs) | Agent | Characterization + Contract + CDC + E2E + Mutation | Green pyramid + mutation score |
| 4 | Architectural Wrap | Strangler Fig boundary | Agent + Architect | Architecture reconstruction | Clean Sandbox contracts |
| 4a | Iframe/MFE Wrap | Freeze cross-frame contract per frame | Agent + Frontend owner | Micro-frontend + Contract testing | Per-frame frozen contract tests |
| 4b | Dependency Quarantine | Anti-Corruption Layer around EOL libs | Agent + Architect | Anti-Corruption Layer | ACL wrapper + removal target in `TECH_DEBT.md` |
| 4c | Shared Library Strangler Fig | Facade + SemVer + CDC + boundary enforcement | Agent + Library owner | Release automation + CDC + Boundary enforcement | `v-legacy`/`v-next` coexistence, green CDC matrix, deprecation policy |
| 5 | Logic Mapping | Spec + token extraction | Agent | Spec-generation + Design-token | `SPEC.md` schemas, Design Tokens |
| 6 | Observability Backfill | OpenTelemetry instrumentation | Agent + SRE | Tracing + Metrics + Logs | RED/USE dashboards at the seam |
| 7 | Verification Gate | Pilot agent task + scorecard (per-unit: each frame / each shared lib / envelope) | Human-accountable | — | Per-unit + system-level passing scorecard |
| 8 | Graduation | Hand off to 7-stage iSDLC | Human | — | Seeded `STATE.md`, entry into `PROCESS.md` flow |

## **Tool Reference Appendix**

Capability-first; each row lists ≥ 2 alternatives so the methodology survives tool churn.

| Capability | Representative Tools |
| :---- | :---- |
| Repo ingestion for LLMs | NotebookLM · Sourcegraph Cody · Cursor `@codebase` · `aider --repo-map` · `repomix` · `gitingest` · Claude Projects |
| Codebase understanding / call graphs | Sourcegraph · `tree-sitter` + `ast-grep` · Understand (SciTools) · Dependency-Cruiser · Madge |
| Hotspot / behavioral analysis | CodeScene · `git-of-theseus` · `lizard` |
| Deep research | Gemini Deep Research · ChatGPT Deep Research · Perplexity Deep Research · Glean · Dust |
| Persona / analytics synthesis | Internal RAG over CRM/support · product analytics exports |
| Characterization test generation | Diffblue Cover · EvoSuite · Pynguin · CodiumAI · Superpowers · TestGen-LLM patterns |
| Contract testing | Pact · Schemathesis · Optic |
| E2E testing | Playwright · Cypress |
| Mutation testing | Stryker · PIT · mutmut |
| Code quality baseline | SonarQube / SonarCloud · Qodana · CodeClimate |
| Architecture reconstruction | Structurizr · IcePanel · ArchUnit |
| Spec generation | ChatPRD · Stoplight · Redocly · Mintlify · `tsoa` / FastAPI auto-OpenAPI |
| Design tokens / UI extraction | Builder.io · Style Dictionary · Figma Tokens / Tokens Studio · Locofy · Penpot |
| SBOM | Syft · CycloneDX · GitHub Dependency Graph |
| Vulnerability scan | Trivy · Grype · OSV-Scanner · Snyk · Dependabot |
| Secret scan | Gitleaks · TruffleHog · GitHub Secret Scanning |
| License audit | FOSSA · ScanCode Toolkit |
| Schema discovery | SchemaSpy · DbSchema · Atlas (Ariga) |
| Observability backfill | OpenTelemetry SDKs · Grafana Tempo/Loki/Mimir · Honeycomb · Datadog |
| End-user knowledge capture | Structured interviews · support-ticket mining · Dovetail · Maze · internal survey tooling |
| Micro-frontend / frame federation | Module Federation (Webpack 5) · single-spa · Web Components · iframe-resizer |
| Cross-frame contract testing | Playwright (cross-frame) · Pact · postMessage schema validators (Zod / Ajv / JSON Schema) |
| UI a11y baseline | axe-core · Pa11y · Lighthouse CI |
| Dependency health / EOL tracking | endoflife.date · OpenSSF Scorecard · Libraries.io · deps.dev · Socket.dev · Renovate · Dependabot |
| Anti-Corruption Layer patterns | Hexagonal / Ports-and-Adapters · DDD ACL · facade/adapter libs |
| Consumer / usage discovery (shared libs) | Sourcegraph · `npm ls` / `yarn why` · `jdeps` · `pipdeptree` · `ast-grep` · Dependency-Cruiser · Madge |
| Visual regression (UI component libs) | Chromatic · Percy · Playwright screenshots · BackstopJS · Loki (Storybook) |
| Boundary enforcement (shared libs) | ArchUnit · Dependency-Cruiser · `eslint-plugin-boundaries` · package `exports` maps · TypeScript project references |
| Release automation (shared libs) | Changesets · semantic-release · Renovate · Dependabot |
| Consumer-Driven Contract testing | Pact · Schemathesis · Storybook + visual-regression consumers |
| Distributed tracing across frames | W3C Trace Context (`traceparent`) · OpenTelemetry JS SDK · `postMessage` context propagators |
