<div align="center">

# Server Actions & mutations

<sub>▲ Next.js · 🟡 Medium · ⏱ 1h · `#data` `#mutations`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A Server Action is an `async` function marked `'use server'` that runs **only on the server** but is callable directly from client code — Next compiles it into a **public POST endpoint** with a stable ID. It's the mutation half of RSC: forms that work without JS, and no hand-written API route.

---

## 🧠 Mental model

Server Components solved *reading* on the server. Server Actions solve *writing*. Instead of `fetch('/api/todos', { method: 'POST' })` against an API route you wrote and maintain, you write a function, mark it `'use server'`, and call it — Next wires up the transport.

The mental model that keeps you safe: **a Server Action is not a "trusted server call", it's a public HTTP endpoint with a funny-looking name.** Anyone can POST to its generated ID with any payload. The ergonomic sugar hides the network boundary, but the boundary is still there — so **every action must authenticate and validate as if it were a raw route handler.**

Bound to a `<form action={...}>`, it also gives you **progressive enhancement**: the form submits and mutates even before (or without) JavaScript hydrating.

## ⚙️ How it actually works

At build time, each `'use server'` function gets a stable **action ID**. The client bundle doesn't contain the function body — it contains a *reference*. Calling it issues a POST carrying that ID plus serialised arguments; Next dispatches to the real function on the server and streams the result (and any re-rendered RSC) back.

Two security mechanisms ship by default: Next checks the **`Origin` vs `Host`** header to block cross-site POSTs (CSRF), and **closed-over variables are encrypted** so a closure like `deleteById.bind(null, secretId)` doesn't leak `secretId` to the client. Neither replaces *your* authorization.

After a mutation you invalidate caches from inside the action — `revalidatePath()` / `revalidateTag()` purge the Data and Full Route caches, and `redirect()` navigates. Arguments and return values must be **serialisable** (the RSC wire format), same as props crossing the client boundary.

## 💻 Code

```tsx
// actions.ts — a mutation as a plain server function
'use server';
import { revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const Schema = z.object({ title: z.string().min(1).max(200) });

export async function createTodo(_prev: unknown, formData: FormData) {
  const session = await auth();                 // ← authZ is YOURS. Do it first.
  if (!session) return { error: 'Unauthorized' };

  const parsed = Schema.safeParse({ title: formData.get('title') });
  if (!parsed.success) return { error: 'Invalid input' };  // never trust the client

  await db.todo.create({ data: { ...parsed.data, userId: session.userId } });
  revalidateTag('todos');                       // purge the cache the read uses
  return { ok: true };
}
```

```tsx
// The form: progressive enhancement + pending + result state, no useEffect.
'use client';
import { useActionState } from 'react';       // React 19 (was useFormState)
import { useFormStatus } from 'react-dom';
import { createTodo } from './actions';

function Submit() {
  const { pending } = useFormStatus();          // must be INSIDE the <form>
  return <button disabled={pending}>{pending ? 'Saving…' : 'Add'}</button>;
}

export function TodoForm() {
  const [state, action] = useActionState(createTodo, null);
  return (
    <form action={action}>
      <input name="title" />
      <Submit />
      {state?.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
```

## ⚖️ Trade-offs

- **Actions collapse the client/server round-trip into one function**, delete your API-route boilerplate, and give forms progressive enhancement for free. That's the pitch and it's real.
- **They're the wrong tool for a public, versioned, or third-party API.** Action IDs are an internal implementation detail, not a contract — mobile apps, webhooks, and external consumers want a real `route.ts` you control.
- **When NOT to reach for one:** pure reads. Actions are POST-only mutations; fetching data belongs in a Server Component or route handler, not an action masquerading as a getter.
- **Sequential actions don't batch.** Two actions fired back-to-back are two round-trips; if you need atomicity, do the work inside one action.

## 💣 Gotchas interviewers probe

- **"A Server Action is a public endpoint."** The single most important sentence here. No auth check inside = anyone can invoke it with any arguments. The `'use server'` directive is *not* an authorization boundary.
- **Always validate the payload.** `formData` is attacker-controlled. Parse with Zod/valibot; never spread it straight into a DB write.
- **`useFormStatus` only reads the *nearest parent* form** and must live in a child component *inside* that `<form>` — reading it as a sibling returns `pending: false` forever.
- **`useFormState` → `useActionState`.** React 19 renamed it and moved it from `react-dom` to `react`; old tutorials use the old name.
- **Closed-over variables are encrypted, but still sent.** Don't stuff huge objects or per-request secrets into a bound closure — it's serialised (encrypted) over the wire, not free.
- **You must revalidate after mutating**, or the reader keeps serving cached data and the UI "doesn't update" until a hard refresh.
- **`redirect()` throws** (it works by throwing a special error) — don't wrap the action body in a `try/catch` that swallows it.

## 🎯 Say this in the interview

> "A Server Action is an async function marked `'use server'` that runs only on the server but I can call straight from client code — Next compiles it into a POST endpoint with a stable ID and handles the transport. Bound to a form's `action` prop it gives progressive enhancement, so the mutation works before JS hydrates. The thing I never forget: that endpoint is *public*. The directive isn't an auth boundary, so I authenticate and validate inside every action exactly like a raw route — session check first, then parse the FormData with Zod, then write. Next gives me CSRF protection via the Origin check and encrypts closed-over variables, but authorization is on me. After the write I call `revalidateTag` to purge the cache the reader uses, and for pending and error state I use `useActionState` plus `useFormStatus` instead of a `useEffect`."

## 🔗 Go deeper

- [Next.js — Server Actions and Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) — forms, revalidation, redirects, security notes.
- [React — `useActionState`](https://react.dev/reference/react/useActionState) — pending/result state for actions.
- [React — `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus) — reading the parent form's pending state.
- [Next.js — Security & Server Actions](https://nextjs.org/blog/security-nextjs-server-components-actions) — the encrypted-closure and public-endpoint model, from the team.
