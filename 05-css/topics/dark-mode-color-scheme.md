<div align="center">

# Dark mode & `color-scheme`

<sub>🎨 CSS · 🟡 Medium · ⏱ 45m · `#theming`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `color-scheme` doesn't theme *your* UI — it tells the browser which way to paint the surfaces **it** controls (form controls, scrollbars, spellcheck underlines, the default page background). Without it, a dark app ships with white scrollbars and blinding input fields no matter how carefully you set your own colours.

---

## 🧠 Mental model

Dark mode is **two separate problems** that people constantly merge:

1. **Your colours** — backgrounds, text, borders you author. You own these via custom properties, media queries, or a theme attribute.
2. **User-agent surfaces** — native form controls, scrollbars, the `<input>` caret, autofill styling, the default canvas background. You can't style most of these directly; the *only* lever is `color-scheme`.

`color-scheme: light dark` says "this element can render in either scheme; use the user's preference." Set it and dark mode's native bits fall into place; forget it and you get a dark page with a light scrollbar and an unreadable date picker.

## ⚙️ How it actually works

`color-scheme` accepts `light`, `dark`, or both (order = preference). Declaring it also opts into `prefers-color-scheme` matching and makes CSS **system colors** (`Canvas`, `CanvasText`, `Field`, `ButtonFace`) resolve to scheme-appropriate values.

```css
:root { color-scheme: light dark; } /* supports both, follows the OS */
```

The modern payoff is the **`light-dark()`** function, which picks one of two values based on the *used* colour scheme — killing the media-query duplication:

```css
:root { color-scheme: light dark; }
body {
  background: light-dark(#fff, #111);
  color:      light-dark(#111, #eee);
}
```

`light-dark()` only works when `color-scheme` resolves to `light` or `dark` — it's inert under `normal`, which is why the declaration is mandatory.

For app theming you have three strategies, and the robust setup combines them:

- **`prefers-color-scheme` media query** — respects the OS, but can't express a *manual* user override without duplicating rules.
- **A `[data-theme]` attribute** — enables a manual toggle (light/dark/system).
- **`light-dark()` + `color-scheme`** — the terse value-level switch.

## 💻 Code

The production pattern: OS default, manual override, native surfaces handled, no flash.

```html
<!-- Runs BEFORE first paint to avoid a flash of the wrong theme -->
<script>
  const t = localStorage.theme ?? 'system';
  document.documentElement.dataset.theme = t;
</script>
```

```css
:root { color-scheme: light dark; }                 /* system default */
:root[data-theme='light'] { color-scheme: light; }  /* manual overrides */
:root[data-theme='dark']  { color-scheme: dark; }

body {
  background: light-dark(#ffffff, #0d1117);
  color:      light-dark(#1a1a1a, #e6edf3);
}
/* native controls + scrollbars now match automatically thanks to color-scheme */
```

## ⚖️ Trade-offs

- **`light-dark()` is the cleanest option but requires `color-scheme` to be declared** and offers only two branches — a media-query or attribute approach scales better if you have three-plus themes or brand variants.
- **The media-query-only approach can't do a manual override** without duplicating every rule under a class. If users must be able to force a theme regardless of OS, you need the attribute layer.
- **Transitioning colours on theme switch looks slick but flashes** during the swap; many teams disable transitions for the duration of the toggle, then re-enable.

## 💣 Gotchas interviewers probe

- **Forgetting `color-scheme` entirely** — the classic. Your colours are perfect but the scrollbar, checkbox, and date input are still light. This is the single detail that separates "themed" from "actually dark."
- **Flash of incorrect theme (FOUC).** If JS reads `localStorage` *after* first paint, users see a flash of the default theme. Fix it with a **blocking inline script** in `<head>` that sets the attribute before the body renders.
- **`light-dark()` is inert without `color-scheme`.** It quietly does nothing (falls back oddly) if the scheme resolves to `normal`.
- **`only light` / `only dark`** prevents the browser from ever overriding — occasionally needed, usually a mistake because it ignores user preference.
- **Respect the OS by default.** Forcing dark and ignoring `prefers-color-scheme` on first load is a UX (and interview) red flag — the OS pref is the sensible default; the toggle is the override.
- **The `<meta name="color-scheme">` tag** sets the scheme before CSS loads, avoiding a white flash on the very first paint.

## 🎯 Say this in the interview

> "I treat dark mode as two problems. My own colours I handle with custom properties or `light-dark()`, but the browser-controlled surfaces — scrollbars, form controls, the default background — only respond to `color-scheme`, so declaring `color-scheme: light dark` on the root is non-negotiable; without it a dark page has a white scrollbar and unreadable inputs. For the theme itself I default to the OS via `prefers-color-scheme` but layer a `[data-theme]` attribute so users can force a choice. The bug I always guard against is the flash of the wrong theme: I set the attribute in a tiny blocking script in the head, before first paint, rather than after hydration. And I'll reach for `light-dark()` to avoid writing every rule twice, remembering it only works once `color-scheme` is set."

## 🔗 Go deeper

- [web.dev — Improved dark mode with `color-scheme`](https://web.dev/articles/color-scheme) — why native surfaces need it.
- [MDN — `light-dark()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) — the value-level switch and its dependency on `color-scheme`.
- [MDN — `prefers-color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) — reading the OS preference.
