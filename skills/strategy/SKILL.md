---
name: strategy
description: 'Use when defining product strategy, starting or redirecting a product, or repairing stale STRATEGY.md. Interviews the user with pushback, then writes and stages one root STRATEGY.md. Not for project plans, roadmaps, scheduling, or work needing no interview.'
disable-model-invocation: true
---

# Strategy: interview-driven product anchor

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants product strategy, is starting or redirecting a product, or an existing STRATEGY.md has gone stale |
| Authority | Reversible local write: STRATEGY.md at the operating repository root; git stage only that file |
| Side effect | Writes and stages exactly `$root/STRATEGY.md` where `$root = git rev-parse --show-toplevel`; nothing else staged |
| Done | Required sections cleared the reject-by-default gate; file written and read back; exactly one STRATEGY.md staged |

## Inputs

- **Required:** user present and available to answer interview questions and receive pushback. No fabrication substitute.
- **Optional:** a named section argument on invocation (e.g. `/strategy approach`) targets a specific section for update.
- **On-demand reads (loaded at the step that needs them):**
  - `references/interview.md`: question bank, pushback rules, anti-pattern examples, and per-section quality bar. Read before any interview turn.
  - `assets/strategy-template.md`: locked section skeleton and post-write checklist. Read when assembling the draft.

## Refusal

- Required section fails the reject-by-default gate: write nothing, commit nothing, say so in one line. Exit.
- No human available to interview: exit. Fabrication is worse than no strategy.
- File write or read-back mismatch: report the mismatch. Do not claim done.
- Intent cannot be pinned via VS preamble: announce the ambiguity. Ask the user to state intent explicitly before proceeding.

## Procedure

### Phase 0: pin intent, then route by file state

1. **VS preamble.** Before the interview, run a Verbalized Sampling preamble to surface the distinct things the user could mean by "strategy" here, and pin one. Skip only when the user already stated a single unambiguous intent. Pinning the wrong frame wastes the whole interview. Done when: one intent is pinned or the ambiguity is surfaced.
2. **Route by file state.** Resolve the operating repo root once with `git rev-parse --show-toplevel`; the anchor is exactly `$root/STRATEGY.md`. Read that path. Absent means first run: announce "No STRATEGY.md. Let's write it." and go to Phase 1. Present with a section argument means targeted update: go to Phase 2. Present without argument means ask which section(s) to revisit, then Phase 2. Done when: the route is chosen.

### Phase 1: First-run interview

3. **Interview all eight sections in document order.** Load `references/interview.md` for the question bank, pushback rules, and per-section quality bar. For each section (target problem, approach, persona, metrics, tracks, then optional milestones, non-goals, marketing): ask the opening question, apply the reject-by-default gate, push back at most twice on a weak answer, then capture it in the user's own words. Required sections are 1 through 5; optional sections default to skip. Never invent them. Done when: all required sections clear the gate and optional sections are captured or skipped.

The reject-by-default gate runs in order: (1) Specific, not vague — names a concrete situation or choice, and is falsifiable. (2) Connected — approach answers the target problem; tracks serve the approach; metrics could plausibly regress. (3) The user's strategy, not the agent's — captured in the user's own language after pushback, not auto-completed.

### Phase 2: Resume-in-place update

4. **Read and re-interview.** Read the existing `STRATEGY.md` in full. Summarize current state in 3 to 5 lines. Re-interview only the targeted or stale sections with full pushback using `references/interview.md`. Do not rubber-stamp existing weak content. Preserve every untouched section byte-for-byte. Update, don't clobber. Done when: targeted sections are re-interviewed and untouched sections are preserved.

### Phase 3: write, read back, stage

5. **Gate check.** Required sections cleared means proceed. Not cleared means write nothing, commit nothing, say so in one line, exit. Done when: the gate passes or the skill exits.
6. **Assemble the draft.** Read `assets/strategy-template.md`; fill it with captured answers in the user's language. Delete unused optional sections. No empty headers. Set `last_updated` to today's ISO date. Done when: the draft is assembled.
7. **Present and offer edits.** Present the full draft in chat; offer one edit round. Done when: the edit round is completed.
8. **Write the file.** Write `$root/STRATEGY.md` (the path resolved in Phase 0). Done when: the file is written.
9. **Read the file back** to confirm it landed as intended. Done when: the read-back matches.
10. **Stage.** Stage only the resolved anchor: `git -C "$root" add STRATEGY.md`. Never `git add -A`. Done when: exactly one file is staged.
11. **Note downstream.** State in one line that downstream planning reads STRATEGY.md as optional grounding on the next run. Done when: the note is delivered.

## Failure modes

- Partial result: if Phase 2 resumes an existing doc and the targeted section(s) cannot clear the gate, the untouched sections remain intact. No clobber.
- Non-mutation: only `$root/STRATEGY.md` is written or staged. The working tree is otherwise untouched. `git add -A` is the failure mode, not an option.

## Output

One `STRATEGY.md` written to the operating repository root, read back to confirm, and staged. A clean "not enough to anchor yet" is a valid terminal output when required sections cannot clear the gate.

## Provenance

- Origin: current-odin-skill-tree
- Source: `skills/strategy/SKILL.md`
- License: project-owned
- Adaptation: restructured per skill-foundry-literal-authoring-contract section order; intellectual grounding from Richard Rumelt's *Good Strategy Bad Strategy* retained as framing note; constitutional rules embedded as operational imperatives in Procedure.
