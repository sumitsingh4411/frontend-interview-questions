<div align="center">

# Module Federation

<sub>🏛️ Architecture · 🔴 Hard · ⏱ 1.5h · `#micro-frontends` `#bundling`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Module Federation lets one bundle **import code from another independently deployed bundle at runtime**, over the network, as if it were a local module — so a "host" app can load a "remote" team's feature that was built and shipped separately, with shared libraries like React deduplicated so you don't download two copies.

---

## 🧠 Mental model

Normal bundling resolves every `import` at **build time** — everything the app needs is baked into the artifact you deploy. Module Federation adds a second kind of import that resolves at **runtime**: the host asks a remote's `remoteEntry.js` "what do you expose?", and pulls the requested module over HTTP on demand. The remote can be redeployed on its own cadence; the host picks up the new version on next load without rebuilding.

The mental shift: a micro-frontend split is really a question of *when you compose*. Build-time composition (npm packages) means every consumer must rebuild and redeploy to get a change. Runtime composition (Module Federation) means the remote team ships independently and every host gets it live. Federation is the tool that buys **independent deployability** for frontend teams — that's the entire reason it exists, and if you don't need that, you don't need it.

## ⚙️ How it actually works

Three concepts do all the work:

- **Remote** — an app that `exposes` modules (`'./Button': './src/Button'`). Building it emits a `remoteEntry.js` manifest describing its exposed modules and shared deps.
- **Host** — an app that lists `remotes` (URLs to remote entries) and imports from them. `import('checkout/Cart')` triggers a network fetch of that remote's chunk.
- **Shared** — the crucial part. Both declare `shared: ['react', 'react-dom']`. At runtime a small negotiation picks **one** compatible copy so you don't ship React twice. `singleton: true` enforces exactly one instance — mandatory for anything stateful (React's hook dispatcher, a router, a context), because two React copies means "Invalid hook call" and broken context.

The senior detail is **version negotiation**. Shared deps have a `requiredVersion` and a `singleton` flag. If host wants React 18.2 and remote was built against 18.3, federation resolves to one that satisfies both semver ranges; a `singleton` mismatch logs a warning and uses one anyway. Get this wrong and you get subtle, environment-specific runtime breakage that never showed in either app's own build. **The hard problems in Module Federation are all dependency-graph problems, not bundling problems.**

## 💻 Code

```js
// webpack.config.js — the REMOTE (team "checkout" ships independently)
new ModuleFederationPlugin({
  name: 'checkout',
  filename: 'remoteEntry.js',
  exposes: { './Cart': './src/Cart' },
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
  },
});

// webpack.config.js — the HOST
new ModuleFederationPlugin({
  name: 'shell',
  remotes: {
    // load the remote's manifest at runtime
    checkout: 'checkout@https://checkout.example.com/remoteEntry.js',
  },
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
});
```

```tsx
// Host code — imported at RUNTIME, so lazy + boundaries are non-negotiable
const Cart = React.lazy(() => import('checkout/Cart'));

function App() {
  return (
    // If checkout.example.com is down, THIS must not white-screen the shell.
    <ErrorBoundary fallback={<CartUnavailable />}>
      <Suspense fallback={<Spinner />}>
        <Cart />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## ⚖️ Trade-offs

- **When NOT to use it:** a single team, or one deploy pipeline. If everyone ships together, federation's independent-deploy benefit is zero and you've taken on runtime-loading complexity, version-skew risk, and a harder debugging story for nothing. A monorepo with build-time packages is simpler and faster.
- **You've turned a build-time error into a runtime one.** A missing export or version mismatch that a monolith would catch at compile time now surfaces in the browser, in production, only when a specific host loads a specific remote version. Contract testing between host and remote becomes essential.
- **Shared state is genuinely hard.** Singletons solve library identity but not *app* state — routing, auth, and design-token context all need a deliberate cross-remote strategy. This is where most micro-frontend efforts actually struggle.

## 💣 Gotchas interviewers probe

- **"Invalid hook call" / broken Context** across a boundary = **two React copies**. The fix is `singleton: true` on `react` *and* `react-dom` in every app. This is the #1 federation bug and the interviewer wants you to name it instantly.
- **Version skew is a distributed-systems problem.** Host and remotes deploy independently, so at any instant they may be on different versions. You need semver discipline on shared deps and a fallback for incompatible loads.
- **A down remote must degrade gracefully.** Runtime imports fail over the network; without an `ErrorBoundary` around every remote, one team's outage white-screens the whole shell.
- **Federation ≠ micro-frontends.** It's *one* implementation. iframes, web components, and build-time integration are others with different isolation/coupling trade-offs. Don't equate the tool with the architecture.
- **Bundle duplication if `shared` is under-specified** — forget to share a heavy common lib and every remote ships its own copy, quietly ballooning total download.

## 🎯 Say this in the interview

> "Module Federation lets a host app import modules from an independently deployed remote at runtime, over the network, instead of resolving every import at build time. The whole reason to reach for it is independent deployability — a remote team can ship on their own cadence and every host picks it up live without rebuilding. The part that actually makes or breaks it is shared dependency negotiation: you mark React and React-DOM as singletons so there's exactly one copy, otherwise you get 'invalid hook call' and broken context from two React instances. I treat the hard problems as dependency-graph and distributed-systems problems, not bundling — version skew between independently deployed apps, and remotes that can be down, so every remote import lives behind an error boundary and a Suspense fallback. And I'd only use it when teams genuinely need to deploy independently; for a single team a monorepo with build-time packages is simpler and faster."

## 🔗 Go deeper

- [Module Federation](https://module-federation.io/) — the official docs and mental model, framework-agnostic.
- [webpack — Module Federation](https://webpack.js.org/concepts/module-federation/) — the original plugin and configuration reference.
- [Martin Fowler — Micro Frontends](https://martinfowler.com/articles/micro-frontends.html) — the architecture federation implements, with the integration-style trade-offs.
