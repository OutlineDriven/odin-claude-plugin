---
name: grill-core
description: 'Use when fixing a bug, debugging, or working review comments where the durable fix is the root design, not the nearest patch; every review comment gets a validity verdict before a fix or decline. Not for greenfield features, style-only review, or typo-class one-liners.'
---

# Grill core

## Posture

**Core: Grill the real core; not the outskirts. Be sharp and work for longer horizon.**

A bug is evidence about the design that produced it. When the design is wrong, blocking symptoms is unlimited treadmill work: the same fault keeps spawning new bugs no matter how many are fixed.

Review is continuous and wide, whether the reviewer is human or AI. Read the subsystem, not the diff. A repair that makes sense only inside the changed hunk is not a repair.

Be sharp and work for the longer horizon. Sharp means acting on evidence in the code, never on speculation. Long horizon means the repair is still right in six months, under the next feature, with the next maintainer.

## Loop

1. **Survey wide.** Read the failing code with its neighbors: callers, the data it transforms, the invariants it relies on. Name the subsystem that owns the failure before touching a line. Done when: the stated action, evidence, and guard all hold.
2. **Name the core fault.** State the design-level cause in one sentence: the wrong assumption, the missing invariant, the misplaced responsibility. If the best available sentence names only the symptom, keep reading. Done when: the stated action, evidence, and guard all hold.
3. **Repair the root.** Restructure so the general case absorbs the special case. The repair removes the fault class, not the reported instance. Done when: the stated action, evidence, and guard all hold.
4. **Work the full review queue.** For every open human or AI review comment, current round and every earlier round that never closed: judge validity first (valid, invalid, or trade-off), then fix the valid ones at their root and decline the invalid ones with one line of evidence. An old comment never silently lapses. Done when: the stated action, evidence, and guard all hold.
5. **Re-read wide.** After the repair, re-read the touched surface and its neighbors. If the fix added a special case, a flag, or a shim, step 3 failed; go back. Done when: the stated action, evidence, and guard all hold.

## Rules

- No monkey-patching. A conditional that special-cases the reported input, a wrapper that catches the fault downstream, or a config flag that hides it all leave the design fault in place. Remove the fault instead.
- No outskirts work. Renames, formatting, and comment edits around a bug change nothing. Spend the effort where the failure lives.
- No speculative redesign. The wide view informs the repair; it does not license rewriting subsystems the fault does not touch.

## Done

- The fault class named in step 2 can no longer produce the reported bug family.
- Every review comment carries an explicit verdict: fixed at root, or declined with evidence.
- A fresh wide read finds no special case added by the repair.
