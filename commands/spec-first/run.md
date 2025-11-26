---
description: Execute spec-first verification with Quint
---
You are executing specification-first verification using Quint. This phase CREATES validation artifacts from the plan and VERIFIES them.

## Execution Steps

1. **CREATE**: Generate specification artifacts from plan design
2. **VERIFY**: Typecheck and verify all specifications
3. **GENERATE**: Create implementation stubs from verified specs

## Phase 1: Create Validation Artifacts

```bash
# Create .outline/specs directory
mkdir -p .outline/specs
```

### Generate Specification Files from Plan

Create Quint modules from the plan design:

```quint
// .outline/specs/{Module}.qnt
// Generated from plan design

module {ModuleName} {
  //---------------------------------------------------------
  // Source Requirements: {traceability from plan}
  //---------------------------------------------------------
  // === State Variables ===
  // From plan: {state design}
  var state1: StateType1
  var state2: StateType2

  // === Initialization ===
  action init = {
    state1' = initialValue1,
    state2' = initialValue2
  }

  // === Invariants ===
  // Traces to: {requirement reference}
  val invariant_name: bool = {
    // Property from plan design
    state1.property && state2.property
  }

  // === Actions ===
  // Traces to: {requirement reference}
  action action_name = {
    // State transition from plan
    state1' = transform(state1)
  }

  // === Temporal Properties ===
  temporal always_invariant = always(invariant_name)
}
```

## Phase 2: Execute Verification

### Basic (Precondition Check)
```bash
# Check Quint availability
command -v quint >/dev/null || exit 11

# Verify artifacts exist
fd -e qnt .outline/specs >/dev/null || exit 12
```

### Intermediate (Typecheck and Verify)
```bash
# Typecheck all specs
quint typecheck .outline/specs/*.qnt || exit 12

# Verify main module
quint verify --main=$MODULE .outline/specs/*.qnt || exit 13

# Run specification tests
quint test .outline/specs/*.qnt || exit 14
```

### Advanced (Comprehensive Verification)
```bash
# Multi-seed verification for thoroughness
for seed in 12345 67890 11111 22222 33333; do
  echo "Verifying with seed $seed..."
  quint verify --main=$MODULE --seed=$seed --verbose \
    --max-steps=100 .outline/specs/*.qnt || exit 13
done

# Comprehensive testing with coverage
quint test --verbose --seed=$RANDOM --coverage \
  --timeout=60 .outline/specs/*.qnt || exit 14
```

## Phase 3: Generate Implementation Stubs

After verification, generate language-specific implementation stubs:

### Rust
```rust
// Generated from Quint invariant: {invariant_name}
fn assert_invariant(state: &State) {
    assert!(
        state.property1 && state.property2,
        "Invariant: {invariant_description}"
    );
}

// Generated from Quint action: {action_name}
fn action_name(state: &mut State) {
    // Pre: {precondition from spec}
    state.field = transform(state.field);
    // Post: {postcondition from spec}
}
```

### TypeScript
```typescript
// Generated from Quint invariant: {invariant_name}
function assertInvariant(state: State): void {
  invariant(
    state.property1 && state.property2,
    "Invariant: {invariant_description}"
  );
}

// Generated from Quint action: {action_name}
function actionName(state: State): State {
  // Pre: {precondition from spec}
  return { ...state, field: transform(state.field) };
  // Post: {postcondition from spec}
}
```

### Python
```python
# Generated from Quint invariant: {invariant_name}
def assert_invariant(state: State) -> None:
    assert state.property1 and state.property2, \
        "Invariant: {invariant_description}"

# Generated from Quint action: {action_name}
def action_name(state: State) -> State:
    # Pre: {precondition from spec}
    return state._replace(field=transform(state.field))
    # Post: {postcondition from spec}
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | Spec verified, stubs generated |
| 11 | Quint missing | `npm install -g @informalsystems/quint` |
| 12 | Syntax error | Fix .qnt syntax errors |
| 13 | Spec violation | Fix state machine or invariants |
| 14 | Property failed | Strengthen properties or fix spec |
| 15 | Stub generation failed | Check spec module exports |

## Verification Commands Summary

```bash
# Full verification sequence
quint typecheck .outline/specs/*.qnt
quint verify --main=Module --verbose .outline/specs/*.qnt
quint test .outline/specs/*.qnt
```

## Workflow

```
CREATE (generate .qnt files from plan)
  |
  v
TYPECHECK (syntax valid)
  |
  v
VERIFY (invariants hold, properties pass)
  |
  v
TEST (examples execute correctly)
  |
  v
GENERATE (implementation stubs)
  |
  v
SUCCESS (exit 0)
```

## Output Report

Provide:
- Files created in `.outline/specs/`
- Typecheck status
- Verification results per invariant
- Property test results
- Generated stub locations
- Traceability update (requirement -> spec -> verification status)

Execute with thoroughness. Report verification results clearly.
