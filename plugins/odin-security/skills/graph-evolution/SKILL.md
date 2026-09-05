---
name: graph-evolution
description: 'Use when two refs or source snapshots need security-relevant structural comparison a line diff may miss. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Graph evolution

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user provides two refs or source snapshots and needs security-relevant structural changes that a line diff may miss. |
| Authority | Reversible local: writes only temporary snapshot worktrees, graph export JSON, structural diff JSON, and a GRAPH_EVOLUTION report; rollback is deleting those artifacts. No remote mutation. Worktrees are removed after the report is written. |
| Side effect | Temporary snapshot worktrees and graph exports, structural diff JSON, and a GRAPH_EVOLUTION report; temporary worktrees are removed afterward. |
| Done | Both snapshots have healthy graph summaries, all node/edge/entrypoint/subgraph changes are classified with limitations, and temporary worktrees are accounted for. |

## Inputs

- before_ref (required): git ref, commit, tag, or directory path for the earlier snapshot.
- after_ref (required): git ref, commit, tag, or directory path for the later snapshot.
- language (optional, default `auto`): the language set to parse. Override with a single name (`rust`, `solidity`) or comma-separated list (`python,rust`) when `auto` fails or misselects.
- trailmark (prerequisite tool): must be installed and on PATH. If `trailmark --help` fails, stop and report that trailmark is not installed. Do not fall back to manual source reading as a substitute.

## Procedure

1. **Validate inputs.** Confirm both refs resolve or both directory paths exist. Confirm trailmark is installed by running `trailmark --help`. If trailmark is not installed, stop and report the installation gap; do not install it. Done when: both refs resolve to commits or both directory paths exist, and `trailmark --help` exits 0.

2. **Create snapshots.** If both inputs are git refs, create temporary worktrees from the repo root using `mktemp -d` directories: `git worktree add "$BEFORE_DIR" {before_ref}` and `git worktree add "$AFTER_DIR" {after_ref}`. If both inputs are directory paths, use them directly and skip worktree creation. Done when: two snapshot directories exist, either as worktrees created from the refs or as the supplied directory paths, and both are non-empty.

3. **Build graphs and run pre-analysis on both snapshots.** For each snapshot directory, build a Trailmark code graph, run pre-analysis, and export JSON: Done when: both exported graph JSON files exist, both summaries report non-zero node counts, and pre-analysis ran on both snapshots.
   ```python
   from trailmark.query.api import QueryEngine
   engine = QueryEngine.from_directory(target_dir, language=language)
   engine.preanalysis()
   with open(output_path, "w") as f:
       f.write(engine.to_json())
   summary = engine.summary()
   ```
   Pre-analysis computes blast radius, taint propagation, privilege boundaries, and entrypoint enumeration. Skipping it makes those changes invisible in the diff. Verify both summaries report non-zero node counts. If either summary has zero or implausibly small node counts for the target, the parse missed the code; name the language set explicitly and re-run.

4. **Compute the native structural diff.** Run `trailmark diff --json --language {language} "{before_dir}" "{after_dir}"` and capture the JSON. Always pass `--language` explicitly: the flag defaults to `python`, and on any other target that default exits 0 with empty `nodes`, `edges`, and `entrypoints` arrays, so an empty diff reads identically whether the code is unchanged or the language was wrong. Use the same language value that Phase 3 built with. Done when: the native structural diff JSON is captured, the --language flag matches the Phase 3 value, and the diff arrays are populated or confirmed empty against healthy node counts.

5. **Compute the subgraph membership diff.** Compare the two exported graph JSONs to derive per-subgraph membership changes (`tainted`, `high_blast_radius`, `privilege_boundary`, and related sets). Use the trailmark plugin's `graph_diff.py` helper if available, passing `--before` and `--after` paths to the exported JSONs; otherwise compute set differences directly from the exported `subgraphs` fields. Done when: the subgraph membership diff is computed from the two exported JSONs, and every changed subgraph set is listed with its added and removed members.

6. **Interpret the diff.** Read both diff JSON files. Classify changes in priority order: (1) new tainted paths: nodes entering the `tainted` subgraph, especially those in added edges targeting sensitive functions; (2) privilege boundary changes: new or removed trust transitions; (3) attack surface growth: new entrypoints, especially `untrusted_external`; (4) blast radius increases: nodes entering `high_blast_radius`; (5) complexity spikes: cyclomatic complexity increases greater than 3 on tainted or entrypoint-reachable nodes; (6) structural additions: new nodes and edges; (7) structural removals: verify removed security functions were replaced, not just deleted. Done when: every structural change is classified into one of the seven priority categories with node IDs or edge diffs as evidence, and no change is left unclassified.

7. **Assign severity to every finding.** CRITICAL: new tainted path to sensitive function, removed auth boundary. HIGH: new entrypoint with high blast radius, large CC increase on tainted node. MEDIUM: new trust-boundary-crossing edges, moderate CC increase. LOW: added nodes without entrypoint reachability. INFO: dead code removal, complexity reductions. Classify every change, including removals; INFO-level changes can mask removed security checks. Done when: every classified change carries a severity label from CRITICAL through INFO, including removals, and the severity assignment is recorded in the report draft.

8. **Cross-reference with source diff.** Run `git diff {before_ref}..{after_ref}` to add source-level context to findings. Done when: git diff output is captured and source-level context is attached to each finding that names a specific node or edge.

9. **Write the report.** Write `GRAPH_EVOLUTION_{project}_{before_ref}_{after_ref}.md` containing: a summary table (total nodes, functions, classes, call edges, entrypoints: before, after, delta); critical structural changes with severity, evidence (node IDs, edge diffs), security impact, and recommendation; attack surface evolution (new and removed entrypoints with trust levels); complexity evolution (increased and decreased CC); taint propagation changes (newly tainted and de-tainted nodes); blast radius shifts (nodes entering and leaving high_blast_radius); privilege boundary changes (new and removed boundary crossings); added and removed nodes; added and removed call edges; and a methodology section stating the tool, both snapshot refs, pre-analysis steps, and honest limitations. Done when: the report file GRAPH_EVOLUTION_{project}_{before_ref}_{after_ref}.md exists on disk and contains every required section: summary table, critical changes, attack surface, complexity, taint, blast radius, privilege boundaries, added and removed nodes and edges, and methodology.

10. **Clean up worktrees.** After the report is written, remove temporary worktrees: `git worktree remove "$BEFORE_DIR"` and `git worktree remove "$AFTER_DIR"`. Account for their removal in the report methodology section. Done when: both temporary worktrees are removed (git worktree list shows neither), and the report methodology section records their removal.

## Failure and recovery
- trailmark not installed: Report the installation gap and stop. Do not install. Do not fall back to manual source reading or text-diff comparison as a substitute; manual comparison misses what graph analysis catches.
- Empty native diff: An all-empty `nodes`, `edges`, and `entrypoints` diff means either nothing changed structurally or both snapshots parsed to near-empty graphs. Decide which using the Phase 3 summaries: if either snapshot's node count is zero or implausibly small, the parse missed the code; name the language set explicitly and re-run. Healthy node counts on both snapshots plus an empty diff is genuine structural stability.
- Language misselection: `trailmark diff` defaults `--language` to `python` and exits 0 with empty arrays on any other target. Always pass `--language` explicitly. `auto` detects and merges every supported language found; it fails loudly with `No supported languages detected under <path>` when a snapshot holds nothing parseable, which is the desired outcome. Confirm the language first; only then can an empty diff count as evidence that nothing changed.
- Diff command fails or writes empty JSON: Stop and report the error. Do not continue to report generation.
- Pre-analysis skipped: Without pre-analysis, taint changes, blast radius growth, and privilege boundary shifts are invisible. Always run `engine.preanalysis()` on both snapshots.
- Partial-result rule: If one snapshot builds but the other fails, report which failed and why. Do not generate a report from a single snapshot; single-snapshot analysis cannot detect evolution.
- Rollback: All writes are to temporary directories and the report file. Worktrees are removed in step 10. If any step fails before cleanup, remove worktrees manually and report the incomplete state.

## Output
A `GRAPH_EVOLUTION_{project}_{before_ref}_{after_ref}.md` report containing: a summary metric table; critical structural changes with severity, evidence, and recommendations; attack surface evolution; complexity evolution; taint propagation changes; blast radius shifts; privilege boundary changes; added and removed nodes and edges; and a methodology section with honest limitations. Temporary worktrees are removed and their removal is accounted for in the report.
