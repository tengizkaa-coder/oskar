import test from 'node:test';
import assert from 'node:assert/strict';
import { DEVICE_PROFILES, categoryPath, deviceForScenario, randomBetween } from './scenarios.mjs';
import { devices } from 'playwright';

test('scenario chooses mobile Chromium and WebKit touch device presets', () => {
  assert.equal(new Set(DEVICE_PROFILES).size, 6);
  for (let n = 0; n < 12; n++) {
    const name = deviceForScenario(n);
    const preset = devices[name];
    assert(preset && preset.isMobile && preset.hasTouch);
    assert.equal(preset.defaultBrowserType, name.startsWith('iPhone') ? 'webkit' : 'chromium');
  }
  assert.throws(() => deviceForScenario(-1));
});

test('delays stay within bounds, endpoints included', () => {
  assert.equal(randomBetween(30, 90, () => 0), 30);
  assert.equal(randomBetween(30, 90, () => 0.999999), 90);
  assert.throws(() => randomBetween(10, 5));
  assert.throws(() => randomBetween(0, 5, () => 1));
});

test('journeys have up to three distinct existing categories', () => {
  for (const available of [0, 1, 2, 5, 10]) {
    for (const scenario of [0, 1, 2, 3, 4, 5]) {
      for (const rng of [() => 0, () => 0.999999, () => 0.5]) {
        const path = categoryPath(available, scenario, rng);
        assert.equal(path.length, Math.min(available, 1 + scenario % 3));
        assert.equal(new Set(path).size, path.length);
        assert(path.every(index => index >= 0 && index < available));
      }
    }
  }
  assert.throws(() => categoryPath(1, -1));
  assert.throws(() => categoryPath(1001, 0));
});
