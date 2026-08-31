---
name: find-bugs
description: 'Use when the user asks to review changes, find bugs, run a security review, or audit code on the current branch. Returns a prioritized findings list with evidence and no invented or style-only findings. Not for repair — use fix.'
---

# Find bugs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to review changes, find bugs, run a security review, or audit code on the current branch. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Reports bugs, security issues, and code-quality findings to chat only. |
| Done | A prioritized findings list with evidence; no invented issues; no style-only findings. |

## Inputs

The change set under review, taken from the current branch diff against its base when the user does not name one. Optional: specific files, directories, or a focus area (bugs, security, or quality) the user supplies to narrow scope.

## Procedure

1. Determine the change set from the current branch diff against its base. If the user named files, directories, or a focus area, restrict scope to those. Done when: the change set is determined and scoped.
2. Read each changed region and the immediate callers and surrounding state needed to reason about its behavior. Do not read unrelated code. Done when: every changed region is read with its callers and surrounding state.
3. For each changed region, identify defects across three classes: correctness bugs, security issues, and code-quality problems that affect behavior or maintainability. Done when: every changed region is analyzed across all three defect classes.
4. For each candidate finding, locate concrete evidence in the diff or surrounding code (the line, input path, or state transition) that proves the defect is real. Discard any candidate without evidence. Done when: every surviving finding has concrete evidence; evidence-less candidates are discarded.
5. Exclude style-only findings (formatting, naming preference, cosmetic) that do not change behavior, security, or correctness. Done when: no style-only finding remains in the candidate list.
6. Rank remaining findings by severity (security above correctness above quality) and within a class by impact and confidence. Done when: the findings list is ranked.
7. Return the prioritized list. Each finding states its location, defect class, description, evidence, and suggested fix direction. Done when: the list is returned with every field per finding.

## Failure and recovery
- No evidence for a candidate: drop it. Never report an invented issue.
- Diff unavailable or empty: report that there is nothing to review and stop. Do not fabricate findings.
- Branch base not determinable: state the base assumed and the change set reviewed. Do not widen scope.
- Partial result: return the findings proven so far and name which changed regions could not be fully reasoned about and why.
- Non-mutation: never edits files, commits, or remote state. Any failure leaves the working tree unchanged.

## Output
A prioritized findings list. Each entry gives location, defect class (bug, security, or quality), description, evidence drawn from the diff or surrounding code, and a suggested fix direction. No style-only findings. No invented issues.

## Provenance

Adapted from the getsentry/skills find-bugs skill (`skills/find-bugs/SKILL.md`) at revision `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241`, Apache-2.0. Clean-room adaptation: the read-only branch-audit mechanism and the evidence-required, no-style-only contract are preserved; expression is rewritten.
