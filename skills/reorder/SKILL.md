---
name: reorder
description: 'Use when asked to reorder a drifted listing under one stated principle, moving items only and rewording nothing. Use on a catalog, index, table of contents, enum, or menu whose order has gone arbitrary, or when the user says "reorder this" or "put this in a sensible order". Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Reorder

## Contract

| Field | Bound contract |
|---|---|
| Trigger | catalog/index/toc/enum/menu whose order went arbitrary, or user says reorder this / sensible order |
| Authority | reversible-local: write only the named local artifact; VCS state is the rollback path |
| Side effect | repositions items in a listing (and mirrored copies) without content edits |
| Done | reader can name the ordering principle; every item still present, kin adjacent |

## Inputs

Only the listing and a stated principle. The listing is either supplied or identified from context. The principle may be named by the user, inferred from the existing sequence, or selected from: workflow sequence, dependency order, grouping by kind, severity, frequency, or alphabetical.

## Procedure

1. **Pin the listing.** Identify the ordered set in focus. Count the items to establish the full scope before any mutation.
2. **Name one principle.** Extract it from user input, the existing sequence, or a stated default. State it explicitly before the first move.
3. **Verify scope.** Confirm every item in the listing belongs in this scope. Note any mirrored copies that must carry the identical order.
4. **Cluster kin, then sequence.** Keep related items adjacent, then order the clusters by the stated principle. Maintain intra-cluster order. Do not blend incompatible sorts.
5. **Move in place.** Reposition items without rewording, adding, or removing any content. Do not rephrase labels, descriptions, or metadata. If the same set is mirrored elsewhere, apply the identical order to each.
6. **No-op pass.** A pass that finds nothing to genuinely improve changes nothing.

## Failure and recovery
- **Ambiguous scope:** The listing boundaries or item set are unclear. Stop and ask the user to identify or supply the exact target.
- **Mixed item types:** The set contains items that do not share a common ordering principle. Stop and ask which subset to reorder, or which principle to apply.
- **Principle unknown:** Surface the best guess and wait for explicit confirmation before proceeding.
- **Rollback:** If a reposition corrupts or loses content, restore from VCS. This authority is reversible-local; the working tree is the only mutation surface.
- **Partial fit:** If the stated principle fits some items but not all, sequence the compatible subset and note the remainder as out-of-scope.

## Output
A repositioned listing: the reader can name the ordering principle from the result. Every item that was present is still present, only repositioned. Kin are adjacent. Mirrored copies carry the identical order. If nothing genuinely needed reordering, the original is returned unchanged.

## Provenance

Origin: odin-current. Revision: none pinned. License: project-owned (no third-party license applies). Adaptation: the source `skills/reorder/SKILL.md` was restructured into this contract section format. The source `disable-model-invocation: true` flag conflicts with the current reversible-local authority profile and is removed: a reversible in-place move is a safe public skill under model+human invocation.
