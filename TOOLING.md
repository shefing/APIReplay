# TOOLING.md — How to Use iSDLC in Day-to-Day Work

> Companion to [`AGENTS.md`](./AGENTS.md), [`PROCESS.md`](./PROCESS.md), and [`IMPLEMENTATION.md`](./IMPLEMENTATION.md).
> Explains the **executable** side of the methodology: rule packs, CLI, MCP server, CI gates, and the end-user flow in Claude Code / Junie / Cursor.
>
> This file is filled in progressively as the tooling rolls out. Sections for not-yet-shipped components include a short "Status" tag.

## Table of Contents

1. [Rule Packs & Templates](#1-rule-packs--templates)   <!-- Phase 0 -->
2. [CLI Reference](#2-cli-reference)                     <!-- Phase A -->
3. [MCP Server Setup per Agent](#3-mcp-server-setup-per-agent) <!-- Phase A½ -->
4. [CI Gates](#4-ci-gates)                               <!-- Phase B -->
5. [Review Bot](#5-review-bot)                           <!-- Phase B+ -->
6. [Entry Doors — New vs Existing](#6-entry-doors--new-vs-existing)
7. [End-User Flow Diagram](#7-end-user-flow-diagram)

---

## 1. Rule Packs & Templates

**Status:** shipped (Phase 0).

### Why this exists

Every agent (Claude Code, Junie, Cursor, Copilot) reads a different "rules" file from the repo on session start. If we hand-maintain one file per agent, they drift — and an agent that reads a stale rule file silently violates the methodology. Phase 0 fixes this at the root: **one source, many rendered outputs.**

### The single source of truth

- **Canonical rule source:** [`.isdlc/rules/source.md`](./.isdlc/rules/source.md).
  This is the only file humans edit. It contains the universal Agent Rules (mirroring `AGENTS.md`), the Plan → Build → Review loop contract, DoD, PR artifacts, Entry-Door routing, the MCP tool list, deliberation-preserving guardrails, and the Legacy Step 2c gate.

- **Canonical methodology docs (also sourced from this repo):**
  `MANIFESTO.md`, `PRACTICES.md`, `PROCESS.md`, `GOVERNANCE.md`, `AI_PRACTICES.md`, `AGENTS.md`, `SPEC.md`, `TECH_DEBT.md`, `LEGACY_ONBOARDING.md`, `LEGACY_MIGRATION_PATTERNS.md`, `IMPLEMENTATION.md`, `llms.txt`, and the `framework/` stage guides.

  **Rule:** when iSDLC tooling scaffolds a new or existing user project, all of these `.md` files are **copied/fetched from this repository**. Downstream projects must not fork or hand-edit them — they consume them through the CLI so upgrades flow centrally.

### Templates

Artifact templates used by the CLI and MCP server live in [`.isdlc/templates/`](./.isdlc/templates/):

| Template | Purpose | Populated by |
|---|---|---|
| `plan.md` | Plan → Build → Review plan with Objective, Gherkin ACs, DO-NOT, Context refs | `isdlc plan new` |
| `adr.md` | Architecture Decision Record | `isdlc adr new` / `isdlc.recordADR` |
| `state.md` | STATE.md with Current Position + Session Continuity block | greenfield scaffold, `isdlc state sync` |
| `quirks.md` | Bug-as-Feature register (Legacy Onboarding Step 1) | `isdlc onboard` |
| `pr.md` | PR template enforcing PROCESS.md §2.05 (5 artifacts) + DoD §3 | committed to `.github/PULL_REQUEST_TEMPLATE.md` on scaffold |
| `graduation-report.md` | Legacy Step 7 graduation checklist | `isdlc graduate` |

### The generator

[`scripts/sync-agent-rules.mjs`](./scripts/sync-agent-rules.mjs) reads `.isdlc/rules/source.md` and emits four agent-native files, each with an agent-specific preamble and a "DO NOT EDIT" banner:

| Generated file | Agent |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Anthropic Claude Code |
| [`.junie/guidelines.md`](./.junie/guidelines.md) | JetBrains Junie |
| [`.cursorrules`](./.cursorrules) | Cursor |
| [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) | GitHub Copilot |

Usage:

```bash
# Regenerate (after editing .isdlc/rules/source.md):
node scripts/sync-agent-rules.mjs

# Verify in CI (fails build on drift):
node scripts/sync-agent-rules.mjs --check
```

**Guardrails:**

- Generated files carry an explicit `GENERATED FILE — DO NOT EDIT BY HAND` banner with a pointer back to the source.
- The `--check` mode is wired into CI (Phase B); PRs that edit a generated file without touching `source.md` fail the build.
- The generator never touches `AGENTS.md` itself — `AGENTS.md` is human-authored top-level policy; the rule source is the *operational* projection of it.

### Extending to a new agent

To add a new agent (e.g., a future Windsurf or Aider rule file):

1. Add a `PREAMBLES.<agent>` entry in `scripts/sync-agent-rules.mjs`.
2. Append the target to the `TARGETS` array with the correct output path.
3. Re-run the generator. CI's `--check` step will now cover it.

No edits to the rule source are required — the whole point is that all agents share one body.

---

## 2. CLI Reference

**Status:** planned (Phase A). See [plans](./.junie/plans/isdlc-tooling-delivery.md) Step 2.

## 3. MCP Server Setup per Agent

**Status:** shipped — read + write (Phase A½ + Step 3b).

### What it is

`@isdlc/mcp` is a small [Model Context Protocol](https://modelcontextprotocol.io) server that wraps `@isdlc/cli` over stdio. When configured, the agent in Claude Code, Junie, or Cursor calls iSDLC tools natively — it no longer has to re-read `STATE.md` / `QUIRKS.md` / the active plan by hand, and it records ADRs / tech debt / state updates through the same CLI the human and CI use.

### Read tools (safe to call eagerly)

| Tool | Purpose |
|---|---|
| `isdlc.getStage` | Current stage + Session Continuity snapshot from `STATE.md`. |
| `isdlc.getEntryDoor` | New (greenfield) vs Existing (current Legacy step). |
| `isdlc.getQuirks` | Must-preserve behaviors from `QUIRKS.md`. |
| `isdlc.getPlan` | Active plan under `plans/` (or `which: "all"`). |
| `isdlc.runDoctor` | Runs `isdlc doctor --json`. |

### Write tools (delegate to the CLI)

Each write tool shells out to `@isdlc/cli` — the CLI is the single source of truth for write semantics (numbering, template sourcing, guardrails). A non-zero CLI exit is surfaced as `isError: true` in the MCP response, so agents cannot silently succeed on a failed mutation.

| Tool | Wraps | Notes |
|---|---|---|
| `isdlc.recordADR({ title })` | `isdlc adr new <title> --yes` | Returns the created file path under `docs/adr/`. |
| `isdlc.logTechDebt({ item, whyDeferred?, tracking? })` | `isdlc debt add <item> [--reason ...] [--tracking ...]` | Fails loudly if `TECH_DEBT.md` is missing. |
| `isdlc.updateState({ confirm? })` | `isdlc state sync [--confirm]` | `confirm` defaults to `false`; Session Continuity stays `Human confirmation required? Yes` unless the human has explicitly approved. |
| `isdlc.graduate({ force? })` | `isdlc graduate [--force]` | Refuses on a fresh repo with no `.isdlc/onboarding.json`; refuses unless every Legacy step is `confirmed`/`skipped`. `force: true` produces a DRAFT. |

**Human-in-the-loop invariant:** agents MUST NOT pass `confirm: true` to `updateState` or `force: true` to `graduate` without an explicit human go-ahead. These flags exist only to let a human move past a stop point; they are never an agent's decision to make.

### Running the server

The server is stdio-only (no network port). Each client spawns it on demand:

```bash
npx -y @isdlc/mcp
```

Environment:

- `ISDLC_NO_UPDATE_CHECK=1` — suppress the CLI's npm-registry version notifier.
- All tool calls accept an optional `path` argument; if omitted, the server uses its own CWD (which each client sets to the project root).

### Install snippets

#### Claude Code — `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "isdlc": {
      "command": "npx",
      "args": ["-y", "@isdlc/mcp"],
      "env": { "ISDLC_NO_UPDATE_CHECK": "1" }
    }
  }
}
```

Windows path: `%APPDATA%\Claude\claude_desktop_config.json`. Restart Claude Code after editing.

#### JetBrains Junie — `.junie/mcp.json` at the project root

```json
{
  "mcpServers": {
    "isdlc": {
      "command": "npx",
      "args": ["-y", "@isdlc/mcp"],
      "env": { "ISDLC_NO_UPDATE_CHECK": "1" }
    }
  }
}
```

Junie launches the server with the project root as CWD, so tool calls without `path` resolve to the right repo automatically.

#### Cursor — `~/.cursor/mcp.json` (global) or `<project>/.cursor/mcp.json` (per-repo)

```json
{
  "mcpServers": {
    "isdlc": {
      "command": "npx",
      "args": ["-y", "@isdlc/mcp"],
      "env": { "ISDLC_NO_UPDATE_CHECK": "1" }
    }
  }
}
```

Prefer the per-repo variant for monorepos where each project has its own iSDLC substrate.

### Verifying the install

From any project scaffolded with `isdlc init`:

1. Open the IDE; the agent should list `isdlc` among its available MCP servers.
2. Ask the agent: *"Call `isdlc.getStage` and summarize."* — it should return the current stage, entry door, and active plan.
3. Run `npm -w @isdlc/mcp test` inside the iSDLC repo to confirm the smoke test still passes end-to-end.

### Guardrail

The server preserves the "deliberation, not bureaucracy" line stated in `MANIFESTO.md`:

- Read tools are free to call and never mutate state.
- Write tools always delegate to the CLI, so every CLI guardrail (missing files fail loud, confirmation flags stay off by default, Legacy steps must be confirmed before graduation) applies identically through MCP.
- Failed writes return `isError: true` with the CLI's `stderr` in the payload — agents must surface that to the human rather than retry silently.

## 4. CI Gates

**Status:** planned (Phase B). See plan Step 4.

## 5. Review Bot

**Status:** planned (Phase B+). See plan Step 5.

## 6. Entry Doors — New vs Existing

The first question the tooling asks any human is **New project or Existing?** — this is encoded in `isdlc init` (Phase A) and in the MCP `isdlc.getEntryDoor()` tool (Phase A½). See Section 7 below for the full flow.

## 7. End-User Flow Diagram

**Status:** filled in during Step 6 of the plan. The diagram shows developer → IDE agent → rule file → MCP server → CLI core → repo substrate, with entry-door routing and CI gates.
