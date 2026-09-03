---
name: smart-contract-guidelines-advisor
description: 'Use when a smart-contract project needs architecture, implementation, dependency, or testing guidance. Produces an evidence-backed assessment with recommendations. Not for maturity — use smart-contract-code-maturity-assessor; not for audit prep — use smart-contract-audit-prep.'
---

# Smart contract guidelines advisor

## Refuse first

- Do not modify source or remote systems; return evidence-backed guidance only.
- Do not present this broad assessment as exploit confirmation or a complete security audit.
- Do not invent platform-specific findings, design intent, or tool results; state limits and use the documented manual fallback.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A smart-contract project needs architecture, implementation, dependency, upgradeability, documentation, or testing guidance. |
| Authority | Read-only: no file write, VCS mutation, credential write, paid service mutation, published content mutation, deployed state change, or remote resource mutation. |
| Side effect | One structured chat output containing an evidence-backed secure-development assessment and concrete deliverables. |
| Done | All applicable assessment areas are covered and every recommendation is mapped to explicit project evidence and deliverables. |

## Inputs

- Codebase access (required): the smart-contract source tree, including contract files, test files, configuration, and dependency manifests.
- Project context (optional): README, specifications, deployment plans, or documentation that clarifies goals and constraints.
- Platform identification (required): the target blockchain platform (Solidity/EVM, Rust/Solana, Cairo/StarkNet, TON, Algorand, Cosmos, Substrate, or other).

## Procedure

1. **Discover project structure.** List all contract or module files, identify the platform and compiler version, locate existing documentation, test files, dependency manifests, and any proxy or upgradeability patterns. Record the file tree and key metadata before proceeding.
   **Done when:** the assessment scope, platform, compiler, files, documentation, tests, dependencies, and upgradeability signals are recorded.

2. **Generate documentation and specifications.** Produce a plain-English system description covering purpose, components, assumptions, interactions, and critical operations. Identify documentation gaps: missing NatSpec, undocumented assumptions, unclear state transitions. If Slither printers are available for Solidity, generate contract-interaction and state-machine diagrams; otherwise describe the architecture textually.
   **Done when:** purpose, components, assumptions, interactions, critical operations, and documentation gaps are explicit, with diagrams or the named textual fallback.

3. **Analyze on-chain versus off-chain computation.** If the project has off-chain components or could benefit from them, assess on-chain logic complexity, identify computations that could move off-chain with on-chain verification, and estimate gas savings. Skip this area explicitly if no off-chain optimization opportunity exists.
   **Done when:** each credible off-chain move has verification and gas implications, or the report records an evidence-backed explicit skip.

4. **Review upgradeability.** If the project supports or plans upgrades, assess the pattern (migration versus upgradeability, data separation versus delegatecall proxy), check documentation of the upgrade procedure, and evaluate deployment and initialization scripts. Skip this area explicitly if no upgradeability mechanism exists.
   **Done when:** the upgrade pattern, procedure, deployment, and initialization evidence are assessed, or absence is explicitly recorded.

5. **Audit delegatecall proxy patterns.** If delegatecall proxies are present, check storage layout consistency between proxy and implementation, inheritance order implications, initialization patterns and front-running risks, function shadowing, direct implementation usage protection, immutable or constant variable synchronization, and contract existence checks. Use Slither's `slither-check-upgradeability` if available; otherwise perform manual pattern analysis. Skip this area explicitly if no delegatecall proxies exist.
   **Done when:** every named proxy risk has tool-backed or manual evidence, or proxy absence is explicitly recorded.

6. **Assess function composition.** Identify functions with excessive size or cyclomatic complexity, unclear purposes, or mixed concerns. Recommend splitting strategies and logical grouping by responsibility (authentication, arithmetic, state transitions).
   **Done when:** each composition recommendation cites the affected function and names the responsibility boundary it should enforce.

7. **Evaluate inheritance.** Map the inheritance hierarchy, assess depth and width, check for diamond-problem risks, and review override and virtual function patterns. Recommend simplification where the hierarchy is unnecessarily deep or wide.
   **Done when:** the hierarchy, override behavior, diamond risk, and each proposed simplification trace to code evidence.

8. **Review events.** Verify that all critical operations (state changes, transfers, access control changes, parameter updates) emit events. Check naming consistency, indexed parameters for filtering, and event documentation.
   **Done when:** every critical operation has an event disposition and naming, indexing, and documentation findings cite code.

9. **Check common pitfalls.** Systematically scan for reentrancy patterns, integer overflow or underflow, access control issues, front-running vulnerabilities, oracle manipulation risks, timestamp dependence, uninitialized variables, delegatecall risks, and platform-specific vulnerability patterns. Reference the project's own vulnerability database and platform documentation for each finding.
   **Done when:** every named pitfall has an evidence-backed finding or explicit no-finding result, with project and platform references where applicable.

10. **Evaluate dependencies.** Assess external libraries for maintenance quality and whether their versions are current, check for dependency manager usage, identify copied code that should be imports, and flag custom reimplementations of well-tested library functionality.
    **Done when:** each dependency, copied implementation, and custom reimplementation has a currentness, maintenance, and reuse disposition backed by manifests or source.

11. **Assess testing and verification.** Analyze test coverage, testing techniques (unit, integration, fuzzing, formal verification), CI/CD configuration, and automated security testing. Recommend specific improvements: property-based tests, custom Slither detectors, mutation testing, or CI integration.
    **Done when:** coverage and technique gaps map to specific runnable improvements and existing test or CI evidence.

12. **Compile prioritized recommendations.** Classify every finding into CRITICAL (fix immediately), HIGH (fix before deployment), MEDIUM (fix for production quality), or LOW (nice to have). Each recommendation must cite the specific file, line, or code pattern that motivates it, and state the concrete action to take.
    **Done when:** every finding has one severity, one evidence citation, and one concrete action, with no unsupported priority claim.

## Failure and recovery

### Evidence and platform limits
- **Insufficient codebase access.** If contract files, test files, or dependency manifests are missing or unreadable, report the gap and complete assessment only for the available files. Do not fabricate findings for inaccessible code.
- **Unsupported platform.** If the blockchain platform cannot be identified or is not covered by known vulnerability patterns, state the limitation and provide generic guidance only. Do not pretend platform-specific expertise.
- **Non-convergent findings.** If a finding cannot be resolved with the available evidence, classify it as requiring human clarification rather than guessing.

### Tool and scope limits
- **Tool unavailability.** If Slither, Echidna, or other analysis tools are unavailable, perform manual analysis and note which checks would benefit from tooling. Do not skip assessment areas because tools are missing.
- **Scope creep.** If analysis reveals issues beyond the 11 assessment areas, such as economic-model flaws or governance design, note them as out-of-scope observations rather than expanding the framework.

## Output

**Output contract:** Return system documentation first, then architecture analysis, implementation review, CRITICAL-to-LOW recommendations, and the overall maturity path; order every finding within its section by severity and source location.
