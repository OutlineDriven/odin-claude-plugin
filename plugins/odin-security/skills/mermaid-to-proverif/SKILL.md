---
name: mermaid-to-proverif
description: 'Use when a crypto Mermaid sequenceDiagram needs a ProVerif model for secrecy, authentication, replay, or forward-secrecy checks. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Mermaid to ProVerif

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A cryptographic Mermaid sequenceDiagram exists and the user asks for a ProVerif model or secrecy/authentication/replay/forward-secrecy verification. |
| Authority | Reversible local: writes only named `.pv` and report files; rollback is deleting uncommitted files. No remote mutation. |
| Side effect | A named `.pv` model file and verifier output; may execute ProVerif. |
| Done | The model type-checks, participant sends and receives match, reachability is established before security queries are trusted, and assumptions plus each query result are reported. |

## Inputs

- Required: a Mermaid `sequenceDiagram` block or file containing at least two named participants and at least one message between them.
- Optional: a list of security properties to verify, one or more of `secrecy`, `authentication`, `replay`, `forward_secrecy`. Defaults to all four if not specified.
- Optional: a ProVerif output filename (`.pv`). Defaults to `<diagram-name>.pv`.

## Procedure

### 1. Parse the Mermaid sequenceDiagram

Parse the Mermaid `sequenceDiagram` into an abstract syntax tree. Extract every named participant and every directed message (`A->>B: label`). Record message order. Identify cryptographic operation keywords in each label: `encrypt`, `sign`, `hash`, `sharedkey`, `dh`, `pk`, `sk`. If a label contains no recognized keyword, treat the message as a plaintext transfer over the channel type indicated by the arrow style (solid for public, dotted for private). Done when: every participant and message is extracted with its order and cryptographic keywords identified.

### 2. Define ProVerif cryptographic primitives, channels, and attacker model

Define the Dolev-Yao cryptographic model in ProVerif based on the keywords found in the diagram. This stage establishes the primitive vocabulary that Stage 3 uses to map messages; without it, free-form Mermaid labels cannot be translated into valid ProVerif constructs.

Declare types: `key`, `bitstring`, and any protocol-specific types the labels reference.

Declare constructors for each cryptographic operation the diagram uses:

| Mermaid keyword | ProVerif constructor |
|---|---|
| `encrypt` | `fun enc(bitstring, key): bitstring` |
| `pk` | `fun pk(key): key` |
| `sk` | `fun sk(key): key` (or `free` for long-term keys) |
| `sign` | `fun sign(bitstring, key): bitstring` |
| `hash` | `fun hash(bitstring): bitstring` |
| `sharedkey` | `fun sharedkey(key, key): key` (or a KDF) |
| `dh` | `fun dh(key, key): key` (Diffie-Hellman combine) |

Declare destructors for the inverse operations:

| Operation | ProVerif destructor |
|---|---|
| decrypt | `reduc forall m: bitstring, k: key; dec(enc(m, k), k) = m` |
| verify signature | `reduc forall m: bitstring, k: key; getmsg(sign(m, k), pk(k)) = m` |

If the diagram uses an operation with no standard Dolev-Yao primitive, stop and report the unsupported construct rather than inventing semantics.

Define channels: a public `channel c` for messages sent over public networks (the Dolev-Yao attacker controls these), and private channels for messages marked as authenticated or confidential in the diagram annotations. The attacker model is the standard Dolev-Yao attacker: it can intercept, modify, replay, and compose messages on public channels but cannot break cryptographic primitives.

Done when: all types, constructors, destructors, channels, and the attacker model are declared and cover every cryptographic keyword in the diagram.

### 3. Map messages to ProVerif process actions and events

Represent each participant as a `let p = ...` process in ProVerif. Map each actor declaration to `new p:name;`.

Convert each message into ProVerif process actions using the primitives from Stage 2:

- A plaintext message `A->>B: m` over a public channel becomes `out(c, m)` in A's process and `in(c, x: bitstring)` in B's process.
- An encrypted message `A->>B: encrypt(m, k)` becomes `out(c, enc(m, k))` and `in(c, x: bitstring); let m = dec(x, k)`.
- A signed message `A->>B: sign(m, sk_A)` becomes `out(c, sign(m, sk_A))` and `in(c, x: bitstring); let m = getmsg(x, pk(sk_A))`.
- A hashed message becomes `out(c, hash(m))` with no destructor (hash is one-way).
- A Diffie-Hellman exchange maps to two `out`/`in` pairs for the public values and a `sharedkey` or `dh` computation on each side.

Emit `event(e_sent(A, m))` before each `out` and `event(e_received(B, m))` after each `in`, preserving the message order from the AST. These events anchor the reachability and authentication queries in Stage 4.

Write the `.pv` model file. Prefix it with a `(* ADAPTED FROM: Trail of Bits mermaid-to-proverif skill; CC-BY-SA-4.0; https://github.com/trailofbits/skills *)` comment block and a `(* ASSUMPTIONS: <list of assumptions> *)` block derived from the diagram annotations or human-supplied constraints.

Done when: every message is mapped to ProVerif process actions with events, and the `.pv` file is written with the attribution and assumptions blocks.

### 4. Append reachability and security queries

Append one reachability query `query event(e_start) ... event(e_end) ...` for each end-to-end message sequence before any security query, so reachability is established before security results are trusted.

Append security queries based on the requested properties:

- `secrecy`: `query secret ~m.;` per sensitive message variable `m`.
- `authentication`: `query event(e_received(A,m)) ==> event(e_sent(B,m)).` per message variable `m`.
- `replay`: `query not event(replay_attempted).` per identified vulnerable transition.
- `forward_secrecy`: `query secret ~m. @weak_agree ...` per session-key-derived variable.

Done when: reachability queries are appended for every end-to-end sequence and security queries are appended for every requested property.

### 5. Execute ProVerif and generate a verification report

Execute `proverif <output>.pv`. Collect the type-check result, all `query` results, and any `WARNING` or `RESULT` line.

Validate the output: type-check must succeed; participant sends and receives in ProVerif must correspond to the original diagram participants; each security query must be preceded by a proved reachability query; all assumptions listed in the file header must be acknowledged in the report.

Write the verification report to `<output>_report.txt` containing type-check status, participant correspondence confirmation, each reachability result, each security query result, and the assumption list.

Done when: ProVerif executes, the output is validated, and the report is written.

## Failure and recovery

- Type-check failure: ProVerif reports a syntax or type error. Report the error verbatim, stop. Do not trust any query result. No partial model is produced.
- Participant mismatch: the number of senders or receivers in the ProVerif output does not match the diagram participants. Report the mismatch and stop. The model is not trustworthy.
- **Security query passes without prior reachability proof**: treat the security result as `RESULT i: noninterference_interpreted_as_secrecy_not_proved` or equivalent indeterminate. Do not report it as proved.
- Reachability failure: a required event is unreachable. Report which query cannot be evaluated because its precondition is unreachable. Do not claim the security property holds.
- Unsupported cryptographic construct: a Mermaid label uses an operation with no standard Dolev-Yao primitive. Stop and report the unsupported construct; do not invent constructors, destructors, or event semantics.
- Partial-result rule: if ProVerif produces a partial output (crash, timeout, unparsable result), report `verification_inconclusive` and the concrete reason. Do not claim success.
- Rollback: if the model file was created and verification failed, delete the uncommitted file before reporting.

## Output

- The named `.pv` model file containing the converted protocol model, Dolev-Yao primitive declarations, assumption block, reachability queries, and security queries.
- A verification report `<output>_report.txt` containing:
  - Type-check status (`SUCCESS` or failure detail).
  - Participant correspondence confirmation or mismatch report.
  - Each reachability query result.
  - Each security query result with `RESULT` classification.
  - The complete assumption list.
