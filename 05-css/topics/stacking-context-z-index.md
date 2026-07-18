<div align="center">

# Stacking context & z-index

<sub>🎨 CSS · 🔴 Hard · ⏱ 1h · `#layout` `#stacking`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `z-index` is **not global** — it's only compared *within a stacking context*. A stacking context is a self-contained z-axis subtree, and children can **never** escape it, no matter how huge their `z-index`. Countless "`z-index: 9999` still behind the modal" bugs are actually a *parent* that quietly created a stacking context.

---

## 🧠 Mental model

The page paints in a defined order, and `z-index` only reshuffles siblings **inside the same stacking context**. Think of stacking contexts as sealed boxes stacked on a shelf: you can rearrange the items *inside* a box, but a box's position on the shelf is fixed by its parent. An item in a lower box can *never* rise above the box next to it, even if you write `z-index: 999999` on it — because that number is only compared against its box-mates.

So the real question is never "what z-index do I need?" It's "**which stacking context is my element trapped in, and where does that context sit relative to the thing I'm fighting?**"

## ⚙️ How it actually works

**What creates a stacking context** (the non-obvious ones are where bugs live):

- The root `<html>`.
- `position: relative/absolute` **with a `z-index` other than `auto`**.
- `position: fixed` or `sticky` (z-index or not).
- **`opacity` less than 1.**
- **`transform`, `filter`, `perspective`, `backdrop-filter`, `clip-path`, `mask`.**
- `will-change` naming any of the above.
- `isolation: isolate` (its *only* purpose — a context with no side effects).
- `mix-blend-mode` other than `normal`; `contain: layout/paint/content`.
- A flex/grid **child** with a `z-index` other than `auto`.

The killers are `opacity`, `transform`, and `filter`: you add a fade or an animation to a parent and, invisibly, it becomes a stacking context that traps every descendant's z-index.

**Painting order within a single context** (back to front): the element's background/border → negative-z-index children → in-flow block boxes → floats → in-flow inline boxes → `z-index: auto`/`0` positioned children → positive-z-index children. This is why a positioned sibling with no z-index still paints *over* an earlier static sibling.

## 💻 Code

```css
/* ❌ The modal is behind the header, and no z-index fixes it */
.page-header { position: relative; z-index: 10; } /* creates a context at level 10 */
.content     { transform: translateZ(0); }        /* ⚠️ NEW stacking context! */
.content .modal { position: fixed; z-index: 9999; } /* trapped inside .content */
/* .modal's 9999 is compared only against siblings INSIDE .content,
   so the whole .content box still sits below .page-header's level 10 */
```

```css
/* ✅ Fix by controlling context placement, not by inflating z-index */
/* Option A: portal the modal to <body> so it's a top-level context */
/* Option B: raise the modal's OWN stacking context above the header */
.modal-root { position: fixed; inset: 0; z-index: 1000; } /* sibling of header */
```

```css
/* isolation: create a stacking context on purpose, with zero visual side effects */
.card { isolation: isolate; }  /* internal z-index games can't leak out or in */
```

```css
/* Negative z-index paints behind the parent's background — a decorative trick */
.hero { position: relative; }
.hero::before { position: absolute; inset: 0; z-index: -1; background: url(bg.jpg); }
```

## ⚖️ Trade-offs

- **`isolation: isolate` is the clean tool** for scoping z-index to a component so its internal layering can't collide with the rest of the app. Prefer it over ever-escalating z-index values.
- **A shared z-index scale** (design tokens: `--z-dropdown: 100; --z-modal: 400; --z-toast: 700`) beats magic numbers — but it only works if everyone respects that these are compared *within the same context*. Discipline over `9999`.
- **Portalling overlays to `<body>`** sidesteps trapping entirely, at the cost of moving DOM out of its logical place (watch focus management and a11y).
- **Adding `opacity`/`transform` for a nice animation has a hidden layout cost**: it can silently re-layer a whole subtree. Sometimes worth `isolation: isolate` up front to make the context explicit.

## 💣 Gotchas interviewers probe

- **`z-index: 9999` doesn't work → a parent made a stacking context.** *The* classic. The answer is never a bigger number; it's finding the trapping ancestor.
- **`opacity < 1`, `transform`, and `filter` create stacking contexts** even without `position` or `z-index`. The most surprising and most common culprits.
- **`z-index` needs a positioned element (or flex/grid item).** On a plain static block it's inert.
- **Children can't escape their parent's context.** A child's z-index is only ever compared to its siblings; the parent's level in *its* context is what actually decides cross-context order.
- **`position: relative` alone does *not* create a context** — only with a non-`auto` `z-index`. But `fixed`/`sticky` always do.
- **`isolation: isolate` creates a context with no other effect** — the intended, side-effect-free way to scope layering.
- **Painting order without z-index:** positioned siblings paint over static ones; source order breaks ties.

## 🎯 Say this in the interview

> "The key thing is that `z-index` is not global — it's only compared *within* a stacking context, and a stacking context is a sealed subtree that its children can never escape. So when someone says `z-index: 9999` isn't working, the answer is almost never a bigger number; it's that a parent quietly created a stacking context and trapped the element inside it. The usual culprits are the non-obvious ones: `opacity` below 1, `transform`, and `filter` all create a stacking context with no `position` or `z-index` involved — so you add a fade animation to a wrapper and suddenly your modal is layered below the header. The fix is either to portal the overlay out to the body so it's a top-level context, or to control where the *context* sits rather than inflating numbers. And when I want to scope a component's internal layering so it can't collide with the rest of the app, I use `isolation: isolate`, which creates a stacking context with no visual side effects at all."

## 🔗 Go deeper

- [Josh Comeau — Stacking contexts](https://www.joshwcomeau.com/css/stacking-contexts/) — the clearest mental model, with interactive demos.
- [MDN — Stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context) — the authoritative list of what creates one.
- [MDN — `isolation`](https://developer.mozilla.org/en-US/docs/Web/CSS/isolation) — the side-effect-free way to create a context.
