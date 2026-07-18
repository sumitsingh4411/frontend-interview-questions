<div align="center">

# Feature-based / feature-sliced structure

<sub>🏛️ Architecture · 🟡 Medium · ⏱ 45m · `#structure`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Organise the codebase by **what the app does** (checkout, search, profile) instead of by **what things technically are** (components, hooks, utils). The type-based tree scales with framework concepts; the feature-based tree scales with your product — and only one of those keeps growing forever.

---

## 🧠 Mental model

There are two axes you can fold a codebase along. **Technical type** (`/components`, `/hooks`, `/services`, `/utils`) or **domain feature** (`/checkout`, `/search`, `/auth`). Almost every tutorial ships the first; almost every large app regrets it.

The tell is what happens when you build a feature. In a type-based tree, one feature smears across six top-level folders, and to delete it you have to grep. In a feature-based tree, a feature is a **folder you can move, own, or delete as a unit**. Cohesion is high inside the folder, coupling is low across folders — which is the whole point of any architecture.

```
type-based (scales with the FRAMEWORK)     feature-based (scales with the PRODUCT)
src/                                        src/
  components/  ← 400 files, no domain         features/
  hooks/       ← whose hook is this?           checkout/   ← ui + hooks + api + model
  services/                                    search/
  utils/       ← the junk drawer               profile/
                                             shared/       ← truly cross-cutting only
```

## ⚙️ How it actually works

**Feature-Sliced Design (FSD)** formalises this into a grid with two dimensions. *Layers* (vertical) impose a strict import direction; *slices* (horizontal) are the business domains.

- **Layers, top to bottom:** `app` → `pages` → `widgets` → `features` → `entities` → `shared`. The iron rule: **a module may only import from layers strictly below it.** `features` can use `entities` and `shared`; `entities` can never reach up into `features`. This is what actually prevents the spaghetti — the dependency arrow only points one way.
- **Slices** are the domain folders inside a layer (`entities/user`, `features/add-to-cart`). **Slices on the same layer may not import each other.** Cross-slice reuse is forced *downward* into a lower layer, which is how you discover what's genuinely shared.
- **Segments** split each slice by technical role: `ui`, `model` (state/logic), `api`, `lib`. So the type-based split still exists — it just lives *inside* a feature instead of at the root.

The subtle win is the **public API per slice** (`index.ts`). Everything outside the slice imports from that barrel; the internals are private. That gives you real encapsulation in a language that doesn't otherwise have module-private visibility.

## 💻 Code

```
src/
  features/
    add-to-cart/
      ui/AddToCartButton.tsx
      model/useCart.ts          # state + logic for THIS feature
      api/addItem.ts            # network calls for THIS feature
      index.ts                  # the ONLY public surface
  entities/
    product/
      ui/ProductCard.tsx
      model/product.ts          # the Product type + normalisers
      index.ts
  shared/
    ui/Button.tsx               # dumb, domain-agnostic primitives
    lib/formatCurrency.ts
```

```ts
// ❌ Reaching into a slice's internals — bans the slice from ever refactoring
import { useCart } from '@/features/add-to-cart/model/useCart';

// ✅ Import only the public API. Internals stay free to move.
import { AddToCartButton, useCart } from '@/features/add-to-cart';
```

```js
// Enforce the layer rule mechanically — an architecture you don't lint is a suggestion.
// eslint-plugin-boundaries / import/no-restricted-paths:
'import/no-restricted-paths': ['error', { zones: [
  { target: './src/entities', from: './src/features' }, // entities must not import features
]}]
```

## ⚖️ Trade-offs

- **The cost is upfront ceremony.** A three-page CRUD app under full FSD is over-engineered — you'll write more barrels than logic. Feature folders yes; the whole six-layer grid, only when multiple teams collide.
- **"Shared" is where discipline dies.** Everything looks reusable at 2pm on a deadline, and `shared/` quietly becomes the new `utils/` junk drawer. The rule of thumb: something graduates to `shared` only on the *third* real consumer, and only if it carries no domain knowledge.
- **Feature boundaries are guesses, and guesses age.** When `checkout` and `cart` turn out to be one thing, you have a folder migration. That's still cheaper than untangling a type-based tree, but it isn't free.
- **When NOT to use it:** design-system / component-library packages are genuinely type-based by nature (a `Button` isn't a "feature"). Don't force domain slicing onto a primitives library.

## 💣 Gotchas interviewers probe

- **"By feature" ≠ "by route."** A feature can span several pages, and a page can compose several features. Slicing by URL is a common, shallower imitation that reintroduces coupling.
- **The junk-drawer smell.** If your answer to "where does this go?" is *always* `shared/` or `utils/`, you don't have an architecture — you have a type-based tree wearing a feature-based hat.
- **Cross-feature imports are the real test.** Most candidates allow `features/a` to import `features/b` "just this once." That single exception is how the layered structure rots back into a graph.
- **Colocation includes tests and styles.** `Feature.test.tsx` and its styles live *in the feature folder*, not in a mirrored `/tests` tree. If deleting the feature leaves orphans elsewhere, the boundary was fake.
- **Barrels have a build cost.** Overusing `index.ts` re-exports can defeat tree-shaking and slow cold builds. Scope the public API deliberately; don't re-export the universe.

## 🎯 Say this in the interview

> "I organise by feature, not by file type, because a type-based tree scales with the framework's vocabulary while a feature-based tree scales with the product — and it's the product that keeps growing. The concrete win is that a feature becomes a unit you can own, move, or delete as one folder, with high cohesion inside and low coupling across. Feature-Sliced Design pushes this further with layers that enforce a one-way import direction — features can use entities but entities can never reach up — and a public API per slice so internals stay private. The two things I watch: the `shared` folder becoming the new junk drawer, and someone letting one feature import another 'just once,' which is exactly how the layering rots. I lint the boundaries so the architecture is enforced, not just documented — and I scale the ceremony to the app; a small CRUD app doesn't need the full grid."

## 🔗 Go deeper

- [Feature-Sliced Design](https://feature-sliced.design/) — the canonical spec: layers, slices, segments, and the import rules.
- [Bulletproof React](https://github.com/alan2207/bulletproof-react) — a pragmatic, real-world feature-based React structure.
- [Kent C. Dodds — Colocation](https://kentcdodds.com/blog/colocation) — the underlying principle: keep code as close as possible to where it's used.
