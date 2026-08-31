---
name: publish-release-pr
description: 'Use when a human runs /publish-release-pr to ship a versioned, redaction-gated PR with its evidence body. Don''t use for tasks that require source changes or without explicit human confirmation for each remote mutation.'
disable-model-invocation: true
---

# Publish release pr

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /publish-release-pr on a branch. |
| Authority | Human-only. The model executes read-only verification steps (tests, coverage audit, review, changelog draft, version classification) directly. Every commit, tag, push, and PR creation is proposed and waits for explicit human confirmation before it runs. No remote or irreversible mutation happens without it. |
| Side effect | Versioned commits, a tag, and a redaction-gated PR carrying a complete evidence body, published to the remote. |
| Done | A versioned PR exists on the remote with its complete evidence body. |

## Inputs

- A current git branch with changes to ship. The base branch is auto-detected from the remote default; supply it explicitly only when detection is ambiguous.
- Optional: a plan file in the repo. When present, its completion is audited and reported in the PR body.
- Optional: an existing open PR for the branch. When present, its body is regenerated from this run's fresh results and its Greptile comments are addressed.

## Procedure

1. **Detect and merge the base branch.** Identify the base branch from the remote default. Fetch and merge `origin/<base>` into the current branch with `--no-edit` so every later step runs against the merged state. Auto-resolve only simple conflicts (VERSION, schema, CHANGELOG ordering); on complex or ambiguous conflicts, stop and show them.

2. **Run the test suites under an evidence ledger.** Read the project's documented test command first; otherwise detect the runtime from marker files and offer the matching runner, never installing a second framework beside a working one. Run each suite through a transparent wrapper that records `{command, exit, working-tree fingerprint, log path}` per lane. Cite that record later instead of re-running when the content has not changed.

3. **Triage every test failure by ownership.** For each failing test, classify it against the branch diff: in-branch if the failing test file or the code it exercises was changed on this branch; pre-existing if neither was touched and the failure is unrelated. When ambiguous, default to in-branch. Stop on in-branch failures: the developer must fix their own broken tests before shipping. For pre-existing failures, present the choice (fix now, log a P0 TODO, blame-and-assign in a collaborative repo, or skip) and act on the answer; a chosen fix is committed separately from the branch's changes.

4. **Audit test coverage of the diff.** Trace every changed codepath and user flow, diagram each branch and error path, and mark gaps with a quality score. Count test files before and after. Apply the regression rule: when the diff broke previously-working behavior, write a regression test immediately, with no gate. Run the coverage gate against the project's configured minimum and target (defaults 60% / 80%); below target, offer to generate more tests (max two passes); below minimum, require an explicit override to proceed. Embed the coverage diagram in the PR body.

5. **Audit plan completion and scope drift.** When a plan file is present, extract every actionable item, verify each against the diff (DONE / PARTIAL / NOT DONE / CHANGED / UNVERIFIABLE, with cross-repo and external-state items confirmed per-item by the human, never blanket-confirmed), and report completion, deferred items, and any scope drift. When no plan file exists, report that. This feeds the PR body's Plan Completion and Scope Drift sections.

6. **Run the pre-landing review.** Engineering review is the only review that gates shipping: it must be clean (or globally skipped) within 7 days, else this step runs its own review with a critical pass (SQL and data safety, LLM output trust boundary) and an informational pass, each finding carrying a confidence score and a quoted motivating line. Always run the adversarial review on every diff: a Claude adversarial pass plus a Codex adversarial challenge; diffs over 200 lines also get a Codex structured review whose `[P1]` markers gate (FAIL asks to fix now, PASS continues). For frontend changes, run the lite design check. Surface CEO and design reviews as informational only; they never block.

7. **Address Greptile comments when a PR already exists.** Fetch the PR's Greptile review comments. For each, fix the issue (tag FIXED), mark it a false positive with evidence (tag FALSE POSITIVE), or note it was already fixed with the fixing commit SHA (tag ALREADY FIXED); suppressed known-false-positives are skipped silently. If any fix was applied, re-run the tests before continuing. Omit the Greptile section entirely when no PR existed yet.

8. **Classify version state and bump.** Classify the version state against the base: FRESH does the bump; ALREADY_BUMPED skips the bump but runs a queue-drift check and, if the queue moved, asks whether to rebump (rewriting the CHANGELOG header and PR title) or keep current; DRIFT_STALE_PKG repairs the manifest to match VERSION; DRIFT_UNEXPECTED stops for manual reconciliation. Decide the bump level from the diff (MICRO under 50 trivial lines, PATCH 50+ with no feature signal, MINOR on a feature signal or 500+ lines, MAJOR on milestones or breaking changes). Pick the slot queue-aware so it does not collide with a sibling workspace; on collision, ask whether to advance past or abort and sync. Write VERSION, the manifest, and existing npm lockfiles (4-digit source of truth in VERSION; npm-valid 3-digit translation in the manifest and lockfiles, never created fresh). Record the release decision durably.

9. **Write the CHANGELOG.** Enumerate every commit on the branch and read the full diff. Group commits by theme and write one unified entry under `## [X.Y.Z.W] - YYYY-MM-DD` with Added / Changed / Fixed / Removed sections. Cross-check: every commit must map to at least one bullet. Lead each bullet with what the user can now do. Do not ask the user to describe changes.

10. **Update TODOS.md.** Cross-reference the project's TODOS.md against the diff and move completed items to the Completed section with the version and date. Create or reorganize the file only with human confirmation. A TODOS failure never stops the ship.

11. **Commit in bisectable chunks.** Group the diff into logical, independently-valid commits ordered infrastructure, then models and services, then controllers and views, each grouped with its tests. The final commit holds VERSION, CHANGELOG, and TODOS.md and carries the version tag. Squash WIP checkpoint commits into their logical commit first; never blind `git reset --soft` when non-WIP commits are present, since that would uncommit landed work and turn the push into a non-fast-forward for anyone who already pushed.

12. **Run the verification gate.** Check the evidence ledger before any completion claim: every test lane must have a fresh record (within 24h) whose command and working-tree fingerprint match, allowing only the metadata paths (CHANGELOG, VERSION, manifest, digest). No fresh evidence, no done claim.

13. **Push the branch.** Propose the push and wait for human confirmation. Push the branch to the remote.

14. **Sync documentation.** Dispatch the documentation-sync step in a fresh context; it updates docs with CHANGELOG clobber protection and risky-change gates, commits, pushes, and returns a documentation section for the PR body. On subagent failure, proceed without the section; do not block the ship.

15. **Create the redaction-gated PR.** Compose the PR body from this run's fresh results: Summary (every substantive commit grouped, excluding the VERSION/CHANGELOG metadata commit), Test Coverage, Pre-Landing Review, Design Review, Eval Results, Greptile Review, Scope Drift, Plan Completion, Linked Spec (Closes #N only when plan completion is fully complete; partial delivery links without auto-closing), Verification Results, TODOS, Documentation, and a checked Test plan. The PR title must start with `v<NEW_VERSION>`. Write the body to a temp file and scan it at the sink with the redaction engine before sending: a HIGH credential finding blocks (exit 3, no skip, rotate and redact first); MEDIUM findings require per-finding confirmation, sterner on a public repo. Wrap tool-attributed output in fenced blocks so quoted example credentials warn-degrade instead of blocking. Create the PR from the scanned file so the bytes scanned are the bytes sent. When an open PR already exists, regenerate the body from scratch, re-scan, and edit it in place, and rewrite the title to start with `v<NEW_VERSION>` (re-fetch and assert the prefix; retry once if wrong). When neither platform CLI is available, print the branch and remote URL for manual creation; the code is pushed and ready.

16. **Apple App Store release (when the repo carries an `.xcodeproj` or `.xcworkspace`, or a Swift package with an app product).** This adapter overrides the branch/PR ceremony for store distribution: a clean base branch is a valid state to archive from; never abort a store release over branch topology. The whole release runs through fastlane (`produce`, `cert`, `sigh`, `gym`, `pilot`, `deliver`, `frameit`); install it when missing with a one-line announcement, not a question. Exactly two human interactions are permitted: first, up front, confirm paid Apple Developer membership, authorize the release, and settle pricing once per app ever (persist it so no later release re-asks); sign in through the host's interactive path and keep the password and session token out of the transcript. Second, only when preflight finds the icon or screenshots missing, ask once which store assets to generate, built from a live check of installed skills. Everything else proceeds under the authorization. Treat every upload and submission as a durable external effect: append an idempotency key to a log before executing and, if the key is already present, inspect App Store Connect rather than re-running. Mint the permanent upload key from the session scoped to the target app (least privilege, never all-apps); never demand an app-specific password while key minting is untried. Classify errors before touching credentials: only a 401/403 or session-invalid error is an auth failure; a validation or precheck error is a metadata problem to fix and retry. A Mac is required only for the build legs; on a non-macOS host, route exactly those legs through a macOS CI runner and keep the rest on the user's machine. In the closing report, disclose the one durable credential the release created so it reaches the user's revocation checklist.

## Failure and recovery
- **In-branch test failure:** stop. The developer fixes their own broken tests before shipping; do not proceed.
- **Complex merge conflict:** stop and show the conflicts; do not auto-resolve ambiguous hunks.
- **DRIFT_UNEXPECTED version state:** stop for manual reconciliation; a manual edit bypassed the pipeline.
- **Redaction HIGH finding in the PR body or title:** block (exit 3). Rotate the credential and redact before creating or editing the PR; no skip.
- **Subagent failure (coverage audit, documentation sync, plan completion):** fall back to running the step inline or proceed without its section; partial results are better than none. Never block the ship on a subagent failure. A plan-completion audit that cannot run is surfaced explicitly, never silently passed.
- **Verification gate without fresh evidence:** no done claim. Re-run the affected lane to produce a fresh record.
- **No paid Apple Developer membership:** stop the App Store path; offer to walk enrollment and name the free-account ceiling honestly (personal-team installs only, expiring after 7 days, no TestFlight, no App Store).
- **Partial-result rule:** every step that completes leaves its evidence in the ledger or PR body; a later step that fails does not erase earlier evidence. Rollback is non-mutation: stop before the next irreversible step rather than undoing a published commit, tag, or upload. Never swallow an error or pretend the done predicate holds. The blocked result names the failing step, the verbatim error, and the exact human action that unblocks it.

## Output
A versioned PR on the remote whose body carries the complete evidence body: summary of every substantive commit, test results and coverage diagram, pre-landing and adversarial review findings, Greptile comment disposition, scope drift and plan completion, verification results, TODOS state, and documentation sync. The branch HEAD is pushed, VERSION and CHANGELOG are bumped, and the release decision is recorded. For an Apple target, the signed build is uploaded and submitted with the durable-effect idempotency log and the standing-credential disclosure in the closing report.

## Provenance

Origin: https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69. License: MIT (Copyright (c) 2026 Garry Tan; LICENSE blob 35029511144443297cad2d26e4bac17d0e352f93). Reuse constraints require retaining the copyright and permission notice and re-deriving expressive prose and code rather than copying wholesale. This skill is a clean-room adaptation: the release-pipeline mechanism (base merge, evidence-ledged tests with ownership triage, coverage audit with regression rule, pre-landing and adversarial review, queue-aware version bump, theme-grouped changelog, bisectable commits, verification gate, redaction-gated PR, and the App Store durable-effect adapter) is re-derived in self-contained procedure form; no gstack expression is copied.
