<div align="center">

# Rate limiting & retries/backoff

<sub>📡 Networking · 🟡 Medium · ⏱ 45m · `#reliability`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — When a request fails or gets throttled, **retry — but politely**: only retry *retryable* failures, back off **exponentially**, add **jitter** so clients don't resynchronize into a stampede, honour `Retry-After`, and **cap** attempts. A naive `retry 3 times immediately` loop turns a hiccup into a self-inflicted outage.

---

## 🧠 Mental model

Retries exist because networks are unreliable — a request can fail *transiently* (timeout, dropped packet, a server briefly overloaded). Retrying recovers those for free. But retries are also **load amplification**: every client retrying a struggling server adds *more* load to the exact thing that's already failing. The art is retrying enough to mask blips without turning a small problem into a **retry storm** that keeps the server down.

```
❌ Naive:  fail → retry now → fail → retry now → fail …   (all clients in lockstep = DDoS-yourself)
✅ Backoff: fail → wait 1s → fail → wait 2s → fail → wait 4s …  (exponential, capped)
✅ +Jitter: fail → wait rand(0..1s) → wait rand(0..2s) …        (spreads the herd out)
```

Two ideas do the heavy lifting: **exponential backoff** (each retry waits longer, giving the server room to recover) and **jitter** (randomize the wait so a thousand clients that failed at the same instant don't all retry at the same instant).

## ⚙️ How it actually works

**Retry only what's safe and retryable.** A `500`/`502`/`503`/`504`, a network timeout, or a `429` are worth retrying. A `400`/`401`/`403`/`404`/`422` will fail identically forever — retrying them is pure waste. And you must only auto-retry requests that are **idempotent** (GET/PUT/DELETE), or a non-idempotent `POST` might execute *twice* (see idempotency keys).

**Exponential backoff:** delay = `base * 2^attempt`. base 200ms → 200, 400, 800, 1600ms. Always **cap** the delay (`min(cap, base * 2^attempt)`) and the **attempt count** (3–5), or you retry forever.

**Jitter is not optional.** Without it, all clients that failed together retry together — the AWS "exponential backoff and jitter" analysis showed pure exponential backoff still produces synchronized spikes. **Full jitter** — `sleep = random(0, min(cap, base * 2^attempt))` — flattens the load best. This is the single most-cited detail interviewers want.

**Respect the server's instructions.** A `429 Too Many Requests` or `503` often carries **`Retry-After`** (seconds or an HTTP date). Honour it over your own backoff — the server is telling you exactly when to come back. Rate-limit responses also expose `RateLimit-Limit` / `RateLimit-Remaining` / `RateLimit-Reset` so a good client can *pace itself before* getting throttled.

**Rate limiting** (the server side you must design against) is usually **token bucket** (a bucket refills at a steady rate; each request spends a token; bursts allowed up to bucket size) or **sliding window**. Hit empty → `429`.

## 💻 Code

```js
// Production-grade fetch with retry, full jitter, Retry-After, and a cap.
async function fetchRetry(url, opts = {}, { retries = 4, base = 300, cap = 10_000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, opts);
      // Retry only server errors + throttling. 4xx (except 429) is terminal.
      if (res.status === 429 || (res.status >= 500 && res.status !== 501)) {
        if (attempt >= retries) return res;              // give up, surface it
        const ra = res.headers.get('Retry-After');
        await sleep(ra ? retryAfterMs(ra)                // server told us when
                       : jitter(base, cap, attempt));    // else full jitter backoff
        continue;
      }
      return res;                                        // success or terminal 4xx
    } catch (err) {                                       // network error / timeout
      if (attempt >= retries) throw err;
      await sleep(jitter(base, cap, attempt));
    }
  }
}

// Full jitter: sleep a RANDOM amount up to the exponential ceiling.
const jitter = (base, cap, attempt) =>
  Math.random() * Math.min(cap, base * 2 ** attempt);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
```

```js
// Pace yourself PROACTIVELY off RateLimit headers instead of waiting to be 429'd.
const remaining = Number(res.headers.get('RateLimit-Remaining'));
const resetMs = Number(res.headers.get('RateLimit-Reset')) * 1000;
if (remaining < 5) await sleep(resetMs - Date.now()); // slow down before the wall
```

## ⚖️ Trade-offs

- **Retries mask transient failures cheaply — but they hide systemic ones.** If you retry hard enough, a broken dependency looks "slow" instead of "down", delaying alerts. Pair retries with a **circuit breaker**: after N consecutive failures, stop trying for a cooldown so you don't hammer a dead service.
- **Backoff trades latency for stability.** Each retry adds delay the user feels. Keep the *user-facing* retry budget short (fail fast, show a retry button) and reserve long backoff for background/idempotent work.
- **When NOT to retry:** non-idempotent writes without an idempotency key (you may double-charge), and any 4xx that's a client bug — retrying a malformed request just wastes battery and quota.
- **Client vs server responsibility.** The server *enforces* limits (token bucket) to protect itself; the client *cooperates* (backoff, pacing) to stay under them. A well-behaved client barely ever sees a `429`.

## 💣 Gotchas interviewers probe

- **No jitter = synchronized retry storm.** The canonical mistake. A thousand clients fail at once, all back off `1s, 2s, 4s` in lockstep, and hammer the server in perfectly-timed waves. Full jitter is the fix; if you can only say one thing, say "jitter".
- **Retrying non-idempotent POSTs.** A timeout doesn't mean the write *didn't* happen — the response may have been lost after the server committed. Blind retry = duplicate order. Needs an **idempotency key**.
- **Retrying 4xx.** `400`/`401`/`422` will never succeed on retry. Retrying them wastes quota and, for `401`, can lock the account. Retry `429` and `5xx` (mostly) only.
- **Ignoring `Retry-After`.** The server explicitly says "come back in 30s" and the client backs off `1s` anyway, guaranteeing another `429`. Always prefer `Retry-After`.
- **Unbounded retries / no cap.** A retry loop with no max attempts and no delay cap can spin forever and drain a mobile battery. Cap both.
- **Retry amplification across layers.** If the browser retries, and the API gateway retries, and the service retries, one user click becomes 27 backend calls. Retry at **one** layer, ideally the outermost.

## 🎯 Say this in the interview

> "My rule is retry, but politely. First, only retry retryable failures — 5xx, timeouts, and 429 — never a 4xx that'll fail identically forever, and never a non-idempotent POST unless it carries an idempotency key, because a timeout doesn't tell me whether the write actually landed. Then I back off exponentially so the server gets room to recover, and critically I add full jitter — a random delay up to the exponential ceiling — because without it every client that failed at the same instant retries at the same instant and you get synchronized waves that keep the service down. That's straight out of the AWS backoff-and-jitter work. I honour `Retry-After` when the server sends it, cap both the delay and the attempt count, and pair retries with a circuit breaker so I stop hammering a dependency that's clearly dead. On the flip side, servers rate-limit with a token bucket and return 429, and a good client paces itself off the `RateLimit-Remaining` headers before it ever hits the wall."

## 🔗 Go deeper

- [AWS — Exponential backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/) — the definitive analysis showing why jitter matters, with the math.
- [MDN — `Retry-After`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) — how servers tell clients exactly when to retry.
- [MDN — `429 Too Many Requests`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429) — the throttling status and its headers.
- [Google SRE — Handling overload](https://sre.google/sre-book/handling-overload/) — retries, retry budgets, and circuit breaking at scale.
