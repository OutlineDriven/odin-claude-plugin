---
name: diff-scoped-browser-qa
description: 'Use when asked to run branch-diff browser QA against a PR or branch. Derives a test matrix from the diff, drives each scenario through a real browser, classifies Pass/Fixed/Skipped/Blocked, runs the automated suite, and writes a dogfood report with a ready/not-ready verdict. Not for live-URL visual audit — use web-design-review. No remote, credential, publish, deploy, or irreversible changes.'
---

# Diff-scoped browser QA

## Contract

| Field | Bound contract |
|---|---|
| Trigger | /diff-scoped-browser-qa [PR number, branch name, or blank for current branch] [--port PORT] |
| Authority | reversible-local — write only the dogfood report under the resolved artifact root, auto-fix commits on the target branch, and transient artifacts in OS temp; recover via git for commits and the on-disk report checkpoint for the report |
| Side effect | Drives a real browser, may autonomously fix small breakages with regression tests and commit them, and writes a dogfood report |
| Done | Every matrix scenario is Pass, Fixed, Skipped, or terminal Blocked; the automated suite result is recorded and the report is finalized |

## Inputs

- Target: a PR number, a branch name, or blank for the current branch. Optional `--port PORT` for the dev server.
- A local dev server command the project supports (`bin/dev`, `rails server`, `pnpm run dev`, or the repository equivalent).
- The `agent-browser` CLI installed on the host.
- Product personas under `<root>/personas/`, optional; if absent, judge each scenario against the product's evident intended users.

## Procedure

1. Resolve the target and diff scope. A blank target means the current branch; the run is already on it, so no isolation is needed. A PR number stays a PR identity through isolation and checkout. Never collapse it to its head ref, whose name may itself be `main`. For a named branch other than the current one, offer isolation in a git worktree. If the user declines, check out the target in place, but first confirm if uncommitted changes would be disturbed. Never switch the primary checkout out from under the user. Never dogfood the trunk on a branch-name or blank target because there is no diff. A PR target always has a base and is always diffable. **Done when:** the target and diff scope are resolved with isolation handled.

2. Resolve the artifact root `<root>`. Read `docs_root` from `<repo-root>/.odin/config.yaml` only (`<repo-root>` = `git rev-parse --show-toplevel`); do not read `config.local.yaml`. Unset -> `<root>` is `docs`. Validate a set value: a repo-relative directory whose real, symlink-resolved path stays inside the repo and is neither the repo root nor under `.git/`; otherwise stop with an error naming `docs_root` and the value — never fall back to `docs`. Create `<root>` if absent. **Done when:** `<root>` is resolved and validated, or the skill stops on an invalid `docs_root`.

3. Verify prerequisites: a local dev server command is available, and `agent-browser` is installed (`command -v agent-browser >/dev/null 2>&1 && echo Ready || echo NOT INSTALLED`). If `agent-browser` is not installed, stop and tell the user to install it; this workflow cannot function without it. **Done when:** a dev server command and `agent-browser` are confirmed present, or the skill stops naming the missing prerequisite.

4. Analyze the diff of the target versus its base. This is diff-scoped, not whole-app exploration — test only what this branch introduced or modified. **Done when:** the diff is analyzed and the test surface is bounded to branch changes.

5. Map the user flows touched by the diff: trace each user-visible change through its whole journey in the app. **Done when:** every user-visible change is traced through its whole journey.

6. Derive the test matrix from the flow model: one scenario per flow crossed with each persona, judged for correctness and for how it feels to that persona. The flow model precedes the matrix, and the matrix precedes any browser work — this order is invariant. **Done when:** the matrix is derived as one scenario per flow crossed with each persona.

7. Create the report checkpoint at `<root>/dogfood-reports/<YYYY-MM-DD>-<branch-slug>-dogfood.md` as soon as the matrix exists, with every scenario at `Pending`. `<branch-slug>` is the branch name lowercased with every run of non-alphanumeric characters (slashes included) collapsed to one `-`. Find a prior run by globbing `<root>/dogfood-reports/*-<branch-slug>-dogfood.md` and resume from it if present. **Done when:** the report checkpoint exists with every scenario at `Pending`, or a prior run is found and resumed.

8. Start the local dev server (on `--port` if given). Drive the browser exclusively through the `agent-browser` direct binary — never Chrome MCP tools (`mcp__claude-in-chrome__*`), another browser MCP, a built-in browser-control tool, or `npx agent-browser` (the direct binary uses the fast Rust client). **Done when:** the dev server is running and the browser is driven through the `agent-browser` direct binary.

9. Execute the matrix one scenario at a time. For each scenario, drive the real browser through its whole journey, judge correctness and persona feel, and record `Pass`, `Fixed`, `Skipped`, or a terminal `Blocked` state. Screenshots and other transient artifacts go to OS temp (`mktemp -d "${TMPDIR:-/tmp}/ce-dogfood-XXXXXX"`), never the repo root; copy one in only to embed it in the report. Update the report after each scenario is judged. **Done when:** every scenario is judged and recorded, and the report is updated after each.

10. Fix loop: when a scenario reveals a small, well-understood, low-risk breakage, fix it and add a regression test that fails before the fix and passes after — or record in the report why no automated test was meaningful. Commit each fix. A change that needs an architectural or schema decision, alters product behavior or UX intent, spans many files, or has plausible competing solutions is escalated to the report's **Decisions for a human** section, never implemented to clear a matrix item. Update the report after each fix is committed. **Done when:** every small breakage is fixed with a regression test and committed, or escalated to **Decisions for a human**.

11. Terminal states. `Blocked (needs human verify)` — an external-interaction leg (OAuth, real email, payments, SMS) that cannot be driven headlessly — and `Blocked (human decision)` — a fix too big to make autonomously — each end that scenario, not the run. Continue the rest of the matrix and never silently re-queue a blocked scenario, on this run or on resume. **Done when:** blocked scenarios end with their terminal state and the matrix continues.

12. Run the project's automated suite once and record its result in the report. A green matrix over a red suite finalizes as a not-ready verdict, not a ready one; chasing that suite green is not this run's job. **Done when:** the automated suite runs once and its result is recorded.

13. Finalize the report with the scenario matrix (every scenario classified), the automated suite result, a ready/not-ready verdict, and the **Decisions for a human** section. **Done when:** the report is finalized with matrix, suite result, verdict, and decisions section.

## Failure and recovery
- Missing prerequisite (`agent-browser` not installed, or no dev server command available): stop, name the missing prerequisite, and tell the user what to install or provide. Do not begin browser work.
- Invalid `docs_root`: stop with an error naming `docs_root` and the value; never fall back to `docs`.
- Browser drive failure mid-scenario: record the scenario at the matching `Blocked` state with the observed failure; do not swallow the error or mark it `Pass`.
- Fix too large or ambiguous: escalate to **Decisions for a human**; do not implement to clear the matrix item.
- Interrupted run: the on-disk report checkpoint (template-shaped, every judged scenario recorded) is the resume point; a later run resumes by globbing the `<branch-slug>` path. The session task list is not the resume point.
- Non-converged result: when one or more scenarios are terminal `Blocked`, the run finalizes as not-ready with those scenarios named; it never pretends the done predicate holds.

## Output
A finalized dogfood report at `<root>/dogfood-reports/<YYYY-MM-DD>-<branch-slug>-dogfood.md` with every scenario classified (`Pass`, `Fixed`, `Skipped`, or terminal `Blocked`), the automated suite result recorded, a ready/not-ready verdict, and a **Decisions for a human** section, plus auto-fix commits on the target branch each with a regression test that failed before and passes after, ordered resolve-target → resolve-root → verify-prereqs → analyze-diff → map-flows → derive-matrix → checkpoint → start-server → execute → fix-loop → terminal-states → run-suite → finalize, ready only when the matrix and suite are both green.
