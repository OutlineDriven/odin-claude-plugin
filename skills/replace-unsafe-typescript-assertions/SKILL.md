---
name: replace-unsafe-typescript-assertions
description: 'Use when TypeScript tests use unsafe assertions for partial or intentionally invalid fixtures. Replaces eligible assertions with @total-typescript/shoehorn calls and proves the project typecheck passes. Not for production source or manifest edits — test files only.'
---

# Migrate to shoehorn

## Contract

| Field | Bound contract |
|---|---|
| Trigger | TypeScript tests use unsafe assertions for partial or intentionally invalid fixtures. |
| Authority | Reversible local edits to the named test files and their import lines. Do not change production files, package manifests, or lockfiles. |
| Side effect | Eligible assertions are replaced and required imports are added. |
| Done | Every eligible assertion uses the intent-matching shoehorn function and the project typecheck passes. |

## Refusals

- **Production source files**: excluded even when they contain the same assertion shape. Test files only.
- **Package manifest or lockfile edits**: rejected. If `@total-typescript/shoehorn` is absent, stop and report the missing prerequisite.
- **Weakening compiler options or adding assertions to force a pass**: rejected. Restore ineligible replacements and record them as skipped.

## Inputs

- A file or bounded directory containing TypeScript tests.
- The repository's existing package manager and typecheck command.
- An existing `@total-typescript/shoehorn` development dependency. If it is absent, stop and report the missing prerequisite because this contract does not authorize manifest or lockfile edits.

## Procedure

1. Confirm the target contains only test files. Exclude production source even when it contains the same assertion shape. **Done when**: the target is confirmed to contain only test files.
2. Resolve the repository's own typecheck command from its scripts or task runner. Do not invent a fallback command. **Done when**: the typecheck command is resolved from the repository.
3. Confirm `@total-typescript/shoehorn` resolves in the installed dependency tree. If it does not, stop before editing. **Done when**: the package is confirmed present or the procedure has stopped.
4. Find assertions in `.test.ts`, `.spec.ts`, `.test.tsx`, and `.spec.tsx` files under the bounded target. **Done when**: every assertion site is enumerated.
5. Classify each assertion by intent: replace `value as Type` with `fromPartial(value)` when the fixture intentionally supplies only part of `Type` and every supplied field must still type-check; replace `value as unknown as Type` with `fromAny(value)` only when the test intentionally supplies an invalid runtime shape; use `fromExact(value)` only when the test needs the complete object to satisfy `Type` and retaining exactness is the stated intent; leave branded, opaque, identity-sensitive, and ambiguous assertions unchanged and record the reason. **Done when**: every assertion is classified with its replacement or skip reason.
6. Add one import containing exactly the functions used:

```ts
import { fromAny, fromExact, fromPartial } from "@total-typescript/shoehorn";
```

   Remove unused names from that example. Merge with an existing import from the package instead of creating a duplicate. **Done when**: the import line is added or merged with no duplicate.
7. Run the repository's typecheck command after the bounded edits. **Done when**: typecheck passes or fails with a named cause.
8. If typecheck fails because a classification was wrong, restore that assertion and import change, record it as skipped, and rerun the same command. Do not weaken compiler options or add another assertion to force a pass. **Done when**: the failing replacement is restored and typecheck is rerun.
9. Run the same typecheck once on the final bounded change set. Review the diff to confirm only authorized test files and import lines changed. **Done when**: the final typecheck passes and the diff is confirmed to contain only authorized changes.

## Failure and recovery

- If the package or project typecheck command is absent, make no edits and report the missing prerequisite.
- If an assertion's intent is ambiguous, leave it unchanged and report the exact site.
- If typecheck still fails after restoring an ineligible replacement, restore all edits made by this run with `git restore -- <bounded files>` and report the original error output.
- Preserve unrelated working-tree changes. Never restore a whole directory or file that contained pre-existing edits without first isolating this run's patch.

## Output

A per-file report with assertions replaced, shoehorn function selected for each, skipped assertions with reasons, the exact typecheck command, and its final result.
