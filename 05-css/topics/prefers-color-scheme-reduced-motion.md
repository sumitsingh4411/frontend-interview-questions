<div align="center">

# `prefers-*` (color-scheme, reduced-motion)

<sub>🎨 CSS · 🟡 Medium · ⏱ 30m · `#a11y` `#modern`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The `prefers-*` media features expose **OS-level user preferences** — dark mode, reduced motion, higher contrast, less transparency — so CSS can honour people's accessibility settings. `prefers-reduced-motion` isn't polish: for users with vestibular disorders, large motion can cause literal nausea.

---

## 🧠 Mental model

Most media queries ask about the *viewport*. The `prefers-*` family asks about the *user*. The operating system holds each person's appearance and accessibility settings, and these media features let CSS read them so the page adapts to the human, not just the screen size.

The key shift for `prefers-reduced-motion`: motion is **opt-out by default and should be opt-in in your code**. The default state is `no-preference`, so your animations run unless you explicitly stand them down when the user has asked for less motion.

## ⚙️ How it actually works

The features you'll actually use:

| Feature | Values | Use |
|---|---|---|
| `prefers-color-scheme` | `light` \| `dark` | theme selection |
| `prefers-reduced-motion` | `no-preference` \| `reduce` | disable large motion |
| `prefers-contrast` | `no-preference` \| `more` \| `less` | boost/soften contrast |
| `prefers-reduced-transparency` | `no-preference` \| `reduce` | drop blur/translucency |

The crucial nuance on reduced motion: **`reduce` does not mean "remove all motion."** It means "cut the *vestibular-triggering* motion" — parallax, large slides, spins, zoom. Instant state feedback (a subtle opacity change, a checkbox tick) can and should stay; nuking every transition makes an interface feel broken and *hurts* usability.

There are two authoring postures. The blunt one is a global guard; the better one animates only when motion is welcome:

```css
/* Opt-in posture: only animate when the user hasn't asked to reduce */
@media (prefers-reduced-motion: no-preference) {
  .card { transition: transform .3s; }
}
```

And JS-driven motion (WAAPI, `requestAnimationFrame`, GSAP) is **not** covered by a CSS media query — you must check the preference in script too.

## 💻 Code

The safe global guard — note the deliberate non-zero duration:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;   /* NOT 0ms — see gotchas */
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```js
// JS animations must check the pref themselves — CSS can't stop them
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
if (!reduce.matches) startParallax();
reduce.addEventListener('change', (e) => (e.matches ? stopParallax() : startParallax()));
```

```css
@media (prefers-contrast: more) {
  :root { --border: #000; --fg: #000; } /* firmer edges for low-vision users */
}
```

## ⚖️ Trade-offs

- **`reduce` ≠ remove everything.** Keep essential, small, functional motion; kill decorative, large, or looping motion. Stripping *all* transitions can make state changes feel like bugs.
- **The global reset is a safety net, not a strategy.** It's a great backstop, but thoughtful per-component handling (swap a slide for a fade, a spin for an instant state) is a better experience than blanket-killing everything.
- **These are hints you must act on, not automatic.** The browser gives you the signal; if you don't write the media query, nothing happens.

## 💣 Gotchas interviewers probe

- **Setting `transition-duration: 0` (not `0.01ms`) can break code that waits on `transitionend`.** With a true zero, some engines never fire the event, so JS that resolves a promise on `transitionend` hangs forever. A near-zero duration keeps the event firing.
- **The default is `no-preference` — animation runs unless you opt out.** Assuming "off by default" is wrong.
- **JS animations ignore the CSS media query.** `requestAnimationFrame` loops and WAAPI keep running; you must gate them with `matchMedia`.
- **`matchMedia(...).addEventListener('change', ...)`** lets you react when the user toggles the setting *while the page is open* — not just at load.
- **`prefers-reduced-motion` also implies `scroll-behavior`** — smooth-scroll can itself be nauseating; reset it to `auto` in the guard.

## 🎯 Say this in the interview

> "The `prefers-*` media features let CSS read OS-level user settings — dark mode, reduced motion, contrast — so the page adapts to the person, not just the viewport. For reduced motion the important nuance is that `reduce` doesn't mean 'no motion', it means cut the vestibular triggers — parallax, big slides, spins — while keeping small functional feedback, because stripping every transition actually makes an app feel broken. I usually ship a global guard as a backstop but handle key components individually. Two details I'm careful about: I set the guard's duration to `0.01ms` rather than `0`, because a true zero can stop `transitionend` from firing and hang JS that awaits it; and I re-check the preference in JavaScript for any WAAPI or rAF animation, since a CSS media query can't stop those."

## 🔗 Go deeper

- [web.dev — `prefers-reduced-motion`](https://web.dev/articles/prefers-reduced-motion) — why it matters and how to apply it well.
- [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — values and the `matchMedia` bridge.
- [MDN — `@media` user-preference features](https://developer.mozilla.org/en-US/docs/Web/CSS/@media#user_preference_media_features) — the full `prefers-*` family.
