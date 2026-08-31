---
name: clean-and-true
description: 'Use when the automatic trigger applies: after editing a durable artifact, or when the user says "clean and true", "run the hygiene pass", or "taste the output". Routes the just-changed artifact through the hygiene passes the change earned and skips the rest.'
---

# Clean and true

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Fires automatically after editing a durable artifact, or when the user says "clean and true", "run the hygiene pass", or "taste your own output". |
| Authority | Reversible local writes limited to the just-changed durable artifact; no VCS, credential, paid, published, deployed, or remote mutation. Rollback is the prior on-disk content of that artifact. |
| Side effect | May revise the just-changed local artifact through applicable hygiene passes only. |
| Done | Every applicable hygiene route ran or has a stated skip reason; findings are applied or explicitly deferred; no-op when nothing improves. |

## Inputs

- The just-changed durable artifact (path or content). Must be supplied.
- The set of hygiene passes available in the session. Optional; a pass absent from the session is skipped with a stated reason.

## Procedure

1. Identify the just-changed durable artifact and bound scope to it; do not read or edit any other file. **Done when:** the artifact is identified and scope is bounded to it.
2. Classify what changed in the artifact and route to the hygiene pass the change earned:

   | What changed | Hygiene route | Skip when |
   |---|---|---|
   | Drifted prose that reads as sediment | Rewrite as a clean v0 from current truth | No sediment accumulated |
   | Padded prose whose every rule still binds | Debloat: cut what no rule depends on | Nothing padded to cut |
   | Anything a stranger must understand alone | Cold-read for standalone clarity | Short-lived or author-only |
   | A reality-grounded claim | Verify the claim both ways | No such claim present |
   | A truth duplicated across places | SSOTize: fold into one home, point the rest at it | A single home already holds it |
   | Voice, tells, or stack residue in prose | Strip tells and restore voice | Not prose, or not stale |

   **Done when:** each change is classified and routed to its hygiene pass or marked with a skip reason.
3. Run each routed pass over the artifact. Skip any pass not available in the session with a stated reason. **Done when:** every routed pass is run or skipped with a reason.
4. Apply the findings to the artifact in this session. **Done when:** findings are applied to the artifact or explicitly deferred with a reason.
5. If a pass finds no genuine improvement, leave the artifact unchanged for that route. **Done when:** each route is confirmed as applied, deferred, or no-op.

## Failure and recovery
- No applicable route: state that no hygiene route earned a run and leave the artifact unchanged; this is not an error.
- Routed pass unavailable in session: skip it with a stated reason and continue the remaining routes; the partial result is the set of routes that ran.
- Routed pass reports a finding that cannot be safely applied: defer it with a stated reason rather than widen scope or invent a fix.
- Non-mutation rule: never edit files outside the just-changed artifact; recovery is the prior on-disk content of that artifact.

## Output
The revised artifact with findings applied, plus a per-route record stating whether each route ran, was skipped (with reason), or was deferred (with reason); if a pass finds no genuine improvement, it changes nothing.
