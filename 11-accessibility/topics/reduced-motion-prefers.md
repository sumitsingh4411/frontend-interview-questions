<div align="center">

# Reduced motion & `prefers-*`

<sub>♿ Accessibility · 🟡 Medium · ⏱ 30m · `#motion`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `prefers-reduced-motion` is a media query that surfaces an OS-level accessibility setting: some users get **motion sickness, migraines, or vertigo** from parallax, zoom, and big transitions. Honour it by **reducing** motion (cross-fade instead of fly-in), not deleting all of it — and treat it as one of a family of `prefers-*` queries that let the OS drive your UI.

---

## 🧠 Mental model

Motion on screen isn't neutral. For users with **vestibular disorders**, large-scale movement — parallax scrolling, elements zooming in, content sliding across the viewport — can trigger genuine physical symptoms: nausea, dizziness, disorientation. It's the same mechanism as motion sickness in a car. The OS lets these users flip a switch ("Reduce motion" on macOS/iOS, "Show animations" off on Windows/Android), and `prefers-reduced-motion: reduce` is the browser handing you that switch.

The key nuance — the one that separates a thoughtful answer from a rote one — is that "reduced" is **not** "none". The goal isn't a dead, static page; it's removing the *vestibular triggers* (movement across distance, scaling, spinning) while keeping motion that only conveys state without travel — an opacity cross-fade, a subtle colour change. Killing every transition can actually harm usability by removing feedback. Reduce the *nauseating* motion, keep the *informative* motion.

## ⚙️ How it actually works

`prefers-reduced-motion` has two states: `no-preference` (the default) and `reduce`. There's a strategic choice in how you wire it:

- **Opt-out (subtract motion):** animate by default, then strip it inside `@media (prefers-reduced-motion: reduce)`. Simple to bolt onto an existing site, but every *new* animation you add is a trigger until you remember to guard it.
- **Opt-in (add motion):** author the page static, then *add* animation only inside `@media (prefers-reduced-motion: no-preference)`. Safer by construction — motion is opt-in, so anything you forget to wrap simply doesn't move. This is the senior default.

Because the media query is exposed to JS via `matchMedia`, you gate **JavaScript-driven** motion too — `ScrollTrigger`, `requestAnimationFrame` loops, `scrollIntoView({ behavior: 'smooth' })`, canvas/WebGL animation. CSS-only guarding misses all of those.

The wider `prefers-*` family, all OS-driven, all worth knowing:

| Query | Reflects | Typical response |
|---|---|---|
| `prefers-reduced-motion` | Vestibular / motion-sickness setting | Cut travel/scale animation |
| `prefers-color-scheme` | Light vs dark mode | Theme the UI |
| `prefers-contrast` | Increased/reduced contrast | Bump contrast, thicken borders |
| `prefers-reduced-transparency` | Dislikes translucent layers | Make overlays opaque |
| `prefers-reduced-data` | Data-saver on | Skip heavy media/fonts |

## 💻 Code

Opt-in — the robust default. Motion only exists when the user hasn't asked to reduce it:

```css
.card {                      /* static baseline — safe for everyone */
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: no-preference) {
  .card {                    /* motion is ADDED, never assumed */
    animation: slide-in 400ms ease-out;
  }
}
```

Retrofitting an existing site — strip travel, keep a gentle fade:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;   /* effectively off, but still fires */
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;        /* kill smooth-scroll travel */
  }
}
```

Gate JS-driven motion — CSS alone can't touch these:

```js
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

function scrollToTop() {
  // Respect the setting: no smooth-scroll travel for reduced-motion users.
  window.scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
}

// Preferences can change live — react without a reload.
reduce.addEventListener('change', updateAnimations);
```

## ⚖️ Trade-offs

- **Reduce, don't obliterate.** A blanket `animation: none !important` is a common over-correction — it also removes loading spinners and state-change feedback, which help *all* users. Swap distance/scale motion for a fade; keep motion that carries meaning.
- **Opt-in vs opt-out is a real decision.** Opt-in (`no-preference`) fails safe — forget to wrap something and it just stays still. Opt-out is faster to retrofit but leaves every un-guarded animation as a live trigger. New work should be opt-in.
- **When NOT to disable:** motion that's *essential* to understanding — a progress indicator, a genuinely necessary transition. WCAG exempts motion "essential" to the functionality; use judgement rather than nuking everything.

## 💣 Gotchas interviewers probe

- **"Reduced" ≠ "none".** The strongest signal is knowing you keep *informative* motion and only strip the *vestibular* triggers — travel, zoom, parallax, spin.
- **CSS guarding alone misses JS animation.** `matchMedia('(prefers-reduced-motion: reduce)')` is required for GSAP, rAF loops, and `scrollIntoView({ behavior: 'smooth' })`. Forgetting this is the most common gap.
- **`scroll-behavior: smooth` is motion too** — long smooth-scrolls are a documented trigger and must be gated.
- **The preference can change at runtime** — listen for `change` on the `MediaQueryList` so a user toggling the OS setting sees the effect immediately.
- **Don't ship animation-heavy UX with reduced-motion as an afterthought.** Parallax and scroll-jacking are exactly what these users need to escape; retrofitting a guard rarely covers every path.
- **`prefers-reduced-motion` is distinct from `prefers-reduced-data`** — the latter is about bandwidth, not vestibular safety. Different intent, different response.

## 🎯 Say this in the interview

> "`prefers-reduced-motion` exposes an OS setting for users who get motion sickness or vertigo from large on-screen movement — parallax, zoom, big slide transitions. I honour it, but the important nuance is that reduced isn't none: I strip the motion that *travels or scales*, which is what triggers symptoms, and keep motion that only conveys state, like a cross-fade or a spinner, because that helps everyone. My default is opt-in — I build the page static and add animation inside `@media (prefers-reduced-motion: no-preference)`, so anything I forget to wrap simply doesn't move. I also gate JavaScript-driven motion with `matchMedia`, since CSS can't touch a GSAP timeline or `scrollIntoView` smooth-scroll, and I listen for changes so toggling the OS setting takes effect live. It's part of a family — `prefers-color-scheme`, `prefers-contrast`, `prefers-reduced-data` — that lets the OS drive the UI."

## 🔗 Go deeper

- [web.dev — prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion) — the canonical guide, with the reduce-don't-remove framing.
- [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — states, syntax, and the `matchMedia` bridge.
- [WCAG — 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) — the requirement and the "essential" exemption.
- [MDN — Using media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries) — the full `prefers-*` family in context.
