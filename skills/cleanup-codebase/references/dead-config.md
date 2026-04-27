# Dead config — flags, env vars, branches

Configuration ages worse than code. A feature flag introduced for a migration becomes permanent the moment everyone forgets it exists. An environment variable for a debug mode no one uses ships in production for years. A `if env.staging` branch full of stale logic stays untouched because no one wants to be the person who broke staging.

The fix: while you are in nearby config code, audit. Delete what is dead. The hardest part is *proving* dead — config consumers can be implicit (read by tools, dashboards, infra-as-code, deployment scripts) and grepping the source tree alone is not enough.

## Categories of dead config

### Always-on / always-off feature flags

```python
FEATURES = {
    "new_pricing_engine": True,        # set in 2023, every env enables it
    "legacy_payment_path": False,      # disabled in every env for > 1 year
    "experimental_caching": True,      # experiment ended; this is now the default
}
```

If a flag is unconditional in every environment, the *flag* is dead. Pick the winning branch, inline it, delete the flag. The losing branch becomes deletable dead code (which is also a cleanup-codebase concern).

### Stale environment variables

```bash
export OLD_DB_HOST=...   # replaced by DATABASE_URL three migrations ago
export DEBUG_VERBOSE=1   # disabled, no consumer reads this
```

Search the source tree, the deployment scripts, the IaC (terraform, pulumi, helm), the runbooks, and the dashboards. Only when all are clean is the env var truly dead. **This is the audit point most people skip.**

### Dead config branches

```python
def get_database_url() -> str:
    if config.use_legacy_db:
        return f"postgres://{config.legacy_host}/{config.legacy_db}"
    return config.database_url
```

If `use_legacy_db` is dead (always `False`), the entire legacy branch is dead — including `legacy_host`, `legacy_db`, and any code reachable only through that path. Delete the branch, the flag, and the dependent fields together.

### Dead defaults that never trigger

```rust
#[derive(Deserialize)]
struct Config {
    #[serde(default = "default_timeout")]
    timeout_ms: u64,
    #[serde(default = "default_max_legacy_retries")]
    max_legacy_retries: u32,  // legacy flag, no longer consulted
}

fn default_max_legacy_retries() -> u32 { 3 }
```

The default function and field exist for a setting nothing reads. Delete both.

### Stale infrastructure config

- Terraform module variables with no resource referencing them
- Helm chart values with no template substitution
- Docker `ARG` declarations with no `${…}` interpolation
- CI matrix entries for runners / OSes you no longer ship to

These are config too — and the same audit applies: if no consumer reads it, it does not earn its keep.

## Detection workflow

1. **List all config keys** — `grep`/`ast-grep` over the config file(s) to enumerate every setting.
2. **For each key, find consumers** — search source code, but also: deployment scripts, dashboards (links and queries), runbooks (search the wiki), IaC, monitoring/alerting rules, CI configs.
3. **Classify**:
   - **Live**: read in production code; conditional value drives real behavior
   - **Dead-on**: hardcoded `True` everywhere, branch always taken — flag is dead
   - **Dead-off**: hardcoded `False` everywhere, branch never taken — flag and the gated branch are dead
   - **Unknown**: ambiguous; investigate further or leave alone
4. **Delete dead** — atomic commit per concern (one flag = one commit), grep for ghost references afterward.

## Caveats

- **Implicit consumers** — dashboards, alerts, support runbooks, third-party integrations may read a config key without it appearing in the source tree. The audit must extend beyond the repo.
- **Migration in progress** — a flag that *will be* dead next quarter is still live now. Coordinate with whoever owns the migration before deleting.
- **Time-bounded enable/disable** — flags that flip on at a specific date (e.g., GDPR rollout, holiday rate limits) are not dead even when currently off. Look for date-based logic.
- **External-facing config** — anything customers, partners, or downstream services configure is a public API. That belongs in `refactor-break-bw-compat`, not cleanup-codebase.
