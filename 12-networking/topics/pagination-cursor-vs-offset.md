<div align="center">

# Pagination (cursor vs offset)

<sub>📡 Networking · 🟡 Medium · ⏱ 45m · `#api` `#large-data`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Offset pagination (`?page=3`) is easy and lets you jump to any page, but it's **slow at depth** and **skips/duplicates rows** when the data shifts under you. Cursor pagination (`?after=<opaque_token>`) is stable and O(1)-fast at any depth, at the cost of no random page access. For infinite scroll on live data, cursors are the correct answer — full stop.

---

## 🧠 Mental model

Both answer "give me the next slice", but they *point into the list* differently:

- **Offset** says **"skip N, take M"** — an absolute *position*. `LIMIT 20 OFFSET 40` = page 3. Positions are relative to the *current* ordering, so if the list changes, positions move.
- **Cursor** (a.k.a. keyset) says **"start after this specific item"** — a *pointer* to a stable value. `WHERE id < 8423 ORDER BY id DESC LIMIT 20`. The pointer references a *row*, not a *slot*, so inserts and deletes elsewhere don't disturb it.

```
Offset:  [ · · · · · · · · · · ]   "skip 40, take 20"  ← counts from the start every time
Cursor:  [ · · · · ·│next 20···]   "after id=8423"     ← jumps straight to the boundary
```

The whole difference: an offset is a **position in a list that can shift**; a cursor is a **reference to a row that stays put.**

## ⚙️ How it actually works

**Why offset is slow at depth.** `OFFSET 100000 LIMIT 20` forces the database to *generate and discard* the first 100,000 rows before returning 20. The cost grows linearly with the offset — deep pages get progressively slower. The database can't skip work it hasn't ordered.

**Why cursor is fast at any depth.** `WHERE id < 8423 ORDER BY id DESC LIMIT 20` seeks directly to the boundary using the **index** on `id`, then reads 20 rows. Page 1 and page 50,000 cost the *same* — it never scans-and-throws. This is why every large-scale feed (Twitter/X, Slack, Stripe, GitHub) uses cursors.

**The correctness bug offset has and cursor doesn't.** Suppose you're viewing page 1 (newest 20) and a new item is inserted at the top. Now `OFFSET 20` for page 2 returns an item you *already saw* on page 1 — everything shifted down by one, so you get **duplicates**. Deletions cause the mirror bug: rows get **skipped**. On any actively-changing list, offset pagination shows wrong data. Cursors anchor to a row's value, so a top-insert doesn't shift the boundary — no dupes, no skips.

**What a cursor actually is.** An opaque token — typically the last row's sort key(s), base64-encoded so clients treat it as a black box: `base64({ id: 8423, created_at: "..." })`. If you sort by a non-unique column (like `created_at`), the cursor must include a **tiebreaker** (usually the primary key) or rows sharing a timestamp get skipped at the page boundary. This is the subtle bug that separates people who've *used* cursors from those who've only read about them.

**The cost:** cursors can only go **next/prev from a known point** — you can't jump to "page 47" because there's no absolute position, and you can't show "page 3 of 200" without a separate count query.

## 💻 Code

```sql
-- ❌ OFFSET: re-scans and discards OFFSET rows every time. Page 5000 is painfully slow,
--    and a concurrent insert shifts every subsequent page → duplicates.
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 100000;

-- ✅ CURSOR (keyset): seeks via index, same speed at any depth, stable under writes.
--    Tiebreak on id because created_at is not unique — WITHOUT this, rows sharing a
--    timestamp at the page boundary get skipped.
SELECT * FROM posts
WHERE (created_at, id) < ('2026-07-01T10:00:00Z', 8423)  -- the decoded cursor
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

```js
// API response: hand back an OPAQUE next-cursor; the client never parses it.
{
  "data": [ /* 20 posts */ ],
  "page_info": {
    "end_cursor": "eyJjcmVhdGVkX2F0IjoiMjAyNi0wNy0wMSIsImlkIjo4NDIzfQ==",
    "has_next_page": true   // fetch LIMIT+1 and check for the extra row
  }
}

// Client just echoes the token back — no page numbers, no arithmetic.
fetch(`/api/posts?after=${encodeURIComponent(endCursor)}&limit=20`);
```

## ⚖️ Trade-offs

- **Use offset for:** small, bounded, mostly-static datasets where users genuinely need to jump to an arbitrary page (an admin table, search results with page numbers). It's simpler and supports "page X of Y".
- **Use cursor for:** infinite scroll, feeds, real-time or high-write data, and anything deep or large. It's stable and fast; it's the default for scale.
- **Cursor's price:** no random access ("go to page 47"), harder to show a total/last page (needs a separate `COUNT`, which is itself expensive), and prev-page needs a reversed query. Bidirectional cursors add complexity.
- **Offset's hidden price:** deep pages hammer the DB, and any concurrent write corrupts the sequence — a subtle bug that only shows under real traffic, which is why it survives in demos and dies in production.

## 💣 Gotchas interviewers probe

- **The skip/duplicate bug.** Explaining *why* offset shows dupes on insert and skips on delete (positions shift, cursors don't) is the senior signal. "Offset is slower" alone is the junior answer.
- **Non-unique sort column needs a tiebreaker.** Sorting by `created_at` alone and cursoring on it silently drops rows that share a timestamp at the boundary. Always include the primary key.
- **`OFFSET` cost is O(offset), not O(1).** The DB materialises and discards the skipped rows; it doesn't magically seek.
- **Cursors should be opaque.** Encode them so clients can't build their own — that keeps the sort key an implementation detail you can change later.
- **`has_next_page` cheaply:** fetch `LIMIT + 1` and check whether the extra row came back, instead of a separate count.
- **Total counts are expensive at scale** — cursor APIs often deliberately omit "X of Y" because counting the whole set defeats the point.

## 🎯 Say this in the interview

> "Offset pagination skips N and takes M — it's simple and supports jumping to any page, but it has two problems at scale. It's O(offset): the database generates and discards every skipped row, so deep pages get slow. And it's unstable — if a row is inserted while you're paging, every later page shifts and you get duplicates; a deletion makes you skip rows. Cursor pagination fixes both: instead of a position, you pass an opaque token pointing at the last row's sort key, and the query seeks straight to that boundary via the index — `WHERE (created_at, id) < (...)` — so it's the same speed at any depth and stable under concurrent writes. The subtle detail is the tiebreaker: if you sort by a non-unique column like `created_at`, the cursor must also include the primary key, or rows sharing a timestamp get dropped at the page boundary. The price is no random page access and expensive total counts, so I use offset for small admin tables and cursors for anything that's a feed, infinite scroll, or large."

## 🔗 Go deeper

- [Slack — Evolving API pagination at Slack](https://slack.engineering/evolving-api-pagination-at-slack/) — a real migration from offset to cursor and why.
- [Stripe API — Pagination](https://docs.stripe.com/api/pagination) — a canonical cursor API (`starting_after`/`ending_before`).
- [Use The Index, Luke — Paging through results](https://use-the-index-luke.com/no-offset) — the definitive explanation of why keyset beats offset.
- [Relay — GraphQL cursor connections spec](https://relay.dev/graphql/connections.htm) — the standardised cursor pagination shape (`edges`, `pageInfo`).
