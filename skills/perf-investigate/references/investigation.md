# Performance Investigation Contract

This reference is the hard contract for the `perf-investigate` op-cell. It is intentionally self-contained: no external workflow state, no editor adapters, no run-state ceremony.

## Phase Contract

### Phase 1 — Setup

Required inputs:

- `scenario`: named workload, endpoint, command path, UI path, benchmark, or user journey.
- `command`: runnable command that reproduces the workload or benchmark.
- `version`: baseline identifier. Use a release tag, commit label, branch slug, or user-provided version string.
- `quote`: the user's exact problem statement, copied verbatim.

Required artifact:

- `.outline/perf/investigations/<id>.md`

Gate:

- Refuse to continue until scenario, command, and version exist.
- If success metric is missing, record `success_metric: unknown` and infer only from measured data; do not invent an SLO.

### Phase 2 — Baseline

Run a repeated, sequential series for at least 60 seconds. Prefer `hyperfine`:

```sh
hyperfine --warmup 3 --min-runs 10 --export-json .outline/perf/baselines/<version>.hyperfine.json '<command>'
```

If the workload needs an explicit duration flag, the command itself should be configured for `>=60s`. Examples:

```sh
DURATION_SECONDS=60 npm run bench:checkout
BENCH_SECONDS=60 python -m benchmarks.checkout
```

Required artifact:

- `.outline/perf/baselines/<version>.json`

Gate:

- One JSON file per version.
- Preserve raw `hyperfine` output path.
- Include environment metadata: OS, CPU model if available, runtime versions relevant to the command, commit/version label, date, and command.
- Re-run anomalous samples when variance invalidates comparison. Mark variance as evidence, not as a win/loss.

### Phase 3 — Hypotheses

Maximum five hypotheses. Every hypothesis must cite evidence before it makes a claim.

Allowed evidence forms:

- `git:<command summary>` — recent changes, churn, regression commits, bug-fix density, ownership gaps.
- `file:<path:line>` — source mechanism: loop, allocation, query, serialization, I/O, lock, cache, parser, scheduler, network boundary.
- `baseline:<path>` — measured metric signal: latency, throughput, RSS, allocations, p95/p99, variance.
- `profile:<path>` — frame, stack, or flamegraph region.

Disallowed:

- "This might be slow" without source evidence.
- More than five theories.
- Optimization proposal before profiling or controlled test.
- Confidence `high` without direct measured evidence.

Confidence rules:

| Confidence | Evidence required | Meaning |
|---|---|---|
| high | profile or baseline evidence + source mechanism | Likely root cause or strong experimental target |
| med | source mechanism + correlated git/baseline signal | Plausible and worth profiling |
| low | weak source path or scenario proximity only | Scout only; cannot justify a code change |

Template:

```yaml
hypotheses:
  - id: H1
    claim: "<falsifiable performance claim>"
    evidence:
      - "git:<commit/log summary>"
      - "file:<path:line> <mechanism>"
    confidence: low|med|high
    predicted_delta: "<metric direction, e.g. p95 latency down 10-20%>"
    test: "<single profiler check or one-change experiment>"
```

### Phase 4 — Code-paths

Goal: locate scenario entry points and candidate hot files before choosing the profiler target.

Primary indexed path:

```text
codegraph_explore "<scenario terms> entry points handlers hot path"
codegraph_search "<symbol-or-route>"
codegraph_callers "<suspect symbol>"
codegraph_callees "<entry symbol>"
codegraph_impact "<symbol-or-file>"
```

Fallback commands:

```sh
git grep -nE '<scenario-keyword|route|handler|command|metric-name>' -- ':!node_modules' ':!dist' ':!build'
ast-grep -p 'function $NAME($$$ARGS) { $$$BODY }' <path>
ast-grep -p 'async function $NAME($$$ARGS) { $$$BODY }' <path>
ast-grep -p '$OBJ.$METHOD($$$ARGS)' <path>
```

Record shape:

```yaml
code_paths:
  - file: src/path/file.ext
    line: 123
    symbol: handleCheckout
    role: entrypoint|hot-file|callee|allocator|io-boundary|query|parser|scheduler
    evidence: "why this path participates in the scenario"
    hypotheses: [H1, H3]
```

Gate:

- Keep 10-15 candidates maximum.
- Every path must have `file:line` or a concrete symbol reference.

### Phase 5 — Profiling

Pick one profiler family for the scenario. Produce a flamegraph or flamegraph-compatible profile artifact.

Profiler recipes:

| Runtime | Command | Artifact |
|---|---|---|
| Node.js | `node --cpu-prof --cpu-prof-dir .outline/perf/profiles/<id> --cpu-prof-name cpu.cpuprofile <script>` | `.cpuprofile` opened with Speedscope/DevTools |
| Python | `py-spy record --duration 60 --rate 100 --output .outline/perf/profiles/<id>/flame.svg -- <command>` | `flame.svg` |
| Go | `go test -run '^$' -bench '<bench>' -cpuprofile .outline/perf/profiles/<id>/cpu.pprof ./<pkg>` then `go tool pprof -svg <binary> .outline/perf/profiles/<id>/cpu.pprof > .outline/perf/profiles/<id>/flame.svg` | `cpu.pprof`, `flame.svg` |
| JVM | `asprof -d 60 -f .outline/perf/profiles/<id>/flame.html <pid-or-java-command>` | `flame.html` |
| Native/Rust/C/C++ | `perf record -F 99 -g -o .outline/perf/profiles/<id>/perf.data -- <command>` then `perf script -i .outline/perf/profiles/<id>/perf.data > .outline/perf/profiles/<id>/perf.stacks` | `perf.data`, stacks; convert with local flamegraph tooling if installed |

Record shape:

```yaml
profile:
  profiler: node --cpu-prof|py-spy|pprof|async-profiler|perf
  command: "<exact command>"
  artifacts:
    - .outline/perf/profiles/<id>/flame.svg
  top_frames:
    - frame: "<function>"
      file: "<path:line or unknown>"
      signal: "self-time|total-time|allocation|blocked-time"
      percent: "<if available>"
      hypothesis: H1
```

Gate:

- If symbols are missing, record the missing-symbol cause and rebuild with symbols/frame pointers before interpreting frames where feasible.
- Top-frame interpretation must distinguish self-time from total-time.
- Do not optimize based only on profiler output if the workload does not match the baseline scenario.

### Phase 6 — Optimization

One change at a time. Every experiment must return to baseline before the next experiment.

Experiment protocol:

1. Name the hypothesis: `H1`, `H2`, etc.
2. State the one change in one sentence.
3. Apply only that change.
4. Run at least two `hyperfine` comparison passes.
5. Record raw paths and summary delta.
6. Revert changed files.
7. Confirm no experiment residue remains.

Benchmark recipe:

```sh
hyperfine --warmup 3 --min-runs 10 --export-json .outline/perf/experiments/<id>/<experiment>-run1.json '<baseline-command>' '<experiment-command>'
hyperfine --warmup 3 --min-runs 10 --export-json .outline/perf/experiments/<id>/<experiment>-run2.json '<baseline-command>' '<experiment-command>'
```

Revert recipe:

```sh
git restore -- <changed-files>
git diff --exit-code -- <changed-files>
```

Record shape:

```yaml
experiments:
  - id: E1
    hypothesis: H1
    one_change: "<summary>"
    changed_files:
      - src/path/file.ext
    runs:
      - .outline/perf/experiments/<id>/E1-run1.json
      - .outline/perf/experiments/<id>/E1-run2.json
    delta:
      metric: p95_latency_ms
      baseline: 120.0
      experiment: 98.0
      relative: -18.3%
      variance_note: "stable|unstable|conflicting"
    verdict: keep|reject|inconclusive
    reverted: true
```

Gate:

- Reject stacked edits.
- Reject experiments without two comparison runs unless the run failed and the verdict is `inconclusive`.
- If correctness tests exist for touched files, run the narrow relevant test before considering `keep`.

### Phase 7 — Decision

A decision is required even when the result is inconclusive.

Verdicts:

- `keep`: measured improvement is meaningful, stable, and does not break correctness.
- `reject`: no improvement, worse metric, or complexity not justified by improvement.
- `continue`: evidence points to another bounded experiment.
- `rerun`: measurement is invalid or too noisy.
- `stop`: budget met, evidence exhausted, bottleneck outside current scope, or cost exceeds likely gain.

Template:

```yaml
decision:
  verdict: keep|reject|continue|rerun|stop
  rationale: "<evidence-backed reason>"
  evidence:
    - baseline:.outline/perf/baselines/<version>.json
    - profile:.outline/perf/profiles/<id>/flame.svg
    - experiment:.outline/perf/experiments/<id>/E1-run1.json
  next: "<next exact action or stop condition>"
```

Gate:

- No verdict without rationale.
- No rationale without artifact links or `file:line` evidence.

### Phase 8 — Consolidation

Consolidation makes the investigation auditable.

Checklist:

- Ledger complete for all phases entered.
- Baseline JSON exists and is the only baseline for the version.
- Hypotheses have final status: supported, refuted, untested, or inconclusive.
- Profile artifacts are linked and interpreted.
- Experiments include run paths, deltas, verdicts, and revert status.
- Kept change has a regression guard or an explicit reason why no guard is feasible.
- Rejected changes are not left applied.

## Ledger Format

Path: `.outline/perf/investigations/<id>.md`

```markdown
# Performance Investigation: <id>

- Date: <YYYY-MM-DD>
- Scenario: <scenario>
- Command: `<command>`
- Version: <version>
- User quote: "<verbatim user quote>"
- Success metric: <metric or unknown>

## Phase 1 — Setup

Decision: proceed|blocked
Rationale: <why>
Evidence:
- quote: "<verbatim>"
- scenario: <scenario>
- command: `<command>`
- version: <version>

## Phase 2 — Baseline

Decision: accepted|rerun-required
Rationale: <variance and metric notes>
Evidence:
- baseline: `.outline/perf/baselines/<version>.json`
- raw: `.outline/perf/baselines/<version>.hyperfine.json`

## Phase 3 — Hypotheses

Decision: accepted|needs-more-evidence
Rationale: <why the list is bounded and evidence-backed>
Evidence:
- H1: <git/file/baseline evidence>

## Phase 4 — Code-paths

Decision: accepted|needs-wider-search
Rationale: <why these paths are sufficient>
Evidence:
- `<path:line>` <symbol/role>

## Phase 5 — Profiling

Decision: accepted|rerun-required
Rationale: <why profile matches scenario and symbols are adequate>
Evidence:
- profiler: `<command>`
- artifact: `<path>`
- hotspot: `<frame/file:line>`

## Phase 6 — Optimization

Decision: keep|reject|inconclusive
Rationale: <delta and correctness notes>
Evidence:
- experiment: `<path>`
- changed files: `<paths>`
- reverted: true|false

## Phase 7 — Decision

Decision: keep|reject|continue|rerun|stop
Rationale: <final rationale>
Evidence:
- baseline/profile/experiment links
Next: <next action or stop>

## Phase 8 — Consolidation

Decision: complete|blocked
Rationale: <artifact integrity and guard status>
Evidence:
- baseline: `<path>`
- profiles: `<paths>`
- experiments: `<paths>`
- guard: `<path or none-feasible reason>`
```

Rules:

- Every phase section has `Decision`, `Rationale`, and `Evidence`.
- User quote stays exact in the header and setup phase.
- Commands are recorded exactly as run.
- Missing data is written as `unknown` or `not collected`; never invent values.

## Baseline JSON Schema

Path: `.outline/perf/baselines/<version>.json`

```json
{
  "schemaVersion": 1,
  "version": "v1.2.3-or-commit-slug",
  "investigationId": "2026-06-05-checkout-latency",
  "recordedAt": "2026-06-05T00:00:00.000Z",
  "scenario": {
    "description": "Checkout endpoint p95 latency under representative load",
    "successMetric": "p95_latency_ms",
    "userQuote": "verbatim user quote"
  },
  "command": "npm run bench:checkout",
  "policy": {
    "minimumDurationSeconds": 60,
    "warmupRuns": 3,
    "minRuns": 10,
    "aggregate": "median",
    "sequential": true
  },
  "environment": {
    "os": "linux",
    "cpu": "unknown or detected CPU string",
    "runtime": {
      "node": "vX.Y.Z",
      "python": null,
      "go": null,
      "java": null,
      "rust": null
    },
    "commit": "unknown-or-sha",
    "notes": []
  },
  "samples": [
    {
      "run": 1,
      "durationSeconds": 60,
      "metrics": {
        "meanSeconds": 1.23,
        "stddevSeconds": 0.04,
        "p95LatencyMs": 120.5,
        "throughputPerSecond": 500.0,
        "rssMb": null
      },
      "rawArtifact": ".outline/perf/baselines/<version>.hyperfine.json"
    }
  ],
  "summary": {
    "metrics": {
      "meanSeconds": 1.23,
      "p95LatencyMs": 120.5,
      "throughputPerSecond": 500.0,
      "rssMb": null
    },
    "variance": {
      "stddevSeconds": 0.04,
      "coefficientOfVariation": 0.032,
      "note": "stable"
    }
  },
  "artifacts": {
    "hyperfine": ".outline/perf/baselines/<version>.hyperfine.json",
    "logs": []
  }
}
```

Validation:

- `schemaVersion` is present.
- `version` equals the filename stem.
- `policy.minimumDurationSeconds >= 60`.
- `policy.sequential === true`.
- `samples` is non-empty.
- Each sample has metrics or a raw artifact explaining where metrics can be recovered.
- `scenario.userQuote` is verbatim.

## Delta Rules

Use relative and absolute delta:

```text
absolute_delta = experiment - baseline
relative_delta = (experiment - baseline) / baseline
```

Interpret direction by metric:

- latency, duration, RSS, allocations, error rate: lower is better
- throughput, requests/sec, ops/sec: higher is better

Mark an experiment `inconclusive` when:

- run directions conflict
- confidence interval overlaps enough that the difference is not actionable
- workload differs from baseline
- correctness check fails
- profiler contradicts the hypothesis

## Consolidation Output

Final summary shape:

```yaml
summary:
  scenario: <scenario>
  version: <version>
  baseline: .outline/perf/baselines/<version>.json
  primary_bottleneck: <file:line/frame or unknown>
  decision: keep|reject|continue|rerun|stop
  kept_changes:
    - <path or none>
  rejected_changes:
    - <experiment id and reason>
  guards:
    - <benchmark/test path or none-feasible reason>
  next:
    - <one concrete action or empty>
```
