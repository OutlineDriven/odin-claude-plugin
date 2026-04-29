# chinese.md — clreq, PingFang, Ant Design 6, Mini Programs

How Chinese ships in production. Mainland is mobile-first to a degree no other major market matches (CNNIC 99.4%); the design system landscape is dense (Ant 6 / Ant X / TDesign / Arco / Element Plus); the platform reality is fractured across Mini Programs (WeChat / Alipay / Douyin / Xiaohongshu); and the regulatory layer (ICP / 公安网备 footers) is non-optional layout. Loaded via `cjk.md` routing — `cjk.md` carries cross-CJK rules; this file carries the Chinese direction.

## 1. Chinese on screen

Chinese has no interword spaces. The atomic unit is the character square, not the syllable block (Korean) and not the morphemic word (Latin). Justification, line-break, and punctuation alignment all key off the square grid.

```css
:lang(zh) {
  text-justify: inter-character;   /* NOT inter-word — Chinese has no word spaces */
  line-break: strict;              /* kinsoku-style hanging-punctuation */
  word-break: normal;              /* or break-all for long Chinese strings */
  hanging-punctuation: allow-end;  /* cleaner punctuation alignment at line edges */
  line-height: 1.7;
  letter-spacing: 0;
}
```

`text-justify: inter-character` distributes whitespace between every character square — the only correct value for Chinese justification. `inter-word` is a no-op because there are no word spaces. `line-break: strict` triggers the kinsoku-style ban on starting a line with closing punctuation or ending one with opening punctuation. `hanging-punctuation` lets `。` and `，` hang in the margin rather than consume in-flow width. Full-width vs half-width selection is OpenType: `palt` / `halt` / `hwid` / `fwid` (developer.mozilla.org/CSS/text-justify; w3.org/TR/clreq).

## 2. Chinese fonts

Locale-correct font is non-negotiable. SC vs JP glyphs differ at identical Unicode codepoints (JIS 2004 / shinjitai vs GB18030); Source Han Sans uses OpenType `locl` to swap based on the document's `lang` attribute. JP build for SC content is the primary slop tell — visible immediately to native readers via 直 / 骨 / 黄 stroke shapes.

System and licensable families to track:

- **PingFang SC / TC / HK** — Apple / DynaComware. Six weights Ultralight → Semibold. iOS 18+ moved the system font to a private `PingFangUI.ttc` bundle (not user-installable, must use CoreText APIs). Targeting `-apple-system` resolves correctly on Apple OSes; webfont distribution is licensing-restricted.
- **Source Han Sans 2.005** (2025-06-18) — variable + 7-weight static; Latin component updated to Source Sans 3; SC / TC / HK / JP / KR sub-families. Open-source (SIL OFL), self-hostable, the safest webfont default for Chinese.
- **HarmonyOS Sans** — Huawei × Hanyi. Free commercial license. Six weights, multilingual variable font, 105 languages incl. SC / TC / Latin / Cyrillic / Greek / Arabic. The most polished 2025 Chinese release outside Source Han.
- **MiSans** — Xiaomi. Proprietary license (NOT SIL-OFL — attribution required, redistribution forbidden, license file MUST ship with any bundled subset). 10 weights, variable, 600+ language coverage across 12 sub-families.
- **OPPO Sans 4.0** — OPPO × Hanyi / Pentagram. Free commercial license. SC / TC / JP / KR.
- **Microsoft YaHei UI** — Light / Regular / Bold. Windows 11 default. Restricted to Windows; reach via system stack only.

License caveats matter: MiSans reads as SIL-OFL-shaped from a distance, ships under a proprietary EULA up close. Verify before bundling — the `chinese.md §2` license restriction is the single most-missed detail in mainland font selection. (developer.apple.com/forums/thread/758189; github.com/adobe-fonts/source-han-sans; github.com/huawei-fonts/HarmonyOS-Sans; hyperos.mi.com/font; github.com/xiaomi-fonts/MiSans).

## 3. Chinese DS landscape 2026

The densest market for design systems in CJK. Five tracked in production:

- **Ant Design 6.0** (2025-11-22) — pure CSS-variables architecture by default, React 18 floor, removed IE compat, smooth v5 → v6 migration with no codemod, Masonry component, mask-blur defaults, `zeroRuntime` opt-in. Current stable 6.3.7. The CSS-variables flip is the breaking-change story most teams notice — runtime theming, design-token interop, and theme-package authoring all change shape; `zeroRuntime` is the performance lever for SSR-heavy surfaces, removing the cssinjs runtime cost on first paint.
- **Ant Design X 2.5.0** (2026-03-31) — AGI-oriented "RICH paradigm" component set: **R**ole / **I**ntention / **C**onversation / **H**ybrid-UI. Monorepo split into `@ant-design/x` + `x-markdown` + `x-sdk`. A2UI-protocol dynamic card rendering. The most distinctive 2026 Chinese-tech artifact — the only mainstream DS framing AGI-native primitives as first-class layout, not a chat sidecar bolted onto a CRUD shell.
- **TDesign Vue Next 1.19.1** (2026-04-14) — Tencent's open DS. Added lunar calendar `cell` API for DatePicker (mainland UI is bicultural-calendar by default; Gregorian-only date pickers read as foreign), horizontal-menu auto-collapse, ChatEngine / ChatMarkdown chat primitives. Multi-framework (React / Vue / Mobile / Miniprogram).
- **Arco Design** — ByteDance enterprise system, jointly built by ByteDance GIP UED + Infra FE. React, Vue, Mobile. iF Design 2025 winner. Closer in register to Ant than to material — dense, neutral, blue-accent default; the surface defaults that ByteDance internal tools ship.
- **Element Plus 2.13.7** — Vue 3 community workhorse for Chinese SaaS; dedicated `cn.element-plus.org` mirror. Less ambitious than Ant or TDesign on tokens and theming; more familiar to teams migrating from Element UI / Vue 2.

Ant Design X is the artifact to study before shipping AI surfaces in 2026 — the RICH split anticipates the structural problem (intent capture + tool-call display + hybrid streaming) the rest of the field has not yet named. Pick by team and stack: Ant (React, enterprise breadth), TDesign (multi-framework, Tencent-platform integration), Arco (React / Vue, ByteDance lineage), Element Plus (Vue community baseline). (github.com/ant-design/ant-design/issues/55804; ant.design/docs/react/introduce; ant-design-x.antgroup.com/changelog; github.com/Tencent/tdesign-vue-next/releases; arco.design; element-plus.org).

## 4. Mini Program design constraints

Mini Programs are a parallel app store — WeChat / Alipay / Douyin / Xiaohongshu each run their own ecosystem, increasingly own e-commerce and transactional flows, and ship their own platform design rules. Tencent's T1 spec (developers.weixin.qq.com/miniprogram/en/design) is the most-cited reference and the rules generalize:

- **Bottom tab bar** — 2 to 5 tabs; 4 recommended.
- **Capsule menu (upper-right)** — non-customizable except for two color schemes; layout must respect its position.
- **Hit targets** — 7-9 mm physical (not pixel) targets.
- **Type** — system fonts only; type scale 22 / 17 / 15 / 14 / 12 pt.
- **Color** — system-supplied colors; brand accent restricted in chrome.
- **Navigation** — must always show the user's location plus a return path.

The platform owns the chrome; the surface owns the body. Designing a Mini Program as if it were a free-canvas web page is the slop tell.

## 5. Chinese form patterns

Phone-first auth dominates. WeChat / Alipay / Baidu / Weibo / Douyin / QQ / Bilibili all gate registration on +86 SIM SMS OTP — email-first signup reads as foreign and gets abandoned. International phone-number support is opt-in; the default surface assumes mainland numbers.

Practical defaults: phone field at the top, country code defaulting to +86, SMS OTP arriving in 30-60 s with a visible resend countdown, no email field above the fold. Email-as-primary-identifier is a Western-product transplant; a Chinese-product surface puts email behind "Other ways to sign in" if it surfaces it at all.

Real-name verification (实名认证) is a regulatory-driven UX layer. ID-card OCR upload is required for finance, gaming time-limit compliance (anti-addiction), and content publishing. The flow is its own screen, not an inline modal — surface it as a dedicated state with passport / ID-card / driver's-license fallbacks. Camera-capture-then-confirm is the dominant pattern; manual key-in is a fallback, not a default.

## 6. Mobile-first reality

CNNIC 57th report (Dec 2025) snapshot:

- **1.125 B internet users**; 80.1% national penetration.
- **99.4% access via mobile**.
- Generative-AI users **602 M** (+141.7% YoY, 42.8% penetration).
- Average mobile session **7.97 hr/day**.

The 99.4% number is the design constraint — mainland mobile-first is not "mobile-first plus desktop fallback"; it is "mobile-only in practice for most surfaces." Desktop web is increasingly a marketing-and-account surface; the transactional path lives in the app or Mini Program. (english.www.gov.cn/archive/statistics/202602/05/content_WS698442cac6d00ca5f9a08edc.html).

## 7. Regulatory layout requirements

ICP and PSB filing badges occupy real estate in the footer. They are not branding decisions; they are legal-compliance layout that has to be reserved before the surface designs around them.

- **ICP备案** — mandatory for any commercial site served from mainland infrastructure. Footer must hyperlink to `https://beian.miit.gov.cn/`. Format: `京ICP备12345678号` (province prefix + ICP number).
- **公安网备** (PSB) — Public Security Bureau filing. Requires a clickable badge that links to the Ministry of Public Security record.
- **Reserved footer real estate** — both badges sit on the same footer line; surface designs that crop the footer for "minimalism" break the legal layer.

International teams routinely under-budget the footer; the footer is the regulatory surface, not a typographic afterthought. (tmogroup.asia/insights/china-icp-license; appinchina.co/blog/the-complete-guide-to-china-icp-filing-traffic-compliance).

## 8. Chinese trends 2025-2026 (snapshot 2026-04-29; review semi-annually)

**ZCool 2025-2026 China Design Trends Report — four pillars**:

- **十雅 (refined-quiet)** — restrained palettes, generous whitespace, editorial-Chinese register.
- **宝藏角落 (treasure-corner discovery)** — surfaces that reward exploration; small-scale, high-density spotlight content.
- **数字寒武纪 (Digital Cambrian)** — AI / multimodal explosion; generative tooling moves from experiment to production.
- **共生关系 (symbiosis)** — human-machine collaboration framed as continuous, not transactional.

ZCool's palette prediction: gradient + verdigris + iridescent gains across 2026 packaging and digital surfaces.

**UISDC 2025 visual trends**: AI-driven generation tooling, VR / spatial UI (Vision Pro influence), motion as core (not decoration), Lo-Fi anti-AI counter-aesthetic, oversized typography, Chinese-aesthetic revival via cultural confidence (not orientalist cosplay). The Lo-Fi counter-aesthetic and the Chinese-aesthetic revival point in the same direction — surfaces that betray a human hand and a cultural memory, distinct from the Pan-Pacific neutral-modern register that AI tooling collapses everything toward.

Sspai (`sspai.com`) publishes the most active Chinese-language product / tooling discourse — the closest analogue to Yozm Wishket (Korea) or Goodpatch's blog (Japan). Read sspai for what mainland practitioners are arguing about; read ZCool for what packaging and visual-design teams are predicting; read UISDC for the cross-section. (zcool.com.cn/article/ZMTYyNDU3Mg==; uisdc.com/2025-visual-design-trend; sspai.com).

## 9. Chinese color signatures

- **Alipay** — core blue **#0E9DEC**, deep blue **#003C8B**. (loading.io/color/feature/Alipay).
- **WeChat** — logo green ≈ **#7BB32E** (lime-green, not the saturated kelly-green Pinterest renders). (schemecolor.com/wechat.php).
- **Bilibili pink** **#FB7299** — widely cited but not Tier-1 brand-guide verified. Med confidence.
- **Xiaohongshu red** **#FF2442** — widely cited but not Tier-1 brand-guide verified. Med confidence.

Confidence flag matters because Bilibili and Xiaohongshu are the two brands most likely to be cited in a "Chinese-product" mood board; the values circulate through third-party color sites without a primary brand-guide anchor. Use as direction reference, not as authoritative spec.

## 10. Chinese-specific anti-slop tells

- **Red+gold "Lunar New Year palette" as PRIMARY brand color** — seasonal-promo cliché, never default brand identity. Alipay / WeChat / Bilibili ship blue / green / pink registers; red+gold appears as seasonal layer only.
- **Calligraphy fonts as body text** — illegible at small sizes; reads as theme-park branding, not product surface.
- **Ink-wash backgrounds as decoration** — editorial-China cosplay; absent from every major shipping product DS.
- **Dragon / phoenix iconography as branding** — same register failure.
- **Wrong-locale font: JP-locale Source Han Sans on SC content** — primary slop tell. Use SC subset or `lang="zh-Hans"` + `locl` feature.
- **Traditional-Chinese (TC / HK) font on Simplified content** — jarring stroke shapes for mainland users.
- **Full-width punctuation `。 ，` mishandled in mixed CJK / Latin lines** — PingFang and Source Han ship proper half-width variants via OpenType `halt` / `hwid`; failing to engage them leaves visible gaps after punctuation in mixed runs.

See `cjk.md §8` for the cross-CJK summary and `anti-slop.md §1.9` for the integrated CJK ban-list.

## 11. Citations

Tier 1 (specifications and primary maintainers):

- `w3.org/TR/clreq` — Chinese requirements.
- `developer.mozilla.org/CSS/text-justify` — `text-justify` specification.
- `developer.apple.com/forums/thread/758189` — PingFang iOS 18 private packaging.
- `github.com/adobe-fonts/source-han-sans` — Source Han Sans 2.005 (2025-06-18).
- `github.com/huawei-fonts/HarmonyOS-Sans` — HarmonyOS Sans source.
- `github.com/xiaomi-fonts/MiSans` — MiSans source and license.
- `github.com/ant-design/ant-design/issues/55804` — Ant Design 6.0 release note.
- `english.www.gov.cn/archive/statistics/202602/05/content_WS698442cac6d00ca5f9a08edc.html` — CNNIC 57th statistical report (gov.cn release).

Tier 2 (vendor and platform documentation):

- `ant.design/docs/react/introduce` — Ant Design 6 docs.
- `ant-design-x.antgroup.com/changelog` — Ant Design X 2.5.0 changelog.
- `github.com/Tencent/tdesign-vue-next/releases` — TDesign Vue Next 1.19.1.
- `arco.design` — Arco Design (ByteDance).
- `element-plus.org` — Element Plus mirror.
- `hyperos.mi.com/font` — MiSans license terms.
- `developers.weixin.qq.com/miniprogram/en/design` — Tencent T1 Mini Program spec.
- `tmogroup.asia/insights/china-icp-license` — ICP filing overview.
- `appinchina.co/blog/the-complete-guide-to-china-icp-filing-traffic-compliance` — ICP / PSB compliance guide.

Tier 3 (editorial and trend coverage):

- `zcool.com.cn/article/ZMTYyNDU3Mg==` — ZCool 2025-2026 four-pillar trend report.
- `uisdc.com/2025-visual-design-trend` — UISDC 2025 visual trends.
- `sspai.com` — Chinese-language product / tooling discourse.
- `loading.io/color/feature/Alipay` — Alipay color reference.
- `schemecolor.com/wechat.php` — WeChat color reference.
