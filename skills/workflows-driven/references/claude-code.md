# Dynamic Workflows (Claude Code)

Claude Code compiles workflow logic into a background JavaScript orchestration
script and runs it with context-isolated subagents (v2.1.154+).

## Script shape

Export `meta`; the body is top-level orchestration code. The runtime wraps the
body, so a top-level `return <object>` ends the run and passes the result
back; precondition failures `throw new Error(...)`.

```js
export const meta = {
  name: 'audit-auth-surface',
  description: 'Perspective-diverse audit of the auth subsystem',
  whenToUse: 'Optional: preconditions, required args, what the run returns',
  phases: [{ title: 'Survey' }, { title: 'Audit', detail: 'optional' }, { title: 'Verify' }],
}

// args may arrive as the caller's raw JSON string; normalize both forms.
const ARGS = typeof args === 'string' ? JSON.parse(args) : args
if (!ARGS || !Array.isArray(ARGS.units) || ARGS.units.length === 0) {
  throw new Error('audit-auth-surface requires args: { units: [{name, path}] }')
}

const RESULT_SCHEMA = {
  type: 'object',
  required: ['status', 'evidence'],
  properties: {
    status: { type: 'string', enum: ['ok', 'failed'] },
    evidence: { type: 'array', items: { type: 'string' } },
  },
}
```

Injected globals:

- `args`: input arguments passed to the run.
- `agent(prompt, { label, phase, schema, agentType })`: one subagent; returns
  a promise. `schema` makes the return a parsed object; `agentType` selects a
  named agent (plugin agents as `plugin-name:agent-name`).
- `parallel(fns)`: run an array of thunks concurrently; one wave.
- `phase(title)`: advance the progress UI to the named phase.
- `log(message)`: progress line in the run view.

## Wave with a circuit breaker

Judge the breaker on each batch, not the cumulative total, and only on tasks
that actually produced evidence. Stop only while later batches remain.
This excerpt sits inside a dependency-aware loop that defines `batch`,
`remaining`, and `promptFor`.

```js
phase('Migrate')
if (!batch.length) throw new Error('empty batch: nothing eligible to run')
const results = await parallel(
  batch.map(u => () =>
    agent(promptFor(u), {
      label: `migrate:${u.name}`,
      phase: 'Migrate',
      schema: RESULT_SCHEMA,
    })),
)
const measured = results.filter(
  r => r && Array.isArray(r.evidence) && r.evidence.length > 0,
)
const ok = measured.filter(r => r.status === 'ok').length
if (remaining.length && (!measured.length || ok * 3 < measured.length * 2)) {
  log('Batch produced no evidence or too few successes; stopping for rediagnosis')
  return { aborted: true, results }
}
```

Order batches dependency-aware: dependents run only after their dependencies
succeeded, so a dependent never fails for its dependency's reason and falsely
trips the breaker. Each worker writes only inside its assigned path; the
orchestrator (or the main session afterwards) edits shared files.

## Lifecycle

- Ephemeral by default: scripts are compiled on the fly per run.
- Save to `.claude/workflows/` (project) or `~/.claude/workflows/` (personal)
  when the workflow is recurring or parameterizable via `args`; plugins ship
  reusable workflows under `workflows/*.js`.
- `/workflows` lists, pauses, resumes, and saves runs. Runs checkpoint every
  step; a resumed run reuses completed agents' cached outputs and reruns only
  incomplete tasks. Resume, never restart.
- `/effort ultracode` auto-routes large tasks into dynamic workflows.
