# Parallel Dep-Audit Tooling

| Family | CVE scanner | Secrets / history | SBOM |
|---|---|---|---|
| Rust | `cargo audit`, `cargo deny check advisories` | `gitleaks`, `trufflehog` | `cargo cyclonedx`, `syft` |
| Python | `pip-audit`, `safety check` | `gitleaks`, `detect-secrets` | `cyclonedx-py`, `syft` |
| JavaScript/TypeScript | `npm audit`, `pnpm audit`, `bun audit` | `gitleaks`, `trufflehog` | `cyclonedx-bom`, `syft` |
| Go | `govulncheck`, `nancy` | `gitleaks`, `trufflehog` | `cyclonedx-gomod`, `syft` |
| Java/Kotlin | OWASP Dependency-Check, `gradle dependencyCheckAnalyze` | `gitleaks`, `trufflehog` | CycloneDX Gradle/Maven, `syft` |
| OCaml | `opam audit`, opam-repository advisory feed | `gitleaks`, `detect-secrets` | `syft` (filesystem) |
