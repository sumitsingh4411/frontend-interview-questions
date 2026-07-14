<div align="center">

# `useEffect` & effect timing

<sub>⚛️ React · 🟡 Medium · ⏱ 1h · `#hooks`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `useEffect` is for **synchronising with systems outside React** (network, subscriptions, non-React DOM), not for reacting to renders. It runs **after the browser paints**, its cleanup runs **before the next effect and on unmount**, and its dependency array is a *correctness* contract, not an optimisation. Most effects people write shouldn't exist.

---

## 🧠 Mental model

An effect is not "code that runs after render." It's a **synchronisation**: "given this state, make the outside world match, and undo it when the state changes or the component leaves." Setup and cleanup are two halves of one idea — every subscription needs an unsubscribe, every timer a clear.

The reframe that deletes half your effects: **if you can compute it during render, it's not an effect.** Derived state, formatting, filtering — do it inline. Effects are the escape hatch to things React *can't* express declaratively: imperative APIs and external stores. The mental test is "am I reaching *outside* React?" If not, you probably don't need an effect.

```
render → commit (DOM mutated) → browser paints → useEffect runs (async)
                              ↘ useLayoutEffect runs BEFORE paint (sync)
```

## ⚙️ How it actually works

**Timing: after paint, asynchronously.** React commits DOM changes, lets the browser paint, *then* runs your effect. So effects never block visual updates — the trade is that if an effect itself mutates layout, the user can see a flash of the pre-effect state (that's when you reach for `useLayoutEffect`).

**Cleanup runs between renders, not only on unmount.** When deps change, React runs the *previous* render's cleanup, then the new setup. So an effect that subscribes to `id=1`, then re-runs for `id=2`, first unsubscribes from 1. On unmount, the last cleanup runs. Forgetting cleanup is the #1 source of leaks and duplicate listeners.

**The dependency array is a correctness contract.** React re-runs the effect when any dep changes (by `Object.is`). It is *not* "run this once" tuning — an incomplete deps array means the effect closes over **stale** values. `[]` means "the setup never needs re-running," which is only true if it references no reactive values. The exhaustive-deps lint rule exists because lying here is a silent bug.

**Stale closures, precisely.** An effect captures the state/props from the render that created it. If `count` isn't in the deps, the effect keeps seeing the *first* render's `count` forever — nothing went stale, you just never gave React a reason to re-create the closure with fresh values. Fix by adding the dep, or by using a functional updater / ref so you don't need it.

**StrictMode double-invokes effects in dev** (setup → cleanup → setup) to surface missing cleanup. If that breaks you, your effect isn't idempotent — the "fix" is proper cleanup, never a mount-guard ref.

## 💻 Code

```jsx
// ❌ "Effect to derive state" — an extra render, a stale flash, and needless code.
function Cart({ items }) {
  const [total, setTotal] = useState(0);
  useEffect(() => { setTotal(items.reduce((s, i) => s + i.price, 0)); }, [items]);
  // ...
}
// ✅ Just compute it during render. No effect, no extra render, never stale.
function Cart({ items }) {
  const total = items.reduce((s, i) => s + i.price, 0);
}
```

```jsx
// ✅ A real effect: subscribe + clean up. Cleanup runs on dep change AND unmount.
useEffect(() => {
  const sub = chatRoom.connect(roomId);
  return () => sub.disconnect(); // runs before reconnecting to a new room, and on unmount
}, [roomId]);
```

```jsx
// ✅ Fetch with race-condition guard. Slow request for A must not overwrite B.
useEffect(() => {
  let ignore = false;
  fetch(`/api/user/${id}`).then(r => r.json()).then(u => { if (!ignore) setUser(u); });
  return () => { ignore = true; };  // ignore the in-flight response when id changes
}, [id]);
```

```jsx
// ❌ Missing dep → stale closure. Interval always logs the first render's count.
useEffect(() => {
  const t = setInterval(() => console.log(count), 1000);
  return () => clearInterval(t);
}, []); // count not listed → frozen at initial value
// ✅ Use the ref/updater pattern, or add count to deps (and accept re-subscription).
```

## ⚖️ Trade-offs

- **Effects are the last resort, not the default.** For derived values → compute in render. For "reset state when a prop changes" → a `key`. For event responses → an event handler. For external subscriptions → `useSyncExternalStore`. Reach for `useEffect` when you're genuinely bridging to a non-React system.
- **Data fetching in `useEffect` works but is weak** — no caching, dedup, or race handling out of the box. In a real app, prefer a framework loader, React Query/SWR, or Server Components. Raw `fetch`-in-effect is fine for a demo, a smell in production.
- **More deps → more re-runs.** Sometimes the right move isn't fewer deps (which lies) but restructuring so the effect *needs* fewer reactive values — move the function inside, or split the effect.

## 💣 Gotchas interviewers probe

- **"When does cleanup run?"** Before every re-run of the effect *and* on unmount — not only on unmount. Missing this causes doubled listeners and leaks.
- **Empty deps ≠ "run once, ignore everything."** It means "captures no reactive values." If the body reads state/props not in the array, those are frozen — the stale-closure bug.
- **StrictMode's double-invoke is intentional** and reveals missing cleanup. Guarding with `useRef(false)` masks the bug instead of fixing it.
- **Object/array/function deps change identity every render**, so the effect runs every render. Depend on primitives, or memoise the value at its source.
- **`setState` inside an effect that isn't guarded by deps** loops forever — effect sets state → re-render → effect runs → …
- **Effects don't run during SSR** — they're client-only. Anything that must exist on the server can't live in an effect.
- **The exhaustive-deps warning is almost always right.** Suppressing it is a decision to accept a stale closure; do it consciously, with a comment.

## 🎯 Say this in the interview

> "I treat `useEffect` as synchronisation with the outside world, not as 'run after render.' It fires after paint, and its cleanup runs before the next run and on unmount — those two halves are one unit, so every subscription gets an unsubscribe. The dependency array is a correctness contract: React re-creates the effect when a dep changes, so if I leave a value out, the effect closes over that render's snapshot forever — that's the real cause of a stale closure, not something 'going stale.' Before writing an effect I ask whether I'm actually reaching outside React; if I'm just deriving state, I compute it in render, and if I'm resetting on a prop change I use a key. For fetching I add an `ignore` flag to kill races, and in production I'd reach for React Query or a loader rather than raw fetch-in-effect. StrictMode double-invoking in dev is a feature — it tells me my cleanup is incomplete."

## 🔗 Go deeper

- [react.dev — You might not need an effect](https://react.dev/learn/you-might-not-need-an-effect) — the single most useful React article; deletes most effects.
- [react.dev — Synchronizing with effects](https://react.dev/learn/synchronizing-with-effects) — timing, cleanup, and StrictMode double-invoke.
- [react.dev — Lifecycle of reactive effects](https://react.dev/learn/lifecycle-of-reactive-effects) — the "effect as a synchronisation" mental model.
- [react.dev — Removing effect dependencies](https://react.dev/learn/removing-effect-dependencies) — how to honestly reduce deps.
