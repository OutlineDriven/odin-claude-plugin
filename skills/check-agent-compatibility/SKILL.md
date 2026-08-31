---
name: check-agent-compatibility
description: 'Use when asked to run a full repository agent-compatibility pass on demand. Returns a compatibility score, prioritized fixes, and a separate notice when the compatibility scanner is unavailable. Don''t use for tasks that require source or remote-system changes.'
---

# Check agent compatibility

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Full repository agent-compatibility pass, invoked explicitly by a human. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. The compatibility scanner and every review agent run read-only over the repository. |
| Side effect | Chat output only; target is read-only CLI and review agents. No repository, configuration, or remote state is changed. |
| Done | A compatibility score, a prioritized list of fixes, and any scanner-unavailability notice are returned, with scanner unavailability reported separately from the scored findings. |

## Inputs

- Repository path to audit (must be supplied).
- Optional scope limit (subdirectory or file glob) narrowing the pass; when omitted the whole repository is audited.

## Procedure

1. Bind scope to the supplied repository path and optional scope limit before any review runs. Do not widen scope mid-pass.
2. Run the compatibility scanner over the bound scope. If the scanner is unavailable, record the unavailability and continue; do not substitute a guessed score.
3. Run four read-only review passes over the bound scope, each emitting findings in its dimension:
   - compatibility-scan review: agent-compatibility findings derived from the scanner output.
   - docs-reliability review: whether documented agent instructions match observed repository behavior.
   - startup review: whether agent startup, configuration loading, and tool registration succeed without mutation.
   - validation review: whether agent validation and contract checks pass against the repository.
4. Aggregate the four review passes and the scanner output into one compatibility score.
5. Rank the aggregated findings into a prioritized fix list ordered by impact on agent compatibility.
6. Report scanner unavailability as a separate notice, distinct from the scored findings, so a missing scanner never silently lowers or raises the score.

## Failure and recovery
- Scanner unavailable: record the notice, continue the four review passes, and return the partial result with unavailability reported separately. Never infer a scanner score from the review passes.
- Review pass error: stop that dimension, record which dimension failed, and continue the remaining passes. The returned report marks the failed dimension rather than pretending it passed.
- Scope ambiguity or missing repository path: stop and report the blocked input; do not guess a path or widen scope.
- No mutation occurs on any failure; the pass is read-only, so rollback is the absence of changes.

## Output
A chat report containing: the compatibility score, the prioritized fix list, the per-dimension findings from the four review passes, and a separate scanner-unavailability notice when the scanner did not run.

## Provenance

Origin: cursor/plugins `agent-compatibility` plugin. Pinned revision `68836ddaf5697224520f1847d90cdb90ca8babaa`. License: MIT, declared by the cursor/plugins root README and the candidate plugin manifest. Adapted clean-room from the multi-reviewer agent-compatibility audit mechanism; no third-party expression copied.
