<div align="center">

# Injection & input validation

<sub>🔒 Security · 🟡 Medium · ⏱ 45m · `#injection`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Injection happens whenever untrusted data is **concatenated into a language** — SQL, HTML, a shell command, a URL — and the interpreter parses attacker data as *syntax*. Input validation reduces the attack surface, but the real fix is **structural separation** (parameterisation), not filtering.

---

## 🧠 Mental model

Every injection bug is the same bug in a different language: **data crosses into a code/command context and gets parsed as instructions.** SQL injection, XSS (HTML injection), command injection, LDAP injection, header/CRLF injection, template injection — one root cause, many interpreters.

The mistake juniors make is thinking the defense is "clean the input." It isn't. **Validation is a filter on the way in; the actual fix is keeping data and code in separate lanes on the way out.** A parameterised query tells the database "this is *data*, never treat it as SQL" — no amount of quotes in the value can escape that. Validation is defense in depth; **parameterisation is the boundary.**

Reframed: injection is an *output* problem wearing an *input* disguise. You don't secure the door by inspecting everyone who enters — you secure it by making sure data never reaches a place where it can be executed.

## ⚙️ How it actually works

The two orthogonal controls, and why you need both:

**1. Structural separation (the real defense).** Give the interpreter data through a channel that can't be re-parsed as syntax:
- SQL → **parameterised queries / prepared statements**
- HTML → **contextual output encoding** (or `textContent`)
- Shell → **`execFile` with an args array**, never string concatenation into `exec`
- Templates → never `eval`/dynamic template compilation on user input

**2. Input validation (reduce surface, catch nonsense).** Validate against an **allow-list** — assert what the value *is* (a shape, a type, a range), don't hunt for what's bad:

```
allow-list:  "is this a valid UUID / e.164 phone / 1–5 int?" → accept/reject
block-list:  "does it contain '; or DROP or <script>?"       → always bypassable
```

Allow-list validation wins because you can fully enumerate *valid* input; you can never fully enumerate *invalid* input. And validation is **syntactic** — it can't know the semantic context the value will end up in, which is why it can't replace output encoding.

The frontend twist: **client-side validation is UX, not security.** It gives instant feedback and cuts round-trips, but anyone can bypass it with `curl`. The server must revalidate everything. "The dropdown only had three options" is not a security control.

## 💻 Code

```js
// ❌ SQL injection: value concatenated into the query as syntax
db.query(`SELECT * FROM users WHERE email = '${email}'`);
//   email = "' OR '1'='1"  → returns every row

// ✅ Parameterised: driver sends query and data on separate channels
db.query("SELECT * FROM users WHERE email = $1", [email]);
```

```js
// ❌ Command injection: user string interpolated into a shell
exec(`convert ${filename} out.png`); // filename = "x.png; rm -rf /"

// ✅ No shell parsing; args passed as a discrete array
execFile("convert", [filename, "out.png"]);
```

```ts
// ✅ Allow-list validation with a schema — assert the SHAPE, reject the rest.
//    Runs on the server; the client copy is for UX only.
import { z } from "zod";
const Input = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(120),
  role: z.enum(["user", "admin"]), // enumerated — nothing else is valid
});
const data = Input.parse(req.body); // throws on anything off-shape
```

## ⚖️ Trade-offs

- **Validation doesn't replace encoding/parameterisation.** A "valid" name like `Robert'); DROP TABLE--` passes a name-length check and still injects if you concatenate it. Validate *and* separate — they defend different layers.
- **Allow-list can be too strict.** Real names have apostrophes, unicode, spaces; over-tight regex rejects legitimate users (the "O'Brien" and "李" problem). Validate *structure/type*, not an imagined character set, then rely on parameterisation for safety.
- **Client-side validation is not a boundary — but skip it and UX suffers.** Do both: instant client feedback, authoritative server enforcement. Never one without the other.
- **Canonicalise before validating.** Decode unicode/URL/encoding *first*, or a validator sees `%3Cscript%3E` and waves it through.

## 💣 Gotchas interviewers probe

- **"How do you prevent SQL injection?"** The wrong answer is "escape quotes / sanitise input." The right answer is **parameterised queries** — separation, not filtering. This is a hard signal.
- **Client validation is bypassable** with any HTTP client. If a candidate treats it as a security control, that's a fail. It's UX; the server is the boundary.
- **Block-lists lose.** Encodings, unicode homoglyphs, case, and nesting defeat "reject bad strings." Allow-list only.
- **Validate on output context too.** The same value is safe in SQL (parameterised), unsafe in HTML (needs encoding), unsafe in a shell (needs arg separation). One validation pass can't cover all sinks.
- **ORMs are not automatically safe.** Raw-query escape hatches (`.raw()`, `$queryRawUnsafe`) reintroduce concatenation. The ORM protects you only while you stay on the parameterised path.
- **Mass assignment.** Blindly spreading `req.body` into a model lets an attacker set `isAdmin: true`. Allow-list the *fields* you accept, not just their values.

## 🎯 Say this in the interview

> "Every injection bug is the same shape — untrusted data concatenated into a language and parsed as syntax, whether that's SQL, HTML, or a shell command. So I don't think of the fix as cleaning input; I think of it as keeping data and code in separate lanes. For SQL that's parameterised queries, for HTML it's contextual output encoding, for shell it's passing an args array instead of building a command string. Input validation sits on top of that as defense in depth: I allow-list the shape and type of what I accept, because I can enumerate what's valid but never everything that's malicious. And I treat client-side validation as pure UX — instant feedback, but the server revalidates everything, because anyone can bypass the browser with curl."

## 🔗 Go deeper

- [OWASP — Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) — allow-list validation and canonicalisation, done right.
- [OWASP — SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) — parameterisation as the primary defense.
- [OWASP — Injection](https://owasp.org/Top10/A03_2021-Injection/) — the unifying category and its variants.
