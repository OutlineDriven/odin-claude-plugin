---
name: trailmark-finding-triage
description: 'Use when exactly one concrete finding, SARIF result, weAudit annotation, suspicious function, or report excerpt with a bindable source anchor needs prioritization before PoC work. A Promote, Needs manual review, Deprioritize, or Blocked verdict is emitted with binding, reachability, boundaries, blast radius, manual review targets, and limitations. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Trailmark finding triage

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Exactly one concrete finding, SARIF result, weAudit annotation, suspicious function, or report excerpt has a bindable source anchor and needs prioritization before PoC work. |
| Authority | Reversible local writes only; state the rollback path before writing. |
| Side effect | A single-candidate evidence packet and optional Trailmark annotations. |
| Done | One Promote, Needs manual review, Deprioritize, or Blocked verdict is emitted with binding, reachability, boundaries, blast radius, manual review targets, and limitations. |

## Inputs

- **Required**: One finding with a bindable source anchor: a SARIF result, weAudit annotation, suspicious function name, or report excerpt that resolves to a file and line range in the working tree.
- **Optional**: Existing Trailmark annotations on the target function or file; existing graph evidence from prior runs.

## Procedure

1. **Normalize the input.** Extract the source anchor (file path, line range, function name) from the finding. If the anchor cannot be resolved to a concrete location in the working tree, emit `Blocked` with reason `unresolvable-anchor` and stop.
2. **Bound the scope.** Identify the single function, method, or code block that contains the anchor. Do not expand beyond the containing scope unless the finding explicitly references cross-boundary behavior such as taint flow or call chain.
3. **Collect binding evidence.** Read the anchored source. Record the exact code at the anchor, the function signature, the containing module or class, and any direct callers or callees visible in the same file.
4. **Assess reachability.** Determine whether the anchored code is reachable from external input — public API, request handler, CLI entry, exported function — or is internal-only. Record the reachability path or mark `internal-only`.
5. **Identify boundaries.** List trust boundaries the finding crosses: input validation, authentication, authorization, serialization, file I/O, network I/O, or privilege transitions. Record each boundary and whether the finding's path crosses it.
6. **Estimate blast radius.** Classify the blast radius as `function`, `module`, `service`, or `system` based on the scope of code affected if the finding is confirmed as a vulnerability. Record the classification and the reasoning.
7. **Identify manual review targets.** List any code paths, configurations, or dependencies that require human judgment to confirm or dismiss the finding. Record each target with the specific question the reviewer must answer.
8. **Record limitations.** List any assumptions, missing context, or analysis boundaries that constrain the verdict: code not read, dynamic behavior not observed, dependencies not traced.
9. **Emit the verdict.** Select exactly one:
   - **Promote**: Strong binding, clear reachability, defined boundaries, plausible attack surface. Proceed to PoC work.
   - **Needs manual review**: Partial evidence requires human judgment on one or more manual review targets before PoC work.
   - **Deprioritize**: Weak binding, unreachable code, or negligible blast radius. Document the reasoning and stop.
   - **Blocked**: Cannot be triaged due to unresolvable anchors, missing context, or analysis limitations. Document the blocker and stop.

## Failure and recovery
- **Unresolvable anchor**: The source anchor does not resolve to a file or line range in the working tree. Emit `Blocked` with reason `unresolvable-anchor`. Do not guess or widen the search.
- **Ambiguous finding**: Multiple candidate anchors match the input. Emit `Blocked` with reason `ambiguous-anchor` and list all candidates. Do not select one without human input.
- **Missing evidence**: The anchored code is present but required context — callers, callees, configuration — is unavailable. Record the gap in limitations. If the gap prevents a verdict, emit `Blocked` with reason `insufficient-evidence`.
- **Partial result**: If the procedure is interrupted after step 3, emit the evidence collected so far with verdict `Needs manual review` and reason `incomplete-analysis`.
- **Rollback**: All writes target a local evidence packet file. To roll back, delete the packet file. Trailmark annotations are optional and independently removable.

## Output
A single evidence packet containing:
- **Verdict**: One of `Promote`, `Needs manual review`, `Deprioritize`, `Blocked`.
- **Binding**: Source anchor, file path, line range, function name.
- **Reachability**: Path from external input to the anchored code, or `internal-only`.
- **Boundaries**: Each trust boundary crossed with crossing status.
- **Blast radius**: Classification (`function`, `module`, `service`, `system`) with reasoning.
- **Manual review targets**: Each target with the specific question for the reviewer.
- **Limitations**: Assumptions, missing context, and analysis boundaries.

## Provenance

Adapted from Trail of Bits trailmark-finding-triage skill.
- Origin: https://github.com/trailofbits/skills
- Revision: d1f1575cff97816e5cc08af66cd2506099c681d3
- License: CC-BY-SA-4.0; source https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3; preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding.
- Adaptation: Clean-room rewrite for ODIN 2.0 module odin-code-advanced. Procedure derived from source mechanisms (input normalization, output format, query recipes). No third-party expression copied.
