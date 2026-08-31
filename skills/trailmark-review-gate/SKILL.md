---
name: trailmark-review-gate
description: 'Use when running a Trailmark structural review gate over a branch, PR, fix commit, release diff, or git ref range to detect graph-level security regressions. Emits a PASS, WARN, FAIL, or UNKNOWN packet citing exact changed nodes, edges, paths, or metric deltas. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Trailmark review gate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A branch, PR, fix commit, release, or ref range needs deterministic graph-level regression checks alongside line review. |
| Authority | Reversible local: write only the review packet and temporary worktrees; rollback via VCS. |
| Side effect | A PASS, WARN, FAIL, or UNKNOWN structural review packet; graph comparison may use temporary worktrees. |
| Done | Every fired rule cites exact changed nodes, edges, paths, or metric deltas; inadequate graph evidence yields UNKNOWN, never PASS. |

## Inputs

Two git refs, a branch name, a commit range, or before/after directories. Both snapshots must resolve to a Trailmark before/after graph. Optional: repository-local threshold overrides stricter than the defaults.

## Procedure

1. Resolve before/after inputs from the supplied refs, branch, commit range, or directories. Do not check out branches unnecessarily; prefer `git diff`, `git show`, and git worktrees. Never mutate the user's working branch while comparing refs.
2. Build graph-evolution evidence by running before/after Trailmark graph analysis. Both snapshots must run `engine.preanalysis()` so taint, privilege-boundary, blast-radius, complexity, and entrypoint signals are available. Record the Trailmark version and feature probes. If graph construction fails, emit `UNKNOWN`.
3. Normalize the structural changes into: added, removed, and modified nodes; added and removed edges; entrypoint set changes; taint membership changes; privilege-boundary membership changes; blast-radius changes; complexity changes; newly reachable sensitive sinks; and unresolved, proxy, or dynamic edge changes.
4. Apply the gate rules. A triggered rule creates a review obligation; it does not prove a vulnerability.

   | Rule | Verdict | Why it matters |
   |---|---|---|
   | New untrusted entrypoint | `FAIL` | Expands external attack surface |
   | New path from untrusted entrypoint to sensitive sink | `FAIL` | Creates a candidate exploit path |
   | Removed auth, validation, or sanitization call on reachable path | `FAIL` | Common regression in fixes and feature PRs |
   | Newly tainted privilege-boundary node | `FAIL` | Trust transition now handles untrusted data |
   | Blast radius growth above threshold | `WARN` | A bug may now affect more code |
   | Complexity growth on tainted or boundary node | `WARN` | Risky logic became harder to review |
   | New unresolved, proxy, or dynamic call on reachable path | `WARN` | Graph uncertainty increased in a risky area |
   | Dead security function removed | `WARN` | May be cleanup or accidental security removal |

   Default thresholds, superseded by stricter local rules when present: blast radius growth `+5` downstream reachable nodes or `+25%`, whichever is larger; complexity growth cyclomatic `+3` on a tainted, boundary, or entrypoint-reachable node; sensitive sink path, any new path from an untrusted entrypoint to a sink; unresolved or proxy growth, any new unresolved or proxy edge on an entrypoint-reachable path.

   Sensitive sink categories to flag new reachable paths to: value transfer; authorization or role decisions; persistence or state writes; parsing or deserialization; cryptographic keys, sessions, or signatures; external process, network, or file operations; upgrade, plugin, hook, or dynamic dispatch mechanisms.

5. Compute the verdict by precedence, most severe first: `UNKNOWN` if Trailmark cannot produce adequate evidence; `FAIL` if any fail rule triggers; `WARN` if any warn rule triggers; `PASS` only if evidence is adequate and no rule triggers. If both `UNKNOWN` and `FAIL` apply, emit `UNKNOWN` and list the suspected fail condition as a manual review target.
6. Emit the review packet. For each triggered rule include: the changed node or edge identifier; source file or symbol when available; entrypoint path when relevant; before/after metric when metric-based; and the manual review target. Add a limitations section when parser, proxy, unresolved-call, or dynamic-dispatch uncertainty affects the verdict.
7. Hand the packet to the branch reviewer as supporting evidence for line-level review. Treat `PASS` as "no configured graph rule fired", not as approval. Do not use GitHub write actions unless the review process explicitly asks for them.

## Failure and recovery
| Failure class | Partial-result rule | Recovery |
|---|---|---|
| Trailmark graph construction fails | Emit `UNKNOWN`; never report `PASS` | Do not infer graph state from the line diff |
| Inadequate parser, proxy, or dynamic-dispatch coverage | Emit `UNKNOWN` and list the suspected condition as a manual review target | Do not widen scope or invent evidence |
| Both `UNKNOWN` and `FAIL` apply | Emit `UNKNOWN` and record the suspected fail condition | Reviewer inspects the named target manually |
| Comparing refs would mutate the working branch | Stop; use worktrees or `git diff`/`git show` | VCS rollback if any mutation occurred |

## Output
A Markdown review packet (JSON only if the user requests it):

```
# Trailmark review gate

### Verdict

Gate: PASS | WARN | FAIL | UNKNOWN
Confidence: High | Medium | Low

### Triggered rules

| Rule | Verdict | Evidence |

### Structural changes

| Change | Before | After | Review target |

### Entrypoint and reachability changes

### Privilege and taint changes

### Blast radius and complexity changes

### Limitations

### Recommended reviewer actions
```

Say "gate fired" instead of "vulnerability found" and "review target" instead of "exploit path" unless exploitability is separately established. Do not claim `PASS` means the change is secure.

## Provenance

Origin: https://github.com/trailofbits/skills | Revision: d1f1575cff97816e5cc08af66cd2506099c681d3 | License: CC-BY-SA-4.0; preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding. | Adaptation: rewritten to the ODIN 2.0 contract schema; gate rules, default thresholds, sensitive-sink categories, verdict precedence, output format, and review-integration guidance inlined so the skill is self-contained; reference-file pointers removed; rule and threshold tables preserved for deterministic parity.
