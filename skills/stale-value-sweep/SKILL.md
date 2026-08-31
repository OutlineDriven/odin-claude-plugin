---
name: stale-value-sweep
description: 'Use when a changed value may still survive in code, docs, examples, generated sources, or variants. Sweeps declared repositories for residual old values and semantic variants after a change. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Stale value sweep

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A changed value may still survive in code, docs, examples, generated sources, or variants. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Post-change stale-value sweep |
| Done | No unintended old value or semantic variant remains in the declared repositories. |
| Stop | regenerator found; blocked; scope exhausted. Bound: one changed value and declared repositories. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. **Bind the declared bound and freeze it before mutation.** Done when: the changed value and repository set are frozen and no mutation has occurred.
2. **Execute the post-change stale-value sweep inside the bound.** Done when: outcome.success holds or a named non_success/bound terminal applies.
3. **Stop at the terminal.** Record outcome.success, any outcome.non_success, or outcome.bound. Done when: a receipt terminal class is assigned.
4. **Persist per profiles.persistence.P1.** Write to `durable_location .outline/loops/<slug>/<run_id>/` when durable; emit `receipt.json` before return. Done when: an immutable K11 receipt with every K11 field is written.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
