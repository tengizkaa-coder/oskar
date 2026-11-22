import { readFile, mkdir, appendFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { validateQuery } from './logic.mjs';
import { deviceForScenario, randomBetween } from './scenarios.mjs';

const args = process.argv.slice(2);
const countPosition = args.indexOf('--count');
const rawCount = countPosition === -1 ? '1' : args[countPosition + 1];
if (!/^\d+$/.test(rawCount || '') || Number(rawCount) < 1 || Number(rawCount) > 100) {
  console.error('Укажите --count от 1 до 100.');
  process.exit(1);
}
const count = Number(rawCount);
const live = args.includes('--live');
let queries;
try {
  queries = JSON.parse(await readFile(new URL('./queries.json', import.meta.url), 'utf8'));
  if (!Array.isArray(queries) || !queries.length) throw new Error('Список запросов пуст.');
  queries = queries.map(validateQuery);
} catch (error) {
  console.error(`Ошибка списка запросов: ${error.message}`);
  process.exit(1);
}

console.log(`${live ? 'РЕАЛЬНЫЙ ЗАПУСК' : 'ПЛАН, без запросов в Google'}: ${count} отдельных сессий, последовательно.`);
if (!live) {
  for (let i = 0; i < count; i++) console.log(`${i + 1}. ${queries[i % queries.length]} — сценарий ${i}, ${deviceForScenario(i)}`);
  process.exit(0);
}
const reportIndex = args.indexOf('--report');
const reportValue = reportIndex < 0 ? null : args[reportIndex + 1];
if (reportIndex >= 0 && (!reportValue || reportValue.startsWith('--'))) {
  console.error('После --report укажите путь к файлу JSONL.');
  process.exit(1);
}
const reportPath = reportValue ? resolve(reportValue) : null;
if (reportPath) {
  try { await mkdir(dirname(reportPath), { recursive: true }); await appendFile(reportPath, '', { mode: 0o600 }); }
  catch (error) { console.error(`Не удалось открыть журнал: ${error.message}`); process.exit(1); }
  console.log(`Журнал: ${reportPath}`);
}
let successes = 0, missing = 0;
for (let i = 0; i < count; i++) {
  const query = queries[i % queries.length];
  console.log(`\n[${i + 1}/${count}] ${query}`);
  const startedAt = new Date().toISOString();
  const child = spawn(process.execPath, [fileURLToPath(new URL('./run.mjs', import.meta.url)), '--live', '--query', query, '--scenario', String(i)], { stdio: 'inherit' });
  const result = await new Promise(resolve => { child.once('error', error => resolve({code: null, signal: null, error: error.message})); child.once('close', (code, signal) => resolve({code, signal})); });
  const status = !result.signal && result.code === 0 ? 'visited' : !result.signal && result.code === 2 ? 'not_found' : 'stopped';
  if (reportPath) {
    const record = { startedAt, finishedAt: new Date().toISOString(), query, scenario: i, device: deviceForScenario(i), status, exitCode: result.code, signal: result.signal ?? null };
    try { await appendFile(reportPath, JSON.stringify(record) + '\n', { mode: 0o600 }); }
    catch (error) { console.error(`Ошибка записи журнала: ${error.message}. Пакет остановлен.`); process.exitCode = 1; break; }
  }
  if (result.signal || (result.code !== 0 && result.code !== 2)) {
    console.error('Пакет остановлен из-за ошибки или проверки Google. Повторного запуска нет.');
    process.exitCode = 1;
    break;
  }
  if (result.code === 0) successes++; else missing++;
  if (i + 1 < count) {
    const waitMs = randomBetween(30, 90) * 1000;
    console.log(`Пауза перед следующей сессией: ${waitMs / 1000} сек.`);
    await delay(waitMs);
  }
}
console.log(`Итого: успешных переходов ${successes}, не найдено на первой странице ${missing}.`);
