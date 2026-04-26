# QUIRKS.md — Bug-as-Feature Register

> Undocumented behaviors that *look* like bugs but are contractually relied upon.
> Captured in Legacy Onboarding Step 1, pinned by characterization tests in Step 3, and protected by a DO-NOT rule so agents don't silently "fix" them.
>
> **Rule:** no entry in this file may be removed or modified except by an explicit ADR.

## Entries

<!-- Copy the block below for each quirk. Newest on top. -->

### QUIRK-{{NUMBER}}: {{SHORT_NAME}}

- **Trigger:** {{TRIGGER_DESCRIPTION}}
- **Observed behavior:** {{BEHAVIOR}}
- **Expected-by-spec behavior (if known):** {{EXPECTED}}
- **Who relies on it:** {{CONSUMERS}}
- **Must preserve?** Yes | No
- **Evidence source:** {{EVIDENCE}}  <!-- support ticket, user interview, telemetry query, etc. -->
- **Characterization test:** `{{TEST_PATH}}`
- **DO-NOT rule for agents:** {{DO_NOT}}
- **Date logged:** {{DATE}}
- **Logged by:** {{AUTHOR}}

---

<!-- Repeat block above for additional quirks. -->
