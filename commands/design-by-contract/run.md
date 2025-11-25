---
description: Execute design-by-contract validation across languages
---

You are executing design-by-contract validation across multiple languages.

## Execution Steps

1. **CHECK**: Verify contract libraries are available
2. **VALIDATE**: Run contract verification
3. **ANALYZE**: Check contract coverage
4. **REMEDIATE**: Fix contract violations

## Verification by Language

### Rust
```bash
# Ensure contracts are enabled
unset CONTRACTS_DISABLE
cargo test || exit 13

# Check for contract annotations
rg '#\[pre\(|#\[post\(' $ARGUMENTS || exit 12
```

### TypeScript
```bash
# Zod validation runs at runtime
npx vitest run || exit 13

# Check schema definitions
rg 'z\.object' $ARGUMENTS || exit 12
```

### Python
```bash
# Enable slow contracts for thorough checking
export ICONTRACT_SLOW=true
pytest $ARGUMENTS || exit 13

# Check decorators
rg '@pre\(|@post\(' $ARGUMENTS || exit 12
```

### Java
```bash
# Guava preconditions active by default
mvn test || exit 13

# Check Guava usage
rg 'checkArgument|checkState' $ARGUMENTS || exit 12
```

### Kotlin
```bash
# Native require/check always active
./gradlew test || exit 13

# Check contract usage
rg 'require\s*\{|check\s*\{' $ARGUMENTS || exit 12
```

### C++
```bash
# Ensure NDEBUG is NOT set for contract checking
unset NDEBUG
cmake --build build && ./build/tests || exit 13

# Check GSL/Boost contracts
rg 'Expects\(|Ensures\(' $ARGUMENTS || exit 12
```

### C
```bash
# Ensure NDEBUG is NOT set
unset NDEBUG
make test || exit 13

# Check assertions
rg 'assert\(' $ARGUMENTS || exit 12
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | All contracts pass |
| 1 | Precondition fail | Fix caller to meet requirements |
| 2 | Postcondition fail | Fix implementation to meet guarantee |
| 3 | Invariant fail | Fix state management |
| 11 | Library missing | Install contract library |
| 12 | No contracts | Add contract annotations |
| 13 | Verification failed | Fix contract violations |

## Contract Patterns

### Precondition (Caller's Duty)
```
INPUT --> VALIDATE --> PROCESS
            |
            v
         FAIL FAST if invalid
```

### Postcondition (Callee's Promise)
```
PROCESS --> OUTPUT --> VALIDATE
                          |
                          v
                       ASSERT guarantee met
```

### Invariant (Always True)
```
OPERATION --> STATE CHANGE --> CHECK INVARIANT
                                  |
                                  v
                               ASSERT still valid
```

## Workflow

```
CHECK (libraries installed)
  |
  v
DETECT (find contract annotations)
  |
  v
VALIDATE (run with contracts enabled)
  |
  v
ANALYZE (exit 1-3 on violations)
  |
  v
SUCCESS (exit 0)
```

Execute verification. Report violations with context and suggest fixes.
