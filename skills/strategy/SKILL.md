---
name: strategy
description: 'Use when the user wants product strategy, is starting or redirecting a product, or an existing STRATEGY.md has gone stale. Interviews the user with pushback, then writes and stages one STRATEGY.md at the repository root. Don''t use for project plans, roadmaps, scheduling, or any task that needs no user interview.'
disable-model-invocation: true
---

# Strategy: interview-driven product anchor, honest by construction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants product strategy, is starting or redirecting a product, or an existing STRATEGY.md has gone stale |
| Authority | Reversible local write: STRATEGY.md at the operating repository root; git stage only that file |
| Side effect | Writes and stages exactly `$root/STRATEGY.md` where `$root = git rev-parse --show-toplevel`; nothing else staged |
| Done | Required sections cleared the reject-by-default gate; file written and read back; exactly one STRATEGY.md staged |

## Inputs

- **Required:** User present and available to answer interview questions and receive pushback. No fabrication substitute.
- **Optional input to skill:** Named section argument on invocation (e.g. `/strategy approach`) targets a specific section for update.
- **On-demand reads (loaded at the step that needs them):**
  - `assets/strategy-template.md`: locked section skeleton and post-write checklist. Read when assembling the draft.

## Procedure

### Phase 0: pin intent, then route by file state

1. **VS preamble.** Before the interview, run a Verbalized Sampling preamble to surface the distinct things the user could mean by "strategy" here, and pin one. Skip only when the user already stated a single unambiguous intent. Pinning the wrong frame wastes the whole interview.
2. **Route by file state.** Resolve the operating repo root once with `git rev-parse --show-toplevel`; the anchor is exactly `$root/STRATEGY.md`. Read that path.
   - **Absent** → first run. Announce "No STRATEGY.md. Let's write it." Go to Phase 1.
   - **Present, argument names a section** → targeted update. Go to Phase 2.
   - **Present, no argument** → ask which section(s) to revisit, then Phase 2.

### Phase 1: First-run interview

For each of the eight sections in document order (target problem, approach, persona, metrics, tracks, then optional milestones, non-goals, marketing): ask the opening question, apply the reject-by-default gate, push back at most twice on a weak answer, then capture it in the user's own words. Required sections are 1–5; optional sections default to skip. Never invent them.

The reject-by-default gate runs in order:

1. **Specific, not vague.** Names a concrete situation or choice, and is falsifiable. Reject "better tools for X" and "be the market leader." They survive any product.
2. **Connected.** Approach answers the target problem; tracks serve the approach; metrics could plausibly regress. A disconnected section is a slogan.
3. **The user's strategy, not the agent's.** Captured in the user's own language after pushback, not auto-completed. A fabricated strategy is worse than none.

Push back at most twice per section; then capture what the user gave and mark the section worth revisiting.

### Phase 2: Resume-in-place update

Read the existing `STRATEGY.md` in full. Summarize current state in 3 to 5 lines. Re-interview only the targeted or stale sections with full pushback. Do not rubber-stamp existing weak content. **Preserve every untouched section byte-for-byte.** Update, don't clobber.

### Phase 3: write, read back, commit

1. **Gate check.** Required sections cleared → proceed. Not cleared → write nothing, commit nothing, say so in one line, exit.
2. Read `assets/strategy-template.md`; fill it with captured answers in the user's language. Delete unused optional sections. No empty headers. Set `last_updated` to today's ISO date.
3. Present the full draft in chat; offer one edit round.
4. Write `$root/STRATEGY.md` (the path resolved in Phase 0).
5. **Read the file back** to confirm it landed as intended.
6. **Commit.** Stage only the resolved anchor: `git -C "$root" add STRATEGY.md`. Never `git add -A`.
7. Note in one line that downstream planning reads it as optional grounding on the next run.

## Failure and recovery
| Failure class | Result |
|---|---|
| Required section fails the reject-by-default gate | Write nothing, commit nothing, say so in one line. Exit. |
| No human available to interview | Exit. Fabrication is worse than no strategy. |
| File write or read-back mismatch | Report the mismatch. Do not claim done. |
| Intent cannot be pinned via VS preamble | Announce the ambiguity. Ask the user to state intent explicitly before proceeding. |

**Partial-result rule:** If Phase 2 resumes an existing doc and the targeted section(s) cannot clear the gate, the untouched sections remain intact. No clobber.

**Non-mutation rule:** Only `$root/STRATEGY.md` is written or staged. The working tree is otherwise untouched. `git add -A` is the failure mode, not an option.

## Output
One `STRATEGY.md` written to the operating repository root, read back to confirm, and staged. A clean "not enough to anchor yet" is a valid terminal output when required sections cannot clear the gate.

## Provenance

- Origin: current-odin-skill-tree
- Source: `skills/strategy/SKILL.md`
- License: project-owned
- Adaptation: restructured per skill-foundry-literal-authoring-contract section order; intellectual grounding from Richard Rumelt's *Good Strategy Bad Strategy* retained as framing note; constitutional rules embedded as operational imperatives in Procedure.
