---
name: improve-codebase-architecture
description: 'Use when asked to survey or improve codebase architecture, identify agent-hostile shallow modules and return a ranked deepening candidates report without performing any refactor. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Improve codebase architecture

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Survey architecture for agent-hostile shallow modules. |
| Authority | Reversible-local: write only named local artifacts; rollback by deleting the written artifact. |
| Side effect | Temporary self-contained report; optional ADR for a load-bearing rejection. |
| Done | Ranked deepening candidates and one chosen candidate; no refactor performed. |

## Inputs

- **Codebase** (required): the repository to survey.
- **Scope** (optional): a directory, module, or file subset to limit the survey.
- **Previous report** (optional): a prior report to compare against.

## Procedure

1. **Validate scope.** If scope is supplied, confirm each path exists in the codebase. Reject any path that does not exist.
2. **Enumerate module surfaces.** Scan the codebase (or the scoped subset). Identify every public module: directories with an index or entry point, packages, or namespaces that expose types and functions consumed by other modules.
3. **Assess depth.** For each public module, evaluate its depth using these indicators:
   - Number of distinct types, functions, and constants in the public surface.
   - Presence of internal abstractions: private types, helper modules, or sub-namespaces that hold logic separate from the entry point.
   - Coupling: does the public surface delegate to other modules or contain all logic inline?
   - Width: does the module expose many unrelated responsibilities on its public surface?
4. **Identify shallow modules.** Flag modules that have a broad public surface with few internal abstractions, where logic lives directly on the public surface and is not decomposed into internal seams.
5. **Rank deepening candidates.** Order the shallow modules by a two-axis score:
   - **Refactoring effort**: how many call sites or dependents would need to change.
   - **Architectural gain**: how much internal depth the module would gain from decomposition.
   Higher gain and lower effort ranks higher.
6. **Select top candidate.** Pick the highest-ranked module as the primary deepening candidate.
7. **Write report.** Produce a self-contained report containing:
   - A ranked list of all shallow modules with their effort and gain scores.
   - The top candidate with a one-paragraph rationale for why it ranks first.
   - A brief note on what internal seams the top candidate would need to expose.
   - If the top candidate cannot be deepened without breaking a hard invariant or triggering a cascade, note this as a load-bearing rejection.
8. **Return the report.** Do not modify any source code. Do not create branches or commits.

## Failure and recovery
- **Empty codebase:** return the report with an empty candidates list and a note that no modules were found.
- **Scope path missing:** stop and return the report with a note that the supplied scope path does not exist.
- **Partial survey failure:** if one directory or module cannot be read, continue the survey of the remainder and note the unreadable module in the report.
- **No shallow modules found:** return the report noting zero candidates with a one-paragraph statement that the codebase does not exhibit shallow-module patterns at the scoped level.
- **Rollback:** if the report file was written to disk during execution, delete it before returning. The only acceptable on-disk artifact is the optional ADR.

## Output
A self-contained report returned as terminal text. The report contains:
- Ranked deepening candidates list with effort and gain scores.
- One chosen candidate with rationale.
- Internal seam notes for the chosen candidate.
- Optional load-bearing rejection note.

No refactoring is performed. No source files are modified. No branches or commits are created.

## Provenance

Origin: mattpocock/skills (https://github.com/mattpocock/skills).
Pinned revision: 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76.
License: MIT (Copyright (c) 2026 Matt Pocock).
Adaptation: ADAPT into odin-code-advanced: read-only survey producing ranked deepening candidates and one chosen candidate; no refactor performed. Authority narrowed to reversible-local. Report output normalized to terminal text with optional local file. HTML-REPORT.md support path not carried forward (expected_files specifies only SKILL.md and agents/openai.yaml).
