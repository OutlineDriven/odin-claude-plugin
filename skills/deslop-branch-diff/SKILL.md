---
name: deslop-branch-diff
description: 'Use when asked to remove AI-generated debris from a branch diff. The result is a focused diff matching local style. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Deslop branch diff

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Remove AI-generated debris from a branch diff. |
| Authority | Reversible local edits to branch files only; no remote, VCS-history, credential, or published mutation. |
| Side effect | Edits branch files. Edits are bounded to added/modified diff lines; unchanged context and whole-file reformatting are out of scope. |
| Done | Focused diff matching local style. |

## Inputs

- A branch with uncommitted or committed-but-unmerged changes. Optional: an explicit base ref supplied as `deslop-branch-diff against <ref>`. If no base is supplied, the procedure resolves one; if none resolves and committed history exists, it stops and requires the explicit base.
- Optional: a user-named file list when there is no git context. Without git context and without named files, the change-set is empty and the procedure stops.

## Procedure

1. **Resolve the branch diff scope.** Capture every commit since the branch diverged from its base plus staged and unstaged changes. Try base refs in order and use the first that resolves: `git merge-base HEAD origin/main`, then `origin/master`, then `main`, then `master`, then `@{upstream}`. Run `git diff <base>` (no `..HEAD`, so working-tree changes are included). If none resolves, check HEAD: if `git rev-parse --verify HEAD` fails, HEAD is unborn and the scope is user-named files only; if `HEAD^` fails, HEAD is the root commit and the scope is the working tree (`git diff HEAD`); otherwise stop and request an explicit base, because falling back to `git diff HEAD` on a local-only branch with committed work would silently drop that work.
2. **Enumerate changed files from the diff.** Exclude tests, fixtures, mocks, examples, benchmarks, generated output, vendored code, lockfiles, and build artifacts; they may intentionally contain placeholders, fake tokens, and debug output.
3. **Read local style context.** For each changed file, read the diff hunks plus enough surrounding unchanged lines to judge the file's dominant indentation, naming, comment density, and import ordering. "Matching local style" is the done predicate, so this context is required before any edit.
4. **Identify AI-generated debris in added lines only.** Scan the lines the branch introduced, not unchanged context. Debris classes: debug output left after debugging (console/print/debug macros/shell tracing), excluding output that is the product (CLIs, loggers, entrypoints); placeholder or unimplemented bodies (empty block, no-op, not-yet-implemented throw/abort, `TODO: implement`); commented-out code blocks; restating-the-code comments and motivational or hedging comments ("Let me...", "Now we...", "Here we..."); placeholder text in string literals (lorem ipsum, `foo bar baz`, `replace this`); unused imports or variables introduced by the change; redundant defensive guards that duplicate a check already present in the same path; mixed tabs+spaces or trailing whitespace on added lines.
5. **Classify each finding before editing.** Apply only removals that cannot change behavior: delete debug prints, delete restating/hedging/motivational comments, delete commented-out code blocks, delete unused added imports and variables, and normalize added-line indentation and trailing whitespace to the file's dominant convention. Flag-only, no edit: placeholder implementations on live API surfaces, hardcoded credentials, crash-on-failure shortcuts (forced unwrap, unchecked cast, abort-on-error where failure is recoverable), and dead code requiring control-flow judgment.
6. **Bound every edit to added/modified diff lines.** Never edit unchanged context lines, never reformat the whole file, and never introduce new logic, imports, or abstractions. The diff must shrink or stay focused; it must not grow.
7. **Verify behavior is preserved.** Run the repo's own test command, derived from its manifest in this order: package script (`test`, then `check`, then `typecheck`), `cargo test`, `go test ./...`, `pytest`, `mvn test`, `gradle test`, `dotnet test`, `bundle exec rspec` or `rake test`, `composer test` or `phpunit`, `swift test`. If no command exists, run the narrowest parser/type check available, state the limitation, and treat every fix as unverified.
8. **Rollback on regression.** If verification fails after edits, immediately restore every changed file from the cleanup attempt with `git restore -- <file...>` and rerun the same verifier to confirm the baseline is back. Report the failed edit group as blocked, with file/line and the failing command. Never suppress tests, rewrite expectations, or keep a partial cleanup after regression.

## Failure and recovery
- **Empty change-set:** no diff after all resolutions and no user-named files. Stop, report pass-through, make no edits.
- **No base ref resolves and committed history exists:** stop and request an explicit base (`deslop-branch-diff against <ref>`). Do not fall back to working-tree-only, which would silently drop committed branch work.
- **Verifier regression after cleanup:** restore all changed files via `git restore -- <file...>`, rerun the verifier to confirm baseline, and report the blocked group with file/line and failing command. Rollback is all-or-nothing for the failed group; never keep a partial cleanup after regression.
- **Finding requires behavior or control-flow judgment:** flag-only, no edit. Never swallow the failure or pretend the done predicate holds.
- **No test command exists:** run the narrowest type/parse check, state the limitation, and treat every edit as unverified; the rollback gate has nothing to trip on, so report this explicitly rather than claiming done.

## Output
A compact report: the resolved base ref (or working-tree/root-commit note), changed files cleaned, debris classes removed with file/line, flag-only findings left for manual review, the verifier command and its result, and any rollback action taken. The terminal state is a focused branch diff matching local style with behavior preserved; if regression occurred and rollback ran, the terminal state is the restored baseline with the blocked group named.

## Provenance

Origin: cursor/plugins, path `cursor-team-kit/skills/deslop/SKILL.md`, revision `68836ddaf5697224520f1847d90cdb90ca8babaa`. License: MIT, declared by the cursor/plugins root README and the candidate plugin manifest as recorded in the pinned source audit. Clean-room adaptation: the diff-scoped, behavior-preserving debris-removal procedure was re-derived from the described mechanism; no third-party expression was copied.
