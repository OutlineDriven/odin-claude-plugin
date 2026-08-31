---
name: smart-contract-secure-workflow
description: 'Use when a smart-contract team invokes this before check-in or deployment to run a five-stage security workflow producing a consolidated pass or unresolved-risk report. Not for audit prep — use smart-contract-audit-prep; not for guidelines — use smart-contract-guidelines-advisor.'
---

# Smart contract secure workflow

## Refuse first

- Do not deploy, publish, change credentials, or mutate remote systems.
- Do not mark an unavailable or skipped stage complete; compensate within scope or report it blocked.
- Do not widen a no-finding stage or hide unresolved risks to obtain a passing status.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A smart-contract team needs to execute a repeatable end-to-end secure development check before a check-in or deployment. |
| Authority | Reversible local. Write only named local artifacts under the working directory. Roll back by deleting the generated report, tool outputs, and review notes. |
| Side effect | Tool outputs, visualizations, documented properties, manual-review notes, and a consolidated workflow report. All artifacts written to local paths only. |
| Done | All five workflow stages are executed or explicitly marked unavailable with compensating analysis and unresolved risks documented. |

## Inputs

- Contract source directory (required): path to the Solidity, Vyper, or other smart-contract source tree under audit.
- Deployment target (optional): network name or deployment configuration. If absent, deployment-preparation analysis covers generic mainnet assumptions.
- Existing test suite (optional): path to current test files. Used to assess coverage gaps before generating new properties.

## Procedure

1. **Validate inputs.** Confirm the contract source directory exists and contains at least one contract file. If the directory is missing or empty, stop and report `blocked: no contract source`.
   Done when: a non-empty contract source directory is confirmed, or the workflow stops before writing artifacts with the exact blocked status.

2. **Stage 1: Property identification.** Read the contract source. Extract public and external functions, state variables, access-control modifiers, and invariant candidates. Document each identified property as a named assertion with the function or state it constrains. If the codebase exceeds tool capacity, document the subset analyzed and list skipped files.
   Done when: every covered public surface, state variable, access control, and invariant candidate maps to a named assertion, and skipped files are explicit.

3. **Stage 2: Test generation.** For each property from Stage 1, generate a runnable test that asserts the property holds. Use the project's existing test framework if detected; otherwise produce standalone assertion tests. Write generated tests to a local output directory. If test generation fails for a property, mark it `test-generation-failed` and record the reason.
   Done when: every Stage 1 property has a runnable local test or a recorded `test-generation-failed` reason.

4. **Stage 3: Manual review.** Perform a structured manual review covering: reentrancy entry points, unchecked external calls, integer overflow and underflow in arithmetic, access-control gaps, front-running vectors, and oracle manipulation surfaces. For each finding, record severity (critical, high, medium, low, informational), affected function, and a recommended fix. If a review area is not applicable to the codebase, mark it `not-applicable` with justification.
   Done when: each required review area has severity-tagged findings with locations and fixes, or a justified `not-applicable` result.

5. **Stage 4: Fuzzing.** If a fuzzing tool (Echidna, Foundry fuzz, Medusa) is available in the environment, run property-based fuzzing against the properties from Stage 1. Record campaign duration, corpus size, and any violations found. If no fuzzing tool is available, mark this stage `unavailable: no fuzzer in environment` and perform compensating analysis by stress-testing edge cases manually against the identified properties.
   Done when: fuzzing records tool, duration, corpus size, and violations, or the unavailable status and bounded manual edge-case evidence are recorded with their coverage limit.

6. **Stage 5: Deployment preparation.** Review deployment scripts and configuration for: hardcoded addresses, missing constructor arguments, upgradeable-proxy initialization gaps, gas-limit assumptions, and network-specific parameters. If no deployment target was supplied, analyze against generic mainnet assumptions and note the limitation.
   Done when: every named deployment risk has an evidence-backed disposition and the target network or generic-mainnet limitation is explicit.

7. **Consolidate report.** Aggregate all stage outputs into a single workflow report. For each stage, record: status (completed, unavailable-with-compensating-analysis, blocked), artifact count, and unresolved risk count. Compute the overall workflow status: `passed` if all stages completed or compensated, `passed-with-unresolved` if any stage has unresolved risks, `blocked` if any stage could not proceed or compensate.
   Done when: all five stages have truthful status, artifact count, and unresolved-risk count, and the overall status follows the stated precedence exactly.

## Failure and recovery

### Input and stage availability
- Input validation failure: report `blocked: no contract source` and halt. No artifacts written.
- Stage tool unavailable: mark the stage `unavailable`, perform compensating analysis within the stage scope, and document what it cannot cover. Continue to the next stage.

### Result integrity
- Stage produces no findings: record zero findings as a valid result. Do not re-run with widened scope.
- Partial completion: preserve all completed stage artifacts. The consolidated report reflects actual stage statuses. Never mark a stage completed if it was skipped or blocked.
- Non-convergence: if a stage loops without stable output, such as fuzzing finding and fixing the same property repeatedly, stop after three iterations, record the oscillation, and mark the stage `non-converged`.

## Output

Output contract: Return the consolidated Markdown status report first, then documented properties, generated tests and raw tool outputs, manual-review notes, deployment checks, and visualizations; order stages 1–5 and findings by severity.
