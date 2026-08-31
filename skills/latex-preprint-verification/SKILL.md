---
name: latex-preprint-verification
description: 'Use when source material needs a compiling, traceable LaTeX preprint without fabricated claims. Produce a Traceable native-visual LaTeX preprint. Stop at the declared success, non-success, or bound.'
---

# LaTeX preprint verification

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Source material needs a traceable compiling LaTeX preprint without fabricated claims. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Traceable native-visual LaTeX preprint |
| Done | The fixed section set compiles cleanly with claim traceability and verified native visuals. |
| Stop | missing material; blocked; repair cap. Bound: Fixed document contract and bounded repair rounds. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and no mutation has occurred.
2. Execute the Traceable native-visual LaTeX preprint inside the bound. Done when: outcome.success holds or a named non_success/bound terminal applies.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: the run has stopped at one declared terminal.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: an immutable K11 receipt with every K11 field is written.

## Output

One receipt: terminal classification (success, capped, stalled, blocked, exhausted, pending), the preprint artifact path, and the K11 receipt fields.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
