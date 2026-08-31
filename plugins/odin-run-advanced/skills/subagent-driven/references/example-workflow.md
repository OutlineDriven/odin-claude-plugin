# Example workflow

A condensed run through two tasks: one clean pass, one fix-and-re-review.

```
[Read plan.md once; create todos for every task; check the ledger — empty,
 starting fresh]

Task 1: rate limiter

[Run scripts/task-brief plan.md 1 → task-1-brief.md]
[Dispatch implementer, model: standard — brief path, report path,
 scene-setting context]

Implementer: "Brief doesn't say what happens past the limit — 429 or drop
  silently?"
Controller: "429 with a Retry-After header, per the API constraints section."
Implementer: [implements, tests, self-reviews, commits]
  DONE — 6/6 tests passing. Committed a1b2c3d.

[Run scripts/review-package BASE HEAD → task-1-diff.md]
[Dispatch reviewer, model: standard — brief, report, diff paths, global
 constraints]

Reviewer: Spec Compliance ✅. Code Quality ✅. Task quality: Approved.

[Append to ledger: "Task 1: complete (commits a1b2c3d..a1b2c3d, review
 clean)"]
[Mark Task 1 done in todos; move to Task 2]

Task 2: batch import progress

[Run scripts/task-brief plan.md 2 → task-2-brief.md]
[Dispatch implementer, model: standard]

Implementer: [no questions; implements, tests, self-reviews, commits]
  DONE — 8/8 tests passing. Committed d4e5f6a.

[Run scripts/review-package BASE HEAD → task-2-diff.md]
[Dispatch reviewer]

Reviewer: Spec Compliance ❌ Issues found:
  - Missing: "report progress every 100 items" (spec requirement)
  - Extra: unrequested --json flag on the import command
  Code Quality ❌ Important: magic number 100 hardcoded at importer.go:84.
  Task quality: Needs fixes.

[Dispatch ONE fix worker with the complete findings list]
Fixer: removed --json flag, added progress reporting, extracted the
  PROGRESS_INTERVAL constant, re-ran the covering tests (8/8 passing).
  Committed 7a8b9c0.

[Re-run scripts/review-package BASE HEAD; dispatch reviewer again]
Reviewer: Spec Compliance ✅. Code Quality ✅. Task quality: Approved.

[Append to ledger: "Task 2: complete (commits d4e5f6a..7a8b9c0, review
 clean)"]

[All tasks land]
[Run scripts/review-package MERGE_BASE HEAD; dispatch final reviewer on the
 most capable model]
Final reviewer: all requirements met, Minor findings triaged, ready to ship.

[Ship via the ODIN atomic path — atomic commits, not a squash]
```
