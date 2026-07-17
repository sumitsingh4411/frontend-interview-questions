<div align="center">

# WCAG & POUR principles

<sub>♿ Accessibility · 🟡 Medium · ⏱ 1h · `#wcag`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — WCAG organises every accessibility requirement under four principles — **P**erceivable, **O**perable, **U**nderstandable, **R**obust — each with testable success criteria graded A / AA / AAA. **AA is the real-world and legal bar**; if content isn't POUR, no assistive technology can rescue it.

---

## 🧠 Mental model

POUR is a checklist for *whether a human can use your thing at all*, walked in the order a person actually encounters it:

- **Perceivable** — can they get the information *in*? (Alt text for images, captions for video, sufficient colour contrast, not conveying meaning by colour alone.)
- **Operable** — can they *drive* it? (Everything works by keyboard, focus is visible and trapped nowhere, no seizure-inducing flashing, enough time to act.)
- **Understandable** — do they get what happened? (Predictable behaviour, labelled inputs, clear error messages, consistent navigation.)
- **Robust** — will it survive the *tech stack*? (Valid HTML with correct name/role/value, so today's and tomorrow's screen readers can parse it.)

The useful reframe: **POUR is a pipeline.** Content has to be perceived, then operated, then understood, and the whole thing has to be robust enough that assistive tech can relay it. A failure anywhere upstream makes everything downstream irrelevant — a beautiful understandable form is worthless if a keyboard user can't reach the submit button.

## ⚙️ How it actually works

WCAG's structure is **Principle → Guideline → Success Criterion**. You don't test "principles"; you test the ~50 *success criteria* (SC), each of which is a binary, verifiable statement. Each SC carries a conformance level:

| Level | Meaning | In practice |
|---|---|---|
| **A** | Must-have; blocking barriers | Floor. Failing A means whole groups are locked out. |
| **AA** | The target everyone means | The legal & procurement standard (ADA, Section 508, EN 301 549, EAA). |
| **AAA** | Enhanced; often not achievable site-wide | Aspire per-component; never promised globally. |

The versions matter in interviews: **2.0** (2008) was the foundation; **2.1** (2018) added mobile, touch-target, and low-vision criteria (e.g. *1.4.10 Reflow*, *1.4.11 Non-text Contrast*); **2.2** (2023) added *2.4.11 Focus Not Obscured*, *2.5.7 Dragging Movements*, and *2.5.8 Target Size (Minimum, 24px)*. Saying "WCAG 2.2 AA" signals you track the current bar, not a decade-old one.

Concrete AA criteria worth naming: **1.4.3** text contrast ≥ 4.5:1 (3:1 for large text); **1.4.11** UI/graphics contrast ≥ 3:1; **2.1.1** everything keyboard-operable; **2.4.7** focus visible; **4.1.2** name, role, value exposed for all controls; **3.3.1/3.3.2** errors identified and inputs labelled. Note the split of responsibility: 4.1.2 is *Robust* and is what ARIA and semantic HTML satisfy — the machine-readable contract with assistive tech.

## 💻 Code

WCAG is prose, but it maps to concrete markup. One snippet, four principles failing and fixed:

```html
<!-- ❌ Fails across POUR at once -->
<img src="chart.png">                          <!-- P: no text alternative (1.1.1) -->
<div onclick="submit()">Go</div>               <!-- O: not keyboard-operable (2.1.1) -->
<span style="color:red">Error</span>           <!-- U: meaning by colour only (1.4.1) -->
<input>                                          <!-- R+U: no name/label (4.1.2, 3.3.2) -->

<!-- ✅ POUR-conformant -->
<img src="chart.png" alt="Revenue up 12% in Q3">
<button type="button" onclick="submit()">Go</button>
<p class="error"><span aria-hidden="true">⚠</span> Enter a valid email</p>
<label for="email">Email</label>
<input id="email" type="email" aria-describedby="email-err">
```

The `⚠` icon plus text (not colour alone) satisfies **1.4.1 Use of Color**; the visible `<label>` tied by `for`/`id` satisfies **1.3.1**, **3.3.2**, and **4.1.2** simultaneously — one fix, several criteria, because POUR overlaps by design.

## ⚖️ Trade-offs

- **AAA is not "AA but better" — it's frequently mutually exclusive with product goals.** *1.4.6* demands 7:1 contrast; *2.2.6* demands 20-second timeout warnings. Chasing AAA site-wide can degrade design and is rarely required. Target AA globally, apply specific AAA criteria where cheap and high-value (e.g. AAA contrast on body text).
- **WCAG measures the artifact, not the experience.** You can pass every SC and still ship something painful to use — automated tools catch only ~30–40% of issues. Conformance is necessary, not sufficient; real testing needs a keyboard and a screen reader.
- **Don't treat criteria as independent boxes.** They interlock: fixing labels helps Understandable *and* Robust. Auditing SC-by-SC without the POUR mental model produces checkbox compliance that misses the actual barrier.

## 💣 Gotchas interviewers probe

- **"What does AA actually mean?"** Not "grade B" — it's the *conformance level*, the legally and contractually expected floor (ADA/Section 508/EAA). Confusing A/AA/AAA with quality tiers is a tell.
- **POUR order isn't arbitrary.** Perceivable comes first because you can't operate what you can't perceive. Reciting the letters without the pipeline logic reads as memorised.
- **Colour is under Perceivable, contrast is *two* criteria.** 1.4.1 (don't rely on colour to convey meaning) and 1.4.3 (contrast ratio) are different things — candidates conflate them.
- **"Robust" is the one people forget.** It's essentially "valid, well-formed markup with correct name/role/value (4.1.2)" so current and future AT can parse it — this is *why* semantic HTML and ARIA matter to WCAG.
- **WCAG has versions and they're additive.** 2.2 didn't remove 2.1; it added criteria. Quoting only "WCAG 2.0" dates you.

## 🎯 Say this in the interview

> "WCAG groups everything under POUR — Perceivable, Operable, Understandable, Robust — and I think of those as a pipeline: content has to be perceived, then operated, then understood, and the whole thing robust enough for assistive tech to relay. You don't test principles though, you test the success criteria under them, and each is graded A, AA, or AAA. AA is the bar that matters — it's what the ADA, Section 508, and the European Accessibility Act effectively require, and I target WCAG 2.2 AA specifically because 2.1 and 2.2 added mobile, reflow, focus-visibility, and 24-pixel target-size criteria. AAA I treat as per-component, not a site-wide promise, because some AAA criteria conflict with product goals. And I'm clear that passing every criterion isn't the same as being usable — automation catches maybe a third, so I still test with a keyboard and a screen reader."

## 🔗 Go deeper

- [W3C — WCAG 2 at a glance](https://www.w3.org/WAI/standards-guidelines/wcag/glance/) — the four principles and levels, one page.
- [W3C — How to Meet WCAG (Quick Reference)](https://www.w3.org/WAI/WCAG22/quickref/) — filterable list of every success criterion with techniques.
- [W3C — Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/) — the intent and edge cases behind each criterion.
- [W3C — What's new in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) — the criteria added since 2.1.
