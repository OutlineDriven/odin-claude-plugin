---
name: engineering-blog-writing
description: 'Use when asked to write, review, or improve an engineering blog post, technical architecture deep dive, postmortem, or technical launch announcement. Produces evidence-grounded engineering copy with verified metrics, working code, and clear trade-off analysis.'
---

# Engineering blog writing

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to write, review, or improve an engineering blog post, technical deep dive, product launch, postmortem, data study, or technical tutorial. |
| Authority | Reversible local write: create or edit a local markdown blog draft. Roll back by discarding the draft or reverting the file. |
| Side effect | Writes or updates a local markdown file. No external publishing, deployment, credential modification, or remote mutations. |
| Done | A complete technical blog post with a named author byline, verified performance metrics, tested code examples, labeled architecture diagrams where needed, informative headings, and an actionable conclusion. |

## Inputs

- Topic, post type, and intended technical audience. Required. Post type is one of: engineering deep dive, architecture overview, product launch, postmortem, data/benchmarking study, or technical tutorial.
- Author name for the byline. Required before completing the post; reject anonymous or generic team bylines.
- Existing draft to review or edit. Optional; provide when revising existing copy.
- Supporting technical evidence: verified baseline and result metrics for performance claims, tested code snippets with dependencies and imports, and architecture topology. Required for claims in the draft.

## Procedure

1. Confirm post type and author byline. Map the post type to its core technical objective:
   - Engineering deep dive: explain an internal architecture, algorithm, or technical decision so peers learn; byline the building engineer.
   - Technical product launch: explain the underlying mechanism, why it matters, and how to use it; byline the builder, product engineer, or developer advocate.
   - Postmortem: provide transparent failure analysis with a timeline, root cause, and systemic mitigations; byline engineering leadership or the incident responder.
   - Data or benchmarking study: share reproducible empirical data and methodology; byline the research or engineering team lead.
   - Tutorial or implementation guide: guide a developer through solving a concrete technical problem; byline the contributing engineer.
   Stop and request the author name if none is provided.

2. Frame the opening directly. State the concrete technical problem or the direct conclusion in the first two paragraphs. Do not open with company history, generic industry background, or marketing hype.

3. Structure the post around reader questions:
   - What specific problem does this solve (1-2 paragraphs).
   - How does the system work under the hood (the core technical body, focusing on data structures, protocols, and mechanisms rather than UI clicks).
   - What trade-offs, constraints, and discarded alternatives were evaluated.
   - How to run, implement, or reproduce the solution.
   For engineering deep dives and postmortems, explicitly document what failed during development and current system limits.

4. Apply a direct practitioner voice. Write as a senior engineer explaining a technical system to a peer. Use first-person perspective ("I" or "we" for the engineering team, "you" for the reader). Keep the voice consistent across the entire post rather than confining personal framing to introductions.

5. Remove marketing jargon and corporate filler. Eliminate empty superlatives ("industry-leading", "best-in-class"), canned announcement phrases ("excited to announce"), buzzwords ("robust", "empower", "unlock"), and filler transitions ("at the end of the day", "without further ado", "in this post we explore"). Announce and describe mechanisms directly.

6. Eliminate synthetic writing habits:
   - Staccato dramatic fragments ("No bugs. No alerts. Clean deploys.").
   - Bumper-sticker slogans ("You cannot optimize what you do not measure.").
   - Three-beat reveals ("Not a network failure. Not a database lock. A stale cache.").
   - Unearned simplicity ("Just add this config and you are done.").
   - Parallel ad copy ("Metrics show what failed. Traces show why.").
   Rewrite each into clear, connected technical prose.

7. Format for skimmability. Break paragraphs at logical transitions and contrast points (when introducing constraints or contrasting approaches). Keep paragraphs focused on a single technical point. Use commas, colons, parentheses, or periods instead of em dashes.

8. Make section headings convey information. Replace generic labels ("Background", "Architecture", "Results", "Conclusion") with specific findings or mechanisms ("Why pre-aggregating metrics discarded debugging context").

9. Enforce empirical technical quality:
   - Exact numbers for performance claims: include specific baseline and result measurements with units (for example, "reduced p99 query latency from 320ms to 42ms").
   - Runnable code samples: include necessary imports, setup, and configuration; ensure comments explain rationale rather than obvious syntax.
   - System diagrams: if the post describes a system with more than two interacting services or components, include an ASCII or text diagram with labeled components and data flow directions.
   - Honest scope: acknowledge known limitations, ongoing edge cases, and pre-release statuses without exaggeration.

10. Write an informative title. Make a specific technical claim or promise a concrete payoff ("How reducing lock contention improved throughput by 4x"). Reject vague announcement headlines.

11. Close with actionable next steps. Link to relevant source code, documentation, reproduction repositories, or technical discussion threads. Connect the conclusion to the problem established in the introduction without generic marketing calls to action.

12. For educational or search-oriented guides: provide platform-agnostic technical fundamentals in the first half before detailing proprietary or vendor-specific tooling. Include a clear technical definition section and a concise FAQ for common edge cases.

13. Apply the technical depth test. Ensure the post provides at least one of:
    - An architectural decision evaluated with explicit trade-offs.
    - Original empirical benchmark data or workload measurements.
    - A reproducible debugging investigation with concrete root-cause evidence.
    - A step-by-step technical solution that saves practitioner time.
    If none are present, flag the draft as lacking technical depth.

14. Execute review checklists:
    - Technical checklist: verify all architectural claims, confirm code samples run, validate metric units and baselines, and eliminate oversimplifications.
    - Editorial checklist: verify the opening states the problem immediately, check that headings convey specific mechanisms, and confirm the absence of marketing filler.
    - Attribution checklist: confirm the byline is a real named individual and that reference links resolve.
    When providing feedback, quote the deficient passage, explain the issue, and provide an explicit rewrite.

## Failure and recovery

- Missing author byline: halt and request the author name. Do not output a finished post with a generic team byline.
- Untested or broken code: flag the snippet as unverified, request runnable confirmation, or remove it from the draft.
- Unsupported performance claim: remove the claim or mark it as an unverified estimate if benchmark data is unavailable.
- Marketing filler or synthetic patterns detected: rewrite affected sections using direct mechanism-based descriptions.
- Shallow content or changelog repetition: return the draft with a specific list of missing technical details, trade-offs, or reproduction steps.
- Rollback: delete the generated draft or revert the file to its previous state.

## Output

A local markdown draft file containing a named author byline, verified technical metrics, tested code examples, labeled system diagrams where required, information-rich headings, and an actionable technical closing. For reviews, return a marked-up draft alongside specific passage quotes and suggested rewrites.
