<div align="center">

# ARIA Authoring Practices (patterns)

<sub>♿ Accessibility · 🔴 Hard · ⏱ 1.5h · `#aria` `#patterns`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The ARIA Authoring Practices Guide (APG) is the reference implementation for widgets HTML doesn't provide — tabs, comboboxes, menus, dialogs. Each pattern specifies the exact **roles + states + keyboard interaction** expected. The keyboard model *is* the pattern; get the arrow-key and focus behaviour wrong and the ARIA is pointless.

---

## 🧠 Mental model

Once you accept that a custom widget must reimplement everything a native control gives for free, the next question is: *reimplement it to match what?* The APG is that answer — a catalogue of ~30 patterns, each defining the contract a screen-reader user has already learned from every other correct implementation. A tablist should behave like *every* tablist: arrow keys move between tabs, not Tab.

The core insight the APG encodes is the **roving tabindex** (and its cousin `aria-activedescendant`): a composite widget is **one Tab stop**, and *arrow keys* move within it. A radio group, a tablist, a menu, a listbox — you Tab *to* the group, then arrow *inside* it. New developers wire every item as `tabindex="0"` and force the user to Tab through 12 tabs; the APG says exactly one item is `tabindex="0"` at a time and the rest are `tabindex="-1"`, and you move the `0` as focus roves. This single idea underlies half the patterns.

## ⚙️ How it actually works

A pattern is three things bolted together: **roles** (the structure in the tree), **states** (`aria-selected`, `aria-expanded`, `aria-checked`, updated live), and — the hard part — a **keyboard interaction spec** users expect by convention. Tabs, verbatim from the APG:

| Key | Behaviour |
|---|---|
| `Tab` | Move *into* the tablist (to the active tab), then *out* to the panel |
| `←` / `→` | Move between tabs (this is the roving part) |
| `Home` / `End` | First / last tab |
| `Enter` / `Space` | Activate (only needed for *manual* activation) |

Note `Tab` does **not** move between tabs — arrows do. Getting that backwards is the most common tabs bug, and a screen-reader user notices instantly because it violates the convention.

Two focus-management strategies, and knowing when to use which is the senior signal:

- **Roving tabindex** — DOM focus actually moves to each item; you set the focused item `tabindex="0"` and call `.focus()`, others `-1`. Best when items are real focusable elements (menu items, tabs).
- **`aria-activedescendant`** — DOM focus *stays on the container*; a property points at the "virtually focused" child's id. Best for comboboxes/listboxes where focus must remain in the text input while the highlight moves through options.

Dialog is the other pattern everyone gets asked about, and it's really a **focus-management** problem: on open, move focus *into* the dialog; **trap** Tab so it cycles within it; support **Escape** to close; and on close, **restore focus to the trigger**. `role="dialog"` + `aria-modal="true"` gives the semantics; none of the focus behaviour is automatic. (The native `<dialog>` element with `.showModal()` now handles the trap, Escape, and inert background for you — reach for it before hand-rolling.)

The combobox pattern is the APG's hardest and a favourite: a text input with `role="combobox"`, `aria-expanded`, `aria-controls` pointing at the listbox, `aria-activedescendant` tracking the highlighted option, arrow keys to move the highlight *without* leaving the input, Enter to select, Escape to close. It combines both focus strategies and live state — which is why interviewers use "build an autocomplete" to probe all of this at once.

## 💻 Code

Roving tabindex, the mechanism at the heart of most patterns:

```html
<div role="tablist" aria-label="Account">
  <button role="tab" aria-selected="true"  tabindex="0"  id="t1" aria-controls="p1">Profile</button>
  <button role="tab" aria-selected="false" tabindex="-1" id="t2" aria-controls="p2">Billing</button>
</div>
<div role="tabpanel" id="p1" aria-labelledby="t1">…</div>
<div role="tabpanel" id="p2" aria-labelledby="t2" hidden>…</div>
```

```js
const tabs = [...tablist.querySelectorAll('[role="tab"]')];
tablist.addEventListener('keydown', (e) => {
  const i = tabs.indexOf(document.activeElement);
  let next = null;
  if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
  if (e.key === 'ArrowLeft')  next = tabs[(i - 1 + tabs.length) % tabs.length];
  if (e.key === 'Home')       next = tabs[0];
  if (e.key === 'End')        next = tabs.at(-1);
  if (!next) return;
  e.preventDefault();
  tabs.forEach((t) => {                    // move the single tab stop…
    const on = t === next;
    t.tabIndex = on ? 0 : -1;
    t.setAttribute('aria-selected', String(on));
  });
  next.focus();                            // …and actually move focus
});
```

Dialog focus restoration — the detail most hand-rolled modals forget:

```js
let opener;
function open() { opener = document.activeElement; dialog.showModal(); firstField.focus(); }
function close() { dialog.close(); opener?.focus(); }  // ✅ send focus BACK to the trigger
```

## ⚖️ Trade-offs

- **The APG is a spec, not a component library — and that's the catch.** It shows *what* correct behaviour is with reference code, but it isn't battle-tested production code (it has historically had its own bugs, e.g. mobile/`aria-activedescendant` support). Use it as the behavioural contract; ship a well-tested library (Radix, React Aria, Headless UI) that *implements* the pattern, rather than copy-pasting APG demos.
- **When NOT to build the pattern at all:** if a native element or a lighter interaction does the job, prefer it. A `<details>`/`<summary>` disclosure beats a hand-built one; a native `<dialog>` beats a div modal; links styled as tabs may beat a full tablist if they're really navigation. Every custom pattern is keyboard + state code you must maintain and test forever.
- **Manual vs automatic tab activation is a real UX decision.** Automatic (activate on arrow) is snappy but bad if each panel is expensive to load; manual (arrow to move, Enter to activate) avoids firing every panel. The APG documents both — choose deliberately.

## 💣 Gotchas interviewers probe

- **"How do you move between tabs?"** Arrow keys, not Tab — the whole group is *one* tab stop via roving tabindex. Answering "Tab" reveals you've never implemented the pattern.
- **Roving tabindex vs `aria-activedescendant`.** Both keep a composite to one tab stop; roving *moves DOM focus*, activedescendant *keeps focus on the container* and points at a virtual child. Comboboxes need the latter so focus stays in the input.
- **Dialogs are a focus-trap problem, not a `role` problem.** Move focus in, trap Tab, Escape to close, **restore focus to the opener** on close. Forgetting restoration strands the keyboard user at the top of the page.
- **`aria-selected` / `aria-expanded` must update live.** A tablist where the state never changes announces the wrong active tab. State sync is the pattern's promise.
- **Menu (`role="menu"`) is application-menu semantics, not a nav dropdown.** It commits you to the full arrow-key menu model and takes users out of browse mode; a site nav dropdown is usually better as links + `aria-expanded`, *not* `role="menu"`.
- **Prefer native + libraries over hand-rolled APG demos.** The APG is reference behaviour; production needs the tested implementation.

## 🎯 Say this in the interview

> "The APG is the reference for the widgets HTML doesn't give you — tabs, combobox, menu, dialog — and each pattern is a contract of roles, live states, and a specific keyboard model that users already expect. The idea that ties them together is roving tabindex: a composite widget is a single Tab stop, and arrow keys move *within* it, so exactly one item is `tabindex=0` and the rest are `-1`, and I move that as focus roves. For something like a combobox I use `aria-activedescendant` instead so DOM focus stays in the text input while the highlight moves through the options. Dialogs I treat as a focus-management problem — move focus in, trap Tab, Escape to close, and crucially restore focus to the trigger on close — and I'll reach for the native `<dialog>` since it handles the trap and inert background. In production I follow the APG as the behavioural spec but ship a tested library like Radix or React Aria rather than copy the demo code, because the APG is a spec, not hardened components."

## 🔗 Go deeper

- [W3C — ARIA Authoring Practices Guide: Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) — the catalogue: roles, states, and keyboard spec per widget.
- [W3C APG — Developing a keyboard interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) — roving tabindex vs `aria-activedescendant`, in depth.
- [W3C APG — Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — the focus-trap and restoration requirements.
- [MDN — `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) — native modal with built-in focus trap, Escape, and inert backdrop.
- [React Aria — Patterns](https://react-spectrum.adobe.com/react-aria/) — a production-grade implementation of the APG contracts.
