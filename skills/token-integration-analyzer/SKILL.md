---
name: token-integration-analyzer
description: 'Use when asked to analyze a token implementation or integration for ERC20/ERC721 standards conformity, owner privileges, 24+ known nonstandard token patterns, and defensive integration safety, and returns a prioritized remediation report. Don''t use for tasks that require source or remote-system changes.'
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

## Procedure

1. **Determine analysis context.** Classify as token implementation, token integration, or both. Identify the platform (Ethereum, other EVM, or non-EVM). Confirm the token type(s) under analysis.

2. **Run static analysis (Solidity).** If the codebase is Solidity and Slither is available, run `slither-check-erc` for ERC20 or ERC721 conformity, `slither --print human-summary` for complexity and upgrade analysis, and `slither --print contract-summary` for function inventory. Capture all output verbatim. If Slither is unavailable, manually verify all ERC conformity criteria from step 3 and document the gap.

3. **Analyze all 10 assessment categories.** For each applicable category, evaluate every checklist item against the codebase and produce a compliance finding (pass, warning, or fail) with file and line references:
   - **General Considerations**: audit history, team transparency, security contact.
   - **Contract Composition**: complexity, SafeMath or Solidity 0.8+ arithmetic guards, non-token functions, single address entry point.
   - **Owner Privileges**: upgradeability (proxy patterns), minting caps, pausability, blacklisting, team accountability.
   - **ERC20 Conformity**: boolean return values on transfer/transferFrom, metadata presence, decimals type and value, race-condition mitigation (increaseAllowance/decreaseAllowance).
   - **ERC20 Extension Risks**: external calls in transfer (ERC777 hooks), transfer fees, rebasing or yield-bearing mechanics.
   - **Token Scarcity Analysis** (on-chain only when address and RPC are supplied): supply distribution, holder concentration, exchange listings, flash-loan and flash-mint risk.
   - **Weird ERC20 Patterns**: check all 24 known nonstandard behaviors: reentrant calls (ERC777 hooks), missing return values (USDT, BNB, OMG), fee-on-transfer (STA, PAXG), balance modifications outside transfers (Ampleforth, Compound), upgradable tokens (USDC, USDT), flash-mintable (DAI), blocklists (USDC, USDT), pausable tokens (BNB, ZIL), approval race protections (USDT, KNC), revert on zero-address approval, revert on zero-value approval, revert on zero-value transfer, multiple token addresses, low decimals (USDC 6, Gemini 2), high decimals (YAM-V2 24), transferFrom with src==msg.sender, non-string metadata (MKR), revert on transfer to zero, no-revert-on-failure (ZRX, EURS), revert on large approvals (UNI, COMP ≥ 2^96), code injection via token name, u…
   - **Token Integration Safety**: safe transfer patterns (SafeERC20), balance verification before/after transfer, allowlist pattern, wrapper contracts, reentrancy guards on token interactions.
   - **ERC721 Conformity**: transfers to 0x0 revert, safeTransferFrom and onERC721Received, metadata functions, ownerOf behavior, approval clearing on transfer, token ID immutability.
   - **ERC721 Common Risks**: onERC721Received reentrancy, safe minting to contracts, burning clears approvals.

4. **Query on-chain data** if address and RPC are supplied. Retrieve name, symbol, decimals, totalSupply, owner/admin address, and pause status. Identify holder distribution and concentration. Do not hallucinate on-chain facts when address or RPC is absent.

5. **Produce the prioritized remediation report.** Structure: executive summary with overall risk level and critical/high count; per-category findings with pass/warn/fail status and evidence; weird-token-pattern table listing each applicable pattern, presence, risk level, evidence, and mitigation; on-chain analysis section (when address supplied); integration-safety assessment (when analyzing protocol); prioritized recommendations grouped CRITICAL (fix before deployment), HIGH (fix soon), MEDIUM (improve), LOW (best practice). Each recommendation must cite the specific unsafe assumption and the concrete defensive change that addresses it.

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
A structured token security report containing:
- Executive summary with overall risk level (CRITICAL / HIGH / MEDIUM / LOW) and counts per severity.
- Per-category compliance checklist: all 10 categories with pass/warn/fail for each item.
- Weird-token-pattern table: each of the 24 patterns that apply, with presence, risk level, evidence, and mitigation.
- On-chain analysis section: scarcity, holder distribution, exchange listings, configuration (present only when address and RPC supplied).
- Integration-safety assessment: safe-transfer usage, balance verification, defensive patterns, weird-token handling (present only when protocol integration is analyzed).
- Prioritized recommendations: CRITICAL / HIGH / MEDIUM / LOW groups; each recommendation ties one unsafe assumption to one concrete defensive change.

## Provenance

Origin: Trail of Bits — Building Secure Contracts: Token Integration Checklist and Weird ERC20 Database. URL: https://github.com/trailofbits/skills. Revision: d1f1575cff97816e5cc08af66cd2506099c681d3. License: CC-BY-SA-4.0. Attribution and source link preserved per license terms; modifications marked. Trademark rights to trail-of-bits-mark.svg not claimed.

Adaptation: The 10-category assessment rubric, 24-pattern weird-ERC20 database, 5-phase analysis flow, and rationalization table are adapted into clean-room procedure and recovery language. No third-party expression is copied directly; all analysis steps are re-derived from the source mechanism description and provenance paths.
