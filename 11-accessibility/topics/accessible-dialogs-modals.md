<div align="center">

# Accessible dialogs / modals

<sub>♿ Accessibility · 🔴 Hard · ⏱ 1h · `#dialog`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — An accessible dialog is a small contract: it must announce *itself* as a dialog with a name, move focus in, keep focus in while modal, close on `Esc`, and hand focus back to the trigger. Reach for native `<dialog>`+`showModal()` first; it satisfies most of the contract at the platform level, and everything else you bolt on is you re-implementing the browser.

---

## 🧠 Mental model

Think in terms of what a screen-reader user experiences, not what a sighted user sees. A sighted user perceives a modal instantly: a dimmed backdrop, a floating card. A screen-reader user perceives *nothing* unless the accessibility tree tells them. So a dialog is fundamentally an announcement problem before it is a focus problem: when it opens, assistive tech must say **"dialog, Edit profile"** — that's the role plus the accessible name — and then the rest of the page must vanish from their reach so they don't wander behind it.

The word "modal" is the whole crux. **Modal** means the background is off-limits until you deal with the dialog. That off-limits state is not styling; it's `aria-modal="true"` for the AT hint *and* real inertness (`inert` / `showModal()`) for actual containment. Get modality right and the dialog is trivial; get it wrong and every other detail is polish on a broken foundation.

## ⚙️ How it actually works

The APG dialog pattern is five obligations:

| Obligation | Native `<dialog>` | Hand-rolled |
|---|---|---|
| Role + name | `role="dialog"` implicit; name via `aria-labelledby` | add both yourself |
| Focus moves **in** | `showModal()` focuses first focusable / `autofocus` | `.focus()` on open |
| Focus stays **in** | background made `inert` automatically | `inert` siblings + wrap `Tab` |
| `Esc` closes | fires `cancel`, then `close` | key handler |
| Focus returns to trigger | **not guaranteed** — do it yourself | stash & restore `activeElement` |

Two mechanisms are doing the heavy lifting. First, the **top layer**: `showModal()` promotes the dialog above the entire stacking context, so it escapes `z-index` wars and `overflow: hidden` clipping — a real bug class that hand-rolled overlays fight forever. Second, **inertness**: the browser prunes the rest of the document from focus, hit-testing, *and* the accessibility tree in one move. `aria-modal="true"` alone does **none** of that — it only whispers to AT "treat the background as out of scope." It does not trap focus. Believing it does is the single most common misconception here.

Choose the role deliberately: `role="dialog"` for interactive tasks (a form), `role="alertdialog"` for an urgent decision that interrupts (a destructive-action confirm), because `alertdialog` makes AT announce the body text immediately.

## 💻 Code

The native path is the recommended implementation, not a shortcut:

```html
<button id="open">Edit profile</button>

<dialog id="dlg" aria-labelledby="dlg-title">
  <h2 id="dlg-title">Edit profile</h2>   <!-- the accessible NAME -->
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
  opener = e.currentTarget;   // remember the trigger
  dlg.showModal();            // top layer + inert background + Esc + focus-in
});

// The clause the platform won't guarantee — always wire this:
dlg.addEventListener('close', () => opener?.focus());
```

```html
<!-- ❌ A "modal" that is a lie to assistive tech -->
<div class="overlay">
  <div class="card">        <!-- no role, no name, no focus mgmt -->
    <h2>Edit profile</h2>   <!-- SR users hear nothing on open -->
  </div>
</div>
```

## ⚖️ Trade-offs

- **Prefer `<dialog>` over any focus-trap library.** Headless kits and `focus-trap` re-implement — imperfectly — what the browser now does correctly, and none can replicate top-layer rendering with `z-index`.
- **`role="dialog"` needs a name or it's anonymous.** A dialog with no `aria-labelledby`/`aria-label` announces as just "dialog," which is useless. The name is not optional.
- **When NOT to build a modal:** if the task doesn't *require* blocking the page, don't. A non-modal popover, a toast, an inline expander — none should trap focus. Modality is a cost you impose on the user; charge it only when the flow genuinely can't continue otherwise.
- **`alertdialog` vs `dialog`:** use `alertdialog` sparingly — it forces an interruption. A settings panel is a `dialog`; "Delete this account?" is an `alertdialog`.

## 💣 Gotchas interviewers probe

- **`aria-modal="true"` does not trap focus or inert the background.** It's an AT hint only. Real containment is `inert` / `showModal()`. This is *the* trap question.
- **No accessible name.** `role="dialog"` without `aria-labelledby` is a silent failure — validators pass, users are lost.
- **Focus not restored on close** dumps the user on `<body>` at the top of the page. Native `<dialog>` doesn't reliably restore it, so you must.
- **Initial focus on a destructive button.** Auto-focusing "Delete" in a confirm dialog invites an accidental `Enter`. Focus the safe/first field, or the heading with `tabindex="-1"`.
- **Nested `<dialog>` / `inert`** — inerting the wrong subtree can trap the user *outside* the dialog. Verify the dialog itself stays reachable.
- **Scroll-locking is separate from focus trapping.** Trapping `Tab` doesn't stop the background scrolling on wheel/touch — that's an extra concern.
- **Closing on backdrop click** must not be the *only* way out — keyboard users can't click a backdrop; `Esc` is mandatory.

## 🎯 Say this in the interview

> "I treat a dialog as a five-part contract: it announces itself as a dialog with an accessible name, moves focus in on open, keeps focus in while it's modal, closes on `Esc`, and returns focus to the trigger on close. My default is native `<dialog>` with `showModal()` because it gives me the top layer, makes the background genuinely inert, and handles `Esc` and focus-in correctly — all things hand-rolled modals get subtly wrong. The one clause it doesn't guarantee is restoring focus to the opener, so I always stash the trigger and refocus it on `close`. The detail I'm careful to state is that `aria-modal` is only a hint to assistive tech — it does not trap focus or inert anything by itself; `inert` or `showModal()` does the real work. And the name isn't optional: `role=\"dialog\"` with no label announces as just 'dialog.'"

## 🔗 Go deeper

- [ARIA APG — Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — the full keyboard, focus, and naming spec.
- [MDN — &lt;dialog&gt;](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) — `showModal`, top layer, `::backdrop`, `cancel`/`close`.
- [MDN — inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert) — removing a subtree from focus and the a11y tree.
- [web.dev — Building a dialog component](https://web.dev/articles/building/a-dialog-component) — a production-grade walkthrough with edge cases.
