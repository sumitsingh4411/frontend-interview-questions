<div align="center">

# Server Actions

<sub>⚛️ React · 🟡 Medium · ⏱ 45m · `#rsc` `#data`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Functions marked `'use server'` that **run on the server but are callable from the client** — React handles the RPC for you. They're the **write/mutation** counterpart to RSC's read, wire straight into `<form action={fn}>` for **progressive enhancement** (they work before JS loads), and integrate with `useActionState`, `useFormStatus`, and `useOptimistic`. Critically: a Server Action is a **public POST endpoint** — you must authenticate and validate inside it.

---

## 🧠 Mental model

RSC solved reads: server components fetch data directly. Server Actions solve **writes**. Instead of hand-writing an API route plus a client `fetch`, you write one async function, mark it `'use server'`, and call it — React serializes the call, sends it to the server, runs the real function, and streams back the result.

The framing that separates seniors: a Server Action is **not a magic local function call — it's an RPC over a network boundary that React makes look local.** Everything that implies about a network boundary — serialization, latency, and *security* — still applies. It is a real endpoint anyone can POST to.

## ⚙️ How it actually works

`'use server'` at the top of a module (or inline in a server component) marks its exported **async** functions as Server Actions. The bundler replaces the client-side reference with a **stub**: calling it POSTs a serialized payload (an action id + serialized arguments) to the server, which runs the real implementation and can return a value *and* a fresh RSC payload to update the UI.

Because it plugs into `<form action={fn}>`, the form **submits and works without client JS** — a genuine `<form>` POST — then upgrades to a fetch-based, no-reload submission once hydrated. That's progressive enhancement you get for free.

React 19 wraps this in **Actions**: passing an async function to a form/`startTransition` gives you managed pending state, error handling, and optimistic updates via:

- **`useActionState(action, initial)`** — returns `[state, formAction, isPending]`; threads the action's return value back as state.
- **`useFormStatus()`** — reads the parent form's pending state from a nested component (e.g. a submit button) without prop drilling.
- **`useOptimistic(state, reducer)`** — show an optimistic value immediately, reconcile when the action resolves.

## 💻 Code

```jsx
// actions.js — a server module. Every export is a callable endpoint.
'use server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

export async function addComment(prev, formData) {
  const user = await auth();                        // ← authZ INSIDE the action
  if (!user) throw new Error('Unauthorized');
  const { text } = z.object({ text: z.string().min(1).max(500) })
    .parse({ text: formData.get('text') });         // ← validate; never trust args
  await db.comment.create({ data: { text, userId: user.id } });
  return { ok: true };
}
```

```jsx
// Client: progressive-enhancement form + managed pending/return state.
'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { addComment } from './actions';

function Submit() {
  const { pending } = useFormStatus();              // reads the enclosing form
  return <button disabled={pending}>{pending ? 'Posting…' : 'Post'}</button>;
}
export function CommentForm() {
  const [state, formAction] = useActionState(addComment, { ok: false });
  return (
    <form action={formAction}>                       {/* works even before JS */}
      <textarea name="text" />
      <Submit />
      {state.ok && <p>Posted!</p>}
    </form>
  );
}
```

## ⚖️ Trade-offs

- **Less boilerplate, real end-to-end types.** No manual route handler, no client fetch wiring, no duplicated request/response types — the call site imports the function directly.
- **Progressive enhancement is the standout.** `<form action={serverAction}>` submits without JS, so the core flow works on slow connections and during hydration. Few client-side patterns give you that.
- **When NOT to use them:** high-frequency, low-latency interactions (live search, drag reordering) where an RPC round-trip per event is too slow, or logic that genuinely belongs client-side. They're for mutations, not for every function call.
- **They need an RSC framework.** Like RSC, this isn't available in a plain SPA — it requires bundler/framework support for the directive and transport.

## 💣 Gotchas interviewers probe

- **A Server Action is a public endpoint — it is NOT automatically secure.** The bundler exposes a POST route for it. You must authenticate, authorize, and **validate every argument** inside the function. "It's only called from my form" is false; anyone can POST the action id.
- **Never trust the arguments.** They arrive over the network. Validate with a schema (Zod, etc.); treat `formData` as hostile input.
- **Closed-over variables in inline actions get serialized.** An inline `'use server'` action closes over values that are sent to the client as encrypted references — don't close over secrets or huge objects.
- **Return values must be serializable.** Same boundary rules as RSC — no functions or class instances back to the client.
- **Actions run server-side only.** No `window`, no client state access; read client data via the arguments/form.
- **Errors surface to the client.** Throwing inside an action rejects the call — pair with an error boundary or return an error shape via `useActionState`.

## 🎯 Say this in the interview

> "Server Actions are async functions marked `'use server'` that run on the server but I can call from the client — React serializes the call and does the RPC for me, so there's no hand-written API route or client fetch. They're the write side of RSC: RSC reads data, actions mutate it. The feature I like most is progressive enhancement — wiring one to `<form action={fn}>` means the form submits and works before JS loads, then upgrades to a no-reload fetch after hydration — and React 19 gives me `useActionState`, `useFormStatus`, and `useOptimistic` for pending and optimistic UI. The thing I never forget, and that trips people up, is security: a Server Action is a public POST endpoint, so I authenticate and validate every argument inside it with a schema — I treat the args as hostile, because anyone can hit that endpoint directly."

## 🔗 Go deeper

- [react.dev — `'use server'`](https://react.dev/reference/rsc/use-server) — the directive, serialization rules, and the security caveats.
- [react.dev — `useActionState`](https://react.dev/reference/react/useActionState) — pending state and threading the return value.
- [react.dev — `useOptimistic`](https://react.dev/reference/react/useOptimistic) — optimistic UI while the action is in flight.
- [react.dev — `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus) — reading pending state in nested submit buttons.
