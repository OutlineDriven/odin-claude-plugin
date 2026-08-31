---
name: dedup-skills
description: 'Use when the user asks to deduplicate skills or prompt directories, find rules repeated across or within skill files, or check a skill tree for contradictions. Produces a no-edit ledger classifying every repetition cluster and conflict candidate with evidence and zero unclassified cells. Don''t use for tasks that require source or remote-system changes.'
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

1. **Vendored set.** Read the tree's LICENSES/NOTICE/attribution file in full before any scan. Enumerate every vendored or license-covered path. Findings inside vendored paths are reported with a vendored annotation and never proposed for deletion. The attribution file itself is excluded from the scan (registry, not prompt content).
2. **Cluster pass.** Run a mechanical script over all markdown in the tree. Strip YAML frontmatter first — frontmatter is load-bearing routing data and never a dedup target, so it never enters the scan. Segment into paragraphs (skip fenced code), normalize tokens, and cluster near-identical spans so that every member of a cluster verifies against its cluster center — chained transitive grouping pollutes clusters with sub-threshold members. A cluster is a span appearing in ≥2 locations cross-file or ≥2 times in one file. Threshold is verbatim/near-verbatim only (≈0.85 token-shingle Jaccard as guidance, not a rule). Each cluster carries file:line locations and a snippet.
3. **Conflict pass.** Index directive-modal sentences (must / always / required vs never / do not / forbidden) with sentence-level line attribution — not the enclosing paragraph's first line. Pair sentences with opposing modals on overlapping content words into conflict candidates, each carrying both sentences, both file:line locations, and the overlap score. Before trusting the live result, verify the detector can fail end-to-end: point the scanner's root at a fixture tree containing one markdown file with a known opposing pair, run the full discovery → frontmatter-strip → pairing path, and confirm the pair is flagged. A zero-candidate live result is then a real outcome, not a dead detector.
4. **Judgment pass.** Classify every finding from both sets — repetition clusters and conflict candidates are separate, complete sets — exactly once, so the finding set is MECE:
   - `repeat` — real repetition, all copies live, no sync-lineage note. Remedy: shorten in place — every copy stays where it is, compressed to its load-bearing core; no pointer consolidation, no copy deleted. Recommending a sync-lineage annotation is allowed; consolidation is not.
   - `conflict` — genuine opposing directives on one subject. Quote both sides verbatim from source (read each cited line in context before confirming). No default winner: the ledger proposes no resolution; the user resolves each conflict at apply time.
   - `intentional-keep` — documented replication (sync-lineage note, byte-duplicated-by-design header), vendored self-contained relocation, template mirroring its exemplar, or a short self-contained rule. State the reason.
   - `not-a-finding` — false positive (opposing modals on different subjects, scoped exceptions such as rules governing different states or routes, coincidental overlap, template scaffolding). Discharge with a one-line reason.
   Two duplications are legitimate and never findings: a short self-contained rule repeated where it is needed (duplication of one short rule beats a pointer chain), and replication carrying a sync-lineage note that names its counterpart.
5. **Ledger.** Write the ledger: totals per classification, repeat findings grouped into families with per-copy locations and shorten-in-place proposals, conflicts with both sides quoted, discharge reasons for everything else, and the verification performed (spot-checked cluster count, conflict-pass falsifiability). Deliver it without editing the tree. Apply is a separate, later pass gated on per-row or per-family user approval.

## Failure and recovery
- **Empty or missing target tree:** stop before scanning; report that no files were scanned. Do not emit an empty ledger as a clean result.
- **Dead conflict detector:** if the fixture opposing pair is not flagged, the conflict pass is unreliable. Report detector-failure and do not emit a zero-candidate live result as real.
- **Unclassified finding remains:** the done predicate is not met. Report blocked with the unclassified cell and its evidence; do not deliver a ledger claiming completeness.
- **Partial results:** never deliver a partial ledger. If any step fails, report the failure class and which set is incomplete.
- **Non-mutation rule:** the tree is untouched throughout; no rollback is needed because no edit ever lands. Edits happen only in a separate, later, user-approved pass.

## Output
A ledger in chat: totals per classification; repeat findings grouped into families with per-copy file:line locations and shorten-in-place proposals; conflicts with both sides quoted verbatim; one-line discharge reasons for every intentional-keep and not-a-finding; and the verification performed (spot-checked cluster count, conflict-pass falsifiability). The scanned tree is untouched. Apply is a separate, later pass gated on per-row or per-family user approval.

## Provenance

Origin: odin-1.x current skill at `skills/dedup-skills/SKILL.md`. No revision pinned. License: project-owned. Adapted to the ODIN 2.0 self-contained literal, preserving the vendored-set, frontmatter-strip cluster, conflict-falsifiability, judgment-classification, and no-edit-ledger mechanisms.
