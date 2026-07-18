<div align="center">

# Query priorities & user-centric tests

<sub>🧪 Testing · 🟡 Medium · ⏱ 45m · `#rtl` `#a11y`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Testing Library ranks its queries by how closely they mirror how a real user (and assistive tech) finds things: **role → label → text → alt/title → test-id**, and picking the highest one you can is simultaneously a test-quality and an accessibility check.

---

## 🧠 Mental model

The query priority isn't stylistic pedantry — it's a **proxy for accessibility**. A sighted mouse user, a keyboard user, and a screen-reader user all locate the same "Submit" button, but through different channels. Testing Library's ordering says: **query through the channel that the most people, including assistive tech, actually use.**

That reframes what a "good selector" means. `getByRole('button', { name: /submit/i })` doesn't just find an element — it *asserts* that a screen reader would announce a button named "Submit". If that query is impossible, your UI has an accessibility hole. So the ladder does double duty: it makes tests resilient to markup changes **and** it fails loudly when the accessibility tree is wrong. `getByTestId` sits at the bottom precisely because a `data-testid` is invisible to users — it verifies nothing about the actual experience.

## ⚙️ How it actually works

The official priority, top (best) to bottom (last resort):

| Tier | Query | Why it ranks here |
|---|---|---|
| **1. Accessible to everyone** | `getByRole` (with `name`) | matches the accessibility tree; how AT navigates |
| | `getByLabelText` | the canonical way to find form fields |
| | `getByPlaceholderText` | weaker — placeholder isn't a label |
| | `getByText` | how users find non-interactive content |
| | `getByDisplayValue` | current value of a filled field |
| **2. Semantic** | `getByAltText` | images/area — alt is user-facing |
| | `getByTitle` | inconsistently surfaced by AT |
| **3. Escape hatch** | `getByTestId` | invisible to users; markup-coupled |

**`getByRole` is the workhorse** because roles are computed from the accessibility tree: a `<button>` has role `button`, `<a href>` role `link`, `<input type="checkbox">` role `checkbox`. The `name` option matches the **accessible name** — computed from text content, `aria-label`, `aria-labelledby`, or an associated `<label>`. `{ hidden: false }` (the default) even ignores `aria-hidden` elements, exactly as AT would.

**`getByLabelText`** resolves the full labelling chain: `<label for>`, wrapping `<label>`, `aria-labelledby`, `aria-label`. If it can't find the input, the input isn't properly labelled — a genuine bug.

## 💻 Code

```jsx
render(<SearchForm />);

// ❌ Bottom of the ladder — proves nothing about the real UX,
//    and breaks when someone renames the test id.
screen.getByTestId('search-input');

// ❌ Placeholder is not a label; it disappears on input and
//    is poorly announced by screen readers.
screen.getByPlaceholderText('Search…');

// ✅ Top of the ladder — asserts the field is properly labelled.
const input = screen.getByRole('textbox', { name: /search/i });
await userEvent.type(input, 'testing');

// ✅ Roles find interactive elements the way AT navigates them.
await userEvent.click(screen.getByRole('button', { name: /search/i }));

// The corresponding markup that makes the good queries possible:
// <label htmlFor="q">Search</label>
// <input id="q" type="search" />
// <button>Search</button>
```

```jsx
// Debugging which roles/names are available — invaluable in interviews:
screen.debug();                 // prints the current DOM
screen.logTestingPlaygroundURL(); // opens a UI showing the best query
// or:
import { logRoles } from '@testing-library/dom';
logRoles(container);            // lists every element's computed role + name
```

## ⚖️ Trade-offs

- **Purity vs pragmatism.** Role-first queries are best, but some third-party widgets render inaccessible markup you don't control. A scoped `getByTestId` is an honest escape hatch — just don't let it become the default.
- **Role queries are slightly slower** because computing the accessibility tree isn't free. On huge trees, scoping with `within(section)` keeps both speed and clarity.
- **When NOT to force it:** don't add ARIA roles *purely to satisfy a test*. If you're inventing `role="..."` attributes that no user benefits from, you've inverted the tool — the accessibility should be real, and the test follows it.

## 💣 Gotchas interviewers probe

- **`getByTestId` as a first move is a red flag.** It says "I skipped the accessibility ladder." The strongest candidates reach for role and label first and treat test-ids as last resort.
- **Placeholder ≠ label.** `getByPlaceholderText` is low-priority for a reason: placeholders vanish on input and are unreliable for AT. Never use a placeholder as the *only* label.
- **Accessible name computation trips people up.** An icon-only button has *no* accessible name and `getByRole('button', { name: ... })` fails — correctly, because a screen reader can't name it either. The fix is `aria-label`, not `getByTestId`.
- **`name` matches the computed name, not `innerText`.** `aria-labelledby` and `aria-label` override visible text. Assert on what AT actually announces.
- **Hidden elements.** `getByRole` ignores `display:none` and `aria-hidden` by default. To find them you must pass `{ hidden: true }` — usually a sign something's wrong.
- **Multiple matches.** `getByRole('listitem')` throws when there are many; scope with `within(...)` or use `getAllByRole` and index deliberately.

## 🎯 Say this in the interview

> "Testing Library ranks queries by how closely they mirror how real users and assistive tech find things: role and accessible name first, then label, then visible text, and `getByTestId` dead last because a test id is invisible to users. I treat that ladder as an accessibility check, not just a style rule — if I can't select a button by its role and name, a screen reader can't announce it either, so the test failing is telling me about a real bug. So I default to `getByRole('button', { name: /save/i })`, use `getByLabelText` for form fields, and only drop to a test id for third-party markup I don't control. When I'm unsure what's queryable I use `logRoles` or the Testing Playground to see the computed roles. The mindset is: make the UI accessible, and the resilient query falls out for free."

## 🔗 Go deeper

- [Testing Library — About queries](https://testing-library.com/docs/queries/about/) — the priority list and the verb/selector matrix.
- [Testing Library — ByRole](https://testing-library.com/docs/queries/byrole/) — roles, the `name` option, and hidden handling.
- [Which query should I use?](https://testing-library.com/docs/queries/about/#priority) — the canonical ordering with rationale.
- [MDN — ARIA: accessible name computation](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles) — how `name` is derived from labels and ARIA.
