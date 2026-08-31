---
name: reorder-respect-deliberate
description: 'Use when a user asks to fix a listing whose order has gone arbitrary; the skill restructures the listing by a named ordering principle without adding, removing, or rewording any item. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Reorder respect deliberate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to fix a listing whose order has gone arbitrary (list, table, catalog, sections, enum) |
| Authority | May move items within the target listing only; may not add, remove, or rewrite item text |
| Side effect | Moves items only; reword/add/remove nothing |
| Done | A reader can name the ordering principle from the result alone; item set unchanged; kin adjacent; mirrored copies in lockstep |

## Inputs

- `listing`: the full text of the listing to be reordered. Required. If the user does not supply a listing, ask for it before proceeding.
- `principle` (optional): a named ordering principle stated by the user (alphabetical, chronological, severity, size, priority, dependency). If absent, infer it from item content.
- `mirror_paths` (optional): one or more file paths that contain a structural copy of the listing and must be updated in lockstep.

## Procedure

1. **Parse the listing.** Split the input into individual items preserving their exact text verbatim. Determine the structural format (bulleted list, numbered list, table rows, markdown sections, enum values).
2. **Identify intentionally ordered items.** Flag any item that the user has explicitly labeled with a numeric rank, a timestamp, a version, or an explicit ordinal. These items must retain their relative order and must not be moved relative to each other.
3. **Infer the ordering principle.** If `principle` is not supplied, examine item content to determine the most defensible principle (alphabetical, chronological, numeric, severity, size, priority, dependency). If no principle is detectable, report MISS and stop.
4. **Reorder the freely-movable items.** Sort only the items not flagged in step 2 according to the detected or supplied principle. Verify that the new order differs from the current order before applying it.
5. **Verify the done predicate.** Confirm: (a) a reader can name the ordering principle from the result alone, (b) the item set is unchanged, (c) kin items are adjacent, and (d) if `mirror_paths` are supplied, each mirrored copy reflects the same item order.
6. **Write the result.** Apply the reordered listing to the original path. If `mirror_paths` are supplied, apply the identical reorder to each mirror. Emit a one-line summary: the principle applied and the count of items moved.

## Failure and recovery
- **MISS (No ordering principle detectable).** Report "Could not detect an ordering principle from item content." Leave the listing unchanged. Do not attempt to impose an arbitrary order.
- **PARSE.** If the listing cannot be parsed into structured items, report "Could not parse the listing format." Leave the file unchanged.
- **ENTANGLED (Respect-deliberate constraint unsatisfiable).** If preserving intentionally ordered items and the inferred principle produce a conflict, report "Respect-deliberate constraint unsatisfiable: the ordering principle and the stated ranks cannot both hold." Leave the listing unchanged.

**Partial-result rule:** If a lockstep mirror write partially fails (e.g., one of several mirrors is read-only), report the failure for that mirror and write the successfully writable mirrors. Do not consider the operation complete unless every mirror is updated.

**Rollback rule:** If any write operation fails, do not modify the original listing. Do not produce a partially reordered file.

## Output
A local write to the target listing path (and each `mirror_path` if supplied) that contains the same items in the new order. A terminal one-line summary: `<principle> – <N> item(s) moved`.

## Provenance

Origin: `https://github.com/LilMGenius/paperthin` at revision `3bca079a51bcfff5dafb53d1d7f9f523d66ee317`. License: MIT — MIT (c) 2026 LilMGenius. NOTICE: additionally vendors verbatim material from `mattpocock/skills` (MIT, (c) 2026 Matt Pocock) with per-source attribution. Adaptation: clean-room rewrite of `skills/depth/reorder/SKILL.md` into a user-invoked hygiene skill scoped to `odin-create`. The respect-deliberate-order constraint (preserve intentionally ranked items) and MISS reporting are retained from the source. The skill is narrowed to move-only edits with no content mutation.
