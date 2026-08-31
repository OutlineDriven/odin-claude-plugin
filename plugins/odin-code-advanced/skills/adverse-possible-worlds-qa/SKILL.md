---
name: adverse-possible-worlds-qa
description: 'Use when the user wants to test extreme worlds to raise product completeness rather than collect green checks. Returns extreme-world test cases and a completeness-gap report. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Adverse possible worlds QA

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to test extreme worlds to raise product completeness, not to collect green checks. |
| Authority | Write only named local artifacts (extreme-world test cases and a completeness-gap report); rollback by deleting those files. No source mutation. |
| Side effect | Extreme-world test cases and completeness findings written to the local working tree. |
| Done | Extreme worlds are tested and completeness gaps are identified; report returned. |

## Inputs

- The product surface under test: a named code path, module, feature, or system boundary. Must be supplied.
- Completeness criteria the surface must satisfy: stated invariants, contracts, or acceptable behaviors. Optional; when absent, minimal criteria are derived from the surface's own stated invariants, and if none exist completeness is reported undefined.
- World budget: a limit on how many extreme worlds to enumerate. Optional; when absent, enumerate until every distinct extreme dimension of the surface is represented once.

## Procedure

1. Bound scope: name the product surface and the completeness criteria. Refuse to widen to unrelated surfaces. If the surface cannot be bounded to a single coherent target, stop and report the boundary ambiguity. Done when: the product surface and completeness criteria are named.
2. Enumerate extreme worlds for the named surface. Derive concrete, falsifiable conditions across each extreme dimension the surface exposes: maximum and minimum inputs, empty and singleton sets, concurrent saturation, resource exhaustion, clock and ordering extremes, configuration edges, and any invariant the surface claims to hold. Each world is a specific condition, not a generic stress label. Done when: concrete falsifiable conditions are derived for each extreme dimension.
3. For each world, construct a concrete test case that exercises the surface under that condition. Write the test cases to the local working tree. Done when: test cases are written for each world.
4. Run or trace each test case against the product. Record the observed behavior as one of: handled, degraded, undefined, or absent. Done when: observed behavior is recorded for each test case.
5. Classify each result as a completeness gap only when the surface fails to meet a stated completeness criterion under that world. A passing test is recorded as covered, not as success evidence. A deliberate limit is not a gap unless it violates a stated criterion. The goal is gap discovery, not green-check collection. Done when: each result is classified as covered or gap against a stated criterion.
6. If a test case cannot be constructed for a world, record that world as untestable with the specific blocker. Do not skip it silently. Done when: untestable worlds are recorded with their blocker.
7. Compile the completeness-gap report: each entry names the world, the observed behavior, the violated criterion or blocker, and the test-case file path. Done when: each entry names the world, behavior, violated criterion or blocker, and test-case file path.

## Failure and recovery
- Surface too broad to bound: stop and report the boundary ambiguity. Do not invent a narrower surface.
- No completeness criteria and no derivable invariants: report that completeness is undefined for the surface and stop. Do not fabricate criteria.
- Test case unconstructable for a world: record the world as untestable with the blocker. Continue with remaining worlds.
- Partial results: return every enumerated world and its classification, including untestable ones. Never report done while worlds remain unclassified.
- Rollback: delete the written test-case and report files. No source, VCS, credential, or remote mutation occurs, so no further recovery is needed.

## Output
- A set of extreme-world test-case files in the local working tree.
- A completeness-gap report listing each enumerated world with its classification (covered, gap, untestable), the observed behavior, the violated criterion or blocker, and the test-case file path.
