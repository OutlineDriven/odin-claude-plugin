---
description: Execute spec-first verification with Quint
allowed-tools: Read, Grep, Glob, Bash
---

You are executing specification-first verification using Quint.

## Execution Steps

1. **CHECK**: Verify Quint installation and .qnt files exist
2. **TYPECHECK**: Validate specification syntax
3. **VERIFY**: Run property verification
4. **TEST**: Execute specification tests
5. **GENERATE**: Create implementation stubs

## Commands (Tiered)

### Basic
```bash
# Check Quint
command -v quint >/dev/null || exit 11

# Find specs
fd -e qnt $ARGUMENTS >/dev/null || exit 12

# Typecheck
quint typecheck $ARGUMENTS/*.qnt || exit 12
```

### Intermediate
```bash
# Verify main module
quint verify --main=$MODULE $ARGUMENTS/*.qnt || exit 13

# Run tests
quint test $ARGUMENTS/*.qnt || exit 14
```

### Advanced
```bash
# Verify with coverage
quint verify --main=$MODULE --seed=$RANDOM --verbose \
  --max-steps=100 $ARGUMENTS/*.qnt || exit 13

# Comprehensive testing
quint test --verbose --seed=$RANDOM --coverage \
  --timeout=60 $ARGUMENTS/*.qnt || exit 14
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | Spec verified, ready for implementation |
| 11 | Quint missing | `npm install -g @informalsystems/quint` |
| 12 | Syntax error | Fix .qnt syntax errors |
| 13 | Spec violation | Fix state machine or invariants |
| 14 | Property failed | Strengthen properties or fix spec |
| 15 | Stub incomplete | Complete implementation mapping |

## Verification Commands

```bash
# Type check all specs
quint typecheck spec.qnt

# Verify specific invariant
quint verify --main=Module --invariant=my_invariant spec.qnt

# Multi-seed verification (recommended)
for seed in 12345 67890 11111; do
  quint verify --main=Module --seed=$seed spec.qnt
done

# Verbose verification
quint verify --main=Module --verbose --max-steps=200 spec.qnt
```

## Implementation Mapping

After verification, generate implementation stubs:

### Rust
```rust
// From Quint invariant: all_positive
fn assert_invariant(state: &State) {
    assert!(state.values.iter().all(|v| *v >= 0),
        "Invariant: all values must be positive");
}
```

### TypeScript
```typescript
// From Quint invariant: all_positive
function assertInvariant(state: State): void {
  invariant(state.values.every(v => v >= 0),
    "Invariant: all values must be positive");
}
```

### Python
```python
# From Quint invariant: all_positive
def assert_invariant(state: State) -> None:
    assert all(v >= 0 for v in state.values), \
        "Invariant: all values must be positive"
```

## Workflow

```
CHECK (quint installed, .qnt exists)
  |
  v
TYPECHECK (syntax valid)
  |
  v
VERIFY (invariants hold)
  |
  v
TEST (properties pass)
  |
  v
GENERATE (implementation stubs)
  |
  v
SUCCESS (exit 0)
```

Execute steps in order. Report verification results and property coverage.
