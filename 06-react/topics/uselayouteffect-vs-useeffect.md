<div align="center">

# `useLayoutEffect` vs `useEffect`

<sub>⚛️ React · 🟡 Medium · ⏱ 30m · `#hooks`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `useEffect` runs **after** the browser paints (async, non-blocking); `useLayoutEffect` runs **after DOM mutation but before paint** (synchronous, blocking). Use `useLayoutEffect` only when you must **measure or mutate the DOM before the user sees it** — otherwise `useEffect`, because blocking paint costs frames.

---

## 🧠 Mental model

Both run after React commits DOM changes. The only difference is **which side of the paint** they land on:

```
commit DOM ──► useLayoutEffect (sync, blocks) ──► browser paints ──► useEffect (async)
```

`useLayoutEffect` runs in the same frame as the mutation, *before* pixels hit the screen — so you can read layout and change it and the user only ever sees the final result. `useEffect` runs after paint, so if it changes layout the user briefly sees the "before" state: a flicker.

The reframe: **`useLayoutEffect` buys you a flicker-free correction at the price of a synchronous, paint-blocking task.** It's the right tool exactly when a visible flash would be worse than a slightly delayed paint — measuring a tooltip's size to position it, syncing scroll, reading an element before an animation.

## ⚙️ How it actually works

**`useLayoutEffect` is synchronous within the commit.** React runs it after mutating the DOM, then *waits for it to finish* before yielding to the browser to paint. Whatever DOM writes you make inside are batched into the same paint — no intermediate frame. This is what makes it flicker-free and also what makes it dangerous: a slow layout effect literally delays the frame.

**`useEffect` is deferred and async.** React schedules it to run after paint. In practice it runs very soon after, but the browser has already shown the committed DOM. If your effect then repositions an element, the user saw it in the wrong place for one frame.

**Cleanup timing mirrors the setup timing** — layout-effect cleanups run synchronously before the next layout effect / before paint; regular effect cleanups run async.

**Reading layout forces the sync path.** Any `getBoundingClientRect`, `offsetWidth`, `scrollHeight` you act on *visually* must be in `useLayoutEffect`, because by the time `useEffect` runs the frame is already painted with the wrong values.

**SSR caveat.** `useLayoutEffect` doesn't run on the server (there's no layout), and React warns if you use it in SSR'd components because the server output can mismatch the client's post-effect layout. The escape hatch is `useIsomorphicLayoutEffect` — `useLayoutEffect` on the client, `useEffect` on the server — or better, restructure so the initial render is already correct.

## 💻 Code

```jsx
// ❌ useEffect for positioning → user sees the tooltip flash at (0,0) first.
function Tooltip({ targetRef }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    const r = targetRef.current.getBoundingClientRect();
    setPos({ top: r.bottom, left: r.left }); // runs after paint → visible jump
  }, []);
  return <div style={{ position: "fixed", ...pos }}>hi</div>;
}

// ✅ useLayoutEffect measures + positions before paint → no flicker.
function Tooltip({ targetRef }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const t = targetRef.current.getBoundingClientRect();
    const el = ref.current;
    el.style.top = `${t.bottom}px`;
    el.style.left = `${t.left}px`;   // committed before the browser paints
  }, []);
  return <div ref={ref} style={{ position: "fixed" }}>hi</div>;
}
```

```jsx
// ✅ Preserve scroll position when prepending items — must be pre-paint.
useLayoutEffect(() => {
  const el = listRef.current;
  el.scrollTop = el.scrollHeight - prevHeight.current; // no visible scroll jump
});
```

## ⚖️ Trade-offs

- **Default to `useEffect`.** It doesn't block paint, so it keeps the UI responsive. Switch to `useLayoutEffect` only when you can *see* a flicker without it — that's the entire decision rule.
- **`useLayoutEffect` blocks the frame.** A heavy computation inside it delays paint for every user, every time. Keep the body tiny — measure and write, nothing else. Move expensive work out.
- **In concurrent React, prefer avoiding both when you can.** For DOM measurement that drives rendering, `useLayoutEffect` still works, but many "measure then position" cases are better solved with CSS (`position: anchor`, container queries) that needs no JS round-trip at all.

## 💣 Gotchas interviewers probe

- **"What's the actual difference?"** Timing relative to paint: `useLayoutEffect` runs synchronously before the browser paints; `useEffect` runs asynchronously after. Everything else follows from that.
- **The flicker test** is the deciding question: if using `useEffect` produces a visible flash of wrong layout, you needed `useLayoutEffect`.
- **`useLayoutEffect` blocks paint** — overusing it or doing heavy work inside jank the whole app. It's a scalpel, not a default.
- **The SSR warning** ("useLayoutEffect does nothing on the server") trips people up — reach for the isomorphic wrapper or, better, make the first render correct.
- **Refs (`useRef`) aren't reactive**, so reading `ref.current.getBoundingClientRect()` in a layout effect is the standard measure pattern — the ref is guaranteed attached by commit time.
- **Both run after commit**, so the DOM node exists in both — the difference is purely paint timing, not "is the node there yet."

## 🎯 Say this in the interview

> "They differ only in when they run relative to paint. `useEffect` runs asynchronously after the browser paints, so it never blocks the frame — that's my default. `useLayoutEffect` runs synchronously after React mutates the DOM but before paint, so I can measure an element and reposition it and the user only ever sees the final result. The decision rule is the flicker test: if doing it in `useEffect` shows a visible flash of the wrong layout — like a tooltip appearing at the origin before it jumps into place — then it has to be `useLayoutEffect`. The cost is that it blocks the frame, so I keep the body to just measure-and-write and nothing heavy. And I remember it doesn't run on the server, so in SSR I either wrap it isomorphically or restructure so the first render is already correct."

## 🔗 Go deeper

- [react.dev — `useLayoutEffect`](https://react.dev/reference/react/useLayoutEffect) — the reference, including the pre-paint guarantee and SSR caveat.
- [react.dev — `useEffect` timing](https://react.dev/reference/react/useEffect#caveats) — where in the lifecycle it fires.
- [Kent C. Dodds — useEffect vs useLayoutEffect](https://kentcdodds.com/blog/useeffect-vs-uselayouteffect) — the practical "when to use which" breakdown.
- [react.dev — Manipulating the DOM with refs](https://react.dev/learn/manipulating-the-dom-with-refs) — the measure-with-a-ref pattern these effects rely on.
