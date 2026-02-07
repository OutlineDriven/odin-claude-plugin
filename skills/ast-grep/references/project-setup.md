# Project Setup & Testing

To use ast-grep for linting or scanning a codebase efficiently, you should set up a project structure.

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
utilsDirs:
  - utils

# Configuration for tests
testConfigs:
  - testDir: rule-tests
```

## Testing Rules

Testing is crucial for ensuring rules match what you expect and don't produce false positives (noisy matches) or false negatives (missing matches).

### Test File Structure

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

### Running Tests

```bash
# Run all tests
ast-grep test

# Update snapshots (for error messages/fixes)
ast-grep test -U

# Interactive mode
ast-grep test -i
```

### Snapshots

When you run tests with `-U`, ast-grep creates a `__snapshots__` directory. This stores the expected output (error messages, fix replacements) for your invalid cases. This ensures that not only does the rule trigger, but it produces the correct diagnostic/fix.
