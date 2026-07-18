<div align="center">

# Event handling, bubbling & delegation

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 1h · `#dom` `#events`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Every event travels in **three phases**: capture (root → target), target, then bubble (target → root). **Delegation** exploits the bubble phase: attach one listener to a stable ancestor and identify the real source with `event.target.closest(...)`. One listener replaces thousands, and it keeps working for elements that don't exist yet.

---

## 🧠 Mental model

An event does not "happen on a button". It **propagates through the tree**, and every ancestor gets two chances to see it:

```
          ┌──────────────── document ───────────────┐
   CAPTURE│  ↓ 1. capture: document → … → target    │
          │  ⦿ 2. target: listeners on the target   │
   BUBBLE │  ↑ 3. bubble:  target → … → document    │
          └─────────────────────────────────────────┘
```

By default `addEventListener` listens on the **bubble** phase. Pass `{ capture: true }` to listen on the way *down* instead.

Once you see events as a journey rather than a point, delegation stops being a trick and becomes the obvious consequence: **if the event is going to pass through the parent anyway, just listen there.**

## ⚙️ How it actually works

The two properties people conflate — and the interviewer is listening for the difference:

| | Meaning |
|---|---|
| `event.target` | The element the event **originated on**. Does not change during propagation. |
| `event.currentTarget` | The element whose listener is **currently running**. Changes at each step. |

In a delegated handler, `currentTarget` is your container; `target` is the deeply-nested thing the user actually clicked (maybe an `<svg>` inside a `<span>` inside the button). That's why you need `closest()` to walk back up to the element you care about.

**Stopping propagation** — three distinct things:

```js
e.preventDefault();          // cancel the DEFAULT ACTION (navigation, submit, scroll).
                             // Does NOT stop propagation.
e.stopPropagation();         // stop travelling to further ancestors.
                             // Other listeners ON THIS SAME ELEMENT still run.
e.stopImmediatePropagation();// stop propagation AND skip remaining listeners on this element.
```

`return false` in an inline/jQuery handler does *both* `preventDefault` and `stopPropagation` — which is exactly why it's a footgun in vanilla JS, where it does nothing at all in `addEventListener`.

## 💻 Code

The delegation pattern, done properly:

```js
// ❌ One listener per row. Dies for rows added later. Leaks on removal.
document.querySelectorAll('.row .delete').forEach((btn) =>
  btn.addEventListener('click', onDelete)
);

// ✅ One listener, on a stable ancestor. Works for rows that don't exist yet.
list.addEventListener('click', (e) => {
  const btn = e.target.closest('.delete'); // walk up from the true source
  if (!btn || !list.contains(btn)) return; // ignore clicks elsewhere
  onDelete(btn.closest('.row').dataset.id);
});
```

Two details that make this senior-grade:

1. `e.target.closest('.delete')` — because the click may land on an icon *inside* the button.
2. `list.contains(btn)` — guards against a `closest()` match that lives outside your container (possible with portals/teleported DOM).

**Non-bubbling events** — the trap:

```js
// focus/blur DO NOT bubble. Delegation silently never fires.
form.addEventListener('focus', h);        // ❌ never runs for children
form.addEventListener('focusin', h);      // ✅ focusin/focusout DO bubble
// or force the capture phase, which always passes through the ancestor:
form.addEventListener('focus', h, true);  // ✅ works
```

## ⚖️ Trade-offs

- **Delegation trades memory for indirection.** One listener instead of 10,000 is a huge memory and setup win, and it survives DOM churn — but the handler becomes a router, and a stray `stopPropagation()` from a child silently kills it. That failure mode is genuinely hard to debug.
- **Don't delegate on `document` by default.** Every click in the page then runs your handler. Delegate to the **nearest stable container**, so you don't pay for unrelated events.
- **`stopPropagation()` is antisocial.** It breaks *other people's* delegated listeners (analytics, dropdown-close-on-outside-click). Prefer `preventDefault()` if what you actually want is "don't do the default thing".

## 💣 Gotchas interviewers probe

- **`target` vs `currentTarget`** — the single most common question here. Know it cold.
- **`focus`, `blur`, `mouseenter`, `mouseleave` do not bubble.** Their bubbling counterparts are `focusin`/`focusout` and `mouseover`/`mouseout`. Delegating `blur` and wondering why nothing fires is a rite of passage.
- **`preventDefault()` ≠ `stopPropagation()`.** They are orthogonal: one cancels the browser's action, the other cancels the journey.
- **Passive listeners:** `addEventListener('touchstart', h, { passive: true })` promises you won't call `preventDefault()`, letting the browser scroll without waiting on your handler. Browsers now default `touchstart`/`wheel` to passive on the root — so calling `preventDefault()` there *silently does nothing*.
- **`{ once: true }`** auto-removes the listener — cleaner than manual `removeEventListener`.
- **You cannot remove an anonymous listener.** `removeEventListener` needs the *same function reference*. A common leak.
- **Capture-phase listeners on an ancestor run *before* the target's own handler** — occasionally the only way to intercept something.

## 🎯 Say this in the interview

> "Events propagate in three phases — capture down from the root, then the target, then bubble back up — and `addEventListener` defaults to the bubble phase. Delegation just takes advantage of the fact that the event passes through the ancestor anyway: I put one listener on a stable container, and inside the handler I use `event.target.closest('.delete')` to find the element that actually matters, because the raw target might be an icon nested inside the button. That gives me one listener instead of thousands, and it keeps working for rows added later, which is the real win. The two things I'm careful about: `target` is where it originated while `currentTarget` is where the listener is attached — and `focus`/`blur` don't bubble, so for those I use `focusin`/`focusout` or listen in the capture phase."

## 🔗 Go deeper

- [javascript.info — Bubbling and capturing](https://javascript.info/bubbling-and-capturing) — the best explanation of the three phases.
- [javascript.info — Event delegation](https://javascript.info/event-delegation) — the pattern, with real examples.
- [MDN — addEventListener options](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) — `capture`, `once`, `passive`, `signal`.
