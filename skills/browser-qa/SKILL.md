---
name: browser-qa
description: 'Use when the user runs /browser-qa, run the QA verification pass and return report-only results without entering a fix loop. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Browser qa

## Contract

| Field | Bound contract |
|---|---|
| Trigger | the user runs /browser-qa |
| Authority | write one local QA report under the working tree; no source, VCS, credential, paid, published, deployed, or remote mutation; reversible by deleting the report |
| Side effect | a QA report only; no fix loop |
| Done | report-only verification results are returned |

## Inputs

- The working tree or change set to verify. Supply a scope (paths or diff range) to narrow the pass; without one, verify the whole tree.
- Optional: an ordered list of check commands to run. If omitted, run the project's configured QA checks in order: build, then tests, then lint.

## Procedure

1. Bound scope to the supplied paths or diff range, or the whole tree when none is given. Do not read or change files outside that scope.
2. Run each configured QA check in order (build, then tests, then lint) and capture exit status, stdout, and stderr for each.
3. Collect every finding into a single list tagged by check name and severity.
4. Write the findings to one local QA report file under the repository working tree.
5. Return the report contents as the result.
6. Do not apply any fix, edit, or further check after step 5. The fix loop is intentionally skipped; this is the distinguishing mechanism of the report-only variant.

## Failure and recovery
- Check command missing or non-runnable: record the command name and error in the report; continue the remaining checks. Do not substitute a different command.
- A check returns non-zero: that is a finding, not a skill failure. Record it and proceed to the next check.
- Report file unwritable: return the findings inline and state that the write failed; do not create a partial file.
- Rollback: delete the report file. No source, VCS, or remote state is mutated, so no further recovery is required.
- Blocked: return a report listing which checks ran, which could not, and the findings collected. Never claim the done predicate when a requested check never ran.

## Output
One local QA report file containing per-check status and findings, plus the same findings returned as the result. No fixes are applied.

## Provenance

Adapted from the QA pass in https://github.com/garrytan/gstack (revision 07b59e396c6be5a86619a43151cb9ed62a15ae69), licensed MIT (Copyright (c) 2026 Garry Tan). Clean-room re-derivation of the report-only variant that skips the fix loop; no upstream expression copied wholesale.
