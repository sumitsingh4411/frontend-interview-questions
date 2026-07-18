<div align="center">

# MVC / MVVM in the frontend

<sub>🏛️ Architecture · 🟡 Medium · ⏱ 45m · `#patterns`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — MVC, MVVM and friends are all one idea: **keep the thing that holds state separate from the thing that paints pixels.** The differences are only in *how the view stays in sync* — manual wiring (MVC), an observable binding layer (MVVM), or a re-render function (React's `UI = f(state)`, which is closest to MVVM in spirit).

---

## 🧠 Mental model

Every UI pattern is answering the same question: **when the data changes, how does the screen find out?** That single question sorts the whole family.

| Pattern | Who updates the view? | Frontend analogue |
|---|---|---|
| **MVC** | Controller mediates; you wire View→Model→View by hand | Backbone, classic Rails-style JS |
| **MVP** | Presenter holds *all* view logic; View is a dumb interface | Android, testable legacy apps |
| **MVVM** | A **binding layer** auto-syncs View ⇄ ViewModel | Angular, Vue, Knockout |
| **`UI = f(state)`** | Framework re-runs render on state change | React, Solid, Svelte |

The senior insight: **React is not MVC.** People say "the component is the controller" and it falls apart immediately. React collapses View and the sync mechanism into one function — you don't update the view, you *describe* it and let the runtime reconcile. That's a different category from "controller pushes changes into a view."

## ⚙️ How it actually works

**MVC** has three roles but its fatal ambiguity is *who owns view state* (a selected tab, a hovered row). Server MVC (Rails) is clean because the "view" is a stateless template. Client-side MVC never agreed on where transient UI state lived, so controllers bloated — this is literally why the JS community drifted away from it.

**MVVM** introduces the **ViewModel**: a projection of the Model shaped exactly for display (formatted dates, `isSubmitDisabled` booleans, derived labels). The magic is **two-way data binding** — the framework observes ViewModel properties and mutates the DOM automatically, and observes DOM input events and writes back. Angular's change detection and Vue's reactivity are MVVM binding engines. You never write "on change, update label"; the binding does it.

**Where React sits:** props/state are the ViewModel-ish input, JSX is the declarative View, and the reconciler is the binding layer — but binding is **one-way** (state → view), with events as the explicit way back up. React deliberately rejected two-way binding because implicit mutation from the view is exactly what makes MVVM apps hard to trace. `v-model` and `[(ngModel)]` are two-way sugar; `value + onChange` is one-way by design.

The pattern that actually earns its keep on the frontend is **presentational vs container** (a lightweight MVP): dumb components render, smart components hold state and logic. That's the same "separate state from paint" idea without the framework baggage.

## 💻 Code

```js
// MVVM: the ViewModel is a DISPLAY-SHAPED projection, not the raw model.
class CheckoutViewModel {
  items = observable([]);
  // derived state lives here so the View stays dumb:
  get total()          { return this.items.reduce((s, i) => s + i.price, 0); }
  get isSubmitEnabled(){ return this.items.length > 0 && !this.isLoading; }
}
// Binding layer (Vue/Angular/Knockout) auto-syncs — no manual DOM writes.
```

```jsx
// React ≈ one-way MVVM. State is the source of truth; the view is derived.
function Checkout({ items }) {
  const total = items.reduce((s, i) => s + i.price, 0); // derived, not stored
  return <button disabled={items.length === 0}>Pay {total}</button>;
}

// ❌ Two-way binding faked with a ref — mutating the view directly.
inputRef.current.value = model.name; // now who is the source of truth?

// ✅ One-way: state drives the view; events are the explicit path back.
<input value={name} onChange={e => setName(e.target.value)} />
```

## ⚖️ Trade-offs

- **Two-way binding is fast to write, hard to trace.** MVVM's auto-sync is wonderful for forms and slow when a mutation ripples through a dozen bindings and you can't tell what changed. One-way flow trades keystrokes for debuggability.
- **MVC on the client is mostly a historical answer.** Naming a component "the controller" in an interview is a yellow flag unless you can defend where view state lives.
- **Don't cargo-cult a ViewModel per component.** In React, a ViewModel is often just a custom hook. Building formal MV* layers over a framework that already separates concerns is architecture theatre.
- **When NOT to separate:** a purely presentational component with no logic doesn't need a ViewModel/container. The split earns its cost only when there's real logic to isolate and test.

## 💣 Gotchas interviewers probe

- **"Is React MVC?"** No — the correct answer is that React is one-way `UI = f(state)`, closer to MVVM in intent but rejecting two-way binding. Confidently calling React MVC is the classic tell.
- **ViewModel ≠ Model.** The ViewModel is *shaped for the view* (derived flags, formatted strings). Candidates who make it a thin pass-through of the model have missed the point.
- **Where does ephemeral UI state live?** Selected tab, open dropdown — MVC's unanswered question. A strong answer distinguishes server state, app state, and view state.
- **Two-way binding's hidden cost:** every bound property is an observer, and Angular's digest / dirty-checking history is the cautionary tale for why implicit sync doesn't scale for free.
- **MVP vs MVVM:** in MVP the presenter *pushes* to a passive view via an interface (great for testing); in MVVM the view *pulls* via bindings. People blur them constantly.

## 🎯 Say this in the interview

> "All these patterns solve one problem: keep state separate from rendering, and define how the view learns that state changed. MVC mediates through a controller and you wire the sync yourself; MVVM adds a ViewModel — a display-shaped projection of the model — and a binding layer keeps view and ViewModel in sync automatically, which is what Angular and Vue do. React is deliberately not MVC: it's `UI = f(state)`, one-way, where you describe the view and the reconciler updates the DOM. It's MVVM-ish in spirit but rejects two-way binding because implicit mutation from the view is what makes those apps hard to trace. In practice on the frontend the useful version is presentational-vs-container: dumb components paint, smart components hold logic — same principle, no ceremony. The distinction I always make explicit is where ephemeral UI state lives, because that's the question classic MVC never cleanly answered."

## 🔗 Go deeper

- [MDN — MVC](https://developer.mozilla.org/en-US/docs/Glossary/MVC) — the canonical definition and its parts.
- [MDN — MVVM](https://developer.mozilla.org/en-US/docs/Glossary/MVVM) — the ViewModel and binding concept.
- [Martin Fowler — GUI Architectures](https://martinfowler.com/eaaDev/uiArchs.html) — the definitive history of MVC/MVP/MVVM and why they diverged.
