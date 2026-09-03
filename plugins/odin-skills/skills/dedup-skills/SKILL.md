---
name: dedup-skills
description: 'Use when asked to deduplicate skills or prompt directories, find repeated rules, or check a skill tree for contradictions. Produces a read-only ledger classifying every repetition cluster and conflict candidate with evidence and zero unclassified cells.'
---

# Dedup skills

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to deduplicate skills/prompts, find repeated rules, or check a skill tree for contradictions. |
| Authority | Read-only: scans a markdown skill/prompt tree and emits a chat ledger. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Produces a repetition/conflict ledger in chat; leaves the scanned tree untouched. |
| Done | Every repetition cluster and conflict candidate is classified repeat/conflict/intentional-keep/not-a-finding, with totals, evidence, and zero unclassified cells. |

## Inputs

- Target tree path (default `skills/`). A prompt-directory tree may be supplied instead.
- The tree's LICENSES/NOTICE/attribution file, if present, is read in full before scanning.

## Procedure

1. **Vendored set.** Read the tree's LICENSES/NOTICE/attribution file in full before any scan. Enumerate every vendored or license-covered path. Report findings inside vendored paths with a vendored annotation and never propose them for deletion. Exclude the attribution file itself from the scan because it is a registry, not prompt content. Done when: every vendored or license-covered path is enumerated and the attribution file is excluded from the scan.
2. **Cluster pass.** Run a mechanical script over all markdown in the tree. Strip YAML frontmatter first. Frontmatter is load-bearing routing data, never a dedup target, and must not enter the scan. Segment the text into paragraphs (skip fenced code), normalize tokens, and cluster near-identical spans. Verify every cluster member against its cluster center; chained transitive grouping pollutes clusters with sub-threshold members. A cluster is a span appearing in ≥2 locations cross-file or ≥2 times in one file. Threshold is verbatim/near-verbatim only (≈0.85 token-shingle Jaccard as guidance, not a rule). Each cluster carries file:line locations and a snippet. Done when: every near-identical span cluster is identified with file:line locations and a snippet, with frontmatter stripped and no transitive pollution.
3. **Conflict pass.** Index directive-modal sentences (must / always / required vs never / do not / forbidden) with sentence-level line attribution, not the enclosing paragraph's first line. Pair sentences that use opposing modals and overlapping content words. Each conflict candidate carries both sentences, both file:line locations, and the overlap score. Before trusting the live result, verify that the detector can fail end to end: point the scanner's root at a fixture tree containing one markdown file with a known opposing pair, run the full discovery → frontmatter-strip → pairing path, and confirm that the pair is flagged. Only then is a zero-candidate live result a real outcome rather than a dead detector. Done when: every opposing-modal pair is identified with both sentences and file:line locations, and the detector is falsifiability-verified against a fixture.
4. **Judgment pass.** Classify every finding from the two separate, complete sets exactly once so the finding set is MECE. The sets are repetition clusters and conflict candidates:
   - `repeat` — real repetition, all copies live, no sync-lineage note. Remedy: shorten in place — every copy stays where it is, compressed to its load-bearing core; no pointer consolidation, no copy deleted. Recommending a sync-lineage annotation is allowed; consolidation is not.
   - `conflict` — genuine opposing directives on one subject. Quote both sides verbatim from source (read each cited line in context before confirming). No default winner: the ledger proposes no resolution; the user resolves each conflict at apply time.
   - `intentional-keep` — documented replication (sync-lineage note, byte-duplicated-by-design header), vendored self-contained relocation, template mirroring its exemplar, or a short self-contained rule. State the reason.
   - `not-a-finding` — false positive (opposing modals on different subjects, scoped exceptions such as rules governing different states or routes, coincidental overlap, template scaffolding). Discharge with a one-line reason.
   Two forms of duplication are legitimate and never findings: a short self-contained rule repeated where needed (duplication of one short rule beats a pointer chain), and replication carrying a sync-lineage note that names its counterpart.

   Done when: every finding from both sets is classified exactly once with the finding set MECE.
5. **Ledger.** Write the ledger: totals per classification, repeat findings grouped into families with per-copy locations and shorten-in-place proposals, conflicts with both sides quoted, discharge reasons for everything else, and the verification performed (spot-checked cluster count, conflict-pass falsifiability). Deliver it without editing the tree. Apply is a separate, later pass gated on per-row or per-family user approval. Done when: the ledger is delivered with totals, families, conflicts, discharge reasons, and verification, and the tree is untouched.

## Failure and recovery
- Empty or missing target tree: stop before scanning; report that no files were scanned. Do not emit an empty ledger as a clean result.
- Dead conflict detector: if the fixture opposing pair is not flagged, the conflict pass is unreliable. Report detector-failure and do not emit a zero-candidate live result as real.
- Unclassified finding remains: the done predicate is not met. Report blocked with the unclassified cell and its evidence; do not deliver a ledger claiming completeness.
- Partial results: never deliver a partial ledger. If any step fails, report the failure class and which set is incomplete.
- Non-mutation rule: the tree is untouched throughout; no rollback is needed because no edit ever lands. Edits happen only in a separate, later, user-approved pass.

## Output
A ledger in chat: totals per classification; repeat findings grouped into families with per-copy file:line locations and shorten-in-place proposals; conflicts with both sides quoted verbatim; one-line discharge reasons for every intentional-keep and not-a-finding; and the verification performed (spot-checked cluster count, conflict-pass falsifiability). The scanned tree is untouched. Apply is a separate, later pass gated on per-row or per-family user approval.
