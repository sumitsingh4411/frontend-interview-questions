<div align="center">

# Accessible tabs

<sub>♿ Accessibility · 🟡 Medium · ⏱ 45m · `#patterns`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A tabs widget is a `tablist` of `tab`s controlling `tabpanel`s, wired together with `aria-controls`/`aria-selected`. The detail that separates a correct implementation from a broken one is **roving tabindex**: `Tab` moves you *into and out of* the tablist as a single stop, and the **arrow keys** move between tabs — not `Tab`.

---

## 🧠 Mental model

Tabs exist to show one panel at a time while advertising the others. The accessibility model mirrors that exactly: a **tablist** is a single toolbar-like control, and the individual tabs are *options within it*, not independent tab stops. So from the keyboard, the whole tablist behaves like a radio group — you `Tab` to it once, land on the selected tab, then use **arrow keys** to move between tabs. Pressing `Tab` again jumps out of the tablist entirely (usually into the active panel).

That's the mental flip most people get wrong: they make every tab a natural tab stop, so a user with ten tabs has to press `Tab` ten times to get past them. The correct widget is *one* stop for the whole group. Getting this right is the entire senior signal for this pattern.

## ⚙️ How it actually works

**Roving tabindex.** Exactly one tab has `tabindex="0"` (the selected one); all others have `tabindex="-1"`. When the user arrows to a new tab, you move the `0` onto it and set the others to `-1`, then call `.focus()`. That's why `Tab` treats the group as a single stop: only one child is ever in the document tab order.

**The wiring.** Each `role="tab"` gets `aria-selected="true|false"` and `aria-controls="<panel-id>"`. Each `role="tabpanel"` gets `aria-labelledby="<tab-id>"` so its accessible name comes from its tab, and `tabindex="0"` **only if it contains no focusable elements** (so keyboard users can still reach a text-only panel). The `tablist` itself can carry `aria-label` to name the group.

**Activation mode — the real design decision:**

- **Automatic activation:** arrowing to a tab selects it immediately. Best when panels are cheap to render.
- **Manual activation:** arrowing only *moves focus*; the user presses `Enter`/`Space` to select. Required when selecting a tab is expensive (fetches data, heavy re-render) — otherwise arrowing through five tabs fires five loads.

Keyboard map: Left/Right (or Up/Down for vertical) move between tabs and wrap; `Home`/`End` jump to first/last; in manual mode `Enter`/`Space` activate.

## 💻 Code

```html
<div role="tablist" aria-label="Account settings">
  <button role="tab" id="t1" aria-controls="p1" aria-selected="true"  tabindex="0">Profile</button>
  <button role="tab" id="t2" aria-controls="p2" aria-selected="false" tabindex="-1">Billing</button>
</div>

<div role="tabpanel" id="p1" aria-labelledby="t1" tabindex="0">…profile…</div>
<div role="tabpanel" id="p2" aria-labelledby="t2" tabindex="0" hidden>…billing…</div>
```

```js
const tabs = [...tablist.querySelectorAll('[role="tab"]')];

tablist.addEventListener('keydown', (e) => {
  const i = tabs.indexOf(document.activeElement);
  let next = null;
  if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
  if (e.key === 'ArrowLeft')  next = tabs[(i - 1 + tabs.length) % tabs.length];
  if (e.key === 'Home') next = tabs[0];
  if (e.key === 'End')  next = tabs.at(-1);
  if (!next) return;
  e.preventDefault();
  next.focus();          // roving tabindex is applied in select()
  select(next);          // automatic activation; skip for manual mode
});

function select(tab) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;                 // move the single tab stop
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
}
```

## ⚖️ Trade-offs

- **Automatic vs manual activation is a real cost decision.** Automatic feels snappier and is the APG default; manual is mandatory when activation triggers a fetch or heavy render, or you punish arrow-key users with a cascade of loads.
- **Don't reach for a tabs widget for navigation between pages.** If each "tab" is a URL, that's a nav/list of links, not the tabs pattern — the tabs pattern is for swapping panels *within one view*. Using tabs for routing breaks back-button expectations.
- **When NOT to use tabs at all:** if users need to compare or see multiple sections at once, tabs hide content behind interaction. Accordions or just stacking the sections may serve better.

## 💣 Gotchas interviewers probe

- **Making every tab a `Tab` stop.** The #1 error. Roving tabindex means the tablist is *one* stop; arrows move within it.
- **`hidden` panels vs CSS `display:none`.** A panel hidden with `visibility`/opacity is still in the a11y tree and tab order. Use `hidden` (or `display:none`) so inactive panels are truly removed.
- **Panel with no accessible name.** Forgetting `aria-labelledby` on the panel leaves it anonymous when a user tabs into it.
- **`aria-selected` out of sync** with what's visible — AT then announces the wrong active tab.
- **Auto-activation firing expensive work** on every arrow press — switch to manual activation.
- **Vertical tablists** need `aria-orientation="vertical"` and Up/Down keys, not Left/Right.
- **Reordering a panel with focusable content but also giving it `tabindex="0"`** creates a redundant stop; only give the panel `tabindex="0"` when it has *no* focusable children.

## 🎯 Say this in the interview

> "Tabs are a `tablist` containing `tab`s that control `tabpanel`s, but the thing I lead with is the keyboard model, because that's where implementations fail. The whole tablist is a single tab stop — I use roving tabindex so exactly one tab has `tabindex=0` and the rest are `-1`. The user `Tab`s to the group once, then arrow keys move between tabs and `Tab` again jumps into the panel. Each tab has `aria-selected` and `aria-controls`, and each panel is `aria-labelledby` its tab. The design call I flag is activation mode: automatic activation selects on arrow, which is the default and feels great, but if selecting a tab triggers a data fetch I switch to manual activation so arrowing through tabs doesn't fire five loads. And I'm clear that tabs are for swapping panels in one view — if each tab is really a URL, that's navigation, not this pattern."

## 🔗 Go deeper

- [ARIA APG — Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) — full keyboard map and the automatic/manual activation guidance.
- [MDN — ARIA: tab role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/tab_role) — role wiring and requirements.
- [Inclusive Components — Tabbed interfaces](https://inclusive-components.design/tabbed-interfaces/) — Heydon Pickering's progressive-enhancement build.
