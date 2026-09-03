# Audit patterns

The pattern groups the audit scans against, the keep list that outranks every group, and the report shape. Signals are grep targets: run them over the inventory rather than reading for a feeling. A grep match is a candidate, never a finding; the keep list and the target-model reason decide.

## Group 1: dated prompt text

### 1a. Pressure language

Say what you mean at normal volume. Older, less steerable models needed forcefulness; current models are responsive to the system prompt, so the same text over-applies. This cuts both ways: inflated emphasis causes over-triggering and rigid behavior, while leftover hedges ("try to", "if possible") are read literally as permission to under-deliver.

| Before (written for older models) | After (current models) |
|---|---|
| `CRITICAL: You MUST use this tool when...` | `Use this tool when...` |
| `IMPORTANT: NEVER do X` (several per prompt) | State the one or two real constraints plainly, with the reason |
| `If in doubt, use [tool]` / `Default to [tool]` | Delete, or `Use [tool] when it would improve X` |
| `Be thorough. Do not be lazy. Do not stop early.` | Delete; current models are proactive by default |
| `Try to include a summary if possible` (when it is required) | `Include a summary.` |
| `You have a tendency to over-X, so...` / `Don't be too verbose` | State the desired behavior: `Keep responses to the length the question needs.` |

When several instructions are each marked critical, the markers stop carrying information, and the prompt's register becomes the output's register: an anxious prompt produces a cautious, hedging model. Emphasis is not banned; it is a tested, scoped fix for one demonstrably underweighted instruction, not a first-draft register.

Signals: density of `MUST|NEVER|ALWAYS|CRITICAL|IMPORTANT` in caps; `!!`; emphasis with no adjacent "because"; `try to|if possible|ideally` attached to actual requirements; `you (tend to|often|sometimes)`; trait claims such as `don't be too [adjective]`.

### 1b. Superseded scaffolds (flag only)

These rows describe scaffolds that model or API features replaced. Their fix lives in request configuration or in code that assembles requests, and this tree holds neither, so a match here is a `flag` item that proposes no diff. Delete nothing on their account.

| Scaffold | Why it is dated |
|---|---|
| "Think step by step", `<scratchpad>` or `<thinking>` tag instructions, "use the think tool to plan" | Current models plan without being told; depth is a configuration setting, not prose |
| "Show your thinking" or required reasoning sections in the output | Reasoning is read from the model's thinking output, not from prose the prompt demands |
| Assistant-turn prefill and the JSON-forcing stack around it: stop sequences, regex extraction, retry-on-parse loops | Structured outputs replaced it; prefill errors on current models |
| `budget_tokens`, non-default sampling parameters, stale beta headers, dead retry paths | Request-level fossils; each hard-errors or is deprecated depending on the target model |
| Forced tool use through `tool_choice` | The JSON-via-forced-tool pattern is a prompt instruction in disguise; `auto` with a schema guarantee is the current form |
| Inline lookup tables, point systems, and arithmetic rubrics the model must compute | Data belongs in files or tool results and arithmetic in code; the model keeps the judgment layer |

Signals: `think step by step|take a deep breath`; `<scratchpad>|<thinking>` in instructions; `stop_sequences` guarding JSON; `budget_tokens|temperature|top_p`; `tool_choice`.

### 1c. Over-specification

Describe the goal, not the method.

| Pattern | Why it is cruft now | Fix |
|---|---|---|
| Step-by-step choreography for judgment tasks (`STEP 1: ... STEP 2: ...`) | Prompts written for prior models are too prescriptive for current ones and degrade output quality; the model's own plan usually beats a hand-written script | State outcomes, constraints, and how to verify; keep numbered steps only where order truly matters |
| Prohibition lists ("do not X, never Y, avoid Z...") | Describing success beats enumerating failure; a prohibition against a failure the model was not going to make can anchor it toward that failure | Keep prohibitions whose failure reproduces on the target model; rewrite the rest as positive statements of intent |
| Example over-indexing: the single gold output; stale few-shot blocks | Concrete examples are the strongest signal in a prompt; the model matches their length, tone, and structure, and examples written for an older model freeze that model's behavior into the new one | Several deliberately varied examples labeled illustrative; delete examples of judgment the model already owns; keep examples that pin a genuinely format-sensitive output shape |
| Bullet walls and heavy formatting for behavioral guidance | Bullets flatten priority and sever rules from reasons, and prompt format bleeds into output format | Structure for reference data; prose for behavior, carrying the "because" |
| Padding: generic virtues ("be accurate, thorough, clear"), repetition as reinforcement, kitchen-sink edge cases, limits with escape hatches | The model treats everything as actionable signal; asides get applied where they do not fit; duplicated rules make the model reconcile wordings; bulk inflates thinking spend | Say it once, in the right place; cover the hard judgment calls instead of the easy parts |
| Grader and eval vocabulary ("you will be graded on...", "hidden tests") | Describes the scoring apparatus instead of the requirement and pushes effort toward being watched | State every requirement the grader checks; never describe the grader |
| Strategy coaching next to task rules ("it's usually best to...") | The author's heuristics are wrong in some situations and the model's plan is usually better | If removing the sentence would not change what is legal or how success is measured, it is strategy: delete it |

Signals: `STEP \d` or numbered imperatives for non-fragile work; runs of three or more `Do not|Never|Avoid` lines; `do not hallucinate` (re-test whether it is still needed; its removal is low confidence, not a documented harm); a single embedded gold output; near-duplicate sentences across sections; `Remember.|Again.|As stated above`; `grade|graded|rubric|hidden test`.

### 1d. Fossils

Text that outlived its model.

| Pattern | Why it is cruft now | Fix |
|---|---|---|
| Model-version workarounds: formatting fixes, over-refusal softeners, retry hints, "known issue with [model]" comments, date-conditional guidance | Nobody owns the removal, so prompts accumulate the union of every generation's mitigations | Each mitigation names, or gets traced to, the model it patched; if that model is retired, remove and re-test |
| Migration-relative phrasing: "X now works differently", "also counts", "no longer" | The text is a diff against a prompt version the model never saw; relative phrasing implies phantom alternatives | Write as if the current rules are the only rules that ever existed |
| Patch accretion: many narrow conditionals, each traceable to one incident | The model navigates a maze of special cases instead of a coherent principle and fails unpredictably between them; an eval win for adding a line on top of the stack is not evidence the stack should exist | Generalize the principle or fix the underlying context; test removals, not just additions |
| Unenforced instructions: rules no code path, eval, or reviewer checks, visibly violated in the surface's own transcripts | If nothing checks it and nobody noticed, it carries no signal; rules that could be hooks, allowlists, or schema validators are less reliable as prose | Enforce in code what can be enforced in code; delete what nothing enforces and nobody misses |
| Identity stubs standing in for context ("You are a helpful assistant") | A role line is fine as a one-sentence focus-setter; the defect is an identity statement substituting for audience, product, and quality bar | Do not flag a short role line; flag it when it is the only context the prompt gives |
| Update suppressors written for chatty models: "hold all findings for the final response", "don't narrate", "no interim updates" | Tuned against models that over-narrated; current models under-narrate with these present, and the harness may not request between-tool progress notes at all | Remove first and re-test; if more narration is still wanted, replace with a specific line saying when user-facing text is wanted |
| Anti-formatting rules: "never use bullets", "no headers", "no bold" | Written against models that over-formatted; current models already under-format, so the rule strips formatting the reader wanted | Remove, or replace with a rule that says when formatting is appropriate |
| Instruction re-insertion every few turns ("reminder: ..." on a cadence) | A retention crutch for models that lost instructions over long sessions; current models retain a once-stated instruction, and each repeat costs tokens | Remove the repetition and re-test; where a genuinely per-turn reminder remains, send it as a turn-scoped message after the tool results and never delete earlier copies |

Signals: retired model names in prompts or comments; `hold (all )?(findings|results)|don't narrate|no interim`; `never use (bullets|headers|bold)|no (bullet|header)`; `reminder:` on a turn cadence; `before|after [date]` conditionals; `now|no longer|instead of` attached to behavioral rules; rules whose reason nobody remembers; `^You are (a|an) (helpful|expert)` with nothing task-specific following.

### 1e. Prohibition clusters

Judge by provenance, not by whether the model "needs it". A run of unconditional never, don't, and must-not lines is audited by asking, for each line, whether it carries a stated reason or encodes a real business or policy constraint. The question "does the target model still need this guardrail?" keeps everything, because nothing is harmful to say. Prohibitions that encode observable constraints (refund caps, data rules, compliance language, promises the business must not make) stay, ideally with their reason beside them. Prohibitions that merely describe an undesirable output style with no provenance (banned phrases, tic lists, "don't start with 'Certainly'" written against an older model's habits) are cruft: restate the desired style positively in one line, or attach the real reason if there is one. A surrounding cluster of legitimate, reasoned prohibitions does not launder the no-provenance ones mixed into it; classify each line separately.

### 1f. Output-shaping choreography

One pattern, remove every limb. Fixed interim-update cadences ("after every third tool call, post a progress note"), numeric output ceilings ("under 120 words", "at most five bullets"), and cut-the-detail instructions are manifestations of the same over-constraint pattern, written for models that padded or rambled. They are removed together: a stated operational reason ("queue throughput", "supervisors skim") does not convert a numeric clamp into a keeper. Re-express the goal as audience or outcome framing without the number ("replies are scan-able and answer only what was asked"), and keep any genuinely format-sensitive output shape as a format instruction, not a word count. Removing the cadence while keeping the ceilings leaves the pattern in place.

Signals: `every \d+ (tool calls|messages)`; `at most \d+ (words|sentences|bullets)`; `under \d+ words`.

## Group 2: brittle skill files

Skill files inherit everything in Group 1, plus failure modes of their own. Skill size is a tax paid on every trigger.

| Pattern | Why it is cruft now | Fix |
|---|---|---|
| Verbose skill body explaining things the model already knows | Every paragraph must justify its token cost; general programming knowledge does not | Apply the classification question paragraph by paragraph: could the model already know this? |
| Wrong degrees of freedom | Exact scripts for judgment calls over-constrain; vague prose for fragile operations under-constrains | Match specificity to fragility: prose heuristics for open fields, exact commands (`do not modify this command`) only for narrow bridges |
| The recency trap: one session's stumble encoded as a permanent rule | The next session steps around a pothole that is not there | Before keeping a rule, ask whether it would have helped most recent sessions or just the one that wrote it |
| Volatile specifics: hardcoded paths, flags, version numbers, API claims with no verification date | Skills rot factually as code ships; nothing re-checks them by default | Encode architecture, data models, and workflows; verify surviving factual claims against current code as part of the audit |
| Time-sensitive content ("if before [date]..."), option menus, duplicated information across the skill body and its reference files | Dates rot; menus of alternatives dilute; duplicates drift apart | An "old patterns" section instead of dates; one default plus an escape hatch; information lives in exactly one place |
| History narratives: past tense, incident IDs, PR numbers, pinned model names | A rule's authority is the behavior it prescribes, not the incident that motivated it; pinned model names silently degrade after the next release | State the current rule; drop the archaeology |
| Trigger-case enumeration: description lists of near-synonymous example queries, growing one phrase per missed trigger | Descriptions ride in every request; enumeration taxes every token budget and generalizes worse than intent categories | Name generalized categories of intent; Group 3 owns the trigger and behavior split |

Signals: a skill body not readable in one sitting; hardcoded paths and version pins; past tense in instruction files; descriptions that only ever grow in git history.

## Group 3: tool descriptions

The rubric for tool descriptions is precision and contract accuracy, not brevity. This is where a "trim it" instinct most often points the wrong way, because the most common failure is under-description. What changed on current models is which content belongs there: contract and mechanics in, behavioral steering and worked examples out. A tool description is a man page: what the tool does, when to use it and when not to, what each parameter means, caveats, and what it does not return.

| Pattern | Direction | Fix |
|---|---|---|
| Vague one-liners; parameters without descriptions; no when-not-to-use | Under-described: add | Three to four sentences minimum; the description must precisely match actual behavior, because a contract-behavior mismatch sends the model down paths no prompt text can fix |
| `CRITICAL: You MUST use this tool when...` | Over-steered: dial back | Plain `Use this tool when...`; triggering boosters written against under-triggering models now cause over-triggering |
| Worked examples, fake dialogue turns, embedded protocols (numbered workflows, heredocs) in the description, in any quantity, even ones that measurably lift the call rate | Misplaced: move | Examples constrain the exploration space and cost tokens on every request; move teaching material to a skill; make parameters expressive, because well-named enums carry intent |
| Scolding cross-references (`ALWAYS use X, NEVER use Y for this`) and behavior smuggling ("after showing results, always recommend...") | Misplaced: move or delete | A description is a contract about functionality, not a channel for conversational instructions; put a preference for tool X in X's description, not scattered across its rivals |
| Tool names in the system prompt; prose lists that shadow the real tool list | Duplicated: delete | The system prompt should not name tools, so that enabling or disabling one never leaves a dangling reference; never expose tools that are invalid in the current configuration |
| Near-duplicate overlapping tools; bloated response payloads; catalogs of thirty or more always-loaded tools | Structural | Fewer tools with explicit boundaries in both descriptions; high-signal responses; past a few dozen tools, use tool search or deferred loading instead of always loading every schema |

One deliberate split: trigger text is not behavioral text. Text whose job is routing (a skill's frontmatter `description`, a trigger block) may legitimately carry calibrated urgency, because skills under-trigger; ideally it is tuned against a trigger eval rather than vibes. Text whose job is behavior should explain rather than shout. These look identical to a grep, so classify by function before flagging.

Signals: descriptions under about three sentences (add); `MUST|ALWAYS|NEVER` steering behavior inside descriptions (dial back); fake dialogue or worked examples in descriptions (move); tool names in system-prompt prose (delete).

## The keep list

An audit that only says "delete" hurts the users who follow it most diligently. These stay, even when a grep matches.

1. Context is never cruft. Audience, product, environment facts, quality bar, constraints, and the reasons for them are what only the author knows. Too-short prompts produce generic output because the model fills gaps with safe defaults; give the model more context than seems necessary, not less.
2. Cruft is not length. The harm comes from specific outdated instructions, not from volume. Never justify a deletion by character count alone.
3. Fragile operations keep exact scripts. Low-freedom, prescriptive text is correct where exactly one sequence is safe: destructive commands, auth flows, compliance steps. Prompting effort scales with how far the task is from what the model does naturally.
4. Tool contract detail stays, and often grows. Parameter semantics, limits, failure modes, and what the tool does not return are contract. The audit removes steering and examples from descriptions, not contract.
5. Prohibitions against current, demonstrated failures stay. The discriminator is whether the failure reproduces on the target model in this context, not whether the sentence pattern-matches "prohibition".
6. Trigger and routing text may carry calibrated urgency. Flag shouting in bodies, not in load-bearing trigger text.
7. Format-pinning examples on genuinely format-sensitive outputs stay, labeled illustrative.
8. Working redundancy is not cruft. Duplicated or overlapping content that is functioning (the same contract stated in two files, a worked example the prompt could in principle do without, content you would merely organize differently) is a refactoring preference, not a dated pattern. If it is not causing errors and the target model reconciles it, leave it alone; propose consolidation only when the duplicates actually disagree. On a clean surface, report that it is clean.
9. A one-line role statement is fine. Flag identity text only when it substitutes for real context.
10. Deliberate recap is not padding. A single end-of-prompt restatement of the few key constraints is a known, reasonable pattern; the anti-pattern is scattered duplication.
11. Re-baselining adds text too. Matching a prompt to a new model sometimes means adding guidance for the new model's failure modes. The audit's job is fit, in both directions.

## Report shape

One entry per finding, in this shape.

| Field | Content |
|---|---|
| Location | `file:line` or `file:line-range` |
| Evidence | The exact text, quoted |
| Pattern | The group and row above it matches |
| Why obsolete | One or two sentences tying it to the target model's documented behavior, citing the guide row that documents it |
| Confidence | High, Medium, or Low per the rubric below |
| Action | `remove`, `rewrite` (give the replacement), `move` (say where), `add` (under-description: the fix is more text; give it), or `flag` (no edit proposed) |

Confidence rubric. High: documented in the target model's current vendor guide, or errors on the target model. Medium: consistent, widely observed behavior, such as example over-indexing. Low: heuristic or idiom dating; flag, do not edit. A claim whose guide row could not be fetched, or whose row is older than one release cycle, is `unverified` and reports at Low with action `flag`.

Order the report by confidence, highest first. Summarize at the top: counts per group, and the two or three highest-impact findings in prose. Findings that cannot be tied to a pattern and a target-model reason go at the bottom as `flag` items, or not at all.

The flag-versus-fix threshold: a finding that matches a documented row above is a High or Medium finding and gets a concrete proposed action. `flag` is reserved for two things only: Low-confidence idiom dating that no row documents, and items outside the audit's scope. Never downgrade a documented-pattern match to `flag` because it "seems minor", "reads as a soft nudge", "is a product judgment", or "measurably helps"; those are reasons the user may decline the fix, not reasons to withhold it. An audit that correctly identifies the pattern and then proposes nothing has done half the job.
