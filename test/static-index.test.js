'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('frontend does not expose or persist Kobo API tokens', () => {
  assert.doesNotMatch(html, /kobo_token/i);
  assert.doesNotMatch(html, /Authorization['"]?\s*:/);
  assert.doesNotMatch(html, /API token/i);
});

test('frontend is national instead of Somali-only', () => {
  assert.match(html, /DRDIP-II National Field Monitoring Dashboard/);
  assert.doesNotMatch(html, /function\s+isSomali/i);
  assert.doesNotMatch(html, /SOMALI_NAMES/);
  assert.doesNotMatch(html, /ALL_DATA\s*=\s*RAW_DATA\.filter/i);
});
