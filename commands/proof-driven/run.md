---
description: Execute proof-driven validation with Lean 4
allowed-tools: Read, Grep, Glob, Bash
---

You are executing proof-driven validation using Lean 4 / Lake.

## Execution Steps

1. **CHECK**: Verify preconditions (lean/lake available)
2. **VALIDATE**: Build and verify all proofs
3. **GENERATE**: Run full build with diagnostics
4. **REMEDIATE**: Find and fix `sorry` placeholders

## Commands (Tiered)

### Basic (Precondition Check)
```bash
(command -v lake || command -v lean) >/dev/null || exit 11
fd -g 'lakefile.lean' -e lean $ARGUMENTS >/dev/null || exit 12
```

### Intermediate (Validation)
```bash
# Lake project
test -f lakefile.lean && lake build || exit 13

# Standalone files
fd -e lean $ARGUMENTS -x lean --make {} || exit 13
```

### Advanced (Full Verification)
```bash
# Lake project with tests
test -f lakefile.lean && lake test || exit 13

# Check for sorry (incomplete proofs)
rg -n '\bsorry\b' $ARGUMENTS && exit 13 || exit 0
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | All proofs verified |
| 11 | Tool missing | Install Lean 4 / Lake |
| 12 | No artifacts | Check path or create .lean files |
| 13 | Proof incomplete | Replace `sorry` with explicit proofs |
| 14 | Coverage gap | Add missing lemmas |

## Remediation Tips

- Replace each `sorry` with explicit tactic or term proof
- Use `set_option trace.tactic true` for debugging stuck proofs
- Break complex goals into smaller lemmas
- Leverage tactics: `simp`, `aesop`, `linarith`, `rw`, `exact`
- Use `have` and `let` to introduce intermediate steps
- Apply `rfl` for definitional equality
- Use `constructor` for inductive proofs

## Common Tactics

| Tactic | Use Case |
|--------|----------|
| `simp` | Simplify with known lemmas |
| `aesop` | Automated proof search |
| `linarith` | Linear arithmetic |
| `rw [h]` | Rewrite using hypothesis |
| `exact h` | Provide exact term |
| `intro h` | Introduce hypothesis |
| `cases h` | Case split |
| `induction n` | Inductive proof |

## Workflow

```
CHECK (exit 11/12 on fail)
  |
  v
VALIDATE (exit 13 on proof errors)
  |
  v
GENERATE (full build)
  |
  v
REMEDIATE (exit 13 if sorry found)
  |
  v
SUCCESS (exit 0)
```

Execute commands in order. Stop on first non-zero exit code and report.
