---
name: knowledge-refresh
description: 'Use when a knowledge artifact needs review before sharing or execution. Not for source or remote-system changes.'
---

# Knowledge review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to review or validate a knowledge artifact before sharing or executing it. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Any fix is a separate, explicitly user-authorized edit performed after the review completes. |
| Side effect | Reads the target and references and emits merged findings. No write occurs during the review. A fix, if the user explicitly authorizes one after the review, is a separate edit outside the review's authority. |
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
   Done when: the artifact content is loaded and any cited data context files are read.

2. **Run both reviewers in parallel.**
   a. Launch a strategic alignment review using the full artifact content. Evaluate:
      - goal clarity: the goal connects to a measurable outcome;
      - hypothesis falsifiability: the hypothesis uses a testable "if-then" form;
      - success metrics: metrics are defined and connected to the goal; flag vanity metrics;
      - scope proportionality: effort is proportional to expected impact;
      - resource awareness: time, people, tools, and budget are stated;
      - strategic consistency: the artifact is consistent with stated project goals;
      - opportunity cost: what is not being done and whether this is the best use of effort here.
   b. Launch a data accuracy review using the full artifact content and data context files. Evaluate:
      - source citation: every number has a cited source with a file path, dashboard name, or calculation;
      - comparison baselines: every comparison has a stated baseline; flag incomplete comparisons;
      - canonical definitions: metrics match the project's canonical definitions;
      - freshness: flag data older than 48 hours with a warning and data older than 7 days as P2;
      - caveats: known limitations of data sources are stated;
      - hardcoded vs live: identify hardcoded numbers that should be live-queried;
      - baseline appropriateness: watch for seasonal skew or cherry-picked timeframes.
   c. Wait for both reviewers to return before proceeding.
   Done when: both reviewers have returned their findings.

3. **Editorial check for external-facing content.**
   - If the artifact will be published, emailed, or posted publicly: check for AI writing patterns (generic phrasing, stock transitions, vague claims) and tone or voice consistency with the project's style guides.
   - If the artifact is internal (plan, brief, analysis for the team): skip this step.
   Done when: the editorial check is run for external-facing content or skipped for internal content.

4. **Merge findings.**
   Combine findings from both reviewers. Group all findings by severity:

   | Severity | What qualifies |
   |---|---|
   | P1 Critical | Factual error, wrong data source, missing goal, unfalsifiable hypothesis |
   | P2 Important | Missing source citation, stale data older than 7 days, unclear success metric |
   | P3 Nice-to-have | Minor framing, additional context, formatting |
   | Clean | Sections that passed all checks |

   Done when: all findings are grouped into P1, P2, P3, or Clean.

5. **Present findings.** Present a grouped review report with P1 (blocks shipping, most critical first), P2 (should fix), P3 (nice to have), and Clean (what passed) sections. Each finding is specific: "Revenue cited as $X but [source] shows $Y as of [date]" rather than "Revenue might be wrong." Done when: the grouped report is presented with specific findings in severity order.

6. **Offer next steps.** Ask: "Review complete. [N] findings ([P1 count] critical, [P2 count] important). What next?" Options: (1) Fix P1/P2 issues now: address findings inline, then re-review; (2) Ship as-is: acknowledge findings and proceed without fixing. Done when: the user is offered the two next-step options.

7. **Execute the chosen action only after the review completes.**
   - If the user chooses to fix: the review is complete. The fix is a separate, explicitly user-authorized edit. Make targeted edits, then re-run the review as a new invocation.
   - If the user chooses to ship as-is: acknowledge the outstanding findings and stop.
   Done when: the chosen action is executed (fixes applied and re-reviewed as a separate step, or findings acknowledged and stopped).

## Failure and recovery
| Failure class | Recovery |
|---|---|
| Ambiguous artifact | Ask the user to provide a file path or paste the content. Do not guess. |
| One reviewer returns empty | A missing reviewer makes that review's checks unverifiable. Flag them as unverifiable at P2 minimum (matching the data-source-inaccessible rule) and block Done until both reviewers return. |
| Data source inaccessible | Flag the data claim as unverifiable (P2 at minimum) rather than assuming it is correct. |
| User declines to choose a next step | Stop. The review is complete; do not proceed unilaterally. |
| External content check finds AI patterns | Present the finding as a P2; do not rewrite the content. |

## Output

A grouped review report with P1, P2, P3, and Clean sections (each finding specific with source and date), where P1 findings explicitly block ordinary shipping and receive the next-steps prompt.
