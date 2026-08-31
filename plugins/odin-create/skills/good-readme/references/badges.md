# Badges and shields reference

Use badges to show build status, version, license, and key project metadata. Place them directly below the project title and tagline in the README opening.

## Common badge providers

| Provider | URL pattern | Notes |
|----------|-------------|-------|
| shields.io | `https://img.shields.io/...` | Most flexible; supports static and dynamic badges |
| GitHub Actions | `https://github.com/<owner>/<repo>/actions/workflows/<workflow>.yml/badge.svg` | CI build status |
| npm | `https://img.shields.io/npm/v/<package>` | Version |
| PyPI | `https://img.shields.io/pypi/v/<package>` | Version |
| crates.io | `https://img.shields.io/crates/v/<crate>` | Version |

## Badge style guidelines

- Use flat-square or flat style (`style=flat-square`, `style=flat`).
- Use the default color or a semantic color (green for passing, red for failing).
- Keep the badge row to one line; wrap to a second only when more than five badges are proven.
- Omit any badge whose value cannot be derived from project files.

## Common badge patterns

### CI build status

```markdown
![CI](https://github.com/<owner>/<repo>/actions/workflows/ci.yml/badge.svg)
```

### Version

```markdown
![npm version](https://img.shields.io/npm/v/<package>)
```

### License

```markdown
![license](https://img.shields.io/github/license/<owner>/<repo>)
```

### Code coverage

```markdown
![coverage](https://img.shields.io/codecov/c/github/<owner>/<repo>)
```

### Downloads

```markdown
![downloads](https://img.shields.io/npm/dm/<package>)
```
