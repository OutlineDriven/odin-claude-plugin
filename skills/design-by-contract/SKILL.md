---
name: design-by-contract
description: Automated contract verification, detection, and remediation across multiple languages using formal preconditions, postconditions, and invariants.
---

# Design-by-Contract Development Skill

## Commands

### dbc-verify
Verify all contracts satisfied in codebase.

**Usage**: `dbc-verify [--lang LANG] [--path PATH] [--runtime-flags]`

**Algorithm**:
```
1. Detect language(s) in scope (fd file extensions)
2. Check runtime flags enabled per language
3. Scan for contract library usage (rg patterns)
4. Execute language-specific verification
5. Report violations with exit codes
```

**Exit codes**:
- 0: All contracts satisfied
- 1: Precondition violation
- 2: Postcondition violation
- 3: Invariant violation
- 13: Runtime flags disabled

### dbc-detect
Detect contract usage and missing contracts.

**Usage**: `dbc-detect [--lang LANG] [--missing] [--violations]`

**Algorithm**:
```
1. Scan for contract library imports (rg)
2. Find functions without contracts (ast-grep negative match)
3. Identify contract violations (pattern analysis)
4. Generate coverage report
```

**Exit codes**:
- 0: Detection complete
- 11: No contracts found

### dbc-remediate
Auto-fix violations or add missing contracts.

**Usage**: `dbc-remediate [--add-missing] [--fix-violations] [--dry-run]`

**Algorithm**:
```
1. Identify remediation targets (missing/violated contracts)
2. Generate contract code per language
3. Apply fixes via ast-grep or native-patch
4. Verify fixes with dbc-verify
```

**Exit codes**:
- 0: Remediation applied
- 12: Fix not applicable
- 14: Unsupported language

## Language-Specific Implementations

### Rust Detection
```bash
# Find contracts
rg '#\[pre\(|#\[post\(|#\[invariant\(|debug_assert!' --type rust

# Find functions without contracts
ast-grep -p 'fn $NAME($$$) { $$$ }' -l rust | \
  rg -v '#\[pre\(|debug_assert!' --files-without-match
```

**Remediation template**:
```rust
#[pre($CONDITION)]
#[post(ret $POSTCONDITION)]
fn $NAME($PARAMS) -> $RET {
    debug_assert!($CONDITION, "$ERROR_MSG");
    $BODY
}
```

**Runtime flags**: Check `CARGO_BUILD_TYPE != release` or `cfg(debug_assertions)`

### TypeScript Detection
```bash
# Find contracts
rg 'z\.object|invariant\(|\.parse\(|\.safeParse\(' --type ts

# Find functions without validation
ast-grep -p 'function $NAME($$$): $$$ { $$$ }' -l typescript | \
  rg -v 'z\.|invariant' --files-without-match
```

**Remediation template**:
```typescript
const ${NAME}Schema = z.object({
  $FIELDS
});

function $NAME(params: unknown): $RET {
  const validated = ${NAME}Schema.parse(params);
  invariant($CONDITION, "$ERROR_MSG");
  $BODY
}
```

**Runtime flags**: Check `process.env.NODE_ENV === 'development'`

### Python Detection
```bash
# Find contracts
rg '@pre\(|@post\(|@invariant|@require|@ensure' --type python

# Find functions without contracts
ast-grep -p 'def $NAME($$$): $$$' -l python | \
  rg -v '@pre|@post|@invariant' --files-without-match
```

**Remediation template**:
```python
@pre(lambda $PARAMS: $CONDITION)
@post(lambda result: $POSTCONDITION)
def $NAME($PARAMS) -> $RET:
    """$DOCSTRING"""
    $BODY
```

**Runtime flags**: Check `__debug__` is True (not `python -O`)

### Java Detection
```bash
# Find contracts
rg 'checkArgument|checkState|validate\(|Preconditions\.' --type java

# Find methods without contracts
ast-grep -p 'public $RET $NAME($$$) { $$$ }' -l java | \
  rg -v 'checkArgument|validate' --files-without-match
```

**Remediation template**:
```java
public $RET $NAME($PARAMS) {
    checkArgument($CONDITION, "$ERROR_MSG");
    $BODY
    validate($POSTCONDITION, "$POST_ERROR");
    return $RESULT;
}
```

**Runtime flags**: Check assertions enabled with `-ea` flag

### Kotlin Detection
```bash
# Find contracts
rg 'contract \{|Either<|Validated|require\(|check\(' --type kotlin

# Find functions without contracts
ast-grep -p 'fun $NAME($$$): $$$ { $$$ }' -l kotlin | \
  rg -v 'contract|require|check' --files-without-match
```

**Remediation template**:
```kotlin
fun $NAME($PARAMS): Either<$ERR, $RET> {
    contract {
        returns() implies ($CONDITION)
    }
    return if (!$CONDITION) "$ERROR".left()
           else { $BODY }.right()
}
```

**Runtime flags**: Check `-ea` for JVM assertions

### C# Detection
```bash
# Find contracts
rg 'Guard\.Against|Contract\.Requires|Contract\.Ensures|Debug\.Assert' --type cs

# Find methods without contracts
ast-grep -p 'public $RET $NAME($$$) { $$$ }' -l csharp | \
  rg -v 'Guard\.|Contract\.' --files-without-match
```

**Remediation template**:
```csharp
public $RET $NAME($PARAMS) {
    Guard.Against.Null($PARAM, nameof($PARAM));
    Contract.Ensures(Contract.Result<$RET>() $POSTCONDITION);
    $BODY
}
```

**Runtime flags**: Check Debug configuration

### C++ Detection
```bash
# Find contracts
rg 'Expects\(|Ensures\(|boost::contract|gsl::' --type cpp

# Find functions without contracts
ast-grep -p '$RET $NAME($$$) { $$$ }' -l cpp | \
  rg -v 'Expects|Ensures' --files-without-match
```

**Remediation template**:
```cpp
$RET $NAME($PARAMS) {
    Expects($PRECONDITION);
    $BODY
    Ensures($POSTCONDITION);
    return $RESULT;
}
```

**Runtime flags**: Check `NDEBUG` not defined

### C Detection
```bash
# Find contracts
rg 'assert\(|static_assert' --type c

# Find functions without asserts
ast-grep -p '$RET $NAME($$$) { $$$ }' -l c | \
  rg -v 'assert\(' --files-without-match
```

**Remediation template**:
```c
$RET $NAME($PARAMS) {
    assert($PRECONDITION && "$ERROR_MSG");
    $BODY
    assert($POSTCONDITION && "$POST_ERROR");
    return $RESULT;
}
```

**Runtime flags**: Check `NDEBUG` not defined

## Violation Detection Patterns

### Precondition Violations
**Pattern**: Function called with invalid inputs
**Detection**: Runtime assertion failures at function entry
**Exit code**: 1

### Postcondition Violations
**Pattern**: Function returns invalid results
**Detection**: Runtime assertion failures before return
**Exit code**: 2

### Invariant Violations
**Pattern**: Object state becomes invalid
**Detection**: Runtime assertion failures in state mutations
**Exit code**: 3

## Integration Workflow

```nomnoml
[<start>Start] -> [dbc-detect]
[dbc-detect] found contracts -> [dbc-verify]
[dbc-detect] no contracts -> [dbc-remediate --add-missing]
[dbc-verify] pass -> [<end>Success]
[dbc-verify] fail -> [dbc-remediate --fix-violations]
[dbc-remediate --add-missing] -> [dbc-verify]
[dbc-remediate --fix-violations] -> [dbc-verify]
```

## Safety Requirements

1. **No side effects**: Contract checks must not modify state
2. **Performance**: Disable expensive checks in release builds
3. **Thread safety**: Contracts must be thread-safe
4. **Memory safety**: No allocations in hot paths
5. **Determinism**: Same inputs produce same contract evaluation

## Best Practices

- Add preconditions for all public APIs
- Use postconditions for critical guarantees
- Add invariants at object construction and state mutations
- Fail fast with clear error messages
- Disable expensive contracts in production (when safe)
- Compose contracts with type systems
- Document contract rationale in comments

## Error Messages

Contracts should include context:
```
Precondition violation: x must be positive (got -5)
Postcondition violation: result must exceed input (result=3, input=5)
Invariant violation: balance must be non-negative (balance=-100)
```

## Performance Considerations

- Runtime cost: O(1) per contract check (constant time assertions)
- Build time: Negligible (contracts are code annotations)
- Hot path optimization: Use `cfg(debug_assertions)` gating in Rust, `NDEBUG` in C/C++
- Production: Enable only critical contracts, disable debug-only checks
