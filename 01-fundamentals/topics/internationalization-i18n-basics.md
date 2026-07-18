<div align="center">

# Internationalization (i18n) basics

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 45m · `#i18n`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — i18n is not "swap the strings" — it's designing so that locale (language, plurals, number/date format, currency, text direction, collation) is *data* you pass in, never something you hardcode. The browser ships a whole formatting engine, `Intl`, so you almost never format these things by hand.

---

## 🧠 Mental model

Split two words that get conflated. **Internationalization (i18n)** is the *engineering*: making the app locale-agnostic so any locale can plug in. **Localization (l10n)** is the *content*: the actual translations and locale data. You do i18n once, in code; l10n happens N times, mostly outside code.

The senior framing: **a locale is not a language.** It's a BCP-47 tag like `en-US`, `en-GB`, `pt-BR`, `ar-EG` that bundles language *plus* region *plus* conventions. `en-US` and `en-GB` share a language but disagree on dates (`3/4` = March 4th vs April 3rd), spelling, and units. Treating "language" as the unit of localization is the classic junior mistake.

Everything locale-dependent is therefore an **input**, not a constant: number grouping, decimal separators (`1,000.5` vs `1.000,5`), currency placement, plural rules, sort order, and — the one people forget — **text direction**.

## ⚙️ How it actually works

The core insight: **do not concatenate translated fragments, and do not format numbers/dates yourself.** Both break in ways you can't see in your own locale.

**Plurals aren't `count === 1 ? 'item' : 'items'`.** That's English chauvinism baked into code. Arabic has *six* plural categories; Polish has three with non-obvious rules. `Intl.PluralRules` tells you which CLDR category (`zero`/`one`/`two`/`few`/`many`/`other`) a number falls into for a locale; your message catalog supplies a variant per category (ICU MessageFormat is the standard for this).

**Interpolation, not concatenation.** `"You have " + n + " messages"` is untranslatable — other languages reorder subject, verb, and object. The unit of translation must be the *whole sentence with named placeholders*: `"{count, plural, one {# message} other {# messages}}"`.

**`Intl` is the workhorse and it's built in:**

- `Intl.NumberFormat` — grouping, decimals, currency, units, percent, compact notation (`1.2M`).
- `Intl.DateTimeFormat` — locale-correct dates/times *and* time zones.
- `Intl.RelativeTimeFormat` — "3 days ago" / "in 2 hours" without a library.
- `Intl.Collator` — locale-aware sorting (in Swedish `ö` sorts after `z`; `String.prototype.localeCompare` uses this).
- `Intl.ListFormat`, `Intl.PluralRules`, `Intl.Segmenter` (grapheme/word/sentence boundaries).

**Direction is layout, not text.** For Arabic/Hebrew/Farsi the whole UI mirrors. Set `<html dir="rtl" lang="ar">` and build with CSS **logical properties** (`margin-inline-start`, not `margin-left`) so the layout flips for free instead of needing an RTL stylesheet.

## 💻 Code

```js
// ❌ Hardcoded formatting — correct only in en-US, silently wrong elsewhere
const price = '$' + amount.toFixed(2);              // wrong symbol, separator, placement
const label = count + (count === 1 ? ' file' : ' files'); // English-only plural + word order

// ✅ Let Intl own the locale rules
new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
  .format(1234.5);                                   // "1.234,50 €"

new Intl.NumberFormat('en-IN').format(1234567);      // "12,34,567"  (Indian grouping!)

new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long', timeZone: 'Asia/Tokyo',
}).format(new Date());                               // "18 July 2026"

new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
  .format(-1, 'day');                                // "ayer"

// ✅ Plurals the right way
const pr = new Intl.PluralRules('pl-PL');
pr.select(2);   // "few"  — Polish, would be "other" naive
pr.select(5);   // "many"

// ✅ Locale-aware sort (not raw code-point comparison)
['ä', 'z', 'a'].sort(new Intl.Collator('sv').compare); // ['a','z','ä'] in Swedish
```

`Intl.*` constructors are **expensive** — memoize them. Creating a formatter per render is a real, measurable jank source in lists.

## ⚖️ Trade-offs

- **Reach for `Intl` before any library.** For formatting, `date-fns`/`moment`/custom number code are mostly redundant now — `Intl` is native, zero-KB, and CLDR-backed. You still want a *runtime* (react-intl, i18next, FormatJS) for message catalogs, loading, and ICU parsing.
- **When NOT to fully i18n:** an internal dashboard for one English-speaking team doesn't need a translation pipeline — but *do* still use `Intl` for numbers/dates, because that's nearly free and future-proofs you.
- **Translation keys vs. English-as-key.** Semantic keys (`checkout.button.pay`) survive copy edits; English-string keys read better in code but churn every time marketing tweaks a word. Pick keys for anything long-lived.
- **Bundle cost is real.** Ship only the active locale's messages (dynamic import per locale), not all 30 at once.

## 💣 Gotchas interviewers probe

- **"How do you pluralize?"** If the answer is `n === 1`, that's the fail signal. The right answer names `Intl.PluralRules` / CLDR categories and mentions languages with >2 forms.
- **String concatenation is untranslatable.** Word order differs across languages; the whole sentence is the unit, with named placeholders.
- **`.toLocaleString()` uses the *runtime's* locale by default** — different on the server vs. the user's browser, causing hydration mismatches in SSR. Always pass the locale explicitly.
- **Text length explodes.** German runs ~30% longer than English; layouts that fit English clip or overflow. Design flexible, never fixed-width, for labels.
- **RTL is more than `direction`.** Icons (arrows, chevrons), progress bars, and even some number formats mirror. Logical CSS properties handle layout; assets you handle manually.
- **Locale ≠ timezone ≠ language.** A user in Tokyo may want a US-English UI with JPY currency and JST times. Keep the three axes independent.
- **`Intl` formatter creation is slow** — cache instances; don't `new` them in a hot loop.

## 🎯 Say this in the interview

> "I separate internationalization — the engineering to make the app locale-agnostic — from localization, which is the actual translations. The key mental shift is that a locale is a BCP-47 tag bundling language, region, and conventions, so `en-US` and `en-GB` are different locales even though they share a language. In code I never hardcode formatting or concatenate translated fragments: number and date formatting go through the built-in `Intl` APIs — `NumberFormat`, `DateTimeFormat`, `RelativeTimeFormat`, `Collator` — and messages are whole sentences with named placeholders using ICU MessageFormat, so plurals are driven by `Intl.PluralRules` and CLDR categories rather than a `count === 1` check, which is wrong in most languages. I also treat direction as layout: `dir="rtl"` plus CSS logical properties so RTL locales mirror for free. Two gotchas I watch for: `toLocaleString` defaulting to the runtime locale and causing SSR hydration mismatches, and `Intl` constructors being expensive enough to need memoizing."

## 🔗 Go deeper

- [MDN — `Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) — every formatter, with options and browser support.
- [MDN — `Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules) — CLDR plural categories and why `n===1` is wrong.
- [Unicode CLDR — Plural Rules](https://cldr.unicode.org/index/cldr-spec/plural-rules) — the data behind every locale's plural and format rules.
- [web.dev — Building RTL-aware layouts](https://web.dev/learn/css/logical-properties) — logical properties and mirroring done right.
- [FormatJS / ICU MessageFormat](https://formatjs.io/docs/core-concepts/icu-syntax/) — the standard syntax for translatable messages with plurals and interpolation.
