# Shared idioms

Owned by `clean-and-true`. Linked by consumers at `../clean-and-true/references/idioms.md`.

- Edit safety: `rewrite-clean-v0`, `reorder`, `deslop` (bloat mode), `ssotize-audit-fold`
- Clean room: `fresh-reader-review`, `decision-rationale-gaps`, `prism`, `evaluation-leakage-audit`, `guardrail-carve-run`
- Negatives as corpus: `restart-keeping-lessons`, `guardrail-carve-run`

## Edit safety

Assert the target exists and report a `MISS` rather than a silent no-op.
Replace positional targets per occurrence after judging each one, never as a
blanket sweep. Script a large structural move rather than hand-editing it.

Upstream's `PYTHONUTF8=1` guidance is replaced by ODIN's own mechanism:
anchored `edit` calls against a snapshot tag, re-reading after any edit that
renumbers.

## Clean room

A fresh zero-context sub-session receives the artifact and nothing else: no
conversation history, author's framing, or prior verdict. Without that context,
it cannot infer what the author meant. The sub-session reads and reports but
does not edit.

## Negatives as corpus

A cut is a move to an archive, never a delete. A pruned branch and a failed
attempt are evidence about the problem, and the reason a later attempt does not
repeat them.
