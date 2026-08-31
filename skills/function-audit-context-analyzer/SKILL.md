---
name: function-audit-context-analyzer
description: 'Use when an orchestrator or user requests deep audit-context analysis of exactly one function, especially a dense function, data-flow chain, cryptographic routine, or state machine. The skill writes a fixed-format prose analysis to the given path and returns a compact record that indexes invariants, assumptions, callees, and open questions. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Function audit context analyzer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An orchestrator or user requests deep audit-context analysis of exactly one function, especially a dense function, data-flow chain, cryptographic routine, or state machine. |
| Authority | Write only the caller-specified per-function analysis path. Roll back by deleting that one file; no other file, VCS, credential, or remote target is touched. |
| Side effect | One local file at the caller-specified per-function analysis path. |
| Done | The prose follows the fixed format, every structural claim cites source lines or is an open question, every assumption names what establishes it or says nothing found, and the compact record indexes the result. |

## Inputs

Required: the target function (name and file path with line range) and the per-function analysis path to write.

Optional: the source tree root for reading callees. When a callee's source is not available, treat it as a black box per the procedure.

## Procedure

1. Read the target function in full. Scope is exactly one function — structure, invariants, and assumptions are in scope; vulnerabilities, fixes, exploits, and severity ratings are not. If the draft would use "vulnerability", "exploit", or "severity", restate the observation as the structural fact it rests on.

2. Read every callee the function depends on. Walk every path through each callee, not only the one that returns successfully. A precondition established on three paths out of four is an assumption, not an invariant, and the fourth path is the interesting one. Look for an output parameter left unwritten on an early return, a check that sits behind a conditional, and a loop that can exit before it validates.

3. When a callee's source is not available, treat it as adversarial. Record what is sent to it, what is assumed about it, and the outcomes not excluded: failure, a hostile return value, an unexpected state change, re-entry into the caller before its own writes land.

4. For every assumption, name the line that establishes it. When nothing establishes it, write "nothing found" — that is a finding, not a failure.

5. Cite a line for every structural claim. If one cannot be pointed at, do not assert it — put it in open questions as "unclear; need to inspect X". Never infer behavior from a name. When new evidence contradicts something written earlier, correct it in place and say what changed. Cut hedge words: "probably", "seems to", and "should be" each resolve to either a cited claim or an open question.

6. Write the prose analysis to the given path using this fixed format, one document per function, sections in this order separated by `---`:

   - Header: `## functionName in path/to/file.ext (L40-L88)`
   - **Purpose:** its role in the system and what breaks without it.
   - **Inputs & Assumptions:** each parameter with type, trust level (untrusted, semi-trusted, trusted), implicit inputs (state read, caller identity, environment, clock), and preconditions with what establishes each.
   - **Outputs & Effects:** returns, state writes, events or messages, external interactions, postconditions.
   - **Block-by-Block:** each code block labeled with language and line range, followed by What, Why here, Assumes, Establishes, and Depended on by.
   - **Cross-Function Dependencies:** each callee labeled internal, external-source-available, or external-black-box with what the function depends on it to establish and on which paths; callers and what they assume; shared state; invariant couplings.
   - **Open Questions:** each as "unclear; need to inspect X".

   Cite lines as `L45` or `L98-L102`. Spend words where the code earns them — branches, external calls, and state mutations earn analysis; a three-line block that copies a value earns three lines. Leave a section out only when it is genuinely empty, and say so ("No external calls.") so "none" is distinguishable from "never checked". There is no minimum count of invariants or assumptions; a short record whose claims each cite a line is worth more than a long one padded to fill a template.

7. Adapt the four orientation questions to the target domain. For smart contracts, the entry point is an external or public function, actors are caller, owner, relayer, oracle, and other protocols, persistent state is storage slots, and a black box is an address whose code is not in the project — record calldata sent and outcomes not excluded (revert, hostile return value, re-entry before state writes land), and watch for `unchecked` blocks and assembly that suspend guarantees. For C or C++ source, bounds, lifetimes, and integer width carry the invariants; record pointer ownership and lifetime, and note which calls are behind `#ifdef`. For decompiled binaries or firmware, function boundaries are themselves a finding — say which entry points were identified, how, and what was left unattributed; go top-down from task entry points; most callees are black boxes and that is normal. For web services, logic and authorization carry more weight than memory safety; the trust boundary is usually a middleware chain, so record where the check actually lives and whether every registered route gets it; concurrency over the same row without a transaction is coupling that belongs in shared state.

8. Return the compact record — a short index into the prose, not a summary of it. It holds the invariants, the assumptions and what establishes each, the callees and what the caller depends on them for, and the open questions. It exists so the orchestrator never has to load the prose.

## Failure and recovery
- **Callee source missing:** treat the callee as a black box per step 3. This is a complete analysis, not a failure.
- **Function not found or line range wrong:** stop. Do not write the analysis file. Report the mismatch and what was searched.
- **Contradiction found mid-analysis:** correct the earlier claim in place and say what changed; do not leave both the old and new claim standing.
- **Partial result:** the prose file is written only when the done predicate holds. If it cannot, report what is missing as open questions inside the file, or if the function itself is wrong, do not write at all.
- **Rollback:** delete the single analysis file. No other artifact exists.

Finishing with open questions is a complete analysis. Finishing with open questions that were never written down is not.

## Output
Two artifacts: the prose analysis at the given path (the deliverable) and the compact record returned to the caller (an index into it). The prose covers how the code is put together, what must always be true for it to work, and what it takes on faith. It does not name vulnerabilities, suggest fixes, write exploits, or rate severity.

## Provenance

Origin: https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3, file /plugins/audit-context-building/agents/function-analyzer.md with format and domain notes from /plugins/audit-context-building/skills/audit-context-building/resources/. License: CC-BY-SA-4.0. Preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding. Adapted clean-room: the per-function dispatch, fixed write-up format, callee-path-walking mechanism, "nothing found" convention, and grounding rules are preserved; the multi-function orchestration workflow, plugin packaging, and cross-file resource pointers were removed to make the skill self-contained.
