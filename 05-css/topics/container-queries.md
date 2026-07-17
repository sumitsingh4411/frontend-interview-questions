<div align="center">

# Container queries

<sub>🎨 CSS · 🔴 Hard · ⏱ 1h · `#responsive` `#modern`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Media queries ask "how big is the *screen*?"; container queries ask "how big is the *space I was handed*?" A component becomes truly reusable when it responds to its own container, not the viewport — a card in a sidebar and the same card in a wide grid can lay themselves out differently with identical markup.

---

## 🧠 Mental model

The whole idea is a shift of the coordinate system. A media query is global — it knows the viewport and nothing else — so a component styled with media queries has to *guess* how much room it will get. That guess breaks the moment you drop the component somewhere new: a product card designed to go two-up at 600px looks absurd stuffed into a 300px sidebar on a 1400px screen, because the viewport says "wide" while the actual slot says "narrow".

Container queries move the question to the component's **containing element**. You designate an ancestor as a *query container*, and descendants can then ask about *its* width. The component stops caring where it lives — it reads the space it was actually given.

```
Media query:  "viewport is 1400px" → card renders wide  → wrong, it's in a 300px rail
Container:    "my container is 300px" → card renders stacked → correct, always
```

## ⚙️ How it actually works

You opt an element in with `container-type`, which does two things: it makes the element a **query container** for its descendants, and it applies **containment** so the browser can size it independently.

- `container-type: inline-size` — the common case. Establishes containment on the **inline axis only** (width, in horizontal writing modes). The container's block size still comes from its content.
- `container-type: size` — queries on **both** axes, but now the element must have an externally-determined block size too, or it collapses. Rarely what you want.
- `container-type: normal` — not a query container, but still usable for style queries.

**Why containment is mandatory** is the senior insight. If a child could resize its own container by responding to that container's size, you'd get an infinite loop: container shrinks → child restyles → child changes container's size → repeat. `container-type` applies *size containment* on the queried axis, which severs that dependency — the container's size on that axis can no longer depend on its contents. That's the price of admission, and it's why `inline-size` (which only contains width) is safe and cheap while `size` (which contains both) needs an explicit height.

Queries themselves use `@container`, optionally targeting a named container, plus **container query units** — `cqw`, `cqh`, `cqi` (inline), `cqb` (block), `cqmin`, `cqmax` — that are percentages of the *nearest query container*, not the viewport.

## 💻 Code

```css
/* The card doesn't know or care about the viewport. */
.card-wrap {
  container-type: inline-size;
  container-name: card;   /* naming avoids matching the wrong ancestor */
}

.card {
  display: grid;
  gap: 1rem;
}

/* When the CONTAINER is wide enough, go side-by-side. */
@container card (min-width: 28rem) {
  .card {
    grid-template-columns: 12rem 1fr;
  }
  .card__title {
    font-size: 1.5rem;   /* or: clamp(1rem, 5cqi, 1.5rem) — scale to container */
  }
}
```

```css
/* ❌ You CANNOT query an element by putting container-type on itself. */
.card {
  container-type: inline-size;
}
@container (min-width: 28rem) {
  .card { grid-template-columns: 1fr 1fr; } /* never matches — .card queries its OWN container */
}
/* ✅ A container queries its DESCENDANTS. The card needs a wrapper. */
```

## ⚖️ Trade-offs

- **Container queries need a wrapper element.** A component queries its *ancestor*, never itself, so the reusable unit becomes "wrapper + content". That's one extra div per queryable component — usually worth it, occasionally annoying.
- **Size containment has side effects.** Containment can affect how margins collapse and how the element interacts with floats; on `container-type: size` a missing height silently collapses the box. Reach for `inline-size` unless you truly need both axes.
- **Don't retire media queries.** Page-level layout (the shell, the grid of columns, the nav) genuinely depends on the viewport. Container queries are for *components*; media queries are for the *page*. Use both.

## 💣 Gotchas interviewers probe

- **"Can an element query its own size?"** No. Containment forbids the loop. It queries the nearest ancestor container — hence the wrapper. Candidates who put `container-type` and `@container` on the same element expose that they haven't used it.
- **`inline-size` vs `size`.** `inline-size` contains one axis and needs no explicit height; `size` contains both and *requires* a resolvable block size or the box collapses. Know why: an element can't be size-contained on an axis whose size depends on content.
- **Container query units are relative to the query container, not the viewport.** `50cqi` is half the container's inline size — this is what makes `clamp(1rem, 5cqi, 2rem)` fluid *per component*.
- **Naming prevents accidental matches.** With nested containers, an unnamed `@container` binds to the *nearest* one. `container-name` targets deliberately.
- **`content-visibility`/containment interplay.** `container-type` is part of the same CSS Containment family — it's not free magic, it's the layout engine skipping work.

## 🎯 Say this in the interview

> "Container queries fix the fundamental flaw in component-based responsive design: media queries only know the viewport, so a component can't know how much space it actually got. I mark an ancestor as a query container with `container-type: inline-size`, and descendants respond to *that* element's width with `@container`. The key mechanism is containment — `container-type` applies size containment on the queried axis, which is required because otherwise a child responding to its container's size could change that size and loop forever. That's also why `inline-size` is the safe default: it only contains width, so I don't need to give the box an explicit height. Practically it means one extra wrapper element, because a component queries its ancestor, not itself — and I still keep media queries for page-level layout."

## 🔗 Go deeper

- [MDN — Container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) — the canonical reference for `container-type`, `@container`, and the units.
- [MDN — CSS containment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment) — why containment exists and what each value severs.
- [web.dev — Container queries](https://web.dev/articles/cq-stable) — the practical component-driven walkthrough with real examples.
- [MDN — Container query length units](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries#container_query_length_units) — `cqi`, `cqb`, and friends.
