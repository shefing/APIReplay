# The iSDLC Manifesto

*An amendment to the [Agile Manifesto](https://agilemanifesto.org/) for the Agentic Era*

---

We are uncovering better ways of developing software by doing it — now alongside autonomous agents — and helping others do it. Through this work we have come to value:

- **Human Accountability & Managed Context** *over Individuals and interactions*

- **Verifiable Software & Agent-Ready Context** *over Working software*

- **Shared Strategic Intent** *over Customer collaboration*

- **Architectural Fluidity** *over Responding to change*

That is, while there is value in the items on the right, we value the items on the left more.

---

## Why Amend the Manifesto?

The original Agile Manifesto (2001) assumed every participant was human. In the agentic era, autonomous AI agents are first-class collaborators — they participate in planning, write code, run tests, refactor systems and monitor productions. The four original values remain necessary but no longer sufficient. Each iSDLC amendment extends a classic value to account for the new reality that **interactions now include agents, software must be verifiable by both humans and machines, collaboration must operate at the level of intent, and change must be architecturally enabled — not merely welcomed**.

---

## The Four Values — Annotated

### 1. Human Accountability & Managed Context *over Individuals and Interactions*

Interactions now include agents. Without a human "Pilot" taking comprehensive responsibility and disciplined context management, hyperactive agents are generating technical entropy. Accountability is a non-delegable human trait: AI produces artifacts, humans own outcomes. If the human responsible cannot explain the *logic* behind an AI's output, it is technical debt. Without well structured and maintained context, agents will underperform because of context rot and consume endless tokens.

### 2. Verifiable Software & Agent-Ready Context *over Working Software*

With Agents help, automatic testing from unit test to end-to-end, is not anymore beyond reach, therefore we do want delivery that are verifiable against explicit intents. A feature is only "Done" when the repository contains the instructions and indexing required for a new agent to onboard and continue the work within 60 seconds.

### 3. Explicit and agreed upon Intent *over Customer Collaboration*

Collaboration must shift to a higher level of abstraction. When agents can execute at machine speed, aligning on *intent* — the "why" and the boundaries — is the only way to steer autonomous execution toward customer value. 

### 4. Architectural Fluidity *over Responding to Change*

We don't just respond to change; we architect systems so agents can refactor them safely and instantly. Radical modularity (200-line files, strict interfaces, decoupled components) is not a preference — it is a requirement for AI based agility. High modularity enables parallel agent work, targeted testing, and continuous safe evolution.

---

## The Twelve Principles — Amended for the Agentic Era

*Each principle preserves the spirit of the original while extending it for human-agent collaboration.*

### 1. Customer Value through Continuous, Verified Delivery

> *Original: Our highest priority is to satisfy the customer through early and continuous delivery of valuable software.*

The **verified** addition is because AI shall not just increase velocity but first of all quality.

### 2. Welcome Change, Architect for It

> *Original: Welcome changing requirements, even late in development. Agile processes harness change for the customer's competitive advantage.*

Welcome changing requirements, even late in development. iSDLC processes **architect for change** — modular systems with clear interfaces allow agents to refactor safely, turning change from a risk into a routine operation.

### 3. Deliver Verified Increments Frequently

> *Original: Deliver working software frequently, from a couple of weeks to a couple of months, with a preference to the shorter timescale.*

Deliver verified software very frequently, from a couple of days to a couple of weeks, with emphasis on quality. With agents accelerating execution, the constraint shifts from development speed to **verification speed** — every increment must be testable, reviewable, and context-complete before it ships.

### 4. Humans Set Intent, Agents Execute

> *Original: Business people and developers must work together daily throughout the project.*

Business people, developers, and agents must maintain **shared strategic alignment** throughout the project. Humans define their intents, the *why* and the boundaries; agents execute the *how* within those boundaries. Daily alignment ensures agents do not drift.

### 5. Build Teams around Motivated Humans with Agent Crews

> *Original: Build projects around motivated individuals. Give them the environment and support they need, and trust them to get the job done.*

Build projects around motivated human orchestrators supported by specialized agent crews (Architect, Security, QA, SRE). Give them the environment, tooling, and autonomy they need. Trust the human to steer; trust the agents to execute within defined guardrails.

### 6. Bot-Ready Context Is the New High-Bandwidth Communication

> *Original: The most efficient and effective method of conveying information to and within a development team is face-to-face conversation.*

Face-to-face conversation remains essential for resolving ambiguity among humans. For human-agent and agent-agent communication, **bot-ready context** — structured state files, living documentation, and machine-readable indexes — is the highest-bandwidth channel. Context debt is the new communication debt.

### 7. Verifiable Software + Bot Context Is the Primary Measure of Progress

> *Original: Working software is the primary measure of progress.*

Working software is necessary but insufficient. The primary measure of progress is **verifiable software with immediate bot context restoration** — a new agent must be able to onboard and contribute a follow-up feature within 60 seconds of reading the repository state.

### 8. Sustainable Pace through Managed Agent Orchestration

> *Original: Agile processes promote sustainable development. The sponsors, developers, and users should be able to maintain a constant pace indefinitely.*

iSDLC processes promote sustainable development by managing agent orchestration load. Humans should not become bottlenecks reviewing unbounded agent output. Tiered gating, phased decomposition, and clear scope boundaries keep the human-agent system at a sustainable pace.

### 9. Radical Simplicity Enhances Agility

> *Original: Continuous attention to technical excellence and good design enhances agility.*

Continuous attention to **radical simplicity** enhances agility. In the agentic era, simplicity is the key for excellence, since it is the foundation of accountability. If a human cannot explain a module's logic in few minutes, the AI output must be rejected and refactored.

### 10. Simplicity — Maximizing the Work Not Done by Humans or Agents

> *Original: Simplicity — the art of maximizing the amount of work not done — is essential.*

Simplicity — the art of maximizing the amount of work not done — is essential. Agents amplify complexity as easily as they amplify productivity. We use explicit boundaries, "DO NOT" lists, and phased plans to prevent agents from over-engineering, refactoring adjacent code, or introducing unnecessary dependencies.

### 11. The Best Architectures Emerge from Self-Contained Agentic Teams

> *Original: The best architectures, requirements, and designs emerge from self-organizing teams.*

The best architectures, requirements, and designs emerge from **self-contained agentic teams** — symphonic units where a human orchestrator and specialized agents are vertically integrated from goal to production. The team owns its own agent-ops, prompts, and domain context.

### 12. Reflect, Measure, Adapt — Including the Agents

> *Original: At regular intervals, the team reflects on how to become more effective, then tunes and adjusts its behavior accordingly.*

In this new and hyper evolving Agentic era, retro are becoming more necessary than ever! At regular intervals, the team reflects on how to become more effective — including evaluating agent performance, AI skills and tools to be used, context quality, and orchestration patterns. Retrospectives must cover human process *and* agent tooling. Deferred issues and learned rules are captured in state files so hard-won lessons survive across sessions.

---

## The iSDLC Definition of Done

Before any work is merged, ask:

1. **Is it Well defined?** — Does it include intent-based docs and follow the style guide?
2. **Is it Tested?** — Does automated test coverage exist for the changed behavior?
3. **Is it Contextualized?** — Can an agent understand it immediately? state files reflect the latest decisions and learned rules?
4. **Is it Validated?** — Did a human audit the UX and the logic?
5. **Is it Customer-Validated?** — Was a synthetic persona or real user involved?
6. **Is it Simple?** — Is modularity high enough for future AI-led refactoring?

---

*This manifesto is a living document, versioned alongside the methodology it governs.*
