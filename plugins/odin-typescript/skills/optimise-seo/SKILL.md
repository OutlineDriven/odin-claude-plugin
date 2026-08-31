---
name: optimise-seo
description: 'Use when asked to improve SEO or Next.js SEO across sitemaps, robots, metadata, structured data, canonical URLs, hreflang, and Core Web Vitals. Audits or edits the App Router app until checks pass. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Optimise SEO

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Improve SEO, Next.js SEO, sitemap, robots, meta tags, structured data, canonical URL, hreflang, Core Web Vitals. |
| Authority | Reversible-local: change only named local project source files (App Router pages and layouts, `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, `next.config.ts`, JSON-LD components, `public/` assets, `public/.well-known/security.txt`); validation commands only read. Record each file's prior content before the first edit and state that rollback path. |
| Side effect | Recommends, or applies within this scope, SEO and technical changes. No visual redesigns, component styling, or layout changes; no content rewriting; llms.txt and AI-agent readability are out of scope. |
| Done | Every checklist item in Procedure step 8 is marked pass with command evidence or fail with a named blocker; sitemap, robots, and meta checks pass; Core Web Vitals are green (Lighthouse SEO and Performance >= 90). |

## Inputs

Required: the repo root of the Next.js App Router app to change, or a deployed origin URL for an audit-only run; the canonical production host (apex or www). Optional: the locale list (multi-locale steps are skipped without it), which routes are staging, admin, thin, or private, and which findings to apply versus only recommend. With neither a repo nor an origin URL, stop without running.

## Procedure

1. **Bound scope before mutating.** Enumerate routes and decide index intent for each: public routes default to `index, follow`; staging, admin, thin, and private routes get explicit `noindex` (`metadata.robots` for HTML routes; `X-Robots-Tag` headers for non-HTML or whole staging environments). Record the decision per route; do not touch styling or layout. A thin page is `noindex`ed and omitted from the sitemap until it carries unique content, then indexed and linked internally. Done when: every route has a recorded index intent and no styling or layout is touched.

2. **Crawl and index foundations.**
   - `app/sitemap.ts` lists every public URL as absolute URLs. Derive each `lastModified` from the freshest content date (never hardcode it; stale dates signal dead content); homepage and section-index rows use the freshest date across their children. Above 50,000 URLs, or to split by type, export `generateSitemaps()` so Next serves a sitemap index. Add `images`/`videos` entries for media that is JS-loaded or CDN-hosted and not reachable by link-following.
   - `app/robots.ts` allows `/`, disallows private paths, and links the sitemap URL.
   - Canonicals: pick one host, one casing, one trailing-slash policy; set `alternates.canonical` on every page; 308-redirect the non-canonical host unless the platform already edge-redirects (then do not duplicate the rule).
   - Redirects: permanent moves use 301/308, temporary use 302/307, pointing straight at the final URL, never chained. Every URL change ships its redirect or link equity and crawl budget are lost.
   - Status codes: a missing page returns a real 404 (a 200 with a friendly message is a soft 404 and will not index). Maintenance windows return 503 with `Retry-After`, never 200 or 404.
   Done when: sitemap, robots, canonicals, redirects, and status codes are all configured per the above rules.

3. **Metadata and structured data.**
   - Unique title (50-60 chars) and unique description (150-160 chars) per page via static `metadata` or `generateMetadata`.
   - OpenGraph and Twitter Card tags on every page with a 1200x630 image (`opengraph-image.tsx` with `ImageResponse`, or a static file). Ship favicons: `favicon.ico`, `icon.svg`, `apple-touch-icon.png`.
   - JSON-LD through one `JsonLd` script component. Define each entity once with a stable `@id` (for example `https://<host>/#organization`, `/#website`, `/#person`) inside a single `@graph` emitted from the root layout or homepage; per-page schema references entities by `@id` instead of duplicating them inline. Homepage: `Organization` (with `logo`) and `WebSite`. Inner pages: `BreadcrumbList`. Where the content type matches: `Article`/`BlogPosting` (author is the `Person` `@id`, publisher is the `Organization` `@id`, never `Person` as publisher), `Product`, `FAQPage`; `ProfilePage` on identity pages such as about/now. Fill recommended fields, not only required ones: Search Console reports missing recommended fields as rich-result warnings, and warnings compound over time.
   Done when: unique titles and descriptions, OpenGraph/Twitter Card tags with favicons, and JSON-LD with stable @id entities are all in place.

4. **Semantics, internal links, and Core Web Vitals.** One h1 per page with a logical h2-h6 hierarchy; descriptive alt text on all images; internal links between related pages; every indexable page reachable from navigation, footer, or the sitemap (orphans: give them a crawl path, or `noindex` and drop them from the sitemap). Targets: LCP < 2.5s (hero image with `priority`), INP < 200ms, CLS < 0.1 (width and height on all media), TTFB < 600ms. Recompress oversized `public/` images in place, keeping filenames and formats so references stay valid; images referenced by JSON-LD serve crawlers too, so their size matters twice. Do not move indexable content behind a client-only render (`"use client"` plus a fetch in `useEffect` serves crawlers an empty shell); Server Components or ISR keep content in the initial HTML. Done when: single h1 with hierarchy, alt text, internal links, no orphan indexable pages, and Core Web Vitals targets are met.

5. **Programmatic-SEO guardrail** (any page set generated at scale, including single new pages). Validate search demand for the pattern before generating; each page needs unique value backed by defensible data, because templated text swaps are doorway pages that depress sitewide quality and indexation. Use clean subfolder URLs, hub-and-spoke linking, and breadcrumbs on every page; index only strong pages and `noindex` the long tail; monitor indexation and cannibalisation in Search Console. Stop rather than mass-generate. Done when: programmatic-SEO pages are validated for search demand with unique value, or generation is stopped.

6. **Internationalisation** (only when the site is multi-locale; skip otherwise). Pick one URL pattern for all locales (subdirectory by default; subdomain or ccTLD as alternatives) and keep it; optionally localise slugs. Declare `hreflang` with BCP 47 codes reciprocally: every alternate lists every other alternate including itself, plus a self-reference and `x-default`, in exactly one location, `alternates.languages` in `generateMetadata`, the XML sitemap `xhtml:link` entries, or head tags. Translate everything in the head and structured data per locale (title, description, OpenGraph with `og:locale`, JSON-LD `name`/`description`, image alt), not just the body. Never auto-redirect locale by IP geolocation or `Accept-Language`; serve the requested URL as-is and let the user pick. Done when: one URL pattern, reciprocal hreflang with self-reference and x-default, translated metadata, and no IP or Accept-Language redirects.

7. **Technical hardening.** Via `next.config.ts` `headers()` on every HTML response: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (add `preload`/`includeSubDomains` only once every subdomain serves HTTPS because removing them later is effectively irreversible); `Content-Security-Policy` starting at `default-src 'self'` with real origins allow-listed and nonces/hashes preferred over `'unsafe-inline'`, rolled out first as `Content-Security-Policy-Report-Only`; `X-Content-Type-Options: nosniff`; `frame-ancestors 'self'` (or trusted embedders only); `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy` disabling unused features (for example `camera=(), microphone=(), geolocation=()`). Prerequisite: HTTPS everywhere with a redirect to the canonical host. Add SRI on third-party scripts, `SameSite`/`Secure`/`HttpOnly` cookie flags, and `public/.well-known/security.txt`. Done when: all security headers are configured via next.config.ts with HTTPS enforced and cookie flags set.

8. **Validate with evidence commands.** Run each check below and mark pass or fail with command output:

   | Check | Command | Expected |
   |---|---|---|
   | Production build | `pnpm run build` (or the repository build command) | exits 0 |
   | Response headers | `curl -sI <url>` | correct status, redirects, canonical host |
   | Served HTML metadata | `curl -s <url> \| grep -F -e canonical -e "og:" -e "twitter:" -e "application/ld+json"` | tags present in the served source |
   | Robots | `curl -s <origin>/robots.txt` | expected allow/disallow and sitemap link |
   | Sitemap | `curl -s <origin>/sitemap.xml` | indexed routes, absolute URLs, fresh `lastmod` |
   | Lighthouse | `pnpm dlx lighthouse <url> --only-categories=seo,performance --output=json --output-path=.lighthouse-seo.json` | SEO and Performance >= 90, or blockers listed |
   | JSON-LD | Rich Results Test per URL | valid, or documented unsupported type |
   | Search Console | Pages/Coverage and enhancement reports after deploy | no new warnings; changes explained |

   Done when: every check is marked pass with command evidence or fail with a named blocker, and Lighthouse SEO and Performance are both >= 90.

## Failure and recovery

- **Build breaks after an edit.** Fix forward or restore that file's recorded prior content; never leave the production build red. Rollback: every change is a plain source-file edit, so restoring the recorded prior content (or the VCS state) of the touched files reverts it.
- **A check cannot run** (no deployed origin, Lighthouse or Rich Results unavailable). Mark the item blocked with the exact reason; do not claim Done while any item is unverified, and never fabricate or estimate metrics.
- **Findings conflict** (for example a thin page that is already linked). Apply the indexing policy, `noindex` plus removal from the sitemap, and record the decision; do not widen into rewriting content or redesigning pages.
- **A live hreflang set is not reciprocal.** Fix reciprocity before shipping; search engines ignore non-mutual sets, so a partial set must not ship.
- **HSTS `preload`/`includeSubDomains` requested while any subdomain lacks HTTPS.** Apply plain HSTS, refuse the effectively irreversible directives, and record why.
- **Blockers remain.** The terminal result is a blocker list with exact URLs and owner/action per item; the done predicate is never declared with failing or missing evidence.

## Output

A completed pass/fail checklist with per-check command evidence, the list of applied file changes each with recorded prior content for rollback, a recommendation-only list for findings not applied, and remaining blockers with exact URLs and owner/action. Done is claimed only when the checklist passes with sitemap, robots, and meta correct and Core Web Vitals green.
