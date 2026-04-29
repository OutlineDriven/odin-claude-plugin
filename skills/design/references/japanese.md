# japanese.md — JP locale production reference

Japanese-locale production reference for product UI. Loaded via `cjk.md` routing — language-specific deep treatment beyond the cross-CJK summary.

Two halves with different review cadences. **Stable spec layer** (§1 on-screen rules, §3 vertical/ruby reality, §4 BudouX, §6 form patterns, §9 anti-slop tells) tracks W3C / OpenType / library APIs — review on spec or library bumps only. **Drift layer** (§2 fonts, §5 DS landscape, §7 studios, §8 trends) — snapshot 2026-04-29; review semi-annually.

## 1. Japanese on screen

Japanese has no inter-word spaces; line wrapping and justification differ from Latin defaults. Honor the kinsoku shori rules and let the engine handle ruby + tate-chu-yoko via spec-defined CSS.

| Property | Value | Use for |
|---|---|---|
| `line-break` | `strict | normal | loose | auto` | Kinsoku shori — forbids closing brackets/full stops at line start, opening brackets at line end. `strict` matches print-quality JIS rules; `auto` is the modern SaaS default. |
| `word-break` | `normal` (default), `break-all` (override) | JP has no spaces; `normal` lets the engine break inside a kanji-kana run already. Reach for `break-all` only when long Latin / number runs overflow narrow columns — it can over-break mixed Latin/digit content. `keep-all` (Korean default) breaks JP layout. |
| `text-justify` | `auto` | JP justification distributes across the kanji grid; `inter-word` is meaningless. |
| `text-combine-upright` | `all` | Tate-chu-yoko (横中縦) — horizontal Latin/digit run inside vertical text. Required for vertical-rl editorial layouts. |
| `ruby` element + `<rt>` | native HTML | Furigana over kanji; let the browser size and align. Avoid manual offset hacks. |

Hiragino weight mapping varies by browser on macOS — Chromium and Safari resolve `font-weight: 600` to different physical Hiragino cuts (open issue 2025). Test the target weights on both engines before locking type tokens.

Kinsoku characters worth knowing: `line-break: strict` adds 、 。 ー ぁぃぅぇぉっゃゅょゎ to the "no line-start" set and 「『（〈《〔 to the "no line-end" set. `loose` allows hanging small kana — useful for narrow mobile columns where strict kinsoku would push too aggressively. Cite (w3.org/TR/jlreq), (jeffreyfrancesco.org/weblog/2025022801).

## 2. Japanese fonts

**Noto Sans JP became Windows-shipped April 2025** via Windows Update — eliminates the historical Yu Gothic vs Meiryo split, viable cross-platform default for the first time. Subsetting still mandatory: ~1.6MB per cut un-subset. Use `unicode-range` partitioning on JP/Latin/punctuation slices; Google Fonts ships the JP subset.

| Family | Coverage | Weights | Notes |
|---|---|---|---|
| Hiragino Sans | macOS / iOS system | W0-W9 (10 cuts) | Default JP system stack on Apple OSes. Hiragino Mincho ProN W3/W6 ships alongside for serif. |
| Yu Gothic UI | Windows 11 system | Light / Semilight / Regular / Semibold / Bold | Windows JP system default; bundled with Windows 11. |
| Noto Sans JP | webfont (Adobe / Google) + Windows-shipped Apr 2025 | 9 weights | First viable cross-platform default. ~1.6MB per cut → subsetting mandatory. |
| LINE Seed JP | webfont (open) | 5 weights | SIL OFL 1.1; kana + kanji + Latin. (seed.line.me) |
| IBM Plex Sans JP v1.3 | webfont (Adobe Fonts + Google Fonts) | 7 styles | Jun 2025; 6,355 kanji + kana; OFL. Shares metrics with Plex Sans for mixed JP/Latin runs. |

Klim Söhne JP and Geist JP do NOT exist as of 2026 — flag any claim otherwise as slop. Söhne is Latin-only (klim.co.nz/fonts/soehne). Vercel's Geist family ships Latin + Cyrillic + Greek only.

System stack template (cross-platform JP product UI):

```css
font-family: "Hiragino Sans", "Yu Gothic UI", "Noto Sans JP",
             system-ui, sans-serif;
```

Order: Apple system → Windows system → webfont fallback → generic. SmartHR ships system-only and is the documented exemplar of the "no webfont" register; reach for Noto Sans JP / LINE Seed / IBM Plex Sans JP only when a brand voice requires the deviation. Cite (labrid.jp/post-1140), (ics.media/entry/200317), (bloomstreet.jp/best-japanese-font-setting-for-websites), (seed.line.me/index_en.html), (fonts.google.com/specimen/IBM+Plex+Sans+JP).

## 3. Vertical text & ruby production reality

Vertical-rl (`writing-mode: vertical-rl`) production usage 2026 is concentrated in editorial / literary sites and EPUB tooling — NOT product UI. Aozora Bunko (aozora.gr.jp) — the canonical JP public-domain text archive — ships horizontal HTML; vertical rendering is offloaded to client readers (Yom!, TATEditor) that re-flow the source on their side.

Aozora ruby format `漢字《ふりがな》` is the de-facto JP digital-text spec consumed by every major reader; it predates HTML5 `<ruby>` and remains the source-format canonical. When converting Aozora source to web HTML, parse `《》` to `<ruby>kanji<rt>furigana</rt></ruby>` — the browser handles sizing.

EPUB 3 ships first-class `writing-mode: vertical-rl` support; JP EPUB readers (BookLive, Kindle JP, Kobo JP) all render vertical correctly. The cost surface is web-product UI specifically — not the underlying spec.

For product UI: use `vertical-rl` only when the surface explicitly mimics print editorial (literary publication, museum signage tooling). Mixing horizontal product chrome with vertical body text creates a writing-mode boundary the user must cross visually; the cost rarely earns the editorial register.

Set `lang="ja"` on the document root (or per-element when content mixes locales). The browser uses BCP 47 to select the correct OpenType `locl` variant when CJK fonts ship multi-locale glyph alternates — without `lang`, Source Han Sans / Noto Sans CJK can resolve a JP page to PRC simplified glyphs, producing the 直 / 骨 / 黄 mismatch documented in §9.

Shueisha "Jump TOON" (2025) launched as Webtoon-style vertical-scroll horizontal layout — NOT CSS `vertical-rl`. This is the dominant 2025+ manga-on-web pattern: long-strip horizontal panels, finger-scroll consumption. Print manga's right-to-left page turn does not translate to mobile web; Shueisha shipped the Webtoon convention instead. Cite (aozora.gr.jp), (w3c.github.io/i18n-drafts/articles/vertical-text), (animehunch.com/shueisha-to-launch-vertical-reading-manga-service).

## 4. BudouX line-break library

Google project, ~15KB ML model, v0.8.2 (Apr 2026), Python / JS / Java bindings. Inserts zero-width-space breakpoints based on phrase-level segmentation — replaces brittle `<br>` placement and over-eager `word-break: break-all`.

Adobe.com is a confirmed BudouX production user — replaced AEM's JP line-breaking pipeline. Chrome 119+ ships BudouX-style segmentation natively via `<wbr>`-equivalent break opportunities, reducing the need to ship the JS for Chromium audiences.

BudouX output wraps phrases in `<wbr>` tags or zero-width-space (ZWSP) characters; pair with `word-break: keep-all` on the wrapper element to let the engine break only at the BudouX-inserted opportunities. The CSS pairing is what makes the segmentation visible.

kuromoji.js remains the JP morphological analyzer (different job — full MeCab-style tokenization for IME / search / NLP, not line-breaking). Do not substitute. Cite (github.com/google/budoux), (gigazine.net/gsc_news/en/20231001-budoux).

## 5. JP DS landscape 2026

JP product DS landscape clusters around enterprise SaaS (HR, accounting, marketplace) and frames AI integration as the 2025-2026 axis.

| DS | Status | Signature |
|---|---|---|
| **SmartHR** | fully open (smarthr.design + github.com/kufu/smarthr-design-system) | Foundation / Basics / Accessibility / Products / Communication sections. Primary `#00c4cc` "SmartHR Blue" cyan-teal — NOT navy. Extended palettes Stone / Aqua / Sakura / Momiji / Marine / Galaxy / Earth, 4 tonal steps each. Specifies Yu Gothic system-installed only — explicit anti-pattern of webfont overuse. |
| **freee** | partially public | Vibes (Dec 2023, atom/molecule level) → **Standard UI** (2025, screen patterns) + AI verification pipeline "cutter". |
| **Mercari** | partially public | Design System 4.0 (Jun 2025) — full rebuild on Atomic Design, ~150 components, explicit "no polymorphic API" rule (ItemObject ~700 lines iOS → <30). Server-Driven UI (Dec 2025) for shipping UI without app release. |
| **Cybozu** | partially public | "Design Token + Component System" thesis (CSS Day 2025); kintone DS ships ~weekly. |
| **LINE Design System (LDS)** | partially public | Figma library + code components gated behind LINE org. |
| **Goodpatch Sparkle Design** | free DS (Jun 2025) | ~5,000 Figma duplications in 6 months. |
| **Money Forward Design** | partially public | Notion-rendered SPA. |

Mercari DS 4.0's "no polymorphic API" rule (engineering.mercari.com/en/blog/entry/20250624): the iOS `ItemObject` component cited at ~700 lines pre-rebuild is sliced per atomic component to <30 lines post-rebuild. SmartHR ships its DS open-source with Foundation / Basics / Accessibility / Products / Communication sections browsable without enterprise gating (smarthr.design). Cite (smarthr.design/basics/colors), (corp.freee.co.jp/news/20231219_design.html), (engineering.mercari.com/en/blog/entry/20250624), (engineering.mercari.com/en/blog/entry/20251214), (zenn.dev/cybozu_frontend/articles/css-day-2025), (designsystem.line.me), (goodpatch.com/blog/2025-12-reflection).

## 6. JP form patterns

Postal-code autofill is the single most distinctive JP form affordance. Zenkaku/hankaku enforcement persists in regulated sectors but flexible Unicode rendering is the modern SaaS default — convert at submit, not at input.

- **yubinbango.js** (github.com/yubinbango/yubinbango) — canonical postal-code autofill. Class-attribute API, no JS event wiring: tag the form with `class="h-adr"` and the inputs with `class="p-postal-code"` / `p-region` / `p-locality` / `p-street-address`; the library populates region + locality from the 7-digit code.
- **Japan Post Postal Code / Digital Address API** (May 2025) — official API supersedes scraping `ken_all.csv` for new builds. Use for systems that need authoritative current data; yubinbango.js still wins for static autofill cost.
- **Zenkaku/hankaku enforcement** — banking, gov, insurance JP forms require zenkaku katakana names + hankaku digits + hankaku hyphens. Modern SaaS accepts both forms at input, normalizes at submit. Forcing the user to switch IME mode mid-form is a 2010s reflex; do not ship it on a greenfield SaaS product.
- **Address composition order** — JP addresses sort largest-to-smallest (postal code → 都道府県 → 市区町村 → 町名 → 番地 → 建物名). Mirror that order in form layout; reversing for "Latin convention" is the slop tell.
- **Qualified invoice issuer registration number (適格請求書発行事業者登録番号)** — invoice / billing / tax-settings forms that issue qualified invoices under the post-Oct-2023 system capture the 13-digit issuer registration number. Validate format `T` + 13 digits at submit; surface plain-text help that explains the field rather than relying on placeholder-only labelling.

Cite (github.com/yubinbango/yubinbango), (github.com/naotsugu/jpostal), (mailmate.jp/blog/half-width-full-width-hankaku-zenkaku-explained).

## 7. JP studios

Tokyo studio cohort 2026 — agency-side AI-tooling pivot is the dominant 2025-2026 narrative.

- **Goodpatch** (goodpatch.com) — 2025 "AI-Driven Design Company" repositioning; Sparkle DS; Layermate AI tooling acquisition.
- **Takram** (takram.com) — research-led product / exhibition; Expo 2025 pavilion "Dynamic Equilibrium of Life" with 320k LEDs.
- **Concent** (concentinc.jp) — service-design + UX consultancy.
- **PARTY** (prty.jp) — creative tech / installation.
- **Nendo** (nendo.jp) — product / industrial design (Sato Oki).
- **Cinra** (cinra.net) — culture / editorial.

## 8. JP trends 2025-2026

Snapshot 2026-04-29; review semi-annually.

- **"Design × AI" pivot.** Tokyo agencies frame AI integration as the 2025-2026 axis, not a side topic. Goodpatch's monthly trends pieces consistently lead with AI tooling; freee's "cutter" pipeline and Mercari's Server-Driven UI both encode AI-as-platform assumptions.
- **JP product design reads closer to American restraint than Korean Toss.** SmartHR / freee / Money Forward ship neutral cyan / blue primaries, system fonts (Yu Gothic / Hiragino), dense forms. The register diverges from Toss's photographic-warmth "premium product" thesis — JP enterprise SaaS accepts higher information density as honesty, not as failure.
- **"Text avalanche" density still defended.** Yahoo! Japan and JP product UIs in 2025-2026 maintain the dense-link homepage pattern. Users expect transparency through detail; the Western minimalist hero-with-three-cards reads as evasive in JP context.
- **System-font register over webfont register.** SmartHR (smarthr.design) and Mercari (engineering.mercari.com/en/blog/entry/20250624) document explicit choices for system-installed JP fonts over webfont CDN delivery — the rationale is performance + reliability, not aesthetics. Webfont-only JP type signals the developer optimized for visual control over loading cost.
- **Open-source DS as employer-brand artifact.** SmartHR (kufu/smarthr-design-system), LINE (designsystem.line.me), and Goodpatch's Sparkle (goodpatch.com/blog/2025-12-reflection) ship public DS sites that double as recruiting surfaces. The pattern is documented as deliberate at Cybozu (zenn.dev/cybozu_frontend/articles/css-day-2025).

Cite (goodpatch.com/blog/2025-12-reflection), (icrossborderjapan.com/en/blog/website-design/japanese-web-design-trends), (smarthr.design), (engineering.mercari.com/en/blog/entry/20250624), (designsystem.line.me), (zenn.dev/cybozu_frontend/articles/css-day-2025).

## 9. JP-specific anti-slop tells

Every tell below is verified absent from at least one of the major JP product DS rosters in §5.

- **Sakura petals as decoration.** Sakura / momiji as palette names is fine — SmartHR uses both as named extended-palette steps — but as a decorative element on the hero is the slop. Verified absent from SmartHR / freee / Mercari / Cybozu / Money Forward / LINE shipping product surfaces.
- **Washi paper textures as background.** Editorial cosplay; absent from every major JP product DS.
- **Hinomaru-red as primary brand.** Absent from every major JP product DS verified. Mercari ships red `#FF0211` but as accent on a neutral surface, not as Hinomaru patriotic register.
- **Wrong-locale font.** SC font on JP content is measurable through 直 / 骨 / 黄 glyph forms — JP shinjitai diverges from PRC-style simplified at identical Unicode codepoints. Use `lang="ja"` + Source Han Sans JP (or Noto Sans JP) — never SC build on JP content.
- **Synthetic italic on CJK.** jlreq emphasizes square character frames as a fundamental design principle; CSS `font-style: italic` slants the glyph grid and breaks the kanji silhouette. Use `text-emphasis` or weight contrast for emphasis instead.
- **Auto-hyphenation enabled on JP content.** `hyphens: auto` does nothing for JP — the engine has no hyphenation dictionary for kanji-kana. Shipping it signals the developer copied a Latin-default config without inspection.
- **Letter-spacing applied to CJK.** JP composes on the em grid; `letter-spacing` degrades the compose; reach for OpenType `palt` / `halt` (proportional-alternate / half-width) to tighten Latin-style instead.
- **`<br>`-inserted line breaks for "looking pretty".** Brittle, breaks on viewport changes. Use BudouX (§4) or accept the engine's natural break — never hand-place `<br>` in JP body copy.

## 10. Citations

All URLs verified against shipping pages 2026-04-29.

Tier-1 (W3C / vendor / official):
- (w3.org/TR/jlreq) — JP layout requirements spec
- (w3c.github.io/i18n-drafts/articles/vertical-text) — vertical-text article
- (smarthr.design/basics/colors) — SmartHR DS colors
- (engineering.mercari.com/en/blog/entry/20250624) — Mercari DS 4.0 rebuild
- (engineering.mercari.com/en/blog/entry/20251214) — Mercari Server-Driven UI
- (corp.freee.co.jp/news/20231219_design.html) — freee Vibes announcement
- (designsystem.line.me) — LINE Design System
- (github.com/google/budoux) — BudouX
- (github.com/yubinbango/yubinbango) — yubinbango.js
- (github.com/naotsugu/jpostal) — jpostal
- (seed.line.me/index_en.html) — LINE Seed JP
- (fonts.google.com/specimen/IBM+Plex+Sans+JP) — IBM Plex Sans JP
- (klim.co.nz/fonts/soehne) — Söhne (negative finding: no JP cut)
- (aozora.gr.jp) — Aozora Bunko
- (zenn.dev/cybozu_frontend/articles/css-day-2025) — Cybozu DS thesis
- (goodpatch.com/blog/2025-12-reflection) — Goodpatch 2025 reflection

Tier-2 (industry / community):
- (labrid.jp/post-1140), (ics.media/entry/200317) — Noto Sans JP Windows shipping
- (bloomstreet.jp/best-japanese-font-setting-for-websites) — JP font setting guide
- (jeffreyfrancesco.org/weblog/2025022801) — Hiragino weight mapping issue
- (gigazine.net/gsc_news/en/20231001-budoux) — BudouX coverage
- (animehunch.com/shueisha-to-launch-vertical-reading-manga-service) — Jump TOON launch
- (mailmate.jp/blog/half-width-full-width-hankaku-zenkaku-explained) — zenkaku/hankaku
- (icrossborderjapan.com/en/blog/website-design/japanese-web-design-trends) — JP web design trends
