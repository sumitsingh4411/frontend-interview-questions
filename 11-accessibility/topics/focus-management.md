<div align="center">

# Focus management

<sub>♿ Accessibility · 🔴 Hard · ⏱ 1h · `#focus`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Focus is a **single, page-wide cursor** for keyboard and screen-reader users. When your JavaScript changes what's on screen — routing, opening a panel, deleting a row — you must move that cursor deliberately, because the browser's fallback (dumping focus on `<body>`) strands the user at the top of the page with no context.

---

## 🧠 Mental model

There is exactly **one** focused element at any moment — `document.activeElement`. For a keyboard or screen-reader user, that single point *is* their position in the app; it's where the next keystroke goes and, for a screen reader, roughly where their attention sits. A mouse user can glance anywhere. A keyboard user can only perceive and act on **where focus is**.

Static pages manage focus for you: `Tab` walks the DOM and everything stays coherent. **Single-page apps break that contract.** When you swap a route, the URL and the pixels change but focus doesn't move — it clings to the link that was clicked, or, if that link unmounts, collapses to `<body>`. Either way the user's cursor and the new content are in different places. Focus management is the discipline of keeping that one cursor pointed at the thing that just became relevant.

## ⚙️ How it actually works

The rule of thumb: **whenever you remove, replace, or reveal significant content, decide where focus should land — don't leave it to the browser.** The browser's default is hostile:

- **Removing the focused element** (deleting the row whose button had focus) sends focus to `<body>`. The user's cursor evaporates; `Tab` restarts from the top of the document.
- **Client-side route changes** don't move focus at all. A screen-reader user hears nothing announced and has no idea the page changed.

To move focus onto something that isn't natively interactive — a heading, a container, a newly-rendered view — you make it programmatically focusable with `tabindex="-1"` and call `.focus()`. `-1` (not `0`) is deliberate: the node becomes a valid `.focus()` target **without** being inserted into the `Tab` sequence as a permanent dead stop.

Three canonical moves:

1. **Route change** → focus the new page's `<h1>` (or a `<main tabindex="-1">`). The screen reader announces the new heading; the keyboard cursor is at the top of the *new* content.
2. **Open a dialog/menu** → move focus *into* it (first field, or the dialog itself).
3. **Close it, or delete an item** → **return focus** to the control that triggered the change, or to the nearest sensible neighbour. Never let it fall to `<body>`.

The senior detail is `:focus-visible`. Programmatic `.focus()` used to force an ugly ring on mouse users, so people removed focus outlines entirely — a catastrophe for keyboard users. `:focus-visible` fixes this: the browser shows the ring only when focus arrived via keyboard (or heuristically "needs" it), so you can style *it* instead of the blunt `:focus`, and never `outline: none` without a replacement.

## 💻 Code

```js
// ❌ Delete the row and walk away. Focus falls to <body>;
//    the keyboard user is teleported to the top of the page.
function removeRow(row) { row.remove(); }

// ✅ Decide the next home for focus BEFORE the element vanishes.
function removeRow(row) {
  const next = row.nextElementSibling?.querySelector('button')
            ?? row.previousElementSibling?.querySelector('button')
            ?? listHeading;              // last resort: a stable anchor
  row.remove();
  next.focus();                          // the cursor never dies
}
```

```js
// SPA route change: move focus to the new view's heading so the
// screen reader announces it and the keyboard cursor is in the right place.
function onRouteChange() {
  const h1 = document.querySelector('main h1');
  h1.setAttribute('tabindex', '-1');     // focusable by script, not a tab stop
  h1.focus();
  // Optional: h1.addEventListener('blur', () => h1.removeAttribute('tabindex'), { once: true });
}
```

```css
/* ❌ Nukes the ring for EVERYONE, including keyboard users. */
:focus { outline: none; }

/* ✅ Keep it for keyboard focus; suppress the flash for mouse clicks. */
:focus-visible { outline: 2px solid CanvasText; outline-offset: 2px; }
```

## ⚖️ Trade-offs

- **Move focus decisively, but never *steal* it.** Yanking focus on a background event (a toast, a poll completing) rips the user out of what they were doing. Announce those with a live region instead; reserve focus moves for changes the user just initiated.
- **On route change, heading-vs-`main` is a judgement call.** Focusing `<h1>` gives the best announcement; focusing `<main tabindex="-1">` puts the cursor above all the content so `Tab` starts clean. Many teams do both — focus `main`, which contains the heading.
- **When NOT to intervene:** in-place updates that don't relocate the user (editing a field's own value, a spinner appearing beside the button). Over-managing focus is as disorienting as under-managing it.

## 💣 Gotchas interviewers probe

- **"What happens to focus when its element is deleted?"** It goes to `<body>` — a dead end. Knowing this, and pre-selecting the next target, is the whole skill.
- **`.focus()` needs a focusable target.** Calling it on a plain `<div>` does nothing; you must add `tabindex="-1"` first. Silent no-op that trips people up.
- **Never `outline: none` without `:focus-visible`.** Removing the focus ring is one of the most common and most damaging a11y regressions.
- **`autofocus` fires only on initial page load,** not on client-side navigation — SPAs must manage focus manually every route.
- **`scrollIntoView` on focus:** `.focus()` scrolls by default; pass `{ preventScroll: true }` when you're handling scrolling yourself to avoid a double-jump.
- **`document.activeElement` is your debugging lifeline** — log it to see where the cursor actually is versus where you think it is.
- **Focus inside `display:none` is impossible;** if you hide the focused element via CSS, focus silently drops to `<body>` — the same trap as removal.

## 🎯 Say this in the interview

> "I treat focus as a single page-wide cursor that *is* the keyboard and screen-reader user's position. The browser only manages it for static pages, so any time my JavaScript relocates the user — a route change, opening a panel, deleting the focused row — I move focus deliberately, because the default is to dump it on `<body>` and strand them at the top with nothing announced. My tools are `tabindex='-1'` plus `.focus()` to send focus to something non-interactive like a heading, and always returning focus to the triggering control when I close something. The two rules I hold: move focus for changes the user *initiated*, but never steal it for background events — those get a live region — and never remove the focus outline without `:focus-visible`, so keyboard users keep their ring while mouse users don't get the flash."

## 🔗 Go deeper

- [MDN — Keyboard-navigable JavaScript widgets](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets) — focus, tabindex, and the keyboard contract.
- [WCAG — Understanding Keyboard](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG/Keyboard) — the requirements focus management satisfies.
- [web.dev — Use :focus-visible](https://web.dev/articles/focus-visible) — showing the ring only when it's needed.
- [MDN — HTMLElement.focus()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) — `preventScroll` and the focusability rules.
