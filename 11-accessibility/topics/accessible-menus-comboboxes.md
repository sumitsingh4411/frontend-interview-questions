<div align="center">

# Accessible menus & comboboxes

<sub>♿ Accessibility · 🔴 Hard · ⏱ 1h · `#aria` `#patterns`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — "Menu" and "combobox" are specific ARIA patterns, not "any dropdown." A `menu`/`menuitem` is an **application menu** navigated with arrow keys where Tab exits the whole widget; a `combobox` is a **text input with an attached popup** of options. Pick the wrong pattern and you promise the screen-reader user keyboard behaviour your widget doesn't deliver — which is worse than plain HTML.

---

## 🧠 Mental model

The most important decision is made *before* any ARIA: **which pattern is this actually?** Three things get called "dropdown" and they are not interchangeable:

| It's really a… | Use | Keyboard contract |
|---|---|---|
| Navigation / list of links | `<ul><li><a>` — **no menu role** | native Tab |
| Form field picking one value | native `<select>`, or `combobox` | arrows open + move |
| App commands (Cut/Copy/Paste) | `menu` + `menuitem` | arrows move, Tab **exits** |

ARIA roles are **promises about behaviour**. `role="menu"` tells assistive tech "arrow keys move between items and Tab leaves the menu entirely." If you slap that on a set of nav links, the user presses Tab expecting to move to the next link and instead lands outside the nav — you've broken their mental model. The senior instinct is to **downgrade**: a site nav dropdown is not a `menu`, it's a disclosure (`button[aria-expanded]`) revealing a list of links. Real `menu`/`menuitem` is for application command menus, which are rare on the web.

## ⚙️ How it actually works

**The menu button pattern.** A `button` with `aria-haspopup="menu"` and `aria-expanded` toggles a `role="menu"` containing `role="menuitem"` children. Only **one** item is in the tab order at a time — the widget uses *roving tabindex* (active item `tabindex="0"`, the rest `-1`) so `Tab` jumps clean out of the menu, and Up/Down move within it. `Esc` closes and returns focus to the button; `Home`/`End` jump to first/last; typing a letter does typeahead.

**The combobox pattern** (APG 1.2, the modern one) is an `<input role="combobox">` with `aria-expanded`, `aria-controls` pointing at a `role="listbox"`, and `aria-autocomplete` describing behaviour. Focus **stays in the input** the entire time — you never move DOM focus into the list. Instead you use **`aria-activedescendant`**: the input carries `aria-activedescendant="opt-3"` naming the visually-highlighted `role="option"`, and AT announces that option while the input keeps the caret. This split — *focus in the input, "virtual focus" in the list* — is the crux of combobox accessibility and the thing candidates most often miss.

Two techniques, know when each applies:

- **Roving tabindex** — real DOM focus moves; used by menus, tabs, radio groups, grids.
- **`aria-activedescendant`** — DOM focus is fixed, a pointer names the active child; used by comboboxes where you must keep typing into the input.

## 💻 Code

Combobox skeleton — note focus never leaves the input:

```html
<label id="lbl">Country</label>
<input role="combobox" aria-labelledby="lbl"
       aria-expanded="true" aria-controls="opts"
       aria-autocomplete="list" aria-activedescendant="opt-2" />

<ul id="opts" role="listbox" aria-labelledby="lbl">
  <li id="opt-1" role="option">Canada</li>
  <li id="opt-2" role="option" aria-selected="true">Chad</li>
  <li id="opt-3" role="option">Chile</li>
</ul>
```

```js
input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    // move the POINTER, not focus — input keeps the caret
    active = next(active);
    input.setAttribute('aria-activedescendant', active.id);
    active.scrollIntoView({ block: 'nearest' });
    e.preventDefault();
  }
  if (e.key === 'Escape') closeAndClear();
  if (e.key === 'Enter') commit(active);
});
```

```html
<!-- ❌ nav links wearing a menu role: Tab now escapes the whole nav -->
<ul role="menu">
  <li role="menuitem"><a href="/pricing">Pricing</a></li>
</ul>
<!-- ✅ it's a disclosure over links, not an application menu -->
<button aria-expanded="false" aria-controls="nav">Products ▾</button>
<ul id="nav" hidden><li><a href="/pricing">Pricing</a></li></ul>
```

## ⚖️ Trade-offs

- **Native `<select>` beats a combobox 90% of the time.** It's fully accessible, works on mobile, and needs zero JS. Only build a combobox when you truly need typeahead filtering or custom option rendering — you're taking on the entire keyboard spec by hand.
- **`menu`/`menuitem` is almost never right on a website.** It's for app command menus. When in doubt, use a disclosure + list of links or buttons; you lose nothing and avoid a broken keyboard contract.
- **`aria-activedescendant` vs roving tabindex** isn't a preference — it's dictated by whether focus must stay put. Comboboxes require the input to keep focus, so they *must* use activedescendant.

## 💣 Gotchas interviewers probe

- **Using `role="menu"` for site navigation.** The classic mistake — it changes the Tab contract and confuses users. Nav dropdowns are disclosures, not menus.
- **Moving DOM focus into the listbox of a combobox.** Then the user can't keep typing. Focus stays in the input; the list is driven by `aria-activedescendant`.
- **`menuitem` children must be *only* menuitems** (or `menuitemcheckbox`/`menuitemradio`). Wrapping them in extra divs with roles, or putting arbitrary links inside, breaks the pattern.
- **Forgetting to keep `aria-expanded` in sync.** AT reads it to announce open/closed; a stale value lies to the user.
- **No `aria-selected`/active option management** means the announced option and the highlighted option drift apart.
- **`aria-haspopup` value must match the popup type** (`menu`, `listbox`, `dialog`…) — `"true"` legacy-maps to `menu`, which may be wrong.

## 🎯 Say this in the interview

> "The first thing I do is classify the widget, because 'menu' and 'combobox' are specific ARIA contracts, not generic dropdowns. If it's site navigation, it's a disclosure — a button with `aria-expanded` revealing a list of links — not `role=\"menu\"`, because a real menu changes the Tab behaviour and users don't expect that on a webpage. `role=\"menu\"` is for application command menus. If it's a form field with typeahead, it's a combobox: an input with `role=\"combobox\"`, `aria-controls` pointing at a listbox, and crucially the DOM focus stays in the input the whole time — I drive the highlighted option with `aria-activedescendant`, so the user can keep typing while assistive tech announces the active option. That's the split people miss: roving tabindex moves real focus for menus and tabs, but comboboxes keep focus in the input and use a virtual pointer. And honestly, if a native `<select>` does the job, I use it."

## 🔗 Go deeper

- [ARIA APG — Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) — the canonical spec, including the activedescendant model.
- [ARIA APG — Menu & Menu Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) — when a real menu is appropriate and its full keyboard map.
- [MDN — aria-activedescendant](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-activedescendant) — the "virtual focus" mechanism.
- [Adrian Roselli — Disclosure Widgets](https://adrianroselli.com/2020/05/disclosure-widgets.html) — why most "menus" should be disclosures.
