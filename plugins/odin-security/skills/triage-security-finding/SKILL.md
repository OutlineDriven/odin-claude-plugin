---
name: triage-security-finding
description: 'Use when exactly one concrete security finding with a source anchor needs a verdict before PoC work. Not for projecting batches of findings onto a graph: use project-findings-onto-graph.'
---

# Triage a security finding

One finding, one verdict. This skill takes a single anchored finding and produces the evidence packet a PoC effort needs: where the anchor binds, whether external input reaches it, which trust boundaries sit on the path, how far a confirmed vulnerability would spread, what a human must still judge, and what the analysis could not see. Batch imports and review gates are different jobs; exactly one finding is triaged per invocation.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Exactly one concrete finding, SARIF result, reviewer annotation, suspicious function, or report excerpt has a bindable source anchor and needs prioritization before PoC work. |
| Authority | Reversible local: writes only a single-candidate evidence packet file and optional graph annotations on the target; rollback is deleting those artifacts. No remote mutation. |
| Side effect | A single-candidate evidence packet file and optional graph annotations on the target. |
| Done | One Promote, Needs manual review, Deprioritize, or Blocked verdict is emitted with binding, reachability, boundaries, blast radius, manual review targets, and limitations. |

## Inputs

- Required: One finding with a bindable source anchor: a SARIF result, reviewer annotation, suspicious function name, or report excerpt that resolves to a file and line range in the working tree.
- Optional: Existing graph annotations on the target function or file; graph evidence from prior runs.

## Refusals

- Will not triage more than one finding per invocation.
- Will not guess or widen the search when the anchor is unresolvable; emit Blocked.
- Will not select one anchor from multiple candidates without human input; emit Blocked.
- Will not promote a finding beyond its source status.

## Procedure

1. **Normalize the input.** Extract the source anchor (file path, line range, function name) from the finding. If the anchor cannot be resolved to a concrete location in the working tree, emit `Blocked` with reason `unresolvable-anchor` and stop. **Done when:** the source anchor is resolved to a file and line range.
2. **Bound the scope.** Identify the single function, method, or code block that contains the anchor. Do not expand beyond the containing scope unless the finding explicitly references cross-boundary behavior such as taint flow or a call chain. **Done when:** the containing scope is identified.
3. **Collect binding evidence.** Read the anchored source. Record the exact code at the anchor, the function signature, the containing module or class, and any direct callers or callees visible in the same file. **Done when:** binding evidence is recorded.
4. **Assess reachability.** Determine whether the anchored code is reachable from external input (public API, request handler, CLI entry, exported function) or is internal-only. Record the reachability path or mark `internal-only`. **Done when:** reachability is determined.
5. **Identify boundaries.** List the trust boundaries the finding crosses: input validation, authentication, authorization, serialization, file I/O, network I/O, privilege transitions. Record each boundary and whether the finding's path crosses it. **Done when:** every relevant boundary is listed with crossing status.
6. **Estimate blast radius.** Classify the blast radius as `function`, `module`, `service`, or `system` based on the scope of code affected if the finding is confirmed as a vulnerability. Record the classification and why. **Done when:** the blast radius is classified with reasoning.
7. **Identify manual review targets.** List any code paths, configurations, or dependencies that require human judgment to confirm or dismiss the finding. Record each target with the specific question the reviewer must answer. **Done when:** every manual review target is listed with its question.
8. **Record limitations.** List any assumptions, missing context, or analysis boundaries that constrain the verdict: code not read, dynamic behavior not observed, dependencies not traced. **Done when:** limitations are recorded.
9. **Emit the verdict.** Select exactly one: `Promote` (strong binding, clear reachability, defined boundaries, plausible attack surface; proceed to PoC work); `Needs manual review` (partial evidence requires human judgment on one or more manual review targets before PoC work); `Deprioritize` (weak binding, unreachable code, or negligible blast radius; document the reasoning and stop); `Blocked` (cannot be triaged due to unresolvable anchors, missing context, or analysis limitations; document the blocker and stop). **Done when:** exactly one verdict is emitted with its full evidence packet.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Unresolvable anchor | Emit `Blocked` with reason `unresolvable-anchor`. Do not guess or widen the search. |
| Ambiguous finding | Emit `Blocked` with reason `ambiguous-anchor` and list all candidates. Do not select one without human input. |
| Missing evidence | Record the gap in limitations. If the gap prevents a verdict, emit `Blocked` with reason `insufficient-evidence`. |
| Partial result | If interrupted after the binding-evidence step, emit the evidence collected so far with verdict `Needs manual review` and reason `incomplete-analysis`. |
| Rollback | All writes target the local evidence packet file; delete it to reverse. Graph annotations are optional and independently removable. |

## Output

A single evidence packet with verdict (Promote, Needs manual review, Deprioritize, or Blocked), binding (source anchor, file, line range, function), reachability, boundaries, blast radius, manual review targets, and limitations, ordered as verdict, binding, reachability, boundaries, blast radius, review targets, limitations.
