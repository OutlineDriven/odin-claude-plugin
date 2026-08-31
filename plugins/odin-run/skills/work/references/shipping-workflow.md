# Post-implementation workflow

Load this workflow when all Phase 2 tasks are complete and execution moves to local verification and the mode split.

## Local verification

1. **Run the project's test suite** for the changed surface. Fix failures immediately.

   ```bash
   # Run full test suite (use project's test command)
   # Examples: bin/rails test, npm test, pytest, go test, etc.
   ```

2. **Run linting** per the project's configured lint command.

3. **Confirm completion**: all tasks marked completed, new/changed behavior has corresponding test coverage (or an explicit justification for why tests are not needed), and code follows existing patterns.

Both caller modes run local verification. The mode split determines what happens next.

## Mode split

### Orchestrated mode

Stop after local verification. Return a structured result containing:

- Implementation summary: units completed, files changed.
- Verification results: test and lint outcomes.
- Diff summary: files changed and line count.
- Working-tree state: branch, HEAD SHA.
- Residuals or blockers: any unfinished work, unresolved issues, or named residuals.

Do not review, commit, push, or create a PR. The orchestrator owns finalization.

### Standalone mode

Delegate finalization to **review-and-ship** with explicit delegated shipping authority. Pass:

- `authority: delegated` — the explicit authority signal. This cannot arise from a bare route name or invocation context; it must be passed explicitly.
- Implementation context: branch, diff summary, verification results.
- Any residuals or blockers from execution.

review-and-ship owns review, commit packaging, publication classification, checks, push, and PR. Work does not ship directly.

## What review-and-ship owns

review-and-ship is the only direct finalizer for an existing diff. It accepts:

- Direct human shipping authority: the human invoked review-and-ship directly.
- Explicit delegated authority: work passed `authority: delegated`. This signal must be explicit; it cannot arise from a bare route name or invocation context.

review-and-ship preserves: no-force push, publication classification, local checks, atomic commit packaging, push, PR update or creation, and a structured report. It does not require redundant confirmation when authority is already established.
