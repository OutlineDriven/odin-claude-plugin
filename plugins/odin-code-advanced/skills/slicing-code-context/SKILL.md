---
name: slicing-code-context
description: 'Use when an exact symbol, path, entrypoint, or line range can bound a focused code question or patch proposal under a fixed source budget. Builds a deterministic slice packet and validates one constrained delegation. Not for source changes or broad repository exploration.'
---

# Slicing code context

## Refuse first

- Reject source mutation: this skill returns proposed edits but never applies them.
- Reject broad or anchorless exploration: require an exact anchor and a focused task.
- Reject lexical approximations when parser-backed graph analysis is unavailable.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A focused code question or patch proposal can be delegated using an exact symbol, path, entrypoint, or line-range anchor under a fixed source budget. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A deterministic slice packet and one constrained worker response, with at most one coordinator-built replacement packet. |
| Done | Packet budget and boundaries validate, every worker claim and proposed edit cites included ranges, uncertain edges remain hypotheses, and consequential conclusions are independently checked by the coordinator. |

## Inputs

- Target source tree root (required): canonical directory containing the source to slice.
- Anchor (required): one repository-relative `FILE:START-END` line range, one exact path, one fully qualified symbol, or one exact entrypoint.
- Worker task (required): concrete question or patch proposal whose answer can be checked from source.
- Mode and depth (optional): `neighborhood` depth 1 by default; `upstream` or `downstream` depth 2–4; `path` or `entrypoint` depth 10–20.
- Peer anchor (required only for `path`): exact second symbol or line range.
- Budget (optional): positive integer estimated-token limit, default 8192.

## Procedure

1. **Validate the request.** Canonicalize the target root. Reject an empty task, an anchor outside the root, an invalid or reversed line range, a mode/depth combination outside the table below, or `path` without a peer.

   | Question | Mode | Depth |
   |---|---|---:|
   | Explain or review one unit with immediate context | `neighborhood` | 1 exactly |
   | Who can reach this sink? | `upstream` | 2–4 |
   | What behavior can this entry trigger? | `downstream` | 2–4 |
   | How does one unit reach another? | `path` | 10–20 |
   | Which public entrypoint reaches this target? | `entrypoint` | 10–20 |

   **Done when:** the root, task, anchor, mode, depth, peer requirement, and positive budget all satisfy the request contract.

2. **Resolve exact anchors.** A line-range anchor resolves only to those live lines. A path anchor resolves to the full file only if it fits the budget; otherwise require a line range or symbol. Resolve a symbol or entrypoint with the repository's available parser-backed symbol/reference index. Sort candidates by repository-relative path, start line, end line, then fully qualified name. Zero matches is `symbol_not_found`; more than one exact-name match is `ambiguous_symbol` and returns the sorted candidates without choosing. If no parser-backed index exists for a graph mode, return `analysis_unavailable`; do not substitute lexical search or hand-selected context.

   **Done when:** the exact live anchor resolves uniquely, or the procedure returns the precise deterministic resolution failure without choosing or approximating.

3. **Construct graph ranges.** The anchor is hop 0. Obtain parser-backed references/calls/import relationships appropriate to the selected mode. `neighborhood` includes the anchor unit plus directly enclosing unit, direct callers/references, and direct callees/dependencies at one hop. `upstream` traverses incoming edges breadth-first; `downstream` traverses outgoing edges breadth-first; `path` takes the shortest directed path from anchor to peer; `entrypoint` takes the shortest reverse path from the anchor to a public entrypoint. At each breadth, sort edges by destination path, destination start/end lines, edge kind, then source path/start/end lines. Deduplicate identical ranges; first discovery wins. Mark an edge `certain` only when the parser/index establishes it; include unresolved dynamic or indirect edges only in `uncertain_edges`, never as traversal proof.

   **Done when:** all included graph ranges obey the selected traversal and deterministic ordering, with indirect or unresolved edges isolated as uncertainty.

4. **Build one deterministic packet.** Use this exact top-level key order and field schema:

   ```json
   {
     "schema": "odin-slice-packet-v1",
     "task": "string",
     "root": "canonical absolute path",
     "anchor": {"kind":"line_range|path|symbol|entrypoint","value":"string"},
     "peer": null,
     "mode": "neighborhood|upstream|downstream|path|entrypoint",
     "depth": 1,
     "budget": {"limit_estimated_tokens":8192,"used_estimated_tokens":0},
     "slices": [
       {"file":"repository/relative/path","start_line":1,"end_line":1,"symbol":null,"hop":0,"relationship":"anchor","certainty":"certain","content":"exact source text"}
     ],
     "uncertain_edges": [
       {"from":"file:start-end","to":"file:start-end or unresolved label","kind":"string","reason":"string"}
     ],
     "omissions": [
       {"candidate":"file:start-end","reason":"budget|depth|uncertain|unavailable"}
     ]
   }
   ```

   `peer` is `null` except in path mode, where it has the same object schema as `anchor`. Store source with LF line endings and no synthetic elision markers. Order slices by hop, file, start line, end line, relationship. Order uncertain edges and omissions lexicographically by all displayed fields. Serialize as compact UTF-8 JSON with no insignificant whitespace and no trailing newline.

   **Done when:** one compact packet matches the schema, key order, source-byte, slice-order, uncertainty-order, omission-order, and newline rules exactly.

5. **Apply the exact budget algorithm.** Start `used_estimated_tokens` at 0. Add candidate slices in the deterministic order from step 4. After each addition, serialize the entire candidate packet, set `used_estimated_tokens = ceil(serialized_UTF8_byte_count / 4)`, and repeat serialization and assignment until the value no longer changes. Keep the candidate only when the stable value is at most the limit. The hop-0 anchor is mandatory: if it alone exceeds the limit, return `anchor_exceeds_budget` and require a narrower line range or a larger explicit budget. Record each rejected non-anchor candidate in `omissions` with reason `budget`, then recompute the same fixed point including the omission records. If omission records themselves push the packet over budget, remove omission records from the end of their sorted order until the fixed-point value fits and append one final summary omission `{"candidate":"additional candidates","reason":"budget"}` if that record fits. Never truncate source content.

   **Done when:** the stable full-packet estimate fits the limit, preserves the complete anchor, and accounts deterministically for every omitted candidate that fits in the omission budget.

6. **Verify before delegation.** Recompute the fixed-point estimate independently; require it to equal `budget.used_estimated_tokens` and not exceed the limit. Require every slice path to remain under the canonical root, every range to satisfy `1 <= start_line <= end_line <= current_file_line_count`, every content value to equal those exact live lines, hop 0 to contain the requested anchor, and graph slices to obey mode/depth. Stop on any mismatch.

   **Done when:** independent recomputation and every root, range, content, anchor, traversal, and budget check pass.

7. **Delegate exactly the bounded material.** Send a fresh read-only worker only: (1) the task string, (2) the packet bytes exactly as serialized, and (3) the worker response schema in Output. Send no conversation history, architecture notes, expected conclusion, repository access, or additional source.

   **Done when:** one fresh read-only worker receives only the task, exact packet bytes, and response schema.

8. **Validate the worker response.** Reject malformed JSON or an unknown field value. For every evidence item and proposed edit, require its file and complete line range to be contained within one packet slice. Require each claim to cite at least one evidence item. A claim based on an `uncertain_edges` entry must be labeled a hypothesis in `uncertainties`. Independently re-read cited packet ranges for every consequential conclusion and record agreement or rejection; the worker cannot authorize or apply an edit.

   **Done when:** the response schema, claim citations, edit containment, uncertainty labels, and independent checks all pass or carry explicit rejection.

9. **Allow at most one replacement packet.** Only `status: needs_context` permits expansion. Each `missing_context` request must name an exact symbol or `FILE:START-END` and explain why it is necessary. Build one replacement packet from the original anchors plus only valid requested ranges, using the same single aggregate budget and algorithm; send it to a fresh worker with the full task. Do not stack packets or allow browsing. If the replacement response still needs context, stop delegation and report the unresolved request.

   **Done when:** the first response is final, or one valid replacement packet receives one fresh response and any remaining context request is reported without further expansion.

## Failure and recovery

### Anchor and traversal failures

| Failure class | Recovery |
|---|---|
| `symbol_not_found` | Return the exact unresolved anchor; require a live exact anchor. |
| `ambiguous_symbol` | Return sorted exact candidates; require one selected candidate. |
| `invalid_depth` | Use neighborhood depth 1, upstream/downstream depth 2–4, or path/entrypoint depth 10–20. |
| `invalid_anchor` or `path_outside_root` | Require a canonical repository-contained path and live range. |
| `analysis_unavailable` | Report the unsupported language/index; do not hand-select or lexically approximate graph context. |
| `anchor_exceeds_budget` | Require a narrower line range or a larger explicit budget. |
| `path_not_found` or `entrypoint_path_not_found` | Report the parser-backed graph gap; increase depth only by an explicit new invocation. |

### Packet integrity failures

| Failure class | Recovery |
|---|---|
| `stale_source` | Rebuild the packet from current bytes before delegation. |
| `packet_invalid` | Report the failed budget, containment, range, content, or traversal check; do not delegate. |
| `worker_output_invalid` | Reject the response and report the schema or citation violation. |

If the worker returns `cannot_answer`, report its reason and packet summary without widening scope. This skill never mutates source; proposed edits remain read-only output.

## Output

The worker returns exactly:

```json
{
  "status":"complete|needs_context|cannot_answer",
  "answer":"string",
  "evidence":[{"claim":"string","file":"string","start_line":1,"end_line":1}],
  "proposed_edits":[{"file":"string","start_line":1,"end_line":1,"replacement":"string","rationale":"string"}],
  "missing_context":[{"symbol_or_range":"string","reason":"string"}],
  "uncertainties":["string"]
}
```

**Output contract:** Return the canonical packet, then the worker response, then a validation report ordered by budget check, citation containment, consequential-claim checks, and proposed-edit disposition; never apply an edit.
