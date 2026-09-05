---
name: insecure-default-discovery
description: 'Use when the user asks to audit a file, subtree, or repository for fallback secrets, default credentials, fail-open controls, weak primitives, or permissive access. Not for exhaustive secret scanning.'
---

# Insecure default discovery

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to audit a file, subtree, or repository for fallback secrets, usable default credentials, fail-open controls, weak security primitives, permissive access, or exposed debug behavior. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Application code and configuration are never altered. |
| Side effect | Chat output only: scoped read-only discovery plus refuting verification of every candidate, reported without touching the target. |
| Done | Every category records corpus access and coverage; each reported finding traces an active insecure value to a production security decision; refuted candidates and incomplete coverage remain visible. |

## Inputs

- Target: one file, one subtree, or a repository root. Optional; defaults to the current directory.
- The user-named path is the target, even if it looks like a test path: a run scoped to `tests/` audits the tests. Fixture, docs, and vendored-code exclusions apply only outside the named scope.
- This audit reports insecure defaults that reach production security decisions; it is not an exhaustive committed-secret scanner.

## Procedure

1. **Bound the scope.** Resolve the target to an explicit path set and verify it exists and is readable before searching. A missing or unreadable target is the blocked result, never an empty result.
2. **Recon.** Classify the scope (file / subtree / repository). Profile the languages and frameworks. Flag the project's own configuration wrappers that can return a default (for example a `get_setting(key, default)` helper); sweeps must derive patterns for them. Read the deployment manifests (Dockerfile `ENV`, Terraform `default =`, Kubernetes env blocks, CI secret wiring) and record which variables each supplies; verification step 5 consumes this record.
3. **Discover: run one sweep per category, collecting without judging.** Each sweep searches the scope with its category's seed patterns below and with patterns derived from the detected stack (framework keys, language idioms such as `ENV.fetch(k, d)`, `System.getProperty(k, d)`, `${VAR:-default}`, and the manifest formats found in recon), filing every hit as a candidate. Classification happens only in verification.
   - Seeds are a floor, not the search: a codebase reading config through its own wrapper barely matches generic seeds, so derived patterns are mandatory for every sweep.
   - Record per sweep: whether it read the scope, seed-pattern hits, and derived-pattern hits. A sweep whose derived pattern list is empty searched generic idioms only and is a coverage gap to name in the report.
   - Seeds are POSIX ERE: `[[:space:]]` and `[0-9]`, never `\s`, `\d`, or `\b`; some grep builds silently fail on those, and a pattern that matches nothing is indistinguishable from a clean result.

   ```text
   fallback-secrets:
     (getenv|environ\.get|getOrDefault|get_config|get_setting)\([^)]*,[[:space:]]*['"]
     (environ\.get|getenv)\([^)]*\)[[:space:]]*(or|\|\|)[[:space:]]*['"]
     process\.env\.[A-Za-z_][A-Za-z0-9_]*[[:space:]]*(\|\||\?\?)[[:space:]]*['"]
     ENV\.fetch\([^)]*,[[:space:]]*['"]
     (SECRET|SECRET_KEY|JWT_SECRET|SESSION_KEY|SIGNING_KEY|TOKEN|SALT|PEPPER)[[:space:]]*[:=]
   default-credentials:
     (password|passwd|pwd|secret|token)[[:space:]]*[:=][[:space:]]*['"][^'"]{4,}['"]
     (api[_-]?key|access[_-]?key|client[_-]?secret)[[:space:]]*[:=][[:space:]]*['"][^'"]+['"]
     (admin|root|guest|test)[[:space:]]*[:=][[:space:]]*['"](admin|root|password|changeme|guest|test|123)
     (hash_password|set_password|hashpw|generate_password_hash)\([^)]*['"][^'"]{3,}['"]
     (postgres(ql)?|mysql|mariadb|mongodb|redis|amqp|mssql)(\+[a-z]+)?://[^:@[:space:]]+:[^@[:space:]]+@
   fail-open-security:
     (getenv|environ\.get|getOrDefault|get_config|get_setting)\([^)]*,[[:space:]]*['"]?(false|0|no|off|none|disabled)['"]?[[:space:]]*\)
     (getenv|environ\.get|process\.env)[^)]*\)[[:space:]]*(or|\|\|)[[:space:]]*(False|false|['"](false|0|off|no)['"])
     (verify|check_hostname|validate)[[:space:]]*=[[:space:]]*(False|false)
     InsecureSkipVerify[[:space:]]*:[[:space:]]*true
   weak-crypto:
     (md5|sha1|MD5|SHA1)[[:space:]]*\(
     (^|[^A-Za-z])(DES|DESede|RC2|RC4|Blowfish|ECB)([^A-Za-z]|$)
     (createHmac|createHash|MessageDigest|hmac\.new|getInstance)[^)]{0,40}['"](md5|sha1|MD5|SHA1|DES|RC4)
     (token|secret|key|password|salt|nonce|otp|session|csrf)[A-Za-z_]*[[:space:]]*[:=][[:space:]]*[^=]{0,60}(random\.|Math\.random|mt_rand|rand\()
   permissive-access:
     (cors|CORS|Access-Control-Allow-Origin|allow_origins|allowedOrigins).{0,80}['"]?\*
     (^|[^0-9.])0o?(777|776|766|707|666|000)([^0-9]|$)
     (ACL|canned_acl|predefined_acl)[[:space:]]*[:=][[:space:]]*['"]?(public-read|public-read-write|authenticated-read)
     (allUsers|AllUsers|AuthenticatedUsers|0\.0\.0\.0/0|::/0)
     (AllowAny|permitAll|runAsUser[[:space:]]*:[[:space:]]*0)
   debug-features:
     (DEBUG|DEVELOPMENT|TRACE)[A-Za-z_]*[[:space:]]*[:=][[:space:]]*(True|true|1)
     (getenv|environ\.get|getOrDefault)\([^)]*,[[:space:]]*['"]?(true|1|on|yes|enabled)['"]?[[:space:]]*\)
     (introspection|playground|graphiql|swagger|actuator|pprof|expvar)[[:space:]]*[:=][[:space:]]*(True|true|1)
     (traceback\.format_exc|printStackTrace|getStackTrace|exc_info)
     (show_exceptions|PROPAGATE_EXCEPTIONS|display_errors|full_stack)
     ['"][^'"]*['"][[:space:]]*\+[[:space:]]*[A-Za-z_][A-Za-z0-9_]*\.getMessage\(\)
   ```

4. **Classify candidates against the corpus.**

   | Category | Report when | Skip when | Decisive question |
   |---|---|---|---|
   | Fallback secrets | A default value supplied when an env var is absent feeds signing, encryption, session, or token machinery | Defaults generated per-boot at random; values used only as cache keys or correlation ids | Does the app run with the fallback? `env.get(X, Y)` runs; `env[X]` crashes and is fail-secure |
   | Default credentials | A credential literal a running deployment can authenticate with, including seeded first-boot accounts | Accounts created disabled or with a forced-reset flag; credentials in docs, READMEs, and fixture files | Can a deployment authenticate with it? A credential in prose is unusable; one in a bootstrap routine is a login |
   | Fail-open security switches | The value taken when configuration is absent disables a security control | Switches whose unconfigured value is the secure one; flags read but never consulted at the enforcement point | Read the default, not the flag name: `REQUIRE_AUTH` defaulting to `false` requires nothing |
   | Weak cryptographic defaults | A broken or non-cryptographic primitive stands in for a security-relevant one: password hashing, token generation, encryption, signature verification | Checksums, ETags, cache keys, deduplication hashes, test vectors, non-security shuffling or sampling | The algorithm alone is never the finding: trace to the use site; `md5` over a cache key is fine, over a password is not |
   | Permissive access defaults | Access granted to a party who should not have it, whether hardcoded (`ACL='public-read'`, mode `0o666`, CORS `*`) or the unconfigured fallback | Deliberate public endpoints with a stated reason; local-only dev servers; permissiveness already gated by an outer authorization layer at the same trust boundary | Who gains access, not how wide the value looks: `0o644` on a CDN asset is correct, `0o666` on a key file is not |
   | Debug and introspection defaults | Internal detail reaches a response, a listening port, or a log a lower-privileged party can read: flag-defaulted-on or unconditional | Log-verbosity-only flags with no user-facing output; debug servers bound to loopback and off by default | Both halves required: enabled-by-default and an exposure path |

   Deduplicate on `category:file:line` before verification: two patterns of one category hitting the same line collapse to one candidate, but the same line hit by two categories stays as two candidates; `hashlib.md5(k)` can be a real weak-crypto finding and a false permissive-access match at once, and one merged verdict would have to cover both readings.

5. **Verify by refutation.** For each candidate, start at `refuted: true` and stop at the first step that kills it:
   1. Is the file reachable in production?
   2. Is the insecure value the one that runs? A **configurable** candidate (a lookup with a fallback) is only a bug if the app runs with the insecure value; a lookup that crashes when the variable is missing is fail-secure. An **unconditional** candidate (no configuration anywhere, insecure as written) cannot be refuted at this step; a missing env var is not grounds to refute it.
   3. Is the value actually insecure under the category's skip rules?
   4. Does it reach a security decision? Cite the sink: the call or enforcement point that consumes the value.
   5. Configurable candidates only: does deployment always supply the variable? A missing answer does not refute the candidate. Every manifest that sets it lowers severity; if no manifest sets it, the candidate is CRITICAL; a partial or undetermined answer counts as reachable.

   An incomplete trace is refuted. Verify in per-category batches of at most 16 candidates and complete every verdict in a batch before starting the next, so no candidate ends with a partial verdict list or is silently dropped.
6. **Rate and remediate.** For each confirmed finding, assign severity from the reachability evidence (CRITICAL reserved per step 5) and state a remediation that removes the insecure default, such as a fail-secure lookup or explicitly required configuration.

## Failure and recovery
- Target missing or unreadable: report blocked with the path; do not search elsewhere and do not run the audit anyway.
- Any category sweep could not read its scope: abort the audit and say so. A result without corpus access recorded for every category never satisfies the done predicate.
- All sweeps completed and matched nothing: this is a real result. Report it explicitly and state that seeds are a floor, so it is not proof of absence.
- A verification step cannot be completed for a candidate (sink not found, reachability undetermined): the candidate is refuted and listed with the incomplete step; it is never dropped and never reported as confirmed.
- Authority is read-only, so there is nothing to roll back; if any step would mutate the target, credentials, VCS state, or anything remote, stop instead of executing it.
- Blocked or aborted runs name the failed category or step exactly; never present partial sweeps as a completed audit and never claim the done predicate without it.

## Output
One chat report:

- Per category: corpus access (read or failed), coverage (seed hits, derived hits, empty-derived-list gaps), and candidate count.
- Confirmed findings, each with: category, `file:line`, the active insecure value, candidate shape (configurable or unconditional), the cited sink, deployment-manifest evidence, severity (CRITICAL only when no manifest supplies a configurable candidate's variable), and remediation.
- Refuted candidates, each with the step number that killed it.
- Coverage gaps: scopes that could not be read, sweeps with empty derived pattern lists.
- When nothing matched anywhere: the explicit no-candidates statement with the not-proof-of-absence note.
