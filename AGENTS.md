# AGENTS.md: Universal Agent Instruction Set

This file is the universal, tool-agnostic instruction set for all AI participants working in this repository. Any agent — regardless of model, IDE, or CLI — should read this file first to understand the project, its conventions, and how to contribute.

## Project Overview

The **Shefing iSDLC** (Intelligent Software Development Life Cycle) is a methodology framework for the agentic era. This repository contains the methodology documentation — not application code.

## Repository Map

| File | Purpose |
|---|---|
| [`MANIFESTO.md`](./MANIFESTO.md) | iSDLC Manifesto — values and principles |
| [`PRACTICES.md`](./PRACTICES.md) | Operational Principles & Practices |
| [`PROCESS.md`](./PROCESS.md) | 7-stage lifecycle overview |
| [`GOVERNANCE.md`](./GOVERNANCE.md) | Risk, compliance, HVP |
| [`AI_PRACTICES.md`](./AI_PRACTICES.md) | Cross-process AI tooling guide |
| [`SPEC.md`](./SPEC.md) | Master spec (kernel of truth) |
| [`TECH_DEBT.md`](./TECH_DEBT.md) | Live tech debt log |
| [`llms.txt`](./llms.txt) | Machine-readable index for RAG |
| [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) | Rollout strategy |
| [`LEGACY_ONBOARDING.md`](./LEGACY_ONBOARDING.md) | Context Re-Hydration flow for legacy projects |
| [`LEGACY_MIGRATION_PATTERNS.md`](./LEGACY_MIGRATION_PATTERNS.md) | Pattern-oriented companion to `LEGACY_ONBOARDING.md` for inactive / "don't touch" components |
| [`TOOLING.md`](./TOOLING.md) | How to use iSDLC tooling (rule packs, CLI, MCP, CI) |
| [`framework/`](./framework/) | Stage-by-stage detailed guidance |
| [`docs/adr/`](./docs/adr/) | Architecture Decision Records |
| [`docs/release/`](./docs/release/) | Release-boundary documentation |

## Agent Rules

1. **Read before writing.** Always read `MANIFESTO.md`, `PRACTICES.md`, and the relevant `framework/` file before proposing changes.
2. **Respect the 7 stages.** The lifecycle is: Goals → Requirements → Design → Architecture → Coding/CI/Testing → IaC/CD → Observability.
3. **Maintain cross-references.** If you update a stage file, check `PROCESS.md` for consistency. If you update a principle, check all stage files that reference it.
4. **Context over cleverness.** Every change must leave the repo in a state where a new agent can onboard within 60 seconds.
5. **Principle hierarchy.** `MANIFESTO.md` is authoritative for values and principles. `PRACTICES.md` is authoritative for operational rules. Other files must not contradict them.
6. **Update TECH_DEBT.md** when introducing known shortcuts or incomplete work.
7. **Intent-Based Documentation.** Always explain the "why," not just the "what."
8. **Consume the plan, respect the boundaries.** Before executing, read the full plan including its acceptance criteria and "DO NOT" / scope limit sections. Do not refactor adjacent code, introduce unplanned dependencies, or exceed the plan's stated scope.
9. **Update state files after every significant action.** `STATE.md` must reflect current position, new decisions, deferred issues, and any rules learned during execution. The Session Continuity block must always show where work stopped and what comes next.
10. **Expect human UX review.** Your output is a working draft. The human will review it as an end user and may request refinements focused on experience quality, not just correctness. This review-refine cycle is normal, not a sign of failure.
