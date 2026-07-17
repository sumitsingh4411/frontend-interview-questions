<div align="center">

# Atomic Design

<sub>🏛️ Architecture · 🟢 Easy · ⏱ 45m · `#design-systems`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Brad Frost's mental model borrows chemistry: **atoms → molecules → organisms → templates → pages**, building UI from irreducible parts up to full screens. It's a brilliant *vocabulary* for talking about composition and a **terrible folder structure** — the real, durable idea is the **template (structure) vs page (real content)** distinction, not the atom/molecule bikeshed.

---

## 🧠 Mental model

Atomic Design is a metaphor for the same composition you already do, with names for each altitude:

```
atoms       → indivisible UI: Button, Input, Label, Icon
molecules   → small groups with one job: SearchField (Label + Input + Button)
organisms   → distinct sections: Header, ProductCard, CommentList
templates   → page skeleton with placeholder content: layout + slots
pages       → a template filled with REAL data (the test of the system)
```

The insight worth keeping: **you design the system bottom-up but you validate it top-down.** Atoms feel productive, but a design system only earns trust when a real *page* with real, messy content (a 60-character product name, an empty state, a user with no avatar) survives without new one-off components.

## ⚙️ How it actually works

The two levels that carry all the weight are **templates** and **pages**, and this is the part most summaries skip.

- A **template** defines *structure* — where the header, sidebar and content go — using placeholder content. It answers "what's the skeleton?"
- A **page** is that template rendered with *actual data*. It's where you discover that your card breaks with a long title, your table has no empty state, and your avatar assumed everyone has a photo.

Frost's real point is that **content is a first-class part of design**, and pages are how you pressure-test structure against reality. Atoms/molecules/organisms are just the ladder you climb to get there.

The senior read: **the taxonomy is descriptive, not prescriptive.** "Is a search bar a molecule or an organism?" has no correct answer and no consequences — arguing about it is pure waste. Use the words to communicate ("that's organism-level, it owns data") and refuse to enforce them as a rule.

## 💻 Code

The vocabulary maps cleanly onto component composition — *without* forcing a matching folder tree:

```jsx
// atom — indivisible, purely presentational, no domain knowledge
const Input = (props) => <input className="input" {...props} />;
const Button = ({ children, ...p }) => <button className="btn" {...p}>{children}</button>;

// molecule — a few atoms with a single, focused responsibility
function SearchField({ onSearch }) {
  const [q, setQ] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSearch(q); }}>
      <Input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
      <Button type="submit">Go</Button>
    </form>
  );
}

// organism — a distinct section; may own data/behaviour
function SiteHeader({ user }) {
  return <header><Logo /><SearchField onSearch={goto} /><UserMenu user={user} /></header>;
}
```

```
// ❌ Folders that force the taxonomy → constant "which bucket?" debates,
//    and files move between folders every time a component grows.
src/components/{atoms,molecules,organisms,templates}/…

// ✅ Organise by feature/domain; use atomic terms in conversation & docs.
src/features/search/SearchField.tsx
src/ui/Button.tsx           // shared primitives, flat, no chemistry hierarchy
```

## ⚖️ Trade-offs

- **Great as shared language, poor as file taxonomy.** The atom/molecule/organism boundary is inherently fuzzy, so encoding it in folders creates endless "should this move?" churn and PRs that only relocate files.
- **When NOT to use it:** small apps, or teams without a design system — you'll spend more time categorising than building. It pays off at *design-system scale*, where a shared vocabulary across designers and engineers is genuinely valuable.
- **It says nothing about state, data flow, or boundaries.** Atomic Design is a *UI-composition* metaphor. It won't tell you where state lives or how features depend on each other — pair it with a feature-based architecture, don't expect it to replace one.
- **The layers aren't strict.** Real organisms often contain other organisms; templates sometimes need molecules directly. Treating the ladder as rigid inheritance is a misreading.

## 💣 Gotchas interviewers probe

- **What actually matters is templates vs pages.** If you can articulate "templates define structure with placeholders, pages fill them with real content to stress-test the system", you've read Frost. If you only list atoms/molecules/organisms, you read a tweet about him.
- **The boundaries are deliberately subjective.** Frost himself says don't obsess over classification. A candidate who insists there's a *correct* answer to "molecule or organism" has missed the entire spirit.
- **It's a design-collaboration tool as much as a code one.** Its biggest win is giving designers and engineers a *shared vocabulary*, reducing translation loss between Figma and code.
- **Don't conflate atoms with design tokens.** Tokens (color, spacing, type scale) sit *below* atoms — an atom *consumes* tokens. Mixing the two levels is a common muddle.
- **Pages ≠ routes.** A "page" in atomic design means "template + real content", which you'd typically preview in Storybook. It is not necessarily a routable URL.

## 🎯 Say this in the interview

> "Atomic Design is Brad Frost's chemistry metaphor — atoms like a button or input, molecules like a search field, organisms like a header, then templates and pages. I use it as *vocabulary*, not as a folder structure, because the atom-versus-molecule boundary is genuinely subjective and encoding it in directories just creates endless 'which bucket does this go in' debates and file-shuffling PRs. The part I actually find valuable is the template-versus-page distinction: a template is the structural skeleton with placeholder content, and a page is that template filled with real, messy data — a 60-character product name, an empty list, a user with no avatar. That top-down validation is how a design system earns trust, because atoms always look fine in isolation and only break under real content. So I organise code by feature and keep shared primitives flat, but I'll happily say 'that's organism-level' in a design review because the shared language between design and engineering is where the pattern pays off."

## 🔗 Go deeper

- [Brad Frost — Atomic Design](https://atomicdesign.bradfrost.com/chapter-2/) — the source; chapter 2 defines all five stages in his own words.
- [Brad Frost — Extending atomic design](https://bradfrost.com/blog/post/extending-atomic-design/) — his own reflections on where the rigid interpretation goes wrong.
- [patterns.dev — Design systems](https://www.patterns.dev/) — how atomic thinking fits into a broader component architecture.
- [W3C Design Tokens spec](https://tr.designtokens.org/format/) — the layer that sits *beneath* atoms, and why it's separate.
