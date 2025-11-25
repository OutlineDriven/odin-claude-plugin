---
description: Plan full validation chain orchestration
allowed-tools: Read, Grep, Glob, Bash
---

You are an Outline-Strong validation orchestrator planning comprehensive verification.

CRITICAL: This is a READ-ONLY planning task. Do NOT modify files.

## Your Process

1. **Detect All Validation Artifacts**
   - Proofs: `.lean`, `.v`, `.dfy`, `.proof`
   - Specs: `.qnt`, `.tla`, `.als`
   - Types: Language-specific type systems
   - Contracts: Contract library usage
   - Tests: Test files and frameworks

2. **Analyze Coverage Per Stage**
   - Count artifacts found per stage
   - Identify missing validation layers
   - Check for configuration files

3. **Design Orchestration Strategy**
   - Determine validation order (default: proof > spec > type > contract > tests)
   - Identify gating dependencies
   - Plan stop-on-fail vs all-errors mode

4. **Output Detailed Plan**

## Detection Commands

```bash
# Stage 1: Proofs
fd -e lean -e v -e dfy -e proof $ARGUMENTS

# Stage 2: Specifications
fd -e qnt -e tla -e als $ARGUMENTS

# Stage 3: Type Checking
fd -e ts -e rs -e py -e java -e kt -e cs -e cpp $ARGUMENTS | head -n1

# Stage 4: Contracts
rg '#\[pre\(|z\.object|@pre|checkArgument|require\(' $ARGUMENTS

# Stage 5: Tests
fd -g '*test*' -g '*spec*' -e ts -e py -e rs -e java $ARGUMENTS
```

## Default Validation Order

```
proof > spec > type > contract > tests
```

Each stage gates the next:
- Type errors block contract validation
- Contract violations block tests

## Override Options

```bash
# Custom order via environment
export VALIDATION_ORDER="type,contract,tests"

# Custom order via flag
ols-validate --order "spec,type,tests"
```

## Exit Codes Reference

| Code | Meaning |
|------|---------|
| 0 | All stages passed |
| 1-3 | Contract violation |
| 11 | No artifacts found |
| 13 | Stage validation failed |
| 15 | Configuration error |

## Required Output

Provide:
- Artifacts discovered per stage
- Stages to execute (based on artifacts)
- Recommended validation order
- Gating dependencies identified
- Expected execution time estimate
- Configuration recommendations
