---
name: plan
description: 'Use when a user commits to a direction and asks to plan, brief, or research it; modes score, breakdown, shape, visual. Not for codebase audit: use plan-review. Not for four-phase review: use autoplan.'
---

# Knowledge plan

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User commits to a direction and asks to plan, brief, structure, research, or operationalize it; or asks to score a plan against a quality bar, break a goal into dependency-ordered tasks, shape a pitch, or render a plan as a visual page. |
| Authority | Reversible local: writes only named local plan artifacts (the plans/ file, the score-mode plan file and review report, and the visual-mode page in the diagrams directory); rollback is deleting or reverting those artifacts. Breakdown and shape modes write nothing. No remote mutation. |
| Side effect | Runs read-only parallel research and writes plans/{type}-{descriptive-name}.md, adding a date on collision. Score mode writes a plan file and a review report. Visual mode writes one self-contained HTML page and opens it in a browser. Breakdown and shape modes return chat output only. |
| Done | Default: type and tier classified, research checks run, the user acknowledges the context brief, and the file leads with the type-correct answer plus sourced metrics, questions, and references. Score: 5/5 on all six dimensions or a named blocker. Breakdown: every task carries a checkable acceptance criterion and dependency order, and the user approves. Shape: a five-ingredient pitch at fat-marker altitude or a single verdict. Visual: nine sections in order ending in an observable acceptance checklist. |

## Inputs

- Required: user commitment to a direction and a descriptive name for the plan.
- `mode` (optional): `score`, `breakdown`, `shape`, or `visual`. Absent means the default authoring procedure.
- Optional: stated type/tier preference; any pinned evidence or references the user supplies.
- Score mode: the plan text or feature description to score.
- Breakdown mode: the goal description plus any existing `tasks/plan.md` or `tasks/todo.md` content, spec, and codebase conventions.
- Shape mode: the pitch or idea (raw concept, shaped document, or finished artifact) and an optional sub-mode `build-shape`, `shape-check`, `to-good-shape`, or `feel-shape`.
- Visual mode: the goal statement; everything else is researched read-only from the repository.

## Procedure

1. **Select mode.** Route by the ask: score or stress-test a plan against the quality bar → Mode score; break a goal into dependency-ordered tasks → Mode breakdown; shape, pitch, gut-check, or match a result to a bet → Mode shape; build and visualize a plan page → Mode visual. Otherwise continue at step 2. An explicit mode input always wins. Done when: the mode is selected.
2. **Classify type.** Map the user's ask to one of: Product Plan, Technical Plan, Research Brief, Operational Plan. Map the tier to one of: Exploration, Proposal, Execution, Audit. Done when: type and tier are classified.
3. **Research prior work.** Read every file under plans/ relevant to the direction. Record what already exists and what gaps remain. Done when: existing plans under plans/ are read and gaps recorded.
4. **Research knowledge base.** Query available context (memories, session notes, codebase knowledge) for relevant facts, constraints, and prior decisions. Done when: relevant facts, constraints, and prior decisions are queried.
5. **Research live data.** When the plan requires measurable or factual grounding, fetch current evidence: live search, API lookups, or tool calls that read current state. Done when: current evidence is fetched when the plan requires it.
6. **Surface origin tensions.** Flag any contradictions between prior work, stated knowledge, and live data. List them as open questions in the plan. Done when: contradictions are listed as open questions.
7. **Draft the context brief.** Write one paragraph summarizing the direction, the classified type and tier, and the key tensions surfaced. Present it to the user. Done when: one paragraph covering direction, type, tier, and tensions is presented.
8. **Await acknowledgment.** Do not proceed to file write until the user confirms the context brief is accurate. Done when: the user confirms the context brief.
9. **Write the plan artifact.** Write plans/{type}-{descriptive-name}.md. If a file at that path already exists, append a date stamp to the filename before writing. Done when: the file is written at the correct path (date-stamped on collision).
10. **Lead with the type-correct answer.** Open the file with the answer, conclusion, or verdict first, before any background or rationale. Done when: the file opens with the answer before any background.
11. **Include sourced metrics, questions, and references.** Every factual claim in the plan carries a source or a citation marker. Open questions are listed explicitly. Done when: every factual claim carries a source and open questions are listed.
12. **Declare done.** Report the written file path and confirm that type, tier, research checks, acknowledgment, leading answer, and sourced references are all present. Done when: the file path is reported and all checks confirmed present.

### Mode score

Run instead of steps 2-12.

1. Bound scope. Extract the stated goal, constraints, and known dependencies from the supplied plan or feature description. Ask one precise clarifying question when information is missing; do not assume scope. Done when: goal, constraints, and dependencies are extracted or a clarifying question is asked.
2. Draft or normalize the plan to seven parts: goal (one-sentence desired outcome), scope (included and explicitly excluded), steps (numbered, ordered, each stating who does what and what evidence proves it done), feasibility check, assumptions, risks (each named with a mitigation), and testability. Done when: all seven parts are present.
3. Score six dimensions on a deterministic 1-5 rubric: completeness (full goal, no gaps in steps or evidence), feasibility (each step executable with the stated authority and inputs), scope (included/excluded boundary explicit and non-contradictory), testability (each step names evidence that proves it done), risk (every risk named with a mitigation), assumptions (every assumption stated and checkable). Score 5 only when the dimension is fully satisfied; below 5, name the specific gap. Done when: every dimension has a numeric score and named gaps.
4. Revise to close the named gaps and re-score, up to 5 iterations. When a revision opens a new gap in a previously scored dimension, revert to the last fully scored state and name the new gap. Stop at 5/5 on all dimensions, a named blocker outside reversible-local authority, or the iteration limit. Done when: every dimension scores 5, a named blocker is recorded, or 5 iterations complete.
5. Deliver the plan file and a review report stating each dimension score, what changed in each iteration, any named blockers, and the final verdict. Done when: the plan file and review report are written with per-dimension scores and the iteration log.

### Mode breakdown

Run instead of steps 2-12. Chat output only; no file is written.

1. Parse the goal and extract constraints. Read the goal, any spec or requirements, and the relevant codebase sections. Identify existing patterns and conventions. Ask clarifying questions when scope is unclear. Done when: the goal is parsed, constraints are extracted, and scope is clear enough to derive acceptance criteria.
2. Build the dependency graph and slice work vertically. Group work into end-to-end feature paths rather than horizontal layers; each vertical slice delivers one complete, testable feature. Implementation proceeds bottom-up from the deepest dependency. Done when: the dependency graph is determined and work is grouped into vertical, testable slices.
3. Write each task with a short descriptive title, a one-paragraph description, one to four specific testable acceptance criteria, named dependencies on other task numbers (or "none"), and a size bound: XS (1 file), S (1-2 files), M (3-5 files), L (5-8 files; subdivide when it spans more than one focused session). Split any task that touches two or more independent subsystems or whose title contains "and". Done when: every task has title, description, acceptance criteria, dependencies, and size.
4. Order tasks bottom-up so dependencies land before dependents, each task leaves the system in a working state, a checkpoint follows every two to three tasks, and high-risk tasks are flagged for early execution. Done when: the order satisfies dependencies with working-state checkpoints and high-risk flags.
5. Present the breakdown in chat: ordered task list with acceptance criteria and scope, dependency order, checkpoints, identified risks, and open questions. Require explicit user approval or revision before exiting. When an unchecked `tasks/plan.md` or `tasks/todo.md` exists, stop and describe the conflict; do not overwrite, delete, or bulk-close existing items without explicit confirmation. Done when: the user explicitly approves or requests revision and the report carries every required part.

### Mode shape

Run instead of steps 2-12. Chat output only; no file is written. A shaped pitch has five ingredients: problem, appetite, solution, rabbit holes, and no-gos. Draw it at fat-marker altitude as a breadboard, never a wireframe or slogan. Fat-marker rules and altitude tests live in [breadboarding.md](references/breadboarding.md).

Route by phrasing; an explicit sub-mode always wins:

- Raw idea, "shape this", "pitch this", "what's the appetite" → build-shape.
- "gut check", "vibe check", "does this feel right" → shape-check.
- Existing pitch plus "fix", "reshape", "is this well shaped" → to-good-shape.
- Finished work plus "did we ship the bet", "match the plan", results review → feel-shape.
- Anything else → build-shape.

1. build-shape. State the problem in the user's terms; set the appetite (small or big batch; the appetite bounds the solution, and a solution that exceeds it gets cut); rough the solution as a breadboard of places (underlined names), affordances (bracketed names), and connections (arrows); hunt rabbit holes and declare each solved-in-principle or patched out with a stated decision; write the no-gos. Done when: all five ingredients are present at fat-marker altitude.
2. shape-check. Run an interactive gut check through the ask-user tool: one single-select question per axis (appetite right-sized, which scope cuts, each unresolved rabbit hole patched or re-shaped, no-go boundaries holding), the recommended option first, at most 4 questions per fire, sequential batches in dependency order when axes remain, multiSelect only for additive picks. Done when: every axis is answered or the remaining axes are listed as open bets.
3. to-good-shape. Diagnose the pitch in one line, then act: over-shaped (wireframes, field lists, task tickets) → raise the altitude, redraw as a breadboard, discard the pixel decisions; under-shaped (words without a walkthrough, unbounded appetite) → force an appetite and walk one concrete path; missing ingredients → add the absent ones. Then rewrite the pitch. Done when: the rewritten pitch carries all five ingredients at fat-marker altitude.
4. feel-shape. Compare a finished artifact to the shaped bet ingredient by ingredient: problem addressed, appetite bet vs actual spend, solution follows the breadboard's places and connections, which rabbit holes bit and what they cost, no-gos respected or crossed. Emit exactly one verdict: `shipped-the-bet`, `scope-crept`, `under-delivered`, or `different-bet`. Done when: the single verdict is emitted with per-ingredient evidence.

### Mode visual

Run instead of steps 2-12.

1. Bound scope before any mutation: restate what will change and what is intentionally out. Research and composition are read-only; the only writes are creating the diagrams directory when missing and the single final page write. Done when: scope is bounded with in/out stated.
2. Research the repository for the goal: entry points, existing patterns, affected modules, public APIs, tests, config/schema/data model, similar features, and constraints from README, CHANGELOG, and docs. Stop rather than invent evidence the repo does not provide; record evidence gaps in the page. Done when: every research dimension is gathered or recorded as an evidence gap.
3. Compose a self-contained HTML page with no remote assets: inline styles, collapsible detail sections, and diagrams as Mermaid with an inlined renderer or hybrid cards. Use exactly these nine sections in order: Goal and scope; Current state; Proposed design; Implementation sequence; File map; Interface/contracts; Risk and decision matrix; Test plan; Acceptance checklist. Let overview and architecture dominate; keep file, test, and reference detail compact or collapsed. Done when: the page has all nine sections in order.
4. Choose the target path in the diagrams directory the user named, else `~/.agent/diagrams/`, with the file named for the goal. Create only that directory when it does not exist. Never probe writability with zero-byte, scratch, or placeholder files: the final write in step 5 is the writability proof. Done when: the target path is chosen and the directory exists.
5. Write the complete page in one operation to the final path. Never write a partial, empty, or placeholder page, and never fall back to another location. Done when: the complete page is written to the final path.
6. Open the written page in the user's default browser. Done when: the page is opened or the open failure is reported.

## Failure and recovery

- No direction or name supplied. Skill stops. No plan is written.
- Research read failure. Log the failure. Continue with remaining research streams. If all streams fail, write the plan with an explicit "unverified" section listing every failed check.
- File write failure. Do not write a partial file. Report the error and the rollback: no artifact is left behind.
- User withholds acknowledgment. Skill stops. No file is written. Report the blocked state.
- No research findings. Write the plan with a "Sparse" marker and an explicit list of what was checked and found empty.
- Mode score: no feature description and the user declines clarifying questions → stop with "no plan written: feature description required"; do not assume scope. Iteration limit reached without 5/5 → output the plan with current scores, name every dimension below 5, and state "plan did not reach 5/5" in the review report. Named blocker outside reversible-local authority → name the blocker in the review report and state what resolution is needed; do not present the plan as done. Revision opens a new gap in a previously scored dimension → revert to the last fully scored state and name the new gap.
- Mode breakdown: scope too vague to derive acceptance criteria → stop and ask for a clearer description rather than guessing. Dependency cycle or unknown prerequisite → stop and report the specific cycle or gap. A task with no testable condition → stop and flag the task. Existing incomplete plan for different work → stop and ask; do not overwrite or bulk-close items. User approves a partial plan → record which tasks are approved and which remain open rather than claiming the full plan is done.
- Mode shape: malformed pitch → state the failure and ask for clarification; do not fabricate ingredients. No resolvable axes for shape-check → state that and fall back to build-shape to fill the gaps. Ambiguous feel-shape evidence → mark the ingredient `unknown`, state it, and still emit the verdict.
- Mode visual: unbounded goal or missing research evidence → stop, report `blocked-input` with what is missing, write nothing. Write blocker (directory creation fails, permission denied, quota, read-only filesystem) → report `write-blocker` with the exact error and stop; the filesystem is left as found: no probe files, no scratch paths, no cleanup deletions, no fallback location. Incomplete or incorrect page at the target from this run → replace it with one complete write or delete that single page as rollback; never leave it and claim done. Browser open fails → report it; the done predicate is the written page, not the open.

## Output

Default: a file at `plans/{type}-{descriptive-name}.md` (or `-{date}.md` on collision) containing the type-correct answer first, then classified type and tier, sourced metrics, open questions, and references; not done until the user acknowledges the context brief.
Mode score: a plan file (`PLAN.md` or user-named) plus a review report with six-dimension scores, iteration changes, named blockers, and the final verdict; or a one-sentence refusal naming the missing input.
Mode breakdown: a task-breakdown report in chat with an ordered task list, per-task acceptance criteria and scope, dependency order, checkpoints, risks, and open questions, explicitly approved by the user; no file written.
Mode shape: a shaped pitch in chat with five labeled ingredients at fat-marker altitude (build-shape, to-good-shape), a revised pitch with answered axes folded in and unanswered axes listed as open bets (shape-check), or one verdict per ingredient with evidence plus the single top-line verdict (feel-shape).
Mode visual: the final page path, confirmation of the nine sections in order ending with the acceptance checklist, and the browser-open result; otherwise `blocked-input` with what is missing, or `write-blocker` with the exact error.
