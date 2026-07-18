<div align="center">

# Dependency injection

<sub>🏛️ Architecture · 🟡 Medium · ⏱ 45m · `#patterns`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Dependency injection means a module receives its collaborators instead of constructing them, so the thing that decides *which* implementation to use is separated from the thing that *uses* it — the entire point is that you can swap a real API client for a fake one at a seam, which is what makes code testable and configurable without editing it.

---

## 🧠 Mental model

DI is not a framework, an annotation, or a container — those are *implementations* of the idea. The idea is one sentence: **don't `new` your dependencies; ask for them.** A component that does `const api = new HttpClient()` has welded itself to HTTP forever. A component that receives `api` can be handed a real client in production, a mock in tests, and a logging wrapper in staging — with zero changes to its own code.

The principle underneath is the **Dependency Inversion Principle**: high-level policy (your business logic) shouldn't depend on low-level detail (fetch, localStorage); both should depend on an *abstraction*. DI is the mechanism that delivers the right concrete instance to satisfy that abstraction. In JS the "abstraction" is usually just a function signature or a TypeScript interface — you rarely need more.

## ⚙️ How it actually works

There's a spectrum, from trivial to heavyweight:

1. **Parameter injection** — pass the dependency as an argument. This is DI. It's also 90% of what you need. `createUserService(apiClient)`.
2. **React Context as a DI container** — provide a service at the top of the tree, consume it via a hook anywhere below. `<ApiProvider value={realClient}>` in the app, `<ApiProvider value={fakeClient}>` in a test. This is the idiomatic frontend DI mechanism and it's built in.
3. **Container / IoC frameworks** (Angular's DI, InversifyJS, `tsyringe`) — a registry maps tokens to implementations and resolves a dependency graph for you, often via decorators. Powerful, but it's a lot of machinery for a language where closures already do the job.

The senior insight: **the win isn't "loose coupling" as an abstraction — it's the test seam.** Every place you'd otherwise reach for `jest.mock()` to stub a module is a place DI would have given you a clean injection point without the mocking hack. If your tests are full of module mocks, that's your codebase telling you dependencies are hard-wired.

## 💻 Code

```ts
// ❌ Hard-wired: the service constructs its own dependency.
// Untestable without mocking fetch globally; can't swap transports.
class UserService {
  async getUser(id: string) {
    const res = await fetch(`/api/users/${id}`); // welded to HTTP + this URL
    return res.json();
  }
}

// ✅ Injected: the collaborator is an argument satisfying an interface.
interface ApiClient { get<T>(path: string): Promise<T>; }

function createUserService(api: ApiClient) {
  return {
    getUser: (id: string) => api.get<User>(`/users/${id}`),
  };
}

// Production wires the real one:
const service = createUserService(httpClient);

// Tests inject a fake — no jest.mock, no network, deterministic:
const fake: ApiClient = { get: async () => ({ id: '1', name: 'Ada' }) };
const s = createUserService(fake);
```

```tsx
// React Context as the DI container — swap the whole tree's dependency
const ApiCtx = createContext<ApiClient>(httpClient);
export const useApi = () => useContext(ApiCtx);

// In a test: <ApiCtx.Provider value={fake}>{children}</ApiCtx.Provider>
```

## ⚖️ Trade-offs

- **When NOT to use it:** pure functions and leaf UI components with no side effects don't need injected anything — injecting a formatter into a `<Button>` is astronaut architecture. Inject at the boundaries where side effects live (network, storage, time, randomness), not everywhere.
- **Containers add indirection.** A decorator-based IoC container means the answer to "what actually runs here?" lives in a registry three files away. On a team that knows the framework it's fine; as a default for a React app it's usually over-engineering — Context or plain parameters are lighter and more traceable.
- **Injecting *too* granularly** turns every function into a config bag with eight parameters. Group related dependencies into a single `deps` object or a service, and inject that.

## 💣 Gotchas interviewers probe

- **"DI vs a DI container"** — most candidates conflate them. DI is the *pattern* (receive, don't construct). A container is one optional *tool* for wiring it. You can do DI with zero libraries; closures and Context are enough.
- **`jest.mock` is a code smell for missing DI.** If you can only test a module by intercepting its imports, the dependency is hard-wired. Interviewers listen for whether you see mocking frameworks as a patch over a design gap.
- **Time and randomness are dependencies too.** `Date.now()` and `Math.random()` hard-code non-determinism. Injecting a `clock` / `random` is what makes time-based logic testable — a classic senior tell.
- **Context re-render trap:** putting a *service* (stable identity) in Context is fine; putting frequently-changing *state* in the same Context re-renders every consumer. Split stable dependencies from volatile state into separate contexts.
- **Service locator ≠ DI.** Calling `container.get('api')` *inside* a module hides the dependency instead of declaring it — it's the anti-pattern DI was meant to replace.

## 🎯 Say this in the interview

> "Dependency injection just means a module receives its collaborators instead of constructing them. The real payoff is the test seam — anywhere I'd otherwise have to `jest.mock` a module is a place a hard-wired dependency should have been injected. On the frontend I rarely need a container; passing a dependency as a parameter is DI, and React Context is a perfectly good DI mechanism for providing a service to a whole subtree and swapping it for a fake in tests. I inject specifically at the side-effect boundaries — network, storage, time, randomness — and I'd inject a clock so time-based logic is deterministic. I don't inject into pure leaf components; that's just indirection with no payoff. And I'm careful to distinguish this from a service locator, where a module reaches into a global registry — that hides the dependency instead of declaring it."

## 🔗 Go deeper

- [patterns.dev](https://www.patterns.dev/) — design and rendering patterns for modern frontend, including provider/DI-style patterns.
- [Martin Fowler — Inversion of Control Containers and the DI pattern](https://martinfowler.com/articles/injection.html) — the foundational essay that named the pattern.
- [React — Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context) — Context as the built-in injection mechanism.
- [Angular — Dependency Injection](https://angular.dev/guide/di) — the most fully-realised DI system in frontend, worth understanding even if you never use it.
