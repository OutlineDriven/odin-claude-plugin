---
name: optimise-seo
description: 'Use when asked to improve SEO or Next.js SEO, covering sitemaps, robots, meta tags, structured data, canonical URLs, hreflang, and Core Web Vitals. Audits or edits the Next.js App Router app until the SEO checklist passes, sitemap, robots, and meta tags are correct, and Core Web Vitals are green. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

1. **Bound scope before mutating.** Enumerate routes and decide index intent for each: public routes default to `index, follow`; staging, admin, thin, and private routes get explicit `noindex` (`metadata.robots` for HTML routes; `X-Robots-Tag` headers for non-HTML or whole staging environments). Record the decision per route; do not touch styling or layout. A thin page is `noindex`ed and omitted from the sitemap until it carries unique content, then indexed and linked internally.
2. **Crawl and index foundations.**
   - `app/sitemap.ts` lists every public URL as absolute URLs. Derive each `lastModified` from the freshest content date (never hardcode it; stale dates signal dead content); homepage and section-index rows use the freshest date across their children. Above 50,000 URLs, or to split by type, export `generateSitemaps()` so Next serves a sitemap index. Add `images`/`videos` entries for media that is JS-loaded or CDN-hosted and not reachable by link-following.
   - `app/robots.ts` allows `/`, disallows private paths, and links the sitemap URL.
   - Canonicals: pick one host, one casing, one trailing-slash policy; set `alternates.canonical` on every page; 308-redirect the non-canonical host unless the platform already edge-redirects (then do not duplicate the rule).
   - Redirects: permanent moves use 301/308, temporary use 302/307, pointing straight at the final URL, never chained. Every URL change ships its redirect or link equity and crawl budget are lost.
   - Status codes: a missing page returns a real 404 (a 200 with a friendly message is a soft 404 and will not index). Maintenance windows return 503 with `Retry-After`, never 200 or 404.
3. **Metadata and structured data.**
   - Unique title (50-60 chars) and unique description (150-160 chars) per page via static `metadata` or `generateMetadata`.
   - OpenGraph and Twitter Card tags on every page with a 1200x630 image (`opengraph-image.tsx` with `ImageResponse`, or a static file). Ship favicons: `favicon.ico`, `icon.svg`, `apple-touch-icon.png`.
   - JSON-LD through one `JsonLd` script component. Define each entity once with a stable `@id` (for example `https://<host>/#organization`, `/#website`, `/#person`) inside a single `@graph` emitted from the root layout or homepage; per-page schema references entities by `@id` instead of duplicating them inline. Homepage: `Organization` (with `logo`) and `WebSite`. Inner pages: `BreadcrumbList`. Where the content type matches: `Article`/`BlogPosting` (author is the `Person` `@id`, publisher is the `Organization` `@id` — never `Person` as publisher), `Product`, `FAQPage`; `ProfilePage` on identity pages such as about/now. Fill recommended fields, not only required ones: Search Console reports missing recommended fields as rich-result warnings, and warnings count as failures. JSON-LD must match visible content; mismatched markup is treated as spam and can demote the page.
4. **Semantics, internal links, and Core Web Vitals.** One h1 per page with a logical h2-h6 hierarchy; descriptive alt text on all images; internal links between related pages; every indexable page reachable from navigation, footer, or the sitemap (orphans: give them a crawl path, or `noindex` and drop them from the sitemap). Targets: LCP < 2.5s (hero image with `priority`), INP < 200ms, CLS < 0.1 (width and height on all media), TTFB < 600ms. Recompress oversized `public/` images in place, keeping filenames and formats so references stay valid; images referenced by JSON-LD serve crawlers too, so their size matters twice. Do not move indexable content behind a client-only render (`"use client"` plus a fetch in `useEffect` serves crawlers an empty shell); Server Components already render on the server.
5. **Programmatic-SEO guardrail** (any page set generated at scale, including single new pages). Validate search demand for the pattern before generating; each page needs unique value backed by defensible data, because templated text swaps are doorway pages that depress sitewide quality and indexation. Use clean subfolder URLs, hub-and-spoke linking, and breadcrumbs on every page; index only strong pages and `noindex` the long tail; monitor indexation and cannibalisation in Search Console. Stop rather than mass-generate.
6. **Internationalisation** (only when the site is multi-locale; skip otherwise). Pick one URL pattern for all locales (subdirectory by default; subdomain or ccTLD as alternatives) and keep it; optionally localise slugs. Declare `hreflang` with BCP 47 codes reciprocally: every alternate lists every other alternate including itself, plus a self-reference and `x-default`, in exactly one location — `alternates.languages` in `generateMetadata`, the XML sitemap `xhtml:link` entries, or head tags. Translate everything in the head and structured data per locale (title, description, OpenGraph with `og:locale`, JSON-LD `name`/`description`, image alt), not just the body. Never auto-redirect locale by IP geolocation or `Accept-Language`; serve the requested URL as-is and offer a dismissible locale banner instead.
7. **Technical hardening.** Via `next.config.ts` `headers()` on every HTML response: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` — add `preload`/`includeSubDomains` only once every subdomain serves HTTPS because removing them later is effectively irreversible; `Content-Security-Policy` starting at `default-src 'self'` with real origins allow-listed and nonces/hashes preferred over `'unsafe-inline'`, rolled out first as `Content-Security-Policy-Report-Only`; `X-Content-Type-Options: nosniff`; `frame-ancestors 'self'` (or trusted embedders only); `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy` disabling unused features (for example `camera=(), microphone=(), geolocation=()`). Prerequisite: HTTPS everywhere with TLS 1.2/1.3 and an HTTP-to-HTTPS redirect. Add `integrity="sha384-…"` plus `crossorigin="anonymous"` to third-party scripts and styles not controlled by the site. Cookies: `Secure`, `HttpOnly` where JavaScript does not need them, an explicit `SameSite`, and the `__Host-` prefix for session cookies. Publish `/.well-known/security.txt` with `Contact:` and `Expires:`; optionally add a DNS CAA record restricting which CAs may issue certificates for the domain. Privacy: an accurate policy; EU/UK non-essential cookies behind freely-given opt-in consent set before any cookie (no pre-ticked boxes; rejecting as easy as accepting); honour the `Sec-GPC: 1` signal; prefer aggregate cookieless analytics and minimise collected data, redacting it from logs and URLs; justify every third-party script. Resilience: custom 404/500 return correct status codes without leaking stack traces; ship `app/manifest.ts` (name, short_name, `start_url`, `display`, `theme_color`, `background_color`, icons); monitor uptime from outside your own infrastructure with the status page on a separate provider.
8. **Validate with evidence.** Copy this checklist and mark every item pass or fail, attaching command output per check:
   - Crawl and index: sitemap lists all public URLs; robots allows crawlers and links the sitemap; no unintended `noindex` on public pages; canonical set and consistent on every page; no orphan indexable pages; `lastModified` derived from content.
   - Meta: unique titles (50-60) and descriptions (150-160) per page; OpenGraph type/url/title/description/image (1200x630); Twitter card/title/description/image; favicons present.
   - Structured data: `Organization` + `WebSite` on the homepage; `BreadcrumbList` on non-homepage pages; type-matching schemas; entities share stable `@id`s in a `@graph` with no duplicates; articles use an `Organization` publisher with `logo` and a `Person` author; `ProfilePage` on identity pages; Rich Results warnings cleared, not just errors.
   - Content: single h1 with hierarchy; descriptive alt text; internal links between related pages.
   - Core Web Vitals: LCP < 2.5s with `priority` hero; INP < 200ms; CLS < 0.1 with sized media; TTFB < 600ms; no oversized `public/` images.
   - Redirects and status: 301/308 for permanent moves, no chains; real 404s; explicit `noindex`/`X-Robots-Tag` on staging, admin, and thin routes.
   - Internationalisation (multi-locale only): one URL pattern; reciprocal `hreflang` with self-reference and `x-default`; translated metadata; no IP or `Accept-Language` redirects.
   - Security: HTTPS enforced with redirect and HSTS; CSP, `nosniff`, `frame-ancestors`; `Referrer-Policy` and `Permissions-Policy`; SRI and cookie flags; `security.txt`.
   - Privacy: accurate policy; opt-in consent; GPC honoured; minimal analytics.
   - Resilience: correct 404/500 without stack traces; 503 + `Retry-After` maintenance; web app manifest.
   - Final: Lighthouse SEO >= 90; Performance >= 90; social previews render; structured data valid per URL; post-deploy Search Console coverage clean and rich-result reports warning-free.

Evidence commands for step 8:

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

## Failure and recovery
- **Build breaks after an edit.** Fix forward or restore that file's recorded prior content; never leave the production build red. Rollback: every change is a plain source-file edit, so restoring the recorded prior content (or the VCS state) of the touched files reverts it.
- **A check cannot run** (no deployed origin, Lighthouse or Rich Results unavailable). Mark the item blocked with the exact reason; do not claim Done while any item is unverified, and never fabricate or estimate metrics.
- **Findings conflict** (for example a thin page that is already linked). Apply the indexing policy — `noindex` plus removal from the sitemap — and record the decision; do not widen into rewriting content or redesigning pages.
- **A live hreflang set is not reciprocal.** Fix reciprocity before shipping; search engines ignore non-mutual sets, so a partial set must not ship.
- **HSTS `preload`/`includeSubDomains` requested while any subdomain lacks HTTPS.** Apply plain HSTS, refuse the effectively irreversible directives, and record why.
- **Blockers remain.** The terminal result is a blocker list with exact URLs and owner/action per item; the done predicate is never declared with failing or missing evidence.

## Output
A completed pass/fail copy of the step-8 checklist with per-check command evidence; the list of applied file changes, each with its recorded prior content for rollback; a recommendation-only list for findings not applied; and remaining blockers with exact URLs and owner/action. Done is claimed only when the checklist passes with sitemap, robots, and meta correct and Core Web Vitals green.

## Provenance

Adapted from `skills/optimise-seo/SKILL.md` and its four reference files (`seo-checklist.md`, `nextjs-implementation.md`, `internationalisation.md`, `technical-hardening.md`) in mblode/agent-skills at revision `e97a3b383f5944f90d41eb92b24b4fb3b917a7f9`. MIT License (`LICENSE.md`), Copyright (c) 2026 Matthew Blode; the license requires preserving the copyright notice and license text in substantial portions, which this statement provides. Mechanisms are preserved and rewritten for this self-contained form: the reference files are folded into the Procedure, per-type code patterns are condensed to their invariants, and cross-references to third-party skills were removed.
