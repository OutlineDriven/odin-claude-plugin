# korean.md — Hangul, Pretendard, Toss, Daangn

How Korean ships in production. Hangul has spaces (unlike CJ), so `word-break: keep-all` is the default; the writing system needs Latin metric matching, not vertical layout. Brand register splits cleanly: Toss (restraint, dual-API system) and Daangn (warmth, illustration). Loaded via `cjk.md` routing — `cjk.md` carries cross-CJK rules; this file carries the Korean direction.

## 1. Hangul on screen

Korean has interword spaces. Korean line-break behavior is closer to Latin than to Chinese or Japanese — but the syllable block (음절) is the atomic unit, not the character.

```css
:lang(ko) {
  word-break: keep-all;        /* break on spaces, never mid-syllable-block */
  line-height: 1.7;            /* 150-190% sweet spot per Morisawa */
  letter-spacing: 0;           /* solid setting; tracking degrades em grid */
}
```

`word-break: keep-all` is the production default (csswg-drafts/issues/4285). `break-all` on Korean prose breaks mid-word and is a slop tell (§8). Line-height 150-190% per `morisawa-usa.com/post/hangeul-typogarphy-guide`; `:lang(ko)` selector pattern lets the same stylesheet hold KR rules without an HTML lang prefix on every element.

Pretendard's metric matching to Inter — Hangul height matched to Apple SD Gothic Neo within 1% ratios, glyph height aligned to SF on the 11px Inter grid — is the reason mixed Korean + Latin runs compose without baseline drift. See `w3c.github.io/i18n-drafts/articles/typography/linebreak.en` for the spec backdrop.

## 2. Pretendard

v1.3.9 (2023-11-05). 9 weights (Thin → Black) plus a variable axis 45-920. Built on Inter (Latin) + Source Han Sans (Hangul) + M PLUS 1p (Kana). Designer: 길형진 / Kil Hyung-jin (Sandoll).

Variants:

- **Std** — Latin / Greek / Cyrillic only; smaller payload when Hangul is not needed.
- **JP** — kana / kanji 6.25% smaller than the Korean cut, for layout stability when JP runs are interleaved.
- **GOV** — Korean public-sector default since April 2024; adopted by the Korean government UI design system.

Verbatim rationale: "Hangul matched to Apple SD Gothic Neo within 1% ratios, ended 2% thinner than Source Han Sans" (cactus.tistory.com/306).

Recommended fallback chain puts `-apple-system` BEFORE Pretendard:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Pretendard',
             'Apple SD Gothic Neo', system-ui, sans-serif;
```

Reversing this order defeats the rationale on Apple OSes — Pretendard's design target is "match what Apple ships natively," so on macOS / iOS the native stack should win. (github.com/orioncactus/pretendard, fonts.adobe.com/fonts/pretendard).

## 3. Toss Design System (TDS)

Dual-API thesis: **Flat** (pre-assembled, low cognitive load) plus **Compound** (composable, high flexibility). One system, two surfaces — feature teams pick by need, not by religion.

Brand colors:

- **Toss Blue #0064FF** (PANTONE 2175 C)
- **Toss Gray #202632** (PANTONE 433 C)

Brand typeface: **Toss Product Sans** — Sandoll v1, Dotum Type v2+ since 2020. NOT Pretendard. Toss ships its own type because the brand register predates Pretendard's adoption arc.

Open-source emoji: **Tossface** (github.com/toss/tossface) — covers the gaps where Apple / Google / Twemoji read as foreign on Korean product surfaces.

2025-2026 articles (toss.tech/category/design):

- `rethinking-design-system` (Jan 2026) — dual-API thesis.
- `tds-color-system-update` — 7-year color rework.
- `persona` — de-ethnified illustration with yellow neutral skin.
- `senior-usability-research` (Dec 2024) — 7.3M users 50+. Five rules: explicit button styling required; sample-data animations confused users; instructional motion-only failed; interrogative copy ambiguous; assume non-scrolling. Quote: "당장 불편을 겪는 사람들의 문제를 해결하면, 더 많은 사람들의 잠재적인 문제까지도 해결할 수 있다" — "solve the problems of people who are currently inconvenienced, and you solve potential problems for many more."
- `toss-design-system-guide` — reduced-motion required at the component level (each component carries a "동작 줄이기" entry).
- `introducing-toss-error-message-system` — error messages "navigate forward" rather than only communicate failure.

Simplicity 25 conference theme: "Vision Driven Design."

## 4. Daangn Seed Design System

Open Apache 2.0 (github.com/daangn/seed-design). 858+ stars. Latest release 2026-04-24. Bun monorepo. Packages:

- `@seed-design/rootage`
- `@seed-design/qvism-preset`
- `@seed-design/css`
- `@seed-design/react-headless`
- `@seed-design/react`
- `@seed-design/stackflow`
- `@seed-design/figma`
- `@seed-design/mcp`

Sister repos: `daangn/seed-icon` (Figma source-of-truth) and `daangn/karrot-ui-icon`.

Brand color: **#ff6600**. Token verbatim from `seed-design.pages.dev`: `$color.palette.carrot-600` (light theme); `$color.fg.brand` resolves to `carrot-600` in light, `carrot-700` in dark.

Stackflow is Daangn's KR-mobile-first navigation primitive — stack-based screen transitions tuned for Korean second-hand-marketplace flows where deep-linking and back-stack restoration are constant. Warmth + illustration register; see `team.daangn.com/blog` for the brand voice. (github.com/daangn/seed-design).

## 5. Korean studios

Branding and editorial reference set. None of these are tutorials; they are the Korean direction artifact catalogue.

- **Studio fnt** — `studiofnt.com` (branding).
- **Ordinary People** — `ordinarypeople.info`. Clients: BTS *Proof*, Netflix K-Content, Olive Young, Leeum, SeMoCA.
- **everyday practice** — Korean Brutalist studio.
- **Shin Shin** — `shin-shin.kr`.
- **Triangle Studio** — `behance.net/TRIANGLE-STUDIO`.
- **Workroom** — Kim Hyung-jin (typography plus free-hand).
- **Sulki & Min** — `sulki-min.com` (Specter Press, institutional).
- **Ahn Graphics** — `ag.co.kr` and `agbook.co.kr` (clean editorial; the Korean publishing-design baseline).
- **Dinamo × Yoon Mingoo Favorit Hangul** — `abcdinamo.com/typefaces/favorit-hangul`. Debuted Typojanchi 2019.

Cross-references: `creativebloq.com/design/10-most-inspiring-designers-korea-today-8133940`; `letterformarchive.org/news/contemporary-design-of-south-korea`.

## 6. Korean motion / interaction

Toss restraint operationalized. Error messages "navigate forward" rather than communicating failure alone — the message is a doorway to the next action, not a status report (toss.tech/article/introducing-toss-error-message-system). Senior-research demotes motion-only instruction: seniors mimic the animation rather than read accompanying text, so the instruction must survive without the motion.

Component-guide requires a "동작 줄이기" (reduce-motion) entry per component — reduced motion is enforced at the component level, not as a global media-query escape.

Daangn's warmth + illustration register is confirmed via the Seed brand register; the carrot-600 primary plus illustrated empty-states and onboarding scenes carry tone where pure type would read cold.

## 7. Korean trends 2025-2026 (snapshot 2026-04-29; review semi-annually)

- **DS as product, not policy** — Toss Jan-2026 thesis; the design system ships, versions, and deprecates like any other product surface.
- **Universal-first as scale strategy** — Toss seniors article frames accessibility as growth, not compliance.
- **De-ethnified illustration** — yellow neutral skin tone across persona art (toss.tech/article/persona).
- **Hangul typography exploration** — "test the alphabet's limits, reshaping modular forms" (Letterform Archive).
- **Quiet cool / 무드 muted register** — Acubi-style streetwear bleeding into digital editorial (cnn.com/world/why-k-pop-idols-wear-acubi).
- **AI-tooling discourse** — Korean design discourse in 2026 dominated by Figr AI, MiroMiro, and vibe-coding pieces (yozm.wishket.com/magazine).

Citations: `toss.tech/category/design`; `letterformarchive.org/news/contemporary-design-of-south-korea`; `cnn.com/world/why-k-pop-idols-wear-acubi`.

## 8. Korean-specific anti-slop tells

- **Pretendard before `-apple-system` in fallback chain** — defeats the system-ui rationale on Apple OSes; the Pretendard maintainer recommends apple-system precedence.
- **K-pop pastel plus serif Hangul as "K-design"** — Pinterest cliché; does NOT match shipping production from Toss / Daangn / Naver / Kakao.
- **단청 (dancheong) colors as primary brand palette** — festival-seasonal cliché; absent from every major KR product DS.
- **Ignoring `word-break: keep-all`** — shipping `break-all` on Korean prose breaks mid-word; reads as "didn't set the language."

See `cjk.md §8` for cross-CJK summary and `anti-slop.md §1.9` for the integrated CJK ban-list.

## 9. Citations

Tier 1 (specifications and primary maintainers):

- `github.com/w3c/csswg-drafts/issues/4285` — `word-break: keep-all` for Korean.
- `w3c.github.io/i18n-drafts/articles/typography/linebreak.en` — line-break spec backdrop.
- `github.com/orioncactus/pretendard` — Pretendard source and release notes.
- `github.com/daangn/seed-design` — Seed Design System.
- `github.com/toss/tossface` — Tossface emoji source.

Tier 2 (vendor and design-team blogs):

- `toss.tech/article/rethinking-design-system` — dual-API thesis (Jan 2026).
- `toss.tech/article/tds-color-system-update` — color rework.
- `toss.tech/article/persona` — illustration system.
- `toss.tech/article/senior-usability-research` — Dec 2024 senior research.
- `toss.tech/article/toss-design-system-guide` — DS methodology.
- `toss.tech/article/introducing-toss-error-message-system` — error copy.
- `toss.tech/category/design` — Toss design index.
- `team.daangn.com/blog` — Daangn brand voice.
- `cactus.tistory.com/306` — Pretendard designer notes.
- `fonts.adobe.com/fonts/pretendard` — Adobe Fonts mirror.
- `morisawa-usa.com/post/hangeul-typogarphy-guide` — Morisawa Hangul guide.

Tier 3 (editorial and trend coverage):

- `letterformarchive.org/news/contemporary-design-of-south-korea` — KR studios overview.
- `creativebloq.com/design/10-most-inspiring-designers-korea-today-8133940` — KR studio set.
- `cnn.com/world/why-k-pop-idols-wear-acubi` — quiet-cool register.
- `yozm.wishket.com/magazine` — KR design discourse 2026.
