# Per-language reference

## Coverage limits

Apply these limits when interpreting findings and silence for each language.

| Language | What the report does not cover |
|---|---|
| Go | Only symbols from the analyzed file; `go build` links the runtime whose divisions are all on public data. |
| JavaScript, TypeScript | Bytecode findings restricted to functions the file declares by name; anonymous callbacks fall to the source scan. TypeScript bytecode findings carry no line (V8 positions index transpiled output). |
| Python, Ruby, PHP | Bytecode reflects the interpreter that ran, not a JIT'd or alternative runtime. |
| Rust | Analyzed as a library unless the file declares `fn main`; private functions with no caller may be optimized away. |
| Swift | Targets the host on Linux; iOS/macOS triples need an Apple toolchain. |

## Constant-time comparison primitives

A confirmed comparison or lookup finding needs the language's constant-time primitive, not a loop rewrite.

| Language | Constant-time comparison |
|---|---|
| C, C++ | `CRYPTO_memcmp` (OpenSSL) or `sodium_memcmp` |
| Go | `crypto/subtle.ConstantTimeCompare` |
| Rust | the `subtle` crate's `ConstantTimeEq` |
| Java, Kotlin | `MessageDigest.isEqual` |
| C# | `CryptographicOperations.FixedTimeEquals` |
| PHP | `hash_equals` |
| Python | `hmac.compare_digest` |
| Ruby | `OpenSSL.secure_compare` |
| JavaScript, TypeScript | `crypto.timingSafeEqual` |

A secret-indexed lookup has no drop-in replacement: it needs a bit-sliced or arithmetic formulation that touches every element. Encoding a secret through a table (`base64_encode`, `bin2hex`, `chr`/`ord`) is the same problem in a library.

## Prerequisites

| Language | Requirement |
|---|---|
| C, C++, Go, Rust | `gcc`/`clang`, `go`, `rustc` in PATH |
| Swift | Xcode or Swift toolchain (`swiftc`) |
| Java, Kotlin | JDK (`javac`, `javap`); Kotlin also needs `kotlinc` |
| C# | .NET SDK plus `ilspycmd` (`dotnet tool install -g ilspycmd`) |
| PHP | PHP with the VLD extension or OPcache |
| JavaScript, TypeScript | Node.js |
| Python | Python 3.x |
| Ruby | Ruby with `--dump=insns` support |
| All languages | A constant-time analyzer that compiles the target and scans the emitted assembly or bytecode for the variable-time instruction families above (e.g., the Trail of Bits ct_analyzer). |
