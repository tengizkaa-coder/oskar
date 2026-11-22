import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const batch = fileURLToPath(new URL('./batch.mjs', import.meta.url));
test('dry run shows the plan without starting live sessions', () => {
  const result = spawnSync(process.execPath, [batch, '--count', '9'], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /без запросов в Google/);
  assert.match(result.stdout, /сценарий 6, iPhone 17/);
  assert.doesNotMatch(result.stdout, /РЕАЛЬНЫЙ ЗАПУСК/);
});

test('invalid report argument stops before spawning any sessions', () => {
  const result = spawnSync(process.execPath, [batch, '--live', '--report'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /укажите путь/);
  assert.doesNotMatch(result.stdout, /\[1\/1\]/);
});
