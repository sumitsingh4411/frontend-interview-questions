<div align="center">

# Character encoding (UTF-8/Unicode)

<sub>🧱 Fundamentals · 🟢 Easy · ⏱ 30m · `#basics`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Unicode is the *catalog* that maps every character to a number (a code point); UTF-8 is one *encoding* that serializes those numbers into bytes. Confusing "character," "code point," and "byte" is the root of nearly every mojibake bug and every `emoji.length === 2` surprise.

---

## 🧠 Mental model

Three distinct layers, and interviewers listen for whether you keep them separate:

| Layer | What it is | Example for 😀 |
|---|---|---|
| **Character (grapheme)** | What a human perceives as one symbol | one emoji |
| **Code point** | The Unicode number for it: `U+XXXX` | `U+1F600` |
| **Encoding (bytes)** | How that number becomes bytes on disk/wire | UTF-8: `F0 9F 98 80` (4 bytes) |

Unicode assigns a code point to ~150,000 characters across a space of ~1.1 million slots. It says *nothing* about bytes. **UTF-8** is a variable-length encoding of those code points: 1 byte for ASCII (`U+0000–U+007F`), up to 4 bytes for the rest. That ASCII-compatibility is why UTF-8 won — old ASCII files are already valid UTF-8, and English text pays no size penalty.

The trap JavaScript sets: **its strings are UTF-16 internally**, and `.length` counts 16-bit *code units*, not characters and not code points.

## ⚙️ How it actually works

**UTF-8 is self-synchronizing.** The high bits of the first byte announce the sequence length (`0xxxxxxx` = 1 byte, `110xxxxx` = 2, `1110xxxx` = 3, `11110xxx` = 4), and every continuation byte starts `10xxxxxx`. So you can drop into the middle of a stream and find the next character boundary — robust against corruption in a way fixed-width encodings aren't.

**The BMP and surrogate pairs.** Code points `U+0000–U+FFFF` (the Basic Multilingual Plane) fit in one UTF-16 code unit. Everything above — emoji, many CJK extensions, historic scripts — is *astral* and encoded in UTF-16 as **two** code units called a surrogate pair. That's why:

```js
'😀'.length            // 2 — two UTF-16 code units, not one character
'😀'.charAt(0)         // '\uD83D' — a lone high surrogate, garbage on its own
```

**Grapheme ≠ code point either.** A single perceived character can be *several* code points: `é` may be one code point (`U+00E9`) or two (`e` + combining accent `U+0301`) — this is **normalization** (NFC vs NFD). Emoji with skin tones or the family emoji are many code points joined by Zero-Width Joiners (`U+200D`). So there are *three* different "lengths" for one visible symbol.

**Iteration matters.** Old `for` loops and `.split('')` break surrogate pairs. The spread operator and `for...of` iterate by *code point* (they're Unicode-aware). Only `Intl.Segmenter` iterates by *grapheme* (what users call a character).

## 💻 Code

```js
const s = '👨‍👩‍👧'; // family: 7 code points (3 people + 2 ZWJ)... rendered as ONE

s.length;                       // 8  — UTF-16 code units
[...s].length;                  // 5  — code points (spread is code-point-aware)
// graphemes — what a human counts as characters:
[...new Intl.Segmenter().segment(s)].length; // 1

// ❌ Reversing a string naively corrupts astral chars
'😀'.split('').reverse().join(''); // broken — splits the surrogate pair

// ✅ Code-point-aware
[...'😀'].reverse().join('');       // safe

// Code point <-> char
'😀'.codePointAt(0).toString(16);   // "1f600"
String.fromCodePoint(0x1f600);      // "😀"

// Normalization: two different byte sequences, same visible 'é'
'é' === 'é';        // false — looks identical, compares unequal
'é'.normalize('NFC') === 'é'.normalize('NFC'); // true
```

On the wire and in HTML, declare it explicitly:

```html
<meta charset="utf-8"> <!-- must be within first 1024 bytes of the document -->
```

```
Content-Type: text/html; charset=utf-8
```

## ⚖️ Trade-offs

- **UTF-8 is the correct default for the web, period.** It's ASCII-compatible, space-efficient for Latin text, and the WHATWG encoding standard. Only reach for UTF-16 when interoperating with a system that mandates it (some Windows/Java APIs, `.length`-sensitive protocols).
- **UTF-8 costs more bytes for CJK** (3 bytes vs UTF-16's 2). For a document that's almost entirely Chinese, UTF-16 is marginally smaller — but not enough to justify the interop pain; gzip closes most of the gap anyway.
- **Normalization has a cost and a policy dimension:** normalize on input (usernames, search keys, dedup) so `café` matches `café`; but don't blindly normalize user content you must preserve byte-for-byte (passwords, signatures).

## 💣 Gotchas interviewers probe

- **`'😀'.length === 2`** — the canonical question. If you can explain surrogate pairs and UTF-16 code units, you've signaled you understand the stack.
- **Mojibake (`Ã©` instead of `é`)** means bytes were *decoded* with the wrong encoding — almost always UTF-8 bytes read as Latin-1. The fix is declaring `charset=utf-8` consistently at every layer (DB, connection, response header, `<meta>`), not string-replacing.
- **Truncating strings by byte or code unit** splits emoji and combining sequences, producing `�`. Truncate by grapheme with `Intl.Segmenter`.
- **`atob`/`btoa` are Latin-1 only** — they throw on non-ASCII. Base64-encoding UTF-8 needs `TextEncoder` first.
- **A lone surrogate is not valid UTF-8** and will round-trip to `U+FFFD` (�) through some APIs — a subtle data-loss bug.
- **`String.fromCharCode` vs `fromCodePoint`** — the former is UTF-16-unit based and can't build astral chars from a single call; the latter is code-point aware.
- **BOM (`U+FEFF`)** at the start of a UTF-8 file is legal but usually unwanted — it shows up as invisible junk or breaks JSON parsing.

## 🎯 Say this in the interview

> "I keep three layers distinct: Unicode is the catalog mapping characters to code points like `U+1F600`; UTF-8 is one encoding that serializes code points into bytes, variable-length, one byte for ASCII up to four for emoji, and it won the web because it's ASCII-compatible and self-synchronizing. The gotcha in JavaScript is that strings are UTF-16 internally, so `.length` counts 16-bit code units — an emoji is a surrogate pair and reports length 2. Above that there's a third layer: a grapheme, what a user perceives as one character, can be many code points joined by zero-width joiners, like the family emoji. So for anything user-facing — reversing, truncating, counting — I iterate code-point-aware with spread or `for...of`, and grapheme-aware with `Intl.Segmenter`. Most 'weird character' bugs are either mojibake, which is a decode with the wrong charset, or a normalization mismatch between NFC and NFD, which I fix by normalizing on input."

## 🔗 Go deeper

- [MDN — Unicode](https://developer.mozilla.org/en-US/docs/Glossary/Unicode) — the glossary framing of characters, code points, and encodings.
- [MDN — UTF-8](https://developer.mozilla.org/en-US/docs/Glossary/UTF-8) — the byte-level encoding rules and ASCII compatibility.
- [The Absolute Minimum Every Developer Must Know About Unicode (Joel Spolsky)](https://www.joelonsoftware.com/2003/10/08/the-absolute-minimum-every-software-developer-absolutely-positively-must-know-about-unicode-and-character-sets-no-excuses/) — the classic mental model, still correct.
- [MDN — `String.prototype.normalize`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize) — NFC/NFD and why equal-looking strings compare unequal.
- [MDN — `Intl.Segmenter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) — grapheme-correct iteration for counting and truncation.
