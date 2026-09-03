# Eval-authored workflows (oh-my-pi)

The fan-out primitive is orchestration code in the `eval` tool: author the
wave as a Python or JS cell, dispatch with `agent()`, batch with `parallel()`
or `pipeline()`. Those helpers route through the same `runSubprocess` path,
the same `getSessionSpawns()` policy, and the same `task.maxConcurrency`
ceiling as the `task` tool, so an eval wave is real subagent dispatch and not
an emulation of one.

Use the `task` tool for work the parent does not block on: background jobs
collected later, `hub`-coordinated peers, and detached processes. A workflow
phase is a wave the parent waits on, so it belongs in `eval`.

## Helpers

Python signatures below; the JS backend takes the same options as a trailing
object and awaits each call.

- `agent(prompt, *, agent="task", label=None, schema=None, isolated=None,
  apply=None, merge=None, handle=False)`: run one subagent, blocking until it
  finishes. `schema` (a JSON Schema dict) forces validated structured output,
  so downstream code branches on an object instead of on parsed prose.
  `label` names the `agent://<id>` artifact. `handle=True` returns a DAG node
  dict carrying that handle for a later stage to reference.
- `parallel(thunks)`: run zero-argument callables concurrently through a
  bounded pool, preserving input order. A raising thunk propagates, so wrap
  risky work in `try`/`except` inside the thunk to keep partial results. Bind
  loop variables with a default argument (`lambda d=d: ...`) or every thunk
  captures the last one.
- `pipeline(items, *stages)`: map items left to right with a barrier between
  stages. Every item clears stage N before stage N+1 starts, so reach for it
  only when a stage needs the whole previous set: dedup, merge, early exit.
- `completion(prompt, *, model="default", system=None, schema=None)`: one-shot
  stateless model call with no tools or history. Tiers are `smol`, `default`,
  and `slow`. Use it for cheap classification or scoring inside a wave.
- `log(message)` writes a progress line; `phase(title)` sets the phase heading
  for the following lines.
- `budget`: `budget.total` is the output-token ceiling attribute or `None`;
  `budget.spent()` and `budget.remaining()` are calls. Gate a loop on
  `budget.total` first, because it is `None` when the user set no ceiling.

## Wave shape

One eval call is one phase. `agent()` takes only a prompt, so eval has no
batch-context channel: write the wave's `# Goal`, `# Constraints`, and
`# Contract` block once to a `local://` file and name that file in every
prompt, ahead of the assignment's `# Target`, `# Change`, `# Acceptance`.

Wrap each item's whole chain in a function so items flow independently, then
run the chains under `parallel()`. A raising thunk takes the whole wave down,
so contain failures per item and let the reduction see the survivors. This
excerpt assumes `UNITS`, `survey_prompt()`, and the `FINDINGS` schema are
already bound.

```python
VERDICT = {
    "type": "object",
    "required": ["is_real"],
    "properties": {"is_real": {"type": "boolean"}},
}

def audit(unit):
    try:
        found = agent(survey_prompt(unit), agent="scout",
                      label=f"survey:{unit}", schema=FINDINGS)
        return parallel([
            lambda f=f: {**f, "verdict": agent(
                f"Refute if you can; refuted when unsure: {f['title']}",
                agent="reviewer", label=f"verify:{f['id']}", schema=VERDICT)}
            for f in found["items"]
        ])
    except Exception as exc:
        log(f"unit {unit} failed: {exc}")
        return None

phase("Audit")
results = parallel([lambda u=u: audit(u) for u in UNITS])
measured = [g for g in results if g is not None]
confirmed = [f for g in measured for f in g if f["verdict"]["is_real"]]
log(f"{len(confirmed)} confirmed; {len(results) - len(measured)} units failed")
```

Judge a circuit breaker on the batch that just ran, counting only the units
that returned evidence (`measured`), and stop only while later batches
remain. A wave where nothing measured is a broken playbook, not a clean run.

## Agent typing

Type every dispatch through the `agent=` parameter; omitting it inherits the
default worker.

- Read-only research and code survey: `scout`. External libraries and docs:
  `librarian`.
- Edits and multi-step work: `task_fast`, `task_budget`, `task_deep`, or
  `task_ultra`. Size the worker to the slice, never to the session's model.
- Gates: `reviewer` (post-diff audit), `critic` (pre-commitment red-team).

## Coordination and durability

- Everything runs inline and synchronously inside the eval call. There is no
  background mode, no resume, no separate progress view. A wave that dies is
  re-dispatched from the ledger, never resumed.
- Runtime state persists across eval calls, so scout in one call and fan out
  in the next. Reuse the names already bound instead of re-importing them.
- Large payloads travel as `local://` files or `artifact://` ids named in the
  prompt, never pasted into it. Subagents start blank and never see the
  conversation, so each assignment carries every requirement its slice needs.
- The per-cell timeout is a runtime-work budget, not a wall clock. Host-side
  `agent()`, `parallel()`, and `completion()` calls pause the idle timer, so a
  long wave does not burn the cell's allowance.
- Subagent recursion obeys `task.maxRecursionDepth` (default 2; a negative
  value disables the cap). There is no eval-specific ceiling.
- Durable progress lives in the todo list and a ledger file, one entry per
  phase.

## The `workflowz` keyword

The standalone lowercase word `workflowz` in a prompt injects this same
contract for that turn, and only when both `task` and `eval` are in the
active tool set. The skill and the keyword agree; when both fire, follow the
shared contract once.
