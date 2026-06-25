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

A request to "clean up unused/conflicting skills" landed against this plugin's 87-skill
`skills/` tree. The intuitive approach — hunt for duplicates and dead files — produced almost
nothing. Investigation disproved the premise: **zero true duplicates, zero orphans, zero stubs.**
Every apparent overlap was deliberate layering (each skill states its own niche). The "6 skills
missing from the available list" turned out to be a display cap, not a registration gap — source
`skills/` was byte-identical to the cached release the session loads.

The real signal for "unused" was not structural at all. It was **usage**: of 87 skills, only 21
had ever been invoked across 2483 session transcripts. "Unused" had to be defined behaviorally,
then hand-picked (never-invoked ≠ useless), not derived from static inspection.

## Guidance

1. **Verify the cleanup premise before acting.** "Remove duplicates/orphans" assumes they exist.
   Check first: cluster skills by function and confirm whether overlaps are accidental
   (removable) or deliberate (each states a distinct niche). Confirm the loaded set matches the
   source set (`diff` source dir vs the cache the runtime actually loads) before calling anything
   "missing."
2. **Define "unused" by invocation, mined from transcripts.** Count both slash invocations
   (`<command-name>/ns:skill</command-name>`) and model-auto invocations
   (`"skill":"ns:name"` in tool-use records). Merge per skill. Reconcile the totals: a name that
   appears in the usage count but not on disk is a *phantom* (invoked under an old/renamed id),
   not a current skill — it makes `used + never` overshoot the on-disk count by one per phantom.
3. **Never-invoked is a candidate pool, not a delete list.** Core capabilities (plan, review,
   debug, security-review) sit cold simply because they were not reached for. Output-style dual
   skills look cold because they are invoked through the style system, which the scan cannot see.
   Skills reached via a routing dispatcher get used without their own invocation record. Walk the
   cold set with the human, protect-core by default, and let them hand-pick — the data informs,
   it does not decide.
4. **Strip cross-references cleanly, don't just delete them.** When removing inter-component
   "distinct from X" / "sibling of Y" pointers, rewrite each into a self-contained positive niche
   statement so the disambiguating *information* survives even though the pointer *form* is gone.
5. **Order commits so each is self-consistent.** A "correct the count" commit must not land
   before the change that makes the count true, or it asserts a value the tree contradicts and
   fails its own gate. Fold a derived value (a count) into the commit that changes its source, or
   sequence it after.

## Why This Matters

The wrong frame ("find duplicates") wastes the audit and finds nothing, then tempts a mechanical
purge of the never-invoked set — which silently deletes load-bearing core skills (Sever). The
usage frame plus human hand-pick gets a defensible, reversible cut. The tooling gotcha below can
also corrupt the usage data itself, producing a confidently wrong delete list.

## When to Apply

- Pruning any large catalog of model-discoverable components (skills, commands, agents, tools)
  where "unused" is the real question and there is no manifest that marks a component inactive.
- Any audit where the stated premise (duplicates, orphans, drift) should be falsified before work
  starts.

## Examples

**Tooling gotcha — `grep`/`rg` silently skip long-line JSONL as binary.** Session transcripts are
`.jsonl` with very long lines; both `rg` and plain `grep` heuristically classify them as binary
and skip them, returning near-zero counts that *look* like real answers. Force text mode or use a
real parser:

```bash
# WRONG — silently skips long-line .jsonl, counts come back ~0 and look plausible
grep -rho '"skill":"odin:[a-z-]*"' ~/.claude/projects | sort | uniq -c

# RIGHT — force text (-a), or scan with Python for robust counts
grep -rhao '"skill":"odin:[a-z-]*"' ~/.claude/projects | sort | uniq -c
```

**Count reconciliation.** `21 used + 66 never = 87` failed against an 87-dir tree until one
"used" name (`subagent-driven-development`) was found to be a phantom — invoked once under an id
that is not a current skill dir. 21 *current* used + 66 never = 87; the phantom is the 22nd name.

**Commit ordering.** README said "77 total"; disk had 87; the purge removed 12 → 75. A standalone
"README → 75" commit landing before the purge would claim 75 while the tree still held 87. Fix:
the count change rides inside the purge commit (the commit that makes 75 true), keeping every
commit self-consistent and gate-passing.

> The human co-designed the delete-list through iterative ask-tool questions and leaned
> keep-heavy, cutting only 12 of 66 cold skills. (auto memory [claude])
