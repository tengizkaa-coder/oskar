import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { validateQuery } from './logic.mjs';

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
  for (let i = 0; i < count; i++) console.log(`${i + 1}. ${queries[i % queries.length]} — сценарий ${i + 1}`);
  process.exit(0);
}
let successes = 0, missing = 0;
for (let i = 0; i < count; i++) {
  const query = queries[i % queries.length];
  console.log(`\n[${i + 1}/${count}] ${query}`);
  const child = spawn(process.execPath, [fileURLToPath(new URL('./run.mjs', import.meta.url)), '--live', '--query', query, '--scenario', String(i)], { stdio: 'inherit' });
  const result = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', (code, signal) => resolve({code, signal})); });
  if (result.signal || (result.code !== 0 && result.code !== 2)) {
    console.error('Пакет остановлен из-за ошибки или проверки Google. Повторного запуска нет.');
    process.exitCode = 1;
    break;
  }
  if (result.code === 0) successes++; else missing++;
  if (i + 1 < count) await delay(30000);
}
console.log(`Итого: успешных переходов ${successes}, не найдено на первой странице ${missing}.`);
