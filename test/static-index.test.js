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

test('frontend is intentionally scoped to Somali Region', () => {
  assert.match(html, /DRDIP-II Somali Region Monitoring Dashboard/);
  assert.match(html, /Somali Region geographic hierarchy and filters/);
  assert.match(html, /Region locked/);
  assert.doesNotMatch(html, /DRDIP-II National Field Monitoring Dashboard/);
});
