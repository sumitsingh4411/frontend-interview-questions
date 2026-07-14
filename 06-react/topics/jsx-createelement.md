<div align="center">

# JSX & `createElement`

<sub>⚛️ React · 🟢 Easy · ⏱ 30m · `#basics`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — JSX is **syntax sugar for a function call** that returns a plain object. `<Foo a={1}/>` compiles to `jsx(Foo, { a: 1 })`, which returns `{ type: Foo, props: { a: 1 }, key: null }` — a *description* of UI, not a DOM node and not a component instance.

---

## 🧠 Mental model

JSX is not a templating language. It has no runtime. It is a **compile-time transform**, and the thing it produces is boringly simple:

```
   <Button size="lg">Save</Button>
              │  Babel / SWC / tsc
              ▼
   jsx(Button, { size: "lg", children: "Save" })
              │  runs at runtime
              ▼
   { $$typeof: Symbol(react.element),
     type: Button,               // fn reference, or "div" string
     props: { size: "lg", children: "Save" },
     key: null }
```

That object is inert. Nothing has rendered. React later *calls* `type(props)` while reconciling. This is why "React is just JavaScript" is true in a load-bearing way: `if`, `.map()`, and variables all work, because you're building a data structure, not writing a template.

The single most useful reframe: **an element is a description; a component is the function that produces descriptions; the DOM node is what React eventually commits.** Three different things people call "the component".

## ⚙️ How it actually works

**The new JSX transform (React 17+).** The classic transform emitted `React.createElement(...)`, which is why every file needed `import React from 'react'`. Since React 17, the *automatic runtime* emits imports the compiler injects for you:

```js
import { jsx as _jsx } from 'react/jsx-runtime';
_jsx('div', { className: 'card', children: 'hi' });
```

That's why you no longer import React just to use JSX. `jsx()` (and `jsxs()` for static-children arrays) is slightly faster than `createElement` — it skips the arguments-splat and dev-only `key` extraction. `React.createElement` still exists, still works, and is worth knowing because interviewers ask "what does JSX compile to?" — the *modern* answer is `jsx()`, and saying so signals you've read a build output recently.

**Capitalisation is semantic, not stylistic.** `<div />` compiles to `jsx('div', ...)` — a string. `<Div />` compiles to `jsx(Div, ...)` — an identifier resolved in scope. Lowercase your component and React will try to render an unknown HTML tag and warn. Dotted access (`<Icons.Check />`) is always treated as an identifier, which is why namespaced components can be lowercase.

**`key` and `ref` are not props.** They're extracted by the compiler/runtime into the element's own fields — `props.key` is `undefined` inside your component. (React 19 relaxes this for `ref`, which is now forwardable as a normal prop on function components, but `key` remains reserved forever: it's reconciliation metadata, not data.)

**Children are just a prop.** `<A><B/></A>` is `jsx(A, { children: jsx(B, {}) })`. There is nothing magic about nesting.

## 💻 Code

```jsx
// These three are IDENTICAL after compilation:
const a = <Card title="Hi" onSave={save}>body</Card>;
const b = jsx(Card, { title: 'Hi', onSave: save, children: 'body' });
const c = React.createElement(Card, { title: 'Hi', onSave: save }, 'body');

console.log(a.type);   // the Card function itself
console.log(a.props);  // { title: 'Hi', onSave: save, children: 'body' }
// Nothing has rendered. It's a plain object you could JSON-ish inspect.
```

Conditional rendering — the classic footgun:

```jsx
// ❌ When items.length === 0, this renders a literal "0" on the page.
//    JSX skips null/undefined/false/true, but 0 is a valid React child.
{items.length && <List items={items} />}

// ✅ Force a boolean, or use a ternary.
{items.length > 0 && <List items={items} />}
{items.length ? <List items={items} /> : null}
```

Elements are immutable and cheap; **inline components are not**:

```jsx
// ❌ New function identity every render → new `type` → React unmounts and
//    remounts the whole subtree, destroying its state and DOM.
function Page() {
  const Row = () => <input />;      // redefined each render
  return <Row />;
}

// ✅ Hoist it. Same `type` reference across renders → React reuses the fiber.
const Row = () => <input />;
```

## ⚖️ Trade-offs

- **JSX buys colocation and full JS expressiveness; it costs a build step.** You cannot ship JSX to a browser. If you genuinely need a no-build script tag, `React.createElement` (or `htm`) is the honest alternative — don't pretend JSX is free.
- **JSX is not sandboxed like a template language.** Angular/Vue templates restrict what expressions can appear; JSX lets you inline arbitrary logic, which is powerful and, in a large codebase, easy to abuse into unreadable render bodies.
- **It's not React-specific.** `jsxImportSource` lets Preact, Solid, Hono and others reuse the syntax with entirely different runtime semantics — so "JSX means Virtual DOM" is false. Solid compiles JSX to direct DOM instructions with no VDOM at all.

## 💣 Gotchas interviewers probe

- **"Why did we used to need `import React`?"** Because the classic transform emitted `React.createElement`, so `React` had to be in lexical scope. The automatic runtime injects `react/jsx-runtime` instead. This is a great one-line demonstration that you understand JSX is a *transform*.
- **`0` renders, `false` doesn't.** `null`, `undefined`, `true`, `false` are skipped as children; `0` and `NaN` print. Hence the `&&` bug above.
- **`class` → `className`, `for` → `htmlFor`.** Because props become object keys and those are reserved words — a mechanical consequence, not a style choice.
- **JSX props are not HTML attributes.** For DOM elements React mostly sets *properties*, and `style` takes an object with camelCased keys (`style={{ backgroundColor: 'red' }}`) — the double braces are "object literal inside an expression slot", not special syntax.
- **You must return a single root** — because a function returns one value. Fragments (`<>...</>`, i.e. `jsx(Fragment, ...)`) exist purely to satisfy that without a wrapper `div`.
- **`dangerouslySetInnerHTML` is named to make you hesitate.** JSX escapes string children by default, which is what makes React XSS-resistant out of the box.
- **Defining a component inside another component's body** remounts the subtree every render. Most people describe this as "a perf problem" — it's worse than that, it's a *correctness* problem: state and focus are lost.

## 🎯 Say this in the interview

> "JSX is compile-time sugar. `<Card title='x'/>` becomes a call — `React.createElement` under the classic transform, or `jsx()` from `react/jsx-runtime` under the automatic transform that shipped in React 17, which is why we no longer import React in every file. Either way, the return value is a plain immutable object: `{ type, props, key }`. It's a description of UI, not a DOM node and not an instance. Lowercase tags compile to a string type, capitalised ones to an identifier from scope — that's why casing matters. And `key` isn't a prop; it's lifted out because it's reconciliation metadata. The mental model I hold on to is: elements are cheap data, components are functions that return that data, and React decides what to do with it later."

## 🔗 Go deeper

- [react.dev — Writing markup with JSX](https://react.dev/learn/writing-markup-with-jsx) — the canonical intro, including the rules JSX imposes on HTML.
- [react.dev — `createElement`](https://react.dev/reference/react/createElement) — the exact shape of the element object.
- [Introducing the new JSX transform](https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html) — the React team explaining `jsx()` vs `createElement`, with before/after output.
- [react.dev — Conditional rendering](https://react.dev/learn/conditional-rendering) — covers the `&&` / falsy-`0` trap head-on.
