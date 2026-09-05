# Automation and environments

## Environment management

```
.env.example       → Committed (template for developers)
.env                → NOT committed (local development)
.env.test           → Committed (test environment, no real secrets)
CI secrets          → Stored in GitHub Secrets / vault
Production secrets  → Stored in deployment platform / vault
```

Never give CI production secrets. Use separate secrets for CI testing.

## Automation beyond CI

### Dependabot / Renovate

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
```

### PR checks

- Required reviews: At least 1 approval before merge
- Required status checks: CI must pass before merge
- Branch protection: No force-pushes to main
- Auto-merge: If all checks pass and approved, merge automatically
