<div align="center">

# Portals

<sub>⚛️ React · 🟢 Easy · ⏱ 30m · `#patterns`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `createPortal(children, domNode)` renders children into a **different place in the DOM** while keeping them in the **same place in the React tree** — so a modal escapes `overflow: hidden` and stacking-context traps, yet context, state, and event bubbling still flow as if it were where you wrote it.

---

## 🧠 Mental model

React has two trees that usually line up 1:1: the **React tree** (component hierarchy, context, state) and the **DOM tree** (actual elements). A portal deliberately **decouples them** — the component stays exactly where you wrote it in the React tree, but its DOM lands somewhere else, typically a top-level `<div id="modal-root">` sibling to your app root.

Why bother? Because CSS confines children. A deeply nested element can be trapped by an ancestor's `overflow: hidden`, `clip`, or — most insidiously — a `transform`/`filter`/`z-index` that creates a **stacking context** the child can never escape. A dropdown, tooltip, or modal rendered in place gets clipped or z-index-fought. Portalling it to `<body>` sidesteps the entire ancestor CSS chain.

## ⚙️ How it actually works

`createPortal(children, container)` returns something you render like any node. React renders `children` into `container` (a real DOM element), but **reconciliation, context, and events treat the portal as a normal child** of the component that rendered it:

- **Context passes through.** A themed modal portalled to `<body>` still reads your `ThemeContext` — it's a React-tree relationship, not a DOM one.
- **Events bubble through the React tree, not the DOM tree.** A click inside a portalled modal bubbles to the React parent that rendered the portal, *even though* in the DOM the modal is a sibling of the app. This surprises people debugging with native listeners.
- The `container` must already exist in the DOM. You either point at a static `#modal-root` in `index.html`, or create/append/remove one in an effect.

## 💻 Code

```jsx
import { createPortal } from 'react-dom';

function Modal({ children, onClose }) {
  // The portal target lives OUTSIDE the app root, so no ancestor
  // overflow/transform/z-index can clip or trap it.
  const target = document.getElementById('modal-root');

  return createPortal(
    <div className="overlay" onClick={onClose}>
      {/* stopPropagation so a click inside doesn't bubble to the overlay */}
      <div className="dialog" role="dialog" aria-modal="true"
           onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    target
  );
}

// Usage — written deep in the tree, rendered at <body> level.
// It STILL reads context and its onClick STILL bubbles to <Page/>.
function Page() {
  return (
    <ThemeProvider>
      <Sidebar />
      {open && <Modal onClose={close}>…</Modal>}
    </ThemeProvider>
  );
}
```

## ⚖️ Trade-offs

- **Portals solve a CSS-containment problem, not a React problem.** If nothing is clipping or stacking-trapping your element, you don't need one — inline rendering is simpler.
- **A portal is not accessibility.** `createPortal` gets the DOM position right; it does **nothing** for focus trapping, `aria-modal`, `Esc` to close, restoring focus on close, or `inert` on the background. You must add all of that. This is where most home-grown modals fail.
- **When to prefer the platform:** the native `<dialog>` element and the **Popover API** (`popover` attribute) give you top-layer rendering, focus handling, and light-dismiss for free — often a better answer than a portal + hand-rolled a11y in 2025.
- **SSR:** `document` doesn't exist on the server; portal targets must be created/read on the client (guard with an effect or check).

## 💣 Gotchas interviewers probe

- **Events bubble through the React tree, not the DOM tree.** The most-asked portal gotcha: a portalled child's events reach the React parent even though the DOM says otherwise. Great for a modal that needs the parent's handlers; confusing if you're mixing native listeners.
- **Context still works** — candidates often assume a portal "escapes" the provider. It doesn't; the React-tree relationship is intact.
- **Focus management is on you.** Trap focus in the dialog, restore it to the trigger on close, and make the background `inert`/`aria-hidden`. A portal alone is a keyboard trap-*less* accessibility failure.
- **The container must exist first.** Rendering into a `null`/not-yet-mounted target throws.
- **`z-index` still applies** — portalling to `<body>` usually wins the stacking war, but if the target itself sits in a stacking context you can still lose.
- **Cleanup** if you dynamically create the container — remove it on unmount to avoid orphan nodes.

## 🎯 Say this in the interview

> "A portal lets me render children into a different DOM node — usually a top-level `#modal-root` — while keeping them in the same React tree. The point is to escape CSS containment: an ancestor's `overflow: hidden`, or a `transform` that creates a stacking context, will clip or trap a modal or tooltip no matter what `z-index` I set, and a portal to `<body>` sidesteps that whole chain. The subtlety I always mention is that it's a DOM relocation only — context still flows in, and events bubble through the *React* tree, not the DOM tree, so a click in the portalled modal reaches the React parent even though the modal is a `<body>` sibling in the DOM. And critically, a portal is not accessibility: it gives me the right DOM position but I still have to add focus trapping, `Esc`, focus restore, and `inert` on the background — which is why for modals I now often reach for the native `<dialog>` or the Popover API instead."

## 🔗 Go deeper

- [react.dev — `createPortal`](https://react.dev/reference/react-dom/createPortal) — the API and the event-bubbling behaviour.
- [MDN — `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) — the platform-native modal with built-in focus and top-layer.
- [MDN — Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) — top-layer, light-dismiss popovers without a portal.
- [WAI-ARIA — Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — the focus and keyboard behaviour a portal does NOT give you.
