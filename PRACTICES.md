# PRACTICES.md: Operational Principles & Practices

*The operational specification behind the [iSDLC Manifesto](./MANIFESTO.md).*

The **Intelligent Software Development Life Cycle (iSDLC)** is governed by a shift from "Human-Only" to "Human-Agent" collaboration. In the agentic era, autonomous agents act as first-class collaborators in a **symphonic orchestration model** where humans set intent and manage scale while specialized agents execute multi-step workflows governed by versioned context.

These principles define the concrete rules, thresholds, and practices that enforce the values declared in the Manifesto.

## 1. Human Accountability (The Management Scale-Multiplier)

* **Principle:** Accountability is a non-delegable human trait. AI produces artifacts; humans own the outcomes. In the agentic era, management ensures its own accountability by defining "hooks of control" (e.g., User Impact, E2E Testing) that allow humans to verify outcomes without becoming a bottleneck.
* **Motivated Individuals:** Connect to the principle of building projects around motivated individuals; give them the environment and AI support they need, and trust them to get the job done.
* **Audit Multi-Tooling:** Accountability must be enforced using different tools and models than those used for code creation to prevent "blind trust." For example, if one model builds a feature, an independent audit agent using a different model must validate the logic.
* **Tiered Gating:** Define clear decision boundaries where low-stakes changes move autonomously while high-stakes logic (security, data) triggers a human-in-the-loop barrier.
* **Alignment:** If a human cannot explain the *logic* (the "why") behind an AI's output, it is technical debt and must be rejected.

## 2. Plan Clarity as a Prerequisite for Agent Execution
Agents are only as good as the plans they execute. A vague plan produces vague, drifting output. A precise plan with explicit boundaries produces focused, correct work.

* **The Plan-Ready Rule:** Before any agent begins execution, a plan must exist that contains: (1) a clear **objective** with goal, purpose, and expected output; (2) **acceptance criteria** in Gherkin format; (3) explicit **boundaries** — what is in scope AND what must not be touched; (4) sufficient **context** — references to prior decisions, relevant files, and constraints.
* **Boundary-Driven Scope:** The most impactful part of a plan is often the "DO NOT" list. Agents without explicit boundaries will over-engineer, refactor adjacent code, or introduce unnecessary dependencies. Scope limits prevent drift.
* **Phased Decomposition:** Large initiatives must be decomposed into phases, each with an independent goal that delivers usable value. Within each phase, individual plans should be small enough for a single agent session. Field experience shows that plans exceeding ~300 lines lose agent focus.
* **If the Plan Isn't Agent-Ready, It Isn't Ready:** If an agent cannot execute a plan without extensive clarification, the plan is the bottleneck — not the agent.


## 3. Radical Simplicity as The iSDLC Core

Simplicity is the ultimate filter for quality, accountability, and elegance. In the iSDLC, we do not tolerate "clever" solutions. If a solution is not simple, it is not finished.

### Simplicity as the Foundation of Accountability
You cannot be accountable for what you do not understand.
* **Human-Agent Gap:** AI can generate 1,000 lines of complex code in seconds. If that code is not simple, the human "Pilot" loses the ability to perform the Human Validation Protocol (HVP).
* **The Rule:** If a human cannot explain the logic of a module to another human in under 2 minutes, the AI-generated output must be rejected and refactored for simplicity.
* **Standardized Patterns:** Favor standardized patterns and clear logic over brittle, instruction-heavy prompts.

### Simplicity for Solution Elegance & User Acceptance
* **Elegance:** True elegance is the removal of the non-essential. We use AI to identify and prune redundant logic and features.
* **User Acceptance:** Simple interfaces (UI) and predictable workflows reduce cognitive load. We use AI to "Simulate Simplicity"—testing if a synthetic persona can complete a task with the minimum number of clicks.

## 4. Bot-Ready Context as Measure of Progress

* **Principle:** Working software is an incomplete metric. The new measure of progress is **Working Software + Immediate Bot Context Restoration**.
* **Practice:** A feature is only "Done" when the repository contains the instructions (e.g., [`AGENTS.md`](./AGENTS.md)) and indexing (e.g., [`llms.txt`](./llms.txt)) required for a new agent to onboard and continue the work instantly.
* **Goal:** Minimize "Context Debt." A task is not "Done" unless an AI agent can ingest the updated documentation/codebase and contribute a follow-up feature within 60 seconds of "reading" the state.
* **Token Efficiency:** Prioritize moderate token consumption through "Just-in-Time" context retrieval and lightweight identifiers instead of full-file reads.

### Structured State Management (The "Resume-Ready" Rule)
Field experience shows that agent effectiveness degrades sharply when project state lives only in conversation history or human memory. The repository must maintain **living Markdown state files** that enable any agent — the original, a replacement, or a parallel collaborator — to resume work without a briefing.

**Required State Artifacts:**
* **Project Definition** (`PROJECT.md` or equivalent): Product vision, target users, constraints, key decisions with rationale and dates, success metrics, tech stack. Updated when requirements or context change.
* **Roadmap** (`ROADMAP.md`): Phased delivery plan with goals per phase, dependencies, scope, and completion status. Each phase must have a clear goal statement that justifies its existence independently.
* **Project State** (`STATE.md`): Current position (milestone, phase, plan), accumulated decisions, deferred issues, learned rules, and a **Project Continuity** block (last session date, where work stopped, next action, resume file pointer).

**Key Rules:**
* State files are updated after every significant action, not batched at milestones.
* Accumulated decisions and hard-won rules (e.g., migration pitfalls, framework quirks) must be captured in state — these are the lessons that prevent repeated failures.
* A new agent reading only the state files must be able to answer: *What are we building? Where are we? What's next? What have we learned the hard way?*

## 5. Customer-Centricity via Human UX Review Loop (Field-Tested)
Agents produce functional output, but they do not experience the product as a user does. Field experience demonstrates that **agent-built features require deliberate human UX review and iteration** to create the right user experience.

* **Agent Output Is a First Draft:** Treat every agent-generated feature as a working prototype, not a finished product. The human must use the feature as an end user would — navigate it, feel the flow, notice friction.
* **Review-Refine Cycle:** After each unit of agent work, the human reviews the output for UX quality (not just correctness), identifies improvements, and directs the agent to refine. This cycle may repeat multiple times per feature.
* **Post-Phase Hardening:** At phase boundaries, conduct a dedicated session to address accumulated UX debt — small issues individually deferred but collectively degrading the experience.
* **Record Deviations:** When agent output deviates from the plan or human review reveals needed changes, capture these in summaries. These deviations are learning signals, not failures — they inform better plans for subsequent work.

## 6. Evolutionary Sustainability & Transparency
* **Principle:** A sustainable project is one that can evolve indefinitely without becoming a "legacy tomb." We build systems that remain human-comprehensible.
* **Zero-Debt Infrastructure:** Utilize Specification-Driven Development (SDD) to ensure the "thinking" behind the code is captured and versioned in [`SPEC.md`](./SPEC.md).
* **Transparency:** No "Black Box" logic. AI-generated code must follow strict style guides and include "Intent-Based Documentation" (IDD). We ensure the energy and compute cost of our AI workflows provide a positive ROI for the product's lifecycle.
* **Tech Debt Tracking:** Maintain a live log of technological debts in [`TECH_DEBT.md`](./TECH_DEBT.md) updated at release time.

## 7. Self-Contained Agentic Teams

* **Principle:** Teams are "symphonic" units composed of one human orchestrator and a crew of specialized agents (Architect, Security, QA, SRE) treated as team personas in the RACI matrix.
* **Practice:** Teams must be vertically integrated, possessing the autonomy and the AI-tooling stack to move from "Goal" to "Production." A team is responsible for its own "Agent-Ops"—the set of prompts, custom GPTs, or local models used to maintain their specific domain.
* **Agile Spirit:** The methodology maintains agility through change-friendliness, continuous updates, and high-bandwidth human-agent communication intervals.

## 8. Radical Modularity (The AI "Cognitive" Constraint)
Modularity is not an architectural preference; it is a requirement for AI performance. AI agents operate within a **Context Window**. The larger the file or the more coupled the system, the more the AI's "reasoning" degrades.

### Modularity is Mandatory for AI:
1. **Focus:** An agent is 10X more effective at fixing a bug in a 50-line isolated module than in a 500-line coupled one.
2. **Parallelization:** High modularity allows multiple independent agents to work on different parts of the system simultaneously without merge conflicts.
3. **Verification:** Modular code is inherently testable. Small modules allow for targeted, AI-generated unit tests that provide coverage of all critical paths and edge cases with minimal compute cost.

### The "Context capsule" Rule:
Every module must be designed such that a specialized AI agent can understand, test, and refactor it without needing to "read" the rest of the repository.

#### Practical Implementation:
* **Max File Size:** Enforce a strict 200-line limit for logic files.
* **Strict Interfaces:** Use Type Definitions or Schemas (JSON/Protobuf) to define how modules talk. The "internals" of a module should be a black box to other modules, but a "glass box" to the owner agent.
* **Decoupling over DRY:** In the AI era, we occasionally favor duplication over complex abstractions (AHA - Avoid Hasty Abstractions) because abstractions are harder for agents to navigate than flat, simple structures. Duplication is acceptable only when each copy is independently tested.
* **Manageable Complexity:** Favor semantic code signals and standardized folder hierarchies that provide strong environmental cues to both humans and bots.

## 9. Agility 2.0 (Change-Friendliness)
* **Principle:** In the AI era, the cost of refactoring is lower, but the risk of drift is higher.
* **Practice:**
    * **Continuous Updates:** We deploy small, verifiable increments. Each increment must ship with its test suite. An increment without tests is not verifiable and therefore not deployable.
    * **Direct Value Link:** Every technical task must have a traceable link to business value.
    * **Face-to-Face (Human) Communication:** High-bandwidth human discussion remains the primary method for resolving "Ambiguity" where AI logic fails.

## 10. Testability as a Non-Negotiable Contract
* **Principle:** Every feature, fix, or refactor is only "Done" when it is covered by automated tests. Tests are not an afterthought — they are the *specification*.
* **Practice:**
    * **Test-First by Default:** AI agents must generate a failing test *before* generating the implementation (TDD loop). If you cannot write a test for a module, it is too coupled — reject and refactor.
    * **Positive Dominance:** Mandatory "Positive-First" policy. Agents prioritize a system that does its job properly (Positive Flows) before generating or prioritizing negative tests, except when related to critical security probes.
    * **Regression Gate:** No PR is merged if it reduces test coverage below the module's baseline. The CI pipeline is the enforcer, not the human reviewer.
    * **AI-Generated Test Audits:** Periodically, an AI agent runs a mutation testing pass to verify that tests actually *catch* bugs, not just execute code.
    * **E2E as Living Documentation:** E2E tests double as executable specs, describing *what the system does* in plain language — reducing Context Debt (Principle 3).
* **Standard Test Stack (The Pyramid):**

| Layer | Tool | Owner | When to Run |
|---|---|---|---|
| **Unit** | `vitest` | AI Agent (auto-generated) | On every save |
| **API / Integration** | `Playwright API` | Human + AI pair | On every PR |
| **E2E (UI)** | `Playwright UI` | Human-led, AI-assisted | Critical journeys only |

* **The Pyramid Rule:** If a Playwright API test already covers the behavior, no UI E2E test is needed for the same path. Keep the stack lean and fast.
* **Alignment:** Reinforces Principle 1 (HVP — a failing test pinpoints exactly what broke), Principle 2 (untestable code signals over-coupling), and Principle 7 (tests are the primary drift detector).
