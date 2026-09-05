# Specification extraction

Apply the branch matching the classified specification.

## RFC

Locate the handshake, key-exchange, or message-flow section. Extract parties from the introduction or Notation section and capitalize lowercase role names. Read arrow patterns (`A → B: msg`) and "A sends B …" or "upon receiving X, B MUST …" sentences in order. Treat `MUST` and `SHALL` as required steps and `MAY` and `SHOULD` as optional. Find cryptographic operations in Cryptographic Computations or Key Schedule sections. Use ABNF grammars to populate arrow labels. Normative prose wins when an embedded ASCII diagram conflicts with it.

## Academic paper or pseudocode

Prefer the pseudocode box over informal description. Read two-column layouts left-to-right for the left party and right-to-left for the right party. Map numbered steps to rounds: "X sends Y to Z" becomes an arrow and "X computes …" becomes a local note. Map `←` to assignment, `←$` to random sampling, `{m}_k` to encryption, `[m]_sk` to signature, `H(m)` to hash, and `⊥` to abort.

## Informal prose

Find the first paragraph naming participants. Map "A sends/transmits/forwards msg to B" to `A->>B`, "B responds with msg" to `B-->>A`, and "A computes/derives/generates" to a local note. Map conditional actions to `alt` and optional actions to `opt`. Annotate underspecified cryptography with `⚠️ scheme not specified`.

## ProVerif

Each `let ProcName(params) =` defines a role and participant. Map `new x: t` to `Note over Party: x ← fresh()`. Pair each `out(ch, msg)` with the matching `in(ch, x)` on the same channel to form an arrow. Map `if cond then P else Q` to `alt`/`else`; annotate `!P` as multi-session. Map `senc`, `aenc`, `sign`, `hash`, and `pk(sk)` through the cryptographic-operation table in the shared procedure. Annotate private channels as `via private channel`. Order steps by `phase N`. Omit `query` and `event` from the diagram but mention them in the summary.

## Tamarin

Map `Fr(~x)` to a fresh value. Pair an `Out(m)` conclusion with an `In(m)` premise as a logical A→B message. Use rule names and ordering to recover rounds. Treat `--[ Label ]->` facts as security annotations, not messages. Add `⚠️ Tamarin uses Dolev-Yao model — all messages transit adversary network`.
