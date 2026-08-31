---
name: replace-unsafe-typescript-assertions
description: 'Use when TypeScript tests use unsafe assertions for partial or intentionally invalid fixtures. Replace eligible assertions with @total-typescript/shoehorn calls and prove the project typecheck passes. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Migrate to shoehorn

## Contract

| Field | Bound contract |
|---|---|
| Trigger | TypeScript tests use unsafe assertions for partial or intentionally invalid fixtures. |
| Authority | Reversible local edits to the named test files and their import lines. Do not change production files, package manifests, or lockfiles. |
| Side effect | Eligible assertions are replaced and required imports are added. |
| Done | Every eligible assertion uses the intent-matching shoehorn function and the project typecheck passes. |

## Inputs

- A file or bounded directory containing TypeScript tests.
- The repository's existing package manager and typecheck command.
- An existing `@total-typescript/shoehorn` development dependency. If it is absent, stop and report the missing prerequisite because this contract does not authorize manifest or lockfile edits.

## Procedure

1. Confirm the target contains only test files. Exclude production source even when it contains the same assertion shape.
2. Resolve the repository's own typecheck command from its scripts or task runner. Do not invent a fallback command.
3. Confirm `@total-typescript/shoehorn` resolves in the installed dependency tree. If it does not, stop before editing.
4. Find assertions in `.test.ts`, `.spec.ts`, `.test.tsx`, and `.spec.tsx` files under the bounded target.
5. Classify each assertion by intent:
   - Replace `value as Type` with `fromPartial(value)` when the fixture intentionally supplies only part of `Type` and every supplied field must still type-check.
   - Replace `value as unknown as Type` with `fromAny(value)` only when the test intentionally supplies an invalid runtime shape.
   - Use `fromExact(value)` only when the test needs the complete object to satisfy `Type` and retaining exactness is the stated intent.
   - Leave branded, opaque, identity-sensitive, and ambiguous assertions unchanged. Record the reason.
6. Add one import containing exactly the functions used:

```ts
import { fromAny, fromExact, fromPartial } from "@total-typescript/shoehorn";
```

   Remove unused names from that example. Merge with an existing import from the package instead of creating a duplicate.
7. Run the repository's typecheck command after the bounded edits.
8. If typecheck fails because a classification was wrong, restore that assertion and import change, record it as skipped, and rerun the same command. Do not weaken compiler options or add another assertion to force a pass.
9. Run the same typecheck once on the final bounded change set. Review the diff to confirm only authorized test files and import lines changed.

## Failure and recovery

- If the package or project typecheck command is absent, make no edits and report the missing prerequisite.
- If an assertion's intent is ambiguous, leave it unchanged and report the exact site.
- If typecheck still fails after restoring an ineligible replacement, restore all edits made by this run with `git restore -- <bounded files>` and report the original error output.
- Preserve unrelated working-tree changes. Never restore a whole directory or file that contained pre-existing edits without first isolating this run's patch.

## Output

Return a per-file report with the assertions replaced, the shoehorn function selected for each replacement, skipped assertions with reasons, the exact typecheck command, and its final result.

## Provenance

Adapted from `mattpocock/skills` at revision `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`, paths `skills/misc/migrate-to-shoehorn/SKILL.md` and `skills/misc/migrate-to-shoehorn/agents/openai.yaml`.

License: MIT. Copyright (c) 2026 Matt Pocock. The root `PROVENANCE.md` retains the full permission notice and source record. This adaptation preserves the source's test-only boundary and the `fromPartial`, `fromAny`, and `fromExact` decision while removing package-manager and typecheck assumptions from the executable contract.
