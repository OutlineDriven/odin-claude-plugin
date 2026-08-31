---
name: replace-unsafe-typescript-assertions
description: 'Use when TypeScript tests use unsafe any or as assertions for partial or intentionally invalid fixtures. Replaces eligible assertions with intent-matching safe coercion functions and proves the project typecheck and test suite pass. Not for production source or manifest edits; test files only.'
---

# Replace unsafe TypeScript assertions

## Contract

| Field | Bound contract |
|---|---|
| Trigger | TypeScript tests use unsafe assertions (`value as Type`, `value as unknown as Type`) for partial or intentionally invalid fixtures. |
| Authority | Reversible local edits to the named test files and their import lines. Does not modify production files, package manifests, or lockfiles. |
| Side effect | Eligible assertions are replaced and required imports are added. |
| Done | Every eligible assertion uses the intent-matching coercion function and the project typecheck and test suite both pass. |

## Inputs

- Target test file or bounded directory (required).
- The project's typecheck command (required, resolved from the repository's scripts or task runner).
- The project's test command (required, resolved from the repository's scripts or task runner).

## Refusals

- Production source files: excluded even when they contain the same assertion shape. Test files only.
- Package manifest or lockfile edits: rejected. If the coercion package is absent, stop and report the missing dependency.
- Weakening compiler options or adding assertions to force a pass: rejected. Restore ineligible replacements and record them as skipped.

## Procedure

1. **Ensure the coercion package exists in the project.** Confirm the coercion package (commonly `@total-typescript/shoehorn` or any package providing `fromPartial`, `fromAny`, and `fromExact` equivalents) resolves in the installed dependency tree. If it does not, stop before editing and report the missing dependency. Done when: the package is confirmed present or the procedure has stopped with the missing-dependency report.

2. **Enumerate type assertions in target test files.** Find assertions in `.test.ts`, `.spec.ts`, `.test.tsx`, and `.spec.tsx` files under the bounded target. Confirm the target contains only test files; exclude production source even when it contains the same assertion shape. Done when: every assertion site is enumerated.

3. **Classify assertion intent and replace with the corresponding intent-preserving coercion function.** For each assertion:
   - Replace `value as Type` with `fromPartial(value)` when the fixture intentionally supplies only part of `Type` and every supplied field must still type-check.
   - Replace `value as unknown as Type` with `fromAny(value)` only when the test intentionally supplies an invalid runtime shape.
   - Use `fromExact(value)` only when the test needs the complete object to satisfy `Type` and retaining exactness is the stated intent.
   - Leave branded, opaque, identity-sensitive, and ambiguous assertions unchanged and record the reason.
   Done when: every assertion is classified with its replacement or skip reason.

4. **Update file imports to include added functions.** Add one import containing exactly the functions used. Remove unused names. Merge with an existing import from the package instead of creating a duplicate. Done when: the import line is added or merged with no duplicate.

5. **Run project typecheck and test suite to verify preserved runtime behavior.** Run the repository's typecheck command after the bounded edits. If typecheck fails because a classification was wrong, restore that assertion and import change, record it as skipped, and rerun. Do not weaken compiler options or add another assertion to force a pass. Then run the repository's test suite. The tests must pass to prove that intentionally invalid fixtures preserve runtime behavior, not just type-level behavior. Review the diff to confirm only authorized test files and import lines changed. Done when: typecheck passes, the test suite passes, and the diff is confirmed to contain only authorized changes.

## Failure and recovery

- Missing package dependency: the coercion package is absent from the installed dependency tree. Make no edits and report the missing dependency. Do not modify manifests or lockfiles.
- Unresolvable intent: an assertion's intent is ambiguous. Leave it unchanged and report the exact site.
- Typecheck failed: if typecheck still fails after restoring an ineligible replacement, restore all edits made by this run and report the original error output.
- Tests failed: if the test suite fails after the replacements, a coercion function changed runtime behavior for an intentionally invalid fixture. Restore that replacement, record it as skipped, and rerun the test suite.
- Preserve unrelated working-tree changes. Never restore a whole directory or file that contained pre-existing edits without first isolating this run's patch.

## Output

A per-file report with assertions replaced, coercion function selected for each, skipped assertions with reasons, the exact typecheck and test commands, and their final results.
