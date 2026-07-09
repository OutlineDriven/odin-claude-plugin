# Triaging Dependency Audit Results

Not every audit finding needs immediate action. Use this decision tree:

```
the dependency audit reports a vulnerability
├── Severity: critical or high
│   ├── Is the vulnerable code reachable in your app?
│   │   ├── YES --> Fix immediately (update, patch, or replace the dependency)
│   │   └── NO (dev-only dep, unused code path) --> Fix soon, but not a blocker
│   └── Is a fix available?
│       ├── YES --> Update to the patched version
│       └── NO --> Find a workaround, replace the dependency, or allowlist with a review date
├── Severity: moderate
│   ├── Reachable in production? --> Fix in the next release cycle
│   └── Dev-only? --> Fix when convenient, track in backlog
└── Severity: low
    └── Track and fix during regular dependency updates
```

**Key questions:**
- Is the vulnerable function actually called in your code path?
- Is the dependency a runtime dependency or dev-only?
- Is the vulnerability exploitable in your deployment context (e.g. a server-side flaw in a client-only app)?

When you defer a fix, document the reason and set a review date.

## Supply-Chain Hygiene

A vulnerability audit catches known CVEs; it will not catch a malicious or typosquatted package. Also:

- **Commit the lockfile and install reproducibly in CI**: `npm ci`, `pip install --require-hashes`, `cargo build --locked`, or the equivalent for your toolchain. No silent version drift.
- **Review new dependencies before adding them**: maintenance, download counts, and whether they earn their place. Every dependency is attack surface (OWASP **A06: Vulnerable Components**, **LLM03: Supply Chain**).
- **Be wary of install-time scripts** in unfamiliar packages (`postinstall`, `setup.py`, `build.rs`): they run arbitrary code at install time.
- **Watch for typosquats**: `cross-env` vs `crossenv`, `requests` vs `request`, `python-dateutil` vs `dateutil`.
