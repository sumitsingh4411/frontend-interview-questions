# JS Deep-Dive: Promise Polyfills + Debounce/Throttle

> **Difficulty:** 🟡 Medium · **Est. time:** `1.5h` · **Tags:** `#polyfill` `#async` `#patterns`

**Asked at:** _Google, Meta, Amazon, Uber (near-universal)_ · **Related:** [Autocomplete](../15-system-design/design-autocomplete.md) · [Event Bus](../18-design-patterns/observer-event-bus.md)

---

## 1. Why this matters

`debounce`, `throttle`, and the `Promise.*` combinators are the most-asked "implement this from scratch" questions in frontend loops. They test async understanding, closures, `this`, and edge-case thinking.

---

## 2. Debounce

**Definition:** delay invoking `fn` until `wait` ms have passed since the *last* call. Great for search inputs, resize, autosave.

```js
function debounce(fn, wait = 300, { leading = false } = {}) {
  let timer = null;
  let calledLeading = false;

  function debounced(...args) {
    const runLeading = leading && !timer && !calledLeading;
    if (timer) clearTimeout(timer);

    if (runLeading) {
      fn.apply(this, args);
      calledLeading = true;
    }
    timer = setTimeout(() => {
      if (!leading) fn.apply(this, args); // trailing edge
      timer = null;
      calledLeading = false;
    }, wait);
  }

  debounced.cancel = () => { clearTimeout(timer); timer = null; calledLeading = false; };
  return debounced;
}
```

**Talk about:** preserving `this` (`apply`), forwarding args, `cancel()` for cleanup, leading vs trailing edge.

## 3. Throttle

**Definition:** invoke `fn` at most once per `wait` ms. Great for scroll, mousemove, rAF-like sampling.

```js
function throttle(fn, wait = 300) {
  let last = 0;
  let timer = null;

  return function throttled(...args) {
    const now = Date.now();
    const remaining = wait - (now - last);

    if (remaining <= 0) {            // leading edge
      if (timer) { clearTimeout(timer); timer = null; }
      last = now;
      fn.apply(this, args);
    } else if (!timer) {             // trailing edge
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}
```

**Debounce vs throttle:** debounce waits for quiet; throttle guarantees a steady rate. Search box → debounce. Scroll position → throttle.

## 4. Promise polyfill (Promises/A+ shape)

```js
class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    this.value = undefined;
    this.cbs = [];
    const resolve = (v) => this.#settle('fulfilled', v);
    const reject  = (e) => this.#settle('rejected', e);
    try { executor(resolve, reject); } catch (e) { reject(e); }
  }
  #settle(state, value) {
    if (this.state !== 'pending') return;
    this.state = state; this.value = value;
    queueMicrotask(() => this.cbs.forEach(cb => cb())); // microtask timing
  }
  then(onF, onR) {
    return new MyPromise((resolve, reject) => {
      const run = () => {
        try {
          if (this.state === 'fulfilled') resolve(onF ? onF(this.value) : this.value);
          else reject(onR ? onR(this.value) : this.value);
        } catch (e) { reject(e); }
      };
      this.state === 'pending' ? this.cbs.push(run) : queueMicrotask(run);
    });
  }
}
```

**Talk about:** microtask timing (`queueMicrotask`), state machine (pending→settled once), chaining. (Full A+ also handles thenable assimilation.)

## 5. Promise combinators

```js
// all: resolves with array; rejects on first rejection
function all(promises) {
  return new Promise((resolve, reject) => {
    const out = []; let done = 0; const list = [...promises];
    if (!list.length) return resolve(out);
    list.forEach((p, i) =>
      Promise.resolve(p).then(v => { out[i] = v; if (++done === list.length) resolve(out); }, reject));
  });
}

// allSettled: never rejects; reports each outcome
function allSettled(promises) {
  return Promise.all([...promises].map(p =>
    Promise.resolve(p).then(
      value => ({ status: 'fulfilled', value }),
      reason => ({ status: 'rejected', reason }))));
}

// race: settles with the first to settle
function race(promises) {
  return new Promise((resolve, reject) =>
    [...promises].forEach(p => Promise.resolve(p).then(resolve, reject)));
}

// any: first fulfillment; rejects with AggregateError if all reject
function any(promises) {
  return new Promise((resolve, reject) => {
    const errs = []; let rejected = 0; const list = [...promises];
    if (!list.length) return reject(new AggregateError([], 'All promises were rejected'));
    list.forEach((p, i) =>
      Promise.resolve(p).then(resolve, e => {
        errs[i] = e; if (++rejected === list.length) reject(new AggregateError(errs));
      }));
  });
}
```

**Order-safety:** write results by index, not push — `all` must preserve input order regardless of resolution order.

## 6. What Interviewers Probe

- Debounce vs throttle — when each, and the leading/trailing edge.
- Preserving `this` and arguments; adding `cancel()`.
- Promise microtask timing vs `setTimeout`.
- Implementing `all` order-safely; `allSettled` vs `all`; `any` vs `race`.
- Cancellation (AbortController) layered on top.

## 7. Curated Resources

- [javascript.info: promises ⭐](https://javascript.info/promise-basics) · [microtasks](https://javascript.info/microtask-queue)
- [Promises/A+ spec](https://promisesaplus.com/)
- [MDN: Promise.all / allSettled / any / race](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [MDN: queueMicrotask](https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask)

## 8. Related Topics

- [Design Autocomplete](../15-system-design/design-autocomplete.md) — debounce in the wild
- [Event Bus](../18-design-patterns/observer-event-bus.md)
- [JavaScript section](README.md)
