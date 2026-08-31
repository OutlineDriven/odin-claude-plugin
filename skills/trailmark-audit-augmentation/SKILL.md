---
name: trailmark-audit-augmentation
description: 'Use when a SARIF, weAudit, or supported binary graph export must be projected onto an existing Trailmark code graph and cross-referenced with preanalysis evidence. All supported inputs are imported, matched and unmatched counts are reported, and graph context is attached without promoting imported findings beyond their source status. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Trailmark audit augmentation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A SARIF, weAudit, or supported binary graph export must be projected onto an existing Trailmark code graph and cross-referenced with preanalysis evidence. |
| Authority | Reversible local writes only; state the rollback path before writing. |
| Side effect | Trailmark graph annotations and severity/tool-specific subgraphs; may create an augmented graph export. To roll back, delete the augmented export or remove annotations by source tag. |
| Done | All supported inputs are imported, matched and unmatched counts are reported, and graph context is attached without promoting imported findings beyond their source status. |

## Inputs

- **Required**: An existing Trailmark code graph built for the target repository, plus at least one of: a SARIF 2.1.0 results file, a `.weaudit` annotation file, or a binary graph JSON export (Trailmark 0.4.0+).
- **Optional**: Preanalysis evidence from `engine.preanalysis()` for cross-referencing findings with blast radius and taint data. Additional SARIF/weAudit files for multi-source import.

## Procedure

1. **Verify the graph exists.** Confirm the target repository has a built Trailmark code graph. If `QueryEngine.from_directory()` fails, stop and direct the user to build the graph first.
2. **Run preanalysis.** Call `engine.preanalysis()` to produce blast radius and taint subgraphs. If preanalysis was already run in this session, skip. Preanalysis is required for cross-referencing; do not skip it on first augmentation.
3. **Locate input files.** Identify all SARIF results files, `.weaudit` annotation files, and binary graph JSON exports supplied by the user. Record each file path and format.
4. **Version-gate binary imports.** Before calling `engine.augment_binary()`, verify `hasattr(engine, "augment_binary")`. If the attribute is absent, report that binary augmentation requires Trailmark >= 0.4.0 and skip binary inputs. Do not invent a CLI flag if `trailmark augment --help` does not show one.
5. **Run augmentation.** For each input file:
   - SARIF: call `engine.augment_sarif("path/to/results.sarif")`.
   - weAudit: call `engine.augment_weaudit("path/to/file.weaudit")`.
   - Binary graph (v0.4+): call `engine.augment_binary("path/to/binary_graph.json")`.
   Record the result of each call: `matched_findings`, `unmatched_findings`, and `subgraphs_created`.
6. **Report matched and unmatched counts.** For each augmented source, report the number of matched findings and unmatched findings. If `unmatched_findings` is high relative to total findings, investigate whether file paths are misaligned or out-of-scope.
7. **Query findings and subgraphs.** Use `engine.findings()` to list all annotated nodes. Use `engine.subgraph_names()` to enumerate available subgraphs. Query severity subgraphs (`sarif:error`, `sarif:warning`, `sarif:note`, `weaudit:high`, `weaudit:medium`, `weaudit:low`) and tool-specific subgraphs (`sarif:<tool_name>`, `weaudit:findings`, `weaudit:notes`, `binary:<artifact>`).
8. **Cross-reference with preanalysis.** Overlap severity subgraphs with preanalysis subgraphs to prioritize:
   - Findings on tainted nodes: overlap `sarif:error` with `tainted`.
   - Findings on high blast radius nodes: overlap with `high_blast_radius`.
   - Findings on privilege boundaries: overlap with `privilege_boundary`.
9. **Attach graph context without promotion.** Record the cross-reference results. Do not promote imported findings beyond their source status: a SARIF `warning` remains a `warning` even if it lands on a tainted node. The cross-reference is for triage prioritization, not severity reclassification.
10. **Emit the augmentation report.** Return a report containing: each source imported, matched/unmatched counts per source, subgraphs created, cross-reference highlights, and any skipped inputs with reasons.

## Failure and recovery
- **Missing graph**: The target repository has no built Trailmark code graph. Emit a blocked result with reason `no-graph`. Direct the user to build the graph first. Do not attempt to build the graph as part of augmentation.
- **Missing preanalysis**: `engine.preanalysis()` was not called and cannot be called. Emit the augmentation results without cross-reference. Report that cross-referencing is unavailable. Do not fabricate cross-reference data.
- **Version gate failure**: Binary augmentation is requested but Trailmark < 0.4.0. Report the version requirement and skip binary inputs. Continue with SARIF and weAudit inputs.
- **Malformed input**: A SARIF or weAudit file fails to parse. Report the parse error with the file path. Continue with remaining inputs. Do not attempt to repair malformed files.
- **High unmatched count**: More than 50% of findings from a source are unmatched. Report the count and suggest the user verify file paths are relative to the graph root. Do not widen the matching heuristic.
- **Partial result**: If the procedure is interrupted after step 5, emit the augmentation results collected so far. Report which sources were fully processed and which were not.
- **Rollback**: All writes target Trailmark annotations and optional augmented graph exports. To roll back, delete the augmented export file or remove annotations by source tag (`sarif:<tool>`, `weaudit:<author>`, `binary:<artifact>`).

## Output
An augmentation report containing:
- **Sources imported**: Each file path and format (SARIF, weAudit, binary graph).
- **Matched findings**: Count per source.
- **Unmatched findings**: Count per source with investigation guidance if high.
- **Subgraphs created**: Names and contents of all severity and tool-specific subgraphs.
- **Cross-reference highlights**: Findings that overlap with tainted nodes, high blast radius nodes, or privilege boundaries.
- **Skipped inputs**: Any inputs that could not be processed with reasons.

## Provenance

Adapted from Trail of Bits trailmark audit-augmentation skill.
- Origin: https://github.com/trailofbits/skills
- Revision: d1f1575cff97816e5cc08af66cd2506099c681d3
- License: CC-BY-SA-4.0; source https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3; preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding.
- Adaptation: Clean-room rewrite for ODIN 2.0 module odin-code-advanced. Procedure derived from source mechanisms (SARIF import, weAudit import, binary graph import, severity subgraph creation, preanalysis cross-referencing). No third-party expression copied.
