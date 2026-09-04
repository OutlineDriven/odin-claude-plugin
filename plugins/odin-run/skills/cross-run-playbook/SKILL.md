---
name: cross-run-playbook
description: 'Use when a long agentic project needs each cycle to end in a learning memo and a keep/iterate/restart decision. Not for single-pass builds.'
---

# Cross-run playbook

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A long agentic project where each cycle must produce a learning memo before the next pass begins. |
| Authority | Reversible local: writes only named local artifacts; rollback is version control or undo. No remote mutation. State the rollback path for each write. |
| Side effect | Builds vertical slices, runs real-surface drives, produces memos and gates; versions only quality-cleared templates or modules. |
| Done | Real surface driven with evidence captured; memo names at least one lesson, anti-pattern, or gate affecting the next pass; keep/iterate/restart decision explicit; version labels only on quality-cleared artifacts. |

## Inputs

Required: a framed thesis with named quality gates for the first pass, or a previous-cycle memo for subsequent passes.

## Procedure

1. Build one complete vertical slice against the framed thesis and its quality gates. Done when: one complete vertical slice is built against the thesis and gates.
2. Drive the slice through the real surface: browser for web apps, HTTP for API contracts, CLI for data-shaped artifacts, or the application entry point for desktop apps. Done when: the slice is driven through the real surface.
3. Capture evidence from the real-surface drive. Done when: evidence from the real-surface drive is captured.
4. Extract lessons, anti-patterns, and next-cycle gates. Name at least one finding that affects the next pass. Done when: at least one lesson, anti-pattern, or gate affecting the next pass is named.
5. Make an explicit keep/iterate/restart decision. If the decision is restart, carry the lessons forward but leave failed code behind. Done when: the keep/iterate/restart decision is explicit, with lessons carried forward on restart.
6. Subject the next plan to an adversarial review or human-invoked attack before building it. Done when: the next plan is subjected to adversarial review or human-invoked attack.
7. Version only templates or modules that clear their quality gates. Done when: version labels are applied only to quality-cleared templates or modules.

## Failure and recovery
- No-real-surface-drive: If the real surface was not driven and no evidence was captured, the lap fails. Do not iterate, restart, or version any artifact until real evidence is captured.
- No-finding-in-memo: If the memo does not name at least one lesson, anti-pattern, or gate, surface one before proceeding.
- Non-converged-lap: If no outside truth enters and the quality gates have not cleared, stop the cycle. Do not widen scope or add another internal pass without evidence.
- Variety-gate-failure: If many outputs converge to the same shape, the cycle failed the variety gate. Treat as a non-converged lap.

## Output
A cycle memo naming at least one lesson, anti-pattern, or gate; an explicit keep/iterate/restart decision; and a state transition to the next lap, restart, or termination. Version labels apply only to quality-cleared artifacts.
