# clang-tidy check reference

Grounded against LLVM/Clang 23.1.0. Verify any check name against the local
build with `clang-tidy -checks='*' --list-checks`.

## bugprone-*

| Check | Catches |
|---|---|
| `bugprone-use-after-move` | Use of a moved-from object |
| `bugprone-integer-division` | Integer division assigned to a float |
| `bugprone-suspicious-memset-usage` | `memset(p, 0, sizeof(p))` on a pointer |
| `bugprone-macro-parentheses` | Unparenthesized macro arguments |
| `bugprone-signed-char-misuse` | Signed char used as an array index |
| `bugprone-string-constructor` | `std::string(0)` instead of `""` |
| `bugprone-narrowing-conversions` | Narrowing to a smaller type |
| `bugprone-branch-clone` | Identical if/else branches |
| `bugprone-infinite-loop` | Loop with no exit condition |
| `bugprone-easily-swappable-parameters` | Adjacent same-type parameters callers swap |
| `bugprone-implicit-widening-of-multiplication-result` | Narrow multiply widened after the fact |

## clang-analyzer-*

| Check | Catches |
|---|---|
| `clang-analyzer-core.NullDereference` | Null pointer dereference |
| `clang-analyzer-core.UndefinedBinaryOperatorResult` | Uninitialized value in an expression |
| `clang-analyzer-unix.Malloc` | malloc/free misuse |
| `clang-analyzer-unix.API` | POSIX API misuse |
| `clang-analyzer-security.insecureAPI.*` | `gets`, `strcpy`, `rand` and friends |
| `clang-analyzer-cplusplus.NewDelete` | new/delete mismatches |

## modernize-*

| Check | Migration |
|---|---|
| `modernize-use-nullptr` | `NULL` to `nullptr` |
| `modernize-use-override` | Add `override` to virtuals |
| `modernize-use-auto` | Deduce obvious types |
| `modernize-use-emplace` | `push_back(T(...))` to `emplace_back` |
| `modernize-loop-convert` | Index loops to range-for |
| `modernize-use-default-member-init` | In-class member initializers |
| `modernize-use-nodiscard` | Add `[[nodiscard]]` |
| `modernize-use-trailing-return-type` | Trailing return types; often disabled as churn |

## performance-*

| Check | Catches |
|---|---|
| `performance-unnecessary-copy-initialization` | Copy where a const ref suffices |
| `performance-avoid-endl` | `std::endl` flushes; use `'\n'` |
| `performance-for-range-copy` | Range-for copies where a ref suffices |
| `performance-move-const-arg` | `std::move` on a const has no effect |

## Starter configuration

```yaml
Checks: >
  bugprone-*,
  clang-analyzer-core.*,
  clang-analyzer-unix.*,
  clang-analyzer-security.*,
  modernize-use-nullptr,
  modernize-use-override,
  performance-*,
  -modernize-use-trailing-return-type,
  -bugprone-easily-swappable-parameters,
  -bugprone-implicit-widening-of-multiplication-result
WarningsAsErrors: 'bugprone-*,clang-analyzer-*'
HeaderFilterRegex: '^(src|include)/.*'
```

## Suppression

clang-tidy honors NOLINT comments only; there is no attribute-based
suppression.

```cpp
foo();  // NOLINT
foo();  // NOLINT(check-name)

// NOLINTNEXTLINE(check-name)
foo();

// NOLINTBEGIN(check-name)
...
// NOLINTEND(check-name)
```

## Common false positives

| False positive | Strategy |
|---|---|
| Third-party headers | `HeaderFilterRegex` to exclude them |
| Platform-specific compat code | NOLINT at the call site with a reason |
| C-style modernization in C code | Drop `modernize-*` for C-only projects |
| `bugprone-easily-swappable-parameters` on an intentional API | Disable it globally |
