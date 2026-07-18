<div align="center">

# Screen readers (how they work)

<sub>♿ Accessibility · 🟡 Medium · ⏱ 45m · `#screen-readers`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A screen reader turns the accessibility tree into speech/braille and gives users their *own* navigation model — by heading, landmark, form field, or link — on top of tabbing. It reads **role + name + state**, not your visuals, and it has two modes that change what your keystrokes even mean.

---

## 🧠 Mental model

Sighted users scan a page in parallel — eyes jump to the heading, the search box, the nav. A screen-reader user perceives it **serially**, one node at a time, through audio. To make that survivable, the screen reader is not a "read top to bottom" machine; it's a **navigation tool**. The user asks it: "list all headings", "next landmark", "next form field", "next button", and jumps directly. This is why a correct heading outline and real landmarks aren't nice-to-haves — they're the *table of contents and street signs* the user steers by.

The other half of the model: the screen reader announces each element as **name, role, state** — "Email, edit text, required" or "Mute, toggle button, pressed". Everything you do in markup exists to make those three announcements correct. If your custom toggle announces "clickable" instead of "toggle button, pressed", the user is lost.

## ⚙️ How it actually works

The stack, top to bottom: **your DOM/CSS → the browser's accessibility tree → the OS accessibility API → the screen reader → speech synthesiser / braille display.** The screen reader sits *outside* the browser and queries the OS API, which is why it can read any app, and why it only ever sees what the browser chose to expose.

The detail most developers miss is the **two interaction modes** (JAWS/NVDA call them browse vs focus/forms mode; VoiceOver has an analogous split):

| | Browse / reading mode | Focus / forms mode |
|---|---|---|
| Purpose | Read & navigate the document | Interact with a control |
| Keys | Arrows, `H`, `D`, `F`, `B` reposition a **virtual cursor** | Keys pass through to the widget |
| Triggered by | Default on a page | Auto on focusing an input, or manually |

In browse mode the screen reader **intercepts your keystrokes** — `H` means "next heading", it never reaches the page. So a custom widget that listens for `h` or single-letter shortcuts silently does nothing until the user is in forms mode. This is *the* reason "it works with my keyboard handler" isn't the same as "it works with a screen reader": the screen reader ate the key.

Screen readers also maintain a **virtual buffer** — a snapshot of the page. Dynamic DOM changes may not reach the user until the buffer refreshes, which is precisely why **live regions** (`aria-live`) exist: they're the sanctioned channel to say "announce this change now" without the user navigating to it.

The big four in practice: **NVDA** (free, Windows, Firefox/Chrome — the developer's testing default), **JAWS** (paid, Windows, enterprise standard), **VoiceOver** (built into macOS/iOS, Safari), **TalkBack** (Android). They differ enough that "works in one" ≠ "works in all" — VoiceOver + Safari, in particular, handles some ARIA differently.

## 💻 Code

Give the reader something to navigate — structure is the feature:

```html
<!-- Landmarks = one-keystroke jumps. Name duplicated regions. -->
<header>…</header>
<nav aria-label="Primary">…</nav>
<main>
  <h1>Orders</h1>          <!-- exactly one h1: the page's title -->
  <h2>Recent</h2>          <!-- outline the user tabs through by heading -->
    <h3>Today</h3>
</main>
<aside aria-label="Filters">…</aside>
```

Make a state audible, not just visible:

```html
<!-- ❌ Colour-only "on". A screen reader announces "Notifications, button" —
     the state is invisible to it. -->
<button class="is-on">Notifications</button>

<!-- ✅ Announced as "Notifications, toggle button, pressed" -->
<button aria-pressed="true">Notifications</button>
```

Announce something that happens off-cursor:

```html
<!-- Polite live region: appended text is spoken without moving focus. -->
<div aria-live="polite" class="sr-only" id="status"></div>
<script>
  document.getElementById('status').textContent = 'Draft saved';
</script>
```

## ⚖️ Trade-offs

- **Testing with a screen reader is essential and not sufficient on its own.** Automated tools miss context; a screen reader reveals the *lived* experience — but you must test the pairing that matters (NVDA+Firefox, VoiceOver+Safari), because behaviour genuinely diverges. Pick at least two.
- **More announcements ≠ more accessible.** Over-labelling, redundant `aria-label`s, and chatty live regions create verbosity that drives users to *disable* your feature. Silence between meaningful announcements is a feature.
- **Don't design around one screen reader's quirks.** Coding to a JAWS-specific behaviour can break NVDA and VoiceOver. Build to the spec (correct roles/names/states); treat SR bugs as bugs, not the contract.

## 💣 Gotchas interviewers probe

- **Browse mode eats your keystrokes.** Single-letter keyboard shortcuts and many custom `keydown` handlers don't fire while the virtual cursor is active. If you don't know browse vs forms mode, you can't explain why "my keyboard works but the screen reader doesn't".
- **Tab order ≠ reading order… except it should match DOM order.** Screen readers read in **DOM order**, while CSS (flex `order`, grid placement, `position`) can reorder the *visual* layout. A visually-logical page can read as nonsense. Keep DOM order meaningful.
- **Dynamic changes are silent by default.** Injecting a toast or error into the DOM says nothing to a screen reader unless it's in a live region or you move focus to it.
- **"Works with keyboard" ≠ "works with screen reader."** Keyboard operability is necessary but the reader also needs correct role/name/state to *describe* what the key did.
- **VoiceOver + Safari is its own dialect.** Some ARIA patterns (certain `aria-live`, `role="alert"`, table semantics) behave differently there — test it explicitly, don't assume Chrome parity.

## 🎯 Say this in the interview

> "I think of a screen reader as a navigation tool, not a text-to-speech pass over the page. The user perceives serially, so they steer by structure — 'next heading', 'next landmark', 'next form field' — which is why a correct heading outline and real landmarks are load-bearing, not decoration. It reads each node as name, role, state, so my markup exists to make those three correct: a toggle should announce 'toggle button, pressed', not 'clickable'. The detail I always raise is that screen readers have a browse mode where they intercept keystrokes for their own navigation, so 'my keyboard handler works' isn't the same as 'the screen reader works' — the key may never reach my code. And dynamic changes are silent unless they're in a live region. I test the real pairings, at least NVDA with Firefox and VoiceOver with Safari, because their behaviour genuinely differs."

## 🔗 Go deeper

- [web.dev — How screen readers work](https://web.dev/learn/accessibility/screen-readers) — the mental model and testing basics.
- [WebAIM — Screen Reader User Survey](https://webaim.org/projects/screenreadersurvey9/) — which readers/browsers real users pair, with numbers.
- [Deque — Screen reader keyboard shortcuts (NVDA/JAWS/VoiceOver)](https://dequeuniversity.com/screenreaders/) — browse-mode navigation keys per reader.
- [MDN — ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions) — the sanctioned way to announce dynamic change.
