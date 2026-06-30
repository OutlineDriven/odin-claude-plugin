---
name: reviews
description: Reviews changes on the current branch; shallow by default, deep on risk escalation or explicit request. Use when reviewing current work, analyzing recent commits, or running a deep review.
metadata:
  short-description: Read-only branch review — single-pass, or deep multi-persona with P0-P3 severity
---

# Code Review

You are an expert code reviewer. Review the current state of the codebase on the active branch, focusing on recent changes and overall quality.

`Op: extend` — this skill adds an opt-in deep multi-persona mode on top of the single-pass review below. The single pass is the default and the floor; deep mode is a strict superset of it.

## Modes and routing

Strip `mode:` tokens from the invocation before treating the remainder as scope.

| Mode | Trigger | What runs |
|------|---------|-----------|
| **Shallow** (single-pass) | `mode:shallow` / `mode:fast`, OR plain `/review` on a small, non-risky diff | The single pass below (`## Overview` → `## Conclusion and Next Steps`), unchanged. Pins the floor. |
| **Deep** (multi-persona) | `mode:deep` / `personas`, OR auto-escalated from plain `/review` when a risk signal fires | The full single pass, then the persona phases appended below it. |
| **Auto** (default) | plain `/review` | Runs shallow; escalates to deep only when a risk signal fires (thresholds below). |

**Auto-escalation thresholds** — any one fires the promotion; name the trigger that fired in the report:

- diff size > 150 changed lines against the base, OR
- > 5 files changed, OR
- a security-touching path is in the diff: `auth`, `crypto`/`secret`/`token`/`password`/`session`, `sql`/`exec`/`eval`/`deserialize`, `.env`, `migrations/`, `middleware/`, or anything matching the security persona's path globs.

Escalation is **gated, not always-on**: a small diff with no security-touching path stays single-pass. Pin shallow explicitly with `mode:shallow` to suppress escalation; force deep with `mode:deep`.

**Sever-mitigation (non-negotiable):** deep mode is a *strict superset*. Every heading of the single pass — `## Overview`, `## Code Quality Analysis`, `## Specific Recommendations`, `## Potential Issues and Risks`, `## Testing and Validation`, `## Security Review`, `## Performance Considerations`, `## Conclusion and Next Steps` — still appears, in order, produced by the same single pass. Personas and severity are *added below* it, never substituted, never reordered. Plain `/review` on a small clean diff produces exactly the single-pass output it always did.

Shallow: run the single pass below and stop at the closing directive. Deep: run the single pass below, then continue at **Deep mode — parallel persona review**.

Follow these steps:

1. Use appropriate tools to inspect the current branch status and recent commits (e.g., git log --oneline -10, git diff origin/main).
2. Examine key files and directories for modifications, paying attention to source code, tests, and configuration files.
3. Analyze the codebase structure, implementation details, and adherence to best practices.

Provide a thorough code review that includes:

- Overview of recent changes and their purpose
- Analysis of code quality, style, and maintainability
- Specific suggestions for improvements in structure, logic, and implementation
- Identification of potential issues, bugs, or risks
- Assessment of test coverage and validation strategies
- Performance considerations and optimization opportunities
- Security review and vulnerability assessment

Focus on:

- Code correctness and logical soundness
- Adherence to project conventions, coding standards, and architecture patterns
- Performance implications and efficiency
- Comprehensive test coverage and edge case handling
- Security best practices and potential vulnerabilities
- Documentation quality and developer experience
- Scalability and maintainability concerns

Format your review with clear sections:

## Overview

- Summary of recent changes and their intended impact

## Code Quality Analysis

- Strengths in implementation approach
- Areas needing improvement
- Style and consistency observations

## Specific Recommendations

- [Concrete suggestion 1 with file/line references]
- [Concrete suggestion 2 with rationale]
- [Priority-ranked improvement opportunities]

## Potential Issues and Risks

- Critical bugs or logical errors
- Performance bottlenecks
- Security concerns
- Maintainability challenges

## Testing and Validation

- Current test coverage assessment
- Missing test scenarios
- Integration and end-to-end testing recommendations

## Security Review

- Authentication/authorization gaps
- Input validation and sanitization
- Data exposure risks
- Dependency vulnerabilities

## Performance Considerations

- Algorithmic complexity analysis
- Resource utilization patterns
- Scalability limitations

## Conclusion and Next Steps

- Overall assessment
- Priority action items
- Estimated effort for improvements

Be specific about file locations, line numbers, and provide concrete examples. Reference actual code patterns and suggest precise improvements. Maintain professional tone while being direct about issues found.

---

# Deep mode — parallel persona review

Reached only in `mode:deep` or on auto-escalation. The single pass above has already run and its eight sections are present. Everything here is **additive output appended below them**. This phase stays **READ-ONLY**: personas emit findings, the orchestrator merges and assigns severity plus an action class, and the action class is *routing advice only* — no file is edited here. Fixes are executed by `fix` or `review-fix-grill-loop`, never by this skill.

## When to Apply / When NOT

Apply deep mode when:

- the user said `review mode:deep` / `personas`, or
- plain `/review` auto-escalated on a risk signal, or
- the change is security-touching, large, or spans many files and one reviewer's attention is not enough.

NOT:

- Small, non-risky diff → the shallow single pass is sufficient; deep mode is wasted parallelism.
- You want the findings *fixed* iteratively until clean → `review-fix-grill-loop` (it resolves and applies; this skill only advises).
- Whole-project / release-readiness audit → `audit-project`.
- A GitHub PR's review comments and CI → `pr-review`.

## Personas (the lenses)

Thirteen read-only persona agents, each a lens with a primary failure class. Dispatch the ones the diff warrants — `correctness` and `adversarial` are always-on; the rest are gated by the diff surface (skip `performance` on a docs-only diff, skip `api-contract` when no exported surface changed).

| Persona | Lens | Prompt |
|---------|------|--------|
| correctness | logic, control flow, state, error paths | `references/personas/correctness.md` |
| testing | coverage of changed branches, weak/absent assertions | `references/personas/testing.md` |
| maintainability | readability, coupling, naming, future-defect surface | `references/personas/maintainability.md` |
| security | trust boundaries, injection, secrets, authz | `references/personas/security.md` |
| performance | complexity, allocation, hot-path cost on expected load | `references/personas/performance.md` |
| api-contract | exported surface, signatures, back-compat | `references/personas/api-contract.md` |
| adversarial | break-it: edge cases, races, hostile input, assumptions | `references/personas/adversarial.md` |
| learnings-researcher | prior solutions and knowledge gaps | `references/personas/learnings-researcher.md` |
| previous-comments-reviewer | unresolved review threads and past feedback | `references/personas/previous-comments-reviewer.md` |
| data-migration-reviewer | schema changes, data integrity, migration safety | `references/personas/data-migration-reviewer.md` |
| reliability-reviewer | error handling, resilience, failure modes | `references/personas/reliability-reviewer.md` |
| deployment-verification | deploy readiness, rollback safety, env config | `references/personas/deployment-verification.md` |
| project-standards | adherence to repo conventions, lint rules, style guides | `references/personas/project-standards.md` |

The shared output schema, severity rubric, action-class rubric, tool order, and hard limits live in `references/personas/_contract.md`. Read it once; prepend it to every persona dispatch. The security persona's forcing path globs (the authoritative set the escalation threshold defers to) are listed in `references/personas/security.md`.

Additional reference docs:
- `references/action-class-rubric.md` — routing decision criteria for each finding class.
- `references/diff-scope.md` — rules for what is in-scope vs out-of-scope in a review.
- `references/findings-schema.json` — JSON schema for structured finding output.
- `references/review-output-template.md` — template for the final review report.
- `references/subagent-template.md` — template for dispatching subagent reviewers.
- `references/validator-template.md` — template for validation subagents.

## Workflow

### Phase D1 — Select and dispatch (parallel, one message)

Compute the diff surface: changed files, languages, exported-symbol changes, security-touching paths. Select the warranted personas (always-on + gated). Dispatch all selected personas **in one tool-call message** — sequential dispatch invalidates the parallel-launch contract. Each agent receives `<_contract.md> + "\n\n---\n\n" + <persona prompt> + "\n\n---\n\nDIFF:\n" + <captured diff>`. Agents are read-only and return findings only.

### Phase D2 — Merge and rank

Wait for all personas. Then:

1. **Dedup** by fingerprint — `normalize(file) + line-bucket(±3) + normalize(title)`. Identical cross-persona findings collapse to one.
2. **Cross-persona agreement promotes confidence one anchor step** — a finding two personas raise independently is corroborated; bump its confidence one step (low→med→high).
3. **Assign severity P0-P3** by the behavioral rubric below, not by persona vote.
4. **Confidence gate** — drop findings below `med` confidence, *except* a credible P0 (a P0 is never silently dropped on low confidence; surface it flagged).
5. **Assign one action class** (below) — the routing decision, not a fix.

### Phase D3 — Append the deep report

Append the persona findings below `## Conclusion and Next Steps`, grouped by severity then persona, each citing `file:line`, behavioral impact, confidence, and action class with its route. Do not edit the single-pass sections above.

## Severity — P0-P3 by observable behavioral impact

Severity is the *observed or reachable* impact, not how subtle the bug is.

| Pn | Behavioral criterion (observable impact) | Disposition |
|----|------------------------------------------|-------------|
| **P0** | Reachable now by ordinary or untrusted input: data loss/corruption, security breach, crash on a normal path, or a regression in a shipped contract. | Ship-blocker. |
| **P1** | Wrong output or failure on a *plausible* (non-adversarial) input; resource exhaustion under expected load; a contract break behind a flag or edge. | Fix before merge. |
| **P2** | Degraded behavior on an uncommon path; a changed branch with no test that can break silently later; maintainability debt with a named future-defect path. | Fix or file. |
| **P3** | No behavioral impact: style, naming, micro-optimization with no measured win. | Advisory. |

A finding with no nameable reachable impact is P3 by definition — "looks wrong" without a reachable failure is not P0/P1.

## Action classes — routing, not fixing

Each finding gets exactly one class. The class is **advice on where the fix belongs**; this skill applies nothing.

| Class | Meaning | Route |
|-------|---------|-------|
| **safe** | Mechanical, behavior-preserving, single-site; the fix is unambiguous. | `fix` (unattended). |
| **gated** | The fix is clear but touches a contract or multiple sites — needs verified batches and a resolve gate. | `review-fix-grill-loop`. |
| **manual** | Needs a human design decision; no single correct fix. | Surface as a question; no auto-route. |
| **advisory** | Opinion or nit; recording it is the whole action. | None. |

## Constitutional Rules (Non-Negotiable)

1. **Read-only.** Deep mode never edits, never commits. Action classes are routing advice. Any urge to apply a fix means you wanted `review-fix-grill-loop` or `fix`.
2. **Strict superset.** The eight single-pass sections appear unchanged and in order; persona output is appended below, never substituted. Reordering or dropping a single-pass section is a Sever and is rejected.
3. **Gated escalation.** Plain `/review` escalates only when a documented threshold fires. A small non-risky diff stays single-pass.
4. **Parallel dispatch.** Selected personas launch in one message. Sequential dispatch is rejected.
5. **Severity is behavioral.** P0-P3 is assigned by observable impact, not by persona count. If any rule here conflicts with `~/.claude/claude/system-prompt-baseline.md`, the baseline wins.

## Validation Gates

| Gate | Pass Criteria | Blocking |
|---|---|---|
| Single-pass present | All eight single-pass sections produced, in order, before any persona output | Yes |
| Mode resolved | shallow / deep / auto-escalation decided and the firing trigger named in the report | Yes |
| Parallel dispatch | Selected personas launched in one tool-call message with `_contract.md` prepended | Yes (deep) |
| Dedup + anchor | Findings deduped by fingerprint; cross-persona agreement applied before the confidence gate | Yes (deep) |
| Confidence gate | Sub-`med` findings dropped except flagged P0 | Yes (deep) |
| Severity behavioral | Every finding's Pn cites an observable impact | Yes (deep) |
| Action class assigned | Every surviving finding carries exactly one of safe/gated/manual/advisory plus its route | Yes (deep) |
| Read-only preserved | No file edited or committed by this skill | Yes |

## Anti-patterns

- **Replacing the single pass with personas.** Deep mode adds; it never substitutes. The eight sections are the floor.
- **Always escalating.** Auto-promotion is gated; running seven agents on a two-line docs change is wasted parallelism.
- **Fixing in review.** This skill is read-only. Routing a finding to `fix` is the action; editing the file is not.
- **Severity inflation.** "Could theoretically break" with no reachable input is P3, not P0. Reserve P0 for reachable-now impact.
- **Sequential persona dispatch.** One message, all selected personas.
- **Padding with nits.** A persona that finds nothing returns an empty list. Do not manufacture P3s to look thorough.

## See also / Disambiguation

- **vs `review-fix-grill-loop`** — that skill *resolves and fixes* findings in verified batches and loops until clean. `review`, even deep, is **read-only**: it surfaces and routes, never edits. Deep review feeds the grill loop; it does not replace it.
- **vs `pr-review`** — `pr-review` reviews an open GitHub PR (its comments, CI, and diff via `gh`). `review` works the local active branch against its base, no GitHub dependency.
- **vs `audit-project`** — `audit-project` is a whole-project, release-readiness audit. `review` is scoped to the current branch's changes; deep mode adds lenses, not project-wide breadth.
- **vs `simplify`** — `simplify` applies behavior-preserving compression fixes. `review` only assesses.
- **vs `doc-review`** — `doc-review` reads a prose planning document (plan/spec/PRD) read-only; `review` reads the code diff on the active branch. Both fire on "review …", so route by artifact: prose → `doc-review`, code → `review`.
