---
description: Execute full validation chain orchestration
---
You are executing Outline-Strong validation orchestration. This phase CREATES validation artifacts across all layers and VERIFIES them in sequence.

## Execution Steps

1. **CREATE**: Generate artifacts for each validation layer from plan
2. **EXECUTE**: Run validation chain in configured order
3. **REPORT**: Comprehensive results across all layers

## Phase 1: Create Validation Artifacts

```bash
# Create .outline directory structure for all layers
mkdir -p .outline/{proofs,specs,contracts,tests}
```

### Generate Artifacts Per Layer

Based on the plan design, create artifacts for applicable layers:

**Layer 1: Proofs** (`.outline/proofs/`)
```bash
# If proof layer in plan, create Lean/Idris files
# See proof-driven/run.md for templates
```

**Layer 2: Specifications** (`.outline/specs/`)
```bash
# If spec layer in plan, create Quint files
# See spec-first/run.md for templates
```

**Layer 3: Types** (source code)
```bash
# Type annotations in source files
# Language-specific type system
```

**Layer 4: Contracts** (`.outline/contracts/`)
```bash
# If contract layer in plan, create contract files
# See design-by-contract/run.md for templates
```

**Layer 5: Tests** (`.outline/tests/`)
```bash
# Create test files
# See test-driven/run.md for templates
```

## Phase 2: Execute Validation Chain

### Configuration
```bash
# Default order
ORDER="proof,spec,type,contract,tests"

# Custom order (from plan or environment)
ORDER="${VALIDATION_ORDER:-$ORDER}"

# Execution mode
STOP_ON_FAIL=${STOP_ON_FAIL:-true}
```

### Stage Execution

#### Stage 1: Proof Validation
```bash
run_proof_stage() {
  echo "=== Stage 1: PROOF ==="

  # Lean proofs
  if fd -e lean .outline/proofs 2>/dev/null | grep -q .; then
    echo "Verifying Lean proofs..."
    cd .outline/proofs && lake build || return 13
    rg '\bsorry\b' . && return 13
  fi

  # Idris proofs
  if fd -e idr .outline/proofs 2>/dev/null | grep -q .; then
    echo "Verifying Idris proofs..."
    fd -e idr .outline/proofs -x idris2 --check {} || return 13
  fi

  echo "Proof stage: PASS"
  return 0
}
```

#### Stage 2: Specification Verification
```bash
run_spec_stage() {
  echo "=== Stage 2: SPECIFICATION ==="

  if fd -e qnt .outline/specs 2>/dev/null | grep -q .; then
    echo "Verifying Quint specs..."
    quint typecheck .outline/specs/*.qnt || return 13
    quint verify .outline/specs/*.qnt || return 13
  fi

  echo "Spec stage: PASS"
  return 0
}
```

#### Stage 3: Type Checking
```bash
run_type_stage() {
  echo "=== Stage 3: TYPE CHECKING ==="

  # TypeScript
  if test -f tsconfig.json; then
    tsc --noEmit || return 13
  fi

  # Rust
  if test -f Cargo.toml; then
    cargo check || return 13
  fi

  # Python
  if fd -e py . | grep -q .; then
    pyright . || return 13
  fi

  echo "Type stage: PASS"
  return 0
}
```

#### Stage 4: Contract Verification
```bash
run_contract_stage() {
  echo "=== Stage 4: CONTRACTS ==="

  if fd . .outline/contracts 2>/dev/null | grep -q .; then
    # Run tests with contracts enabled
    unset CONTRACTS_DISABLE
    unset NDEBUG

    # Language-specific contract verification
    test -f Cargo.toml && cargo test
    test -f package.json && npm test
    test -f pyproject.toml && pytest

    return $?
  fi

  echo "Contract stage: PASS"
  return 0
}
```

#### Stage 5: Test Execution
```bash
run_test_stage() {
  echo "=== Stage 5: TESTS ==="

  # TypeScript
  test -f package.json && npm test || return 13

  # Rust
  test -f Cargo.toml && cargo test || return 13

  # Python
  test -f pyproject.toml && pytest || return 13

  # Go
  test -f go.mod && go test ./... || return 13

  echo "Test stage: PASS"
  return 0
}
```

### Orchestration Loop
```bash
execute_chain() {
  local results=""
  local first_failure=0

  for stage in ${ORDER//,/ }; do
    echo ""
    echo "=========================================="
    echo "Executing: $stage"
    echo "=========================================="

    case $stage in
      proof)    run_proof_stage ;;
      spec)     run_spec_stage ;;
      type)     run_type_stage ;;
      contract) run_contract_stage ;;
      tests)    run_test_stage ;;
      *)        echo "Unknown stage: $stage"; return 15 ;;
    esac

    local exit_code=$?
    results="$results\n$stage: $([ $exit_code -eq 0 ] && echo 'PASS' || echo 'FAIL')"

    if [ $exit_code -ne 0 ]; then
      [ $first_failure -eq 0 ] && first_failure=$exit_code

      if [ "$STOP_ON_FAIL" = "true" ]; then
        echo "Stage $stage FAILED - stopping chain"
        break
      fi
    fi
  done

  echo ""
  echo "=========================================="
  echo "VALIDATION SUMMARY"
  echo "=========================================="
  echo -e "$results"

  return $first_failure
}
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | All stages pass | Validation complete |
| 1 | Precondition violation | Fix contract preconditions |
| 2 | Postcondition violation | Fix contract postconditions |
| 3 | Invariant violation | Fix contract invariants |
| 11 | No artifacts | Run plan phase first |
| 13 | Stage failed | Fix issues in failed stage |
| 15 | Config error | Check ORDER, valid stages |

## Gating Rules

| Upstream | Gates | Rationale |
|----------|-------|-----------|
| proof | spec | Proofs validate core properties |
| spec | type | Specs define valid behaviors |
| type | contract | Types catch basic errors |
| contract | tests | Contracts validate interfaces |

## Workflow

```
CREATE (artifacts for all applicable layers)
  |
  v
LOAD CONFIG (order, stop-on-fail mode)
  |
  v
EXECUTE CHAIN:
  proof -> spec -> type -> contract -> tests
  (skip if no artifacts, gate on failure)
  |
  v
REPORT SUMMARY (per-stage results)
  |
  v
EXIT (first failure code or 0)
```

## Output Report

Provide:
- Artifacts created per layer
- Stage execution results (PASS/FAIL/SKIP)
- First failure details (if any)
- Coverage summary per layer
- Cross-layer traceability matrix
- Recommendations for missing coverage

Execute with thoroughness. Report comprehensive results.
