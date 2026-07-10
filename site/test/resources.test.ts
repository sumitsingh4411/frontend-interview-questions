// Integrity checks for the curated Learn & Practice resource sets. These guard the
// invariants the website render and the markdown injector both rely on.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RESOURCES } from '../src/lib/resources.ts';
import { BANKS, type BankSlug } from '../src/lib/sections.ts';

const allFor = (slug: BankSlug) => [...RESOURCES[slug].read, ...(RESOURCES[slug].practice ?? [])];

test('every bank has a resource set', () => {
  for (const bank of BANKS) {
    assert.ok(RESOURCES[bank.slug], `missing resources for bank "${bank.slug}"`);
  }
});

test('no resource set without a bank', () => {
  const slugs = new Set(BANKS.map((b) => b.slug));
  for (const key of Object.keys(RESOURCES)) {
    assert.ok(slugs.has(key as BankSlug), `resources define unknown bank "${key}"`);
  }
});

test('every bank has at least one thing to read', () => {
  for (const bank of BANKS) {
    assert.ok(RESOURCES[bank.slug].read.length >= 1, `"${bank.slug}" has no read links`);
  }
});

test('every link is https, labelled, and annotated', () => {
  for (const bank of BANKS) {
    for (const r of allFor(bank.slug)) {
      assert.match(r.url, /^https:\/\/[^\s]+$/, `${bank.slug}: bad url ${r.url}`);
      assert.ok(r.label.trim().length > 0, `${bank.slug}: empty label`);
      assert.ok(r.note && r.note.trim().length > 0, `${bank.slug}: "${r.label}" has no note`);
    }
  }
});

test('no duplicate url within a bank', () => {
  for (const bank of BANKS) {
    const urls = allFor(bank.slug).map((r) => r.url);
    assert.equal(new Set(urls).size, urls.length, `${bank.slug} has a duplicate url`);
  }
});

test('hands-on banks offer a place to practice', () => {
  for (const slug of ['dsa', 'machine-coding', 'build-your-own'] as BankSlug[]) {
    assert.ok((RESOURCES[slug].practice?.length ?? 0) >= 1, `"${slug}" should have practice links`);
  }
});
