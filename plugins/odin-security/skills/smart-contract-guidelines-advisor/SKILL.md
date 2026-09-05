---
name: smart-contract-guidelines-advisor
description: 'Use when a smart-contract project needs architecture, testing, or a maturity scorecard. Use `guidelines` or `maturity` mode. Not for audits: use smart-contract-audit-prep.'
---

# Smart contract guidelines and maturity advisor

## Refuse first

- Do not modify source or remote systems; return evidence-backed guidance only.
- Do not present this broad assessment as exploit confirmation or a complete security audit.
- Do not invent platform-specific findings, design intent, or tool results; state limits and use the documented manual fallback.
- Do not treat the maturity scorecard as proof of security or a vulnerability audit.
- Do not infer off-chain monitoring, incident response, governance, or team practices from code; ask or mark evidence unavailable.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A smart-contract project needs architecture, implementation, dependency, upgradeability, documentation, testing guidance, or an evidence-based maturity scorecard. |
| Authority | Read-only. Closed write set: none. Rollback: not applicable. No remote mutation. |
| Side effect | One structured chat output containing an evidence-backed assessment, a nine-category maturity scorecard in `maturity` mode, and concrete deliverables or a remediation roadmap. |
| Done | All applicable assessment areas or categories are covered, every recommendation or rating maps to explicit project evidence, and the aggregate score in `maturity` mode is computed from rated categories only. |

## Inputs

- Mode (required): `guidelines` for the 12-area secure-development assessment, or `maturity` for the nine-category scorecard.
- Codebase access (required): the smart-contract source tree, including contract files, test files, configuration, and dependency manifests.
- Project context (optional): README, specifications, deployment plans, or documentation that clarifies goals and constraints.
- Platform identification (required): the target blockchain platform (Solidity/EVM, Rust/Solana, Cairo/StarkNet, TON, Algorand, Cosmos, Substrate, or other).
- Off-chain process knowledge (optional, asked at runtime): monitoring infrastructure, incident response plans, team practices, privileged actor identity (EOA, multisig, or DAO).

## Procedure

1. **Discover project structure.** List contract or module files, identify the platform and compiler version, locate documentation, test files, dependency manifests, and any proxy or upgradeability patterns. Record the file tree and key metadata.
   **Done when:** the assessment scope, platform, compiler, files, documentation, tests, dependencies, and upgradeability signals are recorded.

2. **Run the selected mode.**

   Mode `guidelines`:

   1. **Generate documentation and specifications.** Produce a plain-English system description covering purpose, components, assumptions, interactions, and critical operations. Identify documentation gaps: missing NatSpec, undocumented assumptions, unclear state transitions. If Slither printers are available for Solidity, generate contract-interaction and state-machine diagrams; otherwise describe the architecture textually.
      **Done when:** purpose, components, assumptions, interactions, critical operations, and documentation gaps are explicit, with diagrams or the named textual fallback.

   2. **Analyze on-chain versus off-chain computation.** If the project has off-chain components or could benefit from them, assess on-chain logic complexity, identify computations that could move off-chain with on-chain verification, and estimate gas savings. Skip this area explicitly if no off-chain optimization opportunity exists.
      **Done when:** each credible off-chain move has verification and gas implications, or the report records an evidence-backed explicit skip.

   3. **Review upgradeability.** If the project supports or plans upgrades, assess the pattern (migration versus upgradeability, data separation versus delegatecall proxy), check documentation of the upgrade procedure, and evaluate deployment and initialization scripts. Skip this area explicitly if no upgradeability mechanism exists.
      **Done when:** the upgrade pattern, procedure, deployment, and initialization evidence are assessed, or absence is explicitly recorded.

   4. **Audit delegatecall proxy patterns.** If delegatecall proxies are present, check storage layout consistency between proxy and implementation, inheritance order implications, initialization patterns and front-running risks, function shadowing, direct implementation usage protection, immutable or constant variable synchronization, and contract existence checks. Use Slither's `slither-check-upgradeability` if available; otherwise perform manual pattern analysis. Skip this area explicitly if no delegatecall proxies exist.
      **Done when:** every named proxy risk has tool-backed or manual evidence, or proxy absence is explicitly recorded.

   5. **Assess function composition.** Identify functions with excessive size or cyclomatic complexity, unclear purposes, or mixed concerns. Recommend splitting strategies and logical grouping by responsibility (authentication, arithmetic, state transitions).
      **Done when:** each composition recommendation cites the affected function and names the responsibility boundary it should enforce.

   6. **Evaluate inheritance.** Map the inheritance hierarchy, assess depth and width, check for diamond-problem risks, and review override and virtual function patterns. Recommend simplification where the hierarchy is unnecessarily deep or wide.
      **Done when:** the hierarchy, override behavior, diamond risk, and each proposed simplification trace to code evidence.

   7. **Review events.** Verify that all critical operations (state changes, transfers, access control changes, parameter updates) emit events. Check naming consistency, indexed parameters for filtering, and event documentation.
      **Done when:** every critical operation has an event disposition and naming, indexing, and documentation findings cite code.

   8. **Check common pitfalls.** Systematically scan for reentrancy patterns, integer overflow or underflow, access control issues, front-running vulnerabilities, oracle manipulation risks, timestamp dependence, uninitialized variables, delegatecall risks, and platform-specific vulnerability patterns. Reference the project's own vulnerability database and platform documentation for each finding.
      **Done when:** every named pitfall has an evidence-backed finding or explicit no-finding result, with project and platform references where applicable.

   9. **Evaluate dependencies.** Assess external libraries for maintenance quality and whether their versions are current, check for dependency manager usage, identify copied code that should be imports, and flag custom reimplementations of well-tested library functionality.
      **Done when:** each dependency, copied implementation, and custom reimplementation has a currentness, maintenance, and reuse disposition backed by manifests or source.

   10. **Assess testing and verification.** Analyze test coverage, testing techniques (unit, integration, fuzzing, formal verification), CI/CD configuration, and automated security testing. Recommend specific improvements: property-based tests, custom Slither detectors, mutation testing, or CI integration.
       **Done when:** coverage and technique gaps map to specific runnable improvements and existing test or CI evidence.

   11. **Compile prioritized recommendations.** Classify every finding into CRITICAL (fix immediately), HIGH (fix before deployment), MEDIUM (fix for production quality), or LOW (nice to have). Each recommendation must cite the specific file, line, or code pattern that motivates it, and state the concrete action to take.
       **Done when:** every finding has one severity, one evidence citation, and one concrete action, with no unsupported priority claim.

   Mode `maturity`:

   1. **Assess each of nine categories.** For every category, search code for relevant patterns, read key implementations, collect file:line evidence, and ask the human about off-chain processes that code cannot show. Apply the WEAK/MODERATE/SATISFACTORY/STRONG thresholds below. Any Weak criterion makes the rating Weak. If no Weak criterion applies but some Moderate requirements are unmet, rate Moderate. If all Moderate requirements and some Satisfactory requirements are met, rate Satisfactory. If all Satisfactory requirements are met and exceptional practices are present, rate Strong. If code inspection cannot establish a rating, mark the category `evidence-unavailable` rather than assigning WEAK or inventing evidence.
      **Done when:** all nine categories have a threshold-derived rating or an evidence-unavailable marker, file:line evidence, explicit evidence gaps, and only human-supplied off-chain claims.

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

   2. **Compute overall maturity.** Map each rated category to a numeric value: WEAK=1, MODERATE=2, SATISFACTORY=3, STRONG=4. Compute the arithmetic mean of the rated categories and round to one decimal. Exclude any evidence-unavailable category from the mean and list it separately in the scorecard. Do not silently assign a numeric value to an evidence-unavailable category.
      **Done when:** the aggregate score is computed from rated categories only, rounded to one decimal, and evidence-unavailable categories are listed separately.

   3. **Generate the report.** Produce the structured output: executive summary with overall score, top strengths, top gaps, and priority recommendations; maturity scorecard table with all nine categories (rated or evidence-unavailable); per-category detailed analysis with evidence; improvement roadmap ordered by CRITICAL, HIGH, MEDIUM with effort estimates and impact per item.
      **Done when:** the report contains every output section, preserves category-to-evidence traceability, and orders remediation by severity, effort, and impact.

   4. **Traceability check.** Verify that every rating cites file:line evidence or an unanswered question. Verify that no evidence-unavailable category was silently scored. Verify that the aggregate score matches the arithmetic mean of the rated categories.
      **Done when:** every consequential rating traces to evidence or an explicit gap.

3. **Compile and order output.** In `guidelines` mode, return system documentation, architecture analysis, implementation review, CRITICAL-to-LOW recommendations, and the overall maturity path. In `maturity` mode, return the executive summary, the nine-category scorecard, per-category evidence and gaps, the aggregate score, and a CRITICAL-to-HIGH-to-MEDIUM improvement roadmap. In both modes, order findings by severity and source location.
   **Done when:** the output contract is satisfied.

## Failure and recovery

### Evidence and platform limits
- **Insufficient codebase access.** If contract files, test files, or dependency manifests are missing or unreadable, report the gap and complete assessment only for the available files. Do not fabricate findings for inaccessible code.
- **Unsupported platform.** If the blockchain platform cannot be identified or is not covered by known vulnerability patterns, state the limitation and provide generic guidance only. Do not pretend platform-specific expertise.
- **Non-convergent findings.** If a finding cannot be resolved with the available evidence, classify it as requiring human clarification rather than guessing.

### Tool and scope limits
- **Tool unavailability.** If Slither, Echidna, or other analysis tools are unavailable, perform manual analysis and note which checks would benefit from tooling. Do not skip assessment areas because tools are missing.
- **Scope creep.** If analysis reveals issues beyond the 11 assessment areas or nine categories, such as economic-model flaws or governance design, note them as out-of-scope observations rather than expanding the framework.

### Maturity-specific limits
- **Evidence-gap.** A category cannot be rated from code inspection. Mark it `evidence-unavailable`, exclude it from the aggregate mean, and list it separately in the scorecard. Never invent evidence or assign WEAK to fill the gap.
- **Partial-assessment.** The codebase scope exceeds what can be covered in one session. Produce the scorecard for the covered portions and explicitly list the uncovered areas as `not assessed`. Do not extrapolate ratings to unexamined areas.
- **Abandoned.** The human withdraws or the codebase becomes inaccessible. Return the partial scorecard with the last-known ratings and the questions that remained unanswered.

## Output

Return the mode-specific output in the order defined in the Procedure. In `guidelines` mode, return system documentation first, then architecture analysis, implementation review, CRITICAL-to-LOW recommendations, and the overall maturity path. In `maturity` mode, return the executive summary first, then the nine-category scorecard (with evidence-unavailable categories listed separately), per-category evidence and gaps, the aggregate score, and a CRITICAL-to-HIGH-to-MEDIUM improvement roadmap. Map every recommendation or rating to explicit evidence in both modes.
