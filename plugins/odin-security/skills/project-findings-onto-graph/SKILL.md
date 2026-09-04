---
name: project-findings-onto-graph
description: 'Use when SARIF, reviewer annotations, or third-party findings must be projected onto a program graph. Not for building graph: use build-program-graph. Not for triage: use triage-security-finding.'
---

# Project findings onto a program graph

External findings land as flat lists: a SARIF file, a reviewer's annotation export, another tool's JSON. They mean more on the graph, where a finding attaches to the function it points at and can be cross-referenced against what preanalysis already knows about that function: taint, blast radius, trust boundaries. This skill projects the findings onto the graph and reports what matched, what did not, and which findings sit on security-relevant nodes. An imported finding never gains severity from the graph; a `warning` stays a `warning` even on a tainted node.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A supported finding export must be projected onto an existing program graph and cross-referenced with preanalysis evidence. |
| Authority | Reversible local: writes only graph annotations, severity or tool-specific subgraphs, and an optional augmented graph export; rollback is deleting the augmented export or removing annotations by source tag. No remote mutation. |
| Side effect | Graph annotations and severity or tool-specific subgraphs derived from the imports; optionally an augmented graph export. Roll back by deleting the augmented export or removing annotations by source tag. |
| Done | All supported inputs are imported, matched and unmatched counts are reported, and graph context is attached without promoting imported findings beyond their source status. |

## Inputs

- Required: A program graph already built for the target repository (build one with build-program-graph if none exists), plus at least one finding export the graph tool can import. SARIF 2.1.0 results files are the standard import; reviewer annotation files and other tool exports count when the graph tool documents an importer or the format carries file-and-line anchors.
- Optional: Precomputed preanalysis evidence (blast radius, taint, privilege boundaries) for cross-referencing. Additional export files for multi-source import.

## Refusals

- Will not build the graph as part of augmentation; direct the user to build-program-graph first.
- Will not promote imported findings beyond their source status.
- Will not fabricate cross-reference data when preanalysis is unavailable.
- Will not widen the matching heuristic when unmatched counts are high.

## Procedure

1. **Verify the graph exists.** Confirm the target repository has a built program graph by loading it with the graph tool's own API. If the load fails, stop and direct the user to build the graph first; do not build it here. **Done when:** the graph is confirmed.
2. **Run or locate preanalysis.** Cross-referencing needs the preanalysis passes (blast radius, entrypoints, privilege boundaries, taint). If they were already run in this session, reuse them; otherwise run them now on the loaded graph. Preanalysis is required for cross-referencing; do not skip it on first augmentation. **Done when:** preanalysis evidence is available or its absence is recorded.
3. **Locate input files.** Identify every finding export supplied by the user. Record each file path and its format. **Done when:** every input file is recorded with its format.
4. **Gate optional importers.** Before using an importer that exists only in newer tool versions, probe for it (feature or attribute check against the loaded graph object). If absent, report the requirement and skip the inputs that need it. Do not invent a CLI flag or API that the installed build does not expose. **Done when:** optional importers are gated and skipped or cleared.
5. **Run the projection.** For each input file, project it onto the graph with the tool's import method for that format; when the tool has no importer for a format, match findings to nodes yourself by resolving each finding's source location (file path plus line range, normalized to the graph root) to the node whose span contains it, and record that the match was made manually. Record per source: matched findings, unmatched findings, and subgraphs created. **Done when:** every input file is projected with its result recorded.
6. **Report matched and unmatched counts.** Per source, report both counts. If unmatched findings are high relative to the total, investigate whether file paths are misaligned or out of scope. Do not widen the matching heuristic to force matches. **Done when:** matched and unmatched counts are reported per source.
7. **Enumerate findings and subgraphs.** List the annotated nodes and the named subgraphs the projection created. Severity subgraphs follow the import format's own severity vocabulary (for SARIF: `sarif:error`, `sarif:warning`, `sarif:note`); tool or source subgraphs follow the source tag (for example `sarif:<tool>`, `weaudit:<author>`, `binary:<artifact>`). **Done when:** findings and subgraphs are enumerated.
8. **Cross-reference with preanalysis.** Overlap the severity subgraphs with the preanalysis subgraphs to prioritize: findings on tainted nodes, findings on high blast radius nodes, findings on privilege boundaries. **Done when:** cross-reference results are recorded.
9. **Attach context without promotion.** Record the cross-reference results as prioritization input. Do not reclassify imported findings; the source status is authoritative. **Done when:** context is attached with source status preserved.
10. **Emit the augmentation report.** Return a report containing each source imported, matched and unmatched counts per source, subgraphs created, cross-reference highlights, and any skipped inputs with reasons. **Done when:** the augmentation report is emitted.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Missing graph | Emit a blocked result with reason `no-graph`; direct the user to build-program-graph. Do not attempt to build the graph. |
| Missing preanalysis | Emit the augmentation results without cross-reference and say so. Do not fabricate cross-reference data. |
| Version-gated importer absent | Report the requirement and skip those inputs; continue with the formats the installed build supports. |
| Malformed input | Report the parse error with the file path; continue with remaining inputs. Do not attempt to repair malformed files. |
| High unmatched count | Report the count and suggest verifying file paths are relative to the graph root. Do not widen the matching heuristic. |
| Partial result | If interrupted after the projection step, emit the results collected so far and state which sources were fully processed. |
| Rollback | Delete the augmented export file or remove annotations by source tag (`sarif:<tool>`, `weaudit:<author>`, `binary:<artifact>`). |

## Output

An augmentation report ordered as sources imported (path and format), matched and unmatched findings per source, subgraphs created, cross-reference highlights (tainted nodes, high blast radius, privilege boundaries), skipped inputs with reasons.
