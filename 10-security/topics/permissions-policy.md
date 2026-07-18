<div align="center">

# Permissions-Policy

<sub>🔒 Security · 🟡 Medium · ⏱ 30m · `#headers`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `Permissions-Policy` is an HTTP header that declares **which powerful browser features your page (and its iframes) are even allowed to request** — camera, geolocation, autoplay, etc. — so a compromised third-party frame or injected script can't reach for a capability you never intended to use.

---

## 🧠 Mental model

There are two different questions about a capability like the camera. The **permission prompt** answers "does the *user* consent right now?" `Permissions-Policy` answers a prior, structural question: "is this feature *available to this document at all*?" If the policy says no, the API is disabled — the prompt never even appears; `getUserMedia` rejects.

It's an **attack-surface reduction** control, not a consent control. You're pre-declaring "this app will never use USB, serial, or payment," so that if an attacker injects a script or you embed a third party that goes rogue, those APIs are simply not on the table. Least privilege, expressed as a header.

The old name was `Feature-Policy`; `Permissions-Policy` is the current header with cleaner allow-list syntax.

## ⚙️ How it actually works

The header is a comma-separated list of `feature=(allowlist)`. The allow-list uses special origin tokens:

```
Permissions-Policy: geolocation=(self), camera=(), microphone=(self "https://meet.example.com"), fullscreen=*
```

| Allowlist | Meaning |
|---|---|
| `()` | **disabled everywhere** — not even your own top document may use it |
| `(self)` | your own origin only; cross-origin iframes are denied |
| `(self "https://x.com")` | your origin **and** that specific embedded origin |
| `*` | every origin, including all iframes |

Key mechanics:

- **Policy is inherited and can only be *narrowed* by iframes**, never widened. A child frame can't grant itself a feature the parent didn't allow. This is what makes it a real containment boundary.
- **Per-iframe delegation** via the `allow` attribute: `<iframe allow="camera 'src'">` grants the frame a feature the header permitted, scoped to that frame. Without delegation, most powerful features default to `self` only — a cross-origin iframe can't use the camera even if the top page can.
- **Default allow-lists vary by feature.** Some default to `self` (camera, geolocation), some to `*` (e.g. legacy defaults). Don't assume — set them explicitly for anything you care about.
- **Disabling isn't a prompt-denial.** `camera=()` makes `navigator.mediaDevices.getUserMedia({video:true})` reject with a `NotAllowedError`/security error; the user is never asked.
- **Reporting:** violations can be sent to a reporting endpoint via the Reporting API, so you can detect code trying to use features you've locked down.

## 💻 Code

```
# Lock the app down to least privilege. Everything not listed keeps its
# browser default — so explicitly disable the ones you never want.
Permissions-Policy:
  geolocation=(self),
  camera=(),
  microphone=(),
  payment=(),
  usb=(),
  interest-cohort=(),          # opt out of legacy FLoC
  fullscreen=(self)
```

```html
<!-- A cross-origin iframe gets NOTHING powerful by default.
     Delegate deliberately, per feature, per frame. -->
<iframe
  src="https://widget.example.com"
  allow="geolocation 'none'; camera 'none'; fullscreen 'self'"
></iframe>

<!-- Explicitly hand the camera to a trusted embedded video app -->
<iframe src="https://meet.example.com" allow="camera; microphone"></iframe>
```

```js
// Feature-detect what the current document is actually permitted to do
if (document.featurePolicy?.allowsFeature('geolocation')) {
  navigator.geolocation.getCurrentPosition(onOk, onErr);
}
```

## ⚖️ Trade-offs

- **When it does little:** if your app genuinely uses many APIs across many origins, an overly generous policy (`*` everywhere) provides no protection. Value comes from being *restrictive* — deny by default, delegate deliberately.
- **It's a hardening layer, not a primary control.** It doesn't stop XSS or CSRF; it *reduces the blast radius* by removing capabilities from injected/embedded code. Pair it with CSP.
- **Third-party embeds can break** if you forget to delegate a feature they legitimately need (a maps widget losing geolocation, an embedded call losing the mic). Test embeds after tightening.
- **Not a consent mechanism** — never rely on it to replace asking the user; it operates one layer above the prompt.

## 💣 Gotchas interviewers probe

- **"How is this different from the permission prompt?"** The prompt is user consent at call time; `Permissions-Policy` decides whether the API is *reachable at all*. If disabled, there's no prompt — the call just fails.
- **`self` vs `*`** — cross-origin iframes get the feature **only** if the top document both allows it and the `<iframe allow="...">` delegates it. Two gates, both must pass.
- **Child frames can only restrict, never expand** the inherited policy — the containment guarantee. A candidate who thinks an iframe can grant itself more is wrong.
- **Empty `()` means off everywhere including your own page** — people confuse `()` (nobody) with `(self)` (just me).
- **`Feature-Policy` is the deprecated predecessor** with different syntax (space-separated, no parentheses). Know both names.
- **Unlisted features fall back to browser defaults**, which differ per feature — locking down means *explicitly* denying, not just omitting.

## 🎯 Say this in the interview

> "`Permissions-Policy` is least-privilege for browser capabilities. It answers a different question from the permission prompt: the prompt is user consent at call time, but the policy decides whether a feature is even *available* to the document. So I declare up front `camera=()`, `usb=()`, `payment=()` for anything my app will never use — and if an attacker injects a script or an embedded widget goes rogue, those APIs simply aren't reachable; no prompt, the call just fails. The containment property I'd highlight is that iframes inherit the policy and can only *narrow* it, never widen it, and cross-origin frames get powerful features only if I both allow them in the header and delegate them via the iframe's `allow` attribute. It doesn't stop XSS, but it shrinks the blast radius when something does get in."

## 🔗 Go deeper

- [MDN — Permissions-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy) — full directive list and allow-list syntax.
- [MDN — iframe `allow`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#allow) — per-frame feature delegation.
- [web.dev — Controlling browser features with Permissions Policy](https://developer.chrome.com/docs/privacy-security/permissions-policy) — practical patterns and reporting.
