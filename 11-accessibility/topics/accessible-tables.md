<div align="center">

# Accessible tables

<sub>♿ Accessibility · 🟡 Medium · ⏱ 45m · `#tables`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A real `<table>` with `<th scope>` gives screen readers the one thing they can't otherwise reconstruct: **which headers describe the cell I'm on**. So AT reads "Revenue, Q3, $1.2M" instead of a naked "$1.2M." The moment you rebuild a table out of `<div>`s, you throw that away — and no amount of ARIA fully buys it back.

---

## 🧠 Mental model

Sighted users read a data cell by *glancing* at the column header above it and the row header to its left — a two-dimensional lookup done in a fraction of a second by eye. A screen-reader user reads linearly, one cell at a time, and cannot glance. The entire job of table semantics is to **rebuild that spatial relationship as data**: when the user lands on a cell, AT should be able to announce the headers that give it meaning.

`<th scope="col">` and `<th scope="row">` are how you declare those associations. Get them right and navigating a table with a screen reader is genuinely usable — the user moves cell to cell and hears the relevant headers re-announced when the row or column changes. Get them wrong (or use `<div>`s) and the user hears a stream of context-free values. This is why the senior answer is blunt: **use `<table>` for tabular data, and never for layout.**

## ⚙️ How it actually works

**`scope` is the core mechanism.** `<th scope="col">` says "I am the header for everything below me"; `<th scope="row">` says "I am the header for everything to my right." Screen readers use these to compute, for any `<td>`, its associated headers. Most simple tables need nothing more.

**Structural elements carry meaning too.** `<caption>` provides the table's accessible name (announced on entry, and it's a visible title — better than a floating `<h3>`). `<thead>`/`<tbody>`/`<tfoot>` let AT and the browser distinguish header rows from data, and keep the header visible when the body scrolls. A `<td>` in the `<thead>` is still a data cell — headers must be `<th>`.

**Complex tables** — cells associated with multiple non-adjacent headers, or spanning cells — outgrow `scope`. Then you use explicit `headers`/`id`: each `<td headers="h-col h-row">` lists the `id`s of its headers. It's verbose and error-prone, which is itself a signal: **if you need `headers`/`id`, consider splitting the table**, because a table too complex to describe with `scope` is usually too complex for a screen-reader user to hold in their head.

**Sortable columns** add `aria-sort="ascending|descending|none"` on the active header's `<th>`, with the sort control as a `<button>` inside it — never make the whole `<th>` a click target with no keyboard affordance.

## 💻 Code

```html
<table>
  <caption>Quarterly revenue by region</caption>   <!-- accessible name -->
  <thead>
    <tr>
      <th scope="col">Region</th>
      <th scope="col" aria-sort="descending">
        <button>Q3</button>                          <!-- sortable header -->
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">EMEA</th>                       <!-- row header! -->
      <td>$1.2M</td>                                  <!-- announced with both headers -->
    </tr>
  </tbody>
</table>
```

```html
<!-- ❌ a "table" AT cannot navigate as a table -->
<div class="grid">
  <div class="cell">$1.2M</div>   <!-- no row/col context; reads as bare text -->
</div>
```

If a design system forces you onto `<div>`s (e.g. for virtualization), you must re-add every role by hand — `role="table"`, `role="row"`, `role="columnheader"`, `role="rowheader"`, `role="cell"` — and it still won't match a native table's navigation. Prefer the real element.

## ⚖️ Trade-offs

- **Native `<table>` vs `role="grid"`.** A `<table>` is *static* data you read. `role="grid"` is an *interactive* widget with its own arrow-key cell navigation and editing (like a spreadsheet). Don't add `grid` semantics to a read-only report — you'd promise keyboard cell-navigation you haven't built.
- **When NOT to use `headers`/`id`:** almost always. It's the fallback for irreducibly complex tables; reaching for it on a simple one adds fragility for no benefit. `scope` covers the vast majority.
- **Never use `<table>` for layout.** CSS grid/flexbox exist for that. A layout table pollutes the a11y tree with meaningless row/cell semantics that AT then dutifully announces.
- **Responsive tables are a genuine tension:** the common "stack each row into a card on mobile" via CSS can strip the header associations if you also change `display`. Test that the semantics survive your responsive CSS.

## 💣 Gotchas interviewers probe

- **Missing `scope`** (or worse, `<div>` tables). Without header association, every cell reads as context-free text — the core failure.
- **Using `<th>` for styling** on data cells, or `<td>` for actual headers. The header/data distinction is semantic, not visual.
- **`display: block`/`flex`/`grid` on `<table>` parts** can **remove their table semantics** in some browsers — restyling `<tr>`/`<td>` with `display` is a known way to accidentally break AT. Use `display: contents` cautiously or keep table display values.
- **No `<caption>`**, so the table has no accessible name and users can't tell tables apart when listing them.
- **Sortable headers with no `aria-sort`** (or no `<button>`) — sighted users see the arrow; AT users get nothing and can't operate it by keyboard.
- **Empty header cells** in the corner of a cross-tab are fine as `<td>` but must not be `<th>` with no scope, which confuses association.

## 🎯 Say this in the interview

> "For tabular data I always use a real `<table>`, because the thing a screen reader needs is header association — which `<th scope=\"col\">` and `<th scope=\"row\">` provide — so when the user lands on a cell, AT announces the column and row headers that give the number meaning. Rebuild that out of `<div>`s and the user just hears a stream of bare values. I add a `<caption>` for the accessible name and use `<thead>`/`<tbody>` structurally. For most tables `scope` is all you need; only irreducibly complex tables justify the `headers`/`id` pattern, and if I'm reaching for that I'd first ask whether the table should be split. One gotcha I watch for: restyling table parts with `display: flex` or `grid` can strip the table semantics in some browsers, so I verify the a11y tree survives my responsive CSS. And I never use tables for layout."

## 🔗 Go deeper

- [ARIA APG — Table Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/) — when native tables suffice vs when grid semantics apply.
- [MDN — &lt;table&gt; and accessibility](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table#accessibility) — `scope`, `headers`/`id`, `<caption>` in depth.
- [WebAIM — Creating accessible tables](https://webaim.org/techniques/tables/data) — simple vs complex tables with screen-reader behaviour.
- [MDN — aria-sort](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-sort) — announcing sortable columns.
