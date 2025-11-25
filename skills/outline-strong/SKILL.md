---
name: outline-strong-development
description: Automated validation orchestration across proof, spec, type, contract, and test artifacts with configurable precedence and gating.
---

# Outline-Strong Development Skill

## Commands

### ols-validate
Execute full validation chain in precedence order.

**Usage**: `ols-validate [--order ORDER] [--stop-on-fail] [--all-errors]`

**Algorithm**:
```
1. Load configuration (env vars, CLI flags, config file)
2. Parse validation order (default or override)
3. For each stage in order:
   a. Detect artifacts for stage
   b. If artifacts found, execute stage validation
   c. If stage fails and stop-on-fail, exit with failure code
   d. If stage fails and all-errors, log failure and continue
   e. If stage passes or skipped, continue to next stage
4. Report summary (all results if all-errors mode)
5. Exit with appropriate code
```

**Exit codes**:
- 0: All stages passed
- 1-3: Contract violation (from stage 4)
- 11: No artifacts found (all stages)
- 15: Configuration error

**Gating**: Each stage gates the next. Type errors block contracts, contract violations block tests.

### ols-check
Detect validation artifacts and report coverage.

**Usage**: `ols-check [--stage STAGE] [--missing] [--summary]`

**Algorithm**:
```
1. For each stage (or specified stage):
   a. Run detection patterns (fd + rg)
   b. Count artifacts found
   c. Identify missing artifacts (if --missing)
2. Generate coverage report
3. Exit 0 if detection successful, 11 if no artifacts
```

**Exit codes**:
- 0: Detection complete
- 11: No artifacts found

### ols-override
Configure validation order and behavior.

**Usage**: `ols-override --order "type,contract,tests" [--continue-on-error]`

**Algorithm**:
```
1. Validate order string (comma-separated, valid stages)
2. Check for duplicates or unknown stages
3. Set VALIDATION_ORDER environment variable or write config file
4. Configure stop-on-fail behavior if specified
5. Exit 0 if valid, 15 if configuration error
```

**Exit codes**:
- 0: Configuration applied
- 15: Invalid configuration

## Stage Implementations

### Stage 1: Proof Validation
**Artifacts**: `*.proof`, `*.v`, `*.dfy`, `*.lean`, proof annotations

**Detection**:
```bash
fd -e proof -e v -e dfy -e lean --max-depth 3
rg 'theorem|lemma|proof|Qed' --type-add 'proof:*.{proof,v,dfy,lean}' -t proof
```

**Execution**:
```bash
# Coq proofs
find . -name "*.v" -exec coqc {} \;

# Dafny proofs
find . -name "*.dfy" -exec dafny verify {} \;

# Lean proofs
find . -name "*.lean" -exec lean --make {} \;
```

**Exit condition**: All proof obligations satisfied (exit 0) or no proofs found (skip)

### Stage 2: Specification Validation
**Artifacts**: `*.spec`, `*.tla`, `*.als`, `@spec` annotations

**Detection**:
```bash
fd -e spec -e tla -e als --max-depth 3
rg '@spec|specification:|SPECIFICATION' -i
```

**Execution**:
```bash
# TLA+ specs
find . -name "*.tla" -exec tlc {} \;

# Alloy specs
find . -name "*.als" -exec alloy {} \;
```

**Exit condition**: All specifications satisfied (exit 0) or no specs found (skip)

### Stage 3: Type Checking
**Artifacts**: Language-specific type systems

**Detection**:
```bash
# Detect primary language
LANG=$(fd -e ts -e tsx -e rs -e py -e java -e kt -e cs -e cpp -e c --max-depth 2 | \
       head -n1 | sed 's/.*\.\([^.]*\)$/\1/')
```

**Execution**:
```bash
# TypeScript
if [ -f tsconfig.json ]; then
    tsc --noEmit --pretty
fi

# Rust
if [ -f Cargo.toml ]; then
    cargo check --quiet 2>&1
fi

# Python
if fd -e py | head -n1; then
    pyright --warnings 2>&1 || mypy . 2>&1
fi

# Java
if fd -e java | head -n1; then
    javac -Xlint:all $(fd -e java) 2>&1
fi
```

**Exit condition**: No type errors (exit 0), type errors block all subsequent stages (exit 1)

**Gating**: This is a critical gate. Type failures stop the chain.

### Stage 4: Contract Validation
**Artifacts**: Contract library usage (delegates to design-by-contract skill)

**Detection**:
```bash
dbc-detect --lang auto
```

**Execution**:
```bash
dbc-verify --runtime-flags
```

**Exit condition**: All contracts satisfied (exit 0), violations exit with 1-3

**Gating**: Contract failures block tests

### Stage 5: Test Execution
**Artifacts**: Test files, test framework configs

**Detection**:
```bash
# Test files
fd 'test|spec' --extension ts --extension py --extension rs --extension java

# Test configs
fd --type f 'package.json|Cargo.toml|pytest.ini|pom.xml|build.gradle'
```

**Execution**:
```bash
# TypeScript/JavaScript
if [ -f package.json ] && jq -e '.scripts.test' package.json > /dev/null; then
    npm test
fi

# Rust
if [ -f Cargo.toml ]; then
    cargo test --quiet
fi

# Python
if fd -e py -g '*test*.py' | head -n1; then
    pytest -q
fi

# Java
if [ -f pom.xml ]; then
    mvn test -q
elif [ -f build.gradle ]; then
    gradle test -q
fi
```

**Exit condition**: All tests pass (exit 0), failures exit with 1

## Precedence Override

### Environment Variable
```bash
export VALIDATION_ORDER="type,contract,tests"
ols-validate  # Uses custom order
```

**Priority**: Highest (overrides all other sources)

### Command-Line Flag
```bash
ols-validate --order "spec,type,tests"
```

**Priority**: High (overrides config file)

### Configuration File
```toml
# .ols-config.toml
[validation]
order = ["type", "contract", "tests"]
stop_on_fail = true
```

**Priority**: Low (default if no env var or CLI flag)

### Validation Order Parsing
```bash
parse_order() {
    IFS=',' read -ra STAGES <<< "$1"
    VALID_STAGES="proof spec type contract tests"

    for stage in "${STAGES[@]}"; do
        if ! echo "$VALID_STAGES" | grep -qw "$stage"; then
            echo "Error: Invalid stage '$stage'" >&2
            exit 15
        fi
    done

    # Check duplicates
    if [ $(printf '%s\n' "${STAGES[@]}" | sort | uniq -d | wc -l) -gt 0 ]; then
        echo "Error: Duplicate stages" >&2
        exit 15
    fi

    echo "${STAGES[@]}"
}
```

## Stop-on-First-Fail Logic

### Default Mode (Stop on Fail)
```bash
for stage in $STAGES; do
    run_stage "$stage"
    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo "Stage $stage failed with exit code $EXIT_CODE"
        exit $EXIT_CODE
    fi
done
```

### All-Errors Mode
```bash
FIRST_FAILURE=0
FAILURES=()

for stage in $STAGES; do
    run_stage "$stage"
    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        if [ $FIRST_FAILURE -eq 0 ]; then
            FIRST_FAILURE=$EXIT_CODE
        fi
        FAILURES+=("$stage: exit $EXIT_CODE")
    fi
done

if [ $FIRST_FAILURE -ne 0 ]; then
    echo "Failures:"
    printf '%s\n' "${FAILURES[@]}"
    exit $FIRST_FAILURE
fi
```

## Execution Flow Diagram

```nomnoml
[<start>Start] -> [Load Config]
[Load Config] -> [Parse Order]
[Parse Order] default -> [proof,spec,type,contract,tests]
[Parse Order] override -> [Custom Order]
[proof,spec,type,contract,tests] -> [Stage Loop]
[Custom Order] -> [Stage Loop]
[Stage Loop] -> [Detect Artifacts]
[Detect Artifacts] found -> [Execute Stage]
[Detect Artifacts] not found -> [Skip Stage]
[Execute Stage] pass -> [Next Stage?]
[Execute Stage] fail, stop-on-fail -> [Report Failure]
[Execute Stage] fail, all-errors -> [Log & Continue]
[Log & Continue] -> [Next Stage?]
[Skip Stage] -> [Next Stage?]
[Next Stage?] yes -> [Stage Loop]
[Next Stage?] no -> [Report Summary]
[Report Failure] -> [<end>Exit Code]
[Report Summary] -> [<end>Exit Code]
```

## Gating Mechanism

**Type → Contract**: Type errors prevent contract checking
```bash
run_type_check || { echo "Type errors block contract validation"; exit 1; }
run_contract_check
```

**Contract → Tests**: Contract violations prevent test execution
```bash
run_contract_check || { echo "Contract violations block tests"; exit $?; }
run_tests
```

**Rationale**: Upstream failures indicate fundamental correctness issues that invalidate downstream validation.

## Exit Code Priority

**Stop-on-fail**: Return first failure
```
type fails (1) → immediate exit 1
```

**All-errors**: Return first failure, log all
```
type ok (0), contract fails (2), tests fail (1) → exit 2, report both
```

## Integration Patterns

### Pre-Commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit
ols-validate --order "type,contract" --stop-on-fail
```

### CI/CD Pipeline
```yaml
# .github/workflows/validate.yml
- name: Full Validation
  run: ols-validate --all-errors

- name: Fast Validation
  run: ols-validate --order "type,tests" --stop-on-fail
```

### Watch Mode
```bash
# watch-validate.sh
while inotifywait -r -e modify,create,delete .; do
    ols-validate --order "type,contract" --stop-on-fail
done
```

## Performance Optimization

**Stage caching** (future):
```bash
# Cache stage results based on file hashes
STAGE_HASH=$(fd -e ts -e rs | xargs sha256sum | sha256sum)
if [ -f ".cache/type-$STAGE_HASH" ]; then
    echo "Type check cached"
    exit 0
fi
```

**Parallel stages** (future):
```bash
# Run independent stages concurrently
run_stage "proof" &
run_stage "spec" &
wait
```

## Safety Guarantees

1. **Determinism**: Same inputs → same outputs
2. **Idempotency**: Multiple runs safe
3. **Isolation**: Stages don't interfere with each other
4. **Atomicity**: Each stage either passes or fails completely
5. **No side effects**: Validation doesn't modify code

## Best Practices

1. Start with `--order "type,tests"` (minimal validation)
2. Add contracts incrementally: `--order "type,contract,tests"`
3. Use stop-on-fail in development (fast feedback)
4. Use all-errors in CI (comprehensive reports)
5. Document order overrides in `.ols-config.toml`
6. Monitor execution time, optimize slow stages
7. Version validation order with code

## Error Handling

All stages must handle errors gracefully:
```bash
run_stage() {
    local stage=$1
    case $stage in
        type)
            run_type_check 2>&1 | tee type-errors.log
            return ${PIPESTATUS[0]}
            ;;
        contract)
            dbc-verify 2>&1 | tee contract-errors.log
            return ${PIPESTATUS[0]}
            ;;
        tests)
            run_tests 2>&1 | tee test-errors.log
            return ${PIPESTATUS[0]}
            ;;
    esac
}
```

## Configuration Schema

```toml
# .ols-config.toml
[validation]
# Validation stage order (default: proof,spec,type,contract,tests)
order = ["type", "contract", "tests"]

# Stop on first failure (default: true)
stop_on_fail = true

# Continue on error, collect all failures (default: false)
continue_on_error = false

# Log level (default: info)
log_level = "info"

# Stage-specific timeouts (seconds)
[validation.timeouts]
proof = 300
spec = 180
type = 60
contract = 120
tests = 300
```

## Monitoring and Observability

**Execution metrics**:
- Stage execution time
- Failure rates per stage
- Artifact counts per stage
- Exit code distribution

**Logging**:
```bash
[INFO] Starting validation chain: type,contract,tests
[INFO] Stage 1/3: type checking...
[PASS] Type check completed in 1.2s
[INFO] Stage 2/3: contract verification...
[FAIL] Contract check failed: 2 violations (exit 2)
[INFO] Skipping stage 3/3: tests (upstream failure)
[ERROR] Validation failed with exit code 2
```
