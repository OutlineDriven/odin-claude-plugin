---
description: Execute type-driven validation with Idris 2
---

You are executing type-driven validation using Idris 2 dependent types.

## Execution Steps

1. **CHECK**: Verify preconditions (idris2 available)
2. **VALIDATE**: Run type checking on all sources
3. **GENERATE**: Build packages with full verification
4. **REMEDIATE**: Find and fix partial functions and holes

## Commands (Tiered)

### Basic (Precondition Check)
```bash
command -v idris2 >/dev/null || exit 11
fd -e idr -e ipkg $ARGUMENTS >/dev/null || exit 12
```

### Intermediate (Validation)
```bash
# Package build
fd -e ipkg $ARGUMENTS -x idris2 --build {} || exit 13

# Direct file check
fd -e idr $ARGUMENTS -x idris2 --check {} || exit 13
```

### Advanced (Full Verification)
```bash
# Check totality
fd -e idr $ARGUMENTS -x idris2 --total {} || exit 14

# Find holes
rg -n '\?\w+' $ARGUMENTS && exit 14 || exit 0

# Check coverage
rg -n 'maybe not total|covering' $ARGUMENTS && exit 14 || exit 0
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | All types verified |
| 11 | Tool missing | Install Idris 2 |
| 12 | No artifacts | Check path or create .idr files |
| 13 | Type error | Fix type mismatches |
| 14 | Coverage gap | Complete holes, ensure totality |

## Remediation Tips

- Replace `?hole` with explicit implementations
- Add `total` annotations to ensure termination
- Use `covering` for functions that don't need totality proof
- Convert `partial` functions to total where possible
- Use `assert_total` only when termination is externally proven

## Common Patterns

| Pattern | Use Case |
|---------|----------|
| `Vect n a` | Length-indexed vectors |
| `Fin n` | Bounded natural numbers |
| `Dec p` | Decidable propositions |
| `So b` | Boolean proofs |
| `Elem x xs` | Membership proofs |

## Workflow

```
CHECK (exit 11/12 on fail)
  |
  v
VALIDATE (exit 13 on type errors)
  |
  v
GENERATE (full build)
  |
  v
REMEDIATE (exit 14 if holes/partial found)
  |
  v
SUCCESS (exit 0)
```

Execute commands in order. Stop on first non-zero exit code and report.
