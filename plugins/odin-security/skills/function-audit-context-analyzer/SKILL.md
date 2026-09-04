---
name: function-audit-context-analyzer
description: 'Use when asked for audit-context analysis of one function, or to build audit context across codebase before vulnerability hunting. Local write only. Not for vulnerability finding or severity rating.'
---

# Function audit context analyzer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An orchestrator or user requests deep audit-context analysis of exactly one function, or begins an audit, threat model, or architecture review of unfamiliar code spanning multiple functions before vulnerability hunting. |
| Authority | Reversible local: writes only the caller-specified analysis path (single function) or beneath `audit-context/` (multi-function); rollback is deleting those files. No remote mutation. |
| Side effect | One local file at the caller-specified path (single function), or `audit-context/DOSSIER.md` plus per-function files under `audit-context/functions/` (multi-function). |
| Done | The prose follows the fixed format, every structural claim cites source lines or is an open question, every assumption names what establishes it or says nothing found, and the compact record or dossier indexes the result. |

## Not for

- Vulnerability finding, exploit writing, or severity rating. Use a security-review skill.
- Remote, credential, publish, deploy, or irreversible changes.

## Inputs

Single-function mode. Required: the target function (name and file path with line range) and the per-function analysis path to write. Optional: the source tree root for reading callees. When a callee's source is not available, treat it as a black box per the procedure.

Multi-function mode. Required: a target path (codebase root, or a set of functions or files to analyze). The target must span more than one function; a single function uses single-function mode. Optional: domain or language hints (smart contract, C/C++, decompiled firmware, web service) to decide what counts as a call whose interior cannot be seen. Optional: prior findings or orienting notes, carried forward as context only; this skill produces no verdicts.

No vulnerability names, fixes, proofs-of-concept, or severity ratings are inputs or outputs. Those belong to the hunting phase that runs after this one.

## Procedure

### Shared method

Both modes follow the same core method: read the code, walk every callee path, cite lines for every claim, state invariants and assumptions, and record what is unclear. The difference is scope and output shape.

1. Read the target function in full. Scope is structure, invariants, and assumptions; vulnerabilities, fixes, exploits, and severity ratings are not. If the draft would use "vulnerability", "exploit", or "severity", restate the observation as the structural fact it rests on. Done when: the function is read and the scope boundary is stated.

2. Read every callee the function depends on. Walk every path through each callee, not only the one that returns successfully. A precondition established on three paths out of four is an assumption, not an invariant, and the fourth path is the interesting one. Look for an output parameter left unwritten on an early return, a check that sits behind a conditional, and a loop that can exit before it validates. Done when: every callee is read and every path is walked.

3. When a callee's source is not available, treat it as adversarial. Record what is sent to it, what is assumed about it, and the outcomes not excluded: failure, a hostile return value, an unexpected state change, re-entry into the caller before its own writes land. Done when: the black-box callee is recorded with sent data, assumptions, and unexcluded outcomes.

4. For every assumption, name the line that establishes it. When nothing establishes it, write "nothing found". That is a finding, not a failure. Done when: every assumption has its establishing line or "nothing found".

5. Cite a line for every structural claim. If no line can be cited, do not assert the claim. Record it in open questions as "unclear; need to inspect X". Never infer behavior from a name. When new evidence contradicts something written earlier, correct it in place and say what changed. Cut hedge words: "probably", "seems to", and "should be" each resolve to either a cited claim or an open question. Done when: every structural claim cites a line or is in open questions; no hedge words remain.

6. When two records disagree, quote both instead of reconciling them. Record the disagreement as a fact about the code, not a flaw in the analysis. Done when: disagreements are quoted from both sides.

7. Adapt the orientation to the target domain. See `references/domain-adaptations.md` for smart-contract, C/C++, decompiled-binary, and web-service domain mappings. Done when: the domain adaptation is applied and recorded.

### Single-function output

Write the prose analysis to the given path using this fixed format, one document per function, sections in this order separated by `---`:

- Header: `## functionName in path/to/file.ext (L40-L88)`
- Purpose: its role in the system and what breaks without it.
- Inputs and assumptions: each parameter with type, trust level (untrusted, semi-trusted, trusted), implicit inputs (state read, caller identity, environment, clock), and preconditions with what establishes each.
- Outputs and effects: returns, state writes, events or messages, external interactions, postconditions.
- Block-by-block: each code block labeled with language and line range, followed by What, Why here, Assumes, Establishes, and Depended on by.
- Cross-function dependencies: each callee labeled internal, external-source-available, or external-black-box with what the function depends on it to establish and on which paths; callers and what they assume; shared state; invariant couplings.
- Open questions: each as "unclear; need to inspect X".

Cite lines as `L45` or `L98-L102`. Spend words where the code earns them: branches, external calls, and state mutations earn analysis; a three-line block that copies a value earns three lines. Leave a section out only when it is genuinely empty, and say so ("No external calls.") so "none" is distinguishable from "never checked". There is no minimum count of invariants or assumptions; a short record whose claims each cite a line is worth more than a long one padded to fill a template. Done when: the prose file is written at the given path with all sections in order.

Return the compact record: a short index into the prose, not a summary of it. It holds the invariants, the assumptions and what establishes each, the callees and what the caller depends on them for, and the open questions. It exists so the orchestrator never has to load the prose. Done when: the compact record is returned.

### Multi-function output

1. Bound scope. Confirm the target path is readable. Create `audit-context/` and `audit-context/functions/`. Write nowhere else; edit, delete, or move no source. Done when: `audit-context/` and `audit-context/functions/` are created and no source is edited.

2. Orient. Read entry points, module boundaries, and the call graph. Identify the actors (callers and privilege boundaries), the persistent state (storage, globals, caches, files), and the full list of functions in scope. Record the function list and entry points in the dossier skeleton. Done when: actors, persistent state, and the full function list are recorded.

3. Analyze each function in an isolated pass and write its record to `audit-context/functions/<name>.md` before starting the next. Dispatch each function's pass to a subagent to isolate its context. Do not hold every function's details in a single context; only compact records return to the orchestrator. In each function record, state: what must always be true (with the source line that shows it), what the function takes on faith (with whatever establishes it), which functions it calls and what it needs from each, and anything still unclear. Done when: each function's record is written before the next starts.

4. Assemble `audit-context/DOSSIER.md` from the per-function records: entry points; actors and who can reach what; persistent state; cross-function invariants (rules spanning several functions); unenforced assumptions marked `nothing found`; disagreements with both sides quoted; coverage (which functions were analyzed and which paths were followed); and open questions carried forward. Done when: the dossier contains entry points, actors, state, invariants, assumptions, disagreements, coverage, and open questions.

5. Do not name vulnerabilities, suggest fixes, write proofs-of-concept, or rate severity. When the code counts on something that nothing checks, record that fact and move on. Done when: no vulnerabilities, fixes, POCs, or severity ratings are produced.

## Failure and recovery

- Callee source missing: treat the callee as a black box per step 3 of the shared method. This is a complete analysis, not a failure.
- Function not found or line range wrong: stop. Do not write the analysis file. Report the mismatch and what was searched.
- Target not found or unreadable (multi-function): stop, report the path and the error, and write no dossier.
- Contradiction found mid-analysis: correct the earlier claim in place and say what changed; do not leave both the old and new claim standing.
- Partial result (single function): the prose file is written only when the done predicate holds. If it cannot, report what is missing as open questions inside the file, or if the function itself is wrong, do not write at all.
- Partial result (multi-function): a dossier covering N of M functions is valid only if the uncovered functions are listed under coverage with the reason. Otherwise the run is blocked.
- Rollback: delete the single analysis file or the `audit-context/` directory. No other artifact exists.

Finishing with open questions is a complete analysis. Finishing with open questions that were never written down is not.

## Output

Single-function mode: the prose analysis at the given path (the deliverable) and the compact record returned to the caller (an index into it). Multi-function mode: `audit-context/DOSSIER.md` plus one file per analyzed function under `audit-context/functions/`. Both cover how the code is put together, what must always be true for it to work, and what it takes on faith. Neither names vulnerabilities, suggests fixes, writes exploits, or rates severity.
