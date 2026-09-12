---
name: visual-diagram
description: 'Use when asked to diagram, or a tool or --quick flag renders a structured spec to HTML. Modes: interactive, quick-render. Interactive families: flowchart, structural, illustrative, architecture (components, boundaries, or two-snapshot delta compare), dataflow (data movement, ETL or ELT, lineage, custody), lifecycle (states, waits, retries, transitions, terminals), sequence (time-ordered interaction between participants), workflow (process, approval flow, runbook, CI/CD path, responsibility lanes, or tool calls). Not for Excalidraw or documents: use visual-argument-diagram or diagramming-code.'
---

# Visual diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to diagram, draw, map out, walk through, illustrate, or visually explain a topic, system, process, architecture, data movement or lineage, entity lifecycle, time-ordered interaction, or workflow; or supplies two architecture snapshots for delta comparison. A model tool call or the literal `--quick` flag asks to render a structured spec for `diagram`, `diff-review`, `plan-review`, or `project-recap` to a self-contained HTML document. |
| Authority | Reversible local: HTML artifact mode writes one named local HTML file; absorbed families additionally write the JSON specification and receipt beside it; rollback is deleting those files. No remote mutation. SVG mode is read-only with no file mutation. |
| Side effect | Writes a self-contained HTML file under the output path and may open it; absorbed families (`architecture`, `dataflow`, `lifecycle`, `sequence`, `workflow`) additionally write a frozen typed JSON specification of the extracted facts plus a JSON receipt binding the specification hash, artifact hash, and visual-review status; or emits an SVG in a chat visualizer fence. |
| Done | For HTML and quick-render modes: a complete, validated, self-contained HTML file exists at the output path; for absorbed families (`architecture`, `dataflow`, `lifecycle`, `sequence`, `workflow`), a frozen validated JSON specification of the extracted facts and a JSON receipt binding the specification hash, artifact hash, and truthful visual-review status also exist. For SVG mode: a valid SVG diagram is in the visualizer fence. |

## Refusals

- Slides, fact-check, visual plans, PPTX, themes, or updates with the `--quick` flag: this skill does not apply. Stop.
- Delta comparison output classifies authored additions, removals, and modifications only: it asserts no risk assessment, blast-radius estimate, runtime causality claim, or merge recommendation.
- `dataflow`, `lifecycle`, and `sequence` admit only user-stated facts: a flow, stage, custody assignment, state, transition, participant, message, or causal edge the user did not state never enters the diagram - ask for the missing fact instead. `architecture` and `workflow` may add repository-backed facts only when verified per Procedure step 3; unverified claims are discarded.
- Partial HTML artifact surviving on disk after any failure: rejected. Any partial output is deleted.

## Inputs

- Mode (required): `interactive` or `quick-render`.
- Mode `interactive`:
  - Diagram request (required): the concept, system, process, or structure to visualise; and an optional diagram family (`flowchart`, `structural`, `illustrative`, `architecture`, `dataflow`, `lifecycle`, `sequence`, or `workflow`), inferred from the request when absent.
  - Output format (required): `html` or `svg`. Infer from the request; see Procedure step 1. Absorbed families (`architecture`, `dataflow`, `lifecycle`, `sequence`, `workflow`) always deliver the self-contained interactive HTML artifact with their JSON specification and receipt; SVG applies only to `flowchart`, `structural`, and `illustrative`.
  - Style direction (optional): color, font, or layout hint for HTML format.
  - Surrounding context (optional): code, architecture, or conversation context.
  - Family-required inputs (never invented; stop and ask when absent):
    - `architecture`: the components, boundaries, and relationships to depict, plus an optional repository path whose claims are verified with cited lines; delta comparison requires two already-authored snapshots (before and after) and an optional label pair.
    - `dataflow`: sources, stores, consumers, transformation stages, custody owners, and the flows between them.
    - `lifecycle`: the entity or process name, every state with its kind, and every legal transition; optional ordered phases, lanes, guards, decision conditions, and retry counts.
    - `sequence`: a diagram name determining the exact output paths `<name>.sequence.json` and `<name>.sequence.html` (if either target file already exists, stop and ask to confirm overwrite or supply a different name), participant names, message names, direction, and source order; optional activations and variants; at least 2 participants and 1 message.
    - `workflow`: phases, lanes, groups, nodes, edges, the main path, and relationship labels, plus an optional repository path whose claims are verified with cited lines.
  - Absorbed-family delivery: `architecture`, `dataflow`, `lifecycle`, `sequence`, and `workflow` additionally freeze their extracted facts as a typed JSON specification written beside the artifact, validate that specification fail-closed (any violation blocks delivery), and deliver a JSON receipt binding the specification hash, the artifact hash, and a truthful visual-review status (`reviewed` only when the rendered artifact was actually inspected).
- Mode `quick-render`:
  - Source spec (required): the structured spec object from an upstream outcome.
  - Output filename (optional): name under the output jail. Defaults to `render-<timestamp>.html`.
  - Visual format (optional): `diagram`, `flowchart`, `tree`, `timeline`, `grid`, or `table`. Inferred from the spec if omitted.
  - Schema (required): the JSON schema that defines a valid spec plan.

## Procedure

1. **Determine the mode and inputs.** Select `quick-render` when the invocation carries the literal `--quick` flag or is a model tool call that carries a structured spec. Select `interactive` when the user asks for a diagram, map, illustration, or visual explanation. If the request is ambiguous, ask the user to clarify before generating. State the chosen mode and its authority. Done when: the mode is chosen and its authority is stated, or clarification is requested.
2. **Classify the content.**
   - Mode `interactive`: classify the diagram family from the request and context. Classify as `flowchart` (sequential steps, decision points, process walkthrough), `structural` (components, relationships, containment, data flow), `illustrative` (conceptual explanation, not strictly sequential or structural), `architecture` (system components, boundaries, and runtime or deployment structure; or delta comparison of two supplied snapshots), `dataflow` (data movement, ETL or ELT, lineage, custody), `lifecycle` (states, waits, retries, transitions, terminals), `sequence` (time-ordered interaction between participants), or `workflow` (process, approval flow, runbook, CI/CD path, responsibility lanes, tool calls). If ambiguous, ask the user to clarify. Done when: family is classified or clarification is requested.
   - Mode `quick-render`: confirm the outcome type is one of `diagram`, `diff-review`, `plan-review`, or `project-recap`. If the outcome is `slides`, `fact-check`, `visual-plans`, `pptx`, `themes`, or `updates`, stop. If the format hint is absent, infer the visual format from the spec structure: list or bullet to `diagram`; sequential steps to `flowchart`; nested hierarchy to `tree`; dated or ordered events to `timeline`; two-axis data to `grid`; pairwise items to `table`. Done when: the outcome type is allowed and the visual format is set.
3. **Build the source.**
   - Mode `interactive`: extract entities and relationships from the request and context. Identify nodes, edges, and labels. Do not invent entities not grounded in the request or context. Family constraints: `architecture` and `workflow` verify every repository-backed claim (entrypoints, runtime boundaries, transports, storage, deployment configuration, tool calls, approval gates) against the repository, record origin, revision, blob identifiers, and cited lines, and discard any unverified claim; `dataflow`, `lifecycle`, and `sequence` model only user-stated facts with no inferred edge; delta comparison validates both snapshots independently, pairs elements only by stable authored identity, classifies every comparable element exactly once as added, removed, changed, or unchanged, records before and after values for changed fields without inferring cause, and states an honest proof level (full, or partial when any element was incomparable). Done when: entities and relationships are extracted from grounded sources, or delta elements are classified with the proof level stated.
   - Mode `quick-render`: validate the spec against the supplied schema. If validation fails, stop and report the errors verbatim; delete any partially written HTML. Done when: the spec passes schema validation.
4. **Compose the visual artifact.**
   - Mode `interactive`:
     - HTML format: write a self-contained HTML file using these rules:
       - Embed all CSS inline in a `<style>` block and all JavaScript inline in a `<script>` block.
       - If using Mermaid, embed the Mermaid library inline; do not use a CDN script.
       - Apply a dual-theme strategy unless the user requests a single theme.
       - Use responsive layout, flexbox, or CSS grid to prevent horizontal overflow.
       - Label every Mermaid edge with a descriptive text annotation.
       - Add a `<figcaption>` or equivalent caption to each figure that states the claim it illustrates.
       - Derive the filename from the topic: lowercase, spaces to hyphens, append `.html`. Resolve the output directory from the user diagrams directory if known, else derive from session context or use a `diagrams/` folder under the project root. Create the directory if missing.
     - SVG format: compose the SVG following `references/svg-families.md`:
       - Set `xmlns="http://www.w3.org/2000/svg"` and a `viewBox` that fits content with padding.
       - Use `<g>` groups for logical clusters.
       - Use `<rect>`, `<circle>`, `<ellipse>`, `<polygon>`, `<path>`, `<line>`, and `<text>` for nodes and edges.
       - Every text label is a `<text>` element with `font-family`, `font-size`, and `fill`; no text-as-path.
       - Define arrow markers in `<defs>` with unique `id` values and use `marker-end` on edge paths.
       - Set explicit `width`/`height` or rely on `viewBox` with `preserveAspectRatio="xMidYMid meet"`.
       - No external resources; no `href` to external files, no `<image>`, no CSS `url()` to external assets.
     - Family composition (HTML format):
       - `lifecycle`: render topology, not prose - one node per state, one directed edge per transition laid out as ordered phase columns, terminals in the bounded outcome column, lanes as rows, recovery edges back to the active state, retry counts and guards annotated on their edges. Hovering a node highlights it and its connected edges; clicking a node reveals its summary and the guards and retry counts of its transitions; every user-supplied string is HTML-escaped and never spliced into script code.
       - `sequence`: participants on horizontal lanes, messages as labeled arrows in source order, activations as stacked bars, variants as labeled branches.
       - `workflow`: mark the one obvious main path so it is visually distinguishable from secondary paths, and give every edge its user-supplied relationship label.
       - `architecture` delta: render three sections - Before as authored, Delta as classified, After as authored.
       - `dataflow`: render stages and flows with their semantic kinds and custody owners.
   - Mode `quick-render`: render the validated spec to a single self-contained HTML document. Embed all required styles inline. Do not use a CDN, external fonts, external scripts, `<script>` tags, `eval`, `data:` URLs, `<object>`, `<embed>`, or `<iframe>`. All styles live in a `<style>` block inside `<head>`. All markup is static.
   Done when: the artifact is composed with all mode-specific and format-specific rules applied.
5. **Validate the output.**
   - Mode `interactive`:
     - HTML format: confirm zero console errors, no horizontal overflow, dual theme or documented single theme, every Mermaid edge has a label, every figure has a caption.
     - Absorbed families: every declared entity appears in the artifact, and the specification holds its family invariants fail-closed - `lifecycle`: exactly one entry state, kinds from the allowed set, phases 1-8 ordered, lanes 0-6 (lane required on states only when lanes exist), retries 1-99 on retry transitions only, terminal states carry matching outcomes and no outgoing transitions, every recoverable state has a recovery edge to an active or waiting state, every state reachable from entry, node count equals state count and edge count equals transition count; `sequence`: every from/to references a declared participant, message orders unique and sequential from 1, direction in request/response/self, activation and variant orders reference existing messages with startOrder <= endOrder, no additional properties at any level; `dataflow`: every flow resolves to declared nodes, semantic kinds come from the allowed set, required fields present with no extra fields; `workflow`: self-contained with no network references, zero composition errors or warnings with geometry repaired (overlaps, broken edge routes) without altering logical structure, every node and edge with truthful labels and a distinguishable main path; `architecture` delta: no risk, blast-radius, causality, or merge recommendation in output.
     - SVG format: verify the root is `<svg>` with `xmlns`; every opening tag has a matching closing tag; all `id` references resolve; no unclosed paths or malformed polygon points; text elements have content and positioning attributes.
   - Mode `quick-render`: verify the HTML is a complete document with `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`, `utf-8` charset, all tags closed, and only inline assets. Read back the written file and verify it is well-formed HTML.
   Done when: every validation check for the chosen mode and format passes.
6. **Deliver the result.**
   - Mode `interactive`:
     - HTML format: open the HTML file in the default browser and report its path. If opening is not possible, report the file path and ask the user to open it.
     - Absorbed families: write the frozen typed JSON specification and the JSON receipt binding the specification hash, the artifact hash, the schema versions validated against, the per-check results, and the visual-review status beside the artifact, deliver the HTML artifact, specification, and receipt as one atomic set (preserving previously trusted outputs if the atomic delivery fails), and report their paths.
     - SVG format: wrap the SVG in a fenced code block tagged for the client's visualizer renderer. The fence must contain exactly one `<svg>` root element and nothing else. Do not modify files, repositories, or external resources. Do not offer to save, export, or deploy.
   - Mode `quick-render`: write the normalized HTML to the output jail under the chosen filename. Report the file path and open status to the user. Optionally open the file in a browser or Glimpse viewer.
   Done when: the file is opened or its path is reported, or the fenced SVG is the only chat output.

## Failure and recovery

| Failure class | Mode | Condition | Result |
|---|---|---|---|
| `unsupported-diagram-type` | interactive | Request does not match any diagram family and clarification is not possible | Stop; report the request could not be mapped to a diagram; ask the user to specify one of flowchart, structural, illustrative, architecture, dataflow, lifecycle, sequence, or workflow. |
| `write-error` | interactive HTML, quick-render | File write fails (permissions, disk full, path not found) | Stop; report the error; do not claim the file exists. |
| `console-error` | interactive HTML | Headless DOM check detects a console error | Stop; report the error; do not open the file. |
| `overflow-error` | interactive HTML | Horizontal overflow detected | Stop; report the overflow; do not open the file. |
| `missing-labels` | interactive HTML | Unlabeled Mermaid edge or missing figure caption | Stop; report the missing labels; do not open the file. |
| `malformed-svg` | interactive SVG | Generated SVG fails validation | Regenerate once, applying the specific fix; if it fails a second time, return the partial SVG with a note listing the remaining structural issues. |
| `scope-violation` | interactive SVG | Procedure would require file mutation, external resource access, or entity invention beyond the request and context | Stop; report which boundary was hit; do not widen scope. |
| `unsupported-spec-type` | quick-render | Outcome type is not `diagram`, `diff-review`, `plan-review`, or `project-recap` | Stop; report the unsupported outcome type. |
| `schema-validation-failure` | quick-render | The spec fails schema validation | Report validation errors verbatim; delete any partial output; stop. |
| `render-error` | quick-render | Rendering produces an error | Report the error verbatim; delete any partial output; stop. |
| `missing-required-spec-field` | quick-render | A required spec field is absent | Treat as a schema validation failure. |
| `malformed-output` | quick-render | Normalization fails after rendering | Discard the partial file; stop. |
| `invented-fact` | interactive | A flow, stage, custody assignment, state, transition, participant, message, or causal edge not stated by the user entered a `dataflow`, `lifecycle`, or `sequence` model | Remove the inference, re-validate, and re-render; if the user's facts are insufficient, stop and ask rather than fill the gap. Unverified architecture/workflow repository claims are handled by `unverified-claim`. |
| `unverified-claim` | interactive | A repository-backed claim in `architecture` or `workflow` cannot be proven | Discard the claim or stop and request evidence; never infer, assume, or fabricate. |
| `delta-incomparable` | interactive | Delta elements lack stable authored identity or boundary keys cannot pair them | Fail closed: report the incomparable element set and emit no classification for it; blocked when nothing is comparable, partial proof level only when some elements were comparable. |

Partial-result rule (HTML and quick-render modes): if write succeeds but validation fails, delete the written files before reporting the failure; absorbed families delete the HTML artifact, the JSON specification, and the receipt.
Rollback (HTML and quick-render modes): delete the written files - for absorbed families the HTML artifact, the JSON specification, and the receipt - to restore the pre-invocation state.
No failure class swallows an error or pretends the done predicate holds when it does not.

## Output

- Mode `interactive`, HTML format: one self-contained HTML file at `<user diagrams directory>/<derived-filename>.html`, opened in the browser or its path reported. The file contains inline CSS/JS, dual-theme support, labeled Mermaid edges, and figcaption claims. Absorbed families additionally deliver their frozen typed JSON specification as a JSON file beside the artifact (for example `<entity>.lifecycle.json`, `<name>.sequence.json`) and a JSON receipt binding the specification hash, the artifact hash, and the truthful visual-review status.
- Mode `interactive`, SVG format: a single SVG diagram wrapped in a visualizer fence, with `xmlns`, a `viewBox` containing all content, `<text>` elements for labels, arrow markers in `<defs>` for directed edges, no external resource references, and logical grouping via `<g>`.
- Mode `quick-render`: a single self-contained HTML file at the specified output path, with all styles embedded inline and no external resources, or on failure no output file and a report naming the failure class and exact error.
