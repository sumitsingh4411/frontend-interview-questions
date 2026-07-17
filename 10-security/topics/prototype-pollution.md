<div align="center">

# Prototype pollution

<sub>🔒 Security · 🔴 Hard · ⏱ 45m · `#injection` `#advanced`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Prototype pollution is JavaScript-specific injection: attacker-controlled keys like `__proto__` reach a recursive merge or `path`-set, writing onto `Object.prototype` so that **every object in the program inherits an attacker-chosen property** — a gadget that escalates to XSS, auth bypass, or RCE.

---

## 🧠 Mental model

JavaScript objects inherit from a shared prototype. If an attacker can write to `Object.prototype`, they've written to the *default value* of a property on **every object that doesn't override it**. Nothing is "hacked" in the classic sense — instead you've poisoned the global fallback. Later, innocent code reads `config.isAdmin`, finds it missing on the object, and inherits the attacker's planted `true` from the prototype.

The mental model: **prototype pollution is a two-stage attack.** Stage one *plants* the polluted property (the injection). Stage two is a **gadget** — some existing code path that reads that property and does something dangerous with it. Pollution alone is inert; it's the gadget that turns "an object has a weird key" into XSS or privilege escalation. That's why it's ranked hard: you have to see both halves.

## ⚙️ How it actually works

The dangerous keys are `__proto__`, `constructor`, and `prototype`. Pollution happens when user-controlled *keys* (not just values) flow into an operation that walks or sets nested paths:

```js
// A naive deep merge — the classic sink
function merge(target, source) {
  for (const key in source) {
    if (typeof source[key] === "object") {
      merge(target[key] ??= {}, source[key]); // recurses into key === "__proto__"
    } else {
      target[key] = source[key];             // target["__proto__"]["x"] = ...
    }
  }
}
merge({}, JSON.parse('{"__proto__": {"isAdmin": true}}'));
({}).isAdmin; // → true   ← every object now inherits it
```

`JSON.parse` will happily produce a `__proto__` key (it's a normal string key in the parsed object), and `for..in`/bracket assignment then treats it as the live prototype accessor. The usual sources: JSON request bodies, query-string parsers that expand `a[__proto__][x]=1`, deep-merge/`set`/`defaultsDeep` utilities (historic CVEs in lodash, jQuery `$.extend`, minimist, etc.).

**Gadgets** turn the plant into impact:
- A template engine reads a polluted option → **XSS / RCE**.
- Server code reads `req.body.__proto__`-planted `isAdmin` on a plain object → **auth bypass**.
- Node reads a polluted `NODE_OPTIONS`/child-process option → **RCE**.

## 💻 Code

```js
// ❌ Vulnerable: user keys reach nested assignment
set(obj, userPath, userValue); // userPath = "__proto__.polluted"

// ✅ Defense 1 — reject/skip the dangerous keys explicitly
function safeMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
    // ...merge safely
  }
}

// ✅ Defense 2 — prototype-less objects have no __proto__ to hijack
const map = Object.create(null);        // {} with no prototype chain
map.__proto__;                          // undefined — nothing to pollute

// ✅ Defense 3 — freeze the prototype so writes throw (in strict mode)
Object.freeze(Object.prototype);

// ✅ Defense 4 — validate the shape; a schema rejects unexpected keys
const data = Schema.parse(req.body);    // zod/ajv strips __proto__

// ✅ Defense 5 — use Map for arbitrary/user-controlled keys
const store = new Map(); store.set(userKey, val); // keys never touch prototypes
```

## ⚖️ Trade-offs

- **`Object.freeze(Object.prototype)` is a blunt global.** It stops most pollution cheaply, but any library that legitimately augments the prototype (rare, but polyfills do) will break. Great for app code, risky as a blanket in a library you ship.
- **`Object.create(null)` maps are the cleanest structural fix** for config/lookup objects, but they lose `hasOwnProperty`, `toString`, and don't play nicely with code that assumes a normal object — you trade ergonomics for safety.
- **Schema validation catches it at the edge** and is the most maintainable defense, but only if the schema *strips unknown keys* (`ajv: {additionalProperties: false}`, zod `.strict()`) — a permissive schema lets `__proto__` through.
- **Node ≥ some versions and modern parsers block `__proto__`** in `JSON.parse`-adjacent paths, but relying on runtime defaults is fragile across versions and libraries.

## 💣 Gotchas interviewers probe

- **"Pollution alone isn't the exploit."** The senior answer names the **gadget** — the second-stage code that reads the polluted property. Without a gadget it's a latent bug, not an incident.
- **`JSON.parse` doesn't protect you.** It creates a `__proto__` *key*; it's the *subsequent merge/set* that activates it. Candidates often think parsing is the sink — it's the recursive assignment.
- **`constructor.prototype` is the sneaky path.** Blocking only `__proto__` misses `constructor` → `prototype` → `Object.prototype`. Block all three keys.
- **It's not just Node.** Client-side pollution reaches DOM/template gadgets and can become **DOM XSS** — jQuery and many bundlers had real CVEs.
- **Query-string and form parsers are silent sources.** `a[__proto__][x]=1` in a URL, expanded by `qs`/`querystring`, pollutes without any JSON at all.
- **`Map`/`Set` sidestep the whole class** because their keys never interact with the prototype chain — the right tool for user-supplied keys.

## 🎯 Say this in the interview

> "Prototype pollution is JavaScript-specific injection: an attacker gets a key like `__proto__` or `constructor.prototype` into a recursive merge or a `path`-set, and writes onto `Object.prototype`, so every object in the app inherits their planted property. The nuance I'd stress is that it's a two-stage attack — planting the property is inert until some existing gadget reads it, like a template engine that turns it into XSS or auth code that reads a polluted `isAdmin`. My defenses are layered: validate request bodies against a strict schema that strips unknown keys, use `Object.create(null)` or a `Map` for anything with user-controlled keys, block `__proto__`/`constructor`/`prototype` in any merge utility, and as a global backstop freeze `Object.prototype`. And I'd audit dependencies, since most real incidents came from a popular deep-merge library."

## 🔗 Go deeper

- [Snyk — Prototype Pollution](https://learn.snyk.io/lesson/prototype-pollution/) — the mechanism and real CVE gadgets, with a hands-on lesson.
- [PortSwigger — Prototype pollution](https://portswigger.net/web-security/prototype-pollution) — client and server variants, gadget discovery, labs.
- [OWASP — Prototype Pollution Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html) — the defensive patterns in one place.
