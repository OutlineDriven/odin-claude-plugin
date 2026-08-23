# Gate templates

Three templates in one file: the plan contract (orchestrated mode), leaf gates, and branch/integration gates. Format spec and writing guide: `references/gates.md`.

## Plan contract (orchestrated mode)

```markdown
# Plan: <task>

Depth: tree <N>   Mode: orchestrated
Budget note: <what a competent single pass would take; context, not arithmetic>

## Contract

Decided BEFORE fan-out. Everything a leaf could get wrong about its neighbors:

- Interfaces: <function signatures, file formats, API shapes>
- Data ownership: <which leaf owns which files; no two leaves share a file>
- Naming and conventions: <casing, folder layout, error handling style>

## Tree

- 1 <task>
  - 1.1 <branch> .......... .outline/gates/node-1.1.md
    - 1.1.1 <leaf> ........ .outline/gates/leaf-1.1.1.md
    - 1.1.2 <leaf> ........ .outline/gates/leaf-1.1.2.md
  - 1.2 <branch> .......... .outline/gates/node-1.2.md
    - 1.2.1 <leaf> ........ .outline/gates/leaf-1.2.1.md
    - 1.2.2 <leaf> ........ .outline/gates/leaf-1.2.2.md

## Status log

Append-only. One line per event: leaf started, leaf verified, gate abandoned.
Never rewrite lines above; appending keeps the file cheap to re-read and diff.

- <timestamp or step> plan written, contract fixed
```

## Leaf gates

One file per leaf (`.outline/GATES.md` solo, `.outline/gates/leaf-<id>.md` orchestrated). One box per outcome. Boxes are flipped by `gate_check.py` when CHECK output matches EXPECT, or by hand for manual gates. A checked box with EVIDENCE still reading `pending` counts as UNMET. If a gate becomes impossible, do not delete it; add `ABANDON: G<n> <reason>` and report it.

```markdown
# Gates: <leaf or task name>

Scope: <one line: what this unit of work delivers>

- [ ] G1: <observable outcome, stated so a stranger could judge it>
  CHECK: <shell command that proves it>
  EXPECT: <substring the command output must contain, or /regex/>
  EVIDENCE: pending

- [ ] G2: <another runnable outcome>
  CHECK: <command>
  EXPECT: <substring or /regex/>
  EVIDENCE: pending

- [ ] G3: <manual gate, when no command can prove it>
  EVIDENCE: pending
```

## Branch gates (integration)

Branch gates exist because finished parts do not imply a finished whole. Do not mark N1 by trusting child reports: re-run their checks yourself (verification hierarchy, `references/method.md`).

```markdown
# Gates: <branch name> (integration)

Scope: children <list child leaves/branches> merged into one working whole

- [ ] N1: every child leaf's gates file is fully checked (no unchecked boxes, no pending evidence)
  CHECK: python3 <skill-dir>/scripts/gate_check.py --status .outline/gates/leaf-<a>.md .outline/gates/leaf-<b>.md
  EXPECT: ALL MET
  EVIDENCE: pending

- [ ] N2: interfaces match the plan contract
  CHECK: <build / typecheck / import test command>
  EXPECT: <success marker>
  EVIDENCE: pending

- [ ] N3: cross-child behavior works end to end
  CHECK: <integration test, smoke script, or curl sequence>
  EXPECT: <success marker>
  EVIDENCE: pending

- [ ] N4: nothing regressed in siblings this merge touched
  CHECK: <targeted re-run of affected sibling checks>
  EXPECT: <success marker>
  EVIDENCE: pending
```
