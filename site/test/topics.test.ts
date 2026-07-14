// Tests for the section-README topic-table parser that powers the deep-dive pages.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTopicTables } from '../src/lib/transform.ts';
import { findOrphanDeepDives, getDeepDives, getTopics } from '../src/lib/content.ts';

const SAMPLE = `
# 01 · Fundamentals

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard

## The platform

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| How the web works (request → render) | 🟢 | 30m | \`#networking\` \`#basics\` | [MDN: how the web works ⭐](https://developer.mozilla.org/x) |
| [The DOM](topics/the-dom.md) | 🟢 | 45m | \`#dom\` \`#basics\` | [javascript.info: DOM ⭐](https://javascript.info/document) |

## Rendering & delivery

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Event Loop | 🔴 | 1h | \`#async\` | [javascript.info ⭐](https://javascript.info/event-loop) |

## Not a topic table

| Problem | Difficulty | Time | Resource |
|---------|:----------:|:----:|----------|
| Two Sum | 🟢 | 20m | [LeetCode](https://leetcode.com) |
`;

test('parses only "Topic" tables, ignoring other table shapes', () => {
  const rows = parseTopicTables(SAMPLE);
  assert.equal(rows.length, 3);
  assert.ok(!rows.some((r) => r.title === 'Two Sum'), 'Problem table must be ignored');
});

test('extracts title, slug, difficulty, time and tags', () => {
  const [first] = parseTopicTables(SAMPLE);
  assert.equal(first.title, 'How the web works (request → render)');
  assert.equal(first.slug, 'how-the-web-works-request-render');
  assert.equal(first.difficulty, 'easy');
  assert.equal(first.time, '30m');
  assert.deepEqual(first.tags, ['networking', 'basics']);
});

test('reads the outbound resource link and strips the star', () => {
  const [first] = parseTopicTables(SAMPLE);
  assert.equal(first.resource?.label, 'MDN: how the web works');
  assert.equal(first.resource?.url, 'https://developer.mozilla.org/x');
});

test('a plain row and an already-linked row parse to the same title/slug', () => {
  const rows = parseTopicTables(SAMPLE);
  const linked = rows.find((r) => r.title === 'The DOM')!;
  assert.equal(linked.slug, 'the-dom');
  assert.equal(linked.href, 'topics/the-dom.md');
  // the unlinked row carries no href
  assert.equal(rows[0].href, undefined);
});

test('attributes each row to the "##" group it sits under', () => {
  const rows = parseTopicTables(SAMPLE);
  assert.equal(rows[0].group, 'The platform');
  assert.equal(rows[2].group, 'Rendering & delivery');
  assert.equal(rows[2].title, 'Event Loop');
  assert.equal(rows[2].difficulty, 'hard');
});

// ---- against the real repo ----

test('no orphan deep dives (every topics/*.md has a table row)', () => {
  const orphans = findOrphanDeepDives();
  assert.deepEqual(orphans, [], `unreachable deep-dive pages: ${orphans.join(', ')}`);
});

test('every linked row in a README resolves to a real deep-dive file', () => {
  for (const t of getTopics('01-fundamentals')) {
    if (t.href) assert.ok(t.hasDeepDive, `"${t.title}" is linked but has no topics/${t.slug}.md`);
  }
});

test('the pilot section has its 8 deep dives, all with metadata', () => {
  const dives = getDeepDives('01-fundamentals');
  assert.equal(dives.length, 8);
  for (const d of dives) {
    assert.ok(d.title.length > 0);
    assert.ok(['easy', 'medium', 'hard'].includes(d.difficulty), `${d.slug}: no difficulty`);
    assert.match(d.time, /^\d+[mh]$/, `${d.slug}: bad time "${d.time}"`);
    assert.ok(d.tags.length > 0, `${d.slug}: no tags`);
    assert.equal(d.group, 'The platform');
  }
});
