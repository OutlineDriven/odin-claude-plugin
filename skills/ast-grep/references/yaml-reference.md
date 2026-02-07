# Configuration Reference (YAML)

Detailed reference for rule configuration fields.

## Basic Information

- **`id`** (Required): Unique identifier string (kebab-case recommended).
- **`language`** (Required): Target language (e.g., `TypeScript`, `Python`, `Rust`).
  - See [Supported Languages](#supported-languages) below.

## Finding & Patching

- **`rule`** (Required): The [Atomic/Relational/Composite rule](rule-config.md) to match.
- **`constraints`**: Filter meta-variables.
- **`transform`**: Transform meta-variables (string operations).
- **`fix`**: Replacement string or object.
- **`rewriters`**: List of rewriter rules for sub-node transformation.

## Linting & Reporting

- **`severity`**: `error`, `warning`, `info`, `hint`, or `off`.
- **`message`**: Concise message explaining the issue. Can use meta-variables (e.g., `Found $VAR`).
- **`note`**: markdown-formatted detailed explanation.
- **`url`**: Link to documentation.
- **`metadata`**: Custom key-value pairs (e.g., CVE ID).

## File Filtering (Globbing)

- **`files`**: Only apply rule to matching files.
- **`ignores`**: Exclude matching files (checked before `files`).

Both accept strings or objects:
```yaml
files:
  - "src/**/*.ts"
  - glob: "*.test.ts"
    caseInsensitive: true
```

## Supported Languages

Common languages and their aliases:

| Language | Aliases |
|----------|---------|
| JavaScript | `js`, `javascript`, `jsx` |
| TypeScript | `ts`, `typescript` |
| TSX | `tsx` |
| Python | `py`, `python` |
| Java | `java` |
| Go | `go`, `golang` |
| Rust | `rs`, `rust` |
| C | `c` |
| C++ | `cpp`, `c++`, `cxx` |
| C# | `cs`, `csharp` |
| Ruby | `rb`, `ruby` |
| PHP | `php` |
| HTML | `html` |
| CSS | `css` |
| JSON | `json` |
| YAML | `yaml`, `yml` |
| Bash | `bash`, `sh` |

Full list available in `ast-grep --help` or official docs.
