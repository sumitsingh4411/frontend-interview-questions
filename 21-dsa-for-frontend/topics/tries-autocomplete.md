<div align="center">

# Tries (autocomplete!)

<sub>🧠 DSA for Frontend · 🔴 Hard · ⏱ 1h · `#trie` `#search`</sub>

<a href="../README.md">⬅ DSA for Frontend</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A trie is a tree keyed by **character position**, so shared prefixes share nodes. Lookup and insert are **O(L)** in the word length — *independent of how many words you've stored* — which is exactly why it's the classic structure behind **autocomplete** and prefix search.

---

## 🧠 Mental model

A trie ("try", from re**trie**val) turns a set of strings into a tree where **each edge is a character** and each path from the root spells a prefix. Words with common prefixes literally share the same nodes.

```
insert: "car", "card", "cat"

        (root)
          │c
        (c)
          │a
        (a)
        ╱   ╲
      r│     │t
     (r)★   (t)★        ★ = end-of-word marker
       │d
     (d)★
```

The unlock: **a trie indexes by prefix, not by whole key.** A hashmap can answer "is `'card'` in the set?" in O(1), but it *cannot* answer "give me every word starting with `'car'`" without scanning all keys. The trie's whole reason to exist is that prefix query — it walks straight to the `car` node and everything beneath it is an answer.

## ⚙️ How it actually works

**Each node holds a `children` map (char → node) and an `isEnd` flag.** Insert walks/creates one node per character. The `isEnd` flag is essential and easy to forget — without it you can't tell that `car` is a stored word when `card` also exists on the same path.

**Complexity — and why it's the selling point:**

| Operation | Trie | HashSet |
|---|---|---|
| Insert word | O(L) | O(L) to hash |
| Exact lookup | O(L) | O(L) to hash, O(1) avg buckets |
| **Prefix query** ("starts with car") | **O(L + k)** | O(N·L) — scan everything |
| Autocomplete (all with prefix) | O(L + size of subtree) | impossible without full scan |

`L` = word length, `k` = matches, `N` = total words. The killer property: **exact lookup is O(L) regardless of N** — a trie with a million words is no slower to query than one with ten, because you only ever walk the length of the query. Hashmaps also don't scale query time with N, but they *cannot* do the prefix walk at all.

**Autocomplete = "walk to the prefix node, then DFS the subtree collecting `isEnd` words."** Rank the collected suggestions by frequency/recency (store a count on each end node) and return the top few. That's a production autocomplete in ~40 lines.

**The cost is memory.** A naive trie allocates a node (and a children map) per character — enormous overhead versus storing raw strings. This is why real large-scale systems compress it: a **radix tree / Patricia trie** merges chains of single-child nodes into one edge labelled with a substring, cutting node count dramatically. Say "I'd use a radix tree if memory mattered" and you've shown you know the trie's weakness.

## 💻 Code

A trie with insert, search, and prefix-powered autocomplete:

```js
class TrieNode {
  children = new Map();   // char → TrieNode
  isEnd = false;          // is a complete word stored ending here?
}

class Trie {
  root = new TrieNode();

  insert(word) {
    let node = this.root;
    for (const ch of word) {                       // O(L)
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch);
    }
    node.isEnd = true;                             // mark the word's end
  }

  // Walk to the node for a prefix (or null if the path breaks).
  #nodeFor(prefix) {
    let node = this.root;
    for (const ch of prefix) {
      if (!node.children.has(ch)) return null;
      node = node.children.get(ch);
    }
    return node;
  }

  search(word) {
    const node = this.#nodeFor(word);
    return !!node && node.isEnd;                   // exact word, not just prefix
  }

  startsWith(prefix) { return this.#nodeFor(prefix) !== null; }

  // Autocomplete: DFS the subtree under the prefix, collecting whole words.
  complete(prefix, limit = 10) {
    const start = this.#nodeFor(prefix);
    if (!start) return [];
    const out = [];
    const dfs = (node, path) => {
      if (out.length >= limit) return;
      if (node.isEnd) out.push(path);
      for (const [ch, child] of node.children) dfs(child, path + ch);
    };
    dfs(start, prefix);
    return out;
  }
}
```

## ⚖️ Trade-offs

- **A trie is only worth it for prefix queries.** For pure membership ("is this word in the set?") a `Set` is simpler, faster in constants, and far lighter. Reach for a trie *only* when "starts-with" or "all with this prefix" is a real requirement.
- **Memory is the real cost** — one node per character with a map each. For big dictionaries, compress to a radix/Patricia tree or a DAWG (which also shares *suffixes*). Don't ship a naive trie for a 500k-word dictionary without knowing this.
- **On the frontend, you often don't need a client-side trie at all.** Autocomplete is usually a debounced request to a server (which may run the trie, or Elasticsearch). Building the trie in-browser is right only for a small, static, offline suggestion set — otherwise you're shipping a dictionary to every user.

## 💣 Gotchas interviewers probe

- **The `isEnd` flag.** Without it you can't distinguish a stored word from a mere prefix — `search('car')` must be false if you only inserted `'card'`. Forgetting this is the #1 trie bug.
- **`search` vs `startsWith`.** `search` requires `isEnd` at the terminal node; `startsWith` only requires the path to exist. Conflating them fails the test.
- **"Why not a hashmap?"** The answer is *prefix queries* — a hashmap can't enumerate keys by prefix without scanning all of them. If you can't articulate that, you don't know why the trie exists.
- **Memory blowup.** Interviewers probe whether you know a naive trie is memory-hungry and that radix/Patricia compression exists.
- **Ranking suggestions.** Real autocomplete returns the *best* matches, not the first found — store frequency/recency on end nodes and sort. "Return top-k by popularity" is the follow-up.
- **Unicode.** Iterating with `for..of` (code points) vs indexing (UTF-16 units) matters for non-ASCII — a trie over emoji or accented text needs code-point keys.

## 🎯 Say this in the interview

> "A trie is a tree keyed by character position, so shared prefixes share nodes, and the win is that lookup and insert are O(L) in the word length regardless of how many words I've stored. That's why it's the autocomplete structure: I walk to the node for the typed prefix, then DFS the subtree collecting every node flagged as a complete word — a hashmap can't do that prefix enumeration without scanning all its keys. The detail that trips people is the end-of-word flag: `search('car')` has to be false if I only inserted 'card', even though the path exists, so `search` checks `isEnd` while `startsWith` only checks the path. The honest caveat is memory — a naive trie is one node per character, so at real dictionary scale I'd compress to a radix tree. And on the frontend, autocomplete is usually a debounced server call; I'd only build a client-side trie for a small offline suggestion set."

## 🔗 Go deeper

- [NeetCode — practice (Tries)](https://neetcode.io/practice) — implement trie, add-and-search with wildcards, word-search II.
- [Wikipedia — Trie](https://en.wikipedia.org/wiki/Trie) — the structure, complexity, and the radix/Patricia compression that fixes the memory cost.
- [MDN — Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) — the right backing store for `children` (any-key, no prototype traps).
