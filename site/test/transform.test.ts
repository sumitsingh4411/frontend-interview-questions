import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  questionId,
  parseQuestion,
  repoPathToRoute,
  resolveHref,
  stripGithubChrome,
  extractTitle,
  parseReactBank,
  parseBankCategoryFile,
} from '../src/lib/transform.ts';

const B = '/frontend-interview-questions';

test('questionId is stable — saved progress must keep counting', () => {
  // Anchored to an id already written into users' localStorage. Never change.
  assert.equal(questionId('Container With Most Water'), 'a6d9md');
  assert.equal(questionId('Two Sum'), questionId('Two Sum'));
  assert.notEqual(questionId('Two Sum'), questionId('Two Sum II'));
  assert.match(questionId('Valid Palindrome'), /^[a-z0-9]+$/);
});

test('parseQuestion reads difficulty emoji and cleans text', () => {
  assert.deepEqual(parseQuestion('🟢 Valid Palindrome'), { difficulty: 'easy', text: 'Valid Palindrome' });
  assert.deepEqual(parseQuestion('🟡 3 Sum'), { difficulty: 'medium', text: '3 Sum' });
  assert.deepEqual(parseQuestion('🔴 Trapping Rain Water'), { difficulty: 'hard', text: 'Trapping Rain Water' });
  assert.deepEqual(parseQuestion('No emoji here'), { difficulty: 'none', text: 'No emoji here' });
});

test('parseQuestion unescapes pipes and strips wrapping bold', () => {
  assert.equal(parseQuestion('🟡 a \\| b').text, 'a | b');
  assert.equal(parseQuestion('🟢 **Debounce**').text, 'Debounce');
});

test('repoPathToRoute maps every published shape', () => {
  assert.equal(repoPathToRoute('README.md', B), `${B}/`);
  assert.equal(repoPathToRoute('FAQ.md', B), `${B}/faq/`);
  assert.equal(repoPathToRoute('ROADMAP.md', B), `${B}/roadmap/`);
  assert.equal(repoPathToRoute('03-javascript', B), `${B}/sections/03-javascript/`);
  assert.equal(repoPathToRoute('03-javascript/README.md', B), `${B}/sections/03-javascript/`);
  assert.equal(
    repoPathToRoute('16-machine-coding/nested-comments.md', B),
    `${B}/sections/16-machine-coding/nested-comments/`,
  );
  assert.equal(repoPathToRoute('21-dsa-for-frontend/question-bank/README.md', B), `${B}/banks/dsa/`);
  assert.equal(
    repoPathToRoute('21-dsa-for-frontend/question-bank/two-pointers.md', B),
    `${B}/banks/dsa/two-pointers/`,
  );
  assert.equal(repoPathToRoute('06-react/question-bank.md', B), `${B}/banks/react/`);
  assert.equal(repoPathToRoute('LICENSE', B), null);
  assert.equal(repoPathToRoute('CONTRIBUTING.md', B), null);
});

test('resolveHref classifies and normalizes relative paths', () => {
  assert.deepEqual(resolveHref('21-dsa-for-frontend/README.md', 'https://neetcode.io'), {
    kind: 'external',
    value: 'https://neetcode.io',
  });
  assert.deepEqual(resolveHref('06-react/question-bank.md', '#react-core'), {
    kind: 'anchor',
    value: '#react-core',
  });
  // ../ climbs out of the section folder
  assert.deepEqual(resolveHref('21-dsa-for-frontend/README.md', '../16-machine-coding/nested-comments.md'), {
    kind: 'repo',
    value: '16-machine-coding/nested-comments.md',
  });
  // sibling file
  assert.deepEqual(resolveHref('03-javascript/README.md', 'question-bank/README.md'), {
    kind: 'repo',
    value: '03-javascript/question-bank/README.md',
  });
  // up two levels from a bank category page
  assert.deepEqual(resolveHref('21-dsa-for-frontend/question-bank/two-pointers.md', '../../README.md'), {
    kind: 'repo',
    value: 'README.md',
  });
  // preserves the hash
  assert.deepEqual(resolveHref('06-react/README.md', 'question-bank.md#hooks'), {
    kind: 'repo',
    value: '06-react/question-bank.md#hooks',
  });
});

test('stripGithubChrome removes banners, badges, legend and back-links', () => {
  const md = [
    '<div align="center">',
    '',
    '<img src="banner.svg" alt="03 · JavaScript" width="100%" />',
    '',
    '</div>',
    '',
    'The language, deeply.',
    '',
    '> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)',
    '',
    '[![Stars](https://img.shields.io/github/stars/x?y=z)](https://github.com/x)',
    '',
    '> 📚 **[Full question bank](question-bank/README.md)**',
    '',
    '⭐ **Flagship:** [Promise polyfills](promise-polyfills.md)',
    '',
  ].join('\n');
  const out = stripGithubChrome(md);
  assert.ok(!out.includes('<div'), 'centered div removed');
  assert.ok(!out.includes('banner.svg'), 'banner image removed');
  assert.ok(!out.includes('img.shields.io'), 'badges removed');
  assert.ok(!out.includes('Back to all sections'), 'legend/back-link removed');
  // The site renders a first-class bank card, so the repo-nav callout is chrome.
  assert.ok(!out.includes('Full question bank'), 'bank callout removed');
  assert.ok(out.includes('The language, deeply.'), 'prose kept');
  assert.ok(out.includes('Flagship'), 'flagship pointer kept');
});

test('stripGithubChrome keeps per-problem difficulty metadata on flagship pages', () => {
  const md = [
    '# Build Nested Comments (Tree)',
    '',
    '> **Difficulty:** 🟡 Medium · **Est. time:** `45m` · **Tags:** `#recursion`',
    '',
    '## 1. The Question',
  ].join('\n');
  const out = stripGithubChrome(md);
  assert.ok(out.includes('**Difficulty:** 🟡 Medium'), 'single-difficulty metadata survives');
});

test('extractTitle pulls the H1 out of the body', () => {
  const { title, body } = extractTitle('# Build Nested Comments\n\nSome prose.\n');
  assert.equal(title, 'Build Nested Comments');
  assert.ok(!body.includes('# Build Nested Comments'));
  assert.ok(body.includes('Some prose.'));
});

test('parseReactBank buckets by ### heading and skips helper lines', () => {
  const md = [
    '### React Core  ',
    '<sub>2 questions</sub>',
    '',
    '- 🟡 Virtual DOM & Reconciliation',
    '- 🟢 Keys in Lists',
    '',
    '### React Hooks',
    '',
    '- 🟡 useMemo vs useCallback',
  ].join('\n');
  const cats = parseReactBank(md);
  assert.equal(cats.length, 2);
  assert.equal(cats[0].title, 'React Core');
  assert.equal(cats[0].slug, 'react-core');
  assert.equal(cats[0].questions.length, 2);
  assert.deepEqual(cats[0].questions[1], { difficulty: 'easy', text: 'Keys in Lists' });
  assert.equal(cats[1].questions.length, 1);
});

test('parseBankCategoryFile ignores nav bullets and reads questions', () => {
  const md = [
    '# Two Pointers',
    '<sub>🧠 DSA · **16 questions**</sub>',
    '',
    '---',
    '',
    '- 🟡 Container With Most Water',
    '- 🟢 Valid Palindrome',
    '- 🔴 Trapping Rain Water',
  ].join('\n');
  const qs = parseBankCategoryFile(md);
  assert.equal(qs.length, 3);
  assert.deepEqual(qs[0], { difficulty: 'medium', text: 'Container With Most Water' });
  assert.deepEqual(qs[2], { difficulty: 'hard', text: 'Trapping Rain Water' });
});
