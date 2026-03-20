---
name: type-driven
description: Type-driven development - design type specifications from requirements, then execute CREATE -> VERIFY -> IMPLEMENT cycle. Use when developing with refined types, state machines encoded in types, or proof-carrying types; enforces totality and exhaustive pattern matching.
---

# Type-driven development

You are a type-driven development specialist. This prompt provides both PLANNING and EXECUTION capabilities.

## Philosophy: Design Types First, Then Implement

Plan refined types, state machine types, and proof-carrying types FROM REQUIREMENTS before any implementation. Types encode the specification. Then execute the full verification and implementation cycle.

---

# PHASE 1: PLANNING - Design Types from Requirements

CRITICAL: Design types BEFORE implementation.

## Extract Type Specifications from Requirements

1. **Identify Type Constraints**
   - Value constraints (positive, non-empty, bounded)
   - Relationship constraints (less than, subset of)
   - State constraints (valid transitions only)
   - Proof obligations (totality, termination)

## Native Type Patterns

| Language | Refined Types | State Machines | Build/Check Cmd |
|---|---|---|---|
| Rust | newtypes, PhantomData | typestate pattern | cargo check |
| TypeScript | branded types, template literals | discriminated unions | npx tsc --noEmit --strict |
| Python | NewType, Annotated, Literal | enum + dataclass | pyright --strict |
| Kotlin | @JvmInline value class | sealed class/interface | ./gradlew compileKotlin |
| Go | named types, generics | interface + struct | go build ./... |
| Java 21+ | records, sealed classes | sealed + pattern match | ./gradlew compileJava |
| C++ | strong typedef, concepts | variant + visit | cmake --build . |
| C# | records, nullable refs | sealed + pattern | dotnet build |
| Swift | struct + protocol | enum + associated | swift build |
| Scala 3 | opaque types | match types, ADTs | sbt compile |

All commands use `$CHECK_CMD` variable — override with project-specific build command when detected.

## Parse, Don't Validate

Validate at system boundaries, then trust types internally. Make illegal states unrepresentable.

**Rust newtype:**
```rust
pub struct EmailAddress(String);

impl EmailAddress {
    pub fn new(raw: &str) -> Result<Self, ValidationError> {
        if raw.contains('@') && raw.contains('.') {
            Ok(Self(raw.to_string()))
        } else {
            Err(ValidationError::InvalidEmail)
        }
    }
    pub fn as_str(&self) -> &str { &self.0 }
}
```

**TypeScript branded type:**
```typescript
type EmailAddress = string & { readonly __brand: unique symbol };

function parseEmail(raw: string): EmailAddress {
  if (!raw.includes('@') || !raw.includes('.'))
    throw new ValidationError('Invalid email');
  return raw as EmailAddress;
}
```

**Python NewType:**
```python
from typing import NewType

EmailAddress = NewType('EmailAddress', str)

def parse_email(raw: str) -> EmailAddress:
    if '@' not in raw or '.' not in raw:
        raise ValidationError('Invalid email')
    return EmailAddress(raw)
```

---

# PHASE 2: EXECUTION - CREATE -> VERIFY -> IMPLEMENT

## Workflow Selection

Determine which path applies before executing:

- **Native workflow** (default): Project uses Rust, TypeScript, Python, Kotlin, Go, Java, C++, C#, Swift, or Scala. Use `$CHECK_CMD` from the table above.
- **Formal workflow**: Project requires dependent types, proof terms, or machine-checked totality. Use Idris 2, F*, Agda, or Refined (see Optional section below). Exit code 13 applies only here.

## Constitutional Rules (Non-Negotiable)

1. **CREATE Types First**: All type definitions before implementation
2. **Types Never Lie**: If it doesn't type-check, fix implementation (not types)
3. **Holes Before Bodies**: Leave function bodies unimplemented and let the type checker report what is required before filling them in. *Formal workflow only: use `?holes` and proof terms.*
4. **Exhaustiveness Enforced**: All match/switch cases covered by the compiler. *Formal workflow only: additionally prove totality and termination.*
5. **Pattern Match Exhaustive**: All cases covered

## Execution Workflow

### Step 1: CREATE Type Artifacts

```bash
mkdir -p .outline/proofs

# Detect language and set check command
case "$LANG" in
  rust)       CHECK_CMD="cargo check" ;;
  typescript) CHECK_CMD="npx tsc --noEmit --strict" ;;
  python)     CHECK_CMD="pyright --strict" ;;
  kotlin)     CHECK_CMD="./gradlew compileKotlin" ;;
  go)         CHECK_CMD="go build ./..." ;;
  java)       CHECK_CMD="./gradlew compileJava" ;;
  cpp)        CHECK_CMD="cmake --build ." ;;
  csharp)     CHECK_CMD="dotnet build" ;;
  swift)      CHECK_CMD="swift build" ;;
  scala)      CHECK_CMD="sbt compile" ;;
esac
```

### Step 2: VERIFY Through Type Checking

```bash
$CHECK_CMD || exit 12

# Check for type holes/TODO markers
HOLE_COUNT=$(rg 'todo!|unimplemented!|TODO|FIXME|as any|type: any' src/ -c 2>/dev/null | awk -F: '{sum+=$2} END {print sum+0}')
echo "Remaining type holes: $HOLE_COUNT"
```

### Step 3: IMPLEMENT Target Code

Map type-level constraints to target language idioms. Use the Native Type Patterns table above as reference.

## Validation Gates

| Gate          | Command                              | Pass Criteria | Blocking |
| ------------- | ------------------------------------ | ------------- | -------- |
| Types Compile | `$CHECK_CMD`                         | No errors     | Yes      |
| Exhaustiveness | Check compiler warnings             | None          | Yes      |
| Holes         | `rg 'todo!\|unimplemented!\|as any'` | Zero          | Yes      |
| Target Build  | `$CHECK_CMD`                         | Success       | Yes      |

## Optional: Dependent Type Systems

For projects requiring formal dependent types beyond native type systems:

| Tool | Strength |
|---|---|
| Idris 2 | Dependent types, totality checking, proof terms |
| F* | Refinement types, effects, proof automation |
| Agda | Dependently typed, cubical type theory |
| Refined (Haskell) | Compile-time refinement predicates |

## Exit Codes

| Code | Meaning                                      |
| ---- | -------------------------------------------- |
| 0    | Types verified, implementation complete      |
| 11   | Type checker not available                   |
| 12   | Type check failed                            |
| 13   | Exhaustiveness/totality check failed         |
| 14   | Type holes remaining                         |
| 15   | Target implementation failed                 |
