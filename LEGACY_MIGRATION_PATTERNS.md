# **Legacy Migration Patterns**

*A pattern-oriented companion to [`LEGACY_ONBOARDING.md`](./LEGACY_ONBOARDING.md).*

## **Purpose**

[`LEGACY_ONBOARDING.md`](./LEGACY_ONBOARDING.md) describes the **full 0–8 re-hydration flow** as a linear playbook. This document answers a narrower, recurring question:

> *"I have a component that is **inactive**, **too complex**, **too risky**, or that I simply **don't want to touch** right now — how do I bring it under iSDLC governance without rewriting it?"*

The patterns below are extracted and re-framed from the normative steps in `LEGACY_ONBOARDING.md`. Each pattern cross-references its source step.

**Normative vs. reference:** `LEGACY_ONBOARDING.md` is authoritative. If this document ever drifts from it, the onboarding doc wins.

**When to read this instead of `LEGACY_ONBOARDING.md`:**

* You already know the onboarding flow and need a lookup guide.
* You are dealing with a **single component**, not a whole system.
* You want to onboard the *boundary* of a component and defer its internals — possibly forever.
* You are integrating an acquired codebase or a third-party system and need to decide how much to touch.

---

## **The Core Insight: Wrapping ≠ Rewriting**

The entire re-hydration flow is built on one principle: **you do not have to modify a component to onboard it**. A component you never want to touch can still be brought under iSDLC governance at its **boundary**. Its internals can remain a black box — stable, observable, and safe — indefinitely.

Full re-hydration (Steps 5–8 of `LEGACY_ONBOARDING.md`) is **optional**. The Strangler Fig boundary + characterization tests + observability at the seam is a **complete, safe resting state**.

---

## **Pattern 1 — Disposition First: Maybe Don't Migrate It At All**

*Source: `LEGACY_ONBOARDING.md` Step 0.*

Before investing effort, run the **TIME / 7Rs triage**:

| Decision | What it means |
|---|---|
| **Tolerate / Retain** | Wrap it, observe it, leave internals alone |
| **Migrate / Refactor** | Full re-hydration flow |
| **Eliminate / Retire** | Don't re-hydrate — plan removal instead |

> A component that is inactive and low-risk may be best classified as **Tolerate**: wrap it, freeze its contract, and move on. Re-hydrating a system destined for retirement is pure waste (see the DO NOT rule in `LEGACY_ONBOARDING.md`).

**Output:** `docs/adr/NNN-disposition-<component>.md` — a written decision so agents (and future humans) never accidentally touch it.

---

## **Pattern 2 — The Strangler Fig: Wrap Without Touching**

*Source: `LEGACY_ONBOARDING.md` Step 4 (and Step 4a for UI frames).*

This is the primary pattern for "too complex / don't want to touch" components:

1. **Treat the component as a black box.** Build a clean API/interface boundary *around* it — not inside it.
2. **Freeze the boundary with contract tests** (Pact, Schemathesis) — now any change to the internals is immediately visible.
3. **Stop there.** The component is now iSDLC-governed at its boundary. Internals remain untouched.

The Strangler Fig boundary becomes a **verifiable seam**: callers go through the new interface, the old code runs unchanged inside. You've created the safe handover point without a single line changed inside the component.

For **UI components / micro-frontends** (Step 4a), freeze the `postMessage` / URL / storage contract with Playwright cross-frame tests. The frame's internals are never touched.

---

## **Pattern 3 — Characterization Tests: Lock In Current Behavior Without Understanding It**

*Source: `LEGACY_ONBOARDING.md` Step 3.*

For components too complex to reason about:

* **Characterization tests** (Feathers' Seams) don't require you to understand the code — they pin down *what it currently does*, including its bugs.
* Use **agentic test generation** tools (Diffblue Cover, EvoSuite, Pynguin, CodiumAI) to bulk-generate these tests without manual analysis.
* Once green, any future change — intentional or accidental — shows up as a test diff.

> You're not testing what it *should* do. You're locking in today's behavior so any future change is a deliberate, visible diff.

This is the safety net that makes the component safe to leave alone — and safe to eventually touch.

---

## **Pattern 4 — Anti-Corruption Layer: Quarantine Without Replacement**

*Source: `LEGACY_ONBOARDING.md` Step 4b.*

For components with **EOL dependencies or unsupported libraries** that you can't immediately replace:

1. Wrap the problematic dependency behind a thin **Anti-Corruption Layer** (ACL / ports-and-adapters).
2. The rest of the codebase depends on *your* interface, not the dead library's API.
3. Record the quarantine in `TECH_DEBT.md` with an intended successor and target removal date.

The component is now isolated. Agents can work around it safely. Replacement happens in one place when the time comes.

---

## **Pattern 5 — Branch by Abstraction: In-Place Refactoring Without Big-Bang Rewrites**

*Source: `LEGACY_ONBOARDING.md` Step 5 (and Step 4c for shared libraries).*

For components you eventually *do* want to modernize but can't rewrite all at once:

1. Introduce an **abstraction layer** over the old implementation.
2. Build the new implementation behind the same abstraction.
3. Run both in parallel (often behind a feature flag).
4. Delete the old implementation only when the new one is proven.

This is the in-place cousin of Strangler Fig — no risky big-bang rewrite, no flag day. For shared libraries, this takes the form of a `v-legacy` / `v-next` facade (Step 4c).

---

## **Pattern 6 — Selective Prioritization in Federated Systems**

*Source: `LEGACY_ONBOARDING.md` — "Applying This to Federated UIs" (Phases A / A½ / B / C).*

If your system has multiple components (frames, services, shared libs), the methodology explicitly supports **parallel, risk-prioritized onboarding**:

* **Phase A** — Freeze the envelope/shell contracts first (lightweight, no internals touched).
* **Phase A½** — Onboard shared libraries before their consumers.
* **Phase B** — Onboard individual frames/components in parallel, **prioritized by**:
  * EOL stack / CVE load (highest risk first)
  * Business value
  * Blocking relationships
* **Phase C** — Full envelope re-hydration last.

Components that are **inactive or low-risk** simply sit at the bottom of the Phase B queue. They are protected by the Phase A contract tests and can wait indefinitely — or be classified as Tolerate in Pattern 1 and never fully re-hydrated.

**Invariant:** every PR on any component must keep the Phase A cross-frame contract tests and Phase A½ CDC tests green, even if the component itself hasn't been re-hydrated yet.

---

## **Pattern 7 — Observability Without Code Changes**

*Source: `LEGACY_ONBOARDING.md` Step 6.*

For components you can't instrument internally, add telemetry **at the boundary** (the Strangler Fig wrapper from Pattern 2):

* OpenTelemetry traces at the wrapper entry/exit points.
* RED metrics (Rate / Errors / Duration) on the boundary.
* Structured logs at the seam.

You now have visibility into whether the component is healthy — without touching its internals. "Did the agent break it?" becomes a measurable signal, not a guess.

---

## **Decision Tree: Which Pattern for Which Situation?**

```
Is the component inactive and low-value?
  └─ Yes → Pattern 1: Disposition ADR → Tolerate or Retire. Stop.
  └─ No ↓

Is it too complex/risky to touch internally?
  └─ Yes → Pattern 2: Strangler Fig wrap + Pattern 3: Characterization tests. Internals untouched.
         → Pattern 4: ACL if it has EOL dependencies.
         → Pattern 7: Observability at the boundary.
  └─ No ↓

Do you want to modernize it eventually but not now?
  └─ Yes → Pattern 2: Wrap it now. Pattern 5: Branch by Abstraction when ready.
  └─ No → Tolerate: wrap, freeze contract, leave in TECH_DEBT.md queue.
```

---

## **The Key Rule**

> **Security before access, tests before refactoring, boundaries before replacement, observability before trust.**

You can bring any component under iSDLC governance at the **boundary level** (Patterns 1–4 + 7) without ever touching its internals. Full re-hydration (Patterns 5 and beyond — `LEGACY_ONBOARDING.md` Steps 5–8) is optional and can be deferred indefinitely for components that are stable, inactive, or too risky to touch.

---

## **See Also**

* [`LEGACY_ONBOARDING.md`](./LEGACY_ONBOARDING.md) — the normative end-to-end re-hydration flow (Steps 0–8).
* [`PRACTICES.md`](./PRACTICES.md) — operational principles (especially Principles 6, 10, 11).
* [`TECH_DEBT.md`](./TECH_DEBT.md) — where quarantined components and deferred re-hydration items are recorded.
* [`AGENTS.md`](./AGENTS.md) — universal agent instruction set; Rule 4 (60-Second Onboarding) motivates boundary-first wrapping.
