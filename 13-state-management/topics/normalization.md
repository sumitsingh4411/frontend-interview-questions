<div align="center">

# Normalization

<sub>🗃️ State management · 🔴 Hard · ⏱ 1h · `#patterns` `#caching`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Store entities the way a database does: a flat map keyed by ID plus arrays of IDs for order, never nested duplicates. One entity lives in exactly one place, so an update is `byId[id] = …` instead of a recursive tree-walk — and every view of that entity updates at once.

---

## 🧠 Mental model

Nested API responses are a *transport* shape, not a *storage* shape. The moment you `setState(response)` you've committed to a tree where the same user might appear inside `post.author`, inside `comment.author`, and inside `sidebar.onlineUsers` — three copies that now drift independently. Normalization borrows the relational database model: **tables of entities keyed by ID, and relationships expressed as IDs, not embedded objects.**

```
// ❌ Nested (denormalized) — Alice appears 3 times
posts: [{ id: 'p1', author: { id: 'u1', name: 'Alice' }, comments: [
          { id: 'c1', author: { id: 'u1', name: 'Alice' } }] }]

// ✅ Normalized — Alice exists once, referenced by id
users:    { byId: { u1: { id: 'u1', name: 'Alice' } }, allIds: ['u1'] }
posts:    { byId: { p1: { id: 'p1', author: 'u1', comments: ['c1'] } }, allIds: ['p1'] }
comments: { byId: { c1: { id: 'c1', author: 'u1' } }, allIds: ['c1'] }
```

The single source of truth stops being aspirational and becomes structural.

## ⚙️ How it actually works

The canonical shape is `{ byId: Record<Id, Entity>, allIds: Id[] }`. `byId` gives O(1) lookup and update; `allIds` (or per-collection ID arrays) preserves order and lets you render lists by mapping IDs. Relationships are foreign keys: `post.author = 'u1'`, `post.comments = ['c1','c2']`.

Why the split matters at scale:

- **Updates are pointed, not recursive.** Renaming a user touches one object. In a nested tree you'd have to find and patch every embedded copy — and you'll miss one.
- **Referential stability is preserved.** When you update `comments.byId.c1`, the `users` slice keeps the *same reference*. Any memoized selector or `React.memo` component reading users doesn't re-render. Denormalized trees re-create parent objects on every child change, defeating memoization.
- **Cache merging is trivial.** A new API response is just `Object.assign(byId, incoming)` — later fetches upsert entities without you reconciling nested duplicates.

Redux Toolkit's `createEntityAdapter` generates this for you: `setAll`, `addMany`, `upsertMany`, `updateOne`, plus `selectById`/`selectIds` selectors. Normalizr does the read-time transform from nested JSON to normalized tables given a schema.

The cost lives at the boundaries: you **denormalize on read** (join IDs back to entities) and you must **normalize on write**. That join is where selectors and memoization earn their keep.

## 💻 Code

```js
// Normalize a nested response into tables
function normalizePosts(posts) {
  const users = {}, comments = {}, byId = {}, allIds = [];
  for (const p of posts) {
    users[p.author.id] = p.author;                 // dedupe by id
    const commentIds = p.comments.map((c) => {
      users[c.author.id] = c.author;               // authors merge here too
      comments[c.id] = { ...c, author: c.author.id };
      return c.id;
    });
    byId[p.id] = { ...p, author: p.author.id, comments: commentIds };
    allIds.push(p.id);
  }
  return { posts: { byId, allIds }, users, comments };
}

// Denormalize on read — join IDs back to entities (memoize this!)
const selectPostWithAuthor = (state, id) => {
  const post = state.posts.byId[id];
  return { ...post, author: state.users[post.author] };
};
```

```js
// Redux Toolkit does the whole thing for you
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
const usersAdapter = createEntityAdapter();
const usersSlice = createSlice({
  name: 'users',
  initialState: usersAdapter.getInitialState(), // { ids: [], entities: {} }
  reducers: {
    userReceived: usersAdapter.upsertOne,        // O(1) upsert, no dupes
    usersReceived: usersAdapter.upsertMany,
  },
});
```

## ⚖️ Trade-offs

- **When NOT to normalize:** read-only, throwaway, or genuinely tree-shaped data (a rendered comment thread you never mutate) is fine nested. Normalization is overhead you pay to make *updates and dedup* cheap — no updates, no payoff.
- **Boilerplate vs. correctness.** The join logic and adapters are real code. `createEntityAdapter` amortizes it, but a five-field local form does not need a relational store.
- **Server-cache tools already do this.** React Query / SWR normalize by query key and handle invalidation for you. If your "global state" is really server data, reach for those before hand-rolling entity tables — most normalization pain is server-cache state misfiled as client state.
- **Deep relational graphs** (many-to-many, cyclic) push you toward GraphQL clients (Apollo/Relay) whose normalized caches are purpose-built for this.

## 💣 Gotchas interviewers probe

- **"Why not just store the nested response?"** Because the same entity appears in multiple places and updates cause drift and stale reads. This is the whole point — say it plainly.
- **Denormalizing on every render kills performance.** The join creates new objects each call, so an unmemoized selector breaks `React.memo` downstream. Memoize the join (Reselect) so the reference is stable when inputs don't change.
- **Order lives in `allIds`, not `byId`.** Object key order is not a reliable contract for sorted/paginated lists — keep an explicit ID array, and keep separate arrays per filter/sort/page.
- **Deleting an entity leaves dangling references.** Removing `users.u1` doesn't clean `post.author = 'u1'`. You need referential-integrity handling on delete, or tolerant selectors.
- **Nested normalization is still normalization.** People stop at one level. If comments have authors, authors normalize too — otherwise you've just moved the duplication down a layer.

## 🎯 Say this in the interview

> "I treat the store like a database: flat tables of entities keyed by ID, with relationships as foreign-key IDs and separate arrays for ordering. The reason is dedup and update cost — in a nested tree the same user is copied in three places and they drift, whereas normalized there's one canonical copy, so an update is a single O(1) write and every view of that entity updates together. It also protects referential stability, which is what keeps memoized selectors and `React.memo` from re-rendering the world. The cost is you denormalize on read, so I always memoize that join with something like Reselect. In Redux I reach for `createEntityAdapter` to get the shape and CRUD for free. And honestly, if the data is server state, I'd let React Query normalize by query key instead of hand-rolling it."

## 🔗 Go deeper

- [Redux — Normalizing state shape](https://redux.js.org/usage/structuring-reducers/normalizing-state-shape) — the canonical `byId`/`allIds` rationale and patterns.
- [Redux Toolkit — `createEntityAdapter`](https://redux-toolkit.js.org/api/createEntityAdapter) — generated CRUD reducers and selectors for normalized data.
- [Normalizr](https://github.com/paularmstrong/normalizr) — schema-driven normalization of nested JSON into entity tables.
- [Redux — Managing normalized data](https://redux.js.org/usage/structuring-reducers/updating-normalized-data) — updates, relationships, and deletion cleanup.
