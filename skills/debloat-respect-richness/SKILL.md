---
name: debloat-respect-richness
description: 'Use when a user asks to tighten verbose-but-correct prose without a full rewrite. The skill cuts words in place to load-bearing density, preserving every load-bearing claim, respecting intended richness, and handing genuine duplication or drift off rather than force-compressing it. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Debloat respect richness

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to tighten verbose-but-correct prose without a full rewrite |
| Authority | Reversible local edits: cuts words in place on the named artifact; moves nothing to other artifacts |
| Side effect | Local write to the target artifact only; no re-derivation, no move to another home |
| Done | Every load-bearing claim present before is present after; result reads intended-terse not amputated; genuine duplication/drift handed off instead of force-compressed |

## Inputs

- Required: the target artifact — a file path or pasted prose that is correct and current but has grown verbose or patched-over.
- Optional: a note flagging which sections are human-facing teaching or orienting prose whose accessibility earns its length.

## Procedure

1. Pin the artifact and read it end to end. Record one line per section stating the load-bearing content that must survive the pass.
2. Distinguish bloat from content. Bloat is padding that adds length without meaning: a qualifier or parenthetical the sentence holds without, a fused sentence carrying three ideas, a wall of enumeration where a rule plus a short list would do, a point restated within reach of itself, litigation-history where the rule alone suffices.
3. Compress in place: cut the padding, split the fused sentence or drop its dead clause, collapse the wall, keep a repeated point once. Move nothing to another artifact and re-derive nothing.
4. Preserve every load-bearing claim — a rule, fact, constraint, or example that carries weight. If cutting a word would lose one, keep the word.
5. Respect intended richness: human-facing prose meant to teach or orient (a quickstart, a worked example) earns its length. Compress the bloat, not the accessibility.
6. When the bloat is really duplication across artifacts, or the content has drifted stale, stop and name it: hand duplication to the appropriate deduplication work and drift to the appropriate rewrite work. This skill only tightens; it does not dedup or rewrite.
7. Re-read cold and cut again — the first pass always leaves some.

## Failure and recovery
- Empty-pass: a pass that finds nothing genuinely bloated changes nothing. Report that the artifact is already at load-bearing density.
- Claim-loss: if a cut would drop a load-bearing claim, restore the word and record the near-miss. The done predicate forbids claim loss.
- Misclassified scope: if what looked like bloat is duplication across artifacts or drifted-stale content, do not force-compress. Stop, name the class (duplication or drift), and hand it off. The tightened sections stand; the misclassified sections are reported unchanged with the handoff note.
- Edit safety: assert each edit target exists before mutating; report a MISS rather than a silent no-op. On a MISS, abort the pass and report the missing target.
- Rollback: edits are local and reversible; a failed or aborted pass restores the unverified sections to their pre-pass state.

## Output
- The target artifact with words cut in place to load-bearing density, voice and structure preserved.
- A report listing each section tightened, each load-bearing claim confirmed present, any section left unchanged because it was already dense or was human-facing teaching prose, and any handoff named for duplication or drift.

## Provenance

- Origin: github.com/LilMGenius/paperthin, skills/depth/debloat/SKILL.md, revision 3bca079a51bcfff5dafb53d1d7f9f523d66ee317.
- License: MIT (c) 2026 LilMGenius; NOTICE vendors verbatim material from mattpocock/skills (MIT, (c) 2026 Matt Pocock). The foundry does not copy verbatim vendor material.
- Adaptation: clean-room. The density-compression mechanism, intended-richness respect, and duplication/drift handoff rules are re-expressed; no third-party expression is copied.
