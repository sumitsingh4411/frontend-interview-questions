<div align="center">

# Storage

<sub>⚡ JavaScript · **19 questions**</sub>

<a href="README.md">⬅ Bank index</a> &nbsp;·&nbsp; <a href="../README.md">JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> 🟢 Easy · 🟡 Medium · 🔴 Hard · prompts only — work the answers using the section guides.

---

- 🟢 Explain `localStorage` — its capacity, synchronous nature, and same-origin scoping.
- 🟡 Why should you avoid storing sensitive data like JWTs in `localStorage`? Explain the XSS risk.
- 🟡 How would you build a typed wrapper around `localStorage` that handles JSON serialization and quota errors safely?
- 🔴 Explain the `storage` event — how can you sync state across multiple browser tabs using `localStorage`?
- 🟡 What happens when `localStorage.setItem` exceeds the quota? How should you handle `QuotaExceededError`?
- 🟢 Explain how `sessionStorage` differs from `localStorage` in lifetime and scope (per-tab vs per-origin).
- 🟡 Does `sessionStorage` persist across a page refresh? Across opening a new tab to the same URL? Explain why.
- 🟢 Give a real use case where `sessionStorage` is preferable to `localStorage` (e.g., a multi-step form wizard).
- 🟡 How would you persist and restore scroll position per-tab using `sessionStorage`?
- 🟡 Explain `HttpOnly`, `Secure`, and `SameSite` cookie attributes and what security threats each mitigates.
- 🟡 Compare cookies, localStorage, and sessionStorage in terms of size limits, expiry, and being sent with HTTP requests.
- 🟡 Why can JavaScript not read an `HttpOnly` cookie, and why is that a deliberate security feature against XSS?
- 🔴 Explain `SameSite=Strict` vs `Lax` vs `None` and their role in CSRF mitigation.
- 🟢 Implement a small utility to get, set, and delete a cookie using `document.cookie`.
- 🟡 What is IndexedDB and when would you choose it over localStorage for a frontend application?
- 🔴 Explain object stores, indexes, and transactions in IndexedDB.
- 🟡 Why is the native IndexedDB API callback/event-based, and how do libraries like `idb` wrap it in Promises?
- 🔴 Design an offline-first data layer for a note-taking app using IndexedDB with background sync to a server.
- 🔴 Explain versioning in IndexedDB (`onupgradeneeded`) and how schema migrations are handled.

---

_Part of the [⚡ JavaScript question bank](README.md). Spot an error or duplicate? [Open a PR](../../CONTRIBUTING.md)._
