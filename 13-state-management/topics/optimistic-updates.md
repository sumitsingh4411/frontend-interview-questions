<div align="center">

# Optimistic updates

<sub>🗃️ State management · 🔴 Hard · ⏱ 1h · `#patterns` `#ux`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Optimistic updates paint the *expected* result immediately, before the server confirms — then reconcile with the real response or **roll back** on error; done right they make an app feel instant, done wrong they lie to the user and corrupt the cache.

---

## 🧠 Mental model

Normally the UI trails the server: click → spinner → wait → render. An optimistic update *inverts the trust*: you assume success, update the UI (and the cache) from the client's predicted state, and fire the mutation in the background. The network round-trip becomes invisible. This is why a good chat app shows your message the instant you hit enter — it hasn't reached the server yet.

The whole discipline is in the **failure path**. An optimistic update is a *bet*, and you must be able to unwind it. So the pattern is always three moves: **(1) snapshot** the current state, **(2) apply** the predicted state, **(3) on error, restore the snapshot**; on success, replace the guess with the server's authoritative response. Skip the snapshot and a failed mutation leaves the UI showing a lie. Skip the reconcile and your optimistic guess (which lacked the server-generated `id`, `createdAt`, etc.) silently diverges from truth.

## ⚙️ How it actually works

In React Query / TanStack Query, `useMutation` exposes the exact lifecycle hooks the pattern needs:

- **`onMutate`** — runs *before* the request. `cancelQueries` (so an in-flight refetch doesn't clobber your optimistic write), snapshot with `getQueryData`, then `setQueryData` to the predicted value. Return the snapshot as *context*.
- **`onError(err, vars, context)`** — restore `context` via `setQueryData`. This is the rollback.
- **`onSettled`** — `invalidateQueries` so the final state is re-fetched from the server, replacing your guess with truth regardless of success/failure.

Two subtleties that separate senior answers:

1. **`cancelQueries` is mandatory.** Without it, a refetch that started before your mutation can land *after* your optimistic write and overwrite it with stale server data — a classic race.
2. **Temporary IDs.** An optimistically-created item has no server ID. Use a temp key (`temp-${uuid}`) and swap it in `onSuccess`/`onSettled`, or you'll get duplicate keys and broken references when the real item arrives.

For concurrent optimistic mutations (rapid clicks), track *how many* are in flight so the last-settled one doesn't roll back while others are still pending — React Query exposes `variables` of all mutations for exactly this.

## 💻 Code

```tsx
const qc = useQueryClient();

const toggleTodo = useMutation({
  mutationFn: (todo) => api.patch(`/todos/${todo.id}`, { done: !todo.done }),

  onMutate: async (todo) => {
    // 1. Stop in-flight refetches from clobbering our write (the race fix).
    await qc.cancelQueries({ queryKey: ['todos'] });
    // 2. Snapshot for rollback.
    const prev = qc.getQueryData(['todos']);
    // 3. Optimistically apply the predicted state.
    qc.setQueryData(['todos'], (old) =>
      old.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)),
    );
    return { prev }; // becomes `context` in onError/onSettled
  },

  // Roll back to the snapshot on failure.
  onError: (_err, _todo, context) => qc.setQueryData(['todos'], context.prev),

  // Reconcile with server truth either way.
  onSettled: () => qc.invalidateQueries({ queryKey: ['todos'] }),
});
```

```js
// ❌ The naive version: no snapshot, no cancel, no reconcile.
setTodos((t) => t.map(toggle));   // on error → UI permanently wrong
api.patch(...);                   // in-flight refetch may overwrite it too
```

## ⚖️ Trade-offs

- **Use it when** the mutation almost always succeeds and is easily reversible: toggles, likes, reorders, adding a comment, marking read. High-frequency, low-stakes actions where latency hurts UX most.
- **Don't use it when** failure is likely, expensive, or confusing to reverse: payments, irreversible deletes, actions with server-side validation the client can't replicate, or anything where showing a wrong-then-corrected value misleads the user (bank balances). Prefer a pending state there.
- **Cost:** real complexity. You now maintain a *predicted* reducer on the client that must mirror server logic. When they drift, the reconcile snaps the UI back jarringly — which is worse than a spinner.
- **Perceived vs actual performance:** optimistic UI improves *perceived* latency only. If the server is genuinely slow and often fails, you're just moving the pain to a jarring rollback.

## 💣 Gotchas interviewers probe

- **Forgetting `cancelQueries`.** The number-one bug: an in-flight query resolves after your optimistic write and overwrites it. Naming this unprompted is a strong senior signal.
- **No rollback snapshot.** On error the UI keeps the lie. You *must* capture previous state and restore it.
- **Temp-ID collisions.** Optimistically-created rows lack the server ID; failing to reconcile causes duplicate React keys and dangling references when the real record arrives.
- **Reconcile clobbering newer edits.** A blanket `invalidateQueries` in `onSettled` can wipe a *second* optimistic edit the user made while the first was in flight. Scope invalidation, or merge instead of replace.
- **Error UX.** Rolling back silently confuses users ("did my click do nothing?"). Pair rollback with a toast: "Couldn't save, try again."
- **Idempotency on the server.** Retried optimistic mutations need idempotency keys, or a double-submit creates two records.

## 🎯 Say this in the interview

> "An optimistic update paints the expected result immediately and reconciles with the server afterward, so the network round-trip feels instant. The discipline is entirely in the failure path: I snapshot current state, apply the predicted state, and on error restore the snapshot — in React Query that's `onMutate` capturing `getQueryData`, `onError` restoring it, and `onSettled` invalidating to pull server truth. The detail people miss is `cancelQueries` in `onMutate`: without it, a refetch already in flight can land after my optimistic write and overwrite it, which is a nasty race. I also handle temp IDs, because an optimistically-created item has no server ID until the response comes back. And I only do this for cheap, reversible, usually-successful actions like toggles and likes — never payments or destructive actions, where a wrong-then-corrected value misleads the user and a plain pending state is safer."

## 🔗 Go deeper

- [TanStack Query — Optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) — the canonical `onMutate`/`onError`/`onSettled` recipe.
- [TanStack Query — Query invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation) — how the reconcile step actually refetches.
- [Redux Toolkit Query — Optimistic updates](https://redux-toolkit.js.org/rtk-query/usage/manual-cache-updates#optimistic-updates) — the same pattern in RTK Query, useful for contrast.
