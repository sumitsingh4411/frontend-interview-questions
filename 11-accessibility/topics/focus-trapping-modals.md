<div align="center">

# Focus trapping (modals)

<sub>♿ Accessibility · 🔴 Hard · ⏱ 45m · `#focus` `#dialog`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A modal must **capture focus**: while it's open, `Tab` cycles only inside it, the background is inert, `Esc` closes it, and on close focus **returns to the element that opened it**. The native `<dialog>` element with `showModal()` gives you all of that for free — reach for a hand-rolled trap only when you can't use it.

---

## 🧠 Mental model

"Modal" means *the rest of the page is temporarily off-limits*. For a mouse user, the dimmed backdrop communicates that. For a keyboard user there is no backdrop they can perceive — the only thing that enforces "you're stuck here until you deal with this" is the **focus trap**. Without it, `Tab` from the last button in the dialog walks straight out into the page behind, and the user is now filling in a form they can't see, with the modal still floating on top. To them the app has simply broken.

So a modal is really a contract with four clauses: **focus goes in** on open, **focus stays in** while open (Tab wraps, background can't be reached), **`Esc` gets out**, and **focus comes back** to the trigger on close. Miss the last clause and you dump the user on `<body>` — the modal was a detour with no road home.

## ⚙️ How it actually works

**Use the platform.** `<dialog>`'s `showModal()` implements the entire contract natively:

- It renders in the **top layer**, above everything, escaping `z-index` and `overflow: hidden` stacking bugs entirely.
- It makes the rest of the document **inert** — background content is unfocusable, unclickable, and pruned from the tab loop. This is the real focus trap, enforced by the browser.
- **`Esc`** closes it and fires a `cancel` event.
- It moves initial focus inside (to the first focusable element, or an element you mark `autofocus`).
- `::backdrop` gives you the overlay with no extra element.

What it does *not* do reliably across engines is **restore focus to the trigger** — so you still capture and restore that yourself. And `showModal()` (modal) differs from `show()` (non-modal): only the modal form traps focus and inerts the background.

**If you must hand-roll** (legacy support, a framework portal that fights `<dialog>`), you re-create each clause:

1. On open, record `document.activeElement` as the return target, then focus the first element inside.
2. Mark everything else inert — the `inert` attribute on sibling content is the modern, correct tool; it removes a whole subtree from focus, hit-testing, and the a11y tree in one attribute.
3. Intercept `Tab`/`Shift+Tab` at the boundaries and wrap: from the last element `Tab` → first; from the first, `Shift+Tab` → last.
4. Handle `Esc`. On close, `.focus()` the stored trigger.
5. Add `role="dialog"` + `aria-modal="true"` and an accessible name via `aria-labelledby` pointing at the title.

## 💻 Code

The native path — this *is* the recommended implementation:

```html
<button id="open">Edit profile</button>

<dialog id="dlg" aria-labelledby="dlg-title">
  <h2 id="dlg-title">Edit profile</h2>
  <form method="dialog">
    <label>Name <input name="name" autofocus /></label>
    <button value="cancel">Cancel</button>
    <button value="save">Save</button>
  </form>
</dialog>
```

```js
const dlg = document.getElementById('dlg');
let opener = null;

document.getElementById('open').addEventListener('click', (e) => {
  opener = e.currentTarget;      // remember who opened it
  dlg.showModal();               // top layer + background inert + Esc + focus-in
});

// The one clause the platform doesn't guarantee: return focus.
dlg.addEventListener('close', () => opener?.focus());
```

The manual trap, if `<dialog>` is off the table:

```js
function trap(container, e) {
  if (e.key !== 'Tab') return;
  const f = container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    last.focus(); e.preventDefault();          // wrap backwards
  } else if (!e.shiftKey && document.activeElement === last) {
    first.focus(); e.preventDefault();         // wrap forwards
  }
}
// Plus: mark the rest of the page `inert`, handle Esc, restore focus on close.
```

## ⚖️ Trade-offs

- **Prefer `<dialog>` over any library.** `focus-trap`, headless UI kits, and custom loops all re-implement — imperfectly — what the browser now does natively and correctly, including the top-layer rendering you can't replicate with `z-index`.
- **`aria-modal="true"` is a hint, not an enforcer.** It tells AT the background is out of scope, but it does **not** actually trap focus or make the background inert. You still need `inert`/`showModal()` for real containment. Believing `aria-modal` traps focus is a classic misconception.
- **When NOT to trap:** non-modal surfaces — a toast, a non-modal popover, an autocomplete listbox. Trapping focus in something the user should be able to `Tab` past turns a helper into a cage. Modality is the deciding question.

## 💣 Gotchas interviewers probe

- **Forgetting to restore focus** is the most common bug: the modal closes and the user is on `<body>`, back at the top. Always stash the opener and refocus it.
- **`aria-modal` does not trap focus.** Only `inert` / `showModal()` inerts the background. Know the difference cold.
- **Initial focus placement matters.** Focus the first *interactive* element, or the dialog/heading — not a destructive button, and not nothing. Auto-focusing "Delete" invites disaster.
- **Old `aria-hidden`-the-background trick is fragile** — you must remember to un-hide on close, and it doesn't stop clicks. `inert` supersedes it.
- **A dialog with no focusable children** breaks a manual trap (nothing to focus). Give the dialog itself `tabindex="-1"` and focus that.
- **`Esc` must close.** Keyboard users expect it; omitting it is a WCAG-adjacent failure and just feels broken.
- **Scroll-locking the background** is a separate concern from focus — trapping focus doesn't stop the page behind from scrolling.

## 🎯 Say this in the interview

> "A modal is a contract with keyboard users: focus moves in on open, stays trapped inside while it's open, `Esc` closes it, and focus returns to the trigger afterwards. The backdrop only communicates modality to sighted users — the focus trap is what actually enforces it for everyone else. My default is the native `<dialog>` with `showModal()`, because it gives me the top layer, makes the background genuinely inert, handles `Esc`, and moves focus in — all correctly, which hand-rolled traps rarely are. The one thing I still wire up is restoring focus to the opener on close, since that isn't guaranteed. If I can't use `<dialog>`, I re-create each clause manually: record the active element, `inert` the rest of the page, wrap `Tab` at the boundaries, and refocus the trigger on close. And I'm clear that `aria-modal` is only a hint — it doesn't trap focus by itself."

## 🔗 Go deeper

- [ARIA APG — Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — the full keyboard and focus spec.
- [MDN — &lt;dialog&gt;](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) — `showModal`, top layer, `::backdrop`, `cancel`/`close`.
- [MDN — inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert) — removing a subtree from focus and the a11y tree.
- [web.dev — Building a dialog component](https://web.dev/articles/building/a-dialog-component) — a production-grade walkthrough.
