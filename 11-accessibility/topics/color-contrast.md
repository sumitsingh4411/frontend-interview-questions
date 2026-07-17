<div align="center">

# Color contrast

<sub>♿ Accessibility · 🟢 Easy · ⏱ 30m · `#color` `#wcag`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Text must clear a **4.5:1** contrast ratio against its background (3:1 for large text); UI parts and graphics must clear **3:1**. The ratio is computed from *relative luminance*, not the colours you'd eyeball — which is why "it looks fine on my monitor" is not evidence.

---

## 🧠 Mental model

Contrast is not "how different do these two colours look" — it's a **measured ratio of light**. WCAG defines it as `(L1 + 0.05) / (L2 + 0.05)`, where `L` is each colour's *relative luminance* (a weighted, gamma-corrected mix of R, G, B that models how bright the human eye perceives it). The result runs from **1:1** (identical) to **21:1** (pure black on pure white).

The consequence that trips people up: **luminance is dominated by green and barely touched by blue.** So two colours that feel equally "saturated and bold" — say a mid-green and a mid-blue — can have wildly different luminance, and pure yellow on white fails badly while looking vivid. You cannot judge contrast by vibrancy or by how "strong" a colour feels; only the luminance maths tells the truth. That's the whole reason we use tools instead of eyes.

## ⚙️ How it actually works

The AA thresholds, which you should be able to recite:

| Content | AA | AAA |
|---|---|---|
| Normal text (< 18.66px / < 24px) | **4.5:1** | 7:1 |
| Large text (≥ 24px, or ≥ 18.66px bold) | **3:1** | 4.5:1 |
| UI components & meaningful graphics (1.4.11) | **3:1** | — |

Three subtleties separate a real answer from a memorised one:

- **"Large text" has a precise definition** — ≥ 24px (18.66pt) regular, or ≥ 18.66px (14pt) **bold**. Bold lowers the pixel threshold because thicker strokes read more easily. It's not "headings are exempt".
- **1.4.11 Non-text Contrast (WCAG 2.1)** extends the 3:1 rule to things that aren't text: input borders, the checked state of a checkbox, icon buttons, chart segments you must distinguish. A form field whose only border is a faint 1.5:1 grey line *fails* even if the label text passes.
- **Placeholder text and disabled controls.** Placeholder text *does* need 4.5:1 (it conveys info), which is why the default light-grey placeholder usually fails. Genuinely *disabled* controls are exempt from contrast — but "greyed out to look inactive while still usable" is not disabled, and does need to pass.

Contrast is calculated on the **rendered pixels**, so text over a photo, a gradient, or a semi-transparent overlay is measured at the worst point — anti-aliasing and `opacity` are baked in.

## 💻 Code

Don't reason about contrast in your head — compute it, ideally at token level:

```js
// Relative luminance per WCAG, then the ratio. This is the actual formula.
const lum = ([r, g, b]) => {
  const f = (c) => (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); // green dominates
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
ratio([117, 117, 117], [255, 255, 255]); // #757575 on white → 4.54  (passes AA)
ratio([153, 153, 153], [255, 255, 255]); // #999    on white → 2.85  (FAILS)
```

Modern CSS lets you *guarantee* contrast instead of hand-tuning:

```css
/* Automatically pick black or white text for max contrast on --bg. */
.chip {
  background: var(--bg);
  color: oklch(from var(--bg) clamp(0, (0.6 - l) * 1000, 1) 0 0); /* progressive-enhancement approach */
}
/* Or the emerging, purpose-built keyword: */
.chip { color: contrast-color(var(--bg)); } /* limited support — feature-detect */
```

Never ship colour as the *only* signal — that's a different criterion (1.4.1) contrast can't satisfy:

```css
/* ❌ error state = red text only. Invisible to many colour-blind users. */
.error { color: #d00; }
/* ✅ colour + icon + text weight. Redundant encoding. */
.error { color: #b00020; font-weight: 600; }
.error::before { content: "⚠ "; }
```

## ⚖️ Trade-offs

- **Brand colours vs the threshold — the recurring fight.** A brand's signature light-blue on white often lands at ~2.5:1. The right move is a *dedicated accessible text token* (darker than the brand fill) rather than weakening the criterion; use the bright brand colour for large display type or non-text where 3:1 applies.
- **AAA (7:1) is real but heavy.** It genuinely helps low-vision users, but hitting 7:1 site-wide forces near-black-on-white everywhere and flattens visual hierarchy. Target AA globally; apply AAA to long-form body text where the payoff is highest.
- **The WCAG 2.x formula is imperfect** — it's known to be too lenient on dark backgrounds and too strict on some mid-tones. **APCA** (the algorithm proposed for WCAG 3) models perception better, but 2.x AA is the *legal* standard today. Design to AA; treat APCA as a sanity check, not the pass/fail.

## 💣 Gotchas interviewers probe

- **"What's the AA ratio?"** 4.5:1 normal text, 3:1 large text and UI/graphics. Blanking on the numbers — or giving one number for everything — is the tell.
- **Large text is defined by size, not by being a heading.** ≥ 24px regular / ≥ 18.66px bold. And bold lowers the threshold.
- **1.4.11 is the forgotten criterion.** Icon-only buttons, input borders, focus indicators, and chart colours all need 3:1. Passing text contrast while the UI chrome fails is a real, common miss.
- **Placeholders and low-opacity "hint" text usually fail** — and they carry meaning, so they're not exempt. Truly disabled controls *are* exempt.
- **Contrast ≠ colour independence.** Meeting 4.5:1 does nothing for colour-blindness if colour is the *only* differentiator; that's 1.4.1, needing icon/text/pattern redundancy.
- **You can't eyeball it.** Luminance is green-weighted and gamma-corrected; vivid ≠ high-contrast. Always measure.

## 🎯 Say this in the interview

> "Contrast is a measured luminance ratio, not a vibe — WCAG computes it from relative luminance, which is heavily green-weighted, so you genuinely can't judge it by how bold a colour looks. The AA bar is 4.5:1 for normal text, and it drops to 3:1 for large text, which is precisely defined as 24 pixels regular or about 18.7 bold. The criterion people forget is 1.4.11, non-text contrast: icon buttons, input borders, focus rings, and chart segments all need 3:1, so you can pass on your body text and still fail on the UI chrome. When a brand colour won't clear the bar, I don't lower the bar — I add a darker accessible text token and reserve the bright colour for large or non-text use. And contrast never covers colour-blindness on its own, so I encode state with an icon or text too, not colour alone. I verify with a tool at the token level, because eyeballing is unreliable."

## 🔗 Go deeper

- [web.dev — Colour and contrast accessibility](https://web.dev/articles/color-and-contrast-accessibility) — thresholds, tooling, and the perceptual why.
- [WebAIM — Contrast checker](https://webaim.org/resources/contrastchecker/) — paste two colours, get the ratio and pass/fail per level.
- [W3C — Understanding SC 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) — the normative definition, including "large text".
- [W3C — Understanding SC 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) — the 3:1 rule for UI and graphics.
