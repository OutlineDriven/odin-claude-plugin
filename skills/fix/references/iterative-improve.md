# iterative-improve mode — reviewer-named review-and-fix loop

Activated when the classifier routes to `iterative-improve`: a user asks to
iteratively review and fix an arbitrary code target with a specifically named
installed reviewer and explicit scope. The verifier is the named reviewer
agent, not a repo test command.

## Required inputs

| Input | Required | Notes |
|-------|----------|-------|
| Target | yes | Absolute path to the directory under improvement; resolve relative paths and verify it exists |
| Reviewer | yes | The installed agent or skill that performs every review; the user must name it — no default, no bundled reviewer. Determine kind: namespaced agent (`"kind": "agent"`) or installed skill (`"kind": "skill"`); if ambiguous, ask |
| Scope | yes | Repo-relative globs the loop may touch; if absent, propose `<repo-relative-target>/**` and confirm before launching |
| maxRounds | no | Fix budget; default 5 |
| finalize | no | `{version_bump, narration_strip, docs_pass}` overrides; defaults: version bump when target sits inside a plugin, narration strip and docs pass always |
| decision | no | Continuation only: the user's verbatim ruling, supplied to a fresh run after an escalation |

## Baseline and ledger

Snapshot the current commit as the baseline (or initialize a git repo with an
explicit `code-improver-baseline` identity if the target is not in one, and
record the initialization in the run notes). The baseline is what every scope
check and fix-verification diff is taken against.

Initialize the ledger at `.code-improver/<target>/ledger.json` with an empty
findings list. If a ledger exists on disk, reload it so every prior finding,
rejection, and verdict carries over; rounds restart but re-derivation does not.

## Reviewer probe

If the named reviewer does not resolve in this session, stop with
`halted: "reviewer-unavailable"` and the install instruction for the plugin
that provides it. Do not self-review the target or substitute an inline
imitation — the ledger, scope guard, and escalation guarantees depend on the
real reviewer.

## Round loop (up to maxRounds)

1. Dispatch the named reviewer over in-scope files and collect findings, each
   with a stable id and severity (critical, major, minor). Reviewers verify
   fixes instead of trusting them and may not re-file a rejected finding
   without new evidence. If the reviewer prescribes specialist dispatches,
   execute them (up to 3 waves of 8) and feed reports back until the review
   finishes; a specialist that does not resolve halts like a missing reviewer
   and a failed one is reported to the merge, never dropped.
2. If the review reports zero critical or major findings, exit the round loop
   and go to finalize.
3. Apply fixes for open critical and major findings. Touch only files inside
   the dispatched scope globs; a fix needing an out-of-scope edit is rejected
   with `requires out-of-scope change: <path>`, not made. Register any created
   file with `git add -N <file>`. A behavior-changing fix carries a pin (a
   test that fails pre-fix); a heuristic over strings or severities needs
   table pins; prose and frontmatter fixes need no pin. Never weaken a
   documented guarantee, threat model, or stated behavior — if a real finding
   is structurally unsatisfiable, reject with `structural: true` so the loop
   escalates. Make minimal diffs.
4. Run the scope guard. Diff the working tree against the baseline and match
   every changed path against the declared scope globs: any out-of-scope
   change inside the repository halts the loop. `git diff` cannot see
   untracked files, so guard them by content — hash each (up to 50; name the
   rest as unguarded) and treat a moved hash, a vanished file, or a hash the
   check failed to report as a violation. On any violation, stop with
   `halted: "scope-violation"` and the violating paths.
5. Record a verdict for every finding in the ledger — `fixed` (name the pin),
   `rejected: <specific reason>`, or `deferred` (minor/info only; deferring a
   critical or major finding leaves it open). Write the ledger to disk every
   round and write the cumulative diff to `fixes-round-N.diff`.
6. Detect oscillation: non-decreasing blocking counts over three rounds, the
   same finding open three consecutive rounds, or a finding "fixed" twice. On
   any of these, stop with an `escalation` result naming the finding ids —
   this needs a design decision, not more rounds.

At the round cap, run one final review-only round. If it is not clean, stop
with `capped: true` (NOT converged) and list `open_blocking`. Do not present an
unreviewed fix as done.

## Finalize pass

Strip session narration from in-scope files, collapse version churn to exactly
one bump (only when the target sits inside a plugin and `version_bump` is not
disabled), and run a docs-match-code pass (unless disabled). When a marketplace
manifest repeats the plugin version, bring that file into scope so the one bump
lands in both places.

Scope-check and read every finalize edit for regressions. A narration strip
that rewrote legitimate content, a docs pass that made a statement false, or a
version that is not exactly one increment stops the run with
`halted: "finalize-regression"` and the named sites. Completion additionally
requires no unregistered new files in scope.

## Terminal results

| Result | Condition |
|--------|-----------|
| `converged: true` | Last action was a review with zero critical/major findings |
| `capped: true` | Round cap reached, final review still found blocking issues (NOT converged) |
| `escalation` | Oscillation detected; relay finding ids and the design question |
| `halted` | `scope-violation`, `finalize-regression`, `reviewer-unavailable`, or unregistered new files |

`notes` always travel with the result and must be surfaced.

## Rollback

Nothing is ever committed; all changes stay in the working tree. Revert with
the baseline diff or the per-round `fixes-round-N.diff` artifacts. The ledger
is written every round, so an interrupted run resumes from disk without
re-deriving anything.

## Done when

A final reviewer pass reports zero critical or major findings after all fixes
and finalization edits are scope-checked; otherwise the result is explicitly
capped, escalated, or halted.

## Provenance

Origin: https://github.com/trailofbits/skills, revision
d1f1575cff97816e5cc08af66cd2506099c681d3, file
plugins/code-improver/skills/code-improver/SKILL.md. License: CC-BY-SA-4.0 —
preserve Trail of Bits attribution and the source link, mark modifications,
license adaptations ShareAlike, claim no trademark rights, and never reuse
trail-of-bits-mark.svg as branding. Clean-room adaptation preserving the
reviewer-named, explicit-scope loop mechanism and its ledger, scope-guard,
oscillation, and finalize guarantees without copying the source expression.
