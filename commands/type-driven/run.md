---
description: Execute type-driven validation with Idris 2
---
You are executing type-driven validation using Idris 2 dependent types. This phase CREATES type artifacts from the plan and VERIFIES them.

## Execution Steps

1. **CREATE**: Generate dependent type files from plan design
2. **VERIFY**: Type check and verify totality
3. **REMEDIATE**: Complete holes and fix partial functions

## Phase 1: Create Type Artifacts

```bash
# Create .outline/proofs directory for Idris files
mkdir -p .outline/proofs
```

### Generate Type Files from Plan

Create Idris 2 modules from the plan design:

```idris
-- .outline/proofs/{Module}.idr
-- Generated from plan design

module {Module}

%default total

{-
Source Requirements: {traceability from plan}

Properties Encoded in Types:
- Property 1: {how encoded from plan}
- Property 2: {how encoded from plan}
-}

-- === Dependent Types from Plan ===

-- Type encoding invariant: {from plan design}
public export
data ValidState : (n : Nat) -> Type where
  MkValid : (prf : n > 0 = True) -> ValidState n

-- Type encoding constraint: {from plan design}
public export
data Bounded : (lower : Nat) -> (upper : Nat) -> (n : Nat) -> Type where
  MkBounded : (prf : (lower <= n && n <= upper) = True) -> Bounded lower upper n

-- === Functions with Type-Level Proofs ===

-- From requirement: {requirement text}
-- Total function with type-level proof
public export
processValid : ValidState n -> ValidState (S n)
processValid (MkValid prf) = MkValid ?proof_valid_successor

-- Covering function ensuring all cases handled
public export covering
handleAll : Either a b -> (a -> c) -> (b -> c) -> c
handleAll (Left x) f g = f x
handleAll (Right y) f g = g y

-- === Type-Level Proofs ===

-- Lemma: {property from plan}
public export
lemma_property : (x : Nat) -> (y : Nat) -> x + y = y + x
lemma_property x y = ?commutativity_proof
```

### Generate Package File

```idris
-- .outline/proofs/{package}.ipkg
-- Generated from plan design

package {package_name}

sourcedir = "."

modules = {Module1}, {Module2}

depends = base, contrib
```

## Phase 2: Execute Verification

### Basic (Precondition Check)
```bash
# Verify Idris 2 availability
command -v idris2 >/dev/null || exit 11

# Verify artifacts exist
fd -e idr -e ipkg .outline/proofs >/dev/null || exit 12
```

### Intermediate (Type Checking)
```bash
# Package build
fd -e ipkg .outline/proofs -x idris2 --build {} || exit 13

# Direct file check
fd -e idr .outline/proofs -x idris2 --check {} || exit 13
```

### Advanced (Full Verification)
```bash
# Check totality (all functions terminate)
fd -e idr .outline/proofs -x idris2 --total {} || exit 14

# Find incomplete holes
HOLES=$(rg -c '\?\w+' .outline/proofs/ || echo "0")
echo "Holes remaining: $HOLES"

# Check for partial annotations
rg -n 'partial\s+\w+|covering\s+\w+' .outline/proofs/ && {
  echo "Warning: partial/covering functions found"
}
```

## Phase 3: Remediation

### Complete Holes (?todo markers)

For each hole, provide the proof term:

| Hole Pattern | Approach |
|--------------|----------|
| `?proof_eq` | `Refl` for definitional equality |
| `?proof_arithmetic` | Use `lte_trans`, `plus_comm`, etc. |
| `?case_left` | Pattern match and provide term |
| `?case_right` | Pattern match and provide term |
| `?induction_step` | Use recursion with smaller arg |

### Example Hole Completion

```idris
-- Before (with hole)
processValid : ValidState n -> ValidState (S n)
processValid (MkValid prf) = MkValid ?proof_valid_successor

-- After (hole filled)
processValid : ValidState n -> ValidState (S n)
processValid (MkValid prf) = MkValid Refl
```

### Fix Partial Functions

```idris
-- Before (partial)
partial
unsafeHead : List a -> a
unsafeHead (x :: _) = x

-- After (total with proof)
total
safeHead : (xs : List a) -> {auto prf : NonEmpty xs} -> a
safeHead (x :: _) = x
```

## Type Patterns Reference

| Pattern | Purpose | Example |
|---------|---------|---------|
| `Vect n a` | Length-indexed list | `Vect 3 Int` - exactly 3 elements |
| `Fin n` | Bounded natural | Safe array indexing |
| `Dec p` | Decidable proposition | Runtime proof check |
| `So p` | Boolean proof | Refinement from bool |
| `DPair` | Dependent pair | Existential types |
| `Elem x xs` | Membership proof | Prove element in list |

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | All types verified, zero holes |
| 11 | Idris 2 missing | Install Idris 2 |
| 12 | No artifacts | Run plan phase, create .idr files |
| 13 | Type error | Fix type mismatches |
| 14 | Totality/coverage | Complete holes, ensure totality |

## Verification Commands

```bash
# Full verification sequence
cd .outline/proofs
idris2 --check *.idr
idris2 --total *.idr

# Count remaining holes
HOLES=$(rg -c '\?\w+' . || echo "0")
echo "Remaining holes: $HOLES"
test "$HOLES" = "0" || exit 14
```

## Workflow

```
CREATE (generate .idr files from plan)
  |
  v
TYPECHECK (syntax and types valid)
  |
  v
VERIFY TOTALITY (all functions terminate)
  |
  v
COMPLETE HOLES (fill ?todo markers)
  |
  v
VERIFY AGAIN (zero holes, all total)
  |
  v
SUCCESS (exit 0)
```

## Output Report

Provide:
- Files created in `.outline/proofs/`
- Type check status
- Totality status per function
- Holes remaining (before/after remediation)
- Coverage status
- Traceability update (requirement -> type -> proof status)

Execute with thoroughness. Report verification results clearly.
