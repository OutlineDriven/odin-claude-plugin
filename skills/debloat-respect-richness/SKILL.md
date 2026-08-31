---
name: debloat-respect-richness
description: 'Use when a user asks to tighten verbose-but-correct prose without a full rewrite. Cuts words in place to load-bearing density, preserving every load-bearing claim, respecting intended richness, and handing genuine duplication or drift off rather than force-compressing it.'
---

# Debloat respect richness

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to tighten verbose-but-correct prose without a full rewrite |
| Authority | Reversible local edits: cuts words in place on the named artifact; moves nothing to other artifacts |
| Side effect | Local write to the target artifact only; no re-derivation, no move to another home |
| Done | Every load-bearing claim present before remains after; the result reads as intentionally terse, not amputated; genuine duplication or drift is handed off instead of force-compressed |

## Inputs

- Required: the target artifact — a file path or pasted prose that is correct and current but has grown verbose or patched-over.
- Optional: a note flagging which sections are human-facing teaching or orienting prose whose accessibility earns its length.

## Procedure

1. Pin the artifact and read it end to end. Record one line per section stating the load-bearing content that must survive the pass. Done when: every section has a one-line load-bearing-content record.
2. Distinguish bloat from content. Bloat is padding that adds length without meaning: a qualifier or parenthetical the sentence works without, a fused sentence carrying three ideas, an enumeration where a rule and short list would do, a point restated nearby, or litigation history where the rule alone suffices. Done when: bloat is distinguished from load-bearing content in every section.
3. Compress in place: cut the padding, split the fused sentence or drop its dead clause, collapse the wall, keep a repeated point once. Move nothing to another artifact and re-derive nothing. Done when: padding is cut in place with nothing moved or re-derived.
4. Preserve every load-bearing claim — a rule, fact, constraint, or example that carries weight. If cutting a word would lose one, keep the word. Done when: every load-bearing claim present before remains after the pass.
5. Respect intended richness: human-facing prose meant to teach or orient (a quickstart, a worked example) earns its length. Compress the bloat, not the accessibility. Done when: human-facing teaching prose is preserved at its earned length.
6. When the bloat is really duplication across artifacts, or the content has drifted stale, stop and name it: hand duplication to the appropriate deduplication work and drift to the appropriate rewrite work. This skill only tightens; it does not dedup or rewrite. Done when: duplication or drift is named and handed off, or no misclassification is found.
7. Re-read cold and cut again — the first pass always leaves some. Done when: a cold re-read finds no remaining bloat.

## Failure and recovery
- Empty-pass: a pass that finds nothing genuinely bloated changes nothing. Report that the artifact is already at load-bearing density.
- Claim-loss: if a cut would drop a load-bearing claim, restore the word and record the near-miss. The done predicate forbids claim loss.
- Misclassified scope: if what looked like bloat is duplication across artifacts or stale content, do not force-compress it. Stop, name the class (duplication or drift), and hand it off. Tightened sections stand; report the misclassified sections as unchanged with the handoff note.
- Edit safety: assert each edit target exists before mutating; report a MISS rather than a silent no-op. On a MISS, abort the pass and report the missing target.
- Rollback: edits are local and reversible; a failed or aborted pass restores the unverified sections to their pre-pass state.

## Output
The target artifact with words cut in place to load-bearing density, plus a report listing sections tightened, load-bearing claims confirmed, unchanged sections, and any duplication or drift handoff.
