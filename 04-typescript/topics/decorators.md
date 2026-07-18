<div align="center">

# Decorators

<sub>🔷 TypeScript · 🟡 Medium · ⏱ 45m · `#advanced`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A decorator is a **function that observes or replaces a declaration at definition time** — it runs once when the class is defined, not per instance. The catch nobody warns you about: there are now **two incompatible decorator systems** — TypeScript's legacy `experimentalDecorators` (what Angular, NestJS, TypeORM use) and the TC39 **Stage 3** standard (TS 5.0+, the default going forward). They have different signatures and do not mix.

---

## 🧠 Mental model

A decorator is a metaprogramming hook. `@logged class Foo {}` is roughly `Foo = logged(Foo) ?? Foo`. It fires *when the class is evaluated*, giving you a chance to inspect, wrap, or swap the thing being declared. It is not a runtime-per-call thing and it is not free magic — it's a function call the compiler wires in at the declaration site.

The single most important fact is that "decorators" refers to two different languages sharing one syntax. If you can name which one a codebase uses and *why they can't coexist*, you've answered the real question.

## ⚙️ How it actually works

**Legacy (`experimentalDecorators: true`).** The original TS design, matured over years. Signature depends on placement — class, method, accessor, property, or **parameter** (the only version with parameter decorators). Paired with `emitDecoratorMetadata` + the `reflect-metadata` polyfill, it emits *runtime type metadata*, which is the entire foundation of Angular and NestJS dependency injection.

```ts
// Legacy method decorator: (target, propertyKey, descriptor)
function logged(_t: unknown, key: string, desc: PropertyDescriptor) {
  const orig = desc.value;
  desc.value = function (...args: unknown[]) {
    console.log(`→ ${key}`, args);
    return orig.apply(this, args);
  };
}
```

**Stage 3 standard (TS 5.0+).** A different, safer design. Signature is `(value, context)` where `context.kind` tells you what you're decorating and gives helpers like `context.addInitializer` and `context.name`. It can *return a replacement*, works with plain class fields, and requires **no** `experimentalDecorators` flag. Crucially it has **no parameter decorators** and **no `emitDecoratorMetadata`** — so it can't (yet) power reflection-based DI the way the legacy system does.

```ts
// Stage 3 method decorator: (value, context)
function logged<T extends (...a: any[]) => any>(
  orig: T,
  ctx: ClassMethodDecoratorContext
) {
  return function (this: unknown, ...args: Parameters<T>) {
    console.log(`→ ${String(ctx.name)}`, args);
    return orig.call(this, ...args);
  } as T;
}
```

**Evaluation order is a trap.** Decorator *expressions* evaluate top-to-bottom, but the decorators *apply* bottom-to-top (innermost first) — like function composition `f(g(x))`. For a stack `@a @b method()`, `b` wraps first, then `a` wraps `b`'s result.

## 💻 Code

```ts
// Same intent, both worlds. Legacy mutates the descriptor in place:
class ApiLegacy {
  @logged                     // experimentalDecorators: true
  fetch(id: string) { /* ... */ }
}

// Stage 3 returns a replacement — no descriptor mutation, no flags:
class ApiModern {
  @logged                     // TS 5.0 default
  fetch(id: string) { /* ... */ }
}
```

```ts
// Class decorator returning a subclass (Stage 3) — the "replace the declaration" power
function withId<T extends new (...a: any[]) => object>(Base: T, _c: ClassDecoratorContext) {
  return class extends Base {
    id = crypto.randomUUID();
  };
}
@withId class Widget {}
// new Widget().id is present at runtime, but note: the added field
// is NOT visible on the static type unless you also declare it.
```

## ⚖️ Trade-offs

- **Legacy decorators are a dead branch that half the ecosystem depends on.** Angular, NestJS, TypeORM, and class-validator are built on `emitDecoratorMetadata`, which Stage 3 doesn't provide. You cannot migrate those to standard decorators today. For *new* framework-agnostic code, use Stage 3.
- **Decorators hide control flow.** A method's behaviour can be silently rewritten by an annotation defined in another file. That's expressive for cross-cutting concerns (logging, memoisation, access control) and genuinely hard to debug when it goes wrong. Reserve them for concerns that are truly orthogonal to the logic.
- **They don't reshape the static type by default.** A decorator that adds a field at runtime doesn't make TypeScript aware of it (Stage 3 improved this but it's still limited). If you need the type, you often need a separate declaration.

## 💣 Gotchas interviewers probe

- **"There are two decorator systems"** — naming legacy vs Stage 3, and that they have incompatible signatures (`target, key, descriptor` vs `value, context`), is the senior signal.
- **`emitDecoratorMetadata` is legacy-only.** DI frameworks that read parameter types via `reflect-metadata` *cannot* run on standard decorators. This is the #1 reason teams stay on `experimentalDecorators`.
- **Apply order is bottom-up.** `@a @b` composes as `a(b(x))`; expressions evaluate top-down but application is inner-first. Get the direction wrong and stacked decorators misbehave.
- **No parameter decorators in Stage 3 (yet).** Constructor-injection patterns don't port over.
- **Decorators run at class definition, once.** They're not per-instance hooks — instance-level setup goes through `addInitializer`, not the decorator body.
- **Plain functions can't be decorated** — decorators are class-bound (classes, methods, accessors, fields, and in legacy, parameters).

## 🎯 Say this in the interview

> "A decorator is a function that runs at class-definition time to observe or replace a declaration — it fires once, not per instance. The thing I'd flag immediately is that there are two incompatible systems: TypeScript's legacy `experimentalDecorators`, with a `target/key/descriptor` signature and `emitDecoratorMetadata`, and the TC39 Stage 3 standard that shipped in TS 5.0 with a `value/context` signature and no metadata emit. That distinction is load-bearing because Angular, NestJS, and TypeORM are built on the legacy metadata reflection, so they can't move to standard decorators yet — meanwhile new framework-agnostic code should use Stage 3. The other detail I keep straight is application order: stacked decorators apply bottom-up, like function composition. And I use them sparingly, because they move behaviour off-screen into an annotation, which is powerful for cross-cutting concerns and painful to debug for anything else."

## 🔗 Go deeper

- [TS Handbook — Decorators (Stage 3)](https://www.typescriptlang.org/docs/handbook/decorators.html) — the current standard decorators reference.
- [TS 5.0 release notes — Decorators](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#decorators) — what changed and why the signature is different.
- [TC39 decorators proposal](https://github.com/tc39/proposal-decorators) — the spec the standard implementation follows.
- [MDN — `Reflect`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect) — the reflection surface `reflect-metadata` builds on.
