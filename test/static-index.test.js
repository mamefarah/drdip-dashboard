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

test('frontend is locked to the Somali Region, per README scope', () => {
  assert.match(html, /DRDIP-II Somali Region Monitoring Dashboard/);
  assert.match(html, /Somali Region/);
  assert.doesNotMatch(html, /National Field Monitoring Dashboard/);
});
