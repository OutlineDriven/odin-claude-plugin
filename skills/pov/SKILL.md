---
name: pov
description: 'Use when asked to judge whether this project should adopt, switch to, reject, or revisit a technology, library, pattern, or architecture, or give a mid-session second opinion. Graded verdict clears two evidence floors. Not for scoping — use brainstorm; not for forks — use decide.'
---

# Pov

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Explicit invocation to judge a technology, library, pattern, platform, or architecture against the current project, or to give a mid-session second opinion. |
| Authority | Read project and external evidence; write only a run-specific scratch directory, the deterministic project-profile cache under `/tmp/odin/repo-profile/`, and an optional local report at a user-supplied path. Do not mutate project files, VCS state, credentials, paid services, deployments, publications, or remote state. |
| Side effect | Cache a question-agnostic repository profile and scout dossiers locally; return the verdict in chat by default. Delete the run scratch directory, any cache entry created by this run, and any optional report to roll back local writes. |
| Done | A compact graded verdict passes both evidence floors, states its reversibility tier and confidence, cites the decisive evidence, records conditions and reversal triggers, and gives the computed next action; or an exact Hold result identifies the failed floor. |

## Inputs

Required: the subject to judge and the intended decision—adopt, migrate, compare, determine fit, reject, or revisit. For a mid-session invocation, take the question and claims to verify from the surrounding conversation, but do not treat them as evidence. If the intent is ambiguous, obtain one answer before research.

Optional: user-supplied links, constraints, decision criteria, a named incumbent, and a local output path for a full report. Treat supplied claims and links as unverified input until corroborated.

## Procedure

1. State the subject and decision frame in one line. If the request asks to choose from an unbounded field or lacks usable criteria, return `Hold — unbounded selection` with the missing boundary or criterion; do not invent candidates. Classify the decision as Tier 1 when readily reversible or Tier 2/3 when it affects data, authentication, public contracts, migration, security, or legal commitments. Done when: the subject and frame are stated with a tier classification, or `Hold — unbounded selection` is returned.
2. Resolve the repository root and invoke `scripts/repo-profile-cache.py get`. On `HIT`, use the returned question-agnostic profile. On `MISS`, dispatch a repository-profile scout to inspect manifests, dependency and license surfaces, topology, conventions, and vocabulary; require a JSON object with `stack`, `dependencies`, `topology`, `conventions`, and `vocabulary`, then invoke `scripts/repo-profile-cache.py put <profile-file>`. On `NO-CACHE`, malformed output, or helper failure, derive that profile in the scout and continue without caching. A cached dependency name is only a lead, never proof of a current touchpoint. Done when: the repository profile is obtained from cache, scout, or derived in-scout.
3. Create one unique `/tmp/odin/pov/<random-id>/` scratch directory. Give every scout the same framed question, tier, named incumbent, supplied links, profile, and scratch path. Require each scout to write a dossier there and return only its path and a short gist. Done when: the scratch directory is created and every scout has the same framed context and scratch path.
4. For Tier 1, dispatch in parallel a project-grounding scout and an external-evidence scout. The project scout must freshly verify an incumbent and concrete call site, or verify absence and the exact integration point, and must scan local decision records for precedent. For Tier 2/3, also dispatch an independent precedent-and-activity scout. That scout always searches local decision records and, when reachable, issue and change history. The external scout verifies current primary documentation and independent evidence, checks dates and source entailment, and records unavailable surfaces. The repository-profile scout, project-grounding scout, precedent-and-activity scout, and external-evidence scout are the four distinct research roles; the first runs only on a cache miss and the precedent role is folded into project grounding for Tier 1. Done when: the required scouts for the tier are dispatched with their distinct roles.
5. Keep four provenance buckets separate: observed project facts, verified external facts, conversation claims, and unconfirmed assumptions. Missing tracker or web access lowers confidence; continue with reachable surfaces. Never promote conversation claims or assumptions into either evidence floor. Done when: all evidence is sorted into the four provenance buckets.
6. Apply two independent pass/fail floors. The project floor requires a freshly verified named incumbent plus a concrete touchpoint, verified absence plus a concrete fit point for net-new adoption, or a verified prior decision. The external floor requires at least one current, relevant external source whose content entails the claim used. Strong evidence on one side cannot compensate for failure on the other. Done when: both floors are evaluated with pass/fail determined for each.
7. If either floor fails, forbid Adopt and Reject. Return `Hold — project evidence missing`, `Hold — external evidence missing`, or `Hold — both evidence floors missing`, name the attempted surfaces and the exact evidence needed to resume, and preserve any valid partial dossiers as explicitly partial results. Done when: the Hold subtype is returned with attempted surfaces and resume evidence, or both floors pass.
8. When both floors pass, reason from project constraints, incumbent cost, compatibility and licensing, external maturity and activity, reversibility, and credible alternatives. Adopt a skeptic stance: state the strongest counterargument, conditions that would change the result, and a tier-sized reversal trigger. Grade the result `Adopt`, `Trial`, `Hold`, `Reject`, or `Not our problem`; do not overstate confidence beyond the weakest evidence leg. Done when: the graded result is produced with counterargument, conditions, and reversal trigger.
9. Emit a compact chat block with `Grade`, `Decision`, `Project evidence`, `External evidence`, `Tier`, `Confidence`, `Conditions`, `Reversal trigger`, and `Next action`. Keep Tier 1 to one screen; for Tier 2/3 cite dossiers and sources rather than reproducing them. Compute one next action from the grade: implementation planning for a clear Adopt, requirements clarification for a fuzzy Adopt, a timeboxed experiment for Trial, and no handoff for Hold, Reject, or Not our problem. Done when: the nine-field verdict block is emitted with a computed next action.
10. For a mid-session second opinion, return the verdict and hand control back without prompting a follow-up. Otherwise, write an expanded local report only when requested and only to the supplied path; the chat verdict remains the required result. Done when: the verdict is returned and control is handed back, or the expanded report is written to the supplied path.

## Failure and recovery
- **Ambiguous frame:** ask one blocking question; if no answer is available, return `Hold — frame unresolved` and make no research writes.
- **Scout or surface unavailable:** retain successful dossiers, mark unavailable evidence explicitly, and apply the floors without substitution. If a required floor fails, return its exact Hold subtype.
- **Cache failure:** continue from a fresh repository profile without caching. Never treat cache availability as a correctness condition or serve a profile whose freshness is unproved.
- **Conflicting evidence:** report the conflict and return `Hold — conflicting evidence` unless the conflict can be resolved from a primary source within the framed scope.
- **Partial local write:** remove only the run-specific scratch directory, cache entry created by this run, or optional report created by this run. Leave pre-existing cache entries and unrelated files untouched.
- **Non-convergence or scope widening:** stop and return `Hold — non-converged`, listing the repeated conflict or newly required decision boundary. Never widen the subject, invent evidence, or claim the done predicate.

## Output
Either the nine-field graded verdict block or an exact Hold classification with attempted evidence surfaces, retained partial results, and the evidence required to resume — plus, when explicitly requested, one expanded report written to the supplied local path.

## Provenance

Adapted from the project-owned ODIN current `pov` skill (`skills/pov/SKILL.md`), candidate `current:current-c:current:pov`; no pinned revision or external license was supplied. This clean-cutover adaptation retains project-specific evidence floors, tier-sized four-role scouting, deterministic profile-cache invalidation, provenance separation, graded verdicts, and warm-invocation behavior without copying third-party material.
