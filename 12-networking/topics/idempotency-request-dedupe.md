<div align="center">

# Idempotency & request dedupe

<sub>📡 Networking · 🟡 Medium · ⏱ 45m · `#reliability`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — An operation is **idempotent** if doing it twice equals doing it once. Networks make duplicates inevitable (a timeout doesn't tell you whether the write landed), so for unsafe writes you send an **idempotency key** — a client-generated unique ID the server remembers, so a retried `POST` returns the *original* result instead of charging the card twice.

---

## 🧠 Mental model

The core problem: **a failed response is not a failed request.** When a `POST /charge` times out, the charge may have succeeded and the response got lost on the way back. The client has no way to know. So it faces a lose-lose: retry and risk a *double charge*, or don't retry and risk a *lost charge*.

Idempotency keys break the tie. The client mints a unique key **once, before the first attempt**, and sends it with every retry of the *same logical operation*. The server records "I processed key `k` → result R"; a second request with key `k` gets R replayed, not re-executed.

```
Attempt 1:  POST /charge  Idempotency-Key: k9f…   ─▶ server charges $10, stores k9f→receipt
            ✗ response lost in the network (but the charge HAPPENED)
Attempt 2:  POST /charge  Idempotency-Key: k9f…   ─▶ server sees k9f, REPLAYS receipt
            ✓ exactly one charge, client gets its answer
```

**Same key = same operation.** Generate it per logical action (one "Pay" click), not per HTTP attempt.

## ⚙️ How it actually works

**HTTP methods have idempotency baked into their contract:** `GET`, `PUT`, `DELETE`, `HEAD` are defined as idempotent (repeating them lands you in the same state); `POST` and `PATCH` are **not**. That's *why* `PUT /users/42 {…}` (set the whole resource) is retry-safe but `POST /users` (create a new one) needs a key — repeating the `PUT` overwrites to the same value, repeating the `POST` makes a second user.

**Server-side implementation** (the Stripe model): the key is stored with the request outcome, typically for ~24h.

1. Request arrives with `Idempotency-Key: k`. Look it up.
2. **New key** → acquire a lock on `k`, process the operation, store `(k → status, response)`, release, return.
3. **Seen key, completed** → return the stored response verbatim. Don't re-run.
4. **Seen key, in-flight** (concurrent duplicate) → return `409 Conflict` / make the caller wait — this is why the **lock** matters.
5. Optionally store a **request fingerprint** so reusing a key with a *different* body is rejected (`422`) rather than silently returning the wrong result.

**Client-side dedupe** is the lighter-weight cousin: collapse *concurrent* identical in-flight requests into one shared promise (below), so a double-click or a re-render doesn't fire two calls. That handles the client; only server idempotency keys handle a *retry across a lost response*.

## 💻 Code

```js
// CLIENT: send a stable key per logical action; reuse it across retries.
async function pay(cartId, amount) {
  const key = crypto.randomUUID();          // once, BEFORE any attempt
  return fetchRetry('/charge', {
    method: 'POST',
    headers: { 'Idempotency-Key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ cartId, amount }),
  }); // every retry inside fetchRetry reuses `key` → server dedupes
}
```

```js
// CLIENT dedupe: coalesce concurrent identical requests into one promise.
const inflight = new Map();
function dedupe(key, fn) {
  if (inflight.has(key)) return inflight.get(key);       // reuse the in-flight call
  const p = fn().finally(() => inflight.delete(key));    // clear when settled
  inflight.set(key, p);
  return p;
}
// Double-click → ONE network request, both callers await the same promise.
btn.onclick = () => dedupe('checkout', () => pay(cartId, amount));
```

```js
// SERVER sketch: lock, process once, replay thereafter.
async function handleCharge(req, res) {
  const key = req.headers['idempotency-key'];
  if (!key) return res.status(400).json({ error: 'Idempotency-Key required' });
  const existing = await store.get(key);
  if (existing?.status === 'done') return res.status(200).json(existing.response); // replay
  if (existing?.status === 'locked') return res.status(409).json({ error: 'in progress' });
  await store.set(key, { status: 'locked' });            // claim the key
  const receipt = await chargeOnce(req.body);            // the real, unsafe work
  await store.set(key, { status: 'done', response: receipt });
  res.status(201).json(receipt);
}
```

## ⚖️ Trade-offs

- **Idempotency keys are mandatory for money-movement and resource-creation**, and cheap insurance elsewhere. The cost is a stateful store (Redis/DB) keyed by the idempotency key with a TTL — a small price versus a double charge.
- **Client dedupe ≠ server idempotency.** Coalescing in-flight promises stops double-submits from *one* page, but it does nothing for a retry after a lost response, a page reload, or two devices. **When NOT to rely on client dedupe alone:** anything with real-world side effects — it must be enforced server-side.
- **Prefer idempotent method semantics where you can.** Modeling an operation as `PUT` to a deterministic resource ID (e.g. `PUT /transfers/{clientGeneratedId}`) gives you idempotency *for free* without a separate key mechanism — the resource ID *is* the key.
- **Keys must be genuinely unique and stored long enough** to outlive all realistic retries (Stripe keeps them 24h). Too-short TTL and a late retry re-executes; reusing a key across different operations returns the wrong cached result.

## 💣 Gotchas interviewers probe

- **"Timeout means it didn't happen." Wrong.** The write may have committed and only the *response* was lost. This is the entire reason idempotency exists — a candidate who assumes a timeout = no-op is the one who ships double charges.
- **Generating the key per-attempt.** If the retry mints a *new* key, the server sees a brand-new operation and executes again. The key must be created **once per logical action** and reused across retries.
- **`POST` is not idempotent; `PUT`/`DELETE` are.** And note `DELETE` is idempotent in *state* (resource stays gone) but the *response* differs — first `200`, then `404`. Interviewers like this nuance.
- **Race between concurrent duplicates.** Two retries arrive simultaneously; without a lock on the key, both pass the "have I seen this?" check and both execute. The `locked` state / atomic insert is what closes the window.
- **Same key, different body.** A client bug reuses a key with new parameters. A robust server fingerprints the request and rejects the mismatch (`422`) instead of returning the stale result.
- **Idempotent ≠ safe.** `DELETE` is idempotent but it *changes* state (not "safe" like `GET`). Don't conflate the two properties.

## 🎯 Say this in the interview

> "Idempotency matters because a failed response isn't a failed request — if `POST /charge` times out, the charge may have gone through and I just lost the reply, so a blind retry double-charges. The fix is an idempotency key: the client generates a unique ID once per logical action, before the first attempt, and reuses it on every retry. The server records key-to-result, so the first request executes and every duplicate replays the stored response instead of re-running the side effect. The details I'd call out are: generate the key per action, not per HTTP attempt, or you defeat the whole thing; lock the key so two concurrent retries don't both slip through and execute; and keep the record for long enough — Stripe keeps them 24 hours. Where I can, I prefer to make the operation naturally idempotent by `PUT`-ing to a client-generated resource ID, so the resource ID *is* the dedupe key. And I'll add client-side promise coalescing to kill double-click duplicates, but that's a UX nicety — real safety has to be enforced server-side."

## 🔗 Go deeper

- [Stripe — Idempotent requests](https://docs.stripe.com/api/idempotent_requests) — the reference design: keys, TTL, replay, and same-key-different-body handling.
- [MDN — Idempotent methods](https://developer.mozilla.org/en-US/docs/Glossary/Idempotent) — which HTTP methods are idempotent and why.
- [MDN — Safe (HTTP methods)](https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP) — the safe-vs-idempotent distinction interviewers probe.
- [Stripe blog — Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency) — the reasoning and edge cases behind the design.
