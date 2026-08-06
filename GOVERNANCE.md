# GOVERNANCE.md: Risk & Remediation

Governance in the iSDLC ensures that velocity does not compromise safety, security, or legal compliance.

## 1. Risk Framework
We categorize AI risks into three buckets:
* **Accountability Risk:** AI velocity will lead human to give up on their accountability.
* **Hallucination Risk:** AI generates logic that looks correct but fails in edge cases.
* **Security Risk:** AI suggests insecure patterns (e.g., SQL injection) or leaks secrets.
* **IP Risk:** AI generates code that may violate third-party licenses.

## 2. Remediation: The Human Validation Protocol (HVP)
The HVP is the mandatory gate for every AI artifact.
* **Verification Gate:** Every Pull Request must include a "Human Verification Note" detailing who and how that human has tested the AI work.
* **Agent reviews**: Human validation can include delegation to additional agents and models that will review the PR, using specific definition of done skills to validate it. Cross-model validation reduces the risk of systematic blind spots.
* **Automatic testing** Human validation shall include review of automatic testing coverage in term of logic and code
* **Automated Scanning:** Every CI pipeline must include AI-specific linters (e.g., Gitleaks for secrets, Snyk like tool for vulnerable patterns suggested by AI).


## 3. Tiered Gating
Define clear decision boundaries based on risk level:
* **Low-stakes changes** (formatting, docs, minor refactors) → move autonomously through CI (that will include agent review, automatic testing and scanning)
* **Medium-stakes changes** (feature code, API changes) → require standard HVP and PR review.
* **High-stakes changes** (security logic, data handling, auth, financial) → trigger a mandatory human-in-the-loop barrier with enhanced review.

## 4. Compliance & Auditability
* **Traceability:** Maintain a record of which commits were "AI-generated" vs. "Human-authored." This is critical for future audits and IP valuation.
* **Model Transparency:** Document which LLM models and versions were used for major architectural decisions in the [Architecture Decision Records (ADRs)](./docs/adr/).
* **Tech Debt Logging:** All known debts tracked in [`TECH_DEBT.md`](./TECH_DEBT.md) and reviewed at each release.

## 5. Iterative Human Review of Agent Output

Agent-generated features are functional first drafts, not finished products. The human must review every unit of agent work **as an end user**, not just as a code reviewer.

### The Review Discipline
1. **Use the feature.** Navigate it, feel the flow, notice friction. Code review alone misses UX issues.
2. **Identify improvements.** Note what feels wrong — awkward flows, missing feedback, unclear labels, broken responsive behavior.
3. **Direct refinement.** Give the agent specific, UX-focused feedback. Repeat until the experience matches intent.
4. **Record deviations.** When output deviates from the plan or review reveals needed changes, capture these in plan summaries. Deviations are learning signals that inform better future plans.

### Post-Phase Hardening
At phase boundaries, conduct a dedicated session to address accumulated UX debt — small issues individually deferred but collectively degrading the experience. This is not optional polish; it is a quality gate.

## 6. Remediation Procedure
If an AI-driven bug reaches production:
1. **Revert Immediately:** Standard roll-back procedure.
2. **Context Post-Mortem:** Identify if the error was due to **Unclear intent**, **Lack of Context** or **Model Failure**.
3. **Prompt/Context Patch:** Update the intent, documentation or the context files to ensure no future agent makes the same mistake.
4. **Capture Learned Rule:** Add the lesson to `STATE.md` under an explicit "Rules" section (e.g., "Migration Rules," "Framework Rules"). These hard-won lessons prevent repeat failures across agent sessions.
5. **Update TECH_DEBT.md:** Log the incident and remediation for future reference.

## 7. State Integrity for Agent Handoff
State files are governance artifacts — their accuracy directly affects agent decision quality.

* **State Audit at Phase Boundaries:** Before advancing to a new phase, verify that `STATE.md`, `ROADMAP.md`, and `PROJECT.md` accurately reflect reality. Stale state is worse than no state — it creates confident but wrong agents.
* **Multi-Agent Consistency:** When multiple agents or sessions operate on the same project, state files are the coordination layer. Conflicting updates must be reconciled — the most recent, human-verified state wins.
* **Deferred Issues Tracking:** Issues identified but not addressed must be logged in `STATE.md` with enough context that a future agent can assess them independently. An unlogged deferred issue is a hidden risk.
