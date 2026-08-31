# Slop catalog

Use this catalog to classify findings before editing. `HIGH` means deterministic presence; it does **not** always mean auto-removable. Autofix strategies are constrained to `remove-line`, `add-comment`, `remove-block`, `replace-whitespace`, or `flag-only`.

Categories are behavioral, not per-language: one category names a runtime behavior, and its table lists the instance each language surfaces. Read a category top-to-bottom to see how the same defect looks across the stack; read a single row when you already know the language in front of you.

## Category index

CWE anchors are optional cross-walk metadata for tools that key on them (Semgrep, CodeQL, Sonar, SARIF `taxa`). They do not change certainty or autofix strategy. `—` means no CWE fits; do not invent one. All 19 categories live in one table under [Slop categories](#slop-categories); filter on the Category column for the rows below.

| Category | Rows | CWE anchor |
|---|---:|---|
| Debug output | 11 | CWE-489 Active Debug Code; CWE-215 Sensitive Info in Debugging Code |
| Placeholder or unimplemented body | 19 | CWE-1071 Empty Code Block; CWE-546 Suspicious Comment (TODO-marked only) |
| Swallowed failure | 14 | CWE-1069 Empty Exception Block; CWE-390 Error Condition Without Action; CWE-391 Unchecked Error Condition; CWE-396 Catch of Generic Exception |
| Crash-on-failure shortcut | 5 | - (no CWE anchor; this category is ours) |
| Stub return value | 6 | - |
| Hardcoded credential | 7 | CWE-798 Hard-coded Credentials; CWE-259 Password; CWE-321 Cryptographic Key |
| Placeholder text | 1 | - |
| Whitespace artifact | 2 | - |
| Mutable global state | 2 | - |
| Missing safety justification | 1 | - |
| Suppression escape | 1 | - |
| Privilege and supply-chain hazard | 2 | - |
| Dead or unreachable code | 2 | CWE-561 Dead Code (parent CWE-1164 Irrelevant Code) |
| Commented-out code | 1 | - (CWE-546 covers TODO-style comments, not commented-out code) |
| Comment bloat | 4 | - |
| Over-engineering | 1 | - |
| Unsubstantiated capability claim | 1 | - |
| Infrastructure without implementation | 1 | - |
| Residual: external tool signals | 6 | - |

Supporting sections: [Global exclusions](#global-exclusions) · [Certainty rules](#certainty-rules) · [Slop categories](#slop-categories) · [Autofix strategy semantics](#autofix-strategy-semantics) · [Report shape](#report-shape).

## Global exclusions

Exclude these from automatic fixes: tests, fixtures, mocks, examples, generated code, vendored code, lockfiles, minified bundles, build output, coverage output, and Markdown whitespace.

Common exclude selectors:

```text
**/test/** **/tests/** **/__tests__/** *.test.* *.spec.* *_test.* *Test.java
**/fixtures/** **/mocks/** **/testdata/** **/examples/** **/benches/**
dist/** build/** target/** coverage/** vendor/** node_modules/** *.min.* *.lock
*.generated.* *.pb.* openapi/** generated/**
```

## Certainty rules

| Certainty | Rule | Edit policy |
|---|---|---|
| HIGH | Direct regex/AST pattern; file is in production scope; match identifies a concrete leftover | Auto-fix only when strategy is mechanical and behavior-preserving |
| MEDIUM | Requires control-flow, codegraph, ratio, or cross-file reasoning | Report only |
| LOW | Optional external CLI heuristic or noisy smell | Report only |

## Slop categories

One table across all 19 categories. Read a category's rows top-to-bottom to see how the same defect looks across the stack; filter by Language when you already know what's in front of you. `Any` means the category is keyed to something other than a language (a provider secret shape, a codegraph ratio, an external tool) and applies across the whole file set regardless of source language.

| Category | Language | Instance | Certainty | Detection recipe | Autofix strategy |
|---|---|---|---:|---|---|
| Debug output | JavaScript / TypeScript | Debug console output | HIGH | `ast-grep pat="console.log($$$ARGS)"`; `ast-grep pat="console.debug($$$ARGS)"`; exclude CLIs/scripts/entrypoints/tests | `remove-line` when expression statement is standalone |
| Debug output | Python | Debug print / breakpoint | HIGH | `search pattern="\\b(print\\(|breakpoint\\(|import pdb|import ipdb)" paths=["**/*.py"]` excluding tests/conftest/CLI output scripts | `remove-line` for standalone debug lines |
| Debug output | Rust | Debug macros | HIGH | `search pattern="(println!|dbg!|eprintln!)\\(" paths=["**/*.rs"]` excluding tests/examples/benches and binaries that intentionally print | `remove-line` for standalone debug macros |
| Debug output | Go | Debug `fmt.Print*` | HIGH | `search pattern="fmt\\.(Print|Println|Printf)\\(" paths=["**/*.go"]`; require debug label or non-CLI/non-main context | `remove-line` when standalone |
| Debug output | Java | `System.out/err.println` | HIGH | `search pattern="System\\.(out|err)\\.println\\(" paths=["**/*.java"]` excluding CLI/main/tests | `remove-line` when standalone debug output |
| Debug output | C / C++ | Debug prints | HIGH | `search pattern="(printf|fprintf|std::cout|std::cerr).*(DEBUG|TRACE|HERE|TODO)" paths=["**/*.{c,h,cpp,cc,cxx,hpp,hxx}"]` | `remove-line` when standalone |
| Debug output | Shell | Debug tracing | HIGH | `search pattern="^\\s*set\\s+-[xv]\\b" paths=["**/*.{sh,bash,zsh}"]` excluding test scripts | `remove-line` |
| Debug output | C# | `Console.WriteLine` / `Debug.WriteLine` | HIGH | `search pattern="(Console|Debug|Trace)\\.Write(Line)?\\(" paths=["**/*.cs"]` excluding console entrypoints/tests | `remove-line` when standalone |
| Debug output | Ruby | `puts` / `p` / debugger entry | HIGH | `search pattern="^\\s*(puts|p|pp)\\s|binding\\.(pry|irb)|byebug" paths=["**/*.rb"]` excluding rake tasks/CLI/tests | `remove-line` for standalone debug lines |
| Debug output | PHP | Dump helpers | HIGH | `search pattern="\\b(var_dump|print_r|dd|dump|error_log)\\s*\\(" paths=["**/*.php"]` excluding CLI scripts/tests | `remove-line` when standalone |
| Debug output | Swift | `print` / `debugPrint` | HIGH | `search pattern="\\b(print|debugPrint|dump)\\s*\\(" paths=["**/*.swift"]` excluding CLI targets/tests | `remove-line` when standalone |
| Placeholder or unimplemented body | JavaScript / TypeScript | Placeholder throw | HIGH | `search pattern="throw\\s+new\\s+Error\\s*\\(\\s*['\"].*(TODO|implement|not\\s+impl)" paths=["**/*.{js,jsx,ts,tsx,mjs,cjs}"]` | `flag-only`; implementation missing |
| Placeholder or unimplemented body | JavaScript / TypeScript | Empty function body | HIGH | `ast-grep pat="function $NAME($$$ARGS) { }"`; also check arrow bodies `($$$ARGS) => { }` | `flag-only`; public surface may depend on it |
| Placeholder or unimplemented body | Python | `raise NotImplementedError` | HIGH | `search pattern="raise\\s+NotImplementedError" paths=["**/*.py"]` | `flag-only` |
| Placeholder or unimplemented body | Python | Function body only `pass` | HIGH | `ast-grep pat="def $NAME($$$ARGS): pass"` or regex fallback `def\s+\w+\s*\([^)]*\)\s*:\s*(pass|\n\s+pass)\s*$` | `flag-only`; implementation missing |
| Placeholder or unimplemented body | Python | Function body only ellipsis | HIGH | `search pattern="def\\s+\\w+\\s*\\([^)]*\\)\\s*:\\s*(\\.\\.\\.|\\n\\s+\\.\\.\\.)\\s*$"` excluding `.pyi` | `flag-only` |
| Placeholder or unimplemented body | Rust | `todo!()` / `unimplemented!()` | HIGH | `ast-grep pat="todo!($$$ARGS)"`; `ast-grep pat="unimplemented!($$$ARGS)"`; regex fallback `\b(todo|unimplemented)!\s*\(` | `flag-only` |
| Placeholder or unimplemented body | Rust | `panic!("TODO")` placeholder | HIGH | `search pattern="\\bpanic!\\s*\\(\\s*['\"].*(TODO|implement)" paths=["**/*.rs"]` | `flag-only` |
| Placeholder or unimplemented body | Go | `panic("TODO")` | HIGH | `search pattern="panic\\s*\\(\\s*['\"].*(TODO|implement|not\\s+impl)" paths=["**/*.go"]` | `flag-only` |
| Placeholder or unimplemented body | Go | Empty TODO function | HIGH | AST/read body: function contains only comments with TODO/FIXME/STUB or no statements | `flag-only` |
| Placeholder or unimplemented body | Java | `UnsupportedOperationException` placeholder | HIGH | `ast-grep pat="throw new UnsupportedOperationException($$$ARGS)" paths=["**/*.java"]` | `flag-only` |
| Placeholder or unimplemented body | Java / Kotlin | TODO throw | HIGH | `search pattern="(RuntimeException|IllegalStateException|NotImplementedException)\\s*\\(.*(TODO|not implemented)" paths=["**/*.{java,kt,kts}"]` | `flag-only` |
| Placeholder or unimplemented body | Kotlin | `TODO()` | HIGH | `search pattern="\\bTODO\\s*\\(" paths=["**/*.{kt,kts}"]` | `flag-only` |
| Placeholder or unimplemented body | Java | `return null; // TODO` | HIGH | `search pattern="return\\s+null\\s*;\\s*//.*(TODO|FIXME|STUB)" paths=["**/*.java"]` | `flag-only` |
| Placeholder or unimplemented body | C / C++ | Not implemented | HIGH | `search pattern="assert\\s*\\(\\s*false.*(TODO|not implemented)|throw\\s+.*(runtime_error|logic_error).*not implemented"` | `flag-only` |
| Placeholder or unimplemented body | Shell | Placeholder function | HIGH | search function bodies containing only `:`/`true` plus TODO/not implemented comment | `flag-only` |
| Placeholder or unimplemented body | C# | `NotImplementedException` | HIGH | `search pattern="throw\\s+new\\s+NotImplementedException\\s*\\(" paths=["**/*.cs"]` | `flag-only` |
| Placeholder or unimplemented body | Ruby | `NotImplementedError` / empty method | HIGH | `search pattern="raise\\s+NotImplementedError|def\\s+\\w+[!?]?\\s*(\\([^)]*\\))?\\s*\\n\\s*end" paths=["**/*.rb"]` | `flag-only` |
| Placeholder or unimplemented body | PHP | TODO throw | HIGH | `search pattern="throw\\s+new\\s+\\\\?(RuntimeException|LogicException|BadMethodCallException)\\s*\\(.*(TODO|not implemented)" paths=["**/*.php"]` | `flag-only` |
| Placeholder or unimplemented body | Swift | `fatalError` placeholder | HIGH | `search pattern="fatalError\\s*\\(\\s*\"[^\"]*(TODO|unimplemented|not implemented)" paths=["**/*.swift"]` | `flag-only` |
| Swallowed failure | JavaScript / TypeScript | Empty catch | HIGH | `ast-grep pat="try { $$$BODY } catch ($E) { }"` or `search pattern="catch\\s*(\\([^)]*\\))?\\s*\\{\\s*\\}"` | `add-comment` only if intentional swallow is proven; otherwise `flag-only` |
| Swallowed failure | Python | Empty `except: pass` | HIGH | `search pattern="except\\s*[^:]*:\\s*pass\\s*$" paths=["**/*.py"]` | `add-comment` only when intentional; otherwise `flag-only` |
| Swallowed failure | Python | Bare `except:` | MEDIUM | `search pattern="^\\s*except\\s*:"` | `flag-only` |
| Swallowed failure | Rust | Empty error match arm | HIGH | `search pattern="Err\\s*\\([^)]*\\)\\s*=>\\s*\\{\\s*\\}" paths=["**/*.rs"]` | `flag-only` unless surrounding invariant proves intentional |
| Swallowed failure | Go | Empty error branch | HIGH | `search pattern="if\\s+err\\s*!=\\s*nil\\s*\\{\\s*\\}" paths=["**/*.go"]` | `flag-only` unless intended ignore is proven, then `add-comment` |
| Swallowed failure | Go | Discarded error | MEDIUM | `search pattern="_\\s*=\\s*.*\\("`; verify callee returns error | `flag-only` |
| Swallowed failure | Java / Kotlin | Empty catch | HIGH | `search pattern="catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}" paths=["**/*.{java,kt,kts}"]` | `add-comment` only if intentional; otherwise `flag-only` |
| Swallowed failure | Java | `printStackTrace()` | HIGH | `search pattern="\\.printStackTrace\\s*\\(" paths=["**/*.java"]` | `flag-only`; replace with project logger manually |
| Swallowed failure | C++ | Empty catch | HIGH | `search pattern="catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}" paths=["**/*.{cpp,cc,cxx,hpp,hxx}"]` | `add-comment` only if intentional; otherwise `flag-only` |
| Swallowed failure | Shell | Empty trap | HIGH | `search pattern="trap\\s+['\"]\\s*['\"]" paths=["**/*.{sh,bash,zsh}"]` | `flag-only` |
| Swallowed failure | C# | Empty / generic catch | HIGH | `search pattern="catch\\s*(\\(\\s*(System\\.)?Exception[^)]*\\))?\\s*\\{\\s*\\}" paths=["**/*.cs"]` | `add-comment` only if intentional; otherwise `flag-only` |
| Swallowed failure | Ruby | Empty or nil-swallowing rescue | HIGH | `search pattern="rescue[^\\n]*\\n\\s*end|rescue\\s+nil\\s*$" paths=["**/*.rb"]` | `add-comment` only if intentional; otherwise `flag-only` |
| Swallowed failure | PHP | Empty catch | HIGH | `search pattern="catch\\s*\\(\\s*\\\\?[A-Za-z_\\\\]+\\s+\\$\\w+\\s*\\)\\s*\\{\\s*\\}" paths=["**/*.php"]` | `add-comment` only if intentional; otherwise `flag-only` |
| Swallowed failure | Swift | Empty catch / discarded `try?` | HIGH | `search pattern="catch\\s*\\{\\s*\\}|^\\s*_\\s*=\\s*try\\?" paths=["**/*.swift"]` | `add-comment` only if intentional; otherwise `flag-only` |
| Crash-on-failure shortcut | Rust | Bare `.unwrap()` | HIGH | `ast-grep pat="$X.unwrap()"`; regex fallback `search pattern="\\.unwrap\\(\\s*\\)"` then ignore `unwrap_or*`/method-chain false positives by inspection; exclude tests/examples/benches | `flag-only`; requires error-path design |
| Crash-on-failure shortcut | Rust | Bare `.expect(...)` | HIGH | `ast-grep pat="$X.expect($MSG)"`; exclude tests/examples/benches | `flag-only`; requires error-path design |
| Crash-on-failure shortcut | Go | Unchecked type assertion | HIGH | `search pattern="\\.\\([A-Za-z_][A-Za-z0-9_]*\\)"`; inspect for missing comma-ok form | `flag-only` |
| Crash-on-failure shortcut | Go | Panic for recoverable error | MEDIUM | `search pattern="panic\\("` outside init/test/main invariant code | `flag-only` |
| Crash-on-failure shortcut | Swift | Force unwrap / forced cast | HIGH | `search pattern="try!\\s|\\bas!\\s|\\w\\!\\." paths=["**/*.swift"]` excluding tests; inspect for optional-binding alternative | `flag-only`; requires error-path design |
| Stub return value | JavaScript / TypeScript | Stub return only | MEDIUM | `ast-grep pat="function $NAME($$$ARGS) { return $VALUE; }"`; the semicolon-less variant `ast-grep pat="function $NAME($$$ARGS) { return $VALUE }"` catches the same shape; check `$VALUE` in `0/null/undefined/true/false/[]/{}/""` and no other significant statements | `flag-only` |
| Stub return value | C / C++ | Stub return only | MEDIUM | `ast-grep pat="$RET $NAME($$$ARGS) { return $VALUE; }"`; use this form, not the JavaScript `function ...` one: that pattern parses in C++ but binds `function` as the return *type*, so it only matches functions literally returning a type named `function` | `flag-only` |
| Stub return value | Python | Stub return only | MEDIUM | inspect `def` body with one significant line returning `None/0/True/False/[]/{}/""` | `flag-only` |
| Stub return value | Rust | Stub return only | MEDIUM | function body only returns `None/0/true/false/String::new()/Vec::new()/vec![]/()/""/Default::default()` | `flag-only` |
| Stub return value | Go | Stub return only | MEDIUM | function body only returns `nil/0/""/false/true/[]T{}/map[...]T{}/&T{}` | `flag-only` |
| Stub return value | Any | Stub return values | MEDIUM | Function body has exactly one significant return of placeholder value and optional comments | `flag-only` |
| Hardcoded credential | Any | Hardcoded OpenAI-style key | HIGH | `search pattern="sk-[A-Za-z0-9]{32,}"` | `flag-only`: require rotation + env/config replacement |
| Hardcoded credential | Any | Hardcoded GitHub token | HIGH | `search pattern="ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}|ghu_[A-Za-z0-9]{36}|ghs_[A-Za-z0-9]{36}|ghr_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{80,}"` | `flag-only`: require rotation |
| Hardcoded credential | Any | Hardcoded AWS access key / secret | HIGH | `search pattern="AKIA[0-9A-Z]{16}|aws_secret_access_key\\s*[:=]\\s*['\"][A-Za-z0-9/+=]{40}['\"]"` | `flag-only`: require rotation |
| Hardcoded credential | Any | Bearer token literal | HIGH | `search pattern="Bearer [A-Za-z0-9._~+/-]{20,}"` | `flag-only`: require rotation |
| Hardcoded credential | Any | JWT-looking token | HIGH | `search pattern="eyJ[A-Za-z0-9_-]{10,}\\.eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}"` | `flag-only`: require rotation |
| Hardcoded credential | Any | Private key block | HIGH | `search pattern="-----BEGIN (RSA )?PRIVATE KEY-----"` | `flag-only`: require rotation/revocation |
| Hardcoded credential | Any | Generic secret assignment | HIGH | `search pattern="(password|secret|api[_-]?key|token|credential|auth)[_-]?(key|token|secret|pass)?\\s*[:=]\\s*['\"][^'\"\\s]{8,}['\"]"` excluding test/mock/example/masked values | `flag-only` |
| Placeholder text | Any | Placeholder text | HIGH | `search pattern="(lorem ipsum|test test test|asdf asdf|foo bar baz|replace (this|me)|todo:?\\s+implement|this is a placeholder)"` in code comments/strings, excluding docs and fixtures | `flag-only` unless isolated comment can be removed |
| Whitespace artifact | Any | Trailing whitespace outside Markdown | HIGH | `search pattern="[ \\t]+$" paths=[source globs excluding *.md]` | `replace-whitespace`: strip suffix only |
| Whitespace artifact | Any | Mixed indentation on one line | HIGH | `search pattern="^\\t+ +|^ +\\t+" paths=[source globs excluding Makefile, *.mk]` | `replace-whitespace`: normalize to file-dominant indent |
| Mutable global state | JavaScript / TypeScript | Mutable all-caps global | MEDIUM | `search pattern="^(let|var)\\s+[A-Z][A-Z0-9_]*\\s*="` excluding config/tests/constants | `flag-only` |
| Mutable global state | Python | Mutable all-caps global collection | MEDIUM | `search pattern="^[A-Z][A-Z0-9_]*\\s*=\\s*(\\[|\\{|dict\\(|list\\(|set\\()"` excluding settings/constants/tests | `flag-only` |
| Missing safety justification | Rust | Unsafe block without safety comment | MEDIUM | `search pattern="unsafe\\s*\\{"` then inspect adjacent lines for `SAFETY:` | `flag-only` |
| Suppression escape | Java | Raw generics / suppress annotations | LOW | existing linter or search for `@SuppressWarnings` / raw generic declarations | `flag-only` |
| Privilege and supply-chain hazard | Shell | `chmod 777` | HIGH | `search pattern="chmod\\s+777"` | `flag-only`; requires permission design |
| Privilege and supply-chain hazard | Shell | Curl pipe shell | HIGH | `search pattern="curl .*\\|\\s*(sh|bash)|wget .*\\|\\s*(sh|bash)"` | `flag-only`; security remediation |
| Dead or unreachable code | JavaScript / TypeScript | Dead code after return/throw | MEDIUM | AST/control-flow scan for statements after terminating statement in same block | `flag-only` |
| Dead or unreachable code | Any | Dead code after terminator | MEDIUM | AST/control-flow: statements after `return`, `throw`, `break`, `continue`; verify no label/fallthrough semantics | `flag-only` |
| Commented-out code | Any | Commented-out code block | MEDIUM | ≥5 consecutive comment lines matching code-like tokens | `remove-block` only when isolated and verifier passes; otherwise `flag-only` |
| Comment bloat | JavaScript / TypeScript | Doc-to-code ratio >3 | MEDIUM | Compare JSDoc block line count to function body lines for functions with ≥3 code lines | `flag-only` |
| Comment bloat | JavaScript / TypeScript | Verbose comments ratio >2 | MEDIUM | Count inline/comment lines vs code lines inside functions | `flag-only` |
| Comment bloat | Any | Doc-to-code ratio >3 | MEDIUM | Read the function and count contiguous doc/comment lines immediately preceding it vs body lines; skip tiny functions (<3 code lines) | `flag-only` |
| Comment bloat | Any | Verbosity ratio >2 | MEDIUM | Count comments vs code inside one function/class; ignore license/API docs and generated declarations | `flag-only` |
| Over-engineering | Any | Over-engineering | MEDIUM | Use codegraph/files: file/export ratio >20, lines/export >500, depth >4 without module boundary | `flag-only` |
| Unsubstantiated capability claim | Any | Buzzword inflation | MEDIUM | Search claims `production-ready`, `production-grade`, `enterprise-grade`, `secure`, `scalable`, `highly available`; require fewer than 2 concrete evidence hits | `flag-only` |
| Infrastructure without implementation | Any | Infrastructure without implementation | MEDIUM | Find setup names ending `Client/Connection/Pool/Service/Provider/Manager/Factory/Repository/Gateway/Queue/Cache/Store`; codegraph callers/callees or search shows no use outside setup/export. Where the language has a `new`-expression an AST match is more precise, but it needs **both** forms: the assignment form `ast-grep pat="$NAME = new $TYPE($$$ARGS)"` matches only bare assignments (`client = new Client()`, `this.store = new Store()`) and silently misses the far more common declaration, so pair it with the declaration form for the language: `var`/`let`/`const $NAME = new $TYPE($$$ARGS)` as three separate runs (JavaScript/TypeScript; the keyword is literal, so one run per keyword), and `$TYPE $NAME = new $CTOR($$$ARGS)` (Java, C++, C#; in C# this also covers `var` declarations, since `var` is itself a type identifier). Verified matching in JavaScript/TypeScript, Java, C++, and C#; Go and Python have no `new`-expression, so use codegraph or the name search there | `flag-only` |
| Residual: external tool signals | Any | Duplicate code | LOW | Run existing `jscpd` only if present; parse duplicated blocks | `flag-only` |
| Residual: external tool signals | JavaScript / TypeScript | Dependency cycles | LOW | Run existing `madge` only if present | `flag-only` |
| Residual: external tool signals | JavaScript / TypeScript | Existing lint findings | LOW | Run repo-local `eslint` script/config only if already present | `flag-only` |
| Residual: external tool signals | Rust | Existing lint findings | LOW | Run `cargo clippy` only when Rust project already uses it or user asks | `flag-only` |
| Residual: external tool signals | Go | Existing lint findings | LOW | Run `golangci-lint` only if repo config/binary exists | `flag-only` |
| Residual: external tool signals | Any | High complexity | LOW | Existing complexity tool only; threshold >10 cyclomatic flags, >20 severe | `flag-only` |

## Autofix strategy semantics

| Strategy | Allowed change | Never do |
|---|---|---|
| `remove-line` | Delete a standalone debug/log/trace line or isolated whitespace-only artifact | Delete a call expression whose return value or side effect is used |
| `replace-whitespace` | Strip trailing spaces; normalize mixed indentation line-by-line | Reformat unrelated code |
| `add-comment` | Add a short intentional-ignore comment to an already-empty handler when surrounding code proves the swallow is intended | Invent logging, swallow more errors, or hide unknown intent |
| `remove-block` | Delete isolated commented-out code or unreachable placeholder block proven disconnected from public behavior | Delete live API stubs or exported symbols |
| `flag-only` | Report exact evidence and recommended human action | Apply an edit |

## Report shape

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
