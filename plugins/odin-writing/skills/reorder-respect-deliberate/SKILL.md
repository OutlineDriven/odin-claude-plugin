---
name: reorder-respect-deliberate
description: 'Use when a user asks to fix a listing whose order has gone arbitrary while preserving intentionally ranked items. Not for freely reorderable listings: use reorder.'
---

# Reorder respect deliberate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to fix a listing whose order has gone arbitrary (list, table, catalog, sections, enum). |
| Authority | Reversible local: writes only the target listing, moving items without adding, removing, or rewriting item text; rollback is version control. No remote mutation. |
| Side effect | Moves items only; reword/add/remove nothing. |
| Done | A reader can name the ordering principle from the result alone; item set unchanged; kin adjacent; mirrored copies in lockstep. |

## Refusals

- **Freely reorderable listings with no intentionally ranked items**: use `reorder`. This skill adds the respect-deliberate constraint, which is unnecessary when no ranks exist.
- Adding, removing, or rewriting item text: rejected. Items are moved only.
- **Imposing an arbitrary order when no principle is detectable**: rejected. Report MISS and stop.

## Inputs

- `listing`: the full text of the listing to be reordered. Required. If the user does not supply a listing, ask for it before proceeding.
- `principle` (optional): a named ordering principle stated by the user (alphabetical, chronological, severity, size, priority, dependency). If absent, infer it from item content.
- `mirror_paths` (optional): one or more file paths that contain a structural copy of the listing and must be updated in lockstep.

## Procedure

1. Parse the listing. Split the input into individual items while preserving their exact text. Determine the structural format (bulleted list, numbered list, table rows, markdown sections, enum values). **Done when**: the listing is parsed into individual items with exact text preserved.
2. Identify intentionally ordered items. Flag any item that the user has explicitly labeled with a numeric rank, a timestamp, a version, or an explicit ordinal. These items must not move relative to each other. **Done when**: every intentionally ordered item is flagged.
3. Infer the ordering principle. If `principle` is not supplied, use the item content to choose the most defensible principle (alphabetical, chronological, numeric, severity, size, priority, dependency). If no principle is detectable, report MISS and stop. **Done when**: the principle is identified or MISS is reported.
4. Reorder the freely movable items. Sort only the items not flagged in step 2 according to the detected or supplied principle. Verify that the new order differs from the current order before applying it. **Done when**: freely movable items are sorted by the principle.
5. Verify the done predicate: (a) a reader can name the ordering principle from the result alone, (b) the item set is unchanged, (c) kin items are adjacent, and (d) if `mirror_paths` are supplied, each mirrored copy reflects the same item order. **Done when**: all four checks pass.
6. Write the result. Apply the reordered listing to the original path. If `mirror_paths` are supplied, apply the identical reorder to each mirror. Emit a one-line summary: the principle applied and the count of items moved. **Done when**: the listing and all mirrors are written.

## Failure and recovery

- MISS (no ordering principle detectable): report "Could not detect an ordering principle from item content." Leave the listing unchanged. Do not impose an arbitrary order.
- PARSE: if the listing cannot be parsed into structured items, report "Could not parse the listing format." Leave the file unchanged.
- **ENTANGLED (respect-deliberate constraint unsatisfiable)**: if preserving intentionally ordered items and the inferred principle produce a conflict, report "Respect-deliberate constraint unsatisfiable: the ordering principle and the stated ranks cannot both hold." Leave the listing unchanged.

If a lockstep mirror write partially fails (e.g., one of several mirrors is read-only), report the failure for that mirror and write the successfully writable mirrors. Do not consider the operation complete unless every mirror is updated. If any write operation fails, do not modify the original listing. Do not produce a partially reordered file.

## Output

A local write to the target listing path (and each `mirror_path` if supplied) with the same items in the new order, plus a terminal one-line summary: `<principle> – <N> item(s) moved`.
