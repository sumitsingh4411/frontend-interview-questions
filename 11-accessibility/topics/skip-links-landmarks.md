<div align="center">

# Skip links & landmarks

<sub>♿ Accessibility · 🟢 Easy · ⏱ 30m · `#navigation`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — **Landmarks** (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`) carve the page into regions a screen reader can jump between, so users don't wade through everything linearly. A **skip link** is a landmark's poorer cousin for keyboard-only users: the first focusable element on the page, hidden until focused, that jumps past the repeated nav straight to `<main>`.

---

## 🧠 Mental model

A sighted user skims. They find the search box, the nav, the article, the footer in a glance and go straight where they want. Screen-reader and keyboard-only users move **sequentially** unless you give them shortcuts — and without shortcuts, every page starts with the same fifty header/nav links before the actual content. That's the problem landmarks and skip links solve, from two angles.

**Landmarks** are for screen-reader users: assistive tech builds a list of the page's regions, and users jump between them with a single keystroke ("go to main", "next navigation"). **Skip links** are for keyboard-only users who *aren't* running a screen reader — they have no landmark list, so you hand them one visible shortcut to bypass the repeated chrome. Same goal — don't force linear traversal of boilerplate — different audience.

## ⚙️ How it actually works

**Landmarks come from semantic HTML for free.** Native elements map to landmark roles, which is the whole argument for semantic markup over `<div>` soup:

| Element | Landmark role | There should be… |
|---|---|---|
| `<header>` (top level) | `banner` | one per page |
| `<nav>` | `navigation` | as many as needed — **label them** |
| `<main>` | `main` | **exactly one** per page |
| `<aside>` | `complementary` | as needed |
| `<footer>` (top level) | `contentinfo` | one per page |
| `<section>` with a name | `region` | when it needs to be findable |

Two rules do most of the work: **one `<main>`**, and **label repeated landmarks**. If you have two `<nav>`s (primary + breadcrumb), give each an `aria-label` ("Primary", "Breadcrumb") — otherwise the screen reader's landmark list reads "navigation, navigation" and the shortcut is useless. `<header>`/`<footer>` only count as `banner`/`contentinfo` when they're **top-level** (not nested inside `<article>`/`<section>`).

**A skip link is just an in-page anchor** whose target is your `<main id="main">`. Three details make it actually work:

1. It must be **the first focusable element** in the DOM — so the very first `Tab` reveals it.
2. It's **visually hidden until focused** (not `display:none`, which would remove it from the tab order too) — clipped off-screen, then a `:focus` style slides it into view.
3. Its target needs to be able to receive focus. Following `#main`, focus should move *into* `<main>`; add `tabindex="-1"` to the target so the browser reliably focuses it rather than just scrolling.

## 💻 Code

```html
<body>
  <!-- FIRST focusable thing on the page. Off-screen until focused. -->
  <a class="skip-link" href="#main">Skip to main content</a>

  <header>…logo…</header>
  <nav aria-label="Primary">…many links…</nav>

  <!-- tabindex="-1" so focus actually lands here, not just scroll -->
  <main id="main" tabindex="-1">
    <h1>Page title</h1>
    …
  </main>

  <footer>…</footer>
</body>
```

```css
/* Hidden but IN the tab order (not display:none), so Tab can reach it. */
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
}
/* Slide into view the instant it receives focus. */
.skip-link:focus {
  left: 8px;
  top: 8px;
  z-index: 1000;
  background: Canvas;
  color: CanvasText;
  padding: 8px 12px;
}
```

```html
<!-- ❌ Two navs, no labels: the landmark list reads "navigation,
     navigation" — the jump shortcut can't tell them apart. -->
<nav>…primary…</nav>
<nav>…breadcrumb…</nav>

<!-- ✅ Labelled: the list reads "Primary navigation", "Breadcrumb". -->
<nav aria-label="Primary">…</nav>
<nav aria-label="Breadcrumb">…</nav>
```

## ⚖️ Trade-offs

- **Landmarks are free with semantic HTML; explicit `role`s are the fallback.** Prefer `<nav>` over `<div role="navigation">`. Add roles only for legacy markup you can't change to real elements.
- **Skip links help keyboard users without a screen reader** — a population landmarks alone don't serve. On a content-heavy site with a big nav they're near-mandatory; on a trivial single-column page with almost no chrome the payoff shrinks, though they're cheap enough to keep.
- **When NOT to over-do it:** wrapping every block in `<section>` or bolting on landmark roles "for completeness" bloats the landmark list until it's as noisy as no landmarks at all. A handful of meaningful regions beats twenty.

## 💣 Gotchas interviewers probe

- **The skip link must come *first* and be genuinely reachable** — hidden with `display:none` it drops out of the tab order and the first `Tab` never finds it. Use off-screen positioning instead.
- **Skip-link target needs `tabindex="-1"`** or focus may not move into it — some browsers scroll but leave focus behind, so the *next* `Tab` resumes from the old spot, defeating the point.
- **More than one `<main>`** confuses the landmark list; there must be exactly one.
- **Unlabeled duplicate landmarks** ("navigation, navigation") make the shortcut useless — label repeated `<nav>`s and `<section>`s with `aria-label`/`aria-labelledby`.
- **`<header>`/`<footer>` nested inside `<article>`/`<section>` are NOT `banner`/`contentinfo`** — the landmark role only applies at the top level. A common surprise.
- **`<section>` is only a `region` landmark when it has an accessible name** — an unnamed `<section>` is just a generic container in the tree.

## 🎯 Say this in the interview

> "The goal is to spare screen-reader and keyboard users from traversing the whole page linearly. Landmarks handle the screen-reader side — I use semantic elements, `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, which map to landmark roles for free, and assistive tech lets users jump straight to any of them. The two things I get right are exactly one `<main>` and labelling repeated landmarks, because a list that reads 'navigation, navigation' is no help — I give each `<nav>` an `aria-label`. For keyboard-only users who aren't running a screen reader, I add a skip link: the first focusable element on the page, positioned off-screen so it's still in the tab order, that reveals on focus and jumps to `<main>`. I give the `<main>` target `tabindex='-1'` so focus actually moves into it rather than just scrolling the page."

## 🔗 Go deeper

- [web.dev — Navigation and landmarks](https://web.dev/learn/accessibility/navigation) — landmarks, headings, and skip links together.
- [MDN — ARIA landmark roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/landmark_role) — the element-to-role mapping and labelling rules.
- [WebAIM — Skip Navigation Links](https://webaim.org/techniques/skipnav/) — the definitive guide, including the focus-target caveat.
- [W3C — ARIA landmarks example](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/) — how many of each and how to label them.
