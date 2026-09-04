---
name: crypto-protocol-diagram
description: 'Use when asked for a sequence diagram of cryptographic protocol semantics from code, prose, RFCs, papers, ProVerif, or Tamarin, or for code/spec divergence. Not for architecture: use embed-diagram.'
---

# Crypto protocol diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to extract cryptographic protocol semantics from source code, prose, RFCs, papers, ProVerif, or Tamarin into a sequence diagram. |
| Authority | Reversible local: writes only one named Markdown artifact under the working directory; rollback is deleting the written file. No remote mutation. |
| Side effect | A named Markdown file containing a Mermaid sequence diagram, plus an inline ASCII rendering printed in the response. |
| Done | Every distinct protocol message, party, cryptographic operation, phase, and material abort path is represented; ambiguities and implementation/spec divergences are labeled. |

## Inputs

Required: one of the following, supplied by the user or present in the working tree.
- Source code implementing a cryptographic protocol (file path or directory).
- A specification: RFC, academic paper, pseudocode, informal prose, ProVerif (`.pv`), or Tamarin (`.spthy`) model. A URL is accepted for an RFC or paper.
- Both a spec and source code (run the spec path first, then annotate code/spec divergences).

Optional: a preferred output filename. If omitted, derive it from the protocol name (e.g. `noise-xx-handshake.md`).

## Procedure

1. Classify the input. Source file extensions, function/class definitions, and import statements indicate code. RFC section headers (`§`, `Section X.Y`, `MUST`/`SHALL`), `Algorithm`/`Protocol`/`Figure` labels, or mathematical notation indicate a spec. A ProVerif file (`.pv` with `process`, `let`, `in`/`out`) or Tamarin file (`.spthy` with `rule`, `--[...]->`) is a spec. If both a spec and code are present, run the spec path first. If the input is ambiguous, ask the user whether it is source code, a specification, or both. Done when: this step's stated action, evidence, and checks are complete.

2. (Spec path) Ingest the full specification, identify its format, and apply the matching rules in [Specification extraction](references/spec-extraction.md). Done when: the full specification has been mapped through exactly one matching extraction branch, with normative conflicts and underspecified cryptography annotated.

3. (Code path) Locate protocol entry points by searching for `handshake|session_init|round[_0-9]|setup|keygen|send_msg|recv_msg` and crypto primitives `sign|verify|encrypt|decrypt|dh|ecdh|kdf|hkdf|hmac|hash|commit|reveal|share`. Start from the highest-level orchestration function. Done when: this step's stated action, evidence, and checks are complete.

4. Identify parties and roles from struct/class names, function parameters carrying role state, comments, and test fixtures. Map each to a Mermaid `participant` with a short ID and descriptive alias (e.g. `participant I as Initiator`). Arrange declaration order so the dominant message direction flows left-to-right. Done when: this step's stated action, evidence, and checks are complete.

5. Trace message flow. For code: follow `send`/`recv`, `serialize`+`transmit`, return values passed across role boundaries, and round-named outputs; treat in-process function-call boundaries at role boundaries as logical message sends. For specs: apply the format rules from step 2. Preserve ordering and round structure; group concurrent or broadcast sends with `par`. Done when: this step's stated action, evidence, and checks are complete.

6. Annotate every cryptographic operation on the party that performs it, using concise math shorthand: Done when: this step's stated action, evidence, and checks are complete.
   - Key generation: `Note over A: keygen() → pk, sk`
   - DH/ECDH: `Note over A,B: DH(sk_A, pk_B)`
   - KDF/HKDF: `Note over A: HKDF(ikm, salt, info) → k`
   - Signing: `Note over A: Sign(sk, msg) → σ`
   - Verification: `Note over B: Verify(pk, msg, σ)`
   - Encryption/decryption: `Note over A: Enc(k, pt) → ct` / `Note over B: Dec(k, ct) → pt`
   - Hash: `Note over A: H(data) → digest`
   - Commitment: `Note over A: Commit(value, rand) → C`
   - Secret sharing / threshold combine: `Note over D: Share(secret, t, n) → {s_i}` / `Note over C: Combine({s_i}) → secret`

7. Identify protocol phases and group steps with `rect` blocks, one color per phase: setup/key-generation `rgba(100,149,237,0.15)`, handshake `rgba(46,204,113,0.15)`, authentication `rgba(241,196,15,0.15)`, key derivation `rgba(155,89,182,0.15)`, data transfer `rgba(230,196,15,0.12)`, error/abort `rgba(231,76,60,0.15)`. Detect abort/error paths from `assert`/`require`/`if … abort`, ProVerif `else 0`, Tamarin contradicting facts, or prose "if verification fails, abort" and render them as `alt` blocks showing both success and failure branches. Done when: this step's stated action, evidence, and checks are complete.

8. Flag ambiguities and divergences with `⚠️`: inferred ordering, implied-but-unnamed parties, steps the canonical pattern requires that the spec omits, underspecified crypto, and any code/spec divergence (e.g. `⚠️ spec requires MAC here — implementation omits it`). When both spec and code are supplied, the spec diagram is canonical and code divergences are annotated on it. Done when: this step's stated action, evidence, and checks are complete.

9. Generate the Mermaid `sequenceDiagram`. Use `->>` for protocol messages and `-->>` for replies; reserve `--x` for lost/dropped messages and `-->`/`--x` inside `alt` for error paths. Show every distinct message type; collapse repeated iterations into `loop` blocks but never omit a distinct step. Avoid colons inside message labels (use `=` or quote), non-alphanumeric participant IDs, the bare word `end` in labels, and unmatched `rect`/`loop`/`alt`/`opt`/`par` blocks. Keep labels under ~60 characters; move detail into `Note over`. Done when: every participant sends or receives, arrows and crypto ownership are correct, every arrow is phased, abort paths use `alt`, Mermaid parses, and divergences carry `⚠️`.

10. Write a Markdown file named after the protocol with this structure: a `# <Protocol Name> Sequence Diagram` heading, the Mermaid block in a fenced code block, and a `## Protocol Summary` listing Parties, Round complexity, Key primitives, Authentication, Forward secrecy, and Notable (spec deviations or security observations, or "none"). Then print an inline ASCII sequence diagram in the response followed by the same Protocol Summary, and state the output filename. Done when: the file contains the ordered heading, Mermaid block, and summary; the response contains the ASCII diagram, matching summary, and filename.

11. Render the inline ASCII diagram with participants as column headers above vertical `|` lifelines spaced ~28–32 characters apart; `+------>` for sends, `<- - - - +` for replies, `+------x` for lost messages; self-loops as `+--.`/`|<-'` for local computation; phase labels on a lifeline as `-- Phase --`; abort paths after the main flow separated by a blank line and labelled `[on …]`; keep lines under ~60 characters, abbreviate long labels and add a legend. Done when: the ASCII rendering has aligned lifelines, correct arrow forms, labelled phases and abort paths, lines under ~60 characters, and a legend for abbreviations.

## Failure and recovery
- No cryptographic protocol semantics found (no parties, no message exchange): stop and report that the input contains no extractable protocol; write no file.
- Ambiguous input type: ask the user to classify it as code, spec, or both; do not guess and proceed on the wrong path.
- Unresolvable message ordering: infer from round or section structure and label with `⚠️ ordering inferred`; never silently reorder.
- Mermaid syntax error: re-check participant IDs, label colons, the `end` keyword, and block matching; do not deliver a diagram that fails to render.
- Partial result rule: if extraction stalls on one phase, deliver the completed phases with the gap explicitly labelled `⚠️ [step] could not be extracted from source` rather than omitting it. Never pretend the done predicate holds.
- Non-mutation rule: the only mutation is the single written Markdown file; on any failure before the write, no file is created. On failure after the write, delete the file and report the blocker.

## Output
One Markdown file containing a Mermaid `sequenceDiagram` and a Protocol Summary, plus an inline ASCII sequence diagram and the same Protocol Summary printed in the response with the output filename stated. The diagram represents every distinct protocol message, party, cryptographic operation, phase, and material abort path, with ambiguities and divergences labelled `⚠️`.
