---
name: contexts
description: AST-first codebase analysis using ast-grep. Extracts structural patterns, dependencies, and architectural insights across 24 supported languages through systematic AST traversal.
---

# Codebase Context Analysis Skill

## Capability

This skill provides comprehensive codebase analysis using AST-based extraction with ast-grep. It generates LLM-optimized context summaries that fit within agent context windows while providing actionable structural insights.

- **Language Detection**: Auto-detect and classify languages (24 supported)
- **AST Extraction**: Extract functions, classes, types, imports, exports
- **Dependency Mapping**: Build import graphs and module relationships
- **Pattern Detection**: Identify async patterns, error handling, test coverage
- **LLM-Optimized Output**: Compact format designed for agent consumption

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
  Language detection
  File enumeration
  Scope assessment (tokei)
] -> [Phase 2: EXTRACT]
[Phase 2: EXTRACT|
  AST pattern execution
  Multi-language batching
  Result collection
] -> [Phase 3: OUTPUT]
[Phase 3: OUTPUT|
  LLM-optimized format
  Context-window aware
  Return compact context
] -> [<end>Context Ready]
```

---

## Phase 1: SCAN (Language and Scope Detection)

### Process

1. **Assess Scope**
   ```bash
   tokei $PATH --output json | jq '.Total'
   ```

2. **Enumerate Files by Language**
   ```bash
   fd -e ts -e tsx -e js -e jsx $PATH   # Script family
   fd -e py $PATH                        # Python
   fd -e rs $PATH                        # Rust
   fd -e go $PATH                        # Go
   fd -e java -e kt $PATH                # JVM family
   fd -e c -e cpp -e h -e hpp $PATH      # C family
   ```

3. **Classify Languages Present**
   - Count files per language family
   - Determine primary language
   - Select appropriate AST patterns

### Language Family Matrix

| Family | Languages | Extensions |
|--------|-----------|------------|
| Script | TypeScript, JavaScript, TSX, JSX | `.ts`, `.tsx`, `.js`, `.jsx` |
| Python | Python | `.py` |
| Rust | Rust | `.rs` |
| Go | Go | `.go` |
| JVM | Java, Kotlin | `.java`, `.kt` |
| C-Family | C, C++, C# | `.c`, `.cpp`, `.h`, `.cs` |

---

## Phase 2: EXTRACT (AST Pattern Execution)

### Process

1. **Select Patterns by Language Family**
2. **Execute ast-grep via MCP Tools**
3. **Aggregate Results Across Files**

### Thinking Tool Integration

```
Use sequential-thinking for:
- Planning extraction order
- Prioritizing patterns by importance
- Handling large codebases incrementally

Use actor-critic-thinking for:
- Evaluating extraction completeness
- Challenging pattern coverage
```

### AST Patterns by Category

#### Functions (All Languages)

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

**Java:**
```yaml
id: java-methods
language: java
rule:
  kind: method_declaration
```

#### Classes/Types

**TypeScript:**
```yaml
id: ts-types
language: typescript
rule:
  any:
    - kind: class_declaration
    - kind: interface_declaration
    - kind: type_alias_declaration
    - kind: enum_declaration
```

**Python:**
```yaml
id: py-classes
language: python
rule:
  kind: class_definition
```

**Rust:**
```yaml
id: rust-types
language: rust
rule:
  any:
    - kind: struct_item
    - kind: enum_item
    - kind: trait_item
    - kind: impl_item
```

**Go:**
```yaml
id: go-types
language: go
rule:
  kind: type_declaration
```

#### Imports/Dependencies

**TypeScript:**
```yaml
id: ts-imports
language: typescript
rule:
  any:
    - kind: import_statement
    - pattern: "import { $$$ } from '$SOURCE'"
    - pattern: "import $NAME from '$SOURCE'"
```

**Python:**
```yaml
id: py-imports
language: python
rule:
  any:
    - kind: import_statement
    - kind: import_from_statement
```

**Rust:**
```yaml
id: rust-imports
language: rust
rule:
  kind: use_declaration
```

**Go:**
```yaml
id: go-imports
language: go
rule:
  kind: import_spec
```

#### Exports

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

### MCP Tool Commands

```bash
# Find functions in TypeScript
mcp__ast-grep__find_code_by_rule(yaml="id: x\nlanguage: typescript\nrule:\n  kind: function_declaration", project_folder=$PATH)

# Find classes in Python
mcp__ast-grep__find_code_by_rule(yaml="id: x\nlanguage: python\nrule:\n  kind: class_definition", project_folder=$PATH)

# Find structs in Rust
mcp__ast-grep__find_code(pattern="struct $NAME { $$$ }", project_folder=$PATH, language="rust")

# Debug AST structure
mcp__ast-grep__dump_syntax_tree(code=$CODE, language=$LANG, format="cst")
```

---

## Phase 3: OUTPUT (LLM-Optimized Context)

### Output Format

The output uses a compact XML-like format designed to maximize information density while remaining parseable:

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

| Level | Description | Use Case |
|-------|-------------|----------|
| `overview` | Languages, LOC, entry points, module structure, key patterns | Quick orientation, integration with /plan |
| `detailed` | + All functions/classes/types, dependencies, API surface | Deep exploration, architecture understanding |

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

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Analysis complete | Context ready for use |
| 11 | No code files found | Check path argument |
| 12 | All files failed parsing | Check language support |
| 13 | ast-grep not available | Install ast-grep MCP server |
| 14 | Path not found | Verify path exists |

---

## Language Support Matrix (24 Languages)

| Language | AST Support | Pattern Quality |
|----------|-------------|-----------------|
| TypeScript | Full | Excellent |
| JavaScript | Full | Excellent |
| Python | Full | Excellent |
| Rust | Full | Excellent |
| Go | Full | Excellent |
| Java | Full | Good |
| Kotlin | Full | Good |
| C | Full | Good |
| C++ | Full | Good |
| C# | Full | Good |
| Ruby | Full | Good |
| PHP | Full | Good |
| Swift | Full | Good |
| Scala | Full | Good |
| Haskell | Full | Good |
| Elixir | Full | Good |
| Bash | Basic | Fair |
| HTML | Basic | Fair |
| CSS | Basic | Fair |
| JSON | Basic | Fair |
| YAML | Basic | Fair |
| Lua | Full | Good |
| Solidity | Full | Good |
| Nix | Full | Fair |

---

## Best Practices

### 1. Start with Overview

Always start with `--depth=overview` to understand the codebase structure before diving deeper.

### 2. Focus on Specific Areas

Use `--focus` to limit extraction when you only need certain constructs:
```bash
/contexts . --focus=functions   # Only functions
/contexts . --focus=types       # Only types/interfaces
```

### 3. Language Filtering

For polyglot codebases, filter by primary language:
```bash
/contexts . --lang=ts           # TypeScript only
/contexts . --lang=py           # Python only
```

### 4. Incremental Analysis

For large codebases, analyze directories incrementally:
```bash
/contexts src/api/              # API layer
/contexts src/services/         # Service layer
/contexts src/models/           # Data models
```

---

## Troubleshooting Guide

| Symptom | Cause | Resolution |
|---------|-------|------------|
| Exit 11 | No files found | Check path, verify extensions |
| Exit 12 | Parse errors | Check for syntax errors in source |
| Exit 13 | MCP unavailable | Verify ast-grep MCP server running |
| Incomplete results | Large codebase | Use `--focus` to limit scope |
| Missing language | Unsupported | Check language support matrix |
| Slow extraction | Many files | Filter by `--lang` or specific directory |

---

## When NOT to Use

| Scenario | Better Alternative |
|----------|-------------------|
| Single file analysis | Read tool directly |
| Text/comment search | Grep tool |
| Binary file inspection | File type tools |
| Configuration analysis | Read + manual review |
| Already have full context | Skip /contexts |

---

## Complementary Approaches

- **/contexts + /plan**: Context informs implementation planning
- **/contexts + /review**: Context enables thorough code review
- **/contexts + outline-strong**: Context feeds validation layers
- **/contexts + test-driven**: Context maps test coverage locations
