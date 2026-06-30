# Shipping Workflow

This file contains the shipping workflow (Phase 3-4). Load it when all Phase 2 tasks are complete and execution transitions to quality check.

## Phase 3: Quality Check

1. **Run Core Quality Checks**

   Always run before submitting:

   ```bash
   # Run full test suite (use project's test command)
   # Examples: bin/rails test, npm test, pytest, go test, etc.

   # Run linting (per the project's configured lint command / active instructions)
   ```

2. **Simplify** (conditional — separate from code review)

   Before code review, invoke **`/simplify`** when the diff is non-mechanical and large enough to benefit (default: **>=30 changed lines**). Skip when the diff is purely mechanical (formatting, dependency bumps, lint-only fixes, generated artifacts).

   This step refines reuse, quality, and efficiency on the **current diff** so any later review sees cleaner code. It is not a substitute for code review.

   Pass `plan:<path>` or a scope hint when the plan or user narrowed what changed. If the skill is unavailable on the harness, skip or do a brief manual pass for obvious duplicate/dead code — code review (step 3) still runs regardless.

3. **Code Review**

   Review the diff with **`/review`** — the portable review skill — as the single path. It self-right-sizes (a lite roster for small, low-risk, code-only diffs; the full roster otherwise), so there is no "escalate to a heavier reviewer" decision and **no harness-specific review detection**.

   **Skip dedicated review only for a purely mechanical diff** — formatting, dependency-version bumps, lint-only fixes, generated artifacts. Note in the shipping summary: `Code review: skipped (mechanical diff)`. All other diffs are reviewed.

   **Review is not fix — two steps:**

   **3a. Review (read-only).** Invoke `/review` with `mode:agent` (add `plan:<path>` when known; `base:<ref>` when the diff base is resolved). Pass **`depth:full`** when the plan, the task, or the user explicitly asked for a full / deep / thorough review — that is the one escalation signal `/review` cannot infer from the diff alone. Parse the JSON.

   **3b. Apply fixes (caller-owned).** Load `references/review-findings-followup.md`: filter on JSON, batch by file, dispatch fix subagents. Orchestrator merges, tests, commits. Then proceed to the Residual Work Gate.

   **If `/review` cannot run at all** — subagent dispatch unavailable, unauthenticated, or hard-capped, returning `status: failed`/`degraded` with no coverage even after its own fallback: skip the dedicated step, note `Code review: skipped (/review unavailable)`, and add an explicit manual diff scan to Final Validation. Never silently ship a non-mechanical change unreviewed.

4. **Residual Work Gate** (REQUIRED when `/review` ran and left actionable residuals)

   After code review and review-findings followup, inspect the **Actionable Findings** summary (or read the run artifact at `/tmp/odin/review/<run-id>/` if the summary was truncated). If one or more actionable findings were not applied in followup, do not proceed to Final Validation until they are resolved or durably recorded.

   **Non-interactive / autonomous sessions (no human can answer — e.g., a headless pipeline):** do **not** call the blocking tool — that would hang the pipeline. After step 3b auto-applied every mechanically-eligible finding, take the `Accept and proceed` path automatically: record the remaining actionable residuals verbatim to the durable Known Residuals sink (the PR description's Known Residuals section, or `docs/residual-review-findings/<branch-or-head-sha>.md` on the no-PR path) and continue to Final Validation. Residuals are recorded, never dropped.

   **Interactive sessions:** Ask the user using the platform's blocking question tool. Fall back to numbered options in chat only when the harness genuinely lacks a blocking tool. Never silently skip the gate.

   Stem: `Code review left N actionable finding(s) not yet fixed. How should the agent proceed?`

   Options (four or fewer, self-contained labels):
   - `Apply/fix now` — load `references/review-findings-followup.md`, dispatch batched fix subagents for remaining eligible findings, run tests, commit if needed; optionally re-run `/review` only after the diff changed materially.
   - `File tickets via project tracker` — load `references/tracker-defer.md` in interactive mode; the agent files tickets in the project's detected tracker (or `gh` fallback, or leaves them in the report if no sink exists) and proceeds to Final Validation.
   - `Accept and proceed` — record the residual findings verbatim in a durable "Known Residuals" sink before shipping. If a PR will be created or updated in Phase 4, include them in the PR description's "Known Residuals" section. If the user later chooses the no-PR `/commit-push` path, create `docs/residual-review-findings/<branch-or-head-sha>.md`, include the accepted findings and source review-run context, stage it with the implementation commit, and mention the file path in the final summary. The user has acknowledged the risk, but the findings must not live only in the transient session.
   - `Stop — do not ship` — abort the shipping workflow. The user will handle findings manually before re-invoking.

   Skip this gate entirely when the review reported `Actionable findings: none.` (and followup applied everything mechanical), or when dedicated review was skipped (mechanical diff or `/review` unavailable). Do not proceed past this gate on an `Accept and proceed` decision (including the autonomous auto-accept) until the agent has recorded whether the durable sink is `PR Known Residuals` or `docs/residual-review-findings/<branch-or-head-sha>.md`.

5. **Final Validation**
   - All tasks marked completed.
   - Testing addressed -- tests pass and new/changed behavior has corresponding test coverage (or an explicit justification for why tests are not needed).
   - Linting passes.
   - Code follows existing patterns.
   - Figma designs match (if applicable).
   - No console errors or warnings.
   - If the plan has a `Requirements` section (or legacy `Requirements Trace`), verify each requirement is satisfied by the completed work.
   - If any `Deferred to Implementation` questions were noted, confirm they were resolved during execution.

6. **Prepare Operational Validation Plan** (REQUIRED)
   - Add a `## Post-Deploy Monitoring & Validation` section to the PR description for every change.
   - Include concrete:
     - Log queries/search terms
     - Metrics or dashboards to watch
     - Expected healthy signals
     - Failure signals and rollback/mitigation trigger
     - Validation window and owner
   - If there is truly no production/runtime impact, still include the section with: `No additional operational monitoring required` and a one-line reason.

## Phase 4: Ship It

1. **Prepare Validation Context**

   Note whether the completed work has observable behavior (UI rendering, CLI output, API/library behavior with a runnable example, generated artifacts, or workflow output), and summarize any manual validation performed. If the user supplied evidence (URL, markdown embed, local artifact path), pass it to `/commit-push-pr` as PR-description context.

2. **Commit and Create Pull Request**

   Load the `/commit-push-pr` skill to handle committing, pushing, and PR creation. The skill handles convention detection, branch safety, logical commit splitting, adaptive PR descriptions, and attribution.

   When providing context for the PR description, include:
   - The plan's summary and key decisions
   - Testing notes (tests added/modified, manual testing performed)
   - Evidence context from step 1, so `/commit-push-pr` can decide whether to ask about capturing evidence
   - Figma design link (if applicable)
   - The Post-Deploy Monitoring & Validation section
   - Any "Known Residuals" accepted in the Phase 3 Residual Work Gate, rendered as a dedicated section in the PR body with severity, file:line, and title per finding

   If the user prefers to commit without creating a PR, load the `/commit-push` skill instead and pass the same Post-Deploy Monitoring & Validation content as commit context so it is not lost.

3. **Notify User**
   - Summarize what was completed.
   - Link to PR (if one was created).
   - Note any follow-up work needed.
   - Suggest next steps if applicable.

## Quality Checklist

Before creating PR, verify:

- [ ] All clarifying questions asked and answered
- [ ] All tasks marked completed
- [ ] Testing addressed -- tests pass AND new/changed behavior has corresponding test coverage (or an explicit justification for why tests are not needed)
- [ ] Linting passes
- [ ] Code follows existing patterns
- [ ] Figma designs match implementation (if applicable)
- [ ] Validation/evidence context passed to `/commit-push-pr` when the change has observable behavior
- [ ] Commit messages follow conventional format
- [ ] PR description includes Post-Deploy Monitoring & Validation section (or explicit no-impact rationale)
- [ ] Simplify: `/simplify` when diff >=30 lines (or skipped with reason)
- [ ] Code review: `/review` ran (self-sized), or skipped (mechanical diff / unavailable — noted in summary); residuals handled via the Residual Work Gate
- [ ] PR description includes summary, testing notes, and evidence when captured

## Code Review

Single portable path: **`/review`** self-sizes (lite roster for small low-risk code-only diffs, full roster otherwise). No harness-native review detection, no escalation tiers.

**Skip** only for a purely mechanical diff (formatting, dep-bumps, lint-only, generated). All other diffs are reviewed.

**Two steps — review is not fix.** (3a) Review-only via `mode:agent`; add `depth:full` when the plan/task/user explicitly asked for a deep review. (3b) Batched fix subagents per `references/review-findings-followup.md`; residuals → Residual Work Gate.

**If `/review` can't run** (no subagent dispatch): skip the dedicated step, note `Code review: skipped (/review unavailable)`, and add an explicit manual diff scan in Final Validation. Never silently ship a non-mechanical change unreviewed.
