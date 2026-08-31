---
name: smart-contract-code-maturity-assessor
description: 'Use when a smart-contract codebase needs an evidence-based maturity scorecard and prioritized improvement roadmap. Rates nine categories from code and explicit off-chain evidence, computes an aggregate score, and produces a CRITICAL-to-MEDIUM roadmap. Not for vulnerability auditing, source fixes, or claims about inaccessible processes.'
---

# Smart contract code maturity assessor

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A smart-contract codebase needs an evidence-based maturity scorecard and prioritized improvement roadmap. |
| Authority | Read-only: no file write, VCS mutation, credential write, paid service mutation, published content mutation, deployed state change, or remote resource mutation. |
| Side effect | One structured chat output containing a nine-category maturity scorecard, per-category evidence, identified risks, and an ordered remediation roadmap. |
| Done | Every rubric category has an evidence-backed rating or an explicit evidence-unavailable marker, the aggregate score is computed from rated categories, and every consequential rating traces to evidence or an explicit gap. |

## Inputs

Required:
- Access to the full smart-contract codebase under assessment.

Optional and asked at runtime:
- Project context (DeFi, NFT, infrastructure, or other domain).
- Off-chain process knowledge: monitoring infrastructure, incident response plans, team practices, privileged actor identity (EOA, multisig, or DAO).

## Refuse first

- Do not treat this maturity rubric as a vulnerability audit or proof of security.
- Do not modify source, tests, documentation, repositories, credentials, or deployed systems.
- Do not infer off-chain monitoring, incident response, governance, or team practices from code; ask or mark evidence unavailable.

## Procedure

1. Discover the codebase. Locate contract and module files, test files, and documentation. Identify the platform and language. Done when: the assessed source, tests, documentation, platform, language, and known scope gaps are explicitly bounded.

2. Assess each of nine categories. For each category, search code for relevant patterns, read key implementations, collect file:line evidence, and ask the human about off-chain processes that the code cannot show. Apply the WEAK/MODERATE/SATISFACTORY/STRONG rating thresholds using the criteria below.

   Rating logic: Any Weak criterion makes the rating Weak. If no Weak criterion applies but some Moderate requirements are unmet, rate Moderate. If all Moderate requirements and some Satisfactory requirements are met, rate Satisfactory. If all Satisfactory requirements are met and exceptional practices are present, rate Strong. If code inspection cannot establish a rating, mark the category `evidence-unavailable` rather than assigning WEAK or inventing evidence.

   **1. ARITHMETIC**
   - Analyze: overflow protection (Solidity 0.8+, SafeMath, checked_*, saturating_*), unchecked blocks and documentation, division/rounding, critical-function arithmetic, arithmetic edge-case testing, arithmetic specifications.
   - WEAK if: no overflow protection without justification; unchecked arithmetic not documented; no arithmetic spec or spec mismatches code; no arithmetic testing strategy; critical edge cases untested.
   - MODERATE requires: all weak resolved; unchecked arithmetic minimal, justified, documented; overflow/underflow risks documented and tested; explicit rounding for precision loss; automated testing; stateless arithmetic functions; bounded parameters.
   - SATISFACTORY requires: all moderate met; precision loss analyzed vs ground-truth; all trapping operations identified; arithmetic spec matches code one-to-one; automated testing covers all operations in CI.

   **2. AUDITING**
   - Analyze: event definitions and emission patterns, events for critical operations, event naming consistency, critical functions without events.
   - Ask: off-chain monitoring infrastructure, monitoring plan, incident response plan.
   - WEAK if: no event strategy; events missing for critical updates; no consistent event guidelines; same events reused for different purposes.
   - MODERATE requires: all weak resolved; events for all critical functions; off-chain monitoring logs events; monitoring plan documented; event documentation; log review process documented; incident response plan exists.
   - SATISFACTORY requires: all moderate met; monitoring triggers alerts on unexpected behavior; defined roles for incident detection; incident response plan regularly tested.

   **3. AUTHENTICATION / ACCESS CONTROLS**
   - Analyze: access control modifiers and functions, role definitions and separation, admin/owner patterns, privileged function implementations, access control test coverage.
   - Ask: privileged actor identity (EOA, multisig, DAO); documentation of roles and privileges; key compromise scenarios.
   - WEAK if: access controls unclear or inconsistent; single address controls system without safeguards; missing access controls on privileged functions; no role differentiation; all privileges on one address.
   - MODERATE requires: all weak resolved; all privileged functions have access control; least privilege principle followed; non-overlapping role privileges; clear actor/privilege documentation; tests cover all privileges; roles can be revoked; two-step processes for EOA operations.
   - SATISFACTORY requires: all moderate met; all actors well documented; implementation matches specification; privileged actors not EOAs; key leakage does not compromise system; tested against known attack vectors.

   **4. COMPLEXITY MANAGEMENT**
   - Analyze: function length and nesting depth, cyclomatic complexity, code duplication, inheritance hierarchies, naming conventions, function clarity.
   - Ask: complex parts documented; naming convention documented; complexity measurements.
   - WEAK if: unnecessary complexity hinders review; functions overuse nested operations; functions have unclear scope; unnecessary code duplication; complex inheritance tree.
   - MODERATE requires: all weak resolved; complex parts identified, minimized; high complexity (>=11) justified; critical functions well-scoped; minimal, justified redundancy; clear inputs with validation; documented naming convention; types not misused.
   - SATISFACTORY requires: all moderate met; minimal unnecessary complexity; necessary complexity documented; clear function purposes; straightforward to test; no redundant behavior.

   **5. DECENTRALIZATION**
   - Analyze: upgrade mechanisms (proxies, governance), owner/admin control scope, timelock/multisig patterns, user opt-out mechanisms.
   - Ask: upgrade mechanism and control; user opt-out/exit paths; centralization risk documentation.
   - WEAK if: centralization points not visible to users; critical functions upgradable by single entity without opt-out; single entity controls user funds; all decisions by single entity; parameters changeable anytime by single entity; centralized permission required.
   - MODERATE requires: all weak resolved; centralization risks identified, justified, documented; user opt-out/exit path documented; upgradeability only for non-critical features; privileged actors cannot unilaterally move or trap funds; all privileges documented.
   - SATISFACTORY requires: all moderate met; clear decentralization path justified; on-chain voting risks addressed or no centralization; deployment risks documented; external interaction risks documented; critical parameters immutable or users can exit.

   **6. DOCUMENTATION**
   - Analyze: README, specification, architecture docs, inline code comments (NatSpec, rustdoc), user stories, glossaries, documentation completeness and accuracy.
   - Ask: user stories documented; architecture diagrams exist; glossary for domain terms.
   - WEAK if: minimal or incomplete or outdated documentation; only high-level description; code comments do not match docs; not publicly available for public codebases; unexplained artificial terms.
   - MODERATE requires: all weak resolved; clear, unambiguous writing; glossary for business terms; architecture diagrams; user stories included; core/critical components identified; docs sufficient to understand behavior; all critical functions/blocks documented; known risks/limitations documented.
   - SATISFACTORY requires: all moderate met; user stories cover all operations; detailed behavior descriptions; implementation matches spec with deviations justified; invariants clearly defined; consistent naming conventions; documentation for end-users and developers.

   **7. TRANSACTION ORDERING RISKS**
   - Analyze: MEV-vulnerable patterns (AMM swaps, arbitrage, large trades), front-running protections, slippage/deadline checks, oracle implementations.
   - Ask: transaction ordering risks identified/documented; known MEV opportunities; mitigation strategies; testing for ordering attacks.
   - WEAK if: ordering risks not identified/documented; protocols or assets at risk from unexpected ordering; relies on unjustified MEV prevention constraints; unproven assumptions about MEV extractors.
   - MODERATE requires: all weak resolved; user operation ordering risks limited, justified, documented; MEV mitigations in place (delays, slippage checks); testing emphasizes ordering risks; tamper-resistant oracles used.
   - SATISFACTORY requires: all moderate met; all ordering risks documented and justified; known risks highlighted in docs and tests, visible to users; documentation centralizes MEV opportunities; privileged operation ordering risks limited, justified; tests highlight ordering risks.

   **8. LOW-LEVEL MANIPULATION**
   - Analyze: assembly blocks, unsafe code sections, low-level calls, bitwise operations, justification and documentation.
   - Ask: why assembly or unsafe is used; high-level reference implementation; how this is tested.
   - WEAK if: unjustified low-level manipulations; assembly or low-level not justified when high-level is possible.
   - MODERATE requires: all weak resolved; assembly use limited and justified; inline comments for each operation; no re-implementation of established libraries without justification; high-level reference for complex assembly.
   - SATISFACTORY requires: all moderate met; thorough documentation, justification, and testing; validated with automated testing vs reference; differential fuzzing compares implementations; compiler optimization risks identified.

   **9. TESTING AND VERIFICATION**
   - Analyze: test file count and organization, test coverage reports, CI/CD configuration, advanced testing (fuzzing, formal verification), test quality and isolation.
   - Ask: test coverage percentage; whether all tests pass; testing techniques used; ease of running tests.
   - WEAK if: limited testing, only happy paths; common use cases not tested; tests fail; cannot run tests out of the box.
   - MODERATE requires: all weak resolved; most functions and use cases tested; all tests pass; coverage reports available; automated testing for critical components; tests in CI/CD; integration tests where applicable; test code follows best practices.
   - SATISFACTORY requires: all moderate met; 100% reachable branch and statement coverage; end-to-end testing covers all entry points; isolated test cases; mutation testing used.

   Done when: all nine categories have a threshold-derived rating or an evidence-unavailable marker, file-and-line evidence, explicit evidence gaps, and only human-supplied off-chain claims.

3. Compute overall maturity. Map each rated category to a numeric value: WEAK=1, MODERATE=2, SATISFACTORY=3, STRONG=4. Compute the arithmetic mean of the rated categories and round to one decimal. Exclude any evidence-unavailable category from the mean and list it separately in the scorecard. Do not silently assign a numeric value to an evidence-unavailable category. Done when: the aggregate score is computed from rated categories only, rounded to one decimal, and evidence-unavailable categories are listed separately.

4. Generate the report. Produce the structured output: executive summary with overall score, top strengths, top gaps, and priority recommendations; maturity scorecard table with all nine categories (rated or evidence-unavailable); per-category detailed analysis with evidence; improvement roadmap ordered by CRITICAL, HIGH, MEDIUM with effort estimates and impact per item. Done when: the report contains every output section, preserves category-to-evidence traceability, and orders remediation by severity, effort, and impact.

5. Traceability check. Verify that every rating cites file:line evidence or an unanswered question. Verify that no evidence-unavailable category was silently scored. Verify that the aggregate score matches the arithmetic mean of the rated categories. Done when: every consequential rating traces to evidence or an explicit gap.

## Failure and recovery

- Evidence-gap: a category cannot be rated from code inspection. Mark it `evidence-unavailable`, exclude it from the aggregate mean, and list it separately in the scorecard. Never invent evidence or assign WEAK to fill the gap.
- Partial-assessment: the codebase scope exceeds what can be covered in one session. Produce the scorecard for the covered portions and explicitly list the uncovered areas as `not assessed`. Do not extrapolate ratings to unexamined areas.
- Abandoned: the human withdraws or the codebase becomes inaccessible. Return the partial scorecard with the last-known ratings and the questions that remained unanswered.

## Output

Return the executive summary first, then the nine-category scorecard (with evidence-unavailable categories listed separately), per-category evidence and gaps, the aggregate score computed from rated categories, and a CRITICAL-to-HIGH-to-MEDIUM improvement roadmap with effort and impact. Every consequential rating traces to evidence or an explicit gap.
