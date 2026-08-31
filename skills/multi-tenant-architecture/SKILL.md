---
name: multi-tenant-architecture
description: 'Use when a request concerns a multi-tenant app, tenant isolation, a custom domain, Cloudflare, Vercel, or a SaaS scaffold. Produces a scaffolded or designed multi-tenant TypeScript package with tenant isolation, routing, and custom-domain wiring. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Multi tenant architecture

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User requests multi-tenant app scaffolding, tenant isolation design, custom domain wiring, or SaaS architecture for Cloudflare or Vercel |
| Authority | Reversible local write: creates or modifies only named local project files; rollback by reverting or deleting the scaffolded output |
| Side effect | Scaffolds or designs a multi-tenant TypeScript package; may create files in the working directory |
| Done | Tenant isolation strategy, request routing, and custom-domain wiring are specified or scaffolded in project files |

## Inputs

- **Project directory** (required): target path for scaffolded output.
- **Tenant isolation strategy** (optional): `shared-db`, `schema-per-tenant`, or `database-per-tenant`. Defaults to `shared-db`.
- **Platform target** (optional): `cloudflare`, `vercel`, or `both`. Defaults to `both`.
- **Custom domain support** (optional): boolean. Defaults to `true`.
- **Tenant identifier style** (optional): `subdomain`, `path`, or `header`. Defaults to `subdomain`.

## Procedure

1. **Choose isolation strategy.** Map the tenant isolation strategy to a data partitioning approach:
   - `shared-db`: single database, `tenant_id` column on every table, row-level filtering in every query.
   - `schema-per-tenant`: shared database, one schema per tenant, search-path switching per request.
   - `database-per-tenant`: separate database per tenant, connection routing by tenant identifier.
   If the user does not specify, default to `shared-db` for lowest operational cost.

2. **Design the tenant model.** Define a `Tenant` record containing at minimum: `id`, `slug` (URL-safe identifier), `name`, `plan`, `custom_domain` (nullable), `created_at`. Store tenant metadata in a dedicated table or collection isolated from business data.

3. **Implement request routing.** Build middleware that extracts the tenant identifier from the incoming request:
   - `subdomain`: parse the hostname, extract the leftmost label before the apex domain. Use the Public Suffix List boundary to avoid mis-parsing `co.uk`-style suffixes as tenant slugs.
   - `path`: extract the first path segment (e.g., `/tenant-slug/...`).
   - `header`: read a dedicated `X-Tenant-ID` header.
   Resolve the identifier to a `Tenant` record. Attach tenant context to the request. Return 404 if no tenant matches; never fall through to another tenant's data.

4. **Wire custom domains.** When custom domain support is enabled:
   - Accept a domain string per tenant. Validate format and check uniqueness across all tenants.
   - On Cloudflare: provision a custom hostname via the Cloudflare for SaaS API. Configure DNS verification (TXT record) and SSL certificate issuance. Poll for `active` status.
   - On Vercel: add the domain to the Vercel project via the Vercel API. Configure DNS records (A or CNAME) as instructed by the API response. Poll for `configured` status.
   - Store the provisioning state (`pending`, `active`, `failed`) on the tenant record.
   - Route incoming requests by matching the `Host` header against stored custom domains before falling back to subdomain or path parsing.

5. **Apply platform-specific configuration.**
   - **Cloudflare**: configure Workers or Pages with D1 (SQLite) or Hyperdrive (PostgreSQL) for tenant data. Use Durable Objects for per-tenant stateful sessions if needed. Respect Cloudflare Workers limits: 30-second CPU time per request, 128 MB memory, 1 GB D1 storage on free tier.
   - **Vercel**: configure Serverless or Edge Functions for tenant routing. Use Vercel Postgres, Neon, or PlanetScale for tenant data. Respect Vercel limits: 10-second execution timeout on Serverless Functions (Hobby), 256 MB memory, 50 custom domains per project on Pro.

6. **Scaffold tenant management.** Create an admin surface (API route or CLI command) that supports: listing tenants, creating a tenant (assign slug, provision domain), updating tenant configuration, and deactivating a tenant (soft-delete, preserve data). Ensure every management operation scopes to a single tenant; no bulk cross-tenant mutations without explicit per-tenant confirmation.

7. **Validate isolation.** Verify that:
   - Every data access path includes tenant filtering.
   - No query can return rows from multiple tenants unless explicitly aggregated.
   - Custom domain resolution never leaks one tenant's data to another tenant's domain.
   - Tenant context is set exactly once per request and cannot be overridden downstream.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Tenant not found | Return 404. Never resolve to a default or fallback tenant. |
| Custom domain provisioning timeout | Keep tenant accessible on its subdomain or path. Log the provisioning failure. Retry on next request or admin trigger. |
| Duplicate custom domain | Reject the assignment. Return a clear error naming the conflict. |
| Database migration failure | Halt the migration. Do not apply partial schema changes. Report the exact migration step that failed. |
| Scope expansion detected | Stop. Report what was discovered and what remains out of scope. Do not widen the scaffold beyond the agreed isolation strategy and platform target. |

Partial results: if scaffolding completes through step 6 but step 7 validation reveals isolation gaps, report the gaps as findings with file paths and line references. Do not claim done.

Rollback: delete or revert any files created during the current invocation. The project directory returns to its pre-invocation state.

## Output
A scaffolded multi-tenant TypeScript package containing:
- Tenant model and metadata storage.
- Request-routing middleware with tenant resolution.
- Data-access layer with tenant-scoped filtering matching the chosen isolation strategy.
- Custom-domain provisioning and resolution wiring for the target platform(s).
- Platform configuration files for Cloudflare and/or Vercel.
- Tenant management API or CLI surface.
- Isolation validation report confirming no cross-tenant data paths.

## Provenance

Adapted from `mblode/agent-skills` commit `e97a3b383f5944f90d41eb92b24b4fb3b917a7f9`. Original licensed MIT, Copyright (c) 2026 Matthew Blode. This is a clean-room adaptation — no third-party expression is copied. Reuse constraint: preserve the copyright notice and license text in all copies or substantial portions.
