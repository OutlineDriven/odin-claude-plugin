---
name: restart-keeping-lessons
description: 'Start the build over from v0, carrying only the lessons that earned reuse and letting the wrong build die. Use when an implementation has accumulated more workarounds than structure and another patch will not pay, or the user says "start over", "scrap it and rebuild", or "restart from scratch". Failed branches are archived as evidence rather than deleted. To demolish and re-derive a subsystem contract in place, use breaking-driven.'
---
# Restart keeping lessons

Start over from what the previous cycle proved, not from what it happened to build.

## Method

1. **Read what exists.** The current plan, any lessons or notes from a prior attempt, QA evidence, and any complaint that triggered the restart.
2. **Split into keep and discard.** Keep what earned it: contracts, schemas that survived QA, quality gates, vocabulary, reusable services, real-surface tests, and negatives as an archive per `../clean-and-true/references/idioms.md`. Discard explanatory UI, debug panels, scaffold, shallow content, and code whose only value was learning what not to do. No copy-forward unless it earned it.
3. **Name the first gate** before planning code.
4. **Write a v0 skeleton** with one complete vertical loop.
5. **Build only that loop** until it clears the gate.

## Completion

The keep-discard split is explicit and evidence-backed. The new v0 has one complete vertical loop and a named first gate. No old architecture was copied forward merely because it exists.

