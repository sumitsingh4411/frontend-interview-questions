<div align="center">

# Clean architecture / layering

<sub>🏛️ Architecture · 🔴 Hard · ⏱ 1h · `#architecture`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Clean architecture is one rule wearing many diagrams: **dependencies point inward, toward business logic that knows nothing about React, the network, or the DOM.** The framework is a detail you plug in at the edge, so you can swap it, test the core without a browser, and stop your domain logic from rotting every time a library changes.

---

## 🧠 Mental model

Draw concentric rings. The centre is **entities and use-cases** — pure logic that would be true whether the app were a website, a CLI, or a phone. The outer rings are **frameworks and drivers** — React, `fetch`, `localStorage`, the router. The **Dependency Rule** is the entire idea: *source-code dependencies may only point inward.* Inner code never imports outer code. Ever.

```
        ┌────────────────────────────────────┐
        │  Frameworks & drivers  (React, DOM) │  ← swappable detail
        │   ┌──────────────────────────────┐  │
        │   │  Interface adapters          │  │  ← controllers, presenters, gateways
        │   │   ┌────────────────────────┐ │  │
        │   │   │  Use cases (app logic) │ │  │  ← "add item to cart"
        │   │   │   ┌──────────────────┐ │ │  │
        │   │   │   │  Entities (domain)│ │ │  │  ← Cart, Money, invariants
        │   │   │   └──────────────────┘ │ │  │
        │   │   └────────────────────────┘ │  │
        │   └──────────────────────────────┘  │
        └────────────────────────────────────┘
                  dependencies ──▶ inward only
```

The mental unlock: **React is not your architecture — it's your delivery mechanism.** If your business rules `import React`, you've inverted the diagram, and every framework migration becomes a domain rewrite.

## ⚙️ How it actually works

The magic trick that lets inner code stay ignorant of outer code is **Dependency Inversion**. A use-case needs to save a cart, but it can't import your `fetch`-based repository (that would point outward). So the *use-case* declares an interface — `CartRepository` — and the outer layer *implements* it. The dependency arrow flips: the concrete network code now depends on the abstraction the domain owns.

- **Entities** hold invariants that outlive any use-case (`Money` can't be negative; a `Cart` can't exceed stock). Pure data + behaviour, zero imports from anything above.
- **Use-cases** orchestrate entities to fulfil one application action. They speak only in interfaces (`CartRepository`, `Clock`, `Logger`), never concrete implementations.
- **Interface adapters** translate between the domain's shape and the outside world — a repository that turns a `fetch` JSON blob into a `Cart` entity, a presenter that turns a use-case result into view state.
- **Frameworks** — React components, the HTTP client, the DB — are the outermost ring and are *injected* in.

On the frontend this is usually **overkill applied wholesale but invaluable applied surgically**. You almost never build all four rings for a UI. What you *do* steal is: keep domain logic (pricing, validation, permission rules) in plain TypeScript functions with no React import, and let hooks/components be the thin adapter that calls them. That alone makes the logic unit-testable in milliseconds without a DOM.

## 💻 Code

```ts
// entities/ — pure domain. No React, no fetch, no framework. Testable in isolation.
export class Cart {
  constructor(private items: Item[] = []) {}
  add(item: Item) {
    if (this.items.length >= 50) throw new Error('Cart full'); // invariant lives HERE
    return new Cart([...this.items, item]);
  }
  get total() { return this.items.reduce((s, i) => s + i.price, 0); }
}

// use-cases/ — depends on an INTERFACE the domain owns, not on fetch.
export interface CartRepository { save(cart: Cart): Promise<void>; }
export const addToCart = (repo: CartRepository) => async (cart: Cart, item: Item) => {
  const next = cart.add(item);   // pure rule
  await repo.save(next);         // side effect, via injected port
  return next;
};

// adapters/ — the OUTER layer implements the interface (dependency inversion).
export const httpCartRepo: CartRepository = {
  save: (cart) => fetch('/api/cart', { method: 'PUT', body: JSON.stringify(cart) }).then(() => {}),
};
```

```tsx
// React is the outermost ring — a thin delivery mechanism that injects the detail.
function useAddToCart() {
  return useMutation((item: Item) => addToCart(httpCartRepo)(currentCart, item));
}
// The domain (Cart, addToCart) has never heard of React or fetch.
```

## ⚖️ Trade-offs

- **The cost is real and mostly ceremony.** Ports, adapters, mappers and DTO↔entity translation are a lot of files for a CRUD screen. Applied to a whole SPA, clean architecture is frequently the wrong call — the abstraction earns its keep only where business rules are genuinely complex and long-lived.
- **Mapping tax.** Keeping entities separate from API DTOs means translating at every boundary. That decoupling is the point (the backend can rename a field without touching your domain) but it is ongoing work.
- **When NOT to use it:** a content site, a dashboard that's 90% display, or an MVP. If the "business logic" is just fetch-and-render, the rings are pure overhead. Reach for it when logic outlives frameworks, not before.
- **Frontend reality:** you rarely need all four layers. The 80/20 is "domain logic in framework-free modules." Full hexagonal architecture in a React app is often resume-driven.

## 💣 Gotchas interviewers probe

- **The Dependency Rule direction.** If a candidate lets an entity import a repository implementation, they've missed the entire concept. Inner code declares the interface; outer code implements it.
- **Why invert at all?** The answer is *testability and replaceability*: you can test `Cart` with no mocks and swap `fetch` for GraphQL without touching a use-case. "Because clean" is not an answer.
- **Entities vs DTOs.** The API's JSON shape is not your entity. Conflating them couples your domain to a backend contract you don't control.
- **It's about *source* dependencies, not runtime calls.** At runtime the flow goes outward (React calls the use-case). The rule constrains *imports*, not the call stack — people confuse the two constantly.
- **Over-engineering is a real failure mode.** A staff engineer knows *when to skip it*. Applying full clean architecture to a landing page signals worse judgment than not knowing it at all.

## 🎯 Say this in the interview

> "Clean architecture is really one rule: source dependencies point inward, toward business logic that knows nothing about React, the network, or the DOM. The centre is entities and use-cases — pure logic — and frameworks are the outermost, swappable ring. The mechanism that makes it work is dependency inversion: a use-case can't import my fetch code because that points outward, so the domain declares a repository *interface* and the outer layer implements it, flipping the arrow. On the frontend I apply this surgically, not wholesale — I keep pricing, validation, and permission rules in plain framework-free modules so they're testable in milliseconds without a DOM, and I let hooks and components be the thin adapter. What I'd flag is that full four-ring hexagonal architecture in a typical SPA is usually over-engineering; the judgment is knowing it's for logic that outlives frameworks, and skipping it for anything that's mostly fetch-and-render."

## 🔗 Go deeper

- [Uncle Bob — The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) — the original rings and the Dependency Rule.
- [Alistair Cockburn — Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/) — ports-and-adapters, the idea clean architecture generalises.
- [Martin Fowler — Dependency Injection & Inversion of Control](https://martinfowler.com/articles/injection.html) — the mechanism that lets inner layers stay ignorant of outer ones.
