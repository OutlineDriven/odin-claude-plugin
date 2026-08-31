---
name: gha-security-review
description: 'Use when asked to review GitHub Actions workflows for exploitable vulnerabilities. Returns HIGH or MEDIUM findings each with a five-element exploitation scenario, or a cleared report. Not for general security review — use security-review. Read-only.'
---

# GitHub Actions security review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to review GitHub Actions, audit workflows, check CI security, or assess GHA security. |
| Authority | Read-only — no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output reporting exploitable GitHub Actions vulnerabilities with concrete attack scenarios. |
| Done | HIGH/MEDIUM findings each with a 5-element exploitation scenario, or a cleared report confirming no exploitable vulnerabilities. |

## Not for

- General source-code security review — use security-review.
- CI debugging or fixing — this skill reports findings; it does not fix them.
- Source or remote mutation — this skill is read-only.

## Inputs

Supply one or more GitHub Actions workflow sources to review:
- `.github/workflows/*.yml` workflow definitions (required)
- `action.yml` / `action.yaml` composite actions and `.github/actions/*/action.yml` local reusable actions (review when present)
- Config files loaded by workflows: `CLAUDE.md`, `AGENTS.md`, `Makefile`, shell scripts under `.github/` (review when a workflow loads them)

Workflows in other repositories are out of scope; note the dependency only.

## Procedure

1. Bound the threat model. Report only vulnerabilities exploitable by an external attacker without write access — someone who can open PRs from forks, create issues, and post comments but cannot push to branches or trigger `workflow_dispatch`. Do not flag vulnerabilities requiring write access: `workflow_dispatch` input injection, expression injection in `push`-only workflows on protected branches, `workflow_call` input injection where all callers are internal, or secrets in `workflow_dispatch`/`schedule`-only workflows. Done when: the threat model is stated and write-access-only vulnerabilities are excluded.
2. Read each workflow fully. Do not rely on grep output alone. Identify triggers and `if:` conditions gating execution before evaluating any expression or checkout. Done when: every workflow is read in full with triggers and conditions identified.
3. Check vulnerability classes. For each workflow, evaluate:
   - **Pwn request**: uses `pull_request_target` AND checks out fork code (`actions/checkout` with `ref:` to PR head, local actions from the fork, or any `run:` step executing checked-out PR code).
   - **Expression injection**: `${{ }}` inside `run:` blocks in externally-triggerable workflows where the value is attacker-controlled (PR title, branch name, comment body — not numeric IDs, SHAs, or repository names) and in a `run:` block, not `if:`, `with:`, or job-level `env:`.
   - **Unauthorized command execution**: `issue_comment`-triggered workflow executing commands without an `author_association` check, or where the command handler also uses injectable expressions.
   - **Credential escalation**: elevated credentials (PATs, deploy keys) accessible to untrusted code; assess each secret's blast radius and whether a compromised workflow could steal long-lived tokens.
   - **Config file poisoning**: workflow loads configuration from PR-supplied files (`CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `Makefile`, shell scripts).
   - **Supply chain**: third-party/external actions not pinned to full SHAs. Pin third-party and reusable workflows only — do not flag first-party `actions/*` or `github/*` on version tags, and do not flag same-repo/vendored `./.github/actions/...`. Only report when the job has secrets, OIDC, write token, release, deploy, package, or signing power; unprivileged read-only CI is not a finding.
   - **Permissions and secrets**: workflow permissions not minimal, or secrets not properly scoped.
   - **Runner infrastructure**: self-hosted runners, caches, or artifacts used insecurely.
   Done when: every vulnerability class is evaluated for every workflow.
4. Suppress safe patterns. Do not flag: `pull_request_target` without fork checkout; `${{ github.event.pull_request.number }}` (numeric only); `${{ github.repository }}` / `github.repository_owner` (repo-owner-controlled); `${{ secrets.* }}`; `${{ }}` in `if:` conditions (Actions runtime evaluation, not shell); `${{ }}` in `with:` inputs (string parameters, not shell-evaluated); third-party actions pinned to full SHA; first-party `actions/*`/`github/*` on version tags; same-repo/vendored local actions (review under pwn request separately); `pull_request` trigger without `_target` (runs in fork context with read-only token); any expression in `workflow_dispatch`/`schedule`/`push` to protected branches (requires write access). The key distinction: `${{ }}` in a `run:` block is shell-evaluated; in `if:`/`with:`/`env:` it is not. Done when: safe patterns are identified and excluded from findings.
5. Validate before reporting. For each candidate finding, trace the complete attack path: read the full workflow, confirm the trigger and gating `if:` conditions, confirm the expression is in a `run:` block or actually references fork code, confirm the value maps to something an external attacker sets, and check existing mitigations (env var wrapping, `author_association` checks, restricted permissions, SHA pinning). If any link is broken, mark MEDIUM (needs verification) or drop the finding. Done when: every candidate finding is validated or dropped.
6. Classify confidence. Report only HIGH and MEDIUM. HIGH: full attack path traced and confirmed exploitable. MEDIUM: attack path partially confirmed, uncertain link, reported as needs verification. LOW (theoretical or mitigated): do not report. Done when: every reported finding is classified HIGH or MEDIUM.
7. Construct the exploitation scenario. For each HIGH finding, provide all five elements: (1) entry point — how the attacker gets in (fork PR, issue comment, branch name); (2) payload — what the attacker sends (actual code/YAML/input); (3) execution mechanism — how the payload runs (expression expansion, checkout + script); (4) impact — what the attacker gains (token theft, code execution, repo write access); (5) PoC sketch — concrete steps an attacker would follow. If all five cannot be constructed, report as MEDIUM (needs verification). Done when: every HIGH finding has all five elements or is downgraded to MEDIUM.
8. Emit the report. If no checks produced a finding, report zero findings — do not invent issues. Done when: the report is emitted with all findings or a cleared confirmation.

## Failure and recovery

- **Broken attack path**: if any link in the attack path cannot be confirmed, downgrade to MEDIUM (needs verification) or drop the finding. Never report a HIGH finding without all five exploitation elements.
- **Missing workflow source**: if a referenced workflow file cannot be read, report it as unreviewed and state what is missing; do not infer its contents.
- **No findings**: report zero findings with the cleared-workflows list. Do not fabricate vulnerabilities to fill the report.
- **Non-mutation**: this skill performs no file, VCS, credential, or remote mutation. A failed or incomplete review leaves the repository unchanged; partial results are reported as such, never silently widened.

## Output

A markdown report titled `## GitHub Actions Security Review` with Findings (one section per finding: workflow path and line, trigger, confidence, five-element exploitation scenario, impact, and fix), Needs Verification (MEDIUM items with explanation), and Reviewed and Cleared (workflows confirmed safe) — or "No exploitable vulnerabilities identified. All workflows reviewed and cleared." when no findings.
