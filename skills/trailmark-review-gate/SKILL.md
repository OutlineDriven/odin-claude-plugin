---
name: trailmark-review-gate
description: 'Run a Trailmark graph-regression gate over a branch, PR, or ref range and emit PASS, WARN, FAIL, or UNKNOWN. Not for one-finding triage — use trailmark-finding-triage; not for snapshot analysis — use trailmark-structural.'
---

# Trailmark review gate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A branch, PR, fix commit, release, or ref range needs deterministic graph-level regression checks alongside line review. |
| Authority | Reversible local writes only: write only the review packet and temporary worktrees; rollback via VCS. |
| Side effect | A PASS, WARN, FAIL, or UNKNOWN structural review packet; graph comparison may use temporary worktrees. |
| Done | Every fired rule cites exact changed nodes, edges, paths, or metric deltas; inadequate graph evidence yields UNKNOWN, never PASS. |

## Inputs

Two git refs, a branch name, a commit range, or before/after directories. The before and after snapshots must each resolve to a Trailmark graph. Optional: repository-local threshold overrides stricter than the defaults.

## Refusals

- Will not report PASS when graph evidence is inadequate — emit UNKNOWN instead.
- Will not infer graph state from the line diff.
- Will not mutate the user's working branch while comparing refs.
- Will not claim PASS means the change is secure — it means no configured graph rule fired.

## Procedure

1. Resolve before/after inputs from the supplied refs, branch, commit range, or directories. Do not check out branches unnecessarily; prefer `git diff`, `git show`, and git worktrees. Never mutate the user's working branch while comparing refs. **Done when:** before and after inputs are resolved.
2. Build graph-evolution evidence by running before/after Trailmark graph analysis. Both snapshots must run `engine.preanalysis()` so taint, privilege-boundary, blast-radius, complexity, and entrypoint signals are available. Record the Trailmark version and feature probes. If graph construction fails, emit `UNKNOWN`. **Done when:** both graphs are built with preanalysis, or UNKNOWN is emitted.
3. Normalize the structural changes into: added, removed, and modified nodes; added and removed edges; entrypoint set changes; taint membership changes; privilege-boundary membership changes; blast-radius changes; complexity changes; newly reachable sensitive sinks; and unresolved, proxy, or dynamic edge changes. **Done when:** all structural change categories are normalized.
4. Apply the gate rules. Each triggered rule creates a review obligation; it does not prove a vulnerability. Rules: new untrusted entrypoint (FAIL — expands external attack surface); new path from untrusted entrypoint to sensitive sink (FAIL — creates a candidate exploit path); removed auth, validation, or sanitization call on reachable path (FAIL — common regression in fixes and feature PRs); newly tainted privilege-boundary node (FAIL — trust transition now handles untrusted data); blast radius growth above threshold (WARN — a bug may now affect more code); complexity growth on tainted or boundary node (WARN — risky logic became harder to review); new unresolved, proxy, or dynamic call on reachable path (WARN — graph uncertainty increased in a risky area); dead security function removed (WARN — may be cleanup or accidental security removal). Default thresholds, superseded by stricter local rules when present: blast radius growth `+5` downstream reachable nodes or `+25%`, whichever is larger; complexity growth cyclomatic `+3` on a tainted, boundary, or entrypoint-reachable node; sensitive sink path, any new path from an untrusted entrypoint to a sink; unresolved or proxy growth, any new unresolved or proxy edge on an entrypoint-reachable path. Sensitive sink categories: value transfer; authorization or role decisions; persistence or state writes; parsing or deserialization; cryptographic keys, sessions, or signatures; external process, network, or file operations; upgrade, plugin, hook, or dynamic dispatch mechanisms. **Done when:** every gate rule is evaluated and triggered rules are recorded.
5. Compute the verdict by precedence, most severe first: `UNKNOWN` if Trailmark cannot produce adequate evidence; `FAIL` if any fail rule triggers; `WARN` if any warn rule triggers; `PASS` only if evidence is adequate and no rule triggers. If both `UNKNOWN` and `FAIL` apply, emit `UNKNOWN` and list the suspected fail condition as a manual review target. **Done when:** the verdict is computed.
6. Emit the review packet. For each triggered rule include: the changed node or edge identifier; source file or symbol when available; entrypoint path when relevant; before/after metric when metric-based; and the manual review target. Add a limitations section when parser, proxy, unresolved-call, or dynamic-dispatch uncertainty affects the verdict. **Done when:** the review packet is emitted.
7. Hand the packet to the branch reviewer as supporting evidence for line-level review. Treat `PASS` as "no configured graph rule fired", not as approval. Do not use GitHub write actions unless the review process explicitly asks for them. **Done when:** the packet is handed off.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Trailmark graph construction fails | Emit `UNKNOWN`; never report `PASS`. Do not infer graph state from the line diff. |
| Inadequate parser, proxy, or dynamic-dispatch coverage | Emit `UNKNOWN` and list the suspected condition as a manual review target. Do not widen scope or invent evidence. |
| Both `UNKNOWN` and `FAIL` apply | Emit `UNKNOWN` and record the suspected fail condition. Reviewer inspects the named target manually. |
| Comparing refs would mutate the working branch | Stop; use worktrees or `git diff`/`git show`. VCS rollback if any mutation occurred. |

## Output

A Markdown review packet with verdict (PASS/WARN/FAIL/UNKNOWN), confidence, triggered rules table, structural changes table, entrypoint and reachability changes, privilege and taint changes, blast radius and complexity changes, limitations, and recommended reviewer actions — ordering: verdict, triggered rules, structural changes, entrypoint, privilege, blast radius, limitations, recommendations.
