# Deepening Workflow

This file contains the confidence-check execution path (5.3.3-5.3.7). Load it only when the deepening gate at 5.3.2 determines that deepening is warranted.

## 5.3.3 Score Confidence Gaps

Use a checklist-first, risk-weighted scoring pass.

For each section, compute:
- **Trigger count** - number of checklist problems that apply
- **Risk bonus** - add 1 if the topic is high-risk and this section is materially relevant to that risk
- **Critical-section bonus** - add 1 for `Key Technical Decisions`, `Implementation Units`, `System-Wide Impact`, `Risks & Dependencies`, or `Open Questions` in `Standard` or `Deep` plans

Treat a section as a candidate if:
- it hits **2+ total points**, or
- it hits **1+ point** in a high-risk domain and the section is materially important

Choose only the top **2-5** sections by score. If deepening a lightweight plan (high-risk exception), cap at **1-2** sections.

If the plan already has a `deepened:` date:
- Prefer sections that have not yet been substantially strengthened, if their scores are comparable
- Revisit an already-deepened section only when it still scores clearly higher than alternatives

**Section Checklists:**

**Requirements**
- Requirements are vague or disconnected from implementation units
- Success criteria are missing or not reflected downstream
- Units do not clearly advance the traced requirements
- Origin requirements are not clearly carried forward

**Context & Research / Sources & References**
- Relevant repo patterns are named but never used in decisions or implementation units
- Cited learnings or references do not materially shape the plan
- High-risk work lacks appropriate external or internal grounding
- Research is generic instead of tied to this repo or this plan

**Key Technical Decisions**
- A decision is stated without rationale
- Rationale does not explain tradeoffs or rejected alternatives
- The decision does not connect back to scope, requirements, or origin context
- An obvious design fork exists but the plan never addresses why one path won

**Open Questions**
- Product blockers are hidden as assumptions
- Planning-owned questions are incorrectly deferred to implementation
- Resolved questions have no clear basis in repo context, research, or origin decisions
- Deferred items are too vague to be useful later

**High-Level Technical Design (when present)**
- The sketch uses the wrong medium for the work
- The sketch contains implementation code rather than pseudo-code
- The non-prescriptive framing is missing or weak
- The sketch does not connect to the key technical decisions or implementation units

**High-Level Technical Design (when absent)** *(Standard or Deep plans only)*
- The work involves DSL design, API surface design, multi-component integration, complex data flow, or state-heavy lifecycle
- Key technical decisions would be easier to validate with a visual or pseudo-code representation
- The approach section of implementation units is thin and a higher-level technical design would provide context

**Implementation Units**
- Dependency order is unclear or likely wrong
- File paths or test file paths are missing where they should be explicit
- Units are too large, too vague, or broken into micro-steps
- Approach notes are thin or do not name the pattern to follow
- Test scenarios are vague (don't name inputs and expected outcomes), skip applicable categories (e.g., no error paths for a unit with failure modes, no integration scenarios for a unit crossing layers), or are disproportionate to the unit's complexity
- Feature-bearing units have blank or missing test scenarios
- Verification outcomes are vague or not expressed as observable results
- Existing U-IDs were renumbered after a unit was reordered, split, or deleted (U-IDs are stable: never renumber existing IDs; gaps from deletions are preserved; new units take the next unused number)

**System-Wide Impact**
- Affected interfaces, callbacks, middleware, entry points, or parity surfaces are missing
- Failure propagation is underexplored
- State lifecycle, caching, or data integrity risks are absent where relevant
- Integration coverage is weak for cross-layer work

**Risks & Dependencies / Documentation / Operational Notes**
- Risks are listed without mitigation
- Rollout, monitoring, migration, or support implications are missing when warranted
- External dependency assumptions are weak or unstated
- Security, privacy, performance, or data risks are absent where they obviously apply

Use the plan's own `Context & Research` and `Sources & References` as evidence. If those sections cite a pattern, learning, or risk that never affects decisions, implementation units, or verification, treat that as a confidence gap.

## 5.3.4 Report and Dispatch Targeted Research

Before dispatching agents, report what sections are being strengthened and why:

```text
Strengthening [section names] -- [brief reason for each, e.g., "decision rationale is thin", "cross-boundary effects aren't mapped"]
```

For each selected section, choose the smallest useful agent set. Do **not** run every agent. Use at most **1-3 agents per section** and usually no more than **8 agents total**.

Dispatch a generic subagent for each selected focus area. Pass the planning context summary, the section text, why the section was selected, and the plan depth and risk profile. The focus areas below describe what each subagent should investigate -- seed them with these prompts plus the task-specific context.

**Section-to-Focus Mapping:**

**Requirements / Open Questions classification**
- *Flow analysis* for missing user flows, edge cases, and handoff gaps
- *Architecture review* for repo-grounded patterns, conventions, and implementation reality checks

**Context & Research / Sources & References gaps**
- *Institutional knowledge* for past solved problems and documented learnings
- *Framework documentation* for official framework or library behavior
- *Best practices* for current external patterns and industry guidance
- *Landscape research* for competitor patterns, market signals, or unsettled external option sets
- *Git history* -- only when historical rationale or prior art is materially missing

**Key Technical Decisions**
- *Architecture strategy* for design integrity, boundaries, and architectural tradeoffs
- Add framework docs or best practices research when the decision needs external grounding beyond repo evidence

**High-Level Technical Design**
- *Architecture strategy* for validating that the technical design accurately represents the intended approach and identifying gaps
- *Architecture review* for grounding the technical design in existing repo patterns and conventions
- Add best practices research when the technical design involves a DSL, API surface, or pattern that benefits from external validation

**Implementation Units / Verification**
- *Pattern analysis* for concrete file targets, patterns to follow, and repo-specific sequencing clues
- *Consistency review* for duplication risks and alignment with existing patterns
- Add flow analysis when sequencing depends on user flow or handoff completeness

**System-Wide Impact**
- *Architecture strategy* for cross-boundary effects, interface surfaces, and architectural knock-on impact
- Add the specific focus that matches the risk:
  - *Performance analysis* for scalability, latency, throughput, and resource-risk analysis
  - *Security review* for auth, validation, exploit surfaces, and security boundary review
  - *Data integrity review* for migrations, persistent state safety, consistency, and data lifecycle risks

**Risks & Dependencies / Operational Notes**
- Use the focus that matches the actual risk:
  - *Security review* for security, auth, privacy, and exploit risk
  - *Data integrity review* for migrations, backfills, persistent data safety, constraints, transaction boundaries, and production data transformation risk
  - *Deployment verification* for rollout checklists, rollback planning, and launch verification
  - *Performance analysis* for capacity, latency, and scaling concerns

**Subagent Prompt Shape:**

For each selected section, pass:
- A short plan summary
- The exact section text
- Why the section was selected, including which checklist triggers fired
- The plan depth and risk profile
- A specific question to answer

Instruct the agent to return:
- findings that change planning quality
- stronger rationale, sequencing, verification, risk treatment, or references
- no implementation code
- no shell commands

## 5.3.5 Choose Research Execution Mode

Use the lightest mode that will work:

- **Direct mode** - Default. Use when the selected section set is small and the parent can safely read the agent outputs inline.
- **Artifact-backed mode** - Use only when the selected research scope is large enough that inline returns would create unnecessary context pressure.

Signals that justify artifact-backed mode:
- More than 5 agents are likely to return meaningful findings
- The selected section excerpts are long enough that repeating them in multiple agent outputs would be wasteful
- The topic is high-risk and likely to attract bulky source-backed analysis

If artifact-backed mode is not clearly warranted, stay in direct mode.

Artifact-backed mode uses a per-run OS-temp scratch directory. Create it once before dispatching sub-agents and capture its **absolute path** -- pass that absolute path to each sub-agent so they write to it directly. Do not use `.context/`; the artifacts are per-run throwaway that are cleaned up at 5.3.9 (Final Checks). Do not pass unresolved shell-variable strings to sub-agents; they need the resolved absolute path.

```bash
SCRATCH_DIR="$(mktemp -d -t plan-deepen-XXXXXX)"
echo "$SCRATCH_DIR"
```

Refer to the echoed absolute path as `<scratch-dir>` throughout the rest of this workflow.

## 5.3.6 Run Targeted Research

Launch the selected local prompt assets as generic subagents in parallel using the execution mode chosen above. If the current platform does not support parallel dispatch, run them sequentially instead.

Prefer local repo and institutional evidence first. Use external research only when the gap cannot be closed responsibly from repo context or already-cited sources.

If a selected section can be improved by reading the origin document more carefully, do that before dispatching external agents.

**Direct mode:** Have each selected prompt-seeded subagent return its findings directly to the parent. Keep the return payload focused: strongest findings only, the evidence or sources that matter, the concrete planning improvement implied by the finding.

**Artifact-backed mode:** For each selected prompt-seeded subagent, pass the absolute `<scratch-dir>` path captured earlier and instruct the subagent to write one compact artifact file inside that directory, then return only a short completion summary. Each artifact should contain: target section, why selected, 3-7 findings, source-backed rationale, the specific plan change implied by each finding. No implementation code, no shell commands.

If an artifact is missing or clearly malformed, re-run that prompt-seeded subagent or fall back to direct-mode reasoning for that section.

If agent outputs conflict:
- Prefer repo-grounded and origin-grounded evidence over generic advice
- Prefer official framework documentation over secondary best-practice summaries when the conflict is about library behavior
- If a real tradeoff remains, record it explicitly in the plan

## 5.3.6b Interactive Finding Review (Interactive Mode Only)

Skip this step in auto mode -- proceed directly to 5.3.7.

In interactive mode, present each agent's findings to the user before integration. For each agent that returned findings:

1. **Summarize the agent and its target section** -- e.g., "The architecture-strategist reviewed Key Technical Decisions and found:"
2. **Present the findings concisely** -- bullet the key points, not the raw agent output. Include enough context for the user to evaluate: what the agent found, what evidence supports it, and what plan change it implies.
3. **Ask the user** using the platform's blocking question tool when available:
   - **Accept** -- integrate these findings into the plan
   - **Reject** -- discard these findings entirely
   - **Discuss** -- the user wants to talk through the findings before deciding

If the user chooses "Discuss", engage in brief dialogue about the findings and then re-ask with only accept/reject (no discuss option on the second ask). The user makes a deliberate choice either way.

When presenting findings from multiple agents targeting the same section, present them one agent at a time so the user can make independent decisions. Do not merge findings from different agents before showing them.

After all agents have been reviewed, carry only the accepted findings forward to 5.3.7.

If the user accepted no findings, report "No findings accepted -- plan unchanged." Then skip document-review and synthesis (the plan was not modified) and proceed to 5.3.9 (Final Checks) for cleanup, then to Phase 5.4. This interactive-mode-only skip does not apply in auto mode; auto mode always proceeds through 5.3.7 and 5.3.8.

If findings were accepted and the plan was modified, proceed through 5.3.7 and 5.3.8 as normal -- document-review acts as a quality gate on the changes.

## 5.3.7 Synthesize and Update the Plan

Strengthen only the selected sections. Keep the plan coherent and preserve its overall structure.

**In interactive mode:** Only integrate findings the user accepted in 5.3.6b. If some findings from different agents touch the same section, reconcile them coherently but do not reintroduce rejected findings.

Deepening may tighten, not only grow. A section can be strengthened by cutting as well as adding -- collapse multi-idea sentences, drop hedges, and delete superseded text outright rather than leaving it as strikethrough or stacking a separate "resolutions" layer on top of it. A shorter, contradiction-free section is a stronger one. This is distinct from "rewrite the entire plan from scratch" below, which stays forbidden.

Allowed changes:
- Tighten prose in a strengthened section: cut hedges, split sentences carrying more than one idea, and remove superseded text in place (version control holds the history)
- Clarify or strengthen decision rationale
- Tighten requirements trace or origin fidelity
- Reorder or split implementation units when sequencing is weak -- but **never renumber existing U-IDs**. Reordering preserves U-IDs in their new order (e.g., U1, U3, U5 reordered is correct; renumbering to U1, U2, U3 is not). Splitting keeps the original U-ID on the original concept and assigns the next unused number to the new unit.
- Add missing pattern references, file/test paths, or verification outcomes
- Expand system-wide impact, risks, or rollout treatment where justified
- Reclassify open questions between `Resolved During Planning` and `Deferred to Implementation` when evidence supports the change
- Strengthen, replace, or add a High-Level Technical Design section when the work warrants it and the current representation is weak
- Strengthen or add per-unit technical design fields where the unit's approach is non-obvious
- Add or update `deepened: YYYY-MM-DD` in frontmatter when the plan was substantively improved

Do **not**:
- Add implementation code -- no imports, exact method signatures, or framework-specific syntax. Pseudo-code sketches and DSL grammars are allowed
- Add git commands, commit choreography, or exact test command recipes
- Add generic `Research Insights` subsections everywhere
- Rewrite the entire plan from scratch
- Invent new product requirements, scope changes, or success criteria without surfacing them explicitly
- Renumber existing U-IDs as part of reordering, splitting, deletion, or "tidying" the unit list

If research reveals a product-level ambiguity that should change behavior or scope:
- Do not silently decide it here
- Record it under `Open Questions`
- Recommend upstream requirements gathering if the gap is truly product-defining
