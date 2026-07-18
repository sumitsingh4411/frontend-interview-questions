<div align="center">

# MobX

<sub>🗃️ State management · 🟡 Medium · ⏱ 1h · `#mobx` `#reactivity`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — MobX makes plain mutable objects **transparently reactive**: wrap state in `observable`, and any computed or component that *reads* a field is automatically re-run when that field is *written*. It's the same auto-tracked dependency graph as signals, but at property granularity via Proxies, and you mutate state directly instead of returning new copies.

---

## 🧠 Mental model

MobX's thesis: **anything that can be derived from your state should be derived, automatically and minimally.** You keep a small core of *observable* state and describe everything else as *computed* values and *reactions*. MobX maintains the dependency graph so derivations only run when something they actually used changed.

The mental split is four concepts:

| Concept | Role |
|---|---|
| `observable` | The minimal mutable source of truth. |
| `computed` | Pure derived value, cached until a dependency changes. |
| `action` | The only place you're supposed to mutate observables. |
| `reaction` / `observer` | Side effects — re-render a component, hit the network. |

Where Redux says "state is immutable, describe changes as actions on a reducer," MobX says "state is a live object graph, just mutate it and I'll track the reads." It is the philosophical opposite of Redux, and that's the whole interview conversation.

## ⚙️ How it actually works

`makeObservable` / `makeAutoObservable` wraps your object in a **Proxy** (MobX 6). Every property read goes through a getter that, *if a derivation is currently running*, records a dependency edge. Every write goes through a setter that marks dependents stale. This is the identical `currentObserver` tracking mechanism behind signals — MobX just applies it to whole objects, arrays and Maps so `todos.push(...)` or `user.name = "x"` are tracked mutations.

`computed` values are **lazy and memoised**: they only recompute when read *and* a dependency actually changed, and they're dropped entirely when no reaction observes them (MobX suspends unobserved computeds to avoid memory leaks). Two reads in a row return the cached value.

In React, `observer(Component)` wraps the render in a `reaction`. During render, MobX tracks which observables were read; when any of them changes, MobX schedules a re-render of **that component only** — no Context, no selector, no `connect`. This is why MobX apps rarely need `memo`: an `observer` component that read nothing that changed simply doesn't re-render.

Transactionality: `action` batches mutations so reactions fire once at the end, not per assignment. With `enforceActions: "observed"` (strict mode, and you should use it), mutating outside an action throws — turning "I mutated state from a random callback" into a loud error instead of a silent race.

## 💻 Code

```js
import { makeAutoObservable, runInAction } from "mobx";

class CartStore {
  items = []; // observable
  constructor() {
    makeAutoObservable(this); // fields → observable, getters → computed, methods → action
  }
  get total() {                       // computed: cached until `items` changes
    return this.items.reduce((s, i) => s + i.price * i.qty, 0);
  }
  add(item) { this.items.push(item); } // action: direct mutation is fine

  async load() {
    const data = await fetch("/cart").then((r) => r.json());
    runInAction(() => { this.items = data; }); // async writes must be re-wrapped in an action
  }
}
```

```jsx
import { observer } from "mobx-react-lite";

// Re-renders ONLY when `cart.total` changes — MobX tracked the read during render.
const Total = observer(({ cart }) => <span>${cart.total}</span>);
```

The classic async footgun:

```js
// ❌ After `await`, you're outside the action tick — strict mode throws,
//    and reactions may not batch as you expect.
async load() {
  this.items = await fetchItems(); // mutation happens post-await
}
// ✅ Re-enter an action for the post-await mutation (runInAction or an @action helper).
```

## ⚖️ Trade-offs

- **When NOT to use it:** if your team values explicit, greppable data flow and time-travel debugging, MobX's implicit magic works against you — a re-render has no stack trace back to a dispatched action. Redux Toolkit's ceremony *is* the audit log.
- **Proxies hide mutation.** The ergonomics ("just assign it") are great until a bug means "which of 40 places mutated this?" has no answer. `enforceActions: "observed"` reclaims some discipline.
- **Class-and-OOP flavour** fits some teams and repels others; the ecosystem trend (hooks, signals, RSC) leans functional.
- **Subtle reactivity gaps:** destructuring an observable (`const { name } = user`) reads the value *now* and drops the subscription — a whole class of "why didn't it update?" bugs. Deref inside the tracked scope.

## 💣 Gotchas interviewers probe

- **"How does MobX know what to re-render?"** It tracks property reads during render via a Proxy and subscribes the component to exactly those observables — same auto-tracking as signals, at object granularity. Say the mechanism.
- **Destructuring breaks reactivity.** Pulling a primitive out of an observable severs the connection; access `store.field` inside the observed render, don't lift it out early.
- **`async` + mutation.** Writes after an `await` are outside the action and (in strict mode) throw — wrap them in `runInAction`.
- **`computed` only stays cached while observed.** Read a computed outside any reaction and it recomputes every time — the memoisation depends on being watched.
- **MobX vs Redux is a philosophy question, not a feature list.** Immutable + explicit actions + single store (Redux) vs mutable + transparent tracking + many stores (MobX). Know *why* each choice exists.
- **Reference vs deep observability.** `observable.ref` / `observable.shallow` exist because deep-observing large structures has a cost; MobX deep-converts by default.

## 🎯 Say this in the interview

> "MobX is transparent reactivity over mutable state. You mark a minimal core as observable, express everything derivable as computed values, and mutate inside actions. Under the hood it Proxies your objects: reads during a derivation record dependencies, writes mark dependents stale — the same auto-tracked graph as signals, just at object granularity. In React, `observer` wraps a component's render and subscribes it to exactly the observables it read, so only affected components re-render and you rarely need `memo`. It's the philosophical inverse of Redux: mutable and implicit versus immutable and explicit. The trade-off is debuggability — a re-render doesn't trace back to a dispatched action. The gotchas I watch for are destructuring, which drops the subscription, and mutating after an `await`, which escapes the action, so I re-wrap those in `runInAction`. I'd reach for MobX on a complex domain model where deriving state cleanly matters more than a time-travel audit log."

## 🔗 Go deeper

- [MobX — The gist of MobX](https://mobx.js.org/the-gist-of-mobx.html) — observable / computed / reaction in one page.
- [MobX — Understanding reactivity](https://mobx.js.org/understanding-reactivity.html) — exactly which reads are tracked, and how destructuring breaks it.
- [MobX — Actions & async](https://mobx.js.org/actions.html) — the `runInAction` rule and strict mode.
- [MobX — API reference](https://mobx.js.org/README.html) — `makeAutoObservable`, `observer`, `reaction`, `observable.ref`.
