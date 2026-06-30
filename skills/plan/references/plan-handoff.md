# Plan Handoff

This file contains post-plan-writing instructions: document review, post-generation options. Load it after the plan file has been written and the confidence check (5.3.1-5.3.7) is complete.

## 5.3.8 Document Review

Run a document-review pass on the plan file. This step is mandatory -- do not skip it because the confidence check already ran. The two tools catch different classes of issues:
- The confidence check strengthens rationale, sequencing, risk treatment, and grounding
- Document review checks coherence, feasibility, scope alignment, and surfaces role-specific issues

Apply safe auto-fixes silently and return structured findings text. The post-generation menu (see 5.4) offers a way for users to opt into reviewing open items interactively when they want it.

Capture the review envelope so it can drive the contextual summary above the post-generation menu:
- The number of fixes auto-applied
- The count of remaining findings, broken out by bucket (proposed fixes, decisions, FYI observations)

When the review returns "Review complete", proceed to Final Checks.

## 5.3.9 Final Checks and Cleanup

Before proceeding to post-generation options:
- Confirm the plan is stronger in specific ways, not merely longer
- Confirm the planning boundary is intact
- Confirm origin decisions were preserved when an origin document exists

If artifact-backed mode was used:
- Clean up the temporary scratch directory after the plan is safely updated
- If cleanup is not practical on the current platform, note where the artifacts were left

After all mutations in this run have settled (initial write, deepening synthesis, review auto-fixes), the artifact at its single path reflects the final state.

## 5.4 Post-Generation Options

**Path format:** Use absolute paths for chat-output file references -- relative paths are not auto-linked as clickable in most terminals.

**Summary line above the menu (always):** Print a single concise line summarizing the review state -- e.g., `Review applied 3 fixes. 2 decisions, 1 proposed fix, 4 FYI observations remain.` When no fixes were applied and no findings remain, print `Review clean -- no fixes needed.` This line establishes what the review pass did (or didn't) so the user has the context to choose between the menu options below.

**Question:** "Plan ready at `<absolute path to plan>`. What would you like to do next?"

**Options:**
1. **Start implementation** -- Begin executing the plan. Invoke the implementation skill via the platform's skill-invocation primitive, passing the plan path as the skill argument. If no skill-invocation primitive exists, print a fallback prompt for the user to run.
2. **Persist the plan** -- If the plan hasn't already been saved to disk, write it to `docs/plans/`. Offer this only when the plan is still ephemeral.
3. **Done** -- The plan is ready; the user ends the turn by dismissing the question or picking this option. The plan file is already saved if persisted.

**Menu rendering:** Use the platform's blocking question tool. When the visible menu exceeds the current platform's option cap, render it as a numbered list in chat with the hint "Pick a number or describe what you want." When the platform's blocking tool is unavailable or errors, fall back to the same numbered-list-in-chat rendering. Never silently skip the question.

Based on selection:
- **Start implementation** -> Invoke the implementation skill, passing the plan path. The implementation skill then owns execution. If no skill-invocation primitive exists, print a fallback prompt for the user to run; in that prompt, tell the executor to read the plan's Goal Capsule, Verification Contract, Definition of Done, and active implementation units first rather than the whole document.
- **Persist the plan** -> Write the plan to `docs/plans/<slug>.md` (creating the directory if needed). Read the file back to confirm it landed. Return to the post-generation menu.
- **Done** -> End the interaction. The plan is ready.
- **Free-form input** -> Accept revisions to the plan and loop back to options.
