---
name: knowledge-refresh
description: 'Use when a user asks to review or validate a knowledge artifact before sharing or executing it. Runs two parallel reviewers that merge findings into P1/P2/P3 plus Clean; every P1 blocks ordinary shipping and receives explicit next choices. Don''t use for tasks that require source or remote-system changes.'
---

# Knowledge review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to review or validate a knowledge artifact before sharing or executing it. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Reads the target and references and emits merged findings; writes only if the user chooses a fix. |
| Done | Strategic and data reviewers run in parallel; findings merge into P1/P2/P3 plus Clean; external content gets an editorial check; every P1 blocks ordinary shipping and receives explicit next choices. |

## Inputs

Required:
- **Artifact**: a file path or paste of content to review.

Optional:
- Referenced data context files.
- Explicit indication that content is external-facing (published, emailed, or posted publicly).

If the input is ambiguous, ask the user to supply a file path or paste the content.

## Procedure

1. **Load the artifact.**
   - If a file path is given, read the file.
   - If pasted content is given, use it directly.
   - If content references data (metrics, conversion rates, financial figures), also load any data context files cited in the artifact.

2. **Run both reviewers in parallel.**
   a. Launch a strategic alignment review using the full artifact content. Evaluate: goal clarity (goal connected to a measurable outcome), hypothesis falsifiability (testable "if-then" form), success metrics (defined and connected to goal; flag vanity metrics), scope proportionality (effort proportional to expected impact), resource awareness (time, people, tools, budget stated), strategic consistency (consistent with stated project goals), and opportunity cost (what is not being done and whether this is the best use of effort here).
   b. Launch a data accuracy review using the full artifact content and data context files. Evaluate: source citation (every number has a cited source with file path, dashboard name, or calculation), comparison baselines (every comparison has a stated baseline; flag incomplete comparisons), canonical definitions (metrics match the project's canonical definitions), freshness (flag data older than 48 hours with a warning; flag data older than 7 days as P2), caveats acknowledged (known limitations of data sources are stated), hardcoded vs live (hardcoded numbers that should be live-queried), and baseline appropriateness (watch for seasonal skew or cherry-picked timeframes).
   c. Wait for both reviewers to return before proceeding.

3. **Editorial check for external-facing content.**
   - If the artifact will be published, emailed, or posted publicly: check for AI writing patterns (generic phrasing, stock transitions, vague claims) and tone or voice consistency with the project's style guides.
   - If the artifact is internal (plan, brief, analysis for the team): skip this step.

4. **Merge findings.**
   Combine findings from both reviewers. Group all findings by severity:

   Severity definitions:

   | Severity | What qualifies |
   |---|---|
   | P1 Critical | Factual error, wrong data source, missing goal, unfalsifiable hypothesis |
   | P2 Important | Missing source citation, stale data older than 7 days, unclear success metric |
   | P3 Nice-to-have | Minor framing, additional context, formatting |
   | Clean | Sections that passed all checks |

5. **Present findings.**
   Format:
   ```
   ## Review: [Document Title]

   ### P1 — Blocks Shipping
   [P1 findings, most critical first.]

   ### P2 — Should Fix
   [P2 findings.]

   ### P3 — Nice to Have
   [P3 findings.]

   ### Clean
   [Explicitly note what passed.]
   ```

6. **Offer next steps.** Ask: "Review complete. [N] findings ([P1 count] critical, [P2 count] important). What next?"
   Options:
   1. **Fix P1/P2 issues now** — Address findings inline, then re-review.
   2. **Ship as-is** — Acknowledge findings and proceed without fixing.

7. **Execute the chosen action.**
   - If the user chooses to fix: make targeted edits and re-run the review.
   - If the user chooses to ship as-is: acknowledge the outstanding findings and stop.

## Failure and recovery
| Failure class | Recovery |
|---|---|
| Ambiguous artifact | Ask the user to provide a file path or paste the content. Do not guess. |
| One reviewer returns empty | Treat the missing review as having no findings; do not block on a silent reviewer. |
| Data source inaccessible | Flag the data claim as unverifiable (P2 at minimum) rather than assuming it is correct. |
| User declines to choose a next step | Stop. The review is complete; do not proceed unilaterally. |
| External content check finds AI patterns | Present the finding as a P2; do not rewrite the content. |

## Output
A grouped review report with P1, P2, P3, and Clean sections. Each finding is specific: "Revenue cited as $X but [source] shows $Y as of [date]" rather than "Revenue might be wrong." P1 findings explicitly block ordinary shipping and receive the next-steps prompt.

## Provenance

Origin: https://github.com/EveryInc/compound-knowledge-plugin, revision 766942e9eaee5204adbfe180f1d0651ffecf2575.

License: MIT. Copyright (c) 2026 Every, Inc. Include the copyright and permission notice in copies or substantial portions.

Adaptation: Parallel two-reviewer gate preserved with both reviewer checklists folded in per the inventory MERGE rows; odin-research breadth; advisory read-only authority with writes deferred to explicit user fix choice; model+human per Q14.
