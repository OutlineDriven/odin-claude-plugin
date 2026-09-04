---
name: press-release-writer
description: 'Use when a user asks to write or announce a press release for any occasion or region, adapting to release type and media format. Read-only. All output in chat.'
---

# Press release writer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to announce something or write a press release for any occasion or region. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only. Delivers the release, angle note, pitch, and social teasers; no writes beyond the conversation. |
| Done | Compliant release, angle note, journalist pitch email, and 3-5 social teasers, all delivered in chat. |

## Inputs

Required (ask for any missing before proceeding):

- The news facts: what happened, what changed, why now.
- Release type: product launch, funding, partnership, crisis, M&A, earnings, event, award, executive hire, open source milestone, or other.
- Target region/market: determines style guide, dateline, send timing, and cultural conventions.
- Target media format: print, digital/wire, broadcast, social, or all.
- Company info: name, what it does, HQ, key figures.

Ask if available but proceed without:

- Target audience: which journalists or outlets, trade press or general.
- Spokesperson(s): name, title, quote message.
- Supporting data: numbers, statistics, proof points.
- Embargo: date, time, timezone if applicable.
- Language: target language; defaults to English.
- **Boilerplate, press contact, multimedia assets, distribution plan**: supply if available.

## Procedure

### Stage 1: Gather context and validate newsworthiness

Extract as much as possible from any brief or document the user provides. Ask only for missing required fields. Validate that a genuine news angle exists before proceeding.

If a required field cannot be supplied, ask for it specifically. Do not fabricate data to fill gaps. Proceed with available optional fields rather than blocking on them.

### Stage 2: Identify the news angle

State the angle in one sentence. Validate it against the news values of impact, timeliness, prominence, novelty, and proximity. If the angle is weak, tell the user and suggest how to strengthen it. Do not proceed with a non-newsworthy angle.

Propose 5-10 headline options using different hook types. Vary across: data-driven, question, bold claim, contrast, human interest, urgency, counterintuitive, exclusive, local angle, problem-solution. Label each with its hook type. Ask the user which headline and hook direction they prefer before proceeding.

### Stage 3: Draft the regional, culturally-adapted press release

Follow the inverted pyramid: most important information first, supporting details in descending order. Every paragraph must be removable from the bottom without destroying the core message.

Universal structure:

```
[RELEASE DESIGNATION] FOR IMMEDIATE RELEASE / EMBARGOED UNTIL [date]
[HEADLINE] Sentence case. Core news.
[SUBHEADLINE] (optional) ~20 words. Secondary angle.
[DATELINE] -- [LEAD] Answer 5W1H in exactly 25-35 words. Count them.
[BODY 1] Expand on lead. Primary data point.
[QUOTE 1] Senior executive. Insight, not "We're thrilled."
[BODY 2] Additional context, market data.
[QUOTE 2] (optional) Third party - customer, partner, investor.
[BODY 3] (if needed) Future plans, availability, CTA.
[BOILERPLATE] About [Company]. ~100 words. Factual. No superlatives.
[MEDIA CONTACT] Name, title, email, phone.
###
```

Lead constraint: the lead paragraph must answer who, what, when, where, why, and how in exactly 25-35 words. Under 25 lacks enough information. Over 35 buries the news. Count every word.

Type-specific mandatory elements:

- Product launch: product name, one-sentence value prop, specific pricing/availability (date, regions, channels), problem it solves (quantified), 3-5 key differentiators, customer or beta quote if available.
- Funding: amount, round type, lead investor, use of funds, all in first paragraph. Investor quote, total funding to date, key metrics (ARR, users, growth), specific hiring or expansion targets.
- Partnership: both partners in headline, what it delivers to end users, scope (exclusive/geographic/time-limited), double dateline, quotes from both organizations. Verify mutual approval with user.
- Crisis: care-control-commitment framework. Lead with empathy: first sentence after dateline must express concern for those affected. Then factual description, then actions taken, then next steps with timeline. Never speculate or assign blame. Never use "no comment." Include dedicated media contact.
- Executive hire: name, title, start date, reporting line, 2-3 most relevant prior roles, strategic mandate, CEO quote, new executive quote.
- M&A: acquiring and target company, transaction value (or "undisclosed" with deal structure context), strategic rationale, impact on customers/employees/products, expected closing timeline.
- Earnings: revenue, net income/loss, EPS (current + YoY), GAAP first with non-GAAP reconciliation, guidance/outlook, key business metrics. Timing: before market open or after close, never during trading hours.
- Event: event name, date(s), location (physical address or virtual platform), registration/ticket info with link and pricing, key speakers, target audience, agenda highlights.
- Award: award name, granting organization, criteria/category, why significant (selectivity/prestige). Only newsworthy if from a credible third party.
- Open source milestone: project name, version, what changed, adoption metrics (stars, downloads, contributors, dependents), key technical improvements with benchmarks, community acknowledgment by name/handle, link to changelog and migration guide. Zero marketing language.

Region conventions:

| Region | Style guide | Dateline format | Optimal send window | Key no-gos |
|---|---|---|---|---|
| US | AP | `CITY, State (Month Day, Year) --` | Tue-Thu, 10 AM-2 PM ET | Monday AM inbox overload, Friday PM, during trading hours for earnings |
| UK/Ireland | PA Media | `CITY, [Day] [Month] [Year] --` | Tue-Thu, 10 AM-2 PM GMT/BST | Bank holidays, Friday PM, overselling (understatement preferred) |
| France | AFP | `CITY, le [day] [month] [year] --` | Tue-Thu, 10h-12h CET | August (vacances), promotional language, ASCII guillemets (use Unicode with non-breaking spaces) |
| Germany/DACH | dpa | `CITY, [Day]. [Month] [Year] --` | Tue-Thu, 10:00-12:00 CET | Marketing language, missing mandatory image, Bruckentage |
| Spain | EFE | `CITY, [day] de [month] de [year] --` | Tue-Thu, 10:00-13:00 CET | Siesta hours (14-16h), August |
| Italy | ANSA | `CITY, [day] [month] [year] --` | Tue-Wed, 10:00-12:00 CET | August entirely (especially Ferragosto), Friday PM |
| Nordics | TT/NTB/Ritzau/STT | `CITY, [Day] [Month] [Year] --` | Tue-Thu, 09:00-11:00 CET | Midsummer week (late June), July, Christmas-New Year, self-promotion (Jante Law) |
| Eastern Europe | National agencies | `CITY, [Day] [Month] [Year] --` | Tue-Thu, 09:00-12:00 CET | National holidays, Easter/Christmas periods |
| Middle East (Gulf) | WAM/SPA | `CITY, Country (Month Day, Year) --` | Sun-Thu, 09:00-12:00 GST | Friday-Saturday weekend, Ramadan hours, missing Arabic version for domestic media |
| Latin America | EFE-influenced | `CITY, [day] de [month] de [year] --` | Tue-Thu, 10 AM-1 PM local | Using Spain Spanish for LatAm markets, Carnival/Semana Santa/year-end |
| East Asia (China) | Xinhua | `CITY (Month Day, Year) --` | Mon-Fri, 09:00-11:00 CST | Chinese New Year (1-2 weeks), Golden Week (Oct 1-7), simplified vs traditional Chinese mix-up |
| East Asia (Japan) | Kyodo/Jiji | `CITY, Month Day, Year --` | Mon-Thu, 10:00-15:00 JST | Golden Week, Obon (mid-Aug), year-end, ignoring kisha clubs |
| East Asia (South Korea) | Yonhap | `CITY, Month Day (Yonhap) --` | Mon-Thu, 10:00-14:00 KST | Chuseok, Lunar New Year, ignoring Naver/Daum placement |
| Southeast Asia | Mixed | `CITY (Month Day, Year) --` | Tue-Thu, 09:00-12:00 local | Ramadan/Eid, Songkran, Tet, assuming one release fits all ASEAN markets |
| South Asia | PTI/APP | `CITY (Month Day, Year) --` | Tue-Thu, 10:00-13:00 IST | Diwali week, Holi, major cricket tournaments |
| Australia/NZ | AAP | `CITY (Month Day, Year) --` | Tue-Thu, 10 AM-1 PM AEST | Dec-Jan holiday lull, tall poppy syndrome (excessive self-promotion) |
| Africa | Mixed/AP/AFP | `CITY, Country (Month Day, Year) --` | Tue-Thu, 09:00-12:00 local | December-January holiday season, election periods |

Media format adaptations:

- Print: AP/AFP/PA style. High-res images with typed captions. Plan lead times: monthly magazines 4-6 months, weeklies 2-8 weeks, dailies 1-3 days.
- Digital/wire: headlines under 100 chars (65 ideal for Google SERP). 300-500 words. Include ticker symbol for public companies. Max 3 hyperlinks with descriptive anchor text. Add NewsArticle schema markup if publishing on own newsroom.
- Broadcast: write for the ear. Sentences 8-12 words max. Use contractions throughout. Attribution first ("The CEO said..." not "..., the CEO said"). Spell out abbreviations. Write out numerals. Present tense preferred. Round numbers. 150-160 words/minute; 30 seconds is about 75 words.
- Social/SMPR: modular structure. Bulleted core facts under 400 words. Each quote as standalone, tweetable passage. Pre-write 3-5 tweet variations under 280 chars. Include pre-composed social posts with suggested hashtags.
- Trade press: technical jargon expected and signals credibility. Depth over breadth. 500-700 words acceptable. Include technical specs, benchmarks, methodology. Reference industry standards and certifications.

Quality checks: every release must pass all of the following before delivery.

- [ ] Lead answers 5W1H in 25-35 words (count them)
- [ ] Total length 300-500 words (trade press: up to 700)
- [ ] Inverted pyramid respected
- [ ] Third person throughout (no "we"/"our" outside quotes)
- [ ] Active voice dominant
- [ ] No unsupported superlatives
- [ ] No banned phrases: "thrilled," "excited to announce," "proud to," "innovative," "cutting-edge," "world-class," "best-in-class," `synergy`, "disruptive," "game-changing," "revolutionary," "paradigm shift," "next-generation," "competitive pricing"
- [ ] Attribution verb is "said" (not "stated," "commented," "shared," "expressed," "noted")
- [ ] Full name + title on first reference; last name only on subsequent
- [ ] At least one concrete number or data point
- [ ] Quotes add insight, not empty enthusiasm
- [ ] Correct dateline and style guide for target region
- [ ] Boilerplate present, under 100 words
- [ ] End mark (### or -30-)
- [ ] Data beats adjectives: every claim backed by a number, source, or quote
- [ ] One page, one story: if two stories exist, write two releases

Humanize: remove AI-generated patterns (inflated language, predictable sentence rhythm, hollow transitions, formulaic structure). Preserve the headline and lead. The headline (Stage 2) and lead paragraph (5W1H in 25-35 words) were deliberately crafted for news impact. Loosening them for "naturalness" breaks the inverted pyramid and the word-count constraint.

### Stage 4: Write the angle justification note

Write one paragraph explaining why this angle was chosen and what news values it satisfies (impact, timeliness, prominence, novelty, proximity). Name the single strongest news value driving the angle.

### Stage 5: Produce the journalist pitch and social teasers

Journalist email pitch: subject line under 50 chars (60 hard max). 3-5 sentence pitch above the full release pasted in body (never as attachment). Hook types: data, trend, contrarian, exclusive, local angle, human interest, timeliness, problem-solution. Follow-up cadence: Day 0 initial, Day 2-3 first follow-up with new value, Day 5-7 second follow-up (final), then stop.

Social teasers: 3-5 social posts to amplify the announcement, each under 280 chars, each standalone and tweetable. Vary hook types across the set. Include suggested hashtags.

After delivery, offer optional next steps: distribution recommendation (optimal send day/time per region conventions table, channel mix, embargo considerations) and journalist shortlist criteria (beat, outlet type, region, recent coverage relevance).

## Failure and recovery

| Failure class | Response |
|---|---|
| No genuine news angle | Tell the user the angle is weak or non-newsworthy. Suggest how to strengthen it (different timing, different framing, additional data). Do not proceed until a valid angle exists. |
| Missing required input | Ask the user for the specific missing field(s). Do not fabricate data. Proceed once the five required inputs are supplied. |
| Missing optional input | Proceed with what is available. Flag any claims that lack supporting data and ask for numbers, sources, or proof points. Do not block on optional fields. |
| Conflicting region requirements | Ask the user to clarify the primary target region. If multiple regions are needed, produce the primary release and note that localized versions require cultural adaptation, not translation. |
| Embargo ambiguity | Confirm embargo date, time, and timezone with the user before writing. Do not assume. |
| Crisis release without legal review | Note that crisis communications require legal review before distribution. Deliver the draft with a prominent reminder that it must be reviewed by legal counsel before sending. |

## Output

A complete press release draft in the target language and region conventions, an angle justification note (one paragraph), a journalist email pitch, and 3-5 social teasers. Optional: distribution recommendation and journalist shortlist criteria. No files are written. All output is delivered as chat content.
