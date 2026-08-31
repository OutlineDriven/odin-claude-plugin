---
name: node-core-contribution-cycle
description: 'Use when a human invokes this workflow on a nodejs/node checkout to build core, change src/, lib/, or doc/api/, add a CLI flag, draft commits or a PR, or review a core PR. Not for automated runs; publishing or credential use requires human direction after preview.'
disable-model-invocation: true
---

# Node core contribution cycle

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly invokes this workflow for a nodejs/node checkout to build core, change `src/`, `lib/`, or `doc/api/`, add a CLI flag, draft commits or a pull request, or review a core pull request. |
| Authority | Modify and build only the named checkout. Before using credentials, publishing a branch or pull request, or performing any irreversible action, preview the exact target and consequence and obtain explicit human direction for that action. |
| Side effect | The workflow may configure and build Node locally and create DCO-signed commits in the named checkout; it may publish only the explicitly previewed branch or pull request. |
| Done | Every `src/` or `lib/` edit has been followed by a rebuild, `make lint` passes, the merge-base clang-format diff is empty, every commit is DCO-signed and passes `core-validate-commit`, and each commit has an imperative `subsystem: subject` of at most 50 characters with a why-focused body wrapped to 72 columns. |

## Inputs

Required: the nodejs/node checkout path, the contribution or review target, its intended subsystem and behavior, and the base branch or revision used to compute the merge base. For a CLI flag, supply the spelling, semantics, default, parsing location, help text, documentation location, and tests expected by the checkout. For a review, supply the pull-request branch or diff and its stated intent. Publishing additionally requires the human-specified remote, branch, repository, and pull-request target. Credentials are never requested or used until that publish target and consequence have been previewed. Existing checkout configuration, platform toolchain choices, and project scripts are authoritative; do not invent missing build or validation evidence.

## Procedure

1. Confirm the checkout is nodejs/node, record the base revision and current changed-file set, and classify the task as source/library, `doc/api`, CLI, build/configuration, commit/PR drafting, or review. Bound all edits, builds, commits, and publication to the named checkout and stated contribution. Done when: the checkout is confirmed and the task is classified.
2. Read the checkout's contribution guidance and the nearest implementation, tests, documentation, configure logic, and build rules for the affected subsystem. Reuse its established command and file patterns rather than introducing a second convention. Done when: the contribution guidance and nearest patterns are read and recorded.
3. Configure with the checkout's supported configuration entry point and only the options required by the target platform or change. When build-system or configure behavior changes, update the owning configuration/build declaration and verify both the generated build behavior and the user-visible option contract. Done when: configuration is applied and both build behavior and option contract are verified.
4. Implement the smallest complete change. For `src/` or `lib/`, preserve Node's internal boundary conventions, including use of existing primordials where surrounding core JavaScript protects built-ins from user mutation. For a CLI flag, update parsing, validation, help output, documentation, and observable tests together; reject invalid values at the parsing boundary. Done when: the smallest complete change is implemented with all surfaces updated together.
5. After every edit under `src/` or `lib/`, rebuild Node from the configured checkout before continuing. Stop on the first compile or link failure and report the failing command and diagnostic; do not treat a stale binary as evidence. Done when: Node rebuilds successfully after each src/ or lib/ edit.
6. Keep `doc/api` synchronized with the observable behavior and local documentation structure. Examples, option names, defaults, stability claims, and cross-references must match the implemented interface; do not claim behavior that was not exercised or established by the checkout. Done when: doc/api matches the implemented interface with no unexercised claims.
7. Run the focused tests or scenarios covering the changed behavior. Then run `make lint`. Compute the merge base against the supplied base revision, run the checkout's clang-format workflow over that diff, and require the resulting formatting diff to be empty. Record exact commands and outcomes. Done when: focused tests pass, `make lint` passes, and clang-format diff is empty.
8. For review work, compare the stated intent with implementation, tests, documentation, CLI/configuration effects, build portability, and protected-built-in usage. Separate blocking correctness findings from non-blocking suggestions, cite the affected location and observable consequence, and do not approve when required evidence is absent. Done when: review findings are separated into blocking and non-blocking with cited locations.
9. Create each commit with DCO sign-off. Use an imperative `subsystem: subject` no longer than 50 characters and a why-focused body wrapped to 72 columns. Run the checkout's `core-validate-commit` check for every commit and amend locally until it passes; do not bypass or suppress a failed check. Done when: every commit is DCO-signed, properly formatted, and passes `core-validate-commit`.
10. Before any push or pull-request creation, show the remote repository, branch, commit range, target branch, title/body, and publication consequence. Publish only the exact preview explicitly directed by the human. The pull-request description states the problem, rationale, observable change, tests and commands run, and any genuine limitation; it contains no invented evidence. Done when: the human directs publication after preview, or the preview is rejected and no publish occurs.
11. Finish only when the rebuild cadence and all lint, formatting, test, DCO, commit-validation, documentation, and review obligations applicable to the changed surface are evidenced and the final changed-file and commit sets remain within scope. Done when: all obligations are evidenced and the changed-file and commit sets are within scope.

## Failure and recovery

- **Invalid or incomplete input:** stop before mutation and return `blocked` with the missing checkout, base, target, semantics, or publication coordinates.
- **Build, test, lint, formatting, or commit-validation failure:** retain the bounded local work, report the exact command and diagnostic, and return `failed-checks`; never publish or claim completion. Correct within scope and rerun the failed check plus any check invalidated by the correction.
- **Scope widening:** stop before touching the newly implicated files and return `blocked` with the additional scope required. Do not silently broaden the contribution.
- **Missing or contradictory project evidence:** return `blocked` with the conflicting file, command, or behavior. Do not guess a flag contract, build option, documentation claim, or review verdict.
- **Publication failure or wrong preview:** do not retry against a different remote, branch, repository, or target. Preserve local commits, report any confirmed remote effect, and return `publish-failed`; recovery requires a new explicit human direction after an updated preview.
- **Partial result:** identify changed files, commits created, checks passed, checks failed or not run, and any confirmed remote state. A partial result never satisfies Done.

## Output

Return the bounded changed-file and commit sets, base and merge-base revisions, rebuild commands, focused test and `make lint` and clang-format-diff and DCO and `core-validate-commit` results, documentation and CLI/configuration surfaces updated, review findings when applicable, and publication coordinates plus confirmed remote state when publication was explicitly directed. Terminal classification: `complete`, `blocked`, `failed-checks`, or `publish-failed`.
