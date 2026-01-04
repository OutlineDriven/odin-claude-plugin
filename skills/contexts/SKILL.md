---
name: contexts
description: Codebase analysis using code-index-mcp for indexing and ast-grep for AST patterns. Extracts structural patterns, dependencies, and architectural insights across 50+ languages.
---

# Codebase Context Analysis Skill

## Capability

This skill provides comprehensive codebase analysis using a dual-tool approach:

- **Primary:** `code-index-mcp` for project indexing, file discovery, and symbol extraction
- **Secondary:** `ast-grep` for detailed AST pattern matching

Generates LLM-optimized context summaries that fit within agent context windows.

- **Project Indexing**: Persistent index for fast queries
- **Symbol Extraction**: Functions, classes, imports via deep index
- **File Discovery**: Glob-based file enumeration
- **AST Patterns**: Precise structural matching (24 languages)
- **LLM-Optimized Output**: Compact format for agent consumption

---

## When to Use

- Before planning implementation to understand existing code
- When exploring unfamiliar codebases
- To identify entry points and module structure
- Before code review to understand context
- To map dependencies and API surface
- When integrating with /plan or /review skills

---

## Workflow Overview

```nomnoml
[<start>User Request] -> [Phase 1: SCAN]
[Phase 1: SCAN|
  code-index: set_project_path
  code-index: find_files
  code-index: build_deep_index
] -> [Phase 2: EXTRACT]
[Phase 2: EXTRACT|
  code-index: get_file_summary
  ast-grep: patterns (detailed)
] -> [Phase 3: OUTPUT]
[Phase 3: OUTPUT|
  LLM-optimized format
  Context-window aware
] -> [<end>Context Ready]
```

---

## Tool Selection

| Depth      | Primary Tool          | Secondary Tool                 |
| ---------- | --------------------- | ------------------------------ |
| `overview` | code-index only       | -                              |
| `detailed` | code-index + ast-grep | ast-grep for specific patterns |

**Decision Tree:**

1. Always start with `set_project_path` + `find_files`
2. For overview: use `get_file_summary` on key files
3. For detailed: `build_deep_index` + ast-grep patterns
4. Fallback to ast-grep only if code-index unavailable

---

## Phase 1: SCAN (Project Indexing)

### Primary Tools (code-index-mcp)

**Initialize Project:**

```
mcp__plugin_odin_code-index__set_project_path(path=$PATH)
```

**Find Files:**

```
mcp__plugin_odin_code-index__find_files(pattern="*.ts")
mcp__plugin_odin_code-index__find_files(pattern="*.py")
mcp__plugin_odin_code-index__find_files(pattern="*.rs")
mcp__plugin_odin_code-index__find_files(pattern="*.go")
```

**Build Deep Index (for detailed analysis):**

```
mcp__plugin_odin_code-index__build_deep_index()
```

Extracts full symbol information across project.

### Process

1. **Initialize Index**
   ```
   set_project_path($PATH)
   ```

2. **Enumerate Files by Language**
   ```
   find_files("*.ts")   # TypeScript
   find_files("*.py")   # Python
   find_files("*.rs")   # Rust
   find_files("*.go")   # Go
   find_files("*.java") # Java
   ```

3. **Count and Classify**
   - Count files per language
   - Determine primary language
   - Select extraction strategy

### Language Family Matrix

| Family   | Languages                        | Extensions                   |
| -------- | -------------------------------- | ---------------------------- |
| Script   | TypeScript, JavaScript, TSX, JSX | `.ts`, `.tsx`, `.js`, `.jsx` |
| Python   | Python                           | `.py`                        |
| Rust     | Rust                             | `.rs`                        |
| Go       | Go                               | `.go`                        |
| JVM      | Java, Kotlin                     | `.java`, `.kt`               |
| C-Family | C, C++, C#                       | `.c`, `.cpp`, `.h`, `.cs`    |

---

## Phase 2: EXTRACT

### Overview Depth (code-index-mcp only)

**File Summary:**

```
mcp__plugin_odin_code-index__get_file_summary(file_path=$FILE)
```

Returns:

- Line count
- Function/class definitions
- Import statements
- Complexity metrics

**Advanced Search:**

```
mcp__plugin_odin_code-index__search_code_advanced(
  pattern="function",
  file_pattern="*.ts",
  max_results=50
)
```

### Detailed Depth (code-index + ast-grep)

For detailed analysis, combine both tools:

1. **Build Deep Index**
   ```
   mcp__plugin_odin_code-index__build_deep_index()
   ```

2. **Get File Summaries**
   ```
   mcp__plugin_odin_code-index__get_file_summary(file_path=$FILE)
   ```

3. **AST Patterns for Specific Constructs**
   Use ast-grep for patterns not covered by code-index:
   - Exports/public API
   - Entry points
   - Decorators/attributes
   - Specific language constructs

### Secondary Tools (ast-grep)

Use for detailed pattern extraction:

**Find by Pattern:**

```
mcp__plugin_odin_ast-grep__find_code(
  pattern="export function $NAME($$$) { $$$ }",
  project_folder=$PATH,
  language="typescript"
)
```

**Find by YAML Rule:**

```
mcp__plugin_odin_ast-grep__find_code_by_rule(
  yaml="id: x\nlanguage: typescript\nrule:\n  kind: function_declaration",
  project_folder=$PATH
)
```

**Debug AST Structure:**

```
mcp__plugin_odin_ast-grep__dump_syntax_tree(
  code=$CODE,
  language=$LANG,
  format="cst"
)
```

### AST Patterns Reference (ast-grep)

#### Functions

**TypeScript/JavaScript:**

```yaml
id: ts-functions
language: typescript
rule:
  any:
    - kind: function_declaration
    - kind: arrow_function
    - kind: method_definition
```

**Python:**

```yaml
id: py-functions
language: python
rule:
  any:
    - kind: function_definition
    - pattern: "async def $NAME($$$): $$$"
```

**Rust:**

```yaml
id: rust-functions
language: rust
rule:
  any:
    - kind: function_item
    - pattern: "pub fn $NAME($$$) -> $RET { $$$ }"
```

**Go:**

```yaml
id: go-functions
language: go
rule:
  any:
    - kind: function_declaration
    - kind: method_declaration
```

#### Exports/Public API

**TypeScript:**

```yaml
id: ts-exports
language: typescript
rule:
  any:
    - pattern: "export function $NAME($$$) { $$$ }"
    - pattern: "export class $NAME { $$$ }"
    - pattern: "export const $NAME = $VALUE"
    - pattern: "export default $EXPR"
```

**Rust:**

```yaml
id: rust-exports
language: rust
rule:
  any:
    - pattern: "pub fn $NAME($$$) { $$$ }"
    - pattern: "pub struct $NAME { $$$ }"
    - pattern: "pub enum $NAME { $$$ }"
```

#### Entry Points

**TypeScript:**

```yaml
id: ts-entry
language: typescript
rule:
  any:
    - pattern: "export default $EXPR"
    - pattern: "module.exports = $EXPR"
```

**Python:**

```yaml
id: py-entry
language: python
rule:
  pattern: 'if __name__ == "__main__": $$$'
```

**Rust:**

```yaml
id: rust-entry
language: rust
rule:
  pattern: "fn main() { $$$ }"
```

**Go:**

```yaml
id: go-entry
language: go
rule:
  pattern: "func main() { $$$ }"
```

---

## Phase 3: OUTPUT (LLM-Optimized Context)

### Output Format

```
<codebase_context path="{path}" depth="{overview|detailed}">
PROJECT: {name} | LANG: {languages} | FILES: {count} | LOC: {loc}

ENTRY: {entry_points}

MODULES:
{module_list with file counts}

PUBLIC_API:
{exported functions/classes/types}

TYPES:
{key type definitions}

DEPS:
{external dependencies}

PATTERNS:
{detected patterns: async, error handling, tests}
</codebase_context>
```

### Overview Output Example

```
<codebase_context path="./src" depth="overview">
PROJECT: my-app | LANG: TypeScript 68%, Python 22%, Go 10% | FILES: 142 | LOC: 24,350

ENTRY: src/index.ts:bootstrap() | src/cli.ts:main()

MODULES:
- api/ (12 files) - HTTP endpoints
- services/ (15 files) - Business logic
- models/ (12 files) - Data types
- utils/ (6 files) - Helpers

PUBLIC_API: 45 exports (UserService, AuthController, CreateUserDto...)

DEPS: @nestjs/core, prisma, zod, class-validator

PATTERNS: async:89 | try-catch:34 | tests:123
</codebase_context>
```

### Detailed Output Example

```
<codebase_context path="./src" depth="detailed">
PROJECT: my-app | LANG: TypeScript | FILES: 45 | LOC: 12,340

FUNCTIONS:
- createUser(dto: CreateUserDto): Promise<User> [src/services/user.ts:45]
- validateToken(token: string): AuthResult [src/auth/auth.ts:23]
- hashPassword(pw: string): string [src/utils/crypto.ts:12]

CLASSES:
- UserService [src/services/user.ts:10] - methods: create, findById, update, delete
- AuthController [src/controllers/auth.ts:5] - endpoints: login, logout, refresh

TYPES:
- User { id, email, name, createdAt } [src/models/user.ts:3]
- CreateUserDto { email, password, name } [src/dto/user.dto.ts:8]

IMPORTS_GRAPH:
- api/* -> services/* -> models/*
- services/* -> utils/*
</codebase_context>
```

---

## Depth Levels

| Level      | Description                                     | Tools Used            |
| ---------- | ----------------------------------------------- | --------------------- |
| `overview` | Languages, LOC, entry points, module structure  | code-index only       |
| `detailed` | + All functions/classes/types, full API surface | code-index + ast-grep |

---

## Command Interface

```bash
/contexts [PATH] [OPTIONS]

Arguments:
  PATH              Target directory (default: .)

Options:
  --depth           overview|detailed (default: overview)
  --focus           functions|classes|types|imports|all (default: all)
  --lang            Filter by language: ts,py,rs,go,java
```

### Usage Examples

```bash
# Quick overview of current directory
/contexts

# Detailed analysis of src directory
/contexts src/ --depth=detailed

# Focus on functions only
/contexts . --focus=functions

# Analyze only TypeScript files
/contexts . --lang=ts

# Detailed analysis of specific module
/contexts src/api/ --depth=detailed
```

---

## Skill Integration (Auto-Invoke)

The `/contexts` skill auto-integrates with other ODIN skills:

### With /plan

```
User: /plan implement user authentication
System: [Auto-runs /contexts . --depth=overview]
Plan receives: codebase structure, existing patterns, entry points
Plan outputs: Informed implementation strategy with context
```

### With /review

```
User: /review src/api/
System: [Auto-runs /contexts src/api/ --depth=detailed]
Review receives: function signatures, types, dependencies
Review outputs: Contextual code review
```

### Integration Protocol

Skills can request context programmatically:

```
INVOKE: /contexts {path} --depth={overview|detailed}
RECEIVE: <codebase_context>...</codebase_context>
```

---

## Exit Codes

| Code | Meaning                           | Action                 |
| ---- | --------------------------------- | ---------------------- |
| 0    | Analysis complete                 | Context ready for use  |
| 11   | No code files found               | Check path argument    |
| 12   | All files failed parsing          | Check language support |
| 13   | code-index/ast-grep not available | Check MCP servers      |
| 14   | Path not found                    | Verify path exists     |

---

## Language Support

### code-index-mcp Deep Parsing (7 Languages)

| Language    | Support            |
| ----------- | ------------------ |
| Python      | Full (tree-sitter) |
| JavaScript  | Full (tree-sitter) |
| TypeScript  | Full (tree-sitter) |
| Java        | Full (tree-sitter) |
| Go          | Full (tree-sitter) |
| Objective-C | Full (tree-sitter) |
| Zig         | Full (tree-sitter) |

### code-index-mcp File Support (50+ Types)

Web (Vue, React, Svelte, HTML, CSS, SCSS), Config (JSON, YAML, XML, Markdown), and more.

### ast-grep AST Support (24 Languages)

TypeScript, JavaScript, Python, Rust, Go, Java, Kotlin, C, C++, C#, Ruby, PHP, Swift, Scala, Haskell, Elixir, Bash, HTML, CSS, JSON, YAML, Lua, Solidity, Nix

---

## Best Practices

### 1. Start with Overview

Always start with `--depth=overview` using code-index for fast results.

### 2. Use Deep Index Sparingly

`build_deep_index()` is thorough but slower. Use for detailed analysis only.

### 3. Combine Tools Strategically

- code-index for: file discovery, structure overview, symbol counts
- ast-grep for: specific patterns, exports, entry points, language constructs

### 4. Incremental Analysis

For large codebases, analyze directories incrementally:

```bash
/contexts src/api/              # API layer
/contexts src/services/         # Service layer
/contexts src/models/           # Data models
```

---

## Troubleshooting Guide

| Symptom            | Cause           | Resolution                                 |
| ------------------ | --------------- | ------------------------------------------ |
| Exit 11            | No files found  | Check path, verify extensions              |
| Exit 12            | Parse errors    | Check for syntax errors in source          |
| Exit 13            | MCP unavailable | Verify code-index and ast-grep MCP servers |
| Incomplete results | Large codebase  | Use `--focus` to limit scope               |
| Slow indexing      | First run       | Subsequent runs use cached index           |

---

## MCP Tool Reference

### code-index-mcp (Primary)

| Tool                   | Purpose                           |
| ---------------------- | --------------------------------- |
| `set_project_path`     | Initialize indexing for directory |
| `find_files`           | Glob-based file discovery         |
| `get_file_summary`     | File structure and complexity     |
| `build_deep_index`     | Full symbol extraction            |
| `search_code_advanced` | Regex/fuzzy code search           |
| `refresh_index`        | Rebuild file index                |

### ast-grep (Secondary)

| Tool                | Purpose              |
| ------------------- | -------------------- |
| `find_code`         | Pattern-based search |
| `find_code_by_rule` | YAML rule search     |
| `dump_syntax_tree`  | Debug AST structure  |

---

## Complementary Approaches

- **/contexts + /plan**: Context informs implementation planning
- **/contexts + /review**: Context enables thorough code review
- **/contexts + outline-strong**: Context feeds validation layers
- **/contexts + test-driven**: Context maps test coverage locations
