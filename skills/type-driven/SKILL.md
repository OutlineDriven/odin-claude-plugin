---
name: type-driven-development
description: Run validation-first Idris 2 workflows with tiered commands (CHECK/VALIDATE/GENERATE/REMEDIATE) and strict exit codes. Comprehensive skill handling both design (planning) and execution (verification) through dependent types.
---

# SKILL: Type-Driven Validation (Idris 2)

## Capability

Run validation-first Idris 2 workflows with tiered commands (CHECK/VALIDATE/GENERATE/REMEDIATE) and explicit exit codes. Leverages dependent types to encode invariants directly in the type system, enabling compile-time verification of properties that would otherwise require runtime checks or formal proofs.

This skill handles both the DESIGN phase (planning type-level proofs) and the EXECUTION phase (creating and verifying artifacts).

## When to Use

- Encoding domain constraints in types (length-indexed vectors, bounded integers)
- Eliminating runtime errors through type-level guarantees
- Building verified data structures with proven invariants
- Protocol state machines with type-safe transitions
- Parser/serializer correctness through type-driven design
- API contracts enforced at compile time

## Inputs

- Working directory with `.ipkg` or `.idr` sources
- Idris 2 installed and on PATH (via pack or direct install)

## Preconditions

```bash
# Verify Idris 2 toolchain
command -v idris2 >/dev/null || exit 11

# Verify Idris artifacts exist
fd -e ipkg -e idr . >/dev/null || exit 12
```

---

## Workflow Overview

```
PLAN -> CREATE -> VERIFY -> REMEDIATE
  |        |         |          |
  v        v         v          v
Design  Generate   Check     Complete
Types   .idr      Totality   Holes
```

```
DEFINE -> REFINE -> PROVE -> CHECK -> IMPLEMENT
    ^                                      |
    +--------------------------------------+

1. DEFINE: Write type signatures with holes
2. REFINE: Use hole-driven development to explore types
3. PROVE: Fill holes with total implementations
4. CHECK: `idris2 --check` to verify totality
5. IMPLEMENT: Extract verified components
```

---

## Phase 1: PLAN (Design Types from Requirements)

You are a type-driven development specialist designing dependent types with Idris 2 BEFORE code changes.

CRITICAL: This is a DESIGN planning task. You design type artifacts that will be created during the run phase.

### Planning Process

1. **Understand Requirements**
   - Parse user's task/requirement
   - Identify properties encodable in types
   - Use sequential-thinking to design type-level proofs
   - Map requirements to dependent type signatures

2. **Artifact Detection (Conditional)**
   - Check for existing Idris 2 artifacts:
     ```bash
     fd -e idr -e ipkg $ARGUMENTS
     command -v idris2
     ```
   - If artifacts exist: analyze coverage gaps, plan extensions
   - If no artifacts: proceed to design type architecture

3. **Design Type Architecture**
   - Design dependent types encoding invariants
   - Plan covering functions (totality)
   - Define type-level proofs
   - Output: Idris 2 artifact design with type signatures

4. **Prepare Run Phase**
   - Define target: `.outline/proofs/*.idr`
   - Specify verification: `idris2 --check`, totality
   - Create traceability: requirement -> type -> proof

### Thinking Tool Integration

```
Use sequential-thinking for:
- Type-level encoding strategy
- Totality proof planning
- Function coverage analysis

Use actor-critic-thinking for:
- Type design alternatives
- Dependent type trade-offs
- Proof complexity evaluation

Use shannon-thinking for:
- Type-level property coverage
- Holes requiring completion
- Totality risk assessment
```

### Type Design Template

```idris
-- Target: .outline/proofs/{Module}.idr
module {Module}

%default total

{-
From requirement: {requirement text}

Properties encoded in types:
- Property 1: {how encoded}
- Property 2: {how encoded}
-}

-- Dependent type encoding invariant
data ValidState : (n : Nat) -> Type where
  MkValid : (prf : n > 0) -> ValidState n

-- From requirement: {requirement text}
-- Total function with type-level proof
processValid : ValidState n -> ValidState (n + 1)
processValid (MkValid prf) = MkValid ?proof_todo

-- Covering function ensuring all cases handled
covering
handleAll : Either a b -> Result
handleAll (Left x) = ?left_case
handleAll (Right y) = ?right_case

-- Type-level proof
lemma_property : (x : Nat) -> (y : Nat) -> x + y = y + x
lemma_property x y = ?commutativity_proof
```

### Type Design Output Requirements

1. **Requirements Analysis**
   - Properties encodable in types
   - Totality requirements
   - Coverage obligations

2. **Type Architecture**
   - Dependent type definitions
   - Function signatures with proofs
   - Type-level lemmas

3. **Target Artifacts**
   - `.outline/proofs/*.idr` file list
   - `.ipkg` package configuration
   - Holes (`?todo`) to complete

4. **Verification Commands**
   - `idris2 --check` for type checking
   - `idris2 --total` for totality
   - Success criteria: zero holes, all total

---

## Phase 2: CREATE (Generate Validation Artifacts)

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

---

## Phase 3: VERIFY (Validation)

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

---

## Phase 4: REMEDIATE (Fix Issues)

### Complete Holes (?todo markers)

For each hole, provide the proof term:

| Hole Pattern        | Approach                           |
| ------------------- | ---------------------------------- |
| `?proof_eq`         | `Refl` for definitional equality   |
| `?proof_arithmetic` | Use `lte_trans`, `plus_comm`, etc. |
| `?case_left`        | Pattern match and provide term     |
| `?case_right`       | Pattern match and provide term     |
| `?induction_step`   | Use recursion with smaller arg     |

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

---

## Commands Reference

### Basic Commands

| Command   | Purpose                        | Usage                                                                          |
| --------- | ------------------------------ | ------------------------------------------------------------------------------ |
| CHECK     | Verify toolchain and artifacts | `command -v idris2 >/dev/null \|\| exit 11`                                    |
| VALIDATE  | Type-check all packages/files  | `fd -e ipkg -x idris2 --build {} \|\| fd -e idr -x idris2 --check {}`          |
| GENERATE  | Build with timing diagnostics  | `fd -e ipkg -x idris2 --build {} --timing \|\| fd -e idr -x idris2 --check {}` |
| REMEDIATE | Find totality/coverage gaps    | `rg -n 'maybe not total\|covering' . && exit 14 \|\| exit 0`                   |

### Idris 2 Commands Reference

```bash
# Check single file
idris2 --check src/Main.idr

# Build package
idris2 --build project.ipkg

# Build with timing info
idris2 --build project.ipkg --timing

# Interactive REPL
idris2 src/Main.idr

# Generate documentation
idris2 --mkdoc project.ipkg

# Install package
idris2 --install project.ipkg

# Clean build artifacts
idris2 --clean project.ipkg

# Check totality explicitly
idris2 --total --check src/Main.idr

# List installed packages
idris2 --list-packages
```

### Quick Validation Pipeline

```bash
# Full verification
idris2 --build project.ipkg && rg 'maybe not total\|covering' . && exit 14 || echo "All types verified"
```

---

## Type Construct Selection Guide

Use this guide to select the appropriate dependent type for your use case:

| Construct    | When to Use                        | Example                                                |
| ------------ | ---------------------------------- | ------------------------------------------------------ |
| `Vect n a`   | Length known at compile-time       | `Vect 3 Int` - exactly 3 integers                      |
| `Fin n`      | Type-safe indexing (0 to n-1)      | `index : Fin n -> Vect n a -> a`                       |
| `Dec p`      | Decidable propositions with proof  | `isElem : (x : a) -> (xs : List a) -> Dec (Elem x xs)` |
| `DPair a p`  | Unknown-length results (filtering) | `filter : (a -> Bool) -> Vect n a -> (m ** Vect m a)`  |
| `Subset a p` | Refined types with proof           | `Subset Nat IsPositive`                                |
| `So b`       | Convert Bool to Type               | `So (x > 0)` - proof that x > 0                        |
| `Elem x xs`  | Membership proof                   | Prove element in list                                  |
| `List1 a`    | Non-empty guarantee                | `(xs : List a ** NonEmpty xs)`                         |

### Complete Type Patterns Reference

```idris
-- Length-indexed vectors
data Vect : Nat -> Type -> Type where
  Nil  : Vect Z a
  (::) : a -> Vect n a -> Vect (S n) a

-- Finite numbers (bounded indices)
data Fin : Nat -> Type where
  FZ : Fin (S n)           -- Zero is valid for any non-empty range
  FS : Fin n -> Fin (S n)  -- Successor preserves bound

-- Decidable propositions
data Dec : Type -> Type where
  Yes : p -> Dec p         -- Proof that p holds
  No  : Not p -> Dec p     -- Proof that p doesn't hold

-- Dependent pairs (existentials)
data DPair : (a : Type) -> (p : a -> Type) -> Type where
  MkDPair : (x : a) -> p x -> DPair a p

-- Syntax sugar for dependent pairs
(n ** Vect n a)  -- equivalent to DPair Nat (\n => Vect n a)

-- Subset types (refinements)
data Subset : Type -> (pred : a -> Type) -> Type where
  Element : (x : a) -> pred x -> Subset a pred

-- Boolean reflection
data So : Bool -> Type where
  Oh : So True
```

---

## Hole-Driven Development Workflow

### Step-by-Step Process

1. **Write signature with holes:**
   ```idris
   append : Vect n a -> Vect m a -> Vect (n + m) a
   append xs ys = ?append_hole
   ```

2. **Check to see hole types:**
   ```bash
   idris2 --check src/Vectors.idr
   # Output shows: append_hole : Vect (n + m) a
   ```

3. **Use REPL for exploration:**
   ```
   Main> :t append_hole
   Main> :doc Vect
   Main> :search Vect n a -> Vect m a -> Vect (n + m) a
   ```

4. **Refine using case analysis:**
   ```idris
   append : Vect n a -> Vect m a -> Vect (n + m) a
   append [] ys = ys
   append (x :: xs) ys = x :: append xs ys
   ```

5. **Verify totality:**
   ```bash
   idris2 --total --check src/Vectors.idr
   ```

### REPL Commands Reference

| Command        | Purpose                  | Example                     |
| -------------- | ------------------------ | --------------------------- |
| `:t expr`      | Show type of expression  | `:t map`                    |
| `:doc name`    | Show documentation       | `:doc Vect`                 |
| `:search type` | Find functions by type   | `:search a -> Maybe a -> a` |
| `:prove hole`  | Start interactive prover | `:prove append_hole`        |
| `:let x = e`   | Define local binding     | `:let xs = [1,2,3]`         |
| `:printdef f`  | Show function definition | `:printdef map`             |
| `:total f`     | Check totality of f      | `:total append`             |
| `:browse ns`   | List names in namespace  | `:browse Data.Vect`         |
| `:set eval`    | Set evaluation strategy  | `:set eval nf`              |

### Interactive Proof Commands

```
> :prove myHole
--------------------
Goal: Vect (n + m) a

> intro xs        -- Introduce variable
> intros          -- Introduce all
> exact e         -- Provide exact term
> refine f        -- Apply function
> trivial         -- Solve trivial goal
> search          -- Auto-search for proof
> qed             -- Complete proof
```

---

## Totality Checking

### Totality Annotations

```idris
-- Mark function as total (compiler verifies)
total
append : Vect n a -> Vect m a -> Vect (n + m) a

-- Mark as partial (explicit escape hatch)
partial
infiniteLoop : a -> b

-- Mark as covering (all cases handled but may not terminate)
covering
process : Stream a -> IO ()
```

### Totality Strategies

| Strategy               | When to Use                  | Example                            |
| ---------------------- | ---------------------------- | ---------------------------------- |
| Structural recursion   | Argument gets smaller        | `length (x :: xs) = 1 + length xs` |
| Well-founded recursion | Custom measure decreases     | `%default total` with measure      |
| Coinduction            | Infinite structures          | `Stream`, `Codata`                 |
| Assert total           | Escape hatch (use sparingly) | `assert_total $ unsafeOp x`        |

### Proving Termination

```idris
-- Idris infers termination from structural recursion
total
length : Vect n a -> Nat
length [] = 0
length (x :: xs) = 1 + length xs

-- For complex recursion, use sized types or well-founded recursion
total
merge : Ord a => List a -> List a -> List a
merge [] ys = ys
merge xs [] = xs
merge (x :: xs) (y :: ys) =
  if x <= y
    then x :: merge xs (y :: ys)
    else y :: merge (x :: xs) ys
```

---

## Proof Organization Patterns

### Module Structure Template

```idris
-- src/Data/SafeList.idr

module Data.SafeList

import Data.Vect
import Data.Fin

%default total

||| A non-empty list with type-level length guarantee
public export
data SafeList : Nat -> Type -> Type where
  Singleton : a -> SafeList 1 a
  Cons : a -> SafeList n a -> SafeList (S n) a

||| Safe head - always succeeds on non-empty list
export
head : SafeList (S n) a -> a
head (Singleton x) = x
head (Cons x _) = x

||| Safe index - type guarantees bounds
export
index : Fin n -> SafeList n a -> a
index FZ (Singleton x) = x
index FZ (Cons x _) = x
index (FS i) (Cons _ xs) = index i xs
```

### Dependent Pair Pattern (Unknown Length)

```idris
||| Filter with proof of length relationship
filter : (a -> Bool) -> Vect n a -> (m ** Vect m a)
filter p [] = (0 ** [])
filter p (x :: xs) =
  let (m ** xs') = filter p xs in
  if p x
    then (S m ** x :: xs')
    else (m ** xs')

||| Usage: pattern match to extract length and vector
processFiltered : Vect n Nat -> IO ()
processFiltered xs =
  let (m ** ys) = filter (> 5) xs in
  putStrLn $ "Kept " ++ show m ++ " elements"
```

### State Machine Pattern

```idris
||| Door state encoded in types
data DoorState = Open | Closed

||| Door operations indexed by state transitions
data Door : DoorState -> Type where
  MkDoor : Door Closed

||| Type-safe operations
openDoor : Door Closed -> Door Open
openDoor MkDoor = ?openDoor_rhs  -- Implementation

closeDoor : Door Open -> Door Closed
closeDoor d = ?closeDoor_rhs

||| Cannot close an already closed door - type error!
-- closeDoor MkDoor  -- Won't compile
```

---

## Exit Codes

| Code | Meaning                    | Resolution                              |
| ---- | -------------------------- | --------------------------------------- |
| 0    | All types verified         | Success                                 |
| 11   | Idris 2 not installed      | Install via `pack` or directly          |
| 12   | No Idris artifacts found   | Create `.idr` or `.ipkg` files          |
| 13   | Type errors/unsolved goals | Fix type mismatches                     |
| 14   | Totality/coverage gaps     | Add missing cases or termination proofs |

---

## Troubleshooting Guide

### Common Issues

| Symptom              | Cause                               | Resolution                                             |
| -------------------- | ----------------------------------- | ------------------------------------------------------ |
| Exit 11              | Idris 2 not found                   | Install via `pack install idris2` or build from source |
| Exit 12              | No .idr files in `.outline/proofs/` | Run plan phase first                                   |
| Exit 13              | Type error                          | Add explicit type annotations or fix type mismatch     |
| Exit 14              | Holes remaining or partial function | Fill holes with proof terms, ensure totality           |
| `Can't find import`  | Missing package                     | Add to `.ipkg` depends or install with `pack`          |
| `Possibly not total` | Function may not terminate          | Add termination hint or use `partial` (temporary)      |
| `not covering`       | Missing pattern cases               | Add exhaustive pattern match                           |
| `Can't unify`        | Type inference failure              | Add explicit type annotation                           |
| `Undefined name`     | Name not exported                   | Add `public export` to definition                      |

### Type Construct Selection Guide

```
Scenario                           -> Type Construct
-------------------------------------------------------------
Length known at compile-time       -> Vect n a
Safe array indexing (0 to n-1)     -> Fin n
Decidable proposition with proof   -> Dec p
Unknown-length result (filtering)  -> DPair a p (dependent pair)
Refined type with proof            -> Subset a p
Convert Bool to Type               -> So b
Prove element in collection        -> Elem x xs
Non-empty guarantee                -> List1 a or (xs : List a ** NonEmpty xs)
Bounded numeric range              -> data InRange : (lo : Nat) -> (hi : Nat) -> Type
```

### Hole-Driven Development Workflow

**Step 1: Write signature with holes**

```idris
processData : (input : ValidInput) -> {auto prf : IsPositive (value input)} -> Result
processData input = ?processData_impl
```

**Step 2: Check hole types**

```bash
idris2 --check Module.idr
# Output shows: processData_impl : Result
```

**Step 3: Use REPL for interactive development**

```idris
:t processData_impl     -- Show type of hole
:doc Result             -- Documentation for type
:search Nat -> Bool     -- Find functions matching signature
:prove processData_impl -- Interactive proof mode (if available)
```

**Step 4: Refine using case analysis**

```idris
-- Before
processData input = ?processData_impl

-- After case split
processData (MkValidInput val prf) = ?processData_impl_1

-- Continue refining
processData (MkValidInput val prf) = MkResult (compute val)
```

### Debugging Commands

```bash
# Check single file
idris2 --check Module.idr

# Check with totality enforcement
idris2 --total Module.idr

# Build package
idris2 --build package.ipkg

# REPL for interactive exploration
idris2 Module.idr
# Then use :t, :doc, :search commands

# Find all holes
rg '\?\w+' .outline/proofs/

# Find partial/covering annotations
rg 'partial|covering' .outline/proofs/

# Check what's exported
idris2 --check Module.idr --show-exports

# Verbose compilation
idris2 --check --verbose Module.idr
```

### Totality Strategies

**Problem: Function marked as possibly not total**

```idris
-- Problematic: structural recursion not obvious
loop : List Nat -> Nat
loop [] = 0
loop (x :: xs) = x + loop (filter (< x) xs)  -- filter result size unknown

-- Solution 1: Use sized types / assert_smaller
loop (x :: xs) = x + loop (assert_smaller (x :: xs) (filter (< x) xs))

-- Solution 2: Use Nat-indexed recursion
loopN : (fuel : Nat) -> List Nat -> Nat
loopN Z _ = 0
loopN (S k) [] = 0
loopN (S k) (x :: xs) = x + loopN k (filter (< x) xs)
```

**Problem: Coverage checker fails**

```idris
-- Incomplete
process : Either a b -> c
process (Left x) = handleLeft x
-- Missing: process (Right y) = ...

-- Complete
process : Either a b -> c
process (Left x) = handleLeft x
process (Right y) = handleRight y
```

### Handling Unknown-Length Results

```idris
-- Problem: filter returns unknown length
filterPositive : Vect n Int -> Vect ? Int  -- Can't know output length

-- Solution: Use dependent pair
filterPositive : Vect n Int -> (m : Nat ** Vect m Int)
filterPositive [] = (0 ** [])
filterPositive (x :: xs) =
  let (m ** rest) = filterPositive xs
  in if x > 0 then (S m ** x :: rest) else (m ** rest)

-- Alternative: Use List for variable-length, prove properties
filterPositiveList : List Int -> (xs : List Int ** All (\x => x > 0) xs)
```

### Runtime Erasure (Multiplicity)

```idris
-- Proof arguments erased at runtime (0 multiplicity)
safeHead : (xs : List a) -> {0 prf : NonEmpty xs} -> a
safeHead (x :: _) = x

-- Runtime-relevant (1 multiplicity, default)
process : (n : Nat) -> Vect n a -> a
process (S _) (x :: _) = x

-- Unrestricted (can use multiple times)
duplicate : {w : _} -> a -> (a, a)
duplicate x = (x, x)
```

---

## Common Pitfalls and Solutions

### Pitfall 1: Overly Strict Totality

**Problem:** Function rejected as potentially non-total despite being correct.

**Solution:**

```idris
-- Bad: Idris can't see termination
ackermann : Nat -> Nat -> Nat
ackermann Z n = S n
ackermann (S m) Z = ackermann m 1
ackermann (S m) (S n) = ackermann m (ackermann (S m) n)

-- Good: Use sized types or assert_total with proof
total
ackermann : Nat -> Nat -> Nat
ackermann Z n = S n
ackermann (S m) Z = ackermann m 1
ackermann (S m) (S n) = assert_total $ ackermann m (ackermann (S m) n)
-- Note: assert_total should be justified with external proof
```

### Pitfall 2: Runtime Erasure Confusion

**Problem:** Proof terms affecting runtime performance.

**Solution:**

```idris
-- Bad: Proof carried at runtime
data Positive : Nat -> Type where
  IsPos : (n : Nat) -> Positive (S n)

-- Good: Use 0-quantity for erased proofs
data Positive : Nat -> Type where
  IsPos : (0 n : Nat) -> Positive (S n)
  -- The `0` means n is erased at runtime
```

### Pitfall 3: Unknown-Length Results

**Problem:** Function returns list of unknown length, breaking type invariants.

**Solution:**

```idris
-- Bad: Loses length information
filterBad : (a -> Bool) -> Vect n a -> List a

-- Good: Use dependent pair to preserve relationship
filter : (a -> Bool) -> Vect n a -> (m ** Vect m a)

-- Or use decidable predicates
filterDec : (p : a -> Bool) ->
            Vect n a ->
            (m ** (Vect m a, (x : a) -> Elem x result -> So (p x)))
```

### Pitfall 4: Type Inference Failures

**Problem:** Idris cannot infer implicit arguments.

**Solution:**

```idris
-- Bad: Ambiguous implicit
append xs ys = ?hole

-- Good: Explicit type annotation
append : {n, m : Nat} -> Vect n a -> Vect m a -> Vect (n + m) a
append [] ys = ys
append (x :: xs) ys = x :: append xs ys

-- Or provide implicits at call site
result = append {n = 3} {m = 2} xs ys
```

---

## Performance Tips

### Avoid Unnecessary Proof Computation

```idris
-- SLOW: Proof computed at runtime
slowHead : (xs : List a) -> {auto prf : NonEmpty xs} -> a

-- FAST: Proof erased
fastHead : (xs : List a) -> {auto 0 prf : NonEmpty xs} -> a
```

### Use Lazy for Large Structures

```idris
-- Strict evaluation (default)
data Tree a = Leaf | Node a (Tree a) (Tree a)

-- Lazy evaluation for infinite/large structures
data LazyTree a = Leaf | Node a (Lazy (LazyTree a)) (Lazy (LazyTree a))
```

### Prefer Primitive Operations

```idris
-- SLOW: Unary Nat arithmetic
slowAdd : Nat -> Nat -> Nat
slowAdd Z m = m
slowAdd (S n) m = S (slowAdd n m)

-- FAST: Use Integer primitives
fastAdd : Integer -> Integer -> Integer
fastAdd = (+)
```

---

## Style Guidelines

1. **Type signatures:** Always provide explicit signatures for top-level definitions
   ```idris
   -- GOOD
   append : Vect n a -> Vect m a -> Vect (n + m) a

   -- BAD (relies on inference)
   append xs ys = ...
   ```

2. **Documentation:** Use `|||` for public exports
   ```idris
   ||| Safely retrieve the first element of a non-empty vector.
   ||| @xs The non-empty vector
   export
   head : Vect (S n) a -> a
   ```

3. **Totality:** Default to total, mark exceptions explicitly
   ```idris
   %default total

   partial  -- Explicit annotation
   unsafeOp : a -> b
   ```

4. **Naming conventions:**
   - Types: `PascalCase` (e.g., `SafeList`, `DoorState`)
   - Functions: `camelCase` (e.g., `safeHead`, `filterPositive`)
   - Proofs: descriptive (e.g., `lengthAppend`, `headTailLemma`)

---

## When NOT to Use Type-Driven Development

| Scenario                             | Better Alternative                  |
| ------------------------------------ | ----------------------------------- |
| Simple input validation              | Design-by-contract (runtime checks) |
| Rapid prototyping                    | Test-driven (faster iteration)      |
| Performance-critical numeric code    | Rust/C with property tests          |
| Team unfamiliar with dependent types | Contract + property tests           |
| Frequently changing data schemas     | Runtime validation (Zod, pydantic)  |
| UI rendering logic                   | React/Vue with TypeScript           |

---

## Complementary Approaches

- **Type-driven + Proof-driven**: Idris 2 for implementation, Lean 4 for complex mathematical proofs
- **Type-driven + Test-driven**: Types for invariants, property tests for behavior exploration
- **Type-driven + Contract**: Types for compile-time, contracts for external API boundaries

---

## Remediation Workflow

1. **Find incomplete definitions:**
   ```bash
   rg -n '\?[a-zA-Z_]+' .  # Find holes
   rg -n 'maybe not total\|covering' .  # Find totality issues
   ```

2. **For each hole:**
   - Load file in REPL: `idris2 src/File.idr`
   - Check hole type: `:t ?hole_name`
   - Search for solutions: `:search <type>`
   - Fill hole and verify

3. **For totality issues:**
   - Check which argument doesn't decrease
   - Add explicit termination measure
   - Consider using sized types or well-founded recursion

4. **Verify completion:**
   ```bash
   idris2 --total --build project.ipkg && rg '\?' . || echo "All complete"
   ```

---

## Integration Points

- **Quint:** Translate Quint state machine specs to Idris type-indexed state machines
- **Lean 4:** Cross-verify properties in both systems
- **Rust:** Generate type-safe FFI bindings from verified Idris interfaces

---

## Safety

- Read-only operations; no file mutations during validation
- Abort on exit >= 11 or if safety concerns raised (code 3)
- Types checked at compile time; zero runtime overhead for proofs

---

## Resources

- [Idris 2 Documentation](https://idris2.readthedocs.io/)
- [Type-Driven Development with Idris](https://www.manning.com/books/type-driven-development-with-idris) (book)
- [Idris 2 Tutorial](https://idris2.readthedocs.io/en/latest/tutorial/index.html)
- [pack - Idris 2 Package Manager](https://github.com/stefan-hoeck/pack)
