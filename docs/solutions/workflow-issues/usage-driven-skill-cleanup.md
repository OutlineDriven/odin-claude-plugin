---
title: "Cleaning up skills in a large agent plugin: usage-driven, not duplicate-driven"
date: 2026-06-25
category: docs/solutions/workflow-issues
module: skills
problem_type: workflow_issue
component: development_workflow
severity: medium
applies_when:
  - "Auditing a large agent/skill plugin for unused or conflicting components"
  - "A cleanup premise (duplicates, orphans, missing files) needs verification before acting"
  - "Defining \"unused\" requires real invocation data, not static inspection"
related_components:
  - tooling
tags:
  - skill-cleanup
  - usage-analysis
  - transcript-mining
  - plugin-maintenance
  - commit-ordering
  - grep-jsonl
---

# Cleaning up skills in a large agent plugin: usage-driven, not duplicate-driven

## Context

Counts below reflect the 1.x skills tree during the 2026-06-25 incident. The 2.0 workspace has since materialized an 816-skill tree, so these figures are historical.

A request to clean up unused or conflicting skills targeted the 87-skill `skills/` tree. Searching for duplicates and dead files revealed that the initial premise was incorrect: there were **zero true duplicates, zero orphans, zero stubs**. Apparent overlaps represented intentional layering with distinct niches. The report of 6 skills missing from the available list stemmed from a display cap rather than a registration issue; source `skills/` was byte-identical to the cached release loaded by the session (unverified).

The actual indicator of unused skills was **usage**: across 2483 session transcripts, only 21 of 87 skills had ever been invoked (unverified; 1.x transcripts predate the 2.0 restructure and cannot be re-grounded against the current tree). Identifying unused skills required behavioral invocation data and manual triage (never-invoked ≠ useless) rather than static inspection.

## Guidance

1. **Verify the cleanup premise before acting.** Cluster skills by function to distinguish accidental duplication from deliberate specialization. Compare the source directory with the runtime cache (`diff` source against runtime cache) to confirm missing files before deleting or renaming.
2. **Define "unused" by mining transcript invocations.** Aggregate both explicit slash invocations (`<command-name>/ns:skill</command-name>`) and model tool calls (`"skill":"ns:name"` in tool-use records). Reconcile totals per skill: names present in transcript logs but absent on disk are *phantoms* (invocations under obsolete or renamed IDs). Each phantom causes `used + never` to overshoot the on-disk count by one.
3. **Treat never-invoked skills as candidates, not a deletion list.** Core capabilities (such as plan, review, debug, security-review) may remain uninvoked simply because specific sessions did not require them. Output-style dual skills appear unused because invocations route through the style system outside direct tool calls. Routing dispatchers also invoke skills without generating discrete invocation logs. Review candidate sets manually and protect core capabilities by default; usage data informs selection rather than dictating removal.
4. **Rewrite cross-references into positive scope statements.** When removing inter-skill pointers (such as "distinct from X" or "sibling of Y"), convert each statement into a self-contained description of its specific domain so disambiguation survives the pointer removal.
5. **Sequence commits to maintain repository consistency.** Never land a commit updating reported counts before landing the change that establishes those counts; otherwise, the intermediate state fails validation gates. Place derived count updates in the commit modifying the assets, or sequence them immediately afterward.

## Why this matters

Focusing solely on duplicate detection yields false negatives and risks indiscriminate deletion of uninvoked core skills. Combining transcript usage metrics with manual review produces a verified, safe reduction. Undetected binary-mode filtering in search tools can also corrupt transcript counts, leading to incorrect deletion candidates.

## When to apply

- Pruning catalogs of model-discoverable components (skills, commands, agents, tools) where activity is untracked by manifests.
- Audits requiring empirical verification of premises (duplicates, orphans, drift) before modifying code.

## Examples

**Search tool binary detection on long transcript lines.** Session transcripts are stored in `.jsonl` files containing long lines. Plain `grep` or `rg` may classify files with long lines or NUL bytes as binary and skip matches (unverified; did not reproduce on test transcripts up to 37 KB lines with NUL bytes, where `rg`, `rg -a`, and `grep` gave identical output). Force text scanning (`-a`) or parse records with Python:

```bash
# WRONG — risks a silent undercount if grep skips a file as binary; counts look plausible
grep -rho '"skill":"odin:[a-z-]*"' ~/.claude/projects | sort | uniq -c

# RIGHT — force text (-a), or scan with Python for accurate counts
grep -rhao '"skill":"odin:[a-z-]*"' ~/.claude/projects | sort | uniq -c
```

**Count reconciliation.** The initial equation `21 used + 66 never = 87` conflicted with the 87-directory tree until tracing showed that one recorded skill (`subagent-driven-development`) was a phantom ID from an earlier release. The reconciled set contained 21 current used skills, 66 uninvoked skills, and 1 phantom invocation (22 total names).

**Commit ordering.** The README listed 77 total skills while disk contained 87; the cleanup removed 12 skills to reach 75. Committing "README → 75" before the removal creates an invalid intermediate state. Including the README update in the deletion commit keeps each commit self-consistent and compliant with verification gates.

> Interactive triage finalized the deletion list, removing 12 of the 66 uninvoked skills while preserving core capabilities. (auto memory [claude])
