---
name: site-launch-checklist
description: 'Use when a user says a site or app is ready to ship or asks for checks before go-live. Runs a ten-phase pre-launch audit with explicit user decisions, pass/fail results, and a fix queue. Not for deployment execution — use shipping.'
disable-model-invocation: true
---

# Site launch checklist

Run a ten-phase pre-launch audit before shipping a new website. Verify applicable checks with `curl`, `dig`, and browser tools, then report pass/fail results with a fix queue.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says a site/app is 'ready to ship' or asks for 'before go live' checks. |
| Authority | Human-only. Every phase requires explicit user input before proceeding. No phase runs autonomously. |
| Side effect | Configures DNS/DNSSEC records, HTTP headers, analytics, and backups on the live site. |
| Done | Every launch phase is reported pass/fail with a fix queue, using provider-variant weekly-SEO assets. |

## Inputs

- **Domain** (required): the target site URL or domain name.
- **Site type** (required, ask user): `doc-site` | `marketing-lead-gen` | `saas-app` | `training-paid-course` | `personal-portfolio`.
- **Migration status** (required, ask user): `greenfield-new-domain` | `migration-need-301-redirects` | `replacing-existing-on-same-domain`.
- **Multilingual** (required, ask user): `single-locale` | `en` | `fr-en` | `other-multi`.
- **Hosting stack** (required, ask user): DNS provider, hosting platform, analytics tools already in use.
- **AI scraper policy** (required, ask user): `use-default-for-site-type` | `customize-per-bot` | `block-all`.
- **Browser tool** (required, ask user): `claude-chrome-extension` | `playwright` | `neither-skip-browser-checks`.

Ask each question one at a time with 2-4 tappable options. Never proceed past a decision point without explicit user input.

## Procedure

### Phase 1: domain and infrastructure

Ask: "Is the domain already on Cloudflare with standard config?" (`yes-standard` | `yes-needs-review` | `no-fresh-setup`).

1. Verify DNS records:
   ```bash
   dig +short A {domain}
   dig +short AAAA {domain}
   dig +short MX {domain}
   dig +short TXT {domain}
   dig +short TXT _dmarc.{domain}
   dig +short CAA {domain}
   dig +dnssec {domain} | grep RRSIG
   ```
2. Verify TLS and HTTPS redirect:
   ```bash
   curl -sIL https://{domain} | head
   curl -sI https://www.{domain}
   openssl s_client -showcerts -connect {domain}:443 < /dev/null 2>/dev/null | openssl x509 -noout -dates
   ```
3. Verify hosting: project linked, env vars set, custom domain attached.
4. Decide www vs apex canonical; configure 308 redirect for non-canonical.
5. Verify custom 404 page: `curl -sI https://{domain}/this-does-not-exist`.
6. If migration: verify 301 redirect map for every old URL with `curl -sIL` per URL.

**Backups.** Ask which data stores the site uses: `database-only` | `database-plus-file-storage` | `file-storage-only` | `stateless-no-persistent-data`. Skip these checks if the site is stateless.

7. Verify automated daily backups enabled with retention ≥30 days.
8. Verify PITR enabled if available.
9. Verify off-site backup copy configured.
10. Verify restore drill performed before launch.
11. Verify secrets stored in a secrets manager, not in `.env` files.

Report pass/fail for each item. For each failure, ask the user whether to fix it now or add it to the queue. Done when: every domain and infrastructure item is pass/fail with failures queued or fixed.

### Phase 2: analytics and observability

1. Verify Google Analytics 4: property created, measurement ID embedded, consent-gated.
2. Verify PostHog or equivalent analytics: configured and CORS verified.
3. Verify Google Search Console: site verified, sitemap submitted.
4. Verify Bing Webmaster Tools: site verified, sitemap submitted.
5. Set up brand monitoring alerts for domain name, brand name, and key feature names.
6. Ask user about optional tools: error tracking, uptime monitoring, live chat.

Report pass/fail per item. Done when: every analytics and observability item is pass/fail.

### Phase 3: legal and compliance

Ask: "Is this site subject to French law?" (`yes-fr-operator-or-audience` | `no-eu-only` | `no-non-eu`).

If the site is subject to French law:
1. Mentions legales page present.
2. CGV present if commercial activity.
3. Privacy policy present.
4. Terms of service present.
5. CNIL-compliant cookie consent that gates tracker script loading. Verify with browser Network tab: no tracker fires before explicit consent.

If the site is not subject to French law but is subject to EU law, verify GDPR-compliant consent and a privacy policy.

Report pass/fail per item. Done when: every legal and compliance item is pass/fail per jurisdiction.

### Phase 4: security

Ask the user to choose a CSP tightness level: `strict-default-src-none` | `balanced-allow-self` | `permissive-for-marketing`.

1. Verify security headers:
   ```bash
   curl -sI https://{domain} | grep -iE 'content-security-policy|strict-transport-security|x-frame-options|x-content-type-options|referrer-policy|permissions-policy'
   ```
2. Target headers: CSP with nonces (no `unsafe-inline` for scripts), HSTS `max-age=31536000; includeSubDomains; preload`, X-Frame-Options `DENY`, X-Content-Type-Options `nosniff`, Referrer-Policy `strict-origin-when-cross-origin`, Permissions-Policy denying camera/microphone/geolocation/payment unless used.
3. Submit HSTS to hstspreload.org.
4. Target securityheaders.com grade A+.
5. Target observatory.mozilla.org score 90+.
6. Verify no leaked secrets in client bundle.

Report pass/fail per item. Done when: every security header and check is pass/fail.

### Phase 5: SEO and GEO

1. Verify `/robots.txt` present and references sitemap:
   ```bash
   curl -s https://{domain}/robots.txt
   ```
2. Verify `/sitemap.xml` present and valid:
   ```bash
   curl -s https://{domain}/sitemap.xml | head -40
   ```
3. Verify `/llms.txt` present per llmstxt.org spec.
4. Encode AI scraper policy in `robots.txt` based on site type; confirm each non-default decision with user.
5. Verify schema markup (JSON-LD): Organization + WebSite + BreadcrumbList site-wide; per-page types where applicable.
   ```bash
   curl -s https://{domain}/ | grep -A 50 'application/ld+json'
   ```
6. Verify meta tags per page: unique title (50-60 chars), unique meta description (150-160 chars), canonical link, robots meta if needed.
7. Verify hreflang tags on every page if multilingual.
8. Run keyword analysis: validate direction with Google Trends, size opportunity with keyword research tools, produce ranked shortlist of 3-5 target queries per page.
9. Run AI visibility audit: check how the site appears in AI-generated answers.
10. Typo and grammar pass on all visible text.
11. Internal linking audit: every important page reachable in ≤3 clicks from homepage.

Report pass/fail per item. Done when: every SEO and GEO item is pass/fail.

### Phase 6: Open Graph and social preview

1. Verify OG tags:
   ```bash
   curl -s https://{domain}/ | grep -iE 'og:|twitter:'
   ```
2. Required: `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`.
3. Required: `og:image` 1200x630px, absolute URL, width/height declared, alt set.
4. Per-page `og:image`, not one global.
5. If multilingual: `og:locale` + `og:locale:alternate` for each language.
6. Twitter Cards: `twitter:card=summary_large_image`, title, description, image, site handle.
7. Manual check: paste URL in LinkedIn DM, Slack channel, Discord, iMessage. Preview must render.

Report pass/fail per item. Done when: every OG and social preview item is pass/fail.

### Phase 7: favicons and web manifest

1. Verify minimum modern set:
   ```bash
   curl -sI https://{domain}/favicon.ico
   curl -sI https://{domain}/favicon.svg
   curl -sI https://{domain}/apple-touch-icon.png
   curl -s https://{domain}/manifest.json | jq .
   ```
2. Required: `favicon.ico` (multi-res 16/32/48), `favicon.svg` with dark mode support, `favicon-96x96.png`, `apple-touch-icon.png` 180x180 no transparency, `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`, `manifest.json` with theme_color/background_color/name/short_name/display.
3. Verify HTML head references all icons and manifest.

Report pass/fail per item. Done when: every favicon and manifest item is pass/fail.

### Phase 8: quality gates

1. Run Lighthouse all 4 axes, mobile mode: target ≥90 each.
2. Run Lighthouse all 4 axes, desktop mode: target ≥95 each.
3. Core Web Vitals field data: LCP < 2.5s, INP < 200ms, CLS < 0.1 on both mobile and desktop.
4. Accessibility (WCAG 2.2 AA): keyboard nav, focus rings, color contrast ≥4.5:1, alt text, monotonic heading hierarchy, ARIA labels on icon-only buttons.
5. Real mobile device test (not just devtools emulator).
6. Cross-browser smoke test: Chrome, Safari, Firefox latest stable.
7. Print stylesheet sanity.

Report pass/fail per item. Done when: every quality gate item is pass/fail.

### Phase 9: ecosystem cross-linking

Ask user: "List other domains in your ecosystem that are topically relevant."

For each relevant domain:
1. Add link from existing site to new site where topically relevant.
2. Add link to new site in matching GitHub repo README if applicable.
3. Verify reciprocal links where appropriate.

Do not over-link. Only cross-link where topically relevant. Done when: every relevant ecosystem domain is cross-linked or explicitly skipped.

### Phase 10: weekly SEO maintenance agent

Ask user: "Set up the weekly SEO agent now?" (`yes-create-agent-file` | `yes-but-defer` | `skip-for-now`).

If yes: create a scheduled background agent definition that runs weekly to monitor SEO health, covering backlink tracking, analytics correlation, SERP monitoring, and Search Console data. Output a concrete agent file matching the user's harness. Done when: the weekly SEO agent is created, deferred, or skipped per user choice.

## Failure and recovery
- **Verification failure**: report the exact command output and the gap. Ask user whether to fix now or queue. Never skip a failed item silently.
- **User declines a phase**: record as skipped with reason. Proceed to next phase.
- **External service unavailable**: report the service as unreachable, mark the check as indeterminate, continue with remaining checks.
- **Partial run**: if the session ends mid-phase, report completed phases with their pass/fail status and list remaining phases as not-started.
- **Scope widening blocked**: if a check reveals an issue outside the ten phases, record it once as an out-of-scope finding with its evidence, impact, and concrete next action. Do not expand this run and do not invoke another skill.

Never pretend a failed check passed. Never mark a skipped phase as complete.

## Output
Status report grouped by phase (pass/fail per item with fix actions), followed by three ordered lists — blockers (must fix before launch), recommended fixes (should fix before announcing), optional improvements (post-launch) — ending with a single-select asking which list to tackle next.
