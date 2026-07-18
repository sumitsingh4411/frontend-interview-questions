<div align="center">

# Error handling & observability

<sub>🏛️ Architecture · 🟡 Medium · ⏱ 45m · `#reliability`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Error handling is what you do *in* the app so a failure doesn't take down the page; observability is what you do *around* it so you find out before your users tweet about it. The staff move is treating errors as a signal to instrument, not just a `try/catch` to swallow — capture, contextualize, sample, and alert on **rates**, never single events.

---

## 🧠 Mental model

Frontend errors are uniquely hostile to debug: they happen on a device you don't own, on a browser version you didn't test, on a network you can't see, with a stack trace that points into minified garbage. You get one shot to capture enough context to reproduce it. So the mental model is a **funnel**:

```
throw → catch boundary → enrich with context → dedupe/group → sample → transport → alert on rate
```

Two orthogonal axes people conflate:

- **Handling** = recovery. Can the app keep working? (Error boundary renders a fallback, retry the request, show a toast.)
- **Observability** = knowing. Can *you* see what happened, aggregated? (Sentry, RUM, structured logs, traces.)

A `catch {}` that hides an error is the worst of both: no recovery *and* no visibility. The rule: **never swallow silently — either recover visibly or report.**

## ⚙️ How it actually works

**Nothing catches everything by default.** You need multiple nets because errors escape through different holes:

| Source | What catches it |
|---|---|
| Render error in React | Error Boundary (`componentDidCatch` / `getDerivedStateFromError`) |
| Uncaught sync error | `window.onerror` |
| Unhandled promise rejection | `window.onunhandledrejection` |
| Failed `fetch` (rejects only on network, **not** on 4xx/5xx) | your own `if (!res.ok)` check |
| Resource load failure (img/script) | capture-phase `window.addEventListener('error', …, true)` |

**React error boundaries don't catch async.** They catch errors thrown *during render/lifecycle*. An error inside an event handler or a `setTimeout` or a promise blows straight past the boundary — that's the number-one misconception. You handle those with `try/catch` in the handler.

**Source maps are the entire game for frontend observability.** Minified `a.b is not a function` is useless. You upload source maps to Sentry at build time (but do *not* serve them publicly — that leaks source), and the platform re-maps the stack to your real code. No source maps = no usable frontend error tracking.

**Context is what makes an error reproducible.** Raw stack + nothing = unactionable. Attach: release version, user id (or anonymous id), breadcrumbs (the last N user actions / network calls), browser, and route. Breadcrumbs — "clicked Save → POST /order 500 → threw" — are usually more valuable than the stack itself.

**Alert on rates, sample volume.** One error is noise; a spike after a deploy is a signal. You sample high-volume events (you don't need all 2M instances of one bug) and alert on *rate* and *new-issue-after-release*, not on individual events — otherwise the alerts become wallpaper.

## 💻 Code

```jsx
// Error boundary — the ONLY thing that catches render-phase errors. Must be a class.
class Boundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; } // → render fallback
  componentDidCatch(error, info) {
    // Enrich BEFORE sending: component stack + release + user
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }
  render() {
    if (this.state.error) return <Fallback onRetry={() => this.setState({ error: null })} />;
    return this.props.children;
  }
}
```

```js
// The global nets — everything the boundary can't see
window.addEventListener('unhandledrejection', (e) =>
  Sentry.captureException(e.reason)); // async errors escape React boundaries

window.onerror = (msg, src, line, col, err) =>
  Sentry.captureException(err ?? new Error(String(msg)));

// fetch does NOT reject on HTTP errors — this is the classic silent failure
async function api(url) {
  const res = await fetch(url);
  if (!res.ok) throw new HttpError(res.status, url); // 500 is "resolved" to fetch!
  return res.json();
}
```

```js
// ❌ The anti-pattern: recovery-free AND visibility-free
try { await save(); } catch {}          // user thinks it saved. it didn't. you'll never know.

// ✅ Recover visibly, report the unexpected
try { await save(); }
catch (e) {
  toast.error('Could not save — retrying');   // recover / inform
  if (!(e instanceof NetworkError)) Sentry.captureException(e); // report the surprising ones
}
```

## ⚖️ Trade-offs

- **More reporting isn't more insight — it's more noise.** Capturing every `console.warn` and network blip buries the one real regression. Filter aggressively: drop known third-party errors, browser-extension noise, and cancelled requests before they hit your dashboard.
- **Error boundaries are a granularity decision.** One boundary at the root means any error blanks the whole app. Per-route or per-widget boundaries contain the blast radius so a broken sidebar doesn't kill the checkout. But too many boundaries and you've scattered fallback UI everywhere.
- **PII vs debuggability.** Breadcrumbs and request bodies make bugs reproducible but can capture emails, tokens, form contents. You must scrub before transport — a mistake here is a data-breach, not a bug.
- **When NOT to instrument heavily:** an internal tool with 5 users doesn't need sampling and RUM. The machinery has a cost; match it to blast radius.

## 💣 Gotchas interviewers probe

- **"Do React error boundaries catch async errors?"** No — only render, lifecycle, and constructor errors. Event handlers, `setTimeout`, and promises escape them. This is the single most-probed detail here.
- **`fetch` doesn't reject on 4xx/5xx.** It only rejects on network failure. A 500 comes back as a resolved response — you *must* check `res.ok` or the error is silently swallowed. Axios throws by default; fetch doesn't.
- **Minified stacks are worthless without source maps.** And you must *not* serve source maps publicly — upload them to your error platform and keep them private, or you've published your source.
- **Alert fatigue kills observability faster than no observability.** Alerting on every event trains the team to ignore alerts. Alert on rate spikes and new-issues-since-release.
- **`unhandledrejection` is a separate net from `onerror`.** Wire both. A rejected promise with no `.catch` won't trigger `window.onerror`.
- **Error monitoring ≠ RUM ≠ logging ≠ tracing.** Errors tell you *what broke*; RUM tells you *how slow/janky it is for real users*; distributed tracing tells you *where in the request path*. Naming these as distinct pillars is the senior signal.

## 🎯 Say this in the interview

> "I separate two things: handling, which is recovery inside the app, and observability, which is aggregated visibility around it — and the failure mode is a silent `catch` that does neither. On the handling side I use React error boundaries for render-phase errors, but I'm careful because they don't catch async — event handlers, timeouts, and promise rejections escape them, so those need `try/catch` and a global `unhandledrejection` listener. I also always check `res.ok` on fetch because it doesn't reject on a 500. On the observability side, the whole thing lives or dies on source maps to de-minify stacks, plus context — release, user, and breadcrumbs of the last few actions, which are usually more useful than the stack itself. And I alert on error *rates* and new-issues-after-deploy, not individual events, because per-event alerting just trains everyone to ignore the alerts."

## 🔗 Go deeper

- [Sentry — Documentation](https://docs.sentry.io/) — source maps, breadcrumbs, sampling, release health — the reference implementation of the funnel.
- [MDN — GlobalEventHandlers.onerror](https://developer.mozilla.org/en-US/docs/Web/API/Window/error_event) — the global sync-error net and its argument quirks.
- [React — Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) — exactly what boundaries do and don't catch.
- [web.dev — Core Web Vitals & RUM](https://web.dev/articles/vitals) — why real-user monitoring is a distinct pillar from error tracking.
