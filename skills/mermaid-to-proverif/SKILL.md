---
name: mermaid-to-proverif
description: 'Use when a cryptographic Mermaid sequenceDiagram is supplied and the user requests a ProVerif model, compile it and verify secrecy, authentication, replay resistance, or forward secrecy. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Mermaid to ProVerif

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A cryptographic Mermaid sequenceDiagram exists and the user asks for a ProVerif model or secrecy/authentication/replay/forward-secrecy verification. |
| Authority | reversible-local: write only named local artifacts; rollback path is uncommitted file deletion. |
| Side effect | A named .pv model file and verifier output; may execute ProVerif. |
| Done | The model type-checks, participant sends and receives match, reachability is established before security queries are trusted, and assumptions plus each query result are reported. |

## Inputs

- **Required**: a Mermaid `sequenceDiagram` block or file containing at least two named participants and at least one message between them.
- **Optional**: a list of security properties to verify — one or more of `secrecy`, `authentication`, `replay`, `forward_secrecy`. Defaults to all four if not specified.
- **Optional**: a ProVerif output filename (`.pv`). Defaults to `<diagram-name>.pv`.

## Procedure

1. Parse the Mermaid `sequenceDiagram` into an abstract syntax tree. Extract every named participant and every directed message (`A->>B: label`). Record message order.
2. Represent each participant as a `let p = ...` process in ProVerif. Map each actor declaration to `new p:name;`.
3. Convert each message into a ProVerif reduction or event pair. If the message label contains a cryptographic operation keyword (`encrypt`, `sign`, `hash`, `sharedkey`, `dh`, `pk`, `sk`), emit the matching ProVerif reduction; otherwise emit a `recv`/`out` event pair preserving the ordering.
4. Write the `.pv` model file. Prefix it with a `(* ADAPTED FROM: Trail of Bits mermaid-to-proverif skill; CC-BY-SA-4.0; https://github.com/trailofbits/skills *)` comment block and a `(* ASSUMPTIONS: <list of assumptions> *)` block derived from the diagram annotations or human-supplied constraints.
5. Append one reachability query `query event(e_start) ... event(e_end) ...` for each end-to-end message sequence before any security query, so reachability is established before security results are trusted.
6. Append security queries:
   - `secrecy`: `query secret ~m.;` per sensitive message variable `m`.
   - `authentication`: `query event(e_received(A,m)) ==> event(e_sent(B,m)).` per message variable `m`.
   - `replay`: `query not event(replay_attempted).` per identified vulnerable transition.
   - `forward_secrecy`: `query secret ~m. @weak_agree ...` per session-key-derived variable.
7. Execute `proverif <output>.pv`. Collect the type-check result, all `query` results, and any `WARNING` or `RESULT` line.
8. Validate the output: type-check must succeed; participant sends and receives in ProVerif must correspond to the original diagram participants; each security query must be preceded by a proved reachability query; all assumptions listed in the file header must be acknowledged in the report.
9. Write the verification report to `<output>_report.txt` containing type-check status, participant correspondence confirmation, each reachability result, each security query result, and the assumption list.

## Failure and recovery
- **Type-check failure**: ProVerif reports a syntax or type error. Report the error verbatim, stop. Do not trust any query result. No partial model is produced.
- **Participant mismatch**: the number of senders or receivers in the ProVerif output does not match the diagram participants. Report the mismatch and stop. The model is not trustworthy.
- **Security query passes without prior reachability proof**: treat the security result as `RESULT i: noninterference_interpreted_as_secrecy_not_proved` or equivalent indeterminate. Do not report it as proved.
- **Reachability failure**: a required event is unreachable. Report which query cannot be evaluated because its precondition is unreachable. Do not claim the security property holds.
- **Partial-result rule**: if ProVerif produces a partial output (crash, timeout, unparsable result), report `verification_inconclusive` and the concrete reason. Do not claim success.
- **Rollback**: if the model file was created and verification failed, delete the uncommitted file before reporting.

## Output
- The named `.pv` model file containing the converted protocol model, assumption block, reachability queries, and security queries.
- A verification report `<output>_report.txt` containing:
  - Type-check status (`SUCCESS` or failure detail).
  - Participant correspondence confirmation or mismatch report.
  - Each reachability query result.
  - Each security query result with `RESULT` classification.
  - The complete assumption list.

## Provenance

Origin: Trail of Bits skills repository (https://github.com/trailofbits/skills), revision d1f1575cff97816e5cc08af66cd2506099c681d3. License: CC-BY-SA-4.0. Adaptation: converted Mermaid sequence diagrams to ProVerif protocol models with added reachability-before-security-query ordering, assumption tracking, and structured verification report. Retained all cryptographic operation mapping logic. Trail of Bits attribution and source link preserved; adaptations marked. No trademark rights claimed.
