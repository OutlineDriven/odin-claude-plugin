---
name: multi-tenant-architecture
description: 'Use when a request concerns multi-tenant app scaffolding, tenant isolation, custom domain wiring, or SaaS architecture for Cloudflare or Vercel. Scaffolds tenant routing, domain logic, platform config, and a management surface locally. Not for single-tenant apps; use standard project scaffolding.'
---

# Multi-tenant architecture

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User requests multi-tenant app scaffolding, tenant isolation design, custom domain wiring, or SaaS architecture for Cloudflare or Vercel. |
| Authority | Reversible local write: creates or modifies only named local project files; rollback by reverting or deleting the scaffolded output. No remote API calls; custom domain provisioning logic is defined, not executed. |
| Side effect | Scaffolds or designs a multi-tenant TypeScript package; may create files in the working directory. |
| Done | All five method stages complete: tenant isolation strategy and model designed, request routing middleware implemented, custom domain wiring logic defined, platform-specific configuration applied, and tenant management surface scaffolded with isolation validated. |

## Inputs

- Project directory (required): target path for scaffolded output.
- Tenant isolation strategy (optional): `shared-db`, `schema-per-tenant`, or `database-per-tenant`. Defaults to `shared-db`.
- Platform target (optional): `cloudflare`, `vercel`, or `both`. Defaults to `both`.
- Custom domain support (optional): boolean. Defaults to `true`.
- Tenant identifier style (optional): `subdomain`, `path`, or `header`. Defaults to `subdomain`.

## Procedure

1. **Choose isolation strategy and design tenant model.** Map the tenant isolation strategy to a data partitioning approach: `shared-db` (single database, `tenant_id` column on every table, row-level filtering in every query); `schema-per-tenant` (shared database, one schema per tenant, search-path switching per request); or `database-per-tenant` (separate database per tenant, connection routing by tenant identifier). Default to `shared-db` for lowest operational cost. Define a `Tenant` record containing at minimum: `id`, `slug` (URL-safe identifier), `name`, `plan`, `custom_domain` (nullable), `created_at`. Store tenant metadata in a dedicated table or collection isolated from business data. Done when: one strategy is selected with its partitioning approach stated and the `Tenant` record is defined with its storage location specified.

2. **Implement request routing middleware.** Build middleware that extracts the tenant identifier from the incoming request: `subdomain` (parse the hostname, extract the leftmost label before the apex domain, use the Public Suffix List boundary to avoid mis-parsing `co.uk`-style suffixes); `path` (extract the first path segment); or `header` (read a dedicated `X-Tenant-ID` header). Resolve the identifier to a `Tenant` record, attach tenant context to the request, and return 404 if no tenant matches. Done when: the middleware resolves a tenant from every supported identifier style and never falls through to another tenant's data.

3. **Define custom domain wiring logic.** When enabled: accept a domain string per tenant, validate format and check uniqueness. Define the provisioning logic as code that would call the platform API without executing it: on Cloudflare, provision a custom hostname via the Cloudflare for SaaS API, configure DNS verification (TXT record) and SSL certificate issuance, poll for `active` status; on Vercel, add the domain to the Vercel project via the Vercel API, configure DNS records (A or CNAME), poll for `configured` status. Store the provisioning state (`pending`, `active`, `failed`) on the tenant record. Define the resolution order: match the `Host` header against stored custom domains before falling back to subdomain or path parsing. Done when: custom domain provisioning logic is defined for the target platform(s) and the resolution order is specified, with no remote calls executed.

4. **Apply platform-specific configuration.** Write platform config files locally. Cloudflare: configure Workers or Pages with D1 (SQLite) or Hyperdrive (PostgreSQL) for tenant data; use Durable Objects for per-tenant stateful sessions if needed; respect 30-second CPU time, 128 MB memory, 1 GB D1 storage on free tier. Vercel: configure Serverless or Edge Functions for tenant routing; use Vercel Postgres, Neon, or PlanetScale for tenant data; respect 10-second execution timeout (Hobby), 256 MB memory, 50 custom domains per project on Pro. Done when: platform config files exist for the target platform(s) and the stated limits are respected.

5. **Scaffold tenant management and validate isolation.** Create an admin surface (API route or CLI command) that supports: listing tenants, creating a tenant (assign slug, provision domain), updating tenant configuration, and deactivating a tenant (soft-delete, preserve data). Ensure every management operation scopes to a single tenant; no bulk cross-tenant mutations without explicit per-tenant confirmation. Validate isolation: verify that every data access path includes tenant filtering, no query can return rows from multiple tenants unless explicitly aggregated, custom domain resolution never leaks one tenant's data to another tenant's domain, and tenant context is set exactly once per request and cannot be overridden downstream. Done when: the admin surface supports all four operations and every operation is tenant-scoped, and every isolation check passes with file paths and line references, or each gap is reported as a finding.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Tenant not found | Return 404. Never resolve to a default or fallback tenant. |
| Custom domain provisioning timeout | The provisioning logic is defined but not executed; if the user runs it later and it times out, keep the tenant accessible on its subdomain or path. Log the provisioning failure. |
| Duplicate custom domain | Reject the assignment. Return a clear error naming the conflict. |
| Scope expansion detected | Stop. Report what was discovered and what remains out of scope. Do not widen the scaffold beyond the agreed isolation strategy and platform target. |

Partial results: if scaffolding completes through stage 4 but stage 5 validation reveals isolation gaps, report the gaps as findings with file paths and line references. Do not claim done.

Rollback: delete or revert any files created during the current invocation. The project directory returns to its pre-invocation state.

## Output

A scaffolded multi-tenant TypeScript package: tenant model, routing middleware, data-access layer, custom-domain wiring logic (defined, not executed), platform config, tenant management surface, and isolation validation report; ordered by the procedure stages that produced them.
