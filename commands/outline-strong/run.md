---
description: Execute full validation chain orchestration
allowed-tools: Read, Grep, Glob, Bash
---

You are executing Outline-Strong validation orchestration across all verification layers.

## Execution Flow

```
LOAD CONFIG
  |
  v
PARSE ORDER (default: proof,spec,type,contract,tests)
  |
  v
FOR EACH STAGE:
  - Detect artifacts
  - Execute validation
  - Check exit code
  - Gate next stage (if stop-on-fail)
  |
  v
REPORT SUMMARY
```

## Stage Commands

### Stage 1: Proof Validation
```bash
# Lean proofs
fd -e lean $ARGUMENTS -x lean --make {} || exit 13

# Coq proofs
fd -e v $ARGUMENTS -x coqc {} || exit 13

# Dafny proofs
fd -e dfy $ARGUMENTS -x dafny verify {} || exit 13
```

### Stage 2: Specification Verification
```bash
# Quint specs
fd -e qnt $ARGUMENTS && quint verify --main=Module $ARGUMENTS/*.qnt || exit 13

# TLA+ specs
fd -e tla $ARGUMENTS -x tlc {} || exit 13
```

### Stage 3: Type Checking
```bash
# TypeScript
test -f tsconfig.json && tsc --noEmit || exit 13

# Rust
test -f Cargo.toml && cargo check || exit 13

# Python
fd -e py $ARGUMENTS && pyright $ARGUMENTS || exit 13

# Java
fd -e java $ARGUMENTS -x javac {} || exit 13
```

### Stage 4: Contract Verification
```bash
# Delegate to design-by-contract
dbc-verify --lang auto --path $ARGUMENTS || exit $?
```

### Stage 5: Test Execution
```bash
# TypeScript
test -f package.json && npm test || exit 13

# Rust
test -f Cargo.toml && cargo test || exit 13

# Python
fd -e py -g '*test*' $ARGUMENTS && pytest $ARGUMENTS || exit 13

# Java
test -f pom.xml && mvn test || exit 13
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | All stages pass | Validation complete |
| 1 | Precondition violation | Fix contract preconditions |
| 2 | Postcondition violation | Fix contract postconditions |
| 3 | Invariant violation | Fix contract invariants |
| 11 | No artifacts | Check path, add validation artifacts |
| 13 | Stage failed | Fix issues in failed stage |
| 15 | Config error | Check order string, valid stages |

## Execution Modes

### Stop-on-Fail (default)
```bash
# Exit immediately on first failure
for stage in $ORDER; do
  run_stage $stage || exit $?
done
```

### All-Errors
```bash
# Collect all failures, exit with first failure code
ols-validate --all-errors
```

## Gating Rules

| Upstream | Gates | Rationale |
|----------|-------|-----------|
| proof | spec | Proofs must be valid before specs |
| spec | type | Specs must hold before type checking |
| type | contract | Types must be valid before contracts |
| contract | tests | Contracts must pass before tests |

## Configuration

```toml
# .ols-config.toml
[validation]
order = ["type", "contract", "tests"]
stop_on_fail = true
log_level = "info"

[validation.timeouts]
proof = 300
spec = 180
type = 60
contract = 120
tests = 300
```

## Orchestration Commands

```bash
# Full validation (default order)
ols-validate --path $ARGUMENTS

# Custom order
ols-validate --order "type,contract,tests" --path $ARGUMENTS

# All-errors mode
ols-validate --all-errors --path $ARGUMENTS

# Check coverage
ols-check --summary --path $ARGUMENTS
```

## Workflow

```
LOAD CONFIG
  |
  v
DETECT ARTIFACTS (all stages)
  |
  v
EXECUTE ORDER:
  proof -> spec -> type -> contract -> tests
  (skip if no artifacts, gate on failure)
  |
  v
REPORT SUMMARY
  |
  v
EXIT (first failure code or 0)
```

Execute stages in order. Report comprehensive results.
