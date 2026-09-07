# ODIN Testing

ODIN workflows for tests, properties, mutation, and behavioral verification.

25 skills, category Coding. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-testing@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-testing@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-testing/skills/<skill> \
  --agent <agent> --scope user
```

`<agent>` is `claude-code`, `codex`, `cursor`, `grok`, or `kimi-cli`.

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-testing:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| behavior-validator | Use when asked to validate a web app, CLI, API, or generated artifact against a source-blind behavior contract. |
| browser-qa | Use when the user runs /browser-qa for report-only QA results without entering a fix loop. |
| control-cli | Use when asked to reproduce, profile, or verify CLI/TUI behavior. |
| control-ui | Use when asked to verify or reproduce browser or Electron UI behavior with before-and-after evidence and no leftover processes. |
| evaluation-leakage-audit | Use when reviewing an evaluation, benchmark, or scoring harness for leakage, or a validation result that looks self-confirming. |
| exhaustive | Use when asked to prove coverage, find missing cases, or enumerate state, decision, requirement, or behavior space. |
| full-product-evaluation | Use when a complete product needs production-like acceptance evidence against documented acceptance criteria. |
| lighter-checks | Use when verification is looping, would re-run untouched code, or duplicates an established proof. |
| meaningful-test-coverage | Use when a test surface needs behavior-guarding coverage raised to a configured target with mutation kill evidence. |
| mutation-campaign-configuration | Use when asked to initialize, scope, estimate, configure, validate, or optimize a mewt, muton, or mutation testing campaign before execution. |
| mutation-triage-genotoxic | Use when a mutation campaign leaves surviving mutants needing triage. |
| possible-worlds-qa | Use when a product surface must be tested against extreme or hostile worlds. |
| proof-driven | Use when property-based testing, theorem proving, or formal proof tactics require zero unproven properties. |
| property-test-authoring | Use when authoring property tests, assessing PBT fit for a code path, reviewing existing property tests, or triaging a failing counterexample. |
| reproduce-bug-report | Use when a bug report or UI-visible defect exists. |
| run-smoke-tests | Use when asked to run smoke tests or verify a local build, applying only minimal unblocking fixes. |
| strict-validation-setup | Use when a user invokes a strict-mode validation or verifiable-goals loop setup. |
| tdd | Use when developing a fix or feature test-first, plan a TDD build, or work red-to-green in slices. |
| test-migration-coverage-gate | Use when about to delete a test that a new harness, suite, or scenario covers. |
| test-suite-acceleration | Use when a test suite is too slow and needs acceleration without weakening behavior or coverage, or CI parallelization must fix serial execution. |
| tests-adversarial | Use when hardening error handling, validating boundary behavior, or hunting silent failures. |
| tests-purge-unneeded | Use when a legacy, slow, or duplicate test suite needs purging, a post-refactor sweep is due, or types cover a contract. |
| validation-first-driven | Use when protocols, workflows, concurrency, or lifecycle state need states, transitions, and temporal properties. |
| verification-skill | Use when asked to create a project-local executable verification skill, or repair one whose commands, paths, or assertions drifted. |
| verify-this | Use when a measurable claim needs before/after proof. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
