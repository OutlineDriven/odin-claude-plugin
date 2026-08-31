---
name: smart-contract-audit-prep
description: 'Use when a smart-contract project needs to become review-ready before an external or internal security audit. Produces an audit handoff package of goals, a frozen review commit, verified build and test instructions, known-issue notes, architecture material, and a readiness checklist that auditors can start from without setup ambiguity. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Smart contract audit prep

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
2. Set review goals: collect security objectives, areas of concern (prior findings, complex components, fragile parts), and the worst-case scenario; write `audit/goals.md` containing objectives, concern areas with file references, the worst-case scenario, and open questions for auditors.
3. Run static analysis now: run the platform tool that exists (`slither . --exclude-dependencies` for Solidity, `dylint --all` for Rust, `golangci-lint run` for Go). A prior clean report is not evidence; a missing tool is a recorded gap, never an install. Triage every finding into `audit/known-issues.md` with a disposition of must-fix before audit, accepted risk with rationale, or informational.
4. Measure, do not eyeball: run the project's coverage command and automated dead-code detection; record measured coverage numbers with named untested paths plus unused functions, libraries, and stale features in `audit/known-issues.md` as recommendations. Do not delete or edit source.
5. Freeze the review target: choose the commit auditors will review (prefer current HEAD only when its tests pass), create local branch `audit-freeze` and tag `audit-freeze-<short-sha>` at it, and record the hash, branch, tag, and dependency lock state. Deleting the branch and tag rolls this step back.
6. Verify the build from cold: write `audit/build-and-test.md` with exact prerequisites and pinned versions, then execute every step in a fresh clone and record pass or fail with output. Put the in-scope and out-of-scope paths and the boilerplate map (copied, forked, third-party code) at the top of `audit/architecture.md` so review focuses on first-party code.
7. Generate architecture material: in `audit/architecture.md`, add actual diagrams of primary workflows and component relationships (mermaid or ASCII, not prose claims); user roles and interactions; on-chain and off-chain assumptions (oracle sources, bridge and trust boundaries, who validates what); the actor and privilege map with access controls; function-level notes for critical functions (invariants, parameter ranges, arithmetic and precision behavior); and a glossary of domain terms. Record documentation gaps as checklist items; never invent evidence.
8. Assemble `audit/readiness-checklist.md`: one row per item - goals documented, static analysis run and triaged, coverage measured, dead code listed, build verified from a cold clone, version frozen, diagrams present, user stories present, assumptions documented, actors and privileges listed, function notes complete, glossary complete - each with pass or fail and an evidence pointer, plus the frozen commit. Classify READY only when every row passes.

## Failure and recovery
- Missing analysis tool: record the gap in `audit/known-issues.md`, mark its checklist row failed, continue the remaining steps; never install tools.
- Cold-clone build or test failure: record the exact failing step and output in `audit/known-issues.md`; readiness is NOT READY; do not patch source.
- Undeterminable project root or scope: stop before any write and ask the human; this is the only outcome that produces no artifacts.
- Partial completion: keep every completed artifact and mark each unmet checklist row failed with its gap; the partial package is deliverable, READY is not.
- Rollback: delete the `audit/` directory, the `audit-freeze` branch, and the freeze tag; the project returns to its pre-invocation state.
- Never swallow a failed step or pass a failing row; the terminal classification is READY or NOT READY with named gaps, never an unverifiable claim.

## Output
The handoff package: `audit/goals.md`, `audit/build-and-test.md`, `audit/known-issues.md`, `audit/architecture.md`, and `audit/readiness-checklist.md` in the target project, plus the local `audit-freeze` branch and tag. Terminal classification: READY when every checklist row passes with evidence, otherwise NOT READY with the named gaps and their evidence pointers.

## Provenance

- Origin: Trail of Bits, https://github.com/trailofbits/skills, path /plugins/building-secure-contracts/skills/audit-prep-assistant/SKILL.md at revision d1f1575cff97816e5cc08af66cd2506099c681d3.
- License: CC-BY-SA-4.0; source https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3.
- Adaptation: restructured from Trail of Bits' audit-prep-assistant into the ODIN contract form. Modified by bounding authority to handoff-package writes (findings are triaged into notes instead of applied as source fixes), removing cross-skill routing and example transcripts, and adding explicit failure, rollback, and proof rules. This adaptation is distributed under CC-BY-SA-4.0 (ShareAlike). Trail of Bits attribution and source link are preserved; no trademark rights are claimed, and trail-of-bits-mark.svg is never used as branding.
