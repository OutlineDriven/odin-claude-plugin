---
description: Execute proof-driven validation with Lean 4
---
You are executing proof-driven validation using Lean 4 / Lake. This phase CREATES validation artifacts from the plan and VERIFIES them.

## Execution Steps

1. **CREATE**: Generate proof artifacts from plan design
2. **VERIFY**: Build and validate all proofs
3. **REMEDIATE**: Complete `sorry` placeholders with tactics

## Phase 1: Create Validation Artifacts

```bash
# Create .outline/proofs directory
mkdir -p .outline/proofs

# Initialize Lake project if needed
test -f .outline/proofs/lakefile.lean || {
  cd .outline/proofs
  lake init proofs
  cd ../..
}
```

### Generate Proof Files from Plan

Create theorem files with `sorry` placeholders from the plan design:

```lean
-- .outline/proofs/{Module}.lean
-- Generated from plan design

import Mathlib.Tactic

/-!
# {Module Name}

## Source Requirements
{traceability from plan}

## Properties Being Proved
{from plan design document}
-/

-- Theorem: {property from plan}
-- Traces to: {requirement reference}
theorem property_name : {statement from plan} := by
  sorry -- To be completed

-- Supporting lemma
lemma helper_lemma : {statement} := by
  sorry
```

## Phase 2: Execute Verification

### Basic (Precondition Check)
```bash
# Verify toolchain
(command -v lake || command -v lean) >/dev/null || exit 11

# Verify artifacts exist
fd -g 'lakefile.lean' -e lean .outline/proofs >/dev/null || exit 12
```

### Intermediate (Build Validation)
```bash
# Lake project build
cd .outline/proofs && lake build || exit 13

# Standalone files
fd -e lean .outline/proofs -x lean --make {} || exit 13
```

### Advanced (Full Verification)
```bash
# Lake project with tests
cd .outline/proofs && lake test || exit 13

# Check for incomplete proofs
rg -n '\bsorry\b' .outline/proofs/ && {
  echo "Incomplete proofs found - proceeding to remediation"
}
```

## Phase 3: Remediation

### Complete `sorry` Placeholders

For each `sorry` found, apply appropriate tactics:

| Goal Type | Recommended Tactics |
|-----------|---------------------|
| Equality | `rfl`, `simp`, `rw [h]` |
| Arithmetic | `linarith`, `omega`, `ring` |
| Inductive | `induction`, `cases`, `constructor` |
| Existential | `use x`, `exists x` |
| Universal | `intro h`, `intros` |
| Complex | `aesop`, `decide`, `native_decide` |

### Tactic Examples

```lean
-- For definitional equality
theorem ex1 : 1 + 1 = 2 := rfl

-- For rewriting
theorem ex2 (h : a = b) : a + c = b + c := by rw [h]

-- For arithmetic
theorem ex3 (h : x < 5) : x < 10 := by linarith

-- For induction
theorem ex4 : ∀ n, 0 + n = n := by
  intro n
  induction n with
  | zero => rfl
  | succ n ih => simp [ih]

-- For automated proving
theorem ex5 : P ∨ ¬P := by decide
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | All proofs verified, zero `sorry` |
| 11 | Tool missing | Install Lean 4 / Lake |
| 12 | No artifacts | Run plan phase first, create .lean files |
| 13 | Proof incomplete | Replace `sorry` with tactics |
| 14 | Coverage gap | Add missing lemmas from plan |

## Verification Commands

```bash
# Full verification sequence
cd .outline/proofs
lake build 2>&1 | tee build.log
SORRY_COUNT=$(rg -c '\bsorry\b' . || echo "0")
echo "Remaining sorry count: $SORRY_COUNT"
test "$SORRY_COUNT" = "0" || exit 13
```

## Workflow

```
CREATE (generate .lean files from plan)
  |
  v
VERIFY (lake build, check compilation)
  |
  v
REMEDIATE (replace sorry with tactics)
  |
  v
VERIFY AGAIN (zero sorry, builds clean)
  |
  v
SUCCESS (exit 0)
```

## Output Report

Provide:
- Files created in `.outline/proofs/`
- Build status (pass/fail)
- `sorry` count before/after remediation
- Theorem verification status
- Traceability update (requirement -> theorem -> proof status)

Execute with thoroughness. Report verification results clearly.
