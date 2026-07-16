---
name: simplify
description: Use when the user says "simplify this diff", or asks for a compression pass over a change-set.
metadata:
  short-description: Three-axis compress pass on a diff
---

# Simplify: axis-decomposed compression pass on a diff

A deliberate simplification pass invoked on a specific change-set. Decompose simplification into three axes that fail independently and so can be reviewed independently: **reuse** (what already exists), **quality** (shape of the new code), **efficiency** (cost of the new code). Three parallel read-only review agents, one per axis, emit findings against the same diff; the orchestrator composes, audits, and applies fixes one issue-class per atomic commit.

**Reuse axis** detects new code written where a utility already exists. **Quality axis** detects unnecessary surface (params, state, comments-of-what) and structure without functional cause (wrappers, ladders, copy-paste variants). **Efficiency axis** detects work that need not happen and structure that bloats hot paths. Behavior is preserved, entropy is reduced.

**Axis prompts (verbatim, copy-pasteable):**
- `references/reuse.md`: Agent 1 prompt, four rules, Graft focus
- `references/quality.md`: Agent 2 prompt, nine patterns, Excess + Sprawl
- `references/efficiency.md`: Agent 3 prompt, seven patterns, Excess + Sprawl
- `references/orchestration.md`: single-message dispatch recipe, composition, Reviewer audit, fix-sequencing

## Mandates, not suggestions

1. **Decompose by axis, never by file.** All three agents see the same diff and bring different lenses. Splitting the diff by file across agents defeats the design.

## When to Apply

- The user says "simplify this diff / PR / branch", "tighten up", "compress these changes", or asks for an axis-decomposed pass over a change-set.
- A diff exists and exceeds the trivial threshold (>30 LOC or >2 files): enough surface area for axis decomposition to pay rent.
- The change just landed and is being compressed before merge.

## When NOT to Apply

- **Empty diff** after all fallbacks: exit 11, pass-through.
- **Single file <50 LOC** with an obvious shape problem: just edit directly.
- **Opportunistic cleanup while touching nearby code**: that is `cleanup-codebase`'s territory.
- **Public API removal with migration**: that is `refactor-break-compat`'s territory.
- **Read-only assessment, no fix authorization**: use `review`.
- **Fix driven by an external verifier failure or findings file**: use `fix`. `simplify` is self-sourcing.

## Workflow

1. **Phase 1: Detect diff scope.** The diff must capture **all branch state under review**: every commit since the branch diverged from its base, plus staged, plus unstaged. The orchestrator does not guess the base; it resolves an explicit anchor, or errors. Resolve via the first base ref that exists, then run `git diff <base>` (no `..HEAD`, so working-tree changes are included):
   1. `git merge-base HEAD origin/main`
   2. `git merge-base HEAD origin/master`
   3. `git merge-base HEAD main`
   4. `git merge-base HEAD master`
   5. `@{upstream}` (the branch's configured upstream tracking ref, full divergence)

   If none of the five resolve, gate the working-tree-only fallback on **two ordered checks**: first that HEAD exists as a commit at all, then that it has no parent:
   - **Check A:** `git rev-parse --verify HEAD 2>/dev/null`. If it **fails**, HEAD is unborn (fresh `git init`, no commits yet). Skip `git diff` entirely and fall through to the user-named-files / no-git-context path below. Do not run `git diff HEAD` on an unborn HEAD; it errors and would mask the unborn state.
   - **Check B:** only if Check A succeeded, run `git rev-parse --verify HEAD^ 2>/dev/null`. If it **fails**, HEAD is the repo's root commit (real commit, no parent), so there is no committed history that could be silently dropped. The entire scope IS the working tree. Use `git diff HEAD`. Surface a one-line note: "scope: working-tree only, on root commit".
   - **Otherwise:** both checks succeeded, so committed history exists but no base ref resolves to anchor it. **Error explicitly**: print "committed history exists but no base ref resolves (none of origin/main, origin/master, main, master, @{upstream} found); re-invoke with explicit base: `simplify against <ref>`" and abort. Do **not** fall back to `git diff HEAD`. On a local-only `main`/`master`/`trunk`/`develop` with committed work, that would silently drop the committed work, and the scope contract requires capturing every commit since branch divergence plus staged plus unstaged.

   If there is no git context at all (no `.git/`), or HEAD is unborn per Check A, fall back to user-named files supplied in the invocation. Empty after all valid resolutions → exit 11. See `references/orchestration.md` for the exact resolution shell snippet and the explicit-base override syntax.
2. **Phase 2: Dispatch three review agents in one message.** Single tool-call message containing three Agent invocations. Each agent receives `<axis-prompt from references/> + "\n\n---\n\nDIFF:\n" + <captured diff>`. Agents are read-only; no edits, disjoint axes, independence asserted in the spawn message. See `references/orchestration.md` for the concrete dispatch shape.
3. **Phase 3: Audit, then apply.** Wait for all three. Aggregate findings by `{axis, file, line, issue-class}`; dedupe identical cross-axis findings. Dispatch a Reviewer agent to audit the composed list against completeness / consistency / accuracy / scope; the Reviewer's output is the **validated survivor set**. The orchestrator applies the survivors directly, one issue-class per atomic commit, and drops non-survivors without comment. No re-adjudication in either direction. Re-run repo-native tests after each commit; on red, auto-revert via `git revert HEAD --no-edit`.

## Constitutional Rules (Non-Negotiable)

1. **Behavior preservation is a gate, not a guideline.** A test regression between pre- and post-simplify is an automatic `git revert HEAD --no-edit`. No `# type: ignore`, no disabling of guards to make tests pass.
2. **The Reviewer audit is the single adjudication authority.** Review agents emit findings; the Reviewer validates them and returns the survivor set; the orchestrator applies the survivors and drops non-survivors without re-litigation in either direction. Arguing with the Reviewer's survivor set in prose is Excess.
3. **Three agents in one tool-call message.** The reuse / quality / efficiency agents are independent by construction: same diff, disjoint issue-class subsets, read-only. Sequential dispatch is rejected at the validation gate.
4. **One issue-class per atomic commit.** Excess-surface fixes, duplication fixes, and structure fixes ride in separate commits per `~/.claude/claude/system-prompt-baseline.md` `<git>` charter "one concern per commit" rule. Mixed-class commits trip exit 15.
5. **A simplify patch that introduces new bloat is a regression.** Post-commit, audit the patch itself for unneeded surface, duplicated logic, structure without cause, or a broken consumer contract. Any hit → revert and re-plan. If any rule here conflicts with `~/.claude/claude/system-prompt-baseline.md`, the baseline wins.

## Validation Gates

| Gate | Pass Criteria | Blocking |
|---|---|---|
| Diff scope detected | `git diff` (or staged / user-named fallback) produced a non-empty change-set | Yes; exit 11 if empty |
| Single-message dispatch | All three review agents launched in one tool-call message | Yes |
| Independence asserted | Spawn message documents the independence argument (disjoint axes, read-only) | Yes |
| Reviewer audit | Composed findings passed completeness / consistency / accuracy / scope check before fixes begin | Yes |
| Behavior preserved | Repo-native tests green after every fix commit | Yes; auto-revert on red, exit 13 |
| No new bloat | Post-fix audit shows no unneeded surface, duplicated logic, structure-without-cause, or broken contract introduced by the simplify patch | Yes; exit 14 |
| Atomic per class | Each commit contains exactly one issue-class (excess-surface OR duplicate OR structure) | Yes; exit 15 if mixed |

## Exit Codes

| Code | Meaning |
|---|---|
| 0 | Clean: simplification landed, all fix commits green, no new bloat introduced |
| 11 | No changes detected: diff empty after all fallbacks; pass-through, no work to do |
| 12 | False-positive-only findings: agents emitted findings but none survived the Reviewer audit; report attached, no patch needed |
| 13 | Behavior regression on a fix: tests went red; offending commit auto-reverted via `git revert HEAD --no-edit` |
| 14 | New bloat introduced: post-fix audit caught unneeded surface / duplicated logic / structure-without-cause / broken contract in the simplify patch; reverted, re-plan required |
| 15 | Mixed-concern commit: a fix commit bundled more than one issue-class; must split before merging |
