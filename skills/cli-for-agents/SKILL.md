---
name: cli-for-agents
description: 'Use when asked to build or review a CLI intended for coding agents and return flag-driven, pipeline-safe, idempotent design advice. Don''t use for tasks that require source or remote-system changes.'
---

# CLI for agents

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Human asks to build or review a CLI intended for coding agents |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Advice or review only. |
| Side effect | Chat output only: design advice or review findings. |
| Done | A report returned that prescribes flag-driven, pipeline-safe, idempotent CLI design. |

## Inputs

- A CLI to review, or a build request describing the CLI's purpose and target agent runtime. Either is sufficient; both may be supplied.
- Optional: existing command surface, flag set, exit-code map, or invocation examples. When absent, state the assumption and review against the design rules below.

## Procedure

1. Bound scope: confirm whether this is a build (propose a design) or a review (judge an existing CLI). Do not mutate the CLI or any file; produce advice only.
2. Enumerate the command surface the agent will invoke: subcommands, flags, positional args, stdin, stdout, stderr, and exit codes.
3. Check flag-driven control: every behavioral switch is a flag or subcommand, not an interactive prompt that blocks on a TTY. Flag names are stable, long-form, and discoverable via `--help`. Reject hidden modes toggled only by interactive input.
4. Check pipeline safety: output meant for machine consumption goes to stdout as plain, parseable text (one record per line or a single structured document); human diagnostics go to stderr. The CLI never hangs waiting on a TTY when stdin is not a terminal. Exit codes are explicit and documented: 0 success, non-zero for distinct failure classes.
5. Check idempotence: re-running the same invocation with the same inputs produces the same result and side effects, or fails loudly with a non-zero exit when the operation is not safely repeatable. State-changing commands declare whether they are idempotent and what makes a repeat safe.
6. Check agent ergonomics: deterministic output ordering, no color or progress decoration on stdout unless explicitly flagged on, machine-readable `--json` or equivalent where the agent parses output, and a single canonical invocation form per action.
7. For a build request, propose the command surface, flag set, exit-code map, and stdout/stderr contract that satisfy rules 3-6. For a review, record each violation against the rule it breaks and prescribe the fix.
8. Stop at the report. Do not edit the CLI, run it, or widen scope into implementation, testing, or packaging.

## Failure and recovery
- Ambiguous build-vs-review intent: ask once for the missing input; if unresolved, default to review when a CLI is supplied and build when only a purpose is supplied, and state the assumption in the report.
- Missing command surface for a review: state that the surface could not be enumerated and limit findings to the rules checkable from what was supplied; do not invent a surface.
- Contradictory requirements (e.g., a required interactive prompt): report the contradiction and the rule it violates; do not silently relax a rule to make the CLI pass.
- No partial mutation: this skill never changes files, so there is no rollback. A blocked review returns the findings gathered so far plus the named blocker, never a clean bill of health.

## Output
A design or review report containing: the command surface as enumerated; a per-rule pass/fail verdict for flag-driven control, pipeline safety, idempotence, and agent ergonomics; for each failure, the rule broken and the prescribed fix; for a build, the proposed surface, flag set, exit-code map, and stdout/stderr contract. The report is chat output only.

## Provenance

Origin: cursor/plugins, path `cli-for-agent/skills/cli-for-agents/SKILL.md`, revision `68836ddaf5697224520f1847d90cdb90ca8babaa`. License: MIT, declared by the cursor/plugins root README and the candidate plugin manifest per the pinned source audit. Adaptation: clean-room rewrite of the advisory contract for agent-facing CLI design; no third-party expression copied, mechanism preserved as the flag-driven, pipeline-safe, idempotent design rules.
