# Slop Catalog

Use this catalog to classify findings before editing. `HIGH` means deterministic presence; it does **not** always mean auto-removable. Autofix strategies are constrained to `remove-line`, `add-comment`, `remove-block`, `replace-whitespace`, or `flag-only`.

## Global Exclusions

Exclude these from automatic fixes: tests, fixtures, mocks, examples, generated code, vendored code, lockfiles, minified bundles, build output, coverage output, and Markdown whitespace.

Common exclude selectors:

```text
**/test/** **/tests/** **/__tests__/** *.test.* *.spec.* *_test.* *Test.java
**/fixtures/** **/mocks/** **/testdata/** **/examples/** **/benches/**
dist/** build/** target/** coverage/** vendor/** node_modules/** *.min.* *.lock
*.generated.* *.pb.* openapi/** generated/**
```

## Certainty Rules

| Certainty | Rule | Edit policy |
|---|---|---|
| HIGH | Direct regex/AST pattern; file is in production scope; match identifies a concrete leftover | Auto-fix only when strategy is mechanical and behavior-preserving |
| MEDIUM | Requires control-flow, codegraph, ratio, or cross-file reasoning | Report only |
| LOW | Optional external CLI heuristic or noisy smell | Report only |

## Universal HIGH Patterns

| Pattern | Certainty | Detection recipe | Autofix strategy |
|---|---:|---|---|
| Trailing whitespace outside Markdown | HIGH | `search pattern="[ \\t]+$" paths=[source globs excluding *.md]` | `replace-whitespace`: strip suffix only |
| Mixed indentation on one line | HIGH | `search pattern="^\\t+ +|^ +\\t+" paths=[source globs excluding Makefile, *.mk]` | `replace-whitespace`: normalize to file-dominant indent |
| Hardcoded OpenAI-style key | HIGH | `search pattern="sk-[A-Za-z0-9]{32,}"` | `flag-only`: require rotation + env/config replacement |
| Hardcoded GitHub token | HIGH | `search pattern="ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}|ghu_[A-Za-z0-9]{36}|ghs_[A-Za-z0-9]{36}|ghr_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{80,}"` | `flag-only`: require rotation |
| Hardcoded AWS access key / secret | HIGH | `search pattern="AKIA[0-9A-Z]{16}|aws_secret_access_key\\s*[:=]\\s*['\"][A-Za-z0-9/+=]{40}['\"]"` | `flag-only`: require rotation |
| Bearer token literal | HIGH | `search pattern="Bearer [A-Za-z0-9._~+/-]{20,}"` | `flag-only`: require rotation |
| JWT-looking token | HIGH | `search pattern="eyJ[A-Za-z0-9_-]{10,}\\.eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}"` | `flag-only`: require rotation |
| Private key block | HIGH | `search pattern="-----BEGIN (RSA )?PRIVATE KEY-----"` | `flag-only`: require rotation/revocation |
| Generic secret assignment | HIGH | `search pattern="(password|secret|api[_-]?key|token|credential|auth)[_-]?(key|token|secret|pass)?\\s*[:=]\\s*['\"][^'\"\\s]{8,}['\"]"` excluding test/mock/example/masked values | `flag-only` |
| Placeholder text | HIGH | `search pattern="(lorem ipsum|test test test|asdf asdf|foo bar baz|replace (this|me)|todo:?\\s+implement|this is a placeholder)"` in code comments/strings, excluding docs and fixtures | `flag-only` unless isolated comment can be removed |

## JavaScript / TypeScript

| Pattern | Certainty | Detection recipe | Autofix strategy |
|---|---:|---|---|
| Debug console output | HIGH | `ast-grep pat="console.log($$$ARGS)"`; `ast-grep pat="console.debug($$$ARGS)"`; exclude CLIs/scripts/entrypoints/tests | `remove-line` when expression statement is standalone |
| Placeholder throw | HIGH | `search pattern="throw\\s+new\\s+Error\\s*\\(\\s*['\"].*(TODO|implement|not\\s+impl)" paths=["**/*.{js,jsx,ts,tsx,mjs,cjs}"]` | `flag-only`; implementation missing |
| Empty function body | HIGH | `ast-grep pat="function $NAME($$$ARGS) { }"`; also check arrow bodies `($$$ARGS) => { }` | `flag-only`; public surface may depend on it |
| Empty catch | HIGH | `ast-grep pat="try { $$$BODY } catch ($E) { }"` or `search pattern="catch\\s*(\\([^)]*\\))?\\s*\\{\\s*\\}"` | `add-comment` only if intentional swallow is proven; otherwise `flag-only` |
| Stub return only | MEDIUM | `ast-grep pat="function $NAME($$$ARGS) { return $VALUE; }"`; check `$VALUE` in `0/null/undefined/true/false/[]/{}/""` and no other significant statements | `flag-only` |
| Doc-to-code ratio >3 | MEDIUM | Compare JSDoc block line count to function body lines for functions with ≥3 code lines | `flag-only` |
| Verbose comments ratio >2 | MEDIUM | Count inline/comment lines vs code lines inside functions | `flag-only` |
| Dead code after return/throw | MEDIUM | AST/control-flow scan for statements after terminating statement in same block | `flag-only` |
| Mutable all-caps global | MEDIUM | `search pattern="^(let|var)\\s+[A-Z][A-Z0-9_]*\\s*="` excluding config/tests/constants | `flag-only` |

## Python

| Pattern | Certainty | Detection recipe | Autofix strategy |
|---|---:|---|---|
| Debug print / breakpoint | HIGH | `search pattern="\\b(print\\(|breakpoint\\(|import pdb|import ipdb)" paths=["**/*.py"]` excluding tests/conftest/CLI output scripts | `remove-line` for standalone debug lines |
| `raise NotImplementedError` | HIGH | `search pattern="raise\\s+NotImplementedError" paths=["**/*.py"]` | `flag-only` |
| Function body only `pass` | HIGH | `ast-grep pat="def $NAME($$$ARGS): pass"` or regex fallback `def\s+\w+\s*\([^)]*\)\s*:\s*(pass|\n\s+pass)\s*$` | `flag-only`; implementation missing |
| Function body only ellipsis | HIGH | `search pattern="def\\s+\\w+\\s*\\([^)]*\\)\\s*:\\s*(\\.\\.\\.|\\n\\s+\\.\\.\\.)\\s*$"` excluding `.pyi` | `flag-only` |
| Empty except pass | HIGH | `search pattern="except\\s*[^:]*:\\s*pass\\s*$" paths=["**/*.py"]` | `add-comment` only when intentional; otherwise `flag-only` |
| Bare `except:` | MEDIUM | `search pattern="^\\s*except\\s*:"` | `flag-only` |
| Stub return only | MEDIUM | inspect `def` body with one significant line returning `None/0/True/False/[]/{}/""` | `flag-only` |
| Mutable all-caps global collection | MEDIUM | `search pattern="^[A-Z][A-Z0-9_]*\\s*=\\s*(\\[|\\{|dict\\(|list\\(|set\\()"` excluding settings/constants/tests | `flag-only` |

## Rust

| Pattern | Certainty | Detection recipe | Autofix strategy |
|---|---:|---|---|
| Debug macros | HIGH | `search pattern="(println!|dbg!|eprintln!)\\(" paths=["**/*.rs"]` excluding tests/examples/benches and binaries that intentionally print | `remove-line` for standalone debug macros |
| `todo!()` / `unimplemented!()` | HIGH | `ast-grep pat="todo!($$$ARGS)"`; `ast-grep pat="unimplemented!($$$ARGS)"`; regex fallback `\b(todo|unimplemented)!\s*\(` | `flag-only` |
| `panic!("TODO")` placeholder | HIGH | `search pattern="\\bpanic!\\s*\\(\\s*['\"].*(TODO|implement)" paths=["**/*.rs"]` | `flag-only` |
| Bare `.unwrap()` | HIGH | `ast-grep pat="$X.unwrap()"`; regex fallback `search pattern="\\.unwrap\\(\\s*\\)"` then ignore `unwrap_or*`/method-chain false positives by inspection; exclude tests/examples/benches | `flag-only`; requires error-path design |
| Bare `.expect(...)` | HIGH | `ast-grep pat="$X.expect($MSG)"`; exclude tests/examples/benches | `flag-only`; requires error-path design |
| Empty error match arm | HIGH | `search pattern="Err\\s*\\([^)]*\\)\\s*=>\\s*\\{\\s*\\}" paths=["**/*.rs"]` | `flag-only` unless surrounding invariant proves intentional |
| Stub return only | MEDIUM | function body only returns `None/0/true/false/String::new()/Vec::new()/vec![]/()/""/Default::default()` | `flag-only` |
| Unsafe block without safety comment | MEDIUM | `search pattern="unsafe\\s*\\{"` then inspect adjacent lines for `SAFETY:` | `flag-only` |

## Go

| Pattern | Certainty | Detection recipe | Autofix strategy |
|---|---:|---|---|
| Debug `fmt.Print*` | HIGH | `search pattern="fmt\\.(Print|Println|Printf)\\(" paths=["**/*.go"]`; require debug label or non-CLI/non-main context | `remove-line` when standalone |
| `panic("TODO")` | HIGH | `search pattern="panic\\s*\\(\\s*['\"].*(TODO|implement|not\\s+impl)" paths=["**/*.go"]` | `flag-only` |
| Empty error branch | HIGH | `search pattern="if\\s+err\\s*!=\\s*nil\\s*\\{\\s*\\}" paths=["**/*.go"]` | `flag-only` unless intended ignore is proven, then `add-comment` |
| Empty TODO function | HIGH | AST/read body: function contains only comments with TODO/FIXME/STUB or no statements | `flag-only` |
| Unchecked type assertion | HIGH | `search pattern="\\.\\([A-Za-z_][A-Za-z0-9_]*\\)"`; inspect for missing comma-ok form | `flag-only` |
| Panic for recoverable error | MEDIUM | `search pattern="panic\\("` outside init/test/main invariant code | `flag-only` |
| Discarded error | MEDIUM | `search pattern="_\\s*=\\s*.*\\("`; verify callee returns error | `flag-only` |
| Stub return only | MEDIUM | function body only returns `nil/0/""/false/true/[]T{}/map[...]T{}/&T{}` | `flag-only` |

## Java / Kotlin

| Pattern | Certainty | Detection recipe | Autofix strategy |
|---|---:|---|---|
| Java `UnsupportedOperationException` placeholder | HIGH | `ast-grep pat="throw new UnsupportedOperationException($$$ARGS)" paths=["**/*.java"]` | `flag-only` |
| Java/Kotlin TODO throw | HIGH | `search pattern="(RuntimeException|IllegalStateException|NotImplementedException)\\s*\\(.*(TODO|not implemented)" paths=["**/*.{java,kt,kts}"]` | `flag-only` |
| Kotlin `TODO()` | HIGH | `search pattern="\\bTODO\\s*\\(" paths=["**/*.{kt,kts}"]` | `flag-only` |
| Empty catch | HIGH | `search pattern="catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}" paths=["**/*.{java,kt,kts}"]` | `add-comment` only if intentional; otherwise `flag-only` |
| `System.out/err.println` | HIGH | `search pattern="System\\.(out|err)\\.println\\(" paths=["**/*.java"]` excluding CLI/main/tests | `remove-line` when standalone debug output |
| `printStackTrace()` | HIGH | `search pattern="\\.printStackTrace\\s*\\(" paths=["**/*.java"]` | `flag-only`; replace with project logger manually |
| `return null; // TODO` | HIGH | `search pattern="return\\s+null\\s*;\\s*//.*(TODO|FIXME|STUB)" paths=["**/*.java"]` | `flag-only` |
| Raw generics / suppress annotations | LOW | existing linter or search for `@SuppressWarnings` / raw generic declarations | `flag-only` |

## C / C++ / Shell

| Pattern | Certainty | Detection recipe | Autofix strategy |
|---|---:|---|---|
| C/C++ debug prints | HIGH | `search pattern="(printf|fprintf|std::cout|std::cerr).*(DEBUG|TRACE|HERE|TODO)" paths=["**/*.{c,h,cpp,cc,cxx,hpp,hxx}"]` | `remove-line` when standalone |
| C/C++ not implemented | HIGH | `search pattern="assert\\s*\\(\\s*false.*(TODO|not implemented)|throw\\s+.*(runtime_error|logic_error).*not implemented"` | `flag-only` |
| C++ empty catch | HIGH | `search pattern="catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}" paths=["**/*.{cpp,cc,cxx,hpp,hxx}"]` | `add-comment` only if intentional; otherwise `flag-only` |
| Shell debug tracing | HIGH | `search pattern="^\\s*set\\s+-[xv]\\b" paths=["**/*.{sh,bash,zsh}"]` excluding test scripts | `remove-line` |
| Shell placeholder function | HIGH | search function bodies containing only `:`/`true` plus TODO/not implemented comment | `flag-only` |
| Empty trap | HIGH | `search pattern="trap\\s+['\"]\\s*['\"]" paths=["**/*.{sh,bash,zsh}"]` | `flag-only` |
| `chmod 777` | HIGH | `search pattern="chmod\\s+777"` | `flag-only`; requires permission design |
| Curl pipe shell | HIGH | `search pattern="curl .*\\|\\s*(sh|bash)|wget .*\\|\\s*(sh|bash)"` | `flag-only`; security remediation |

## MEDIUM Structural Signals

| Pattern | Certainty | Detection recipe | Autofix strategy |
|---|---:|---|---|
| Doc-to-code ratio >3 | MEDIUM | Read the function and count contiguous doc/comment lines immediately preceding it vs body lines; skip tiny functions (<3 code lines) | `flag-only` |
| Verbosity ratio >2 | MEDIUM | Count comments vs code inside one function/class; ignore license/API docs and generated declarations | `flag-only` |
| Dead code after terminator | MEDIUM | AST/control-flow: statements after `return`, `throw`, `break`, `continue`; verify no label/fallthrough semantics | `flag-only` |
| Over-engineering | MEDIUM | Use codegraph/files: file/export ratio >20, lines/export >500, depth >4 without module boundary | `flag-only` |
| Buzzword inflation | MEDIUM | Search claims `production-ready`, `production-grade`, `enterprise-grade`, `secure`, `scalable`, `highly available`; require fewer than 2 concrete evidence hits | `flag-only` |
| Infrastructure without implementation | MEDIUM | Find setup names ending `Client/Connection/Pool/Service/Provider/Manager/Factory/Repository/Gateway/Queue/Cache/Store`; codegraph callers/callees or search shows no use outside setup/export | `flag-only` |
| Stub return values | MEDIUM | Function body has exactly one significant return of placeholder value and optional comments | `flag-only` |
| Commented-out code block | MEDIUM | ≥5 consecutive comment lines matching code-like tokens | `remove-block` only when isolated and verifier passes; otherwise `flag-only` |

## LOW Optional CLI Signals

| Pattern | Certainty | Detection recipe | Autofix strategy |
|---|---:|---|---|
| Duplicate code | LOW | Run existing `jscpd` only if present; parse duplicated blocks | `flag-only` |
| Dependency cycles | LOW | Run existing `madge` only if present | `flag-only` |
| Existing JS lint findings | LOW | Run repo-local `eslint` script/config only if already present | `flag-only` |
| Existing Rust lint findings | LOW | Run `cargo clippy` only when Rust project already uses it or user asks | `flag-only` |
| Existing Go lint findings | LOW | Run `golangci-lint` only if repo config/binary exists | `flag-only` |
| High complexity | LOW | Existing complexity tool only; threshold >10 cyclomatic flags, >20 severe | `flag-only` |

## Autofix Strategy Semantics

| Strategy | Allowed change | Never do |
|---|---|---|
| `remove-line` | Delete a standalone debug/log/trace line or isolated whitespace-only artifact | Delete a call expression whose return value or side effect is used |
| `replace-whitespace` | Strip trailing spaces; normalize mixed indentation line-by-line | Reformat unrelated code |
| `add-comment` | Add a short intentional-ignore comment to an already-empty handler when surrounding code proves the swallow is intended | Invent logging, swallow more errors, or hide unknown intent |
| `remove-block` | Delete isolated commented-out code or unreachable placeholder block proven disconnected from public behavior | Delete live API stubs or exported symbols |
| `flag-only` | Report exact evidence and recommended human action | Apply an edit |

## Report Shape

Use this compact shape for handoff:

```text
HIGH applied:
- path:line pattern strategy

HIGH flagged:
- path:line pattern reason

MEDIUM manual inspection:
- path:line pattern evidence

LOW advisory:
- tool pattern evidence

Verification:
- command: <repo verifier>
- result: pass|fail
- rollback: none|git restore -- <file...>
```
