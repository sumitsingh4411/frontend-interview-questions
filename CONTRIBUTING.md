# 🤝 Contributing

This repo is **community-owned** and gets better with every PR. Whether you're fixing a typo, adding a better link, contributing a full solution, or sharing a question you got asked — thank you. 🙏

---

## Ways to contribute

| Effort | Contribution | How |
|:------:|--------------|-----|
| 🟢 5 min | Fix a broken/outdated link | Edit the row, open a PR |
| 🟢 5 min | Add a better "best resource" | Replace the link, say why in the PR |
| 🟡 15 min | Add a missing **topic row** to a section table | Follow the table schema below |
| 🟡 30 min | Add a real **interview question** to a [company guide](20-company-guides/) | Include role + year if you can |
| 🔴 2h+ | Write a full **flagship solution** | Copy [`TEMPLATE.md`](TEMPLATE.md) |

---

## The table schema (section READMEs)

Every section index uses the **same columns** so the repo stays consistent and searchable:

```markdown
| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Event Loop | 🟡 | 30m | `#async` `#internals` | [Resource ⭐](https://…) |
```

Rules:
- **Difficulty:** 🟢 Easy · 🟡 Medium · 🔴 Hard (interview-frequency + conceptual depth)
- **Time:** rough self-study estimate — `15m`, `1h`, `2h`
- **Tags:** reuse existing tags where possible (lowercase, `#kebab-case`) so cross-topic discovery works
- **Best Resources:** 1–3 links max. Mark the top pick with ⭐. Prefer canonical, free, evergreen sources (MDN, web.dev, react.dev, javascript.info, patterns.dev). Add a 3–5 word "why" when it isn't obvious.

## Adding a flagship solution

1. Copy [`TEMPLATE.md`](TEMPLATE.md) into the right section folder (e.g. `15-system-design/design-video-player.md`).
2. Fill **every** section — don't leave placeholders.
3. Add a linked row to that section's `README.md` table and, if it's top-tier, to the **Flagship** list in the root [`README.md`](README.md).
4. Cross-link related topics with relative paths.

---

## Quality bar

- ✅ **Interview-worthy** — would this actually come up? If not, leave it out.
- ✅ **No duplicates** — search first (`grep -ri "topic name"`). Extend the existing entry instead.
- ✅ **Links work and are free** — no paywalls where a free equivalent exists; no link-farms.
- ✅ **Neutral & accurate** — describe trade-offs, don't evangelize a single library.
- ✅ **Consistent naming** — kebab-case files, numbered sections, the table schema above.

## PR checklist

- [ ] Follows the table schema / template
- [ ] Links tested (they open, they're relevant)
- [ ] No duplicate topic
- [ ] Difficulty + time + tags filled
- [ ] Cross-links use relative paths

## Ground rules

Be kind, assume good intent, keep it about the content. By contributing you agree your work is released under the repo's [MIT License](LICENSE).

---

**New here?** Look for the smallest useful change — a better link is a perfect first PR. 🚀
