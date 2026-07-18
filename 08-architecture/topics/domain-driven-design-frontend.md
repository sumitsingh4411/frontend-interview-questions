<div align="center">

# Domain-Driven Design (frontend)

<sub>🏛️ Architecture · 🔴 Hard · ⏱ 1.5h · `#ddd`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — DDD on the frontend isn't about entities and repositories cargo-culted from the backend; it's about organising code around **business capabilities** and their **language**, drawing hard boundaries (bounded contexts) so a "user" in billing and a "user" in messaging can mean different things without one team's model leaking into another's.

---

## 🧠 Mental model

Most frontends are organised by **technical layer** — a `components/` folder, a `hooks/` folder, a `utils/` folder — which means one business feature is smeared across six directories and no folder tells you what the app *does*. DDD flips the primary axis: organise by **domain** first (`checkout/`, `catalog/`, `account/`), technical layer second. The folder tree becomes a map of the business, not a map of React.

The load-bearing idea is the **bounded context**: a boundary inside which a term has exactly one meaning. "Order" in the cart context is a mutable draft; "Order" in the fulfilment context is an immutable historical record. Trying to force both into one shared `Order` type is the classic mistake — you get a god-object with 40 optional fields, half meaningful only in one context. DDD says: let them be *different types*, and translate at the seam.

## ⚙️ How it actually works

The pieces that actually transfer to the frontend:

- **Ubiquitous language** — the code uses the exact words the domain experts use. If the business says "void a transaction", the function is `voidTransaction()`, not `deletePayment()`. This is the highest-ROI part of DDD and costs nothing.
- **Bounded contexts** — top-level modules with their own models, their own types, their own state. They communicate through **explicit, narrow interfaces** (events, or a typed API), never by importing each other's internals.
- **Anti-corruption layer (ACL)** — the translation seam. The backend returns a sprawling `UserDTO`; your domain doesn't consume it directly. A mapper converts it into *your* `Customer` model at the boundary, so a backend rename doesn't ripple through 200 components. This is where frontend DDD earns its keep — the ACL is your firewall against a chaotic API.
- **Domain logic lives in plain modules**, not in components. Pricing rules, eligibility checks, and state transitions are framework-agnostic functions you can unit-test without rendering anything. Components become thin — they orchestrate and display.

The value axis: DDD is **coupling management**. It pays off precisely when you have multiple teams, a large surface area, and a domain complex enough that misusing a term causes real bugs.

## 💻 Code

```ts
// ❌ Layer-first: one feature scattered, models shared and bloated
// components/UserCard.tsx, hooks/useUser.ts, types/User.ts (used everywhere)

// ✅ Domain-first: a bounded context owns its model end-to-end
// src/contexts/billing/
//   ├── domain/         invoice.ts, canRefund.ts   (pure, testable, no React)
//   ├── infra/          billingApi.ts, mappers.ts  (the anti-corruption layer)
//   └── ui/             InvoiceList.tsx

// domain/canRefund.ts — pure business rule, framework-free
export function canRefund(invoice: Invoice, now: Date): boolean {
  return invoice.status === 'paid'
      && daysBetween(invoice.paidAt, now) <= 30;
}

// infra/mappers.ts — the ACL: backend shape → OUR shape
// A backend field rename dies here instead of rippling through the UI.
export function toInvoice(dto: BillingApiDto): Invoice {
  return {
    id: dto.inv_id,
    status: dto.state === 'SETTLED' ? 'paid' : 'pending',
    paidAt: dto.settled_ts ? new Date(dto.settled_ts) : null,
  };
}
```

## ⚖️ Trade-offs

- **When NOT to use it:** a small app, a solo team, or a CRUD-shaped domain with no interesting rules. DDD's ceremony (contexts, ACLs, mappers) is pure overhead when there's no complexity to tame. Applying it to a landing page is résumé-driven development.
- **The ACL has a real cost** — you maintain two shapes (DTO and domain model) and a mapper between them. Worth it when the API is unstable or shared across contexts; wasteful when your frontend is the only consumer of a backend you also own and can shape freely.
- **Bounded contexts fight code reuse.** Duplicating a small `Address` type across two contexts is often *correct* — the shared abstraction couples the contexts and the "reuse" becomes a liability the day the two addresses need to diverge.

## 💣 Gotchas interviewers probe

- **"Isn't DDD a backend thing?"** The tactical patterns (aggregates, repositories) are backend-flavoured, but the *strategic* patterns — ubiquitous language, bounded contexts, ACL — are exactly what large frontends need. Lead with strategic DDD; that's the senior read.
- **Shared type = leaked boundary.** The moment two contexts import the same `User` interface, you've coupled them. The interviewer wants to hear that you'd rather duplicate a type than share it across a boundary.
- **DDD ≠ folder structure.** Renaming folders to domain names while models still leak everywhere is cargo cult. The boundary is enforced by *dependency rules* (context A cannot import context B's internals), ideally checked by lint (`eslint-plugin-boundaries`) or Nx tags.
- **Ubiquitous language drift** — the UI says "archive", the code says "soft-delete", the PM says "hide". That gap *is* the bug factory DDD exists to close.

## 🎯 Say this in the interview

> "On the frontend I use the strategic side of DDD more than the tactical side. The two things I insist on are ubiquitous language — the code uses the exact words the business uses — and bounded contexts, where each top-level domain owns its own model and state, and contexts talk through narrow interfaces instead of importing each other's internals. The piece that earns its keep on the frontend specifically is the anti-corruption layer: I map the backend's DTOs into my own domain types at the boundary, so a messy or changing API can't ripple through the whole UI. And I'll happily duplicate a type across two contexts rather than share it — a shared type silently couples the contexts. I reach for all this when there are multiple teams and a genuinely complex domain; on a small app it's just ceremony."

## 🔗 Go deeper

- [DDD Reference (Eric Evans)](https://www.domainlanguage.com/ddd/reference/) — the canonical definitions of bounded context, ubiquitous language, and context mapping.
- [Martin Fowler — Bounded Context](https://martinfowler.com/bliki/BoundedContext.html) — the clearest short explanation of the central concept.
- [Martin Fowler — Anti-Corruption Layer](https://martinfowler.com/bliki/AnticorruptionLayer.html) — why you translate at the seam.
- [feature-sliced.design](https://feature-sliced.design/) — a concrete, frontend-native take on domain-first structure and enforced boundaries.
