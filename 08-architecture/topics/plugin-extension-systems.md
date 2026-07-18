<div align="center">

# Plugin / extension systems

<sub>🏛️ Architecture · 🔴 Hard · ⏱ 1h · `#extensibility`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A plugin system is a **contract plus a runtime**: you publish stable extension points (an API), you decide *when* third-party code runs and *what it can touch*, and you accept that every capability you expose becomes a promise you can never quietly break.

---

## 🧠 Mental model

Most engineers think a plugin system is "let people run their code inside my app." That's the easy 10%. The hard 90% is **containment and versioning**: you are inviting code you didn't write, can't test, and can't trust into a process your users depend on. The whole discipline is about limiting the blast radius while still being useful.

The single best design decision VS Code made is worth internalising: extensions run in a **separate Extension Host process**, and they cannot touch the DOM of the editor. They only speak to it through a typed `vscode.*` API. That one constraint is why a broken extension can't freeze the UI thread and why the editor team can refactor rendering without breaking the ecosystem. **The API is the product; the implementation is free to change underneath it.**

So the mental model is three layers: an **activation model** (when does a plugin wake up), a **capability surface** (what can it call), and a **contribution model** (how does it declare things it wants the host to render/register, without executing code).

## ⚙️ How it actually works

There are three broadly different architectures, in increasing order of safety and cost:

| Model | Isolation | Example | Cost |
|---|---|---|---|
| **In-process hooks** | None — plugin runs on your call stack | Babel, ESLint, Rollup, Vite | A bad plugin can crash/hang you |
| **Separate process / worker** | Memory + crash isolation via message passing | VS Code Extension Host, Figma | Async everything; serialisation overhead |
| **Sandboxed VM** | Capability-restricted execution | Figma plugins (QuickJS in an iframe), browser extensions | Slow, restricted API, hard to debug |

**Activation matters as much as isolation.** If every plugin ran at startup, install-time cost would be unbounded. VS Code uses `activationEvents` — a plugin declares `onLanguage:python` or `onCommand:...` and is only booted when that event fires. Lazy activation is what lets an editor ship thousands of extensions without a multi-second cold start.

**Contribution points are declarative on purpose.** Menus, commands, settings, and keybindings are declared in `package.json` (`contributes`), *not* registered by running code. The host can render a plugin's menu item before the plugin's JavaScript ever executes. Declarative manifests are inspectable, cacheable, and safe.

## 💻 Code

A minimal but real in-process plugin runtime — the shape almost every JS tool uses:

```ts
// The host defines the CONTRACT (the extension points), not the plugins.
interface Plugin {
  name: string;
  // Hooks are named, versioned, and each returns/receives typed data.
  transform?(code: string, ctx: Ctx): string | Promise<string>;
}

class PluginHost {
  constructor(private plugins: Plugin[]) {}

  async runTransform(code: string, ctx: Ctx) {
    for (const p of this.plugins) {
      if (!p.transform) continue;
      try {
        // ✅ Isolate failure: one bad plugin must not kill the pipeline.
        code = await p.transform(code, ctx);
      } catch (err) {
        ctx.report(`plugin "${p.name}" failed`, err); // degrade, don't crash
      }
    }
    return code;
  }
}
```

The two senior details: **hooks pass an explicit `ctx`** (the only door to host capabilities — logging, file access, config) rather than letting plugins reach into globals, and **each plugin is wrapped in try/catch** so a third-party crash degrades to a warning instead of taking down the host.

## ⚖️ Trade-offs

- **Every extension point is a permanent API commitment.** You can add capabilities forever; you can almost never remove one without breaking the ecosystem. Expose the *minimum* surface that makes plugins useful — you can always widen later, never narrow.
- **In-process is fast but fragile; out-of-process is safe but async.** Moving to a worker/Extension Host means every API call is now a `postMessage` round-trip — you cannot offer synchronous DOM access. That async tax is why Figma plugins can't just read the canvas like a variable.
- **Don't build a plugin system before you have the second consumer.** Premature extensibility freezes your internals into a public API while you still need to change them daily. The right time is when *other teams* are patching your core to get their feature in.
- **Ordering and conflicts are your problem, not the plugin's.** Two plugins that both want to own "save" will fight. You need a deterministic order (priority, declaration order) and a conflict-resolution story.

## 💣 Gotchas interviewers probe

- **"How do you stop a plugin from breaking the host?"** The answer they want is *isolation strategy* — separate process, error boundaries per hook, timeouts on async hooks — not "code review the plugins."
- **Versioning the API is the real hard part.** VS Code's `engines.vscode` field pins the minimum API version; the host must run old plugins against new code. Additive-only evolution + capability detection beats semver breaks.
- **Capability leakage.** If your `ctx` exposes the raw `fs` module or `window`, you've given every plugin god mode. Pass *narrow, purpose-built* functions, not the underlying object.
- **Activation cost is invisible until it's fatal.** A hundred plugins each doing work at startup is death by a thousand cuts. Lazy activation events are not optional at scale.
- **"Just use `eval`/dynamic `import()`" is a trap answer.** It runs untrusted code on your thread with your privileges. The interviewer wants to hear *sandboxing*, not code loading.

## 🎯 Say this in the interview

> "I treat a plugin system as a contract plus a runtime. The contract is a deliberately narrow, additive-only API — every extension point I expose is something I can never quietly break, so I ship the minimum surface that's useful. The runtime is about containment: where does third-party code run and what can it touch? VS Code's model is the one I reach for — extensions live in a separate host process, they can't touch the editor DOM, and they only speak through the typed `vscode` API, which is exactly why a broken extension can't freeze the UI. I also make contributions declarative in a manifest so the host can render a plugin's menus before its code runs, and I use lazy activation events so install count doesn't blow up startup. And I wrap every hook call in an error boundary, because one bad plugin degrading gracefully beats one bad plugin taking down the app."

## 🔗 Go deeper

- [VS Code — Extension API](https://code.visualstudio.com/api) — the reference design for activation events, contribution points, and the Extension Host.
- [VS Code — Extension Host](https://code.visualstudio.com/api/advanced-topics/extension-host) — why extensions run out-of-process and what that costs.
- [Figma — How our plugin system works](https://www.figma.com/blog/how-we-built-the-figma-plugin-system/) — sandboxing untrusted code in the browser with a JS VM.
- [Rollup — Plugin development](https://rollupjs.org/plugin-development/) — the canonical in-process hook pipeline design.
