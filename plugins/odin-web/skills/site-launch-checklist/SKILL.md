---
name: site-launch-checklist
description: 'Use when a user says a site or app is ready to ship and wants a decision-gated pre-launch readiness pass. Runs infrastructure, security, content, discovery, and quality checks with pass/fail accounting and an ordered fix queue. Not for deployment execution — use shipping.'
disable-model-invocation: true
---

# Site launch checklist

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says a site or app is ready to ship, or asks for checks before go-live. |
| Authority | Read-and-report by default: run curl, dig, and Lighthouse, record pass/fail. Live mutations (DNS, headers, analytics, backups) happen only after an explicit per-phase yes from the user, and are recorded as performed-by-user or performed-with-consent, never silently. |
| Side effect | Runs read-only diagnostic commands. On explicit user consent per phase, may guide or perform live DNS, header, analytics, or backup configuration changes. |
| Done | Every phase is pass, fail, skipped, or indeterminate. Three ordered fix queues exist (blockers, recommended, optional). No failed check is reported as passed and no skipped phase as complete. |

## Inputs

- Target domain (required): the site URL or domain name to audit.
- Site type (required): doc-site, marketing-lead-gen, saas-app, training-paid-course, personal-portfolio.
- Migration status (required): greenfield-new-domain, migration-need-301-redirects, replacing-existing-on-same-domain.
- Locale set (required): single-locale, en, fr-en, other-multi.
- Hosting stack (required): DNS provider, hosting platform, analytics in use.
- AI-scraper policy (required): use-default-for-site-type, customize-per-bot, block-all.
- Browser-check capability (required): any tool that can load pages and run Lighthouse, or explicitly none.

Ask each question one at a time. Never proceed past a decision point without explicit user input.

## Procedure

### Stage 1: interview

Walk the user through the six required decisions above, one at a time. Record each answer. Done when: all six decisions are recorded, or the user stops and the run exits partial.

### Stage 2: infrastructure and security checks

Run each check with curl or dig and record pass/fail with the command output as evidence.

1. DNS records: `dig +short A {domain}`, `dig +short AAAA {domain}`, `dig +short MX {domain}`, `dig +short TXT {domain}`, `dig +short TXT _dmarc.{domain}`, `dig +short CAA {domain}`, `dig +dnssec {domain} | grep RRSIG`.
2. TLS and HTTPS redirect: `curl -sIL https://{domain} | head`, `curl -sI https://www.{domain}`, `openssl s_client -showcerts -connect {domain}:443 < /dev/null 2>/dev/null | openssl x509 -noout -dates`.
3. Hosting: project linked, env vars set, custom domain attached.
4. Canonical: www vs apex decided; 308 redirect configured for non-canonical.
5. Custom 404: `curl -sI https://{domain}/this-does-not-exist`.
6. Migration: if migration-need-301-redirects, verify 301 redirect map for every old URL with `curl -sIL` per URL.
7. Backups: ask which data stores the site uses (database-only, database-plus-file-storage, file-storage-only, stateless-no-persistent-data). Skip if stateless. Otherwise verify automated daily backups with retention >=30 days, PITR if available, off-site backup copy, restore drill performed, secrets in a secrets manager not .env files.
8. Security headers: `curl -sI https://{domain} | grep -iE 'content-security-policy|strict-transport-security|x-frame-options|x-content-type-options|referrer-policy|permissions-policy'`. Target: CSP with nonces, HSTS max-age=31536000 includeSubDomains preload, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy denying unused camera/microphone/geolocation/payment. HSTS submitted to hstspreload.org. No leaked secrets in client bundle.

For each failure, ask the user whether to fix now or add to the queue. Live changes (DNS, headers, backups) happen only after an explicit yes and are recorded as performed-by-user or performed-with-consent. Done when: every infrastructure and security item is pass, fail, skipped, or indeterminate with command evidence.

### Stage 3: content and discovery checks

1. robots.txt present and references sitemap: `curl -s https://{domain}/robots.txt`.
2. sitemap.xml present and valid: `curl -s https://{domain}/sitemap.xml | head -40`.
3. llms.txt present per the llmstxt.org Markdown-structured format.
4. AI scraper policy encoded in robots.txt based on the user's choice; confirm each non-default decision with the user.
5. Schema markup (JSON-LD): Organization + WebSite + BreadcrumbList site-wide; per-page types where applicable. `curl -s https://{domain}/ | grep -A 50 'application/ld+json'`.
6. Meta tags per page: unique title (50-60 chars), unique meta description (150-160 chars), canonical link, robots meta if needed.
7. hreflang tags on every page if multilingual.
8. OG tags: `curl -s https://{domain}/ | grep -iE 'og:|twitter:'`. Required: og:title, og:description, og:url, og:type, og:site_name, og:image 1200x630 absolute URL with width/height/alt. Twitter Cards: summary_large_image with title, description, image, site handle. Per-page og:image, not one global. If multilingual: og:locale and og:locale:alternate.
9. Favicons and web manifest: `curl -sI https://{domain}/favicon.ico`, `curl -sI https://{domain}/favicon.svg`, `curl -sI https://{domain}/apple-touch-icon.png`, `curl -s https://{domain}/manifest.json | jq .`. Required: favicon.ico multi-res, favicon.svg with dark mode, apple-touch-icon 180x180, manifest with theme_color/background_color/name/short_name/display. HTML head references all icons and manifest.
10. Legal and compliance: if subject to French law, verify mentions legales, CGV if commercial, privacy policy, terms of service, CNIL-compliant cookie consent gating tracker loading. If EU but not French, verify GDPR-compliant consent and privacy policy. If non-EU, verify privacy policy.
11. Typo and grammar pass on all visible text.
12. Internal linking audit: every important page reachable in <=3 clicks from homepage.

Done when: every content and discovery item is pass, fail, skipped, or indeterminate with command evidence.

### Stage 4: quality gates

Run within the declared browser-check capability. If the user declared none, mark all quality gate items as indeterminate and continue.

1. Lighthouse all 4 axes, mobile: target >=90 each.
2. Lighthouse all 4 axes, desktop: target >=95 each.
3. Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1 on mobile and desktop.
4. Accessibility (WCAG 2.2 AA): keyboard nav, focus rings, color contrast >=4.5:1, alt text, monotonic heading hierarchy, ARIA labels on icon-only buttons.
5. Real mobile device test if a device is available.
6. Cross-browser smoke: Chrome, Safari, Firefox latest stable.
7. Print stylesheet sanity.

Done when: every quality gate item is pass, fail, skipped, or indeterminate within the declared capability.

### Stage 5: report and fix queues

Emit the phase-grouped pass/fail report. Group results by stage (infrastructure and security, content and discovery, quality gates). For each item: status (pass, fail, skipped, indeterminate), the command or check that produced it, and the observed output.

Build three ordered fix queues:
- Blockers: must fix before launch.
- Recommended: should fix before announcing.
- Optional: post-launch improvements.

End with a single-select question asking the user which queue to tackle next.

Done when: the report is emitted with every item classified, three fix queues exist, and the next-step question is presented.

## Failure and recovery

- Verification failure: report the exact command output and the gap. Ask the user whether to fix now or queue. Never skip a failed item silently.
- Phase declined: the user declines a phase. Record as skipped with the reason. Proceed to the next phase.
- Service unreachable: a check target is unreachable. Mark the check as indeterminate. Continue with remaining checks.
- Partial run: the session ends mid-phase. Report completed phases with their pass/fail status and list remaining phases as not-started.
- Out-of-scope finding: a check reveals an issue outside the five stages. Record it once with evidence, impact, and a concrete next action. Do not expand this run and do not invoke another skill.

Never pretend a failed check passed. Never mark a skipped phase as complete.

## Output

A status report grouped by stage with pass/fail/skipped/indeterminate per item and command evidence, followed by three ordered fix queues (blockers, recommended, optional), ending with a single-select asking which queue to tackle next.
