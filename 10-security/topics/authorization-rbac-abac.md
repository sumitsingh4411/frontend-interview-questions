<div align="center">

# Authorization (RBAC/ABAC)

<sub>🔒 Security · 🟡 Medium · ⏱ 1h · `#authz`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Authorization decides **what an authenticated user may do**, and the two dominant models answer it differently: **RBAC** grants permissions to *roles* ("editors can publish"), **ABAC** evaluates *attributes* at request time ("you may edit a doc **if** you own it **and** it's in your region"). The one rule that never changes: **the server decides, every time — the frontend only decides what to render.**

---

## 🧠 Mental model

Authorization (**authz**) starts where authentication ends. Authn established a trustworthy identity; authz maps that identity to a *decision* on a specific action against a specific resource. The mental frame is always a triple: **(subject, action, resource) → allow | deny**.

- **RBAC** collapses the subject into a **role**. Permissions attach to roles, users get roles. It's coarse, static, and easy to reason about: `role=admin ⇒ can delete`. Great until you need "…but only *their own* orders", which a role can't express.
- **ABAC** evaluates a **policy** over attributes of the subject, resource, action, and environment at request time: `allow if subject.dept == resource.dept AND action == 'read' AND time.hour in 9..17`. Infinitely expressive, but the policy engine becomes something you must test like code.

The senior insight: **most real systems are RBAC for the coarse gate and ABAC for the fine gate.** "Is this user an editor?" (role) *and* "is this the editor's own draft?" (attribute). Pretending it's purely one or the other is where the design breaks.

## ⚙️ How it actually works

The decision must be **enforced at the point of data access**, not scattered through the UI. That means a single choke point — middleware or a service-layer guard — that receives the authenticated principal and the target resource and returns allow/deny.

**RBAC** typically stores a `roles → permissions` map and checks membership:

```
user.roles = ["editor"]
role_permissions["editor"] = ["post:read", "post:write"]
can("post:write") ⇒ true
```

**ABAC** evaluates a policy function. The subtlety is that it needs the *resource loaded* to read its attributes — you can't decide "owns this document" without fetching the document. So authz often can't be pure middleware; it's interleaved with data fetching.

**Object-level (horizontal) checks are where breaches happen.** Role checks are *vertical* — "can a user of this type do this class of action?". But **IDOR** (Insecure Direct Object Reference) is *horizontal*: a valid editor requests `/api/orders/1002` — an order that isn't theirs. The role check passes; the ownership check was never written. OWASP ranks **Broken Access Control #1** precisely because this check is so easy to omit.

**Deny by default.** Every route starts closed; access is granted explicitly. A route with no guard should fail closed, not open. This is the single most important architectural decision — it turns "forgot to add a check" into a 403 instead of a breach.

## 💻 Code

```js
// ❌ Vertical check only — passes for ANY editor, even for others' data (IDOR)
app.delete("/api/posts/:id", requireRole("editor"), async (req, res) => {
  await db.posts.delete(req.params.id); // whose post? nobody checked.
});

// ✅ Vertical (role) AND horizontal (ownership) — the check IDOR exploits
app.delete("/api/posts/:id", requireRole("editor"), async (req, res) => {
  const post = await db.posts.find(req.params.id);
  if (!post) return res.sendStatus(404);
  // ABAC-style attribute check: owner, or an admin override
  if (post.authorId !== req.user.id && !req.user.roles.includes("admin"))
    return res.sendStatus(403);
  await db.posts.delete(post.id);
  res.sendStatus(204);
});
```

```jsx
// Frontend authz is UX only — it decides what to RENDER, never what's ALLOWED.
// The server re-checks; this just avoids showing a button that would 403.
function DeleteButton({ post, user }) {
  const canDelete = post.authorId === user.id || user.roles.includes("admin");
  return canDelete ? <button onClick={onDelete}>Delete</button> : null;
}
```

## ⚖️ Trade-offs

- **RBAC scales in simplicity, not in expressiveness.** It's the right default — until you hit "role explosion", where every combination of scope (`editor-us-west`, `editor-eu-finance`) becomes its own role. That's the signal to move the fine-grained part to ABAC.
- **ABAC is powerful but is *code you must test*.** A policy engine (OPA/Rego, Cedar, Casbin) is expressive and auditable, but a wrong policy silently over-grants. Centralising policy is a win; hand-rolling ad-hoc `if` chains across controllers is the failure mode.
- **Don't push authz into the client for security.** SPA route guards and hidden buttons improve UX and reduce accidental 403s, but they are trivially bypassed with devtools or a raw `fetch`. Every guard on the client must have a twin on the server.

## 💣 Gotchas interviewers probe

- **Broken Access Control is OWASP #1.** The archetype is **IDOR**: swapping `/account/1001` for `/account/1002` and getting someone else's data because only the *role* was checked, never the *ownership*.
- **"Hidden in the UI" is not "protected".** If the endpoint answers a direct request, the feature is exposed. Removing the button removes discoverability, not access.
- **Fail closed, not open.** A new route with no explicit guard must default to deny. Allow-by-default plus "we'll add the check later" is how endpoints leak.
- **Mass assignment is an authz bug in disguise.** Binding a request body straight to a model lets a user set `role: "admin"` or `isVerified: true`. Whitelist writable fields.
- **JWT scopes ≠ enforcement.** A token *claiming* `scope: admin` means nothing unless the server *verifies the signature and then honours the scope*. Trusting an unverified claim is a bypass.
- **Confused deputy.** A privileged service acting on behalf of a user must check the *user's* permissions, not its own — or it becomes a proxy for privilege escalation.

## 🎯 Say this in the interview

> "Authorization is the (subject, action, resource) decision that happens after authentication. RBAC attaches permissions to roles — coarse and easy to reason about; ABAC evaluates a policy over attributes at request time, which is what you need for 'only their own records'. In practice I use both: a role gate for the vertical check and an attribute check for the horizontal, object-level one. That horizontal check is the important one, because Broken Access Control is OWASP #1 and IDOR — swapping an ID in the URL — is the classic exploit when only the role was verified. My non-negotiables are: the server decides on every request, the frontend only decides what to render, and every route fails closed by default. I also watch for mass assignment, where a request body quietly sets a privileged field the user should never control."

## 🔗 Go deeper

- [OWASP — Access Control](https://owasp.org/www-community/Access_Control) — the model definitions and the failure modes to design against.
- [OWASP — Broken Access Control (Top 10 A01)](https://owasp.org/Top10/A01_2021-Broken_Access_Control/) — why this is #1 and the concrete anti-patterns, including IDOR.
- [OWASP — Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — deny-by-default, least privilege, and enforcement at the data layer.
- [NIST — Attribute-Based Access Control (SP 800-162)](https://csrc.nist.gov/pubs/sp/800/162/upd2/final) — the authoritative ABAC model.
