# Project setup and testing

Set up a project structure before using ast-grep to lint or scan a codebase.

## Scaffolding

Use the CLI to create a new project:

```bash
ast-grep new project
```

This creates the standard directory structure:

```
project-root/
├── sgconfig.yml         # Root configuration
├── rules/               # Rule definitions (.yml)
├── rule-tests/          # Test cases (.yml)
└── utils/               # Reusable utility rules
```

## Configuration (`sgconfig.yml`)

The `sgconfig.yml` file defines where ast-grep looks for rules and tests.

```yaml
# List of directories containing rule files
ruleDirs:
  - rules

# List of directories containing utility rules
utilDirs:
  - utils

# Configuration for tests
testConfigs:
  - testDir: rule-tests
```

## Testing rules

Test rules to confirm they match what you expect and produce neither false positives (noisy matches) nor false negatives (missing matches).

### Test file structure

Test files (e.g., `rule-tests/my-rule-test.yml`) map test cases to a rule ID.

```yaml
id: my-rule-id # Must match the 'id' in your rule YAML
valid:
  - "const x = 1;" # Code that should NOT trigger the rule
  - "var y = 2;"
invalid:
  - "const x = eval('1');" # Code that SHOULD trigger the rule
  - "eval(foo);"
```

### Running tests

```bash
# Run all tests
ast-grep test

# Update snapshots (for error messages/fixes)
ast-grep test -U

# Interactive mode
ast-grep test -i
```

### Snapshots

When you run tests with `-U`, ast-grep creates a `__snapshots__` directory. This stores the expected output (error messages, fix replacements) for your invalid cases. This checks that the rule triggers and produces the correct diagnostic/fix.
