---
name: autobahn
description: 'Use when a task mixes reversible work with irreversible, credential, data-at-rest, migration, or deletion work, or when the user says "autobahn this". Carves the risky items into an explicit descope ledger with a safe alternative each, then runs the safe remainder at full strength in a fresh subagent that sees only the carved prompt. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Autobahn

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A task mixes reversible work with irreversible, credential, data-at-rest, migration, or deletion work; "autobahn this". |
| Authority | Reversible-local: dispatch one worker and write only the named local descope ledger and archive, both after the run closes; state the rollback path for anything already mutated. |
| Side effect | Dispatches a worker and writes a local descope ledger/archive after closure; no other file, credential, or remote change. |
| Done | Every risky item is classified with a safe alternative; the safe remainder is complete and undiluted. |

## Inputs

- The task with its inputs, containing the mixed safe and risky work. Required.
- Authorization to descope. Required before any dispatch; propose the carve and wait if the user has not already given it.
- An archive destination per carved item. Required before closure; propose one if the user names none.

## Procedure

1. **Frame.** Read the task and inputs. If the user already authorized descoping, proceed; otherwise propose the carve with the split made explicit and wait for approval on every gray-zone item. Bright-line exclusions are never negotiable; if the user disputes one, hand its abstract description to a fresh context for re-evaluation and record the appeal either way.
2. **Carve.** Sweep the task and inputs for guardrail-adjacent items. Class each one bright-line (irreversible, credential, data-at-rest, migration, or deletion work that cannot be rolled back) or gray-zone (guardrail-adjacent but reversible or ownership-uncertain). Give one risk-free alternative per item and name an archive destination. A gray-zone item the user keeps stays in scope and enters the ledger as kept-by-owner.
3. **Guard.** Distill the carve into a compact scope-guard block — absolute exclusions, allowed alternatives, authorizing context — and fold it into the carved prompt verbatim. Where the run shares a filesystem or memory with other contexts, instruct it not to consult decision logs, notes, or transcript search. Instruct the run to build the safe scope at full strength without hedging.
4. **Run.** Spawn a fresh, context-clean subagent with only the carved prompt. Route any new risky material it surfaces back to step 2.
5. **Verify.** Run one capped adversarial pass over the returned deliverable across five directions — excluded material leaking in or being elaborated, safe work diluted or hedged, guard constraints violated, ledger entries diverging from the carve, alternatives that carry residual risk. Separately diff an independent re-sweep of the original task against the ledger. Cap the whole pass at one round.
6. **Ledger.** After the run closes, report the deliverable with a descope ledger, one row per item: class, verdict, reason, safe alternative, archive destination. Write the ledger and the archive only now, after the verification window is closed. Archive each descoped negative verbatim so the accumulated negatives stay reusable as corpus.

## Failure and recovery
- **Disputed bright-line item:** never negotiate the exclusion; re-evaluate the abstract description in a fresh context and record the appeal either way. If it is confirmed bright-line, the task proceeds without it or the user redirects.
- **Carve declined:** dispatch nothing, write nothing, and report that the task was not run.
- **No safe remainder:** if the carve leaves nothing reversible to build, stop and report that; do not dispatch a hollow run.
- **New risky material mid-run:** re-carve, re-guard, and resume the run; unledgered risky work never enters the deliverable.
- **Verification failure:** do not claim the done predicate; report the failing direction with the deliverable and either re-carve or present the failure for user decision. Never swallow an adversarial finding.
- **Interruption before closure:** the ledger and archive do not exist yet by design; report the window as open and the deliverable as unverified. Rollback rule: nothing outside the named ledger and archive is ever written, so no other mutation is created to roll back.

## Output
The deliverable plus a descope ledger with one row per risky item — class, verdict, reason, safe alternative, archive destination — and a local archive holding the descoped negatives verbatim. Terminal states: complete and undiluted, or failed verification with the failing direction named.

## Provenance

Origin: project-owned skill `skills/autobahn/SKILL.md` from the odin-1.x current tree (candidate current:current-a:current:autobahn), revision unversioned, license project-owned. Adapted to the ODIN 2.0 contract: section order normalized, cross-skill idiom references inlined and rewritten as semantic-minimum self-contained instructions; no third-party expression copied.
