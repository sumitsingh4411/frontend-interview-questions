<div align="center">

# Trusted Types

<sub>🔒 Security · 🔴 Hard · ⏱ 45m · `#xss` `#modern`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Trusted Types is a browser-enforced policy that makes the dangerous DOM sinks (`innerHTML`, `script.src`, `eval`…) **refuse plain strings** and only accept typed objects minted by a policy you audit — converting DOM-XSS from "find every sink in a million lines" to "review a handful of policies."

---

## 🧠 Mental model

DOM-XSS happens when attacker-controlled data flows into a **sink** — `element.innerHTML = userData`, `location = userData`, `new Function(userData)`. The traditional defense is to sanitize at every sink, but there are dozens of sinks and thousands of call sites; you only need to miss one. Trusted Types inverts the problem: instead of auditing every *sink*, you make the browser reject raw strings at *all* sinks by default, and funnel the few legitimate cases through **named policies** you write and review.

The mental shift: **XSS review stops being "grep for innerHTML" and becomes "audit the 2–3 policies that are allowed to create HTML."** It's a chokepoint. If your policy is safe, and no code can bypass it, the whole class of DOM-XSS is structurally prevented — not patched sink by sink.

## ⚙️ How it actually works

You enable it via a **CSP header**, not JS:

```
Content-Security-Policy: require-trusted-types-for 'script';
                         trusted-types default myPolicy;
```

Once `require-trusted-types-for 'script'` is set, every injection sink (`innerHTML`, `outerHTML`, `insertAdjacentHTML`, `<script>.src/text`, `iframe.srcdoc`, `eval`, `setTimeout(string)`, etc.) throws a `TypeError` when handed a **string**. It will only accept a `TrustedHTML`, `TrustedScript`, or `TrustedScriptURL` object.

You create those objects **only** through a policy:

```js
const policy = trustedTypes.createPolicy('myPolicy', {
  createHTML: (input) => DOMPurify.sanitize(input), // ← your sanitizer lives HERE
  createScriptURL: (url) => {
    if (new URL(url).origin !== location.origin) throw new Error('blocked');
    return url;
  },
});
```

The critical properties:

- **The policy functions are the *only* place a string becomes trusted.** They are your single audit surface. Put your sanitizer (DOMPurify) inside `createHTML` and every `innerHTML` in the app is now sanitized by construction.
- **`trusted-types` in the CSP allow-lists which *policy names* may be created.** `trusted-types 'none'` blocks policy creation entirely; naming policies prevents attacker code from calling `createPolicy('anything')` to mint trusted values.
- **The `default` policy** is a fallback: if a string reaches a sink without being explicitly wrapped, the browser routes it through the `default` policy's `createHTML`. This lets you retrofit a large app gradually — but a permissive default policy defeats the point.
- **Report-only mode** (`Content-Security-Policy-Report-Only`) surfaces every violation without breaking the app, so you can find all your sinks before enforcing.

Support: Chromium-based browsers enforce it; Firefox/Safari **ignore it** (no error, no protection). So it's defense-in-depth for Chromium users, not a cross-browser guarantee — you still ship a sanitizer.

## 💻 Code

```js
// 1. Turn it on (via CSP header shown above), then define ONE policy.
const sanitizer = trustedTypes.createPolicy('app-html', {
  createHTML: (dirty) => DOMPurify.sanitize(dirty, { RETURN_TRUSTED_TYPE: false }),
});

// ❌ Now a raw string throws — this is the whole point
el.innerHTML = userComment;          // TypeError: requires TrustedHTML

// ✅ Route through the policy; the sanitizer runs by construction
el.innerHTML = sanitizer.createHTML(userComment);

// DOMPurify can emit TrustedHTML directly, so it doubles as the policy:
el.innerHTML = DOMPurify.sanitize(userComment, { RETURN_TRUSTED_TYPE: true });
```

```js
// A default policy to catch stragglers while migrating a legacy app.
// Keep it strict — logging what flows through it tells you what to fix.
trustedTypes.createPolicy('default', {
  createHTML: (s) => { console.warn('unwrapped HTML sink:', s); return DOMPurify.sanitize(s); },
});
```

## ⚖️ Trade-offs

- **When NOT to reach for it first:** if you haven't already killed obvious XSS with output encoding and a strict CSP, Trusted Types is premature. It's the *last mile* — for hardening a large app where you can't manually audit every sink.
- **Migration cost is real.** Turning it on in a mature codebase surfaces every third-party library that touches `innerHTML`. Expect to wrap or patch dependencies; some won't cooperate. Start in report-only.
- **Not cross-browser.** Safari and Firefox don't enforce it, so it can't be your *only* line of defense — treat it as strong hardening for the majority (Chromium) plus a real sanitizer everywhere.
- **A sloppy `default` policy is worse than none** — it gives a false sense of safety while passing everything through.

## 💣 Gotchas interviewers probe

- **"Does Trusted Types sanitize for you?"** No — it *enforces that sanitization happens at a chokepoint*. You still write the sanitizer inside `createHTML`. It's a control-flow guarantee, not a magic cleaner.
- **The default policy is a footgun.** A `default` that returns input unchanged silently re-opens every sink. Its job is to *log and migrate*, then be removed.
- **Firefox/Safari ignore it** — candidates who present it as a complete XSS fix miss that it's Chromium-only enforcement today.
- **It only guards *DOM/script* sinks**, gated by `require-trusted-types-for 'script'`. It does nothing for reflected/stored server-side XSS or for `javascript:` navigations unless those hit a covered sink.
- **`createPolicy` name allow-listing** via the `trusted-types` directive is what stops an attacker from just creating their own policy — forget it and the protection is bypassable.

## 🎯 Say this in the interview

> "Trusted Types changes DOM-XSS from a needle-in-a-haystack audit into a chokepoint. You enable it with a CSP header — `require-trusted-types-for 'script'` — and then every dangerous sink like `innerHTML` refuses raw strings and only accepts a `TrustedHTML` object. The only way to mint that object is through a named policy you define, so I put DOMPurify inside the policy's `createHTML` and now *every* injection point in the app is sanitized by construction — I audit two policies instead of two thousand call sites. I'd roll it out in report-only first to surface every sink, keep the default policy strict and temporary, and I'm honest that it's Chromium-only enforcement — Safari and Firefox ignore it — so it's strong defense-in-depth on top of a real sanitizer, not a replacement for one."

## 🔗 Go deeper

- [web.dev — Trusted Types](https://web.dev/articles/trusted-types) — the canonical rollout guide, report-only workflow included.
- [MDN — Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) — the API surface and sink list.
- [W3C — Trusted Types spec](https://w3c.github.io/trusted-types/dist/spec/) — exact enforcement semantics and covered sinks.
