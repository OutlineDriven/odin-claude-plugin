---
name: deprecate-and-migrate
description: 'Use when asked to remove old code, migrate users to a replacement, or decide whether to maintain or sunset a system; produces a production-proven replacement, migrated consumers, and removed obsolete VCS-tracked code with rollback evidence recorded. Don''t use for untracked data or changes without a version-control rollback.'
---

# Deprecate and migrate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Removing old code, migrating users to a replacement, or deciding whether to maintain or sunset a system. |
| Authority | VCS-reversible-destructive: changes are restricted to VCS-tracked code, config, and docs; the exact changed set is shown before any mutation; version control is the recovery path. |
| Side effect | Builds or verifies a replacement, updates consumers and docs, and removes obsolete VCS-tracked code/config/docs only after migration evidence clears. |
| Done | All consumers use the production-proven replacement, old usage is zero, obsolete code/config/docs are removed, and rollback/monitoring evidence is recorded. |

## Inputs

- The deprecated system: its VCS-tracked code, tests, config, and docs, and the full set of consumers. Must be supplied.
- A replacement that is production-proven and covers every critical use case of the old system, or a decision to build one first. Must exist before any removal.
- Current usage evidence: metrics, logs, and dependency analysis proving active usage. Must be supplied to prove zero usage before removal.
- Optional: a hard removal deadline (compulsory deprecation) and migration tooling.

## Procedure

1. Bound scope. List the deprecated system's VCS-tracked files (code, tests, config, docs) and every consumer. Show this exact set before any mutation; do not mutate untracked targets.
2. Make the maintain-or-sunset decision. Answer, in order: does the system still provide unique value (if yes, maintain it and stop); how many consumers depend on it; does a production-proven replacement exist (if no, build it first); what is each consumer's migration cost; what is the ongoing maintenance cost of not deprecating. Stop at maintain if the system still provides unique value.
3. Choose the deprecation pressure. Default to advisory: warnings, documentation, and nudges, with users migrating on their own timeline. Use compulsory (a hard removal deadline plus shipped migration tooling, documentation, and support) only when maintenance cost or security risk forces it. A deadline alone is not a migration.
4. Verify the replacement is production-proven and covers every critical use case of the old system, with a migration guide containing concrete steps and examples. No deprecation proceeds without a working, production-proven alternative.
5. Announce. Write a deprecation notice naming status, replacement, removal date, and reason, plus the migration guide.
6. Migrate consumers one at a time. For each consumer: identify all touchpoints with the old system, update to the replacement, verify behavior matches via tests and integration checks, remove old-system references, and confirm no regressions. For a formal cutover, sequence consumers under one approved rollback boundary; never leave the old and new paths active together after the cutover. The Churn Rule: the owner of deprecated infrastructure owns migrating every consumer in the same cutover; do not shift migration work to consumers or carry a compatibility path.
7. Prove zero active usage via metrics, logs, and dependency analysis.
8. Remove the old system. Delete the code, associated tests, documentation, configuration, and the deprecation notices. Commit each removal so version control is the recovery path.
9. Record rollback and monitoring evidence: the commit range that reverts the removal, and the metric/log watch set that confirms no consumer regressed after removal.

## Failure and recovery
- Replacement-not-proven: the replacement is not production-proven or does not cover a critical use case. Stop before removing old code; build or harden the replacement. Old code stays. The blocked result names the missing proof.
- Consumer-blocked: a consumer cannot migrate because it relies on behavior the replacement does not reproduce (Hyrum's Law). Do not force removal. Either reproduce the behavior in the replacement or keep that consumer on the old path and widen the migration window. The blocked result names the consumer and the unreproduced behavior.
- Usage-not-zero: metrics, logs, or dependency analysis show active usage. Do not remove; continue migration. Removal is blocked until usage is zero. The blocked result names the remaining usage.
- Partial-result rule: migrated consumers stay migrated. Do not roll back completed migrations unless a regression is confirmed.
- Non-mutation rule: never remove old code while any consumer is unmigrated or usage is unverified.
- Scope-widening: if the task grows past the bounded VCS-tracked set, stop and re-scope rather than mutate untracked targets.
- The blocked or non-converged result names the unmigrated consumers and the missing usage or replacement evidence; it never claims the done predicate holds.

## Output
- A deprecation notice and migration guide.
- A migrated consumer set with per-consumer behavior-verification evidence.
- Removed obsolete VCS-tracked code, tests, config, and docs, committed and recoverable via version control.
- A rollback record (the revert commit range) and a monitoring watch set.
- Terminal classification: migrated-and-removed, or blocked with the named unmigrated consumers and the missing evidence.

## Provenance

- Origin: odin-1.x current skill `skills/deprecate-and-migrate/SKILL.md` (project-owned, no third-party license), merged with addyosmani/agent-skills `skills/deprecation-and-migration/SKILL.md`.
- Pinned revision: d2c37ef6225dd8726cdd369a8030307f48592d26 (addyosmani/agent-skills).
- License: MIT — Copyright (c) 2025 Addy Osmani. The copyright notice and MIT permission text are retained in derived distributions.
- Adaptation: clean-room rewrite to the ODIN 2.0 contract format. Source mechanisms (maintain/sunset decision, replacement proof, incremental consumer migration, obsolete-code removal after zero usage) are preserved; no third-party expression is copied verbatim.
