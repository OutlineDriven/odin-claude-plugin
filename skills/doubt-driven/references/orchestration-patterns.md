# Orchestration Patterns

Catalog of subagent orchestration patterns worth endorsing, plus the anti-patterns that shadow them. Read it before wiring a command that coordinates multiple subagent roles, or before introducing a role that "wraps" existing ones.

Governing rule: **the user (or a command) is the orchestrator. Subagents do not invoke other subagents.** Skills are mandatory hops inside a single subagent's workflow, not a hand-off to another agent.

---

## Endorsed patterns

### 1. Direct invocation (no orchestration)

One role, one perspective, one artifact. The default and the cheapest option.

```
user → review role → report → user
```

**Use when:** the work is one perspective on one artifact and you can describe it in one sentence.

**Examples:**
- "Review this PR" → a review role
- "Find security issues in `auth.ts`" → a security-audit role
- "What tests are missing for the checkout flow?" → a test/coverage role

**Cost:** one round trip. The baseline you should always compare orchestrated patterns against.

---

### 2. Single-role command

A command that wraps one role with the project's standard skills, so the user does not re-explain the workflow every time.

```
review command → review role (with standard skills) → report
```

**Use when:** the same single-role invocation repeats with the same setup.

**Cost:** same as direct invocation. The command is a saved prompt.

**Anti-signal:** if the command's body is mostly "decide which role to call," delete it and let the user call the role directly.

---

### 3. Parallel fan-out with merge

Multiple roles operate on the same input concurrently, each producing an independent report. A merge step in the orchestrator's own context synthesizes them into one decision.

```
                       ┌─→ review role          ─┐
release gate → fan out ┼─→ security-audit role  ─┤→ merge → go/no-go + rollback
                       └─→ test/coverage role   ─┘
```

**Use when:**
- The sub-tasks are genuinely independent (no shared mutable state, no ordering dependency)
- Each subagent benefits from its own context window
- The merge step is small enough to stay in the orchestrator's context
- Wall-clock latency matters

**Cost:** N parallel subagent contexts + one merge turn. Higher than direct invocation, but faster wall-clock, and each subagent stays focused on its single perspective.

**Validation checklist before adopting this pattern:**
- [ ] Can I run all subagents at the same time without ordering issues?
- [ ] Does each role produce a different *kind* of finding, not the same finding from a different angle?
- [ ] Will the merge step fit in the orchestrator's remaining context?
- [ ] Is the user's wait time long enough that parallelism is noticeable?

If any answer is "no," fall back to direct invocation or a single-role command.

---

### 4. Sequential pipeline as user-driven commands

The user runs commands in a defined order, carrying context (or commit history) between them. No orchestrator agent — the user is the orchestrator.

```
user runs:  spec  →  plan  →  build  →  verify  →  review  →  ship
```

**Use when:** the workflow has dependencies (each step needs the previous step's output) and human judgment between steps adds value.

**Cost:** one subagent context per step. Free for the orchestration layer, because there is no orchestrator agent.

**Why not automate it:** a lifecycle-orchestrator agent would (a) lose nuance between steps by summarizing for hand-off, (b) skip the human checkpoints that catch wrong-direction work early, and (c) double the token cost via paraphrasing turns.

---

### 5. Research isolation (context preservation)

When a task requires reading large amounts of material that should not pollute the orchestrator's context, spawn a research subagent that returns only a digest.

```
orchestrator → research subagent (reads 50 files) → digest → orchestrator continues
```

**Use when:**
- The main session needs to stay focused on a downstream task
- The investigation result is much smaller than the input it consumes
- Decision quality benefits from the orchestrator having room to think after

**Examples:** "Find every call site of this deprecated API across the monorepo," "Summarize what these 30 ADRs say about caching."

**Cost:** one isolated subagent context. Worth it any time the alternative is loading hundreds of files into the main context.

**Prefer a built-in read-only exploration subagent** over a custom research role where the harness ships one — they run on a cheap model, are denied write/edit tools, and are purpose-built for this pattern. Define a custom research subagent only when the built-in does not fit (e.g. you need a domain-specific system prompt the model would not infer).

---

## Harness compatibility

This catalog is harness-agnostic. Here is how the patterns map onto common agentic harness primitives, and where the platform enforces the rules for you.

### Where roles live

Subagent definitions live in the harness's subagent directory (often under a plugin root). They are auto-discovered when the plugin or extension is enabled; no path configuration is needed beyond placing the file.

### Subagents vs. agent teams

Some harnesses expose two parallelism primitives. Pattern 3 (parallel fan-out with merge) maps to **subagents**. When workers must talk to each other, use **agent teams** instead, where supported.

| | Subagents | Agent teams |
|--|-----------|-------------|
| Coordination | Orchestrator fans out, subagents only report back | Teammates message each other, share a task list |
| Context | Own context window per subagent | Own context window per teammate |
| When to use | Independent tasks producing reports | Collaborative work needing discussion |
| Status | Stable | Often experimental — may require a feature flag |
| Cost | Lower | Higher — each teammate is a separate model instance |

**A role definition works in both modes.** Spawned as subagents, roles report findings to the main session; spawned as teammates, they challenge each other's findings directly. The definition is the same; only the spawning context changes.

One subtlety: frontmatter fields such as `skills` and `mcpServers` may be honored when a role runs as a subagent but **ignored when it runs as a teammate** — teammates often load skills and MCP servers from session and user settings instead. If a role depends on a specific skill or MCP server being loaded, configure it at the session level so it is available in both modes.

### Platform-enforced rules

Two rules in this catalog are not just convention — many harnesses enforce them:

- **Subagents cannot spawn other subagents.** Anti-pattern B (role-calls-role) and anti-pattern D (deep role trees) cannot exist by construction.
- **No nested teams.** Teammates cannot spawn their own teams. The same anti-patterns are blocked at the team level.

Where the harness enforces these, contributors cannot accidentally build the anti-patterns; the attempt simply fails to load.

### Built-in subagents to know about

Before defining a custom subagent, check whether a built-in covers the role:

| Built-in (typical) | Purpose |
|----------|---------|
| Exploration/research subagent | Read-only codebase search and analysis. Use this for Pattern 5 (research isolation). |
| Planning subagent | Read-only research during planning. |
| General-purpose subagent | Multi-step tasks needing both exploration and modification. |

Do not redefine these. Layer specialist roles (review, security-audit, test/coverage) on top of them.

### Frontmatter restrictions

Plugin-scoped subagents may not support every frontmatter field — fields like hooks, MCP servers, or permission mode can be silently ignored depending on harness. If a role needs one of those, the user typically copies the definition into a user- or project-scoped location instead. Confirm the supported field set against your harness docs; identity, description, tool allow/deny lists, model, skills, and memory are commonly honored.

### Spawning multiple subagents in parallel

Parallel fan-out (Pattern 3) generally requires issuing **multiple subagent calls in a single orchestrator turn**. Sequential turns serialize execution. Any fan-out command should issue its spawns in one turn.

---

## Worked example: agent teams for competing-hypothesis debugging

This shows when to reach for **agent teams** instead of a subagent fan-out. The two look similar — both spawn the same handful of roles — but the value comes from a different place.

### The scenario

> *Checkout occasionally hangs for ~30 seconds before completing. It happens roughly once every 50 sessions. No errors in logs. Started after last week's release.*

Plausible root causes (mutually exclusive, all fit the symptoms):

1. A race condition in the new payment-confirmation flow
2. An auth check that occasionally falls through to a slow synchronous network call
3. A missing index on a query that scales with cart size
4. A flaky third-party API where the SDK retries silently before timing out

A single agent picks the first plausible theory and stops investigating. A fan-out of independent subagents would have each role report separately — but the reports never meet, so nothing rules out the wrong theories. With independent investigators actively trying to disprove each other, the theory that survives is much more likely to be the actual root cause.

### Why this is not a fan-out job

| | Subagent fan-out | Agent teams |
|--|--------------------|-------------|
| Subagents see | The same diff, different lenses | A shared task list, each other's messages |
| Output | Independent reports → one merge | Adversarial debate → consensus root cause |
| Right when | You want a verdict on a known artifact | You want to *find* the artifact among hypotheses |

A fan-out is a verdict; an agent team is an investigation.

### Setup

Agent teams are often experimental — enable the team feature in your harness settings where it is gated behind a flag. Existing role definitions are picked up automatically; there are no team-config files to author by hand.

### The trigger prompt

State the goal in natural language to the lead session:

```
Users report checkout hangs for ~30 seconds intermittently after last
week's release. No errors in logs.

Create an agent team to debug this with competing hypotheses. Spawn
three teammates using the existing role types:

  - review role         — investigate race conditions and blocking
                          calls in the checkout code path
  - security-audit role — investigate auth checks, session handling,
                          and any synchronous network calls added recently
  - test/coverage role  — propose tests that would distinguish between
                          the hypotheses and check coverage gaps in checkout

Have them message each other directly to challenge each other's
theories. Update findings as consensus emerges. Only converge when
two teammates agree they can disprove the others'.
```

The lead spawns three teammates referencing the existing role names. Each role body is **appended** to its teammate's system prompt as additional instructions (on top of the team-coordination instructions the lead installs); the trigger prompt becomes the task.

### What happens

1. Each teammate runs in its own context window, exploring the codebase from its own lens.
2. Teammates message findings to each other directly. The lead does not have to relay.
3. The shared task list shows who is investigating what, visible through the harness's team view.
4. When the review role finds a concurrent batch that should run sequentially — a JavaScript `Promise.all`, a Go `errgroup` of goroutines, or a Python `asyncio.gather` — it messages the security-audit role to confirm the auth call is not part of the race. That role checks and replies, either confirming the race or producing counter-evidence.
5. The test/coverage role proposes a focused integration test for whichever theory is winning, which the team uses to verify before declaring consensus.
6. The lead synthesizes the converged finding and presents it to you.

You can interrupt any teammate through the harness's controls — useful for redirecting an investigator that has gone down a wrong path.

### When to clean up

When the investigation lands on a root cause, tell the lead to clean up the team. Always clean up through the lead, not a teammate — teammates lack full team context for cleanup.

### Cost expectation

Three teammates running for ~10–15 minutes of investigation costs noticeably more than the same three roles spawned as a subagent fan-out. The justification is *quality of conclusion* — for production debugging where the wrong fix is expensive, the extra tokens are a bargain. For a routine PR review, stick with the fan-out.

### Anti-pattern in this scenario

Do **not** rebuild this as a debug command that fans out subagents. Subagents cannot message each other — you lose the adversarial debate that makes the pattern work. If a workflow keeps recurring, document the trigger prompt above as a snippet rather than wrapping it in a command that misuses subagents.

### When NOT to use agent teams

- Production-bound verdict on a known diff → subagent fan-out.
- One specialist perspective on one artifact → direct role invocation.
- Sequential lifecycle (spec → plan → build) → user-driven commands (Pattern 4).
- Read-heavy research with a small digest → built-in exploration subagent.

Reach for agent teams only when teammates **need** to challenge each other to produce the right answer.

---

## Anti-patterns

### A. Router role ("meta-orchestrator")

A role whose job is to decide which other role to call.

```
work command → router role → "this needs a review" → review role → router (paraphrases) → user
```

**Why it fails:**
- Pure routing layer with no domain value
- Adds two paraphrasing hops → information loss + roughly 2× token cost
- The user already knew they wanted a review; they could have called the review command directly
- Replicates the work that commands and intent mapping in project memory already do

**Instead:** add or refine commands. Document intent → command mapping in project memory.

---

### B. Role that calls another role

A review role that internally invokes a security-audit role when it sees auth code.

**Why it fails:**
- Roles are designed to produce a single perspective; chaining them defeats that
- The summary the calling role passes loses context the called role needs
- Failure modes multiply (which role's output format wins? whose rules apply?)
- Hides cost from the user

**Instead:** have the calling role *recommend* a follow-up audit in its report. The user or a command runs the second pass.

---

### C. Sequential orchestrator that paraphrases

An agent that runs spec, then plan, then build, etc. on the user's behalf.

**Why it fails:**
- Loses the human checkpoints that catch wrong-direction work
- Each hand-off summarizes context — accumulated drift over a long pipeline
- Doubles token cost: orchestrator turn + subagent turn for every step
- Removes user agency at exactly the points where judgment matters most

**Instead:** keep the user as the orchestrator. Document the recommended sequence and let users invoke it.

---

### D. Deep role trees

A release gate that calls a pre-ship coordinator that calls a quality coordinator that calls a review role.

**Why it fails:**
- Each layer adds latency and tokens with no decision value
- Debugging becomes a multi-level investigation
- The leaf roles lose context to multiple summarization steps

**Instead:** keep orchestration depth at most 1 (command → roles). The merge happens in the orchestrator.

---

## Decision flow

When considering a new orchestrated workflow, walk this flow:

```
Is the work one perspective on one artifact?
├── Yes → Direct invocation. Stop.
└── No  → Will the same composition repeat?
         ├── No  → Direct invocation, ad hoc. Stop.
         └── Yes → Are sub-tasks independent?
                  ├── No  → Sequential commands run by user (Pattern 4).
                  └── Yes → Parallel fan-out with merge (Pattern 3).
                           Validate against the checklist above.
                           If any check fails → fall back to single-role command (Pattern 2).
```

---

## When to add a new pattern to this catalog

Add a new entry only after:

1. You have used the pattern at least twice in real work
2. You can name a concrete artifact that demonstrates it
3. You can explain why an existing pattern would not have worked
4. You can describe its anti-pattern shadow (what people will mistakenly build instead)

Premature catalog entries become aspirational documentation that no one follows.
