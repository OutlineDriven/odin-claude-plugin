# CLI Reference

## Common Commands

### `ast-grep run` (default)
Run one-time search or rewrite.
- `-p, --pattern <PAT>`: Search pattern.
- `-r, --rewrite <STR>`: Replacement string.
- `-l, --lang <LANG>`: Language (inferred from ext if omitted).
- `-i, --interactive`: Interactive mode for applying fixes.
- `-U, --update-all`: Apply fixes non-interactively.
- `--json`: Output results as JSON.

### `ast-grep scan`
Scan project using rule files.
- `-c, --config <FILE>`: Path to `sgconfig.yml` (default).
- `-r, --rule <FILE>`: Scan with specific rule file.
- `--inline-rules <YAML>`: Pass rule YAML directly.
- `--report-style <STYLE>`: Output format (rich, medium, short).

### `ast-grep test`
Test rules against test cases.
- `-t, --test-dir <DIR>`: Directory containing test cases.
- `-U, --update-all`: Update snapshots.

### `ast-grep new`
Scaffold new projects or rules.
- `project`: New project structure.
- `rule`: New rule file.
- `test`: New test case.

### `ast-grep lsp`
Start Language Server for editor integration.

## Configuration (`sgconfig.yml`)

Root configuration file for projects.
- `ruleDirs`: Directories containing rules.
- `testConfigs`: Test configuration.
- `utilsDirs`: Directories containing utility rules.
