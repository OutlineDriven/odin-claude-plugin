---
name: no-comments
description: 'Use when asked to audit and remove unearned comments from code files, restoring or editing each change reversibly and reporting the full accounting. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# No comments

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Audit and remove unearned comments. |
| Authority | Write only named local artifacts; revert each edited file before proceeding to the next on failure. |
| Side effect | Edits comments and accepted structural fixes. |
| Done | Deletion/restoration accounting and remaining work. |

## Inputs

The user supplies one required input:

- **Target file paths**: one or more file paths or glob patterns identifying files to audit. Required.

The user may supply an optional input:

- **Veto list**: specific comment lines, line ranges, or patterns to preserve regardless of category. Optional.

If no veto list is supplied, every comment is subject to the audit criteria.

## Procedure

1. Receive and validate target file paths. Reject paths that escape the working directory or are not readable. Stop if no valid path is supplied.

2. Scan each target file for comments: single-line (`//`), multi-line (`/* */`), and doc-comment (`/** */`, `///`, `<!-- -->`) forms. Record line number, text content, and category.

3. Classify each comment into one of these categories:

   a. **Dead code** — commented-out code or broken examples. Deletion candidate.
   b. **Redundant** — restates what the code already expresses without ambiguity. Deletion candidate.
   c. **TODO/XYZ** — `TODO`, `FIXME`, `HACK`, `XXX`, or equivalent marker. Deletion candidate unless tied to an open issue in the same repository.
   d. **Vague** — contains indefinite words (`soon`, `later`, `maybe`, `should`, `improve`, `optimize`) without a concrete action or specification. Deletion candidate.
   e. **Noise** — empty comment, repeated punctuation, whitespace, or comment that matches the regex `^\s*(//\s*)+$` or `^\s*(/\*\s*\*/\s*)+$`. Deletion candidate.
   f. **Untyped** — comment longer than 120 characters that contains no `TODO`, `@param`, `@return`, `@throws`, `@example`, or other JSDoc/TSDoc tag. Candidates for reflow or deletion.
   g. **Earned** — comments that name a legal or business rule, document an API contract, cite a specification, or preserve a non-obvious design decision. Retained.

4. Propose one of the following structural alternatives for each deletion candidate that would otherwise leave the code less readable:

   - Rename a variable or function to make the comment redundant.
   - Extract a named function or constant to make the intent explicit.
   - Add an assertion or test that enforces the same constraint.
   - Introduce a well-named guard clause.

5. Offer the user a choice for each deletion candidate:

   - **Delete** — remove the comment only. Apply as a reversible edit.
   - **Accept alternative** — apply the structural change only. Apply as a reversible edit.
   - **Restore** — leave the comment unchanged. Skip the file.
   - **Skip file** — skip all comments in this file.

6. Apply each accepted edit. Before applying an edit to a file, capture its current content in memory. If the edit fails or the result is syntactically invalid, revert the file to the captured content and stop.

7. On any failure, revert all changes made in the current session and report the reverted set.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| `invalid-path` | A target path is outside the working directory or unreadable | Stop before scanning. Report the path. |
| `edit-failure` | An edit write or syntax check fails | Revert the affected file. Stop. Report the file and the error. |
| `rollback-failure` | A revert cannot restore the file to its pre-edit state | Stop. Report the file and the inability to recover. Do not continue to other files. |
| `no-targets` | No valid target file paths were supplied | Stop. Report the missing input. |

Partial-result rule: if edits succeed on some files before a failure, report the edited set and the failed set separately.

## Output
A structured report containing:

- **Deleted**: comment text, file, and line number for each removed comment, grouped by category.
- **Restored**: file and line number for each comment left unchanged.
- **Changed**: structural edit applied (e.g., rename, extraction, guard) with file and line.
- **Skipped**: file and line number for each comment skipped.
- **Remaining work**: comment lines and files not acted on, if any.
- **Status**: `clean` if no deletion candidates remain; `audit-needed` if candidates remain.

## Provenance

- Origin: cursor/plugins `pstack/skills/no-comments/SKILL.md` and `pstack/agents/comment-sicko.md`
- Revision: `68836ddaf5697224520f1847d90cdb90ca8babaa`
- License: MIT — pstack authored by Lauren Tan (poteto) per license block audit
- Adaptation: rewritten from cursor/plugins source; MIT license retained; structural alternatives and veto list added per odin-code module routing.
