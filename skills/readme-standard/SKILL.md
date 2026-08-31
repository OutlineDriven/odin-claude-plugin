---
name: readme-standard
description: 'Use when asked to write or review a public README that follows the house standard and verification gates. Every quickstart command runs, every badge renders, and the fixed section order is enforced before shipping. Not for README creation from scratch — use readme-creator.'
---

# README standard

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Writing or reviewing a public README for a project that should match the house standard, or user asks for README structure or verification. |
| Authority | Reversible local: write only the named local README artifact; rollback to the original file on failure. |
| Side effect | A README draft or review follows the house standard: every quickstart command runs, every badge renders, version facts are current, and length and tone limits are respected. |
| Done | Every quickstart command runs; every code sample compiles and typechecks; every relative link resolves to a repo file; every external link returns non-404; every badge renders dynamically; the fixed section order is present; per-archetype template rules are satisfied; and all five verification gates pass before shipping. |

## Refusals

- **README creation from scratch without a standard to follow**: use `readme-creator`. This skill enforces the house standard on an existing or drafted README.
- **Adding, removing, or reordering sections outside the per-archetype template**: rejected. The template defines which sections appear.
- **Claiming done when any gate fails or is blocked**: rejected. Partial passes are reported as partial passes.

## Inputs

- **Project directory** (required): absolute or relative path to the project root containing the README.
- **Existing README path** (optional): path to the README file if it already exists.
- **Draft or review mode** (required): user states drafting a new README or reviewing an existing one.
- **Archetype** (required for draft): CLI tool (Go/TS binary), npm library, Swift package, macOS app, or web service. Inferred from the project structure if not supplied.
- **Project metadata** (required for draft): project name, language ecosystem, and any specific capability tiers the README must cover.

## Procedure

1. Confirm whether this is a new draft or a review. Route to Step 2 for draft, Step 3 for review. **Done when**: the mode is confirmed and routing is applied.
2. Draft a new README. Resolve the project directory to an absolute path and validate it exists and is readable. Determine the archetype from project structure (`package.json`, `go.mod`, `Package.swift`, `*.xcodeproj`, `Cargo.toml`) or from user-supplied metadata. Apply the per-archetype template: the template defines which sections appear after Quick start and Development. Write the README to the project root as `README.md`. Run Gate 4 (version facts) on the written file: confirm no hardcoded versions, stale minimums, or shipped-features-described-as-coming-soon. If Gate 4 fails, overwrite the file with corrected version facts and stop. **Done when**: the README is written and Gate 4 passes or the file is corrected and stopped.
3. Review an existing README. Resolve and read the existing README. If unreadable, stop and report the failure. For each of the five verification gates, record pass or fail with the specific finding. If the user requests fixes, apply targeted edits to satisfy the failed gates. After any edit, re-run Gate 4 on the modified file. Stop and report if it still fails. Report the final gate status and any remaining failures. **Done when**: every gate has a pass/fail/blocked record and any requested fixes are applied with Gate 4 re-run.
4. Run the five verification gates (all mandatory). Gate 1: every command in the Install and Quick start sections runs against the current project; if a command cannot run (missing binary, no network), mark it blocked and state why. Gate 2: every code sample typechecks or compiles against the current API. Gate 3: every relative link resolves to an existing file in the repo; every external link returns HTTP 200 non-404; every badge URL in the badge row returns HTTP 200 and not the shields "invalid" card. Gate 4: no hardcoded package versions, stale minimums, or "coming soon" for shipped features; compare against `package.json`, `go.mod`, `Package.swift`, or equivalent. Gate 5: the section order matches the fixed order (What is this, Install, Quick start, core sections, Development, License); no extra top-level sections appear before Install or after License. **Done when**: every gate has a pass, fail, or blocked verdict with a concrete finding for every non-pass.

## Failure and recovery

- **Unrecoverable read**: the project directory or README file cannot be read. Stop and report the path that failed.
- **Unsupported archetype**: the project structure does not match a known archetype and no archetype is supplied. Stop and report the gap.
- **Write error**: the README write fails or partially succeeds. Restore the original file from the prior session state if it existed. Stop and report the failure.
- **Version facts stale**: Gate 4 fails on the written file. Overwrite with corrected version facts. Stop and report.
- **Verification blocked**: a verification gate cannot run because the required toolchain is unavailable. Mark the gate as blocked, report the specific gate and the reason, and stop.
- **Non-converged result**: not all gates pass after fixes. Report the specific remaining failures and stop without claiming done.

If a write partially succeeds, restore the file to its pre-write state before reporting the failure.

## Output

A new or updated `README.md` (draft mode) or a diff (review mode with fixes), plus a verification report listing pass/fail/blocked per gate with a concrete finding for every non-pass, and a terminal classification: `done`, `done-with-fixes`, or `non-converged`.

## Provenance

Origin: `https://github.com/openclaw/agent-skills` revision `ae75f60e8d454f1cf44ec4613e10ec9ea7f2ade7`.
License: MIT — Copyright notice and permission notice must be included in all copies or substantial portions of the Software.
Adaptation: ADAPT. Spine section order, badge rules, per-archetype templates, and pre-ship verification gates are preserved. Upstream-specific org/repo references are generalized. Length and tone rules are preserved. Module `odin-create`: public README drafting and review. Policy `model+human`: local draft/review, reversible write to named artifact only.
