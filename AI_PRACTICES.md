# AI_PRACTICES.md: Agentic Tooling & Operational Practices

## 1. State & Context Management (The "Foundational Layer")
*Logic: Before acting, an agent must have a grounded, "bot-ready" repository state.*

Software is only "Done" if it includes verifiable context. Conversation history is ephemeral; the repository must be the "Brain."

### **Required State Files**
| File | Content | Update Frequency |
| :--- | :--- | :--- |
| **`PROJECT.md`** | Core vision, target users, constraints, and "Hard-won" rules. | On strategy shifts. |
| **`ROADMAP.md`** | Phased delivery plan—goals, dependencies, and plan completion status. | After each phase. |
| **`STATE.md`** | Current "Loop" state, accumulated decisions, and session continuity. | After every action. |
| **`SPEC.md`** | **Execution Contract** containing JSON schemas, Gherkin ACs, and modular logic. | Before implementation. |

### **The Context-Pruning Protocol**
To prevent **Context Rot**, agents must perform a **Compaction Turn** once context utilization reaches 40-60%:
1. Distill noisy logs and chat discoveries into `STATE.md`.
2. Move settled architectural decisions into the **Key Decisions Log** in `PROJECT.md`.
3. Clear the session and restart with these updated files to maintain high precision.

### The Discovery Layer: llms.txt
To satisfy the 60-Second Onboarding Rule, every project must maintain an llms.txt file at the root. This file tells AI agents where the most up-to-date and strategically important resources live.

* Structure:

  * **H1 Title**: Project Name.

  * **Blockquote**: 2-3 sentence "elevator pitch" explaining the project's purpose.

  * **H2 Sections**: Grouped links to PROJECT.md, ROADMAP.md, and technical documentation.

  * **Optional Section**: Links to deep-dive tutorials or old changelogs that can be skipped if token budgets are tight.

 * The "Full" Variant: llms-full.txt

   For high-accuracy tasks, provide an llms-full.txt file that contains flattened, chunked text of the entire documentation suite. This ensures agents get clean, deterministic data without the "noise" of navigation menus or cookie banners.

 * Principles Alignment

   Principle 2 (Plan-Ready): llms.txt guides the initial research phase, ensuring the agent starts with the resources you think matter most.

   Token Efficiency: By providing a curated table of contents, you save AI agents from crawling dozens of irrelevant files, optimizing your token spend.

---

## 2. Orchestration: CLI vs. IDE
*Logic: Choose the "Hands" based on the task complexity.*

| Mode | Agentic CLI (Claude Code, Aider) | IDE Agent (Cursor, Copilot) |
| :--- | :--- | :--- |
| **Primary Use** | **Multi-file execution & migrations** | **Tactical, in-flow assistance** |

---

## 3. The Skill Ecosystem (The "Logic Layer")
*Logic: Apply disciplined, versioned "playbooks" to avoid unstructured "vibe coding."*

### **Top Skill Sources (2026)**
1. **[Official Anthropic Skills](https://github.com/anthropics/skills):** The "Standard Library." Includes `/frontend-design`, `/mcp-builder`, and `/claude-api`.
2. **[Superpowers (obra/superpowers)](https://github.com/obra/superpowers):** Orchestration layer for TDD and multi-agent workflows.
3. **[Awesome Agent Skills (Community)](https://github.com/VoltAgent/awesome-agent-skills):** A curated library of 1,000+ skills from teams like Stripe, Vercel, and Sentry, better to check https://officialskills.sh/ 

### **Essential Anthropic Skills**
* **`/frontend-design`**: Escapes "AI-average" aesthetics by enforcing bold typography and intentional color systems.
* **`/mcp-builder`**: Teaches Claude to build its own **MCP servers** to connect to private APIs.
* **`/simplify`**: Post-implementation pass to remove unnecessary code and improve maintainability.
* **`/webapp-testing`**: Automates browser-based testing using Playwright.

---

## 4. Connectivity & Governance (The "Trust Layer")
*Logic: Extend capabilities via MCP and ensure safety through cross-model audits.*

### **MCP Servers (Integration)**
Connect to Jira, Slack, Sentry, or Chrome DevTools. Use `--scope project` to commit `.mcp.json` so the entire team shares these capabilities.

### **The Audit Agent Pattern (Safety)**

Validation MUST use a different model than creation (e.g., Creator: Claude, Auditor: Gemini) to prevent systematic blind spots.

---

### **Summary of Logic Driver**
1.  **State (Sec 1):** You must have a "Brain" before you speak.
2.  **Orchestration (Sec 2):** Choose the "Hands" (CLI or IDE).
3.  **Intelligence (Sec 3):** Define the "Rules" (Skills).
4.  **Integration & Safety (Sec 4):** Connect to the world and verify the output.