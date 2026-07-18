<div align="center">

# The accessibility tree

<sub>♿ Accessibility · 🟡 Medium · ⏱ 45m · `#internals`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The browser builds a second tree beside the DOM — a filtered, semantic version where each node exposes a **role, name, state, and value**. Assistive tech reads *that*, never your DOM or CSS. Accessibility work is really just curating what ends up in this tree.

---

## 🧠 Mental model

You already know the DOM and the render tree. The **accessibility tree** (a11y tree) is a third projection of the same document, computed by the browser for assistive technology. Think of it as the DOM run through a semantic compiler: irrelevant wrapper `<div>`s collapse, purely decorative nodes drop out, and what remains is a tree of **objects** — each answering four questions a screen reader needs:

```
DOM node                     →   Accessibility node
<button aria-pressed="true">     role:  button
  Mute                           name:  "Mute"
</button>                         state: pressed
                                 value: —
```

The screen reader never sees `<button>` or your Tailwind classes. It sees `{ role: button, name: "Mute", state: pressed }`. **If a fact about your UI isn't in this tree, it does not exist for a blind user.** That single sentence explains 90% of accessibility bugs: the info was in the pixels or the DOM, but never made it into the a11y node.

## ⚙️ How it actually works

The pipeline is: **DOM + CSS → accessibility tree → platform accessibility API → assistive technology.** The browser maps each element to an accessibility API object (UIA on Windows, AX on macOS, AT-SPI on Linux); the screen reader queries *that API*, so it's genuinely one more layer removed from your code than most developers picture.

Each node's four properties come from defined algorithms:

- **Role** — from the native element (`<nav>` → `navigation`) or an explicit `role`. Determines *what kind of thing* and therefore what interactions and states are expected.
- **Name** — the accessible name, computed by a precise spec algorithm (see below). This is what gets announced.
- **State/Value** — checked, expanded, disabled, selected, `aria-valuenow`, current value of a text field.

**What gets pruned matters as much as what's included.** A node is excluded from the tree when it's `display:none` or `visibility:hidden` (removed entirely), or `aria-hidden="true"` (removed but *still rendered* — the visual/a11y divergence trick), or when it's a semantically empty wrapper the browser folds away. Crucially, `opacity:0` and `visibility:hidden` differ: only some of these keep the node, and off-screen-positioned content (`.sr-only`) stays **in** the tree, which is exactly why it works for screen-reader-only text.

The name computation (**accname**) is the part interviewers love, roughly in priority order: `aria-labelledby` → `aria-label` → the element's own content/`<label>`/`alt`/`title`. Higher sources *win and stop the walk* — `aria-label` silently overrides your visible button text, a common footgun.

## 💻 Code

Inspect the tree, don't guess at it. Chrome DevTools → Elements → **Accessibility** pane shows the computed node:

```js
// The properties DevTools surfaces for the selected node:
// Computed Properties:
//   role:  "button"
//   name:  "Close dialog"   ← and WHERE it came from (aria-label here)
//   Checked / Expanded / ...
```

Watch a name get hijacked:

```html
<!-- Announced as "Settings" — the visible ⚙ + text is IGNORED,
     because aria-label wins the accname walk and stops it. -->
<button aria-label="Settings">⚙ Preferences</button>

<!-- ✅ No override: name computed from content = "⚙ Preferences".
     If ⚙ is decorative, hide it so the name is clean. -->
<button><span aria-hidden="true">⚙</span> Preferences</button>
```

Divergence between pixels and tree — legitimate and dangerous:

```html
<!-- Sighted users see an icon; screen readers hear "Delete". Good. -->
<button><svg aria-hidden="true">…</svg><span class="sr-only">Delete</span></button>

<!-- ❌ The whole widget is gone from the a11y tree while still
     visible and clickable — a keyboard user tabs into nothing. -->
<div class="modal" aria-hidden="true"> …focusable buttons… </div>
```

## ⚖️ Trade-offs

- **`aria-hidden` is a scalpel, not a broom.** It hides from AT while leaving the element visible and focusable — perfect for decorative icons, catastrophic on anything interactive (you create focusable-but-invisible-to-AT ghosts). Never put it on a container that holds focusable children.
- **The tree lags reality if you don't tell it.** Updating a value in the DOM updates the a11y node, but *dynamic* changes (a toast appearing) aren't announced unless the node is in a live region. The tree is a snapshot the browser maintains; some changes need an explicit signal.
- **Don't over-curate.** Sprinkling roles and `aria-label`s "to be safe" corrupts the tree — wrong roles, doubled names, overridden content. A clean tree from semantic HTML beats a busy one from ARIA every time.

## 💣 Gotchas interviewers probe

- **"Where does the screen reader read from?"** The accessibility tree via the platform accessibility API — **not the DOM, not the CSS**. Candidates who say "it reads the HTML" miss the whole model.
- **`display:none` vs `aria-hidden` vs `.sr-only`.** `display:none` removes from *both* render and a11y tree; `aria-hidden` removes from a11y tree only (still visible); `.sr-only` (clip/offscreen) removes from *pixels* only (still in the tree). Knowing all three cold is the senior signal.
- **`aria-label` silently replaces visible text** in the name computation — and breaks voice control, because "click Preferences" no longer matches the accessible name "Settings".
- **Empty/`role="presentation"` nodes are pruned or flattened.** `role="none"` on an image or table strips its semantics from the tree entirely.
- **The tree is a computed artifact.** You can't fully reason about accessibility by reading source markup — you inspect the *computed* node in DevTools, because CSS and ARIA both mutate it.

## 🎯 Say this in the interview

> "The mental model I work from is that the browser builds an accessibility tree next to the DOM — a semantic projection where every node exposes a role, an accessible name, and state — and assistive tech reads that tree through a platform accessibility API, never the DOM or CSS directly. So my job is really curating that tree: if a fact about the UI isn't represented there, a screen-reader user can't perceive it. That framing makes the visibility rules click — `display:none` drops a node from the tree, `aria-hidden` hides it from AT but leaves it on screen, and an off-screen `.sr-only` span stays in the tree so it gets announced. I inspect the computed node in the DevTools accessibility pane rather than trusting my markup, because the accessible name follows a specific algorithm where `aria-label` overrides visible text — which is easy to get wrong and easy to verify."

## 🔗 Go deeper

- [web.dev — The accessibility tree](https://web.dev/articles/the-accessibility-tree) — the canonical explainer of the four properties.
- [MDN — Accessibility tree](https://developer.mozilla.org/en-US/docs/Glossary/Accessibility_tree) — how DOM+CSS map to the tree and the platform APIs.
- [W3C — Accessible Name and Description Computation](https://www.w3.org/TR/accname/) — the exact algorithm that decides the name.
- [Chrome DevTools — View the accessibility tree](https://developer.chrome.com/docs/devtools/accessibility/reference) — inspect the computed node yourself.
