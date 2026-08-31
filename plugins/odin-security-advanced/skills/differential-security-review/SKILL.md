---
name: differential-security-review
description: 'Use when given a PR, commit, diff, or baseline and asked for security regressions, blast radius, test gaps, or adversarial review. Risk-classifies changes and writes an evidence-backed report. Not for whole-codebase audit — use security-review. No remote or irreversible changes.'
---

# Differential security review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user supplies a pull request, commit, diff, or baseline comparison and asks for security regressions, blast radius, changed-code test gaps, or adversarial review. |
| Authority | Reversible-local: read changed and baseline code plus Git history, optionally delegate high-risk attacker modeling to a subagent, and write one differential review report. No VCS mutation, credential, paid, published, deployed, or remote mutation. |
| Side effect | A local markdown report file; repository code and Git history are read only. |
| Done | Every in-scope change is risk-classified at the declared depth and the report records evidence-backed findings, test gaps, blast radius, historical context, concrete exploit paths where warranted, limitations, and a recommendation. |

## Inputs

- Target (required): PR URL, commit SHA, or diff path.
- Baseline (optional): `--baseline <ref>` comparison reference; defaults to the merge base or parent commit.
- Depth (optional): an explicit quick-triage request from the user narrows scope and the user accepts the residual risk; otherwise full depth applies.

## Procedure

Prioritize risk and use evidence. Focus on auth, crypto, external calls, value transfer, and validation removal. Back every finding with Git history, line numbers, and attack scenarios. Adapt the depth to the codebase size. State coverage limits and confidence plainly. Always write the report file.

### Rationalizations that must not be skipped

| Rationalization | Why it is wrong | Required action |
|---|---|---|
| "Small PR, quick review" | Heartbleed was 2 lines | Classify by RISK, not size |
| "I know this codebase" | Familiarity breeds blind spots | Build explicit baseline context |
| "Git history takes too long" | History reveals regressions | Never skip the historical analysis step |
| "Blast radius is obvious" | Transitive callers get missed | Calculate it quantitatively |
| "No tests = not my problem" | Missing tests elevate risk | Flag in report, elevate severity |
| "Just a refactor, no security impact" | Refactors break invariants | Analyze as HIGH until proven LOW |
| "I'll explain verbally" | No artifact = findings lost | Always write the report file |

### 0. Intake and triage

1. Extract the change set: `git diff <base>..<head> --stat`, `git log <base>..<head> --oneline`, `git diff <base>..<head> --name-only` (or `gh pr view <number> --json files,additions,deletions` for a PR). **Done when:** the change set, commit log, and file list are extracted.

2. Assess codebase size and pick the strategy: SMALL (<20 files) → DEEP (read all deps, full git blame); MEDIUM (20–200) → FOCUSED (1-hop deps, priority files); LARGE (200+) → SURGICAL (critical paths only). **Done when:** a strategy is picked and recorded.

3. Risk-score each changed file: HIGH = auth, crypto, external calls, value transfer, validation removal; MEDIUM = business logic, state changes, new public APIs; LOW = comments, tests, UI, logging. **Done when:** every changed file carries a risk score.

### 1. Baseline context and changed-code analysis

4. Build baseline context before mutation analysis: capture system-wide invariants, trust boundaries and privilege levels, validation patterns, call graphs for critical functions, state flows, and external trust assumptions. Store it for cross-reference, then return to the head commit. **Done when:** baseline context is stored and the head commit is restored.

5. For each changed file, read both versions. For each diff region record BEFORE / AFTER / behavioral CHANGE / SECURITY implication. **Done when:** every diff region has the four-field record.

6. Git-blame removed code: `git log -S "removed_code" --all --oneline` and `git blame <baseline> -- file`. Red flags: removed code from "fix", "security", or "CVE" commits → CRITICAL; recently added (<1 month) then removed → HIGH. **Done when:** removed code is blamed with red flags classified.

7. Check for regressions: code added → removed for security → re-added now = REGRESSION (`git log -S "added_code" --all -p`). **Done when:** regressions are checked and flagged.

8. Micro-adversarial analysis per change: what attack did removed code prevent, what new surface does new code expose, can modified logic be bypassed, are checks weaker, are edge cases covered. **Done when:** every change has its micro-adversarial answers recorded.

### 2. Test coverage analysis

9. Separate production-code changes from test changes. For each changed function, search for covering tests. **Done when:** production and test changes are separated and covering tests are located per function.

10. Apply risk elevation: NEW function + NO tests → MEDIUM→HIGH; MODIFIED validation + UNCHANGED tests → HIGH; complex logic (>20 lines) + NO tests → HIGH. **Done when:** risk elevation is applied to every changed function.

### 3. Blast radius analysis

11. Count callers for each modified function (e.g. `grep -r "functionName(" --include="*.sol" . | wc -l`, adapted to the language). Classify: 1–5 LOW, 6–20 MEDIUM, 21–50 HIGH, 50+ CRITICAL. **Done when:** every modified function has a caller count and blast classification.

12. Apply the priority matrix: HIGH×CRITICAL → P0 deep + all deps; HIGH×HIGH/MEDIUM → P1 deep; HIGH×LOW → P2 standard; MEDIUM×CRITICAL/HIGH → P1 standard + callers. **Done when:** every change is assigned a priority bucket.

### 4. Deep context (HIGH RISK only)

13. For each HIGH RISK changed function, map entry conditions, state reads/writes, external calls, return values and side effects; trace internal calls recursively; trace external calls across trust boundaries and check reentrancy; identify invariants that must always hold or never happen and whether they survive the change; run a Five-Whys root-cause (why changed, why the original existed, why it might break, why this approach, why it could fail in production). **Done when:** every HIGH RISK function has its deep-context map and Five-Whys recorded.

14. Cross-cutting pattern detection: find repeated validation patterns and flag any removal that breaks defense-in-depth. **Done when:** validation patterns are catalogued and defense-in-depth breaks are flagged.

### 5. Adversarial analysis (HIGH RISK only)

15. For each HIGH RISK change, run the 5-step adversarial methodology — perform it inline or delegate it to a subagent:
    1. **Attacker model**: WHO (unauthenticated external user, authenticated user, malicious admin, compromised upstream service or contract, front-runner/MEV bot), WHAT access/privileges, WHERE they interact (HTTP endpoints, contract functions, RPCs).
    2. **Concrete attack vectors**: ENTRY POINT, ATTACK SEQUENCE (specific call with parameters → how it reaches the vulnerable code → what happens → impact), PROOF OF ACCESSIBILITY (function is public/external, attacker holds required permissions, path is reachable — verify with Grep/Read, never assume).
    3. **Exploitability rating**: EASY (single call, public interface, no special state), MEDIUM (multiple steps, specific timing, elevated but obtainable privileges), HARD (admin access, rare conditions, significant resources).
    4. **Complete exploit scenario**: attacker starting position, step-by-step exploitation with exact commands/parameters and file:line references, concrete measurable impact (exact data/funds/privileges, quantified scope) — never "could cause issues".
    5. **Baseline cross-reference**: does it violate a system-wide invariant, break a trust boundary, bypass a validation pattern, or regress a previous fix (check git blame/log).

    **Done when:** every HIGH RISK change has all five adversarial steps completed with proof of accessibility verified.

### Red flags that require escalation even in quick triage

- Removed code from "security", "CVE", or "fix" commits.
- Access control modifiers removed (e.g. onlyOwner, internal → external).
- Validation removed without replacement.
- External calls added without checks.
- High blast radius (50+ callers) combined with a HIGH risk change.

These require adversarial analysis regardless of requested depth.

### 6. Report

16. Write the report file with the sections in § Output. **Done when:** the report file is written with every section.

### When not to run this skill

- Greenfield code with no baseline to compare.
- Documentation-only changes (no security impact).
- Formatting or linting changes (cosmetic).
- The user explicitly requests a quick summary only and accepts the risk — then use the Quick Reference (size strategy, risk triggers, red flags) and skip the detailed phases, but still apply the red-flag escalations.

## Failure and recovery
- Missing baseline or unreadable diff: stop; report the exact target/baseline that could not be resolved. Do not invent a baseline.
- No Git history available: cannot complete regression or historical-context analysis; record this as a limitation and lower confidence. Do not fabricate blame output.
- Scope exceeds declared depth: analyze the HIGH RISK subset at full depth, surface-scan MEDIUM, and exclude LOW; record the coverage percentage and confidence. Never claim full analysis when scope-limited.
- Delegated adversarial phase does not converge: keep the findings that reached concrete impact, mark the rest as non-converged with the blocker, and do not inflate severity.
- Evidence-less finding: discard it. Every finding must cite specific line numbers and commits; vague warnings are not findings.
- Partial-result rule: the report always states what was analyzed, what was excluded, and the confidence level. The done predicate holds only for the in-scope subset actually analyzed.
- Non-mutation rule: repository code and Git history are read only; the only artifact is the report file. No rollback is needed beyond discarding the report.

## Output
A markdown report file with sections in this order: Executive Summary (severity distribution, overall risk, recommendation, key metrics), What Changed (commit range, per-file table), Critical Findings (per HIGH/CRITICAL issue with file:line, blast radius, historical context, attack scenario, fix), Test Coverage Analysis, Blast Radius Analysis, Historical Context, Recommendations (immediate / before production / technical debt), Analysis Methodology (strategy, coverage, limitations, confidence), Appendices, ordered intake → baseline → test-coverage → blast-radius → deep-context → adversarial → report, with status indicators ✅ ⚠️ ❌ and severity indicators 🔴 🟠 🟡 🟢.
