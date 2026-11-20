import test from 'node:test';
import assert from 'node:assert/strict';
import { targetFromResult, validateQuery } from './logic.mjs';

test('accepts only HTTPS result for exact site', () => {
  assert.equal(targetFromResult('https://alcohub-msk.com/#catalog')?.hostname, 'alcohub-msk.com');
  assert.equal(targetFromResult('/url?q=https%3A%2F%2Falcohub-msk.com%2F')?.hostname, 'alcohub-msk.com');
  for (const url of ['https://evil.com/', 'https://alcohub-msk.com.evil.com/', 'https://www.alcohub-msk.com/', 'http://alcohub-msk.com/', 'tel:+74950959599', '/aclk?url=https://alcohub-msk.com/', 'javascript:alert(1)']) {
    assert.equal(targetFromResult(url), null, url);
  }
});

test('requires a single short query', () => {
  assert.equal(validateQuery('  доставка Москва  '), 'доставка Москва');
  for (const bad of ['', 'a\nb', 'x'.repeat(201)]) assert.throws(() => validateQuery(bad));
});
