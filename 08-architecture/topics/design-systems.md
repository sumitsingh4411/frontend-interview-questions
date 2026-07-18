<div align="center">

# Design systems

<sub>🏛️ Architecture · 🔴 Hard · ⏱ 1.5h · `#design-systems`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A design system isn't a component library; it's the **shared contract** — tokens, components, patterns, and the governance around them — that lets many teams build consistent, accessible UI without re-deciding the same things, and its hardest problems are organisational (adoption, versioning, ownership), not technical.

---

## 🧠 Mental model

A component library is code. A design system is a **product whose users are other engineers and designers**. That reframe explains everything that's hard about it: you have to think about API stability, migration paths, documentation, versioning, and support — the same discipline you'd apply to a public SDK, because internally that's exactly what it is.

The system has layers, and confusing them is the classic mistake:

| Layer | What it is | Example |
|---|---|---|
| **Tokens** | Named design decisions, platform-agnostic | `color.action.primary`, `space.4` |
| **Primitives** | Unstyled behaviour + a11y | `Menu`, `Dialog`, `Combobox` |
| **Components** | Styled, opinionated, branded | `<Button variant="primary">` |
| **Patterns** | Compositions that solve a task | a form layout, an empty state |

Tokens are the foundation because they let one decision (the brand blue changed) propagate everywhere without touching a single component. **The measure of a design system is not how it looks — it's its adoption rate.** A beautiful system nobody uses is a failed system; a plain one every team ships on is a success.

## ⚙️ How it actually works

- **Tokens as the source of truth.** Design decisions live as data (often the W3C token format), transformed by a tool like Style Dictionary into CSS variables, JS objects, native constants. Theming and dark mode become "swap the token values", not "rewrite components".
- **Behaviour/style split.** Modern systems build components on **headless primitives** (Radix, React Aria, Ark) that own keyboard interaction, focus management, and ARIA — the genuinely hard, easy-to-get-wrong part — and layer brand styling on top. This is why a11y is *centralised*: fix a focus-trap bug once, every product inherits it.
- **Distribution & versioning.** Shipped as versioned packages under semver. A breaking change to `<Button>` is a distributed-systems problem: dozens of apps on different versions, so you need deprecation windows, codemods, and a migration story — not a flag day.
- **Governance.** A contribution model (who can add a component, what the bar is), a review process, and a way to say *no*. Without governance a system either ossifies (nothing new lands) or sprawls (every team's snowflake gets merged).

The senior insight: **the technical parts are largely solved; the failure modes are social.** Adoption stalls because teams don't trust the system's velocity, or because it can't express their edge case and they fork. Your job is to make the paved road faster than going around it.

## 💻 Code

```tsx
// ❌ Hard-coded values — a rebrand means find-and-replace across every repo,
// and dark mode is a second copy of everything.
const Button = styled.button`
  background: #2563eb;
  padding: 8px 16px;
  border-radius: 6px;
`;

// ✅ Token-driven — one decision propagates everywhere; theming is free.
const Button = styled.button`
  background: var(--color-action-primary);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
`;
```

```tsx
// ✅ Behaviour from a headless primitive (a11y solved once), brand on top.
// The system owns focus + ARIA; teams get correctness for free.
import { Dialog } from '@radix-ui/react-dialog';

export function Modal({ children, ...props }) {
  return (
    <Dialog.Root {...props}>
      <Dialog.Overlay className="ds-overlay" />
      <Dialog.Content className="ds-modal">{children}</Dialog.Content>
    </Dialog.Root>
  );
}
```

## ⚖️ Trade-offs

- **When NOT to build one:** a single team, one product, an early-stage codebase where the UI is still churning weekly. Extracting a system prematurely freezes decisions you haven't validated and adds a package boundary you'll fight. Build the app first; harvest the system once patterns *repeat*.
- **Consistency vs. velocity.** A strict system speeds up the 90% case and slows the 10% edge case that doesn't fit. Too rigid and teams fork around you (worst outcome — invisible divergence); too loose and you're not a system. The escape hatch (style props, `asChild`, `className` passthrough) is a feature, not a compromise.
- **Ownership cost is permanent.** A design system needs a funded team forever — support, upgrades, docs, a11y audits. Organisations that build one and disband the team watch it rot within a year.

## 💣 Gotchas interviewers probe

- **"Design system = component library"** — the fastest junior tell. The library is one deliverable; the system is tokens + components + patterns + docs + *governance*. Lead with the product framing.
- **A11y is the whole point, not a nice-to-have.** The strongest argument for a design system is centralising accessibility — get focus, keyboard, and ARIA right once. A candidate who doesn't mention this has missed the biggest ROI.
- **Versioning breaking changes across many consumers** is the real engineering challenge. Semver, deprecations, and codemods (not a flag-day rewrite) are what senior engineers reach for.
- **Adoption is the metric.** Not Figma polish, not component count — how many teams actually ship on it. Measuring the wrong thing kills systems.
- **The escape hatch matters.** A system with no way to override will be forked. `className`/style-prop passthrough and slot APIs keep teams *inside* the system instead of routing around it.

## 🎯 Say this in the interview

> "I treat a design system as an internal product whose users are other engineers and designers — which means API stability, versioning, docs, and support matter as much as how it looks. I structure it in layers: tokens as the source of truth so one decision propagates everywhere and theming is just swapping token values; headless primitives underneath so accessibility — focus, keyboard, ARIA — is solved centrally and every product inherits the fix; then branded components and patterns on top. The biggest argument for a system is that centralised a11y, and the metric that matters is adoption, not polish. The hard problems are organisational: versioning breaking changes across dozens of apps on different versions needs deprecations and codemods, not a flag day, and you need an escape hatch so teams override instead of forking. I wouldn't build one for a single early-stage product — I'd harvest it once patterns actually repeat."

## 🔗 Go deeper

- [Design Systems Handbook (DesignBetter)](https://www.designbetter.co/design-systems-handbook) — the canonical end-to-end guide, product and process included.
- [Brad Frost — Atomic Design](https://atomicdesign.bradfrost.com/) — the layered mental model (atoms → pages) most systems borrow from.
- [Radix Primitives](https://www.radix-ui.com/primitives) — the reference for accessible headless components you style yourself.
- [Style Dictionary](https://styledictionary.com/) — how tokens become platform outputs (CSS vars, JS, native).
- [Nathan Curtis — Design Systems (EightShapes)](https://medium.com/eightshapes-llc) — deep, opinionated writing on governance, versioning, and team models.
