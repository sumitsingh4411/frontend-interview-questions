<div align="center">

# INP (Interaction to Next Paint)

<sub>🚀 Performance · 🔴 Hard · ⏱ 1h · `#metrics` `#inp`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — INP measures **responsiveness**: for every tap/click/keypress on the page it times the gap from input to the *next frame the browser paints*, and reports (roughly) the **worst** interaction of the visit. Good is **≤ 200 ms**. It replaced FID in March 2024 because FID only measured input *delay*, not the work that actually janks the UI.

---

## 🧠 Mental model

An interaction has three parts, and INP measures **all three end to end**:

```
 user taps                          browser paints next frame
    │                                          │
    ▼                                          ▼
    ├──── input delay ────┼── processing ──┼── presentation delay ──┤
    (main thread busy)     (your handlers)   (style/layout/paint)
    └──────────────────  this whole span is one interaction's latency ─┘
```

FID only measured the **first** segment of the **first** interaction. INP measures the full span of **every** interaction and surfaces the near-worst one. That's why a page can have a perfect FID and a terrible INP: the input registered instantly, but your `onClick` ran 400 ms of synchronous work before the screen updated.

The reframing that matters: **INP is not about how fast your JS runs — it's about how long the user stares at an unchanged screen after acting.** A spinner painted in the same frame as the click "feels" instant even if the data takes 2 s.

## ⚙️ How it actually works

An "interaction" groups the events fired by one gesture — a tap is `pointerdown` → `pointerup` → `click`; a keypress is `keydown` → `keyup`. INP takes the **longest single event duration** within that group, measured from the hardware timestamp to the next paint.

The three delays, and what causes each:

- **Input delay** — the main thread was busy when the input arrived (a long task from hydration, a third-party script, a fat `setInterval`). The event can't even *start* dispatching.
- **Processing time** — your event handlers running synchronously. React re-renders, expensive state updates, layout thrashing inside the handler.
- **Presentation delay** — after handlers finish, the browser must recalc style, lay out, paint, composite. A huge DOM or a giant `useEffect`-triggered re-render bloats this.

Reporting: below ~50 interactions, INP is the **worst**; on pages with many interactions it uses roughly the **98th percentile** to ignore one freak outlier. It's a *whole-visit* metric, not a load metric — it keeps accruing until the page is unloaded, so a slow menu you open at second 30 counts.

The single most effective fix is **yield to the main thread**: break long tasks so the browser can paint feedback first.

## 💻 Code

```js
// ❌ Handler does everything synchronously — the screen freezes until it's done.
button.addEventListener('click', () => {
  const result = expensiveFilter(hugeList); // 300ms of blocking work
  renderResults(result);                     // paint happens AFTER all of it
});

// ✅ Paint feedback first, then yield so the browser can present it,
//    then do the heavy work in the next task.
button.addEventListener('click', async () => {
  showSpinner();                 // cheap DOM update — user sees a response
  await yieldToMain();           // let the browser paint the spinner NOW
  const result = expensiveFilter(hugeList);
  renderResults(result);
});

// Canonical yield: a macrotask beats microtasks/rAF because it lets
// the browser render between chunks.
function yieldToMain() {
  return new Promise((resolve) => setTimeout(resolve, 0));
  // Or, where supported: scheduler.yield()  — resumes with higher priority.
}
```

```js
// React: mark non-urgent updates so typing stays responsive.
const [query, setQuery] = useState('');
const [isPending, startTransition] = useTransition();

function onChange(e) {
  setQuery(e.target.value);              // urgent: the input value
  startTransition(() => setResults(     // non-urgent: the expensive list
    filterHugeList(e.target.value)
  ));
}
```

## ⚖️ Trade-offs

- **`useTransition`/`scheduler.yield` improve responsiveness, not throughput.** The total work is the same or slightly more — you're trading a lower peak latency for the user against marginally longer wall-clock time. That's almost always the right trade for perceived speed.
- **Debouncing input handlers helps INP but hurts freshness.** A 150 ms debounce on search keystrokes cuts processing frequency, but the user waits longer to see results. Tune to the interaction, don't blanket-apply.
- **Don't optimise INP you don't have.** If the field 75th percentile is already ≤ 200 ms, spend the effort on LCP. INP problems cluster on interaction-heavy apps (filters, editors, dashboards), not content pages.

## 💣 Gotchas interviewers probe

- **INP ≠ FID.** FID was *first input, delay only*. INP is *all inputs, full latency*. Saying "INP is just FID renamed" is a fail.
- **Scrolling is not an interaction.** Neither is hover. INP counts taps, clicks, and key presses — not scroll or mouse-move. (Scroll jank is a separate problem.)
- **The metric is the near-worst, not the average.** One 500 ms interaction buried among a hundred fast ones can still set your INP. You optimise the *tail*, not the mean.
- **`console.log` and DevTools open inflate it.** Measure in a clean profile; verdict comes from **field data (CrUX)**, not your lab machine.
- **Presentation delay is the sneaky one.** Candidates fixate on handler speed and forget that a massive re-render/layout after the handler is still on the interaction's clock. `content-visibility` and smaller DOMs help here.
- **Passive listeners don't reduce INP** the way they reduce scroll jank — INP isn't about scroll.

## 🎯 Say this in the interview

> "INP is Core Web Vitals' responsiveness metric — it replaced FID in 2024. For every click, tap, and keypress it measures the full latency from the input to the next paint, and reports roughly the worst interaction of the visit; good is 200 ms or less. The key difference from FID is that FID only measured input *delay* on the *first* interaction, whereas INP measures input delay plus your handler's processing time plus presentation delay, across *all* interactions. So I diagnose it by splitting those three: is the main thread busy at input time, is my handler doing too much synchronous work, or is the post-handler render too heavy? The highest-leverage fix is usually to yield to the main thread — paint immediate feedback like a spinner, yield with `scheduler.yield` or a `setTimeout`, then do the heavy work — plus `startTransition` in React to keep urgent updates ahead of expensive ones."

## 🔗 Go deeper

- [web.dev — Interaction to Next Paint (INP)](https://web.dev/articles/inp) — the definitive metric definition and thresholds.
- [web.dev — Optimize INP](https://web.dev/articles/optimize-inp) — the practical playbook: yielding, breaking up tasks, avoiding layout thrash.
- [web.dev — Optimize long tasks](https://web.dev/articles/optimize-long-tasks) — `scheduler.yield()` and how yielding lets the browser paint.
- [MDN — Event Timing API](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEventTiming) — how INP is actually measured in the field.
