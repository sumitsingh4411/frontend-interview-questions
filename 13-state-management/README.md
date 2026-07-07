# 13 · State Management

Server state vs client state, and picking the right tool. A favorite "walk me through the trade-offs" topic.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Client vs server state (the key distinction) | 🟡 | 45m | `#concepts` | [TanStack Query: motivation ⭐](https://tanstack.com/query/latest/docs/framework/react/overview) |
| Local component state & lifting | 🟢 | 30m | `#basics` `#react` | [react.dev: sharing state ⭐](https://react.dev/learn/sharing-state-between-components) |
| Context as state (and its limits) | 🟡 | 45m | `#react` `#performance` | [react.dev: scaling with context+reducer ⭐](https://react.dev/learn/scaling-up-with-reducer-and-context) |
| Redux & the flux pattern | 🟡 | 1h | `#redux` | [Redux: core concepts ⭐](https://redux.js.org/tutorials/essentials/part-1-overview-concepts) |
| Redux Toolkit | 🟡 | 1h | `#redux` | [Redux Toolkit ⭐](https://redux-toolkit.js.org/introduction/getting-started) |
| Zustand | 🟢 | 45m | `#zustand` | [Zustand docs ⭐](https://zustand.docs.pmnd.rs/) |
| Jotai (atomic state) | 🟡 | 45m | `#jotai` `#atoms` | [Jotai docs ⭐](https://jotai.org/) |
| Recoil | 🟡 | 45m | `#recoil` `#atoms` | [Recoil docs ⭐](https://recoiljs.org/) |
| Signals | 🔴 | 1h | `#signals` `#reactivity` | [Preact: signals ⭐](https://preactjs.com/guide/v10/signals/) |
| MobX (observable state) | 🟡 | 1h | `#mobx` `#reactivity` | [MobX docs ⭐](https://mobx.js.org/README.html) |
| RxJS & streams | 🔴 | 1.5h | `#rxjs` `#streams` | [RxJS docs ⭐](https://rxjs.dev/guide/overview) |
| React Query / TanStack Query | 🔴 | 1.5h | `#server-state` `#caching` | [TanStack Query ⭐](https://tanstack.com/query/latest) |
| SWR | 🟡 | 45m | `#server-state` `#caching` | [SWR docs ⭐](https://swr.vercel.app/) |
| Apollo Client (GraphQL cache) | 🔴 | 1h | `#graphql` `#caching` | [Apollo Client ⭐](https://www.apollographql.com/docs/react/) |
| Normalization | 🔴 | 1h | `#patterns` `#caching` | [Redux: normalizing state ⭐](https://redux.js.org/usage/structuring-reducers/normalizing-state-shape) |
| Optimistic updates | 🔴 | 1h | `#patterns` `#ux` | [TanStack: optimistic updates ⭐](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) |
| Offline support & persistence | 🔴 | 1.5h | `#offline` `#pwa` | [web.dev: offline ⭐](https://web.dev/articles/offline-cookbook) |
| Undo/redo & state machines (XState) | 🔴 | 1h | `#state-machine` | [XState docs ⭐](https://stately.ai/docs) |

**Related:** [06-react](../06-react/) · [12-networking](../12-networking/) · [17-interview-patterns](../17-interview-patterns/)

_Missing something? [Add a row](../CONTRIBUTING.md)._
