<div align="center">

# Debounce & throttle

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 45m · `#patterns` `#performance`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Both cap how often a function runs, but with opposite promises: **debounce** waits for the storm to end and fires *once* ("run after they stop"); **throttle** fires at a *steady rate* during the storm ("run at most once every N ms"). Pick by asking whether you care about the *final* state or a *sampled* stream of it.

---

## 🧠 Mental model

Imagine a burst of rapid events — keystrokes, scroll ticks, resize fires.

```
events:   x x x x x x x   x x       x
debounce: ─────────────●    ─────────●   ← fires once, T ms after the LAST event
throttle: ●───────●───────●───────●──    ← fires every T ms WHILE events keep coming
```

**Debounce** collapses a burst into a single trailing call. Use it when only the *final* value matters: search-as-you-type, autosave, validating a field, resizing-then-recomputing-once. **Throttle** guarantees a regular heartbeat during continuous activity. Use it when you want *progress* samples: scroll position, mousemove drag, analytics on scroll depth, an infinite-scroll trigger.

The one-line decision: **"Do I want the result *after they stop*, or *while they go*?"** Stop → debounce. While → throttle.

## ⚙️ How it actually works

Both are closures over a timer handle. Debounce **clears and reschedules** on every call, so the callback only lands once the calls go quiet for `wait` ms. Throttle **ignores** calls until a cooldown elapses, then lets one through.

The details that separate a real implementation from a toy one:

- **Preserve `this` and `arguments`** — use a regular function and `fn.apply(this, args)`, not an arrow, so it works as a method and forwards event objects.
- **Leading vs trailing edge.** Debounce trailing (default) fires *after* the pause; leading fires *immediately* then suppresses. Throttle usually wants both a leading call (instant feedback) and a trailing one (so the final position isn't lost).
- **`cancel()` and `flush()`.** Real utilities expose these — `cancel` to drop a pending call on unmount, `flush` to force it now (e.g. on form submit before the debounced save fired).
- **For anything visual, throttle with `requestAnimationFrame`, not a timer.** rAF self-throttles to the display refresh and pauses in background tabs — strictly better than a hand-picked millisecond interval for scroll/drag rendering.

## 💻 Code

```js
// Debounce — trailing edge, this/args preserved, cancellable
function debounce(fn, wait) {
  let timer;
  function debounced(...args) {
    clearTimeout(timer);               // every call resets the countdown
    timer = setTimeout(() => fn.apply(this, args), wait);
  }
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

// Throttle — leading + trailing, so the last event is never dropped
function throttle(fn, interval) {
  let last = 0, timer, lastArgs;
  return function throttled(...args) {
    const now = Date.now();
    const remaining = interval - (now - last);
    lastArgs = args;
    if (remaining <= 0) {              // cooldown elapsed → run now (leading)
      clearTimeout(timer); timer = null;
      last = now;
      fn.apply(this, args);
    } else if (!timer) {              // schedule the trailing call
      timer = setTimeout(() => {
        last = Date.now(); timer = null;
        fn.apply(this, lastArgs);
      }, remaining);
    }
  };
}
```

```jsx
// ❌ The React trap: a fresh debounced fn every render → its timer never survives
function Search() {
  const onType = debounce((q) => fetchResults(q), 300); // new closure each render
  return <input onChange={(e) => onType(e.target.value)} />; // debounce does nothing
}

// ✅ Keep one stable instance across renders
const onType = useMemo(() => debounce((q) => fetchResults(q), 300), []);
useEffect(() => onType.cancel, [onType]); // cancel pending call on unmount
```

## ⚖️ Trade-offs

- **Debounce can feel unresponsive** if `wait` is too long — the user types, waits, sees nothing. 150–300ms is the usual sweet spot for input. Too short and you lose the coalescing benefit.
- **Throttle drops intermediate events by design.** If every event must be handled (e.g. you're accumulating deltas), throttle is wrong — batch or queue instead.
- **When not to use either:** if the handler is already cheap and infrequent, adding a timer is just latency and complexity. And for scroll-driven *visual* updates, prefer `requestAnimationFrame` or, better, `IntersectionObserver`/`ResizeObserver`, which fire only when something actually changed — no polling at all.

## 💣 Gotchas interviewers probe

- **Naming them the wrong way round.** Search box = **debounce**; scroll/mousemove/resize progress = **throttle**. Swapping these is the classic tell.
- **Losing `this` and the event object.** An arrow-based implementation or forgetting `apply` breaks method calls and drops the `event`. Interviewers watch for `fn.apply(this, args)`.
- **Recreating the debounced function on every React render** resets the timer so it *never* fires — must be `useMemo`/`useRef`, and cleaned up on unmount.
- **Leading vs trailing edge** — being asked to add an `{ leading, trailing }` option is the standard follow-up. Know that trailing-only debounce means the *first* keystroke waits.
- **The synthetic-event pooling footgun** (older React): reading `e.target` inside a delayed callback fails because the event was recycled — capture the value synchronously first.
- **Throttle without a trailing call drops the final event** — the user stops scrolling one pixel from the bottom and your "load more" never fires.

## 🎯 Say this in the interview

> "They both rate-limit, but the promise is opposite. Debounce says 'wait until the calls stop, then run once' — perfect for search-as-you-type or autosave, where I only care about the final value. Throttle says 'run at most once every N milliseconds while calls keep coming' — perfect for scroll or drag, where I want a steady stream of samples. Both are closures over a timer; the details I get right are preserving `this` and `arguments` with `apply` so it works as an event handler, and exposing `cancel`/`flush`. In React I memoise the debounced function so it survives re-renders — a fresh instance each render resets the timer and it never fires. And for anything that drives rendering I throttle with `requestAnimationFrame` instead of a fixed interval, because rAF matches the refresh rate and pauses in background tabs."

## 🔗 Go deeper

- [CSS-Tricks — Debouncing and throttling explained](https://css-tricks.com/debouncing-throttling-explained-examples/) — the clearest visual treatment of the two curves.
- [Lodash — `_.debounce`](https://lodash.com/docs/#debounce) — study the `leading`/`trailing`/`maxWait` options and the `cancel`/`flush` API; it's the reference implementation.
- [MDN — requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) — why rAF beats a timer for visual throttling.
- [MDN — IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) — often the right answer that retires scroll throttling entirely.
