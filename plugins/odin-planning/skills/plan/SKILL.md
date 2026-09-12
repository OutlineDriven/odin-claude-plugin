---
name: plan
description: 'Use when a user commits to a direction and asks to plan, brief, research, or operationalize it; or wants to enumerate designs, configurations, scenarios, and paths, audit a supplied plan, tune the review flow, or a plan-mode enforcement hook intercepts a plan review, or lock a greenfield architecture and interfaces. Modes: score, breakdown, shape, visual, storm (subject, dimensions, bounds), review (audit or tune), waterfall (brief, constraints, existing paths). Not for four-phase review: use autoplan.'
---

# Knowledge plan

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User commits to a direction and asks to plan, brief, structure, research, or operationalize it; or asks to score a plan against a quality bar, break a goal into dependency-ordered tasks, shape a pitch, render a plan visually, enumerate and diagram a decision field, audit or tune a supplied plan, have a plan-mode enforcement hook intercept a plan review, or lock a greenfield architecture and interface contracts. |
| Authority | Reversible local: default modes write only named local plan artifacts (the plans/ file, the score-mode plan file and review report, and the visual-mode page in the diagrams directory); review audit writes its verdict page and review tune writes its question registry and hook configuration; waterfall writes named architecture and interface contract files. Research is read-only. Storm, breakdown, and shape write no files. Rollback is deleting or reverting those artifacts or restoring prior configuration. No remote, VCS-history, credential, paid, published, or deployed mutation. |
| Side effect | Default writes plans/{type}-{descriptive-name}.md, adding a date on collision; score writes a plan file and review report; visual writes one self-contained HTML page and opens it; review writes a verdict page, atomically persists tuning configuration, or renders the current tuning state for inspect; waterfall writes a locked architecture document for distribution; storm returns an exhaustive field and diagram; breakdown and shape return chat output only. |
| Done | Default: type and tier classified, research checks run, the user acknowledges the context brief, and the file leads with the type-correct answer plus sourced metrics, questions, and references. Score: 5/5 on all six dimensions or a named blocker. Breakdown: every task carries a checkable acceptance criterion and dependency order, and the user approves. Shape: a five-ingredient pitch at fat-marker altitude or a single verdict. Visual: nine sections in order ending in an observable acceptance checklist. Storm: every plausible option is enumerated, cross-referenced, and diagrammed before a choice. Review audit: every plan item has an accuracy classification and final approve, revise, or reject verdict; review tune: the requested state is atomically persisted and re-read, or the inspect request renders the dual-track profile and preference map. Waterfall: the architecture and interface contracts are complete, human-confirmed, locked, and distributed. |

## Inputs

- Default and plan-authoring modes require a user commitment to a direction and a descriptive name for the plan. Mode-specific inputs below replace that requirement where stated.
- `mode` (optional): `score`, `breakdown`, `shape`, `visual`, `storm`, `review`, or `waterfall`. Absent means the default authoring procedure.
- Optional: stated type/tier preference; any pinned evidence or references the user supplies.
- Score mode: the plan text or feature description to score.
- Breakdown mode: the goal description plus any existing `tasks/plan.md` or `tasks/todo.md` content, spec, and codebase conventions.
- Shape mode: the pitch or idea (raw concept, shaped document, or finished artifact) and an optional sub-mode `build-shape`, `shape-check`, `to-good-shape`, or `feel-shape`.
- Visual mode: the goal statement; everything else is researched read-only from the repository.
- Storm mode: the decision subject; enumeration dimensions of designs, configurations, scenarios, implementation paths, or a subset; and optional bounds consisting of constraints, known invariants, or excluded paths.
- Review mode: sub-mode `audit` (default) or `tune`. Audit requires a readable plan path or inline plan text; the plan may be Markdown, text, or a structured document. Tune accepts one of a question id plus preference, enable or disable tuning, or inspect current state; it also accepts an optional question-registry and developer profile.
- Waterfall mode: a project brief naming the product, primary users, and core capability; optional technology, deployment, team, deadline, and integration constraints; and optional existing codebase or prior decisions, limited to named paths.

## Procedure

1. **Select mode.** Route by the ask: score or stress-test a plan against the quality bar → Mode score; break a goal into dependency-ordered tasks → Mode breakdown; shape, pitch, gut-check, or match a result to a bet → Mode shape; build and visualize a plan page → Mode visual; enumerate and diagram a decision field before choosing → Mode storm; audit a supplied plan or tune its question flow → Mode review; lock greenfield architecture and interfaces for parallel execution → Mode waterfall. Otherwise continue at step 2. An explicit mode input always wins. Done when: the mode is selected.
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

### Mode storm

Run instead of steps 2-12. Chat output only; no local artifact is created and no recommendation or chosen path is produced.

1. State the decision subject and the dimensions the user named. If the user did not name any, default to all four: designs, configurations, scenarios, and implementation paths. Done when: the subject and dimensions are named.
2. Bound the field. List the constraints, invariants, and explicitly excluded paths the user supplied. Mark anything unbounded as an assumption, not a fact. Done when: constraints and excluded paths are listed; unbounded items are marked as assumptions.
3. Exhaustively enumerate every plausible option in each dimension. For every option, record a one-line description and the key tradeoff or risk that distinguishes it from neighboring options. Do not turn the options into a recommendation at this stage. Done when: every plausible option has a one-line description and tradeoff.
4. Cross-reference the dimensions. Note which designs enable which configurations, which scenarios stress which paths, and which combinations are mutually exclusive or reinforcing. Done when: enabling, stressing, exclusive, and reinforcing combinations are noted.
5. Diagram the finished field as a tree, matrix, or graph that shows the option set and its cross-references. Every enumerated option must appear in the diagram. Done when: every enumerated option appears in the diagram.
6. Present the diagrammed field to the user without choosing. The user selects from the enumerated, diagrammed field. Done when: the field is presented without choosing.

### Mode review

Run instead of steps 2-12. `audit` is the default sub-mode; `tune` fires when plan-mode enforcement hooks intercept a plan review or the user asks to tune, enable, disable, or inspect the question flow.

#### Audit

1. Receive and bound input. Accept either a plan path or plan text. Record which form was supplied. Do not widen scope beyond the supplied plan. If no plan path or text is supplied, stop and report that no plan was provided. If the path points to a file that cannot be read, stop and report the error. Done when: the input form is recorded and scope is bounded, or a failure terminal is reached.
2. Extract all discrete items from the plan: named changes, file targets, decisions, assumptions, constraints, and action items. Identify items by structural markers (headers, list items, numbered steps, fenced blocks). If fewer than one item can be extracted, stop and report that the plan is empty or unparseable. Done when: every extractable item is extracted, including targetless ones, or the plan is reported empty.
3. Map and audit items. For each item with an explicit target, map it to a codebase file or symbol, read the target, compare the item's described state against the actual content, and classify it: correct (accurately describes current state), stale (codebase diverged), risky (would conflict or break existing code), unsupported (target cannot be verified), or missing (target does not exist). For each targetless item (a decision, assumption, or constraint with no file target), audit it for logical consistency and spec compliance: check that it does not contradict other items or known constraints, and classify it as correct, stale (contradicted by a newer item or external fact), or risky (internally inconsistent or violates a stated constraint). For an unreachable single target, mark it unsupported and continue. Done when: every item has a classification and evidence.
4. Synthesize the final decision using deterministic, non-overlapping thresholds. The decision is the worst classification present, evaluated in severity order: correct < stale < risky < unsupported < missing. Approve when every item is correct or stale (stale items must carry an acceptable rationale). Revise when at least one item is risky but no item is unsupported or missing. Reject when at least one item is unsupported or missing. Include a rationale sentence naming the decisive item. Done when: the final decision and rationale are synthesized from the classification distribution.
5. Write `diagrams/plan-review.html` and display its path. Create the `diagrams/` directory if it does not exist. The page contains the plan title or first line, a table of items with classification and evidence, the final decision and rationale, and a timestamp. If it cannot be written, stop and report the error; do not open the file. Done when: the verdict page is written with all required sections and its path is displayed.

#### Tune

1. Load the question-registry and developer profile from the local harness config directory; treat absent files as empty maps. Done when: the registry and profile are loaded or treated as empty.
2. For an inspect request, render the dual-track profile (declared versus behavior-suggested) and the current per-question preferences, then stop. Done when: the dual-track profile and preference map are rendered.
3. For a per-question preference request, validate that the question id is a member of the review question set and that the preference is one of `never-ask`, `always-ask`, or `ask-only-for-one-way`. Reject unknown ids, listing the valid review question IDs, or invalid values, listing the three valid preferences, before any write. Done when: the question id and preference are validated or rejected with the applicable valid-list detail.
4. For an enable or disable request, set the question-tuning flag in the hook configuration. Done when: the flag is set in the hook configuration.
5. Persist the registry and hook configuration atomically: write to a temporary file in the config directory, then rename over the target. Leave every field the request did not name unchanged. Done when: the registry and hook configuration are persisted atomically with unnamed fields unchanged.
6. Re-read the persisted files and confirm the persisted state matches the request exactly. Done when: the re-read confirms the persisted state matches the request.

### Mode waterfall

Run instead of steps 2-12. This mode writes one architecture document only after the greenfield brief is complete; the document is all-or-nothing and is not distributed before human confirmation.

1. Receive the project brief and constraints. If the brief is missing or names no product, stop and request it rather than inferring scope. Done when: the brief names a product, its primary users, and its core capability, or the step has stopped requesting missing information.
2. Identify the core modules the system requires. For each module, name it, state its single responsibility, and list the data it owns. Do not invent modules the brief does not justify. Done when: every module is named with its responsibility and owned data.
3. Define the interface contracts between modules. For each interface, specify caller and callee modules, request shape (fields and types), response shape (fields and types), error semantics (error codes or categories and their meaning), and versioning strategy (how the contract evolves without breaking callers). Done when: every inter-module interface has all five elements.
4. Identify cross-cutting concerns from the module inventory: for each module, check whether its single responsibility naturally encompasses authentication, logging, configuration, or error propagation. Assign each concern to the module whose responsibility most closely encompasses it. If no module's responsibility encompasses a concern, list it as a blocking open question in step 5 rather than forcing an assignment. Do not leave an assigned concern's ownership ambiguous. Done when: every derivable cross-cutting concern has exactly one owning module, and every non-derivable concern is a blocking open question.
5. Write the architecture document with: system overview (one paragraph naming the product and its purpose), module inventory (table with module name, responsibility, and data owned), interface contracts (one subsection per interface with request, response, errors, and versioning), cross-cutting ownership (table with concern and owning module), and open questions (every decision the human must make before execution begins, marked as blocking or non-blocking). Done when: the architecture document is written with all five sections.
6. Present the architecture document to the human for review. Incorporate requested changes. Once the human confirms, lock the document and distribute it to all execution teams. Done when: the document is locked and distributed.

## Failure and recovery

- No direction or name supplied for a default or authoring mode. Skill stops. No plan is written.
- Research read failure. Log the failure. Continue with remaining research streams. If all streams fail, write the plan with an explicit "unverified" section listing every failed check.
- File write failure. Do not write a partial file. Report the error and the rollback: no artifact is left behind.
- User withholds acknowledgment. Skill stops. No file is written. Report the blocked state.
- No research findings. Write the plan with a "Sparse" marker and an explicit list of what was checked and found empty.
- Mode score: no feature description and the user declines clarifying questions → stop with "no plan written: feature description required"; do not assume scope. Iteration limit reached without 5/5 → output the plan with current scores, name every dimension below 5, and state "plan did not reach 5/5" in the review report. Named blocker outside reversible-local authority → name the blocker in the review report and state what resolution is needed; do not present the plan as done. Revision opens a new gap in a previously scored dimension → revert to the last fully scored state and name the new gap.
- Mode breakdown: scope too vague to derive acceptance criteria → stop and ask for a clearer description rather than guessing. Dependency cycle or unknown prerequisite → stop and report the specific cycle or gap. A task with no testable condition → stop and flag the task. Existing incomplete plan for different work → stop and ask; do not overwrite or bulk-close items. User approves a partial plan → record which tasks are approved and which remain open rather than claiming the full plan is done.
- Mode shape: malformed pitch → state the failure and ask for clarification; do not fabricate ingredients. No resolvable axes for shape-check → state that and fall back to build-shape to fill the gaps. Ambiguous feel-shape evidence → mark the ingredient `unknown`, state it, and still emit the verdict.
- Mode visual: unbounded goal or missing research evidence → stop, report `blocked-input` with what is missing, write nothing. Write blocker (directory creation fails, permission denied, quota, read-only filesystem) → report `write-blocker` with the exact error and stop; the filesystem is left as found: no probe files, no scratch paths, no cleanup deletions, no fallback location. Incomplete or incorrect page at the target from this run → replace it with one complete write or delete that single page as rollback; never leave it and claim done. Browser open fails → report it; the done predicate is the written page, not the open.
- Mode storm: if a dimension cannot be enumerated without inventing evidence, stop work on that dimension, mark it incomplete with the specific gap, and continue with the others. If the diagram omits an enumerated option or shows an unenumerated option, rebuild it from the enumerated list before presenting it. If the user asks to choose or implement during enumeration, restate that this mode enumerates and diagrams only, and resume only after the user confirms that scope. A partial field is deliverable only when every incomplete dimension is explicitly marked; never present it as exhaustive.
- Mode review audit: an unreadable plan stops with the error; an empty or unparseable plan stops with that report; if no targets can be verified because the entire codebase is unreachable, report a fatal audit error and do not produce a verdict page; an unreachable single target is unsupported and does not abort the audit; a verdict-page write failure leaves no page; rollback any unintended file. Mode review tune: reject an unknown question ID without mutation and list the valid review question IDs; reject an invalid preference without mutation and list `never-ask`, `always-ask`, and `ask-only-for-one-way`; on concurrent modification, re-read, re-apply, and re-persist, then block if the conflict persists; on write or rename failure, leave prior configuration intact; always re-read persisted state before claiming done.
- Mode waterfall: an incomplete brief stops without inferring scope. Contradictory constraints are blocking open questions until the human resolves them. If two modules could own data or responsibility, record the ambiguity as a blocking open question rather than assigning arbitrarily. If any step fails after an artifact was started, discard partial outputs; the locked architecture is all-or-nothing and is not distributed. If requested changes contradict existing architecture without withdrawing the contradiction, stop and state the conflict explicitly.

## Output

Default: a file at `plans/{type}-{descriptive-name}.md` (or `-{date}.md` on collision) containing the type-correct answer first, then classified type and tier, sourced metrics, open questions, and references; not done until the user acknowledges the context brief.
Mode score: a plan file (`PLAN.md` or user-named) plus a review report with six-dimension scores, iteration changes, named blockers, and the final verdict; or a one-sentence refusal naming the missing input.
Mode breakdown: a task-breakdown report in chat with an ordered task list, per-task acceptance criteria and scope, dependency order, checkpoints, risks, and open questions, explicitly approved by the user; no file written.
Mode shape: a shaped pitch in chat with five labeled ingredients at fat-marker altitude (build-shape, to-good-shape), a revised pitch with answered axes folded in and unanswered axes listed as open bets (shape-check), or one verdict per ingredient with evidence plus the single top-line verdict (feel-shape).
Mode visual: the final page path, confirmation of the nine sections in order ending with the acceptance checklist, and the browser-open result; otherwise `blocked-input` with what is missing, or `write-blocker` with the exact error.
Mode storm: an exhaustive enumerated field with one-line option descriptions and tradeoffs, cross-references across dimensions, and a diagram of the full field, presented without a recommendation or chosen path; no local artifact.
Mode review audit: `diagrams/plan-review.html` with per-item accuracy verdicts (`correct`, `stale`, `risky`, `unsupported`, `missing`), evidence, and a final `approve`, `revise`, or `reject` decision determined by the severity thresholds. Mode review tune: the persisted question-registry and hook configuration plus a one-line confirmation naming the changed question id or flag and its new value, or the rendered dual-track profile and preference map for inspect.
Mode waterfall: a locked architecture document with sections in order: system overview, module inventory, interface contracts, cross-cutting ownership, and open questions, distributed to all execution teams as the coordination contract for parallel work.
