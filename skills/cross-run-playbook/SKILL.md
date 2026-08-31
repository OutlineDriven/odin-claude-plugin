---
name: cross-run-playbook
description: 'Use when a long agentic project must compound progress as learning rather than accumulated code. Produces a cycle memo naming at least one lesson, anti-pattern, or gate; makes an explicit keep/iterate/restart decision; and versions only quality-cleared artifacts. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Learning cycle

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Long agentic project where progress must compound as learning rather than accumulated code |
| Authority | Reversible local: write only named local artifacts; state the rollback path for each write |
| Side effect | Builds vertical slices, runs real-surface drives, produces memos and gates; versions only quality-cleared templates/modules |
| Done | Real surface driven with evidence captured; memo names at least one lesson/anti-pattern/gate affecting the next pass; keep/iterate/restart decision explicit; version labels only on quality-cleared artifacts |

## Inputs

Required: a framed thesis with named quality gates for the first pass, or a previous-cycle memo for subsequent passes.

## Procedure

1. Build one complete vertical slice against the framed thesis and its quality gates.
2. Drive the slice through the real surface: browser for web apps, HTTP for API contracts, CLI for data-shaped artifacts, or the application entry point for desktop apps.
3. Capture evidence from the real-surface drive.
4. Extract lessons, anti-patterns, and next-cycle gates. Name at least one finding that affects the next pass.
5. Make an explicit keep/iterate/restart decision. If restart: carry the lessons forward; do not carry failed code.
6. Kill the next plan before build using an adversarial review or human-invoked attack.
7. Version only templates or modules that clear their quality gates.
8. Verify before declaring the lap done:
   - The real surface was driven and evidence was captured.
   - The memo names at least one lesson, anti-pattern, or gate that affects the next pass.
   - The keep/iterate/restart decision is explicit.
   - Any version label belongs only to a quality-cleared template or module.

## Failure and recovery
- **No-real-surface-drive**: If the real surface was not driven and no evidence was captured, the lap fails. Do not iterate, restart, or version any artifact until real evidence is captured.
- **No-finding-in-memo**: If the memo does not name at least one lesson, anti-pattern, or gate, surface one before proceeding.
- **Non-converged-lap**: If no outside truth enters and the quality gates have not cleared, stop the cycle. Do not widen scope or add another internal pass without evidence.
- **Variety-gate-failure**: If many outputs converge to the same shape, the cycle failed the variety gate. Treat as a non-converged lap.

## Output
A cycle memo naming at least one lesson, anti-pattern, or gate; an explicit keep/iterate/restart decision; and a state transition to the next lap, restart, or termination. Version labels apply only to quality-cleared artifacts.

## Provenance

Origin: https://github.com/LilMGenius/paperthin, revision 3bca079a51bcfff5dafb53d1d7f9f523d66ee317. License: MIT (c) 2026 LilMGenius. Adaptation of `skills/coil/re0-loop/SKILL.md` under MIT license with the same copyright terms. Description, section structure, and frontmatter rewritten to the ODIN 2.0 authoring contract. Workflow re-ordered to the mandatory section sequence. Goal section elided as redundant with Contract and Procedure. Rules section absorbed into Procedure steps and Failure and recovery. Verification section absorbed into Procedure step 8.
