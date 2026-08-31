---
name: wizard
description: 'Use when asked to generate an interactive bash wizard that walks a human through steps only they can perform — provisioning, credentials, dashboards, migrations — and produce a self-contained script with the shared library inlined. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Wizard

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs provisioning, credentials, dashboard, or migration steps that only a human can perform. |
| Authority | Reversible-local: write only the wizard script to the named target path; delete the file to roll back. |
| Side effect | Writes the wizard script to the target path and stages it; verification is static only — the script is never executed. |
| Done | The wizard script exists, is staged, passes static verification, and every collected value is traced to its destination. |

## Inputs

1. **Procedure description** (required): what the wizard must accomplish: provisioning, credential setup, dashboard walkthrough, migration, or cutover.
2. **Target path** (optional): where to write the script; default `scripts/setup-<topic>.sh`.
3. **Repository context** (read automatically): `.env`, `.env.example`, `.env.*`, `README`, `docker-compose*`, framework configuration, `.github/workflows/*`.

## Procedure

### 1. Scope the procedure

Read the repository before asking anything: `.env`, `.env.example`, and `.env.*`; `README`; `docker-compose*`; framework configuration; `.github/workflows/*`. Treat every `secrets.*` and `vars.*` reference in a workflow as a value the wizard must produce. For a migration, read the current state, the target state, and every irreversible action between them.

Show the ordered stage list and the values each stage produces. Confirm it with the user. Done when: every stage has a name and order, every captured value has a known source, every captured value has a destination (`.env`, a GitHub secret, both, or nowhere for a pure-action stage), and every captured value is classified as secret or public.

### 2. Map the human journey

For each stage, write instructions a stranger can follow. Name the URL, the clicks, where the value appears, and which variable it fills. If the current UI or exact command is unknown, say so. Check the official docs or ask the user. Never invent a step. Done when: every stage has stranger-followable instructions naming the URL, clicks, value location, and target variable.

### 3. Author the script

Copy `scripts/wizard-template.sh` to the target path. Replace the example with one `stage` per step in dependency order. Set `TOTAL_STAGES` and `TOTAL_MINUTES` to honest values because they drive the time-remaining display. Use the library helpers by contract per `references/library-helpers.md`. Done when: script is written with one stage per step, honest totals, and all helpers used correctly.

### 4. Verify and hand off

1. Run `bash -n <script>`.
2. Run `shellcheck <script>` when ShellCheck is available.
3. Run `chmod +x <script>`.
4. Trace every scoped value. Confirm it is captured and reaches its declared destination.
5. Confirm every `set_secret` name matches a `secrets.*` workflow reference exactly.
6. Tell the user how to run the script.

Done when: script passes `bash -n` and shellcheck (when available), is executable, every scoped value is traced to its destination, and every `set_secret` name matches its workflow reference.

Commit the wizard only when the user wants a repeatable setup path in the repository. Otherwise, treat it as ephemeral and delete it after the job is done.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Scope not confirmed | Stop before authoring. Re-present the stage list and wait. |
| Value trace fails | Stop. Report which value has no capture or no destination. Do not hand off. |
| `bash -n` or shellcheck fails | Stop. Report the syntax error. Fix before handoff. |
| `set_secret` name mismatch | Stop. Report the secret name and the workflow reference. Reconcile before handoff. |
| `gh` unavailable | Record in `SKIPPED`. The script warns at runtime; the user sets the secret manually. |

Partial-result rule: a partially authored script is never handed off. Rollback: delete the script file if it has not been committed.

## Output
A self-contained bash wizard script at the target path containing the shared library, stages in dependency order, honest `TOTAL_STAGES` and `TOTAL_MINUTES`, and every scoped value captured and routed to its declared destination.

## Provenance

Origin: current-odin-skill-tree (`skills/wizard/SKILL.md`). Revision: current. License: project-owned. The `scripts/wizard-template.sh` library is project-owned, shared identically across all wizards, and never hand-edited. Adaptation: rewritten from the current skill into ODIN 2.0 roster format with no third-party expression.
