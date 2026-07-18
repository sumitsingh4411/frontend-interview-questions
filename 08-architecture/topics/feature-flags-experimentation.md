<div align="center">

# Feature flags & experimentation

<sub>🏛️ Architecture · 🔴 Hard · ⏱ 1h · `#architecture`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A feature flag decouples **deploy** from **release**: the code ships dark, and a runtime switch decides who sees it. Experimentation is the same switch pointed at a metric instead of a rollout. The staff-level distinction is that flags are *different kinds of debt* — a release toggle lives days, a permission entitlement lives forever — and treating them the same is how you rot a codebase.

---

## 🧠 Mental model

Deploying code and releasing a feature are two different events, and flags are the wedge between them. Once they're separate you can merge to main continuously (trunk-based development), ship every hour, and still control what users experience via a dashboard — no redeploy, no hotfix branch, no waiting for a release train.

But "feature flag" is an overloaded term. Martin Fowler's taxonomy is the mental model that separates seniors from juniors — because **lifetime and dynamism dictate the implementation**:

| Type | Lives | Changes | Example |
|---|---|---|---|
| **Release toggle** | days–weeks | rarely (per deploy) | hide half-built checkout |
| **Experiment toggle** | weeks | per-request, per-user | A/B test button color |
| **Ops toggle** | months | reactively, in incidents | kill-switch a slow feature |
| **Permission toggle** | forever | per-user | premium-only feature |

A release toggle should be *deleted* the moment the feature is stable. A permission toggle is permanent entitlement logic. Wiring them through the same generic `if (flags.x)` and never cleaning up is why mature codebases drown in dead conditionals.

## ⚙️ How it actually works

**Evaluation happens somewhere, and where matters.** Client-side evaluation (flags fetched into the browser) is simple but leaks: a user can open DevTools and see every flag, including the unreleased feature's name and their bucket. Server-side / edge evaluation keeps flag rules secret and avoids the flicker of rendering the control then swapping to the variant. For anything security-sensitive or SSR, **evaluate server-side** and send the client a resolved value.

**Targeting is rule evaluation against a context.** A flag isn't a boolean; it's a rule set: `if country == 'DE' → on`, `else 20% rollout by userId hash`. Percentage rollouts must be **deterministic** — `hash(userId + flagKey) % 100 < 20` — so the same user always lands in the same bucket across page loads and devices. Random-per-request bucketing corrupts every experiment and produces a flickering UI.

**Experimentation adds a measurement layer.** An A/B test is a flag whose variant assignment is (a) deterministic, (b) recorded (exposure event), and (c) tied to a conversion metric. The hard part isn't the flag — it's the statistics: you need a pre-registered hypothesis, a sample-size calculation, and you must not peek and stop early (peeking inflates false positives massively). Sample Ratio Mismatch — buckets not splitting 50/50 as configured — invalidates the whole test and is the first thing to check.

**Flags must fail safe.** Your flag service will be slow or down at some point. Every evaluation needs a hardcoded default and a cached last-known value, so an outage in the flag provider degrades to "show the safe default", never "blank page".

## 💻 Code

```js
// Deterministic percentage rollout — the same user ALWAYS gets the same answer.
// ❌ Math.random() < 0.2  → user flickers between variants, experiment is ruined
function inRollout(userId, flagKey, pct) {
  const h = hash(`${flagKey}:${userId}`);   // stable hash, e.g. murmur/FNV
  return (h % 100) < pct;                    // deterministic bucket
}
```

```jsx
// Evaluate with a SAFE DEFAULT baked in — flag service down ≠ broken app
function useFlag(key, fallback = false) {
  const client = useContext(FlagClient);
  // client returns cached value instantly; default used if never loaded
  return client?.get(key, fallback) ?? fallback;
}

function Checkout() {
  const newFlow = useFlag('checkout-v2', false); // default OFF = ship the known-good path
  return newFlow ? <CheckoutV2 /> : <CheckoutV1 />;
}
```

```js
// Experiment: assign deterministically, then RECORD the exposure. No exposure = no analysis.
function variant(userId, exp) {
  const v = inRollout(userId, exp, 50) ? 'treatment' : 'control';
  analytics.track('experiment_exposure', { exp, variant: v, userId }); // fires ONCE, when seen
  return v;
}
```

## ⚖️ Trade-offs

- **Flags are conditional complexity you're renting.** N boolean flags mean up to 2^N runtime paths, and QA can't test them all. The discipline is aggressive expiry — a release toggle with no removal date is tomorrow's dead code. Some teams fail the build on flags older than 60 days.
- **Client vs server evaluation is a real fork.** Client: simple, but leaks flag names and causes flicker. Server/edge: secure, flicker-free, but adds infra and can't react to pure client state. SSR apps almost always want server evaluation to avoid hydration mismatch.
- **Don't A/B test everything.** Experiments need traffic to reach significance. A page with 200 visitors/week will take months to detect anything but a huge effect — below that, just ship the better-designed option and move on.
- **When NOT to flag:** trivial, reversible changes on a small app. The overhead of the flag, the cleanup, and the branching can exceed the risk it mitigates. Flags earn their keep at scale and on risky changes.

## 💣 Gotchas interviewers probe

- **"How do you bucket users for a rollout?"** Deterministic hash of `userId + flagKey`, never `Math.random()`. If they say random, they've never run a real experiment — the user would flicker and the data would be garbage.
- **Flag debt is the real cost.** The strong answer volunteers an expiry/cleanup strategy unprompted. Stale flags are a top source of production incidents (someone flips a "dead" flag that's still wired to live code).
- **Peeking invalidates experiments.** Checking the p-value daily and stopping when it dips below 0.05 dramatically inflates false positives. You fix the sample size in advance (or use sequential testing designed for it).
- **Sample Ratio Mismatch is the first sanity check.** If a 50/50 split arrives as 55/45, something's wrong with assignment or logging and the result is untrustworthy — no matter how significant it looks.
- **Client-side flags leak.** Unreleased feature names, your competitor's-eyes-only pricing test — all visible in the network tab. Anything sensitive must be evaluated server-side.
- **Flags need a safe default and offline behaviour.** "What if the flag service is down?" A senior has an answer: cached last value + hardcoded default = degrade to known-good, never blank.

## 🎯 Say this in the interview

> "The core idea is decoupling deploy from release — code ships dark behind a runtime switch, so I can merge to main continuously and control exposure from a dashboard. But I'm careful about flag *type*, using Fowler's taxonomy: a release toggle lives days and must be deleted once stable, whereas a permission toggle is permanent entitlement logic — treating them the same rots the codebase, so I put expiry dates on release flags. For rollouts and experiments I bucket users with a deterministic hash of user id plus flag key, never `Math.random()`, so a user always gets the same variant and the UI doesn't flicker. On experimentation the flag is the easy part — the discipline is fixing the sample size up front, not peeking and stopping early, and checking for sample ratio mismatch before trusting a result. And every evaluation has a hardcoded safe default so a flag-service outage degrades to the known-good path instead of a blank page. For anything sensitive I evaluate server-side, because client flags leak in the network tab."

## 🔗 Go deeper

- [Martin Fowler — Feature Toggles](https://martinfowler.com/articles/feature-toggles.html) — the definitive taxonomy and the debt argument. Read this one.
- [LaunchDarkly — Feature flag best practices](https://launchdarkly.com/blog/best-practices-short-term-permanent-flags/) — lifecycle management and cleanup discipline.
- [Microsoft — Controlled experiments (Kohavi et al.)](https://www.microsoft.com/en-us/research/group/experimentation-platform-exp/) — the statistics of trustworthy online experiments.
- [web.dev — Reduce layout shift](https://web.dev/articles/cls) — why flicker/flag-swap hurts CLS, the case for server evaluation.
