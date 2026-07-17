<div align="center">

# Live regions & announcements

<sub>♿ Accessibility · 🔴 Hard · ⏱ 45m · `#aria` `#dynamic`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Screen readers announce the currently-focused element, not silent DOM mutations. A **live region** is a container you mark `aria-live` so that when its contents change, the screen reader speaks the update **without moving focus** — the only way to tell a non-sighted user "your changes saved" or "3 results found" while they're somewhere else on the page.

---

## 🧠 Mental model

A screen reader has one output channel — speech — and by default it narrates what the user is *doing*: the element they focused, the text they arrowed to. Anything that changes elsewhere on the page happens in **silence**. A toast slides in, a form validates, a cart total updates, a search returns results — all invisible to someone not looking at that region.

A live region flips one part of the page into **push mode**. You designate a container with `aria-live`, and from then on the screen reader watches it: when its text content changes, it announces the new content *without stealing focus and without interrupting the user's place*. That "without moving focus" property is the entire point — it's how you narrate a background event that the user didn't navigate to. If moving focus to the update is appropriate (an error they must fix now), that's focus management's job, not a live region's.

## ⚙️ How it actually works

The two politeness levels, and this is the crux:

| | `aria-live="polite"` (`role="status"`) | `aria-live="assertive"` (`role="alert"`) |
|---|---|---|
| Timing | Waits until the user is idle | Interrupts immediately |
| Use for | Status, results count, "saved" | Errors, timeouts, urgent failures |
| Default? | The safe default | Reserve for genuinely urgent |

The **non-negotiable rule most people miss**: the live-region container must exist in the DOM, **empty and already parsed, before you put text into it.** Screen readers register live regions when they first see them and then diff their contents. If you create the region and its message in the *same* insertion — `container.innerHTML = '<div aria-live="polite">Saved</div>'` — many screen readers never register it in time and say nothing. Render the empty region on page load; later, write text into it.

Supporting attributes:

- **`aria-atomic="true"`** — announce the *entire* region on any change, not just the diffed node. Use it when a partial update (e.g. only the number in "Cart: **4** items") would otherwise be read out of context.
- **`aria-relevant`** — which mutation types count (`additions`, `removals`, `text`). Rarely needed; the default (`additions text`) is almost always right.
- **`role="status"`** implies `aria-live="polite"` + `aria-atomic="true"`; **`role="alert"`** implies `aria-live="assertive"`. Prefer the roles — they're semantic and better supported.

## 💻 Code

```html
<!-- ✅ Ship the EMPTY regions in your initial HTML so the screen
     reader registers them. You write text into them later. -->
<div id="status"  role="status" class="sr-only"></div>   <!-- polite -->
<div id="errors"  role="alert"  class="sr-only"></div>   <!-- assertive -->
```

```js
// Announce a background success — no focus change, user keeps their place.
function announce(msg) {
  const region = document.getElementById('status');
  region.textContent = '';                 // clear first…
  // …then set on the next frame so identical-to-previous text still fires.
  requestAnimationFrame(() => { region.textContent = msg; });
}
announce('Draft saved');                   // spoken when the user next pauses
```

```js
// ❌ The classic silent failure: region and message inserted together.
//    The screen reader never registered the region → nothing is announced.
container.insertAdjacentHTML('beforeend',
  '<div role="status">Loaded 12 results</div>');

// ✅ Region already in the DOM; only its text changes.
document.getElementById('status').textContent = 'Loaded 12 results';
```

For frequent updates (a live search filtering as you type), **debounce** before writing — otherwise the screen reader queues every keystroke's result and talks over itself.

## ⚖️ Trade-offs

- **`polite` is the default; `assertive` is a fire alarm.** Assertive interrupts whatever the user is hearing mid-word — fine for a session-timeout warning, hostile for "item added to cart". Overusing assertive trains users to tune your app out.
- **Live regions announce; they don't focus.** If the update *requires* action (a validation error blocking submit), moving focus to the field is usually better than — or in addition to — announcing. Choose based on whether the user must act *now*.
- **When NOT to use one:** for content the user navigated to deliberately (that's already announced), or as a lazy substitute for correct focus management on route change. And never wire a live region to high-frequency data (a stock ticker) unin-debounced — it becomes an unusable stream of chatter.

## 💣 Gotchas interviewers probe

- **Injecting the region and its text together announces nothing.** The region must pre-exist, empty, so the screen reader is watching it. This is *the* live-region gotcha and the strongest senior signal.
- **Setting the same text twice may not re-announce** — the content didn't "change". Clear to `''` first, or append a differentiator, to force a repeat.
- **`role="alert"` vs `role="status"`** map to assertive vs polite. Reaching for `alert` on non-urgent updates is the most common misuse.
- **`aria-atomic` controls partial vs whole-region announcement** — without it, changing one word in a sentence may read just that word, stripped of context.
- **Hidden with `display:none`? It won't announce.** The region must be in the accessibility tree — use `.sr-only` (clipped/off-screen), which stays in the tree, not `display:none`, which removes it.
- **Timing is real:** write too fast after inserting the region and the update can be missed. A `requestAnimationFrame` or micro-delay between clearing and setting is a common, pragmatic fix.
- **Multiple simultaneous updates queue up** — flooding a region makes the screen reader read stale messages long after they matter.

## 🎯 Say this in the interview

> "Screen readers narrate what the user is focused on, so any change elsewhere — a toast, a save confirmation, a results count — is silent unless it's in a live region. A live region is a container I mark `aria-live`, or give `role='status'` or `role='alert'`, and when its text changes the screen reader announces it *without* moving focus, which is exactly what I want for a background event. The detail that trips most people up is timing: the region has to already be in the DOM, empty, when the page loads, so the screen reader is watching it — if I inject the region and its message together, many screen readers say nothing. I default to polite; I reserve assertive for genuinely urgent things like errors or a session timeout, because it interrupts mid-sentence. And if the user actually has to act on the update, I move focus instead of, or as well as, announcing it."

## 🔗 Go deeper

- [MDN — ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions) — the canonical reference for `aria-live`, `atomic`, `relevant`.
- [web.dev — Alerts, status messages, and live regions](https://web.dev/articles/dynamic-content) — the timing and registration pitfalls.
- [ARIA APG — Alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) — when `role="alert"` is the right call.
- [WCAG — 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) — the requirement live regions satisfy.
