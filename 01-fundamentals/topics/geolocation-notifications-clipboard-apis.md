<div align="center">

# Geolocation, Notifications, Clipboard APIs

<sub>🧱 Fundamentals · 🟢 Easy · ⏱ 45m · `#web-api`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — These three APIs look unrelated but are the same API three times: a **powerful capability** gated behind a **secure context**, a **permission**, and (increasingly) a **transient user activation**. Learn the gate and all three become boring.

---

## 🧠 Mental model

Stop memorising method signatures. The browser exposes capabilities that can leak or annoy — where you are, your attention, your clipboard — so every one of them sits behind the same four locks:

| Lock | What it means | Fails as |
|---|---|---|
| **Secure context** | HTTPS or `localhost` only | API is `undefined`, or rejects immediately |
| **Permission** | User said yes, no, or nothing yet | `denied` state, or a promise that never resolves |
| **User activation** | Must run inside a real click/keypress | `NotAllowedError` |
| **Permissions Policy** | The embedding page must delegate it to your iframe | Blocked before the prompt even shows |

The senior framing: **permission state is not a boolean, it's a three-state machine** — `granted`, `denied`, `prompt` — and `denied` is *sticky and unrecoverable from JavaScript*. You cannot re-prompt. That single fact should drive your entire UX, because a permission prompt is a one-shot resource you get to spend once per user.

## ⚙️ How it actually works

**The Permissions API is the read-only lens.** It lets you check state *without* triggering a prompt — the only way to build a non-hostile flow:

```js
const status = await navigator.permissions.query({ name: 'geolocation' });
status.state; // 'granted' | 'denied' | 'prompt'
status.onchange = () => render(status.state); // live — user can flip it in site settings
```

**Geolocation** is callback-based (it predates promises) and has three knobs that actually matter:

- `enableHighAccuracy: true` — asks for GPS instead of the coarse Wi-Fi/IP estimate. Costs battery and seconds. Default `false` is right for "which city are you in".
- `maximumAge` — accept a cached fix this many ms old. `maximumAge: 60000` on a map that re-centres is the difference between instant and a 5-second stall.
- `timeout` — **defaults to `Infinity`**. Without it, `getCurrentPosition` can hang forever indoors and your spinner spins until the heat death of the universe.

**Notifications** split into two completely different things that candidates conflate:

- `new Notification(...)` — page is open, foreground only, dying on mobile.
- **Push API + Service Worker** — the real one. Push wakes a service worker with the page *closed*; the SW must then call `showNotification()`. Requires a `PushSubscription` and VAPID keys on your server.

**Clipboard** is asymmetric on purpose, and this is the detail interviewers like:

- `clipboard.writeText()` — allowed with user activation. Writing is low-risk.
- `clipboard.readText()` — requires an *explicit permission prompt* in Chromium and is **not implemented at all** in Firefox for arbitrary reads. Reading is exfiltration; the platforms treat it that way.

## 💻 Code

```js
// ❌ Prompts on page load. User has no context, says "Block", and you are dead forever.
navigator.geolocation.getCurrentPosition(showMap);

// ✅ Check state first, prompt only from a real gesture, always set a timeout.
async function locateOnClick() {
  const { state } = await navigator.permissions.query({ name: 'geolocation' });
  if (state === 'denied') return showManualZipInput(); // sticky — never re-promptable

  navigator.geolocation.getCurrentPosition(
    (pos) => showMap(pos.coords.latitude, pos.coords.longitude),
    (err) => {
      // err.code: 1 PERMISSION_DENIED · 2 POSITION_UNAVAILABLE · 3 TIMEOUT
      if (err.code === 1) showManualZipInput();
      else showRetry();
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
  );
}
```

Clipboard, with the fallback that still matters:

```js
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text); // needs HTTPS + user activation
  } catch {
    // Fires when: insecure context, no activation, or the async gap ate the activation.
    legacyCopy(text);
  }
  announce('Copied'); // aria-live — the clipboard gives NO visual feedback
}
```

**The activation-expiry trap** — the single best gotcha in this topic:

```js
// ❌ `await` burns the transient activation. Throws NotAllowedError in Safari.
btn.onclick = async () => {
  const text = await fetch('/api/token').then((r) => r.text());
  await navigator.clipboard.writeText(text); // too late — activation expired
};

// ✅ Hand the clipboard a Promise synchronously; it keeps the activation.
btn.onclick = () => {
  const blob = fetch('/api/token')
    .then((r) => r.text())
    .then((t) => new Blob([t], { type: 'text/plain' }));
  navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
};
```

## ⚖️ Trade-offs

- **Every prompt is a conversion funnel with a permanent exit.** Grant rates roughly double when you prompt after an in-page explainer ("we use your location to show nearby stores") versus on load. The engineering cost of a pre-prompt is trivial; the cost of a `denied` cohort is forever.
- **`enableHighAccuracy` is rarely worth it.** Unless you are drawing a live running route, coarse positioning is faster, colder-start-friendly, and doesn't drain battery. Defaulting it to `true` is a tell.
- **Don't use Notifications for anything you own a channel for.** If the user is looking at the tab, an in-page toast is better than an OS notification in every dimension. Notifications exist for *re-engagement when you're closed* — that's Push, not `new Notification()`.
- **Clipboard read is a dead end.** If your feature requires reading the clipboard, redesign it around a paste event (`onpaste` gives you the data with zero permission, because the paste *is* the consent).

## 💣 Gotchas interviewers probe

- **`denied` is permanent from JS.** There is no `requestPermission()` that can override it. Your only move is UI that says "enable this in your browser settings". Candidates who plan to "just ask again" have never shipped this.
- **Geolocation `timeout` defaults to `Infinity`.** Not 10s. Not 30s. Forever. This is the most common real bug in the API.
- **Insecure context ≠ error message.** On plain `http://`, `navigator.geolocation` and `navigator.clipboard` may be `undefined` — you get a `TypeError`, not a permission error. `localhost` is exempt, which is why it "works on my machine".
- **Iframes need Permissions-Policy delegation.** `<iframe allow="geolocation; clipboard-write">`. Without it the API is blocked upstream and never prompts — a nightmare to debug from inside the frame.
- **`Notification.permission` is a sync snapshot, `permissions.query()` is live.** The `onchange` handler is how you react to a user revoking access in site settings mid-session.
- **iOS Safari only supports web push for installed PWAs** (added to the Home Screen). "Push works on iOS now" is half-true and the half matters.
- **`document.execCommand('copy')` is deprecated but synchronous** — which is exactly why it survives as a fallback where the async Clipboard API loses its activation.
- **Clipboard writes are silent.** Screen reader users get no feedback unless you push it into an `aria-live` region.

## 🎯 Say this in the interview

> "I treat these as one problem, not three: a powerful capability behind a secure context, a permission, and a user activation. The thing I design around first is that permission state is tri-state — granted, denied, prompt — and denied is sticky, so I can never re-prompt from JavaScript. That means I never prompt on load. I query the Permissions API first, which doesn't trigger a prompt, show an in-page explainer, and only call the real API from a click. For geolocation specifically I always pass a timeout, because it defaults to Infinity and will hang indoors, and I default `enableHighAccuracy` to false unless I genuinely need GPS. For notifications I'd distinguish the foreground `Notification` constructor from Push plus a service worker, which is the only version that works when the tab is closed. And for clipboard, writing is cheap but reading needs an explicit prompt, so I design around the paste event instead."

## 🔗 Go deeper

- [MDN — Web APIs index](https://developer.mozilla.org/en-US/docs/Web/API) — the map of what the platform actually exposes.
- [MDN — Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) — the tri-state model that governs all three.
- [MDN — Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) — the read/write asymmetry and `ClipboardItem`.
- [web.dev — Push notifications overview](https://web.dev/articles/push-notifications-overview) — why Push + service worker is the real API.
- [MDN — Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Permissions_Policy) — the iframe `allow` attribute that silently blocks everything.
