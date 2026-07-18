<div align="center">

# Regular expressions

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 1h · `#regex`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A regex is a tiny **backtracking state machine** that walks a string trying to match a pattern. Ninety percent of interview regex is knowing the flags, the difference between `test`/`exec`/`match`/`matchAll`, and that a badly-nested quantifier can hang your main thread for seconds (**catastrophic backtracking**).

---

## 🧠 Mental model

A regex isn't magic pattern soup — it's a program the engine *executes character by character*. JS uses a **backtracking** engine: when a quantifier like `.*` grabs too much, the engine walks *backwards*, giving characters back one at a time until the rest of the pattern matches. That backtracking is both the source of regex's power and its worst failure mode.

Two ideas unlock most of it:

1. **Quantifiers are greedy by default** (`.*` takes as much as possible, then backtracks). Add `?` to make them **lazy** (`.*?` takes as little as possible). Choosing the wrong one is the most common "why does my regex match too much" bug.
2. **The `g` flag makes a regex stateful.** A `/g` regex carries a mutable `lastIndex`, so calling `.test()` on the *same regex object* twice gives *different answers*. This surprises everyone once.

## ⚙️ How it actually works

**The flags that actually matter:**

| Flag | Effect |
|---|---|
| `g` | global — find all matches; enables `lastIndex` statefulness |
| `i` | case-insensitive |
| `m` | multiline — `^`/`$` match line boundaries, not just string ends |
| `s` | dotAll — `.` matches newlines too |
| `u` | unicode — correct handling of astral chars (emoji) & `\p{...}` |
| `d` | indices — adds `.indices` with match start/end offsets |

**Pick the right method — candidates constantly reach for the wrong one:**

- `regex.test(str)` → boolean. Fast. But with `/g` it mutates `lastIndex` — don't reuse the object in a loop condition.
- `str.match(re)` → without `/g`, one match *with capture groups*; with `/g`, an array of full matches and **no groups**. That asymmetry trips people up.
- `str.matchAll(re)` → an iterator of full match objects *including groups and index* — the modern, correct way to get all matches with their captures. Requires `/g`.
- `regex.exec(str)` → call repeatedly to walk matches one at a time (uses `lastIndex`). `matchAll` is the cleaner replacement.
- `str.replace` / `str.replaceAll` → `replaceAll` requires a `/g` regex (or a string) and throws otherwise.

**Named groups & lookarounds** are the senior-level toolkit: `(?<year>\d{4})` names a capture (`m.groups.year`); `(?=...)` / `(?<=...)` are lookahead/lookbehind — zero-width assertions that check context *without consuming* characters.

## 💻 Code

```js
// ❌ Stateful-regex trap: a /g regex remembers lastIndex between calls.
const re = /\d+/g;
re.test('a1');   // true,  lastIndex now 2
re.test('a1');   // false! resumes from index 2 → skips the match
// Fix: don't reuse a /g regex with test(). Drop the g, or make a fresh regex.

// ✅ Getting every match WITH capture groups: matchAll (not match).
const log = '2024-01 ok; 2024-02 fail';
for (const m of log.matchAll(/(?<year>\d{4})-(?<month>\d{2})/g)) {
  console.log(m.groups.year, m.groups.month, 'at', m.index);
}

// ✅ replace with a function + named groups
'2024-01-15'.replace(
  /(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/,
  (_match, _y, _m, _d, _off, _str, groups) => `${groups.d}/${groups.m}/${groups.y}`
); // "15/01/2024"

// ✅ Unicode: without /u, emoji are two code units and \w/. behave wrongly.
'café ☕'.match(/\p{Letter}+/gu); // ['café'] — needs the u flag for \p{...}
```

```js
// 💣 Catastrophic backtracking — this can hang the tab for SECONDS.
/^(a+)+$/.test('aaaaaaaaaaaaaaaaaaaaaaaa!'); // exponential; the trailing '!' forces
// the engine to try every way to split the a's before failing. This is a ReDoS.
```

## ⚖️ Trade-offs

- **Regex is the right tool for *lexical* patterns** — validation, tokenising, find-and-replace on flat text. It's the **wrong** tool for anything recursive or nested: HTML, JSON, balanced brackets. "Parse HTML with a regex" is a known trap answer; use a parser.
- **Readability is a real cost.** A clever one-liner regex is write-only code. Prefer named groups, the `x`/verbose approach (comments), or splitting into smaller steps. A colleague should be able to read it.
- **When NOT to hand-roll:** email, URLs, phone numbers — the "correct" regex is monstrous and still wrong at the edges. Use a validated library or the platform (`<input type="email">`, `URL`) instead of a regex you found on Stack Overflow.

## 💣 Gotchas interviewers probe

- **The `/g` + `test()`/`exec()` statefulness bug.** `lastIndex` persists on the regex *object*. Reusing it gives alternating results. The single most common regex bug — know it cold.
- **`match` drops capture groups when `/g` is set.** If you need groups *and* all matches, it's `matchAll`, not `match`.
- **Catastrophic backtracking / ReDoS.** Nested quantifiers over overlapping alternations (`(a+)+`, `(.*)*`) go exponential. On user input this is a denial-of-service. Fix by avoiding nested quantifiers, anchoring, or using atomic-ish patterns.
- **`.` doesn't match newlines** unless you pass the `s` flag — a frequent "why doesn't it match" mystery.
- **`^`/`$` are string boundaries** unless you add `m`. People expect per-line behaviour by default.
- **Unicode.** Without `u`, `.` and `\w` operate on UTF-16 code *units*, so an emoji is "two characters" and `\w` misses accented letters. `\p{...}` classes require `u`.
- **Escaping user input.** Interpolating a raw string into a `RegExp` is an injection risk (and can break syntactically). Escape it, or better, use `String.includes`/`replaceAll` for literal matching.

## 🎯 Say this in the interview

> "I think of a regex as a backtracking state machine that walks the string. The things I'm precise about: the `g` flag makes the regex *stateful* via `lastIndex`, so reusing a `/g` regex with `.test()` in a loop gives alternating results — that's the classic bug. To get every match *with* capture groups I use `matchAll`, because `match` drops groups once `/g` is set. I lean on named groups and lookarounds for readability, and I always add the `u` flag when Unicode or emoji are in play, otherwise `.` and `\w` work on UTF-16 code units. The failure mode I actively watch for is catastrophic backtracking — nested quantifiers like `(a+)+` go exponential and on user input that's a ReDoS denial-of-service. And I won't parse nested structures like HTML with a regex; that's a parser's job."

## 🔗 Go deeper

- [javascript.info — Regular expressions](https://javascript.info/regular-expressions) — the best structured tour, from basics through lookbehind and Unicode.
- [MDN — Regular expressions guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions) — flags, methods, and the syntax reference.
- [regex101.com](https://regex101.com/) — live tester with a step-by-step debugger that *shows* the backtracking.
- [OWASP — Regular expression DoS](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS) — how catastrophic backtracking becomes a security bug.
