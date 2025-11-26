---
description: Execute design-by-contract validation across languages
---
You are executing design-by-contract validation. This phase CREATES contract artifacts from the plan and VERIFIES them.

## Execution Steps

1. **CREATE**: Generate contract annotations from plan design
2. **VERIFY**: Run contract verification with checks enabled
3. **REMEDIATE**: Fix contract violations

## Phase 1: Create Contract Artifacts

```bash
# Create .outline/contracts directory
mkdir -p .outline/contracts
```

### Generate Contract Files by Language

#### Rust (contracts crate)
```rust
// .outline/contracts/{module}_contracts.rs
// Generated from plan design

use contracts::*;

// Source Requirement: {traceability from plan}

// Precondition: {from plan design}
// Postcondition: {from plan design}
#[pre(input > 0, "Input must be positive")]
#[post(ret.is_some() => ret.unwrap() > input, "Output must exceed input")]
pub fn process(input: i32) -> Option<i32> {
    // Implementation
    Some(input + 1)
}

// Class invariant: {from plan design}
#[invariant(self.balance >= 0, "Balance must be non-negative")]
impl Account {
    #[post(self.balance == old(self.balance) + amount)]
    pub fn deposit(&mut self, amount: u64) {
        self.balance += amount;
    }
}
```

#### TypeScript (Zod)
```typescript
// .outline/contracts/{module}.contracts.ts
// Generated from plan design

import { z } from 'zod';

// Source Requirement: {traceability from plan}

// Precondition schema: {from plan design}
export const InputSchema = z.object({
  value: z.number().positive("Value must be positive"),
  name: z.string().min(1, "Name required"),
}).refine(
  (data) => data.value < 1000,
  { message: "Precondition: value must be under 1000" }
);

// Postcondition schema: {from plan design}
export const OutputSchema = z.object({
  result: z.number(),
  success: z.boolean(),
}).refine(
  (data) => data.success || data.result === 0,
  { message: "Postcondition: failed operations must return 0" }
);

// Validation wrapper
export function withContracts<I, O>(
  inputSchema: z.ZodType<I>,
  outputSchema: z.ZodType<O>,
  fn: (input: I) => O
): (input: I) => O {
  return (input: I) => {
    const validInput = inputSchema.parse(input);
    const output = fn(validInput);
    return outputSchema.parse(output);
  };
}
```

#### Python (icontract)
```python
# .outline/contracts/{module}_contracts.py
# Generated from plan design

import icontract

# Source Requirement: {traceability from plan}

# Precondition: {from plan design}
# Postcondition: {from plan design}
@icontract.require(lambda x: x > 0, "Input must be positive")
@icontract.ensure(lambda result: result is not None, "Must return value")
@icontract.ensure(lambda x, result: result > x, "Output must exceed input")
def process(x: int) -> int:
    return x + 1


# Class invariant: {from plan design}
@icontract.invariant(lambda self: self.balance >= 0)
class Account:
    def __init__(self):
        self.balance = 0

    @icontract.require(lambda amount: amount > 0)
    @icontract.ensure(lambda self, amount, OLD: self.balance == OLD.balance + amount)
    def deposit(self, amount: int) -> None:
        self.balance += amount
```

## Phase 2: Execute Verification

### Rust
```bash
# Ensure contracts are enabled (not disabled)
unset CONTRACTS_DISABLE

# Verify contracts exist
rg '#\[pre\(|#\[post\(|#\[invariant\(' .outline/contracts/ || exit 12

# Run tests with contracts
cargo test || exit 13
```

### TypeScript
```bash
# Verify Zod schemas exist
rg 'z\.object|\.refine\(' .outline/contracts/ || exit 12

# Run tests (Zod validates at runtime)
npx vitest run || exit 13
```

### Python
```bash
# Enable thorough contract checking
export ICONTRACT_SLOW=true

# Verify decorators exist
rg '@icontract\.(require|ensure|invariant)' .outline/contracts/ || exit 12

# Run tests
pytest || exit 13
```

### Java (Guava)
```bash
# Verify Guava preconditions exist
rg 'checkArgument|checkState|checkNotNull' .outline/contracts/ || exit 12

# Run tests
mvn test || exit 13
```

### C++ (GSL/Boost)
```bash
# Ensure NDEBUG is NOT set for contract checking
unset NDEBUG

# Verify contracts exist
rg 'Expects\(|Ensures\(' .outline/contracts/ || exit 12

# Build and test
cmake --build build && ./build/tests || exit 13
```

## Phase 3: Remediation

### Contract Violation Types

| Violation | Exit Code | Fix Strategy |
|-----------|-----------|--------------|
| Precondition | Fix caller to meet requirements |
| Postcondition | Fix implementation to meet guarantee |
| Invariant | Fix state management logic |

### Debugging Contract Failures

```bash
# Find specific violation in output
# Precondition violations show input that failed
# Postcondition violations show output that failed

# Add verbose logging for debugging
# Rust: RUST_BACKTRACE=1 cargo test
# Python: pytest -v --tb=long
# TypeScript: DEBUG=* npx vitest run
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | All contracts pass |
| 1 | Precondition fail | Fix caller to meet requirements |
| 2 | Postcondition fail | Fix implementation |
| 3 | Invariant fail | Fix state management |
| 11 | Library missing | Install contract library |
| 12 | No contracts | Run plan phase, create contracts |
| 13 | Verification failed | Debug and fix violations |

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
CREATE (generate contract annotations from plan)
  |
  v
VERIFY (run with contracts enabled)
  |
  v
ANALYZE (identify violations by type)
  |
  v
REMEDIATE (fix violations)
  |
  v
SUCCESS (exit 0)
```

## Output Report

Provide:
- Contract files created in `.outline/contracts/`
- Contracts verified per type (pre/post/invariant)
- Violations found and fixed
- Coverage of public APIs
- Traceability update (requirement -> contract -> status)

Execute with thoroughness. Report verification results clearly.
