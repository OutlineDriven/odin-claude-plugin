# Interface design

When the user wants to explore alternative interfaces for a chosen deepening candidate, follow this parallel sub-agent pattern. Based on "Design It Twice" (Ousterhout) — the first idea is unlikely to be the best.

Uses the vocabulary in the survivor SKILL.md — module, interface, seam, adapter, leverage.

## Process

### 1. Frame the problem space

Before spawning sub-agents, write a user-facing explanation of the problem space for the chosen candidate:

- The constraints any new interface would need to satisfy.
- The dependencies it would rely on, and which category they fall into (see [deepening.md](deepening.md)).
- A rough illustrative code sketch to ground the constraints — not a proposal, just a way to make the constraints concrete. Use the codebase's primary language; for cross-language reviewers, parallel sketches in two language families help (e.g., a Rust trait sketch alongside a Go interface sketch, or a Java sealed interface alongside an OCaml `.mli`).

Show this to the user, then immediately proceed to Step 2. The user reads and thinks while the sub-agents work in parallel.

### 2. Spawn sub-agents

Spawn two or more sub-agents in parallel. Two is the floor, because the technique is design
it twice; `SKILL.md` step 3 asks for at least two competing sketches and sets no ceiling.
Each must produce a **radically different** interface for the deepened module.

Prompt each sub-agent with a separate technical brief (file paths, coupling details, dependency category from [deepening.md](deepening.md), what sits behind the seam). The brief is independent of the user-facing problem-space explanation in Step 1. Give each agent a different design constraint:

- Agent 1: "Minimize the interface — aim for 1-3 entry points max. Maximize leverage per entry point."
- Agent 2: "Maximize flexibility — support many use cases and extension."
- Agent 3: "Optimize for the most common caller — make the default case trivial."
- Agent 4, where cross-seam dependencies exist: "Design around ports and adapters."

Each sub-agent outputs:

1. Interface (types, methods, params — plus invariants, ordering, error modes). Express in the codebase's language; if the project is polyglot, give the surface in each owned language family.
2. Usage example showing how callers use it.
3. What the implementation hides behind the seam.
4. Dependency strategy and adapters (see [deepening.md](deepening.md)).
5. Trade-offs — where leverage is high, where it is thin.

### 3. Present and compare

Present designs sequentially so the user can absorb each one, then compare them in prose. Contrast by **depth** (power at the interface), **locality** (where change concentrates), and **seam placement**.

After comparing, give an opinionated recommendation: which design is strongest and why. If elements from different designs would combine well, propose a hybrid. Be decisive: the user wants a strong read, not a menu.
