---
name: smart-contract-audit-prep
description: 'Use when a smart-contract project must become review-ready before an audit. Produces a handoff package with frozen commit, build checks, and readiness checklist. Not for workflow — use smart-contract-secure-workflow; not for guidelines — use smart-contract-guidelines-advisor.'
---

# Smart contract audit prep

## Refuse first

- Do not fix source findings; record and classify them for the audit handoff.
- Do not install missing tools or touch remotes, credentials, deployments, or VCS history.
- Do not declare readiness from prior reports or an untested commit.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A smart-contract project needs to become review-ready before an external or internal security audit, typically 1-2 weeks before the audit begins |
| Authority | Reversible local: write only the named artifacts under `audit/` in the target project plus one local freeze branch and tag; roll back by deleting the `audit/` directory, the branch, and the tag |
| Side effect | Audit goals, scoped commit, build and test instructions, known-issue notes, architecture material, and readiness checklist; never edits project source, never installs tools, never touches remotes or VCS history |
| Done | Auditors can build, scope, navigate, and begin reviewing the frozen project without avoidable setup ambiguity, confirmed by a fully passing readiness checklist |

## Inputs

- Required: the target project directory; verify it is the project root before any write.
- Required: human answers on security objectives, concern areas, and the worst-case scenario for the goals document.
- Optional: prior audit reports or a known-concern list; they seed goals and known-issue notes.
- Optional: intended audit date; it only orders the readiness checklist.
- Platform, toolchain, and dependency facts are read from the project's manifests, never assumed.

## Procedure

1. Confirm the target: verify the directory is a project root (manifest, lockfile, or build config present) and identify the platform (Solidity with Foundry or Hardhat, Rust, Go, or other). If root or scope is undeterminable, stop before any write and ask the human.
   **Done when:** the canonical project root, platform, and review scope are explicit before any artifact is written.
2. Set review goals: collect security objectives, areas of concern (prior findings, complex components, fragile parts), and the worst-case scenario; write `audit/goals.md` containing objectives, concern areas with file references, the worst-case scenario, and open questions for auditors.
   **Done when:** `audit/goals.md` contains every required goal element, with file references where the project provides them.
3. Run static analysis now: run the platform tool that exists (`slither . --exclude-dependencies` for Solidity, `dylint --all` for Rust, `golangci-lint run` for Go). A prior clean report is not evidence; a missing tool is a recorded gap, never an install. Triage every finding into `audit/known-issues.md` with a disposition of must-fix before audit, accepted risk with rationale, or informational.
   **Done when:** the available platform analyzer has run now and every finding or missing-tool gap has an explicit disposition in `audit/known-issues.md`.
4. Measure, do not eyeball: run the project's coverage command and automated dead-code detection; record measured coverage numbers with named untested paths plus unused functions, libraries, and stale features in `audit/known-issues.md` as recommendations. Do not delete or edit source.
   **Done when:** measured coverage, named untested paths, and dead-code results or unavailable-tool gaps are recorded without source mutation.
5. Freeze the review target: choose the commit auditors will review (prefer current HEAD only when its tests pass), create local branch `audit-freeze` and tag `audit-freeze-<short-sha>` at it, and record the hash, branch, tag, and dependency lock state. Deleting the branch and tag rolls this step back.
   **Done when:** one tested commit is identified by recorded hash, local freeze branch, local freeze tag, and dependency lock state.
6. Verify the build from cold: write `audit/build-and-test.md` with exact prerequisites and pinned versions, then execute every step in a fresh clone and record pass or fail with output. Put the in-scope and out-of-scope paths and the boilerplate map (copied, forked, third-party code) at the top of `audit/architecture.md` so review focuses on first-party code.
   **Done when:** the cold-clone transcript proves each documented build and test step, and `audit/architecture.md` opens with scope and boilerplate boundaries.
7. Generate architecture material: in `audit/architecture.md`, add actual diagrams of primary workflows and component relationships (mermaid or ASCII, not prose claims); user roles and interactions; on-chain and off-chain assumptions (oracle sources, bridge and trust boundaries, who validates what); the actor and privilege map with access controls; function-level notes for critical functions (invariants, parameter ranges, arithmetic and precision behavior); and a glossary of domain terms. Record documentation gaps as checklist items; never invent evidence.
   **Done when:** every named architecture element is present or an evidence-backed documentation gap is queued for the readiness checklist.
8. Assemble `audit/readiness-checklist.md`: one row for each item: goals documented, static analysis run and triaged, coverage measured, dead code listed, build verified from a cold clone, version frozen, diagrams present, user stories present, assumptions documented, actors and privileges listed, function notes complete, glossary complete. Give each row a pass or fail result and an evidence pointer, and include the frozen commit. Classify READY only when every row passes.
   **Done when:** every required row has a truthful result and evidence pointer, the frozen commit is named, and the terminal classification follows the all-pass rule.

## Failure and recovery

### Evidence and tool gaps
- Missing analysis tool: record the gap in `audit/known-issues.md`, mark its checklist row failed, continue the remaining steps; never install tools.
- Cold-clone build or test failure: record the exact failing step and output in `audit/known-issues.md`; readiness is NOT READY; do not patch source.

### Scope and completion failures
- Undeterminable project root or scope: stop before any write and ask the human; this is the only outcome that produces no artifacts.
- Partial completion: keep every completed artifact and mark each unmet checklist row failed with its gap; the partial package is deliverable, READY is not.
- Never swallow a failed step or pass a failing row; the terminal classification is READY or NOT READY with named gaps, never an unverifiable claim.

### Rollback
- Delete the `audit/` directory, the `audit-freeze` branch, and the freeze tag; the project returns to its pre-invocation state.

## Output

**Output contract:** Return `audit/goals.md`, `audit/build-and-test.md`, `audit/known-issues.md`, `audit/architecture.md`, and `audit/readiness-checklist.md`, then the local freeze branch and tag, then READY only if every checklist row passes—otherwise NOT READY with named gaps and evidence pointers.
