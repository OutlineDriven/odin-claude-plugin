# cjk.md — cross-CJK direction-shaping ref

Cross-locale direction-shaping for CJK surfaces — locale tagging, Pan-CJK font selection, shared typography rules, and the cross-CJK slop tells. Per-locale depth lives in `korean.md`, `japanese.md`, `chinese.md`.

This file is loaded only via the SKILL.md routing table — per-locale references do not backlink here. A reader needing cross-CJK guidance re-enters via SKILL.md.

## 1. When this loads

- User mentions Chinese / Japanese / Korean content.
- Multilingual or i18n surface includes a CJK locale.
- Vertical writing (`writing-mode: vertical-rl`) or ruby/furigana annotation in scope.
- Pan-CJK font selection — picking a single font that ships across SC / TC / HK / JP / KR.

## 2. Posture

Direction-shaping, not tutorial. Surface the rules a CJK surface has to commit to before a single line of CSS lands; the per-locale fan-out below carries the production trend depth (DS landscape, studios, glyph specifics). Load this file when content is CJK in any flavor; route into a single locale file when the surface is single-locale.

## 3. Locale tagging

BCP 47 / RFC 5646 script subtags drive locale-aware font fallback. The tag the document declares is what the browser uses to pick the right Source Han / Noto build at the same Unicode codepoint:

- `zh-Hans` — Simplified Chinese (Mainland, Singapore).
- `zh-Hant` — Traditional Chinese (Taiwan, Hong Kong, Macau); regional variants `zh-Hant-HK` and `zh-Hant-TW` differ in shaping rules.
- `ja` — Japanese; script subtag rarely needed (Japanese composition mixes hiragana + katakana + kanji).
- `ko` — Korean; `ko-Hang` and `ko-Kore` exist but are rare in production.

Set `lang` on `<html>` and override per-element via `:lang(ja)` selectors when one document mixes locales (w3.org/International/articles/language-tags).

## 4. Pan-CJK font families

Noto Sans/Serif CJK and Source Han Sans/Serif are the same project, dual-branded by Google and Adobe. Latest **2.005 (2025-06-18)** ships five sub-families — SC / TC / HK / JP / KR — covering the full Unified CJK + Extension A-G ranges (github.com/notofonts/noto-cjk; github.com/adobe-fonts/source-han-sans).

Variable axis since 2021 — single-axis `wght` 100-900 replaces seven static cuts (blog.adobe.com/en/publish/2021/04/08/source-han-sans-goes-variable).

File-size facts that decide deployment:

- Pan-CJK static set (all five sub-families × seven weights): **~593 MB**.
- Variable OTC bundle (all five sub-families, single file): **~32.9 MB**.
- Single-locale variable subset (e.g. JP-only WOFF2): **~4.1 MB**.

Subset to the locale; never ship the full Pan-CJK package over the wire.

## 5. System fonts per platform

| Platform | SC | TC | HK | JP | KR |
|---|---|---|---|---|---|
| macOS / iOS | PingFang SC | PingFang TC | PingFang HK | Hiragino Sans | Apple SD Gothic Neo |
| Windows 11 | Microsoft YaHei UI | Microsoft JhengHei UI | Microsoft JhengHei UI | Yu Gothic UI / Meiryo | Malgun Gothic |
| Android | Noto Sans CJK SC | Noto Sans CJK TC | Noto Sans CJK TC | Noto Sans CJK JP | Noto Sans CJK KR |
| Linux | Noto Sans CJK (varies by distro) | Noto Sans CJK | Noto Sans CJK | Noto Sans CJK | Noto Sans CJK |

PingFang and Hiragino are non-redistributable; reach for them via the system stack, not as webfonts (support.apple.com/HT211240; learn.microsoft.com/typography/fonts/windows_11_font_list).

## 6. Cross-CJK typography rules

Line-height runs **+0.1em above the Latin equivalent** — Material's M1 rule. Body land at **1.5-1.9**; Latin's 1.4-1.6 reads cramped on CJK because square character frames need more leading than proportional Latin (m1.material.io/style/typography).

Letter-spacing **0** for CJK body. Latin tracking degrades the em-grid composition CJK depends on; reach for OpenType `palt` instead of `letter-spacing` when proportional metrics matter.

No italic. CJK has no traditional italic style — synthetic italic warps square character frames. Emphasize via `text-emphasis` (傍点 / wángzhì marks) or weight (w3.org/TR/css-text-decor-3).

Critical OpenType features for CJK composition:

| Tag | Effect |
|---|---|
| `palt` | Proportional Alternate Widths — proportional metrics for CJK in horizontal text. |
| `halt` | Alternate Half Widths — half-width CJK punctuation in horizontal flow. |
| `vpal` | Proportional Alternate Vertical Metrics — proportional metrics in vertical text. |
| `vert` | Vertical Alternates — substitutes vertical-form glyphs in `vertical-rl`. |
| `hwid` / `fwid` | Half / Full Widths — force width form for ASCII or punctuation. |

(learn.microsoft.com/typography/opentype/spec/featurelist)

## 7. Locale-specific glyph variation

Han Unification means a single Unicode codepoint renders different glyph shapes across SC / TC / HK / JP / KR — the font's `locl` table swaps the regional form based on `lang`. Examples at the **same** codepoint: **U+9AA8** (骨) — top component flips orientation between SC and JP; **U+76F4** (直) — middle stroke configuration differs SC vs JP; **U+9EC4** (黄) — internal proportions differ SC vs JP. Separately, semantically equivalent characters often have **distinct codepoints** across regions — 边 U+8FB9 (SC) / 邊 U+908A (TC) / 辺 U+8FBA (JP) are three encoded characters, not one codepoint with three glyphs. Both axes matter: pick the right codepoint at content time, then let `lang` + `locl` pick the right regional glyph at render time (en.wikipedia.org/wiki/Han_unification).

JP build of Source Han / Noto rendering on SC content is the **primary cross-CJK slop tell** — the wrong-locale font surfaces immediately to native readers via 直 / 骨 / 黄 stroke shapes (blogs.adobe.com/CCJKType).

Pretendard JP variant ships kana and kanji **6.25% smaller** than the Korean cut — preserves layout stability when JP and Korean text alternate at the same `font-size` (github.com/orioncactus/pretendard).

## 8. CJK anti-slop summary

Two-sided: technical defaults that betray no thought, plus the cliché register that pattern-matches "Asian" without shipping a single CJK product surface.

**Technical tells** — Latin letter-spacing applied to CJK; synthetic italic on CJK; wrong-locale font (JP build on SC content); default Tailwind / `system-ui` stack with no CJK fallback; auto-hyphenation enabled (does nothing for CJK — "didn't think about it" tell); Pretendard before `-apple-system` in the fallback chain (defeats Pretendard's own system-matching rationale).

**Cliché tells** — sakura petals + washi textures + hinomaru-red as primary (JP); red+gold Lunar New Year palette as primary brand (CN); calligraphy fonts as body text (CN); ink-wash backgrounds as decoration (CN); K-pop pastel + serif Hangul as "K-design" (KR); 단청 (dancheong) palette as primary brand (KR).

→ See `anti-slop.md §1.7` for the cross-CJK surface-level summary, and `korean.md §8` / `japanese.md §9` / `chinese.md §10` for language-specific deep treatment.

## 9. Per-locale routing

- `korean.md` — Hangul typography + Pretendard ecosystem + Toss / Daangn Seed + KR studios + KR 2026 trends + KR-specific anti-slop.
- `japanese.md` — jlreq + vertical text + ruby + BudouX + SmartHR / Mercari / freee / Cybozu / Goodpatch + JP studios + JP 2026 trends + JP-specific anti-slop.
- `chinese.md` — clreq + PingFang / HarmonyOS / MiSans / OPPO Sans + Ant Design 6 / X / TDesign / Arco + Mini Program constraints + ICP regulatory + ZCool four-pillar 2026 trends + CN-specific anti-slop.

## 10. Citations

Tier-1 anchors:

- W3C clreq — Chinese requirements (w3.org/TR/clreq).
- W3C jlreq — Japanese requirements (w3.org/TR/jlreq).
- W3C klreq — Korean requirements (w3.org/TR/klreq).
- CSS Writing Modes Level 3 (w3.org/TR/css-writing-modes-3).
- CSS Text Level 3 (w3.org/TR/css-text-3).
- CSS Ruby Level 1 (w3.org/TR/css-ruby-1).
- CSS Text Decoration Level 3 (w3.org/TR/css-text-decor-3).
- W3C i18n language tags (w3.org/International/articles/language-tags).
- Microsoft OpenType feature registry (learn.microsoft.com/typography/opentype/spec/featurelist).
