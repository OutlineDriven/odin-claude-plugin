---
name: smart-contract-guidelines-advisor
description: 'Use when a smart-contract project needs architecture, implementation, dependency, upgradeability, documentation, or testing guidance. Produces an evidence-backed secure-development assessment with prioritized recommendations mapped to project code. Don''t use for tasks that require source or remote-system changes.'
---

# Smart contract guidelines advisor

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A smart-contract project needs architecture, implementation, dependency, upgradeability, documentation, or testing guidance. |
| Authority | Read-only: no file write, VCS mutation, credential write, paid service mutation, published content mutation, deployed state change, or remote resource mutation. |
| Side effect | One structured chat output containing an evidence-backed secure-development assessment and concrete deliverables. |
| Done | All applicable assessment areas are covered and every recommendation is mapped to explicit project evidence and deliverables. |

## Inputs

- **Codebase access** (required): the smart-contract source tree, including contract files, test files, configuration, and dependency manifests.
- **Project context** (optional): README, specifications, deployment plans, or documentation that clarifies goals and constraints.
- **Platform identification** (required): the target blockchain platform (Solidity/EVM, Rust/Solana, Cairo/StarkNet, TON, Algorand, Cosmos, Substrate, or other).

## Procedure

1. **Discover project structure.** List all contract or module files, identify the platform and compiler version, locate existing documentation, test files, dependency manifests, and any proxy or upgradeability patterns. Record the file tree and key metadata before proceeding.

2. **Generate documentation and specifications.** Produce a plain-English system description covering purpose, components, assumptions, interactions, and critical operations. Identify documentation gaps: missing NatSpec, undocumented assumptions, unclear state transitions. If Slither printers are available for Solidity, generate contract-interaction and state-machine diagrams; otherwise describe the architecture textually.

3. **Analyze on-chain versus off-chain computation.** If the project has off-chain components or could benefit from them, assess on-chain logic complexity, identify computations that could move off-chain with on-chain verification, and estimate gas savings. Skip this area explicitly if no off-chain optimization opportunity exists.

4. **Review upgradeability.** If the project supports or plans upgrades, assess the pattern (migration versus upgradeability, data separation versus delegatecall proxy), check documentation of the upgrade procedure, and evaluate deployment and initialization scripts. Skip this area explicitly if no upgradeability mechanism exists.

5. **Audit delegatecall proxy patterns.** If delegatecall proxies are present, check storage layout consistency between proxy and implementation, inheritance order implications, initialization patterns and front-running risks, function shadowing, direct implementation usage protection, immutable or constant variable synchronization, and contract existence checks. Use Slither's `slither-check-upgradeability` if available; otherwise perform manual pattern analysis. Skip this area explicitly if no delegatecall proxies exist.

6. **Assess function composition.** Identify functions with excessive size or cyclomatic complexity, unclear purposes, or mixed concerns. Recommend splitting strategies and logical grouping by responsibility (authentication, arithmetic, state transitions).

7. **Evaluate inheritance.** Map the inheritance hierarchy, assess depth and width, check for diamond-problem risks, and review override and virtual function patterns. Recommend simplification where the hierarchy is unnecessarily deep or wide.

8. **Review events.** Verify that all critical operations (state changes, transfers, access control changes, parameter updates) emit events. Check naming consistency, indexed parameters for filtering, and event documentation.

9. **Check common pitfalls.** Systematically scan for reentrancy patterns, integer overflow or underflow, access control issues, front-running vulnerabilities, oracle manipulation risks, timestamp dependence, uninitialized variables, delegatecall risks, and platform-specific vulnerability patterns. Reference the project's own vulnerability database and platform documentation for each finding.

10. **Evaluate dependencies.** Assess external libraries for quality and version currency, check for dependency manager usage, identify copied code that should be imports, and flag custom reimplementations of well-tested library functionality.

11. **Assess testing and verification.** Analyze test coverage, testing techniques (unit, integration, fuzzing, formal verification), CI/CD configuration, and automated security testing. Recommend specific improvements: property-based tests, custom Slither detectors, mutation testing, or CI integration.

12. **Compile prioritized recommendations.** Classify every finding into CRITICAL (fix immediately), HIGH (fix before deployment), MEDIUM (fix for production quality), or LOW (nice to have). Each recommendation must cite the specific file, line, or code pattern that motivates it, and state the concrete action to take.

## Failure and recovery
- **Insufficient codebase access.** If contract files, test files, or dependency manifests are missing or unreadable, report the gap and complete assessment only for the available files. Do not fabricate findings for inaccessible code.
- **Unsupported platform.** If the blockchain platform cannot be identified or is not covered by known vulnerability patterns, state the limitation and provide generic guidance only. Do not pretend platform-specific expertise.
- **Tool unavailability.** If Slither, Echidna, or other analysis tools are unavailable, perform manual analysis and note which checks would benefit from tooling. Do not skip assessment areas because tools are missing.
- **Scope creep.** If analysis reveals issues beyond the 11 assessment areas (for example, economic model flaws or governance design), note them as out-of-scope observations rather than expanding the assessment framework.
- **Non-convergent findings.** If a finding cannot be resolved with the available evidence (for example, ambiguous design intent), classify it as requiring human clarification rather than guessing.

## Output
A structured report containing:

1. **System documentation**: plain-English description, architectural diagrams or textual equivalent, documentation gaps.
2. **Architecture analysis**: on-chain/off-chain assessment (if applicable), upgradeability review (if applicable), proxy pattern security (if applicable).
3. **Implementation review**: function composition, inheritance, events, pitfalls, dependencies, testing.
4. **Prioritized recommendations**: CRITICAL, HIGH, MEDIUM, LOW classifications with file references and concrete actions.
5. **Overall assessment**: maturity level and path to production-ready state.

## Provenance

- **Origin**: https://github.com/trailofbits/skills (Building Secure Contracts plugin, guidelines-advisor skill).
- **Revision**: d1f1575cff97816e5cc08af66cd2506099c681d3.
- **License**: CC-BY-SA-4.0. Preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding.
- **Adaptation**: Clean-room adaptation into ODIN 2.0 skill format. Source mechanism preserved: broad secure-development advice covering documentation, architecture, implementation, dependencies, upgradeability, and testing as a single assessment pass, distinct from vulnerability scanning and workflow execution.
