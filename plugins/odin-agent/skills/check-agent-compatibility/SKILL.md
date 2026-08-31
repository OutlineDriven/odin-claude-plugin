---
name: check-agent-compatibility
description: 'Use when a human explicitly asks for a full repository agent-compatibility pass. Returns a compatibility score, prioritized fixes, and a separate notice when the compatibility scanner is unavailable. Not for tasks that require source or remote-system changes.'
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

1. Bind scope to the supplied repository path and optional scope limit before any review runs. Do not widen scope mid-pass. **Done when:** scope is bound to the repository path and optional limit.
2. Run the compatibility scanner over the bound scope. If it is unavailable, record that fact and continue; do not substitute a guessed score. **Done when:** the scanner ran over the bound scope, or its unavailability is recorded.
3. Run four read-only review passes over the bound scope, each emitting findings in its dimension:
   - compatibility-scan review: agent-compatibility findings derived from the scanner output.
   - docs-reliability review: whether documented agent instructions match observed repository behavior.
   - startup review: whether agent startup, configuration loading, and tool registration succeed without mutation.
   - validation review: whether agent validation and contract checks pass against the repository.
   **Done when:** all four review passes are run, or the failed dimension is recorded and the rest completed.
4. Aggregate the four review passes and the scanner output into one compatibility score. **Done when:** the compatibility score is aggregated from all available passes.
5. Rank the aggregated findings into a prioritized fix list ordered by impact on agent compatibility. **Done when:** findings are ranked by impact into a prioritized fix list.
6. Report scanner unavailability separately from the scored findings so a missing scanner never silently lowers or raises the score. **Done when:** scanner unavailability is reported separately from the scored findings.

## Failure and recovery

- **Scanner unavailable:** record the notice, continue the four review passes, and return the partial result with unavailability reported separately. Never infer a scanner score from the review passes.
- **Review pass error:** stop that dimension, record which dimension failed, and continue the remaining passes. The returned report marks the failed dimension rather than pretending it passed.
- **Scope ambiguity or missing repository path:** stop and report the blocked input; do not guess a path or widen scope.
- **No mutation occurs on any failure.** Because the pass is read-only, there are no changes to roll back.

## Output
A chat report containing the compatibility score, the prioritized fix list, the per-dimension findings from the four review passes, and a separate scanner-unavailability notice when the scanner did not run.
