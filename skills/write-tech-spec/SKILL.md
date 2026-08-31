---
name: write-tech-spec
description: 'Use when a user asks for a tech spec or architecture doc. Produces a self-contained TECH.md that translates intent into an executable implementation plan. Not for PRDs — use write-prd; not for product specs with behavioral invariants — use write-product-spec.'
---

# Write tech spec

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for a tech spec or architecture doc. |
| Authority | Reversible-local: write only TECH.md in the working directory; rollback by deleting the file. |
| Side effect | Writes TECH.md. |
| Done | Spec translates intent into an executable implementation plan. |

## Inputs

1. **Intent** (required): the feature, change, or system to specify. Supplied as a description, issue, or conversation summary.
2. **Codebase context** (optional): existing files, modules, or architecture the spec must integrate with. If absent, the procedure scopes to the stated intent only.

## Procedure

1. Extract the core objective from the intent. Restate it as a single sentence at the top of the spec. Done when: the objective is restated as a single sentence.
2. Identify constraints: performance, compatibility, security, timeline, or scope boundaries stated or implied by the user. Done when: all stated or implied constraints are recorded.
3. Survey the codebase for relevant modules, interfaces, data flows, and existing patterns. Record only what the spec references. Done when: every referenced module, interface, data flow, and pattern is recorded with its file path.
4. Draft the spec with these sections in order: Objective (one-sentence goal), Background (minimal context needed to understand the plan), Design (architecture, data flow, component responsibilities, and interface contracts), Implementation plan (ordered steps with file paths, function signatures, or module names, each concrete enough for an engineer to execute without guessing), Risks and mitigations (named risks with proposed mitigations or explicit acceptance), Open questions (unresolved items that block implementation, each with the information needed to resolve it). Done when: all sections are drafted with concrete content and no placeholders, TODOs, or deferred sections.
5. Validate every implementation step against the codebase: confirm referenced paths, types, and interfaces exist or are explicitly created by a prior step. Done when: every implementation step is validated against the codebase.
6. Write the completed spec to `TECH.md` in the working directory. Done when: TECH.md is written to the working directory.

## Failure and recovery
| Failure class | Detection | Response |
|---|---|---|
| Missing context | Intent is ambiguous or under-specified | Stop. List the specific questions that must be answered before the spec can proceed. Do not guess. |
| Conflicting requirements | Two or more constraints are mutually exclusive | Stop. Name the conflict and present the trade-off. Await user resolution. |
| Scope creep | Spec would exceed the stated intent | Bound scope to the original ask. Note out-of-scope items in Open questions. |
| Technical uncertainty | A design decision depends on unknown behavior | Record the assumption explicitly in the spec. Flag it in Open questions with the test or investigation needed to confirm. |

Partial result: if the spec is partially drafted when a failure is detected, do not write TECH.md. Return the partial draft and the blocking issue.
Rollback: delete `TECH.md` to undo the side effect.

## Output
`TECH.md` in the working directory — sections in order: Objective, Background, Design, Implementation plan, Risks and mitigations, Open questions; no placeholders, TODOs, or deferred sections.
