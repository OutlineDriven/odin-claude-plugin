---
name: perspective-complete-review
description: 'Use when asked to run review-and-fix cycles for one named viewpoint until that viewpoint reports no further findings. Leaves the reviewed artifact with machine-owned defects fixed and a written verdict for that viewpoint. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Perspective complete review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants review and fix cycles for one viewpoint until that viewpoint is quiet. |
| Authority | Reversible-local: write only the reviewed artifact, its fix patches, and the review report for this one viewpoint; every applied fix is rolled back by restoring the recorded baseline. |
| Side effect | Reviewed artifact mutated only by applied in-scope fixes, plus one review report holding the fix patches and verdict. No file outside the declared review scope is written, and no out-of-scope file is edited to make a fix fit. |
| Done | The chosen viewpoint has no further findings: a complete fresh-reviewer cycle returned zero findings for that viewpoint. Machines own logic, races, panics, and vulnerability checks; humans own taste, architecture, and problem choice. |

## Inputs

- Reviewed artifact: one local file, diff, or directory. Required; it must exist and be writable before the run starts.
- Viewpoint: exactly one named seat, for example logic, races, panics, vulnerability, or another single perspective the user names. Required; a run covering two viewpoints is invalid.
- Acceptance checks: commands or test invocations that prove the artifact still works. Optional; when absent, every verdict is reported as reviewer-verified only.
- Cycle budget: maximum review cycles before the run stops. Optional; default 5.
- Baseline: version control state or a file copy taken before the first fix. Optional as a supplied input and mandatory as a step; when the user supplies neither, the run creates a file copy.

## Procedure

1. Bound scope before mutation. Confirm the artifact is local and writable and that exactly one viewpoint is named. If the artifact is missing, not local, or zero or multiple viewpoints were named, stop without writing anything.
2. Record the baseline. Capture the artifact state with version control or a file copy, then run the acceptance checks once to record the starting result. Record `no checks supplied` when none were given.
3. Write the viewpoint charter at the top of the review report: the viewpoint name, what it examines, what it ignores, and the ownership split. Logic, race, panic, and vulnerability findings are machine-owned and fixable. Taste, architecture, and problem-choice findings are human-owned and recorded as questions only.
4. Run a review cycle with a fresh reviewer. Each cycle starts from an isolated context: the reviewer sees the current artifact state and the viewpoint charter only, never earlier cycle reports, fix justifications, or debate history. When more than one model family is available, run the reviewer on a different family than the one applying fixes; when only one family exists, keep the isolation and mark the cycle `same-family`. Record which family each cycle used.
5. Return each finding as location, concrete defect, evidence, and a minimal fix proposal. Drop findings outside the viewpoint charter or outside the artifact; list out-of-scope ones under human questions instead of fixing them.
6. Apply fixes one at a time. For each machine-owned finding inside scope, apply the minimal patch, re-run the acceptance checks, and record the patch (file, location, change, check result) in the report. Revert any fix whose checks fail or whose completion would require edits outside the artifact, and record it as unresolved with the evidence.
7. Repeat step 4. The viewpoint is quiet only when a complete fresh-reviewer cycle returns zero findings. Stop with `non-converged` when the cycle budget is exhausted without a zero-finding cycle, or earlier when the same defect is re-reported after its fix was applied and check-verified.

## Failure and recovery
- Invalid input (missing or non-local artifact, zero or multiple viewpoints): stop before any write and return `blocked` with the missing or conflicting input named.
- Reviewer unavailable or a review cycle errors out: stop the campaign, keep fixes already applied and check-verified, and return `blocked` with the report showing the last completed cycle. Never substitute an unrun cycle with an assumption of quiet.
- A fix fails its acceptance checks or needs out-of-scope edits: revert that patch immediately, record it as unresolved with evidence, and continue the cycle with the remaining findings.
- Non-convergence (cycle budget exhausted, or a defect re-reported after a verified fix): stop, keep check-verified fixes, and return `non-converged`. Quiet is claimed only by a zero-finding cycle, never by budget exhaustion.
- User rejects the result: restore the baseline so the artifact returns to its pre-run state and mark the report reverted.
- No failure is swallowed: every error, revert, and unresolved finding appears in the report, and the terminal classification reflects the state that actually held at stop time.

## Output
- One review report next to the reviewed artifact, named `<artifact-basename>.<viewpoint>-review.md` or the user-supplied path, containing the viewpoint charter, the per-cycle log with the model family used, every applied fix patch with its check result, human-owned questions, unresolved findings, and the terminal classification.
- Terminal classification, exactly one of: `quiet` (last full cycle returned zero findings), `non-converged`, or `blocked`.
- Artifact state: check-verified fixes applied, or baseline restored on rejection.

## Provenance

- Origin: user-curated Skill Foundry idea `perspective-complete-review` (candidate `curated:curated-ideas:curated-026`) from the user's curated ideas brief, supplemented by the user's raw session notes.
- Pinned revision: none.
- License: project-owned user brief; no third-party expression copied.
- Adaptation: the curated one-line workflow was expanded into this bounded single-viewpoint loop; the raw session notes were normalized into the fresh-reviewer mechanism (isolated context, different model family) and were not copied verbatim.
