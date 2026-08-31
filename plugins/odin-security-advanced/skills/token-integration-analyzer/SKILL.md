---
name: token-integration-analyzer
description: 'Use when a token implementation or integration needs standards, privilege, nonstandard-behavior, and defensive-integration analysis. Returns a prioritized remediation report. Not for tasks that require source or remote-system changes.'
---

# Token integration analyzer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A token implementation or integration needs standards, privilege, nonstandard-behavior, and defensive-integration analysis. |
| Authority | No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output: token conformity, privilege, weird-behavior, integration-safety, and prioritized remediation report. |
| Done | Every applicable token category is evaluated and unsafe assumptions are tied to concrete defensive changes. |

## Inputs

Must be supplied:
- A codebase or contract source accessible to the session.
- Context: token implementation, token integration, or both.
- Token type: ERC20, ERC721, or both.

Optional:
- Deployed contract address (required for on-chain scarcity and holder analysis).
- RPC endpoint URL (required when address is supplied).

## Refusals

- Will not fabricate on-chain facts when address or RPC is absent.
- Will not invent evidence or call external tools not covered by this procedure.
- Will not label a behavior as confirmed when it cannot be inferred from static code alone — label it unverified.

## Procedure

1. **Determine analysis context.** Classify as token implementation, token integration, or both. Identify the platform (Ethereum, other EVM, or non-EVM). Confirm the token type(s) under analysis. **Done when:** the context, platform, and token type(s) are confirmed.
2. **Run static analysis (Solidity).** If the codebase is Solidity and Slither is available, run `slither-check-erc` for ERC20 or ERC721 conformity, `slither --print human-summary` for complexity and upgrade analysis, and `slither --print contract-summary` for function inventory. Capture all output verbatim. If Slither is unavailable, manually verify all ERC conformity criteria from step 3 and document the gap. **Done when:** static analysis output is captured or manual verification is documented.
3. **Analyze all 10 assessment categories.** For each applicable category, evaluate every checklist item against the codebase and produce a compliance finding (pass, warning, or fail) with file and line references. The per-category checklist items are in `references/assessment-categories.md`. **Done when:** every applicable category is evaluated with findings.
4. **Query on-chain data** if address and RPC are supplied. Retrieve name, symbol, decimals, totalSupply, owner/admin address, and pause status. Identify holder distribution and concentration. Do not hallucinate on-chain facts when address or RPC is absent. **Done when:** on-chain data is retrieved or the exclusion is noted.
5. **Produce the prioritized remediation report.** Structure: executive summary with overall risk level and critical/high count; per-category findings with pass/warn/fail status and evidence; weird-token-pattern table listing each applicable pattern, presence, risk level, evidence, and mitigation; on-chain analysis section (when address supplied); integration-safety assessment (when analyzing protocol); prioritized recommendations grouped CRITICAL (fix before deployment), HIGH (fix soon), MEDIUM (improve), LOW (best practice). Each recommendation must cite the specific unsafe assumption and the concrete defensive change that addresses it. **Done when:** the report is produced with every recommendation tying one unsafe assumption to one defensive change.

## Failure and recovery

| Failure class | Condition | Result |
|---|---|---|
| no-token-code | Codebase contains no token-related source | Report that no token implementation or integration was found; stop. |
| slither-unavailable | Slither not installed or not in PATH | Continue with manual ERC conformity verification; document each manual check performed. |
| on-chain-unavailable | No contract address or no RPC endpoint | Omit on-chain scarcity and holder analysis; note the exclusion in the report. |
| behavior-undetermined | Cannot infer token behavior from static code alone | Label the assumption as unverified; do not fabricate a finding. |
| scope-widening | Any analysis step would require expanding scope beyond token safety | Stop at the boundary; do not invent evidence or call external tools not covered by this procedure. |

Partial-result rule: return findings for all categories successfully evaluated; mark each blocked category as unevaluated with the specific failure class and reason.

Non-mutation rule: this skill performs no file writes, no credential use, and no remote mutations. No rollback required.

## Output

A structured token security report with executive summary (risk level and counts per severity), per-category compliance checklist (all 10 categories with pass/warn/fail), weird-token-pattern table (each of the 24 applicable patterns with presence, risk, evidence, mitigation), on-chain analysis section (when address and RPC supplied), integration-safety assessment (when protocol integration analyzed), and prioritized recommendations (CRITICAL/HIGH/MEDIUM/LOW, each tying one unsafe assumption to one defensive change) — ordering: summary, categories, patterns, on-chain, integration, recommendations.
