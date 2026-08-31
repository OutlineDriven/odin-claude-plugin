---
name: audit-context-building
description: 'Use when starting an audit, threat model, or architecture review on unfamiliar code spanning a codebase or multiple functions, before any vulnerability-hunting pass. Produces a dossier and per-function records capturing entry points, actors, persistent state, cross-function invariants, unenforced assumptions, disagreements, coverage, and open questions with source locations. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Audit context building

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user begins an audit, threat model, or architecture review of unfamiliar code, or needs system context before vulnerability hunting; the target spans a codebase or multiple functions. |
| Authority | Reversible-local: read source freely; write only beneath `audit-context/`; no VCS, credential, remote, published, or deployed mutation. |
| Side effect | `audit-context/DOSSIER.md` and per-function analysis files beneath `audit-context/functions/`. |
| Done | The target's entry points, actors, persistent state, cross-function invariants, unenforced assumptions, disagreements, coverage, and open questions are recorded with source locations. |

## Inputs

- Target path (required): a codebase root, or a set of functions or files to analyze. The target must span more than one function; a single function is out of scope here.
- Domain or language hints (optional): smart contract, C/C++, decompiled firmware, web service, or other — used only to decide what counts as a call whose interior cannot be seen.
- Prior findings or orienting notes (optional): carried forward as context only; this skill produces no verdicts.

No vulnerability names, fixes, proofs-of-concept, or severity ratings are inputs or outputs. Those belong to the hunting phase that runs after this one.

## Procedure

1. Bound scope. Confirm the target path is readable. Create `audit-context/` and `audit-context/functions/`. Write nowhere else; edit, delete, or move no source.
2. Orient. Read entry points, module boundaries, and the call graph. Identify the actors (callers and privilege boundaries), the persistent state (storage, globals, caches, files), and the full list of functions in scope. Record the function list and entry points in the dossier skeleton.
3. Analyze each function in an isolated pass and write its record to `audit-context/functions/<name>.md` before starting the next. Dispatching a function's pass to a subagent is how context-isolation is achieved: no single context must hold every function's detail, and only compact records return to the orchestrator.
4. In each function record, state: what must always be true (with the source line that shows it), what the function takes on faith (with whatever establishes it), which functions it calls and what it needs from each, and anything still unclear.
5. Follow the calls. For every call the function depends on, read the called function and follow every path through it, not only the succeeding path. State what makes each assumption true. When nothing in the code makes it true, write `nothing found` and cite no line — that absence is the record.
6. Every claim cites a source location (`file:line`) or becomes an open question. No claim stands without a location, and no unclear point is closed with a confident answer.
7. Where two records disagree, quote both rather than reconcile. Record the disagreement as a fact about the code, not a flaw in the analysis.
8. Assemble `audit-context/DOSSIER.md` from the per-function records: entry points; actors and who can reach what; persistent state; cross-function invariants (rules spanning several functions); unenforced assumptions marked `nothing found`; disagreements with both sides quoted; coverage (which functions were analyzed and which paths were followed); and open questions carried forward.
9. Do not name vulnerabilities, suggest fixes, write proofs-of-concept, or rate severity. When the code counts on something and nothing checks it, record that plainly and move on.

## Failure and recovery
- Target not found or unreadable: stop, report the path and the error, and write no dossier.
- A function's source is unavailable (decompiled, binary, or external): record what is visible, mark the rest as open questions, and note the limit. Do not infer internals.
- A claim cannot be located: convert it to an open question rather than fabricate a location.
- Partial-result rule: a dossier covering N of M functions is valid only if the uncovered functions are listed under coverage with the reason. Otherwise the run is blocked.
- Non-mutation: never edit source or write outside `audit-context/`. On any failure, leave existing `audit-context/` files intact; the run restarts by re-running the affected function's pass.
- Blocked or non-converged result: report which functions lack records and which open questions remain unresolved. Do not declare the done predicate satisfied.

## Output
`audit-context/DOSSIER.md` plus one file per analyzed function under `audit-context/functions/`. The dossier records entry points, actors, persistent state, cross-function invariants, unenforced assumptions (`nothing found`), disagreements (both sides quoted), coverage, and open questions, each with source locations where a location exists. It contains no severity ratings, fixes, vulnerability names, or proofs-of-concept.

## Provenance

Origin: Trail of Bits skills plugin `audit-context-building`, https://github.com/trailofbits/skills, revision `d1f1575cff97816e5cc08af66cd2506099c681d3`. License: CC-BY-SA-4.0; source https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3; preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse `trail-of-bits-mark.svg` as branding. Adaptation: procedural restatement preserving the multi-function orchestration, context-isolation, and dossier end state; modifications marked; no Trail of Bits expression copied verbatim and no trademark or branding reused.
