import { chromium, webkit, devices } from 'playwright';
import { createInterface } from 'node:readline/promises';
import { TARGET_HOST, targetFromResult, validateQuery } from './logic.mjs';
import { categoryPath, deviceForScenario, randomBetween } from './scenarios.mjs';

const args = process.argv.slice(2);
if (!args.includes('--live')) {
  console.log('Реальный запрос не запущен. Локальная проверка: npm test. Для запуска см. README.md.');
  process.exit(0);
}
const pos = args.indexOf('--query');
let query;
try { query = validateQuery(pos < 0 ? '' : args[pos + 1]); }
catch (error) { console.error(error.message); process.exit(1); }
const scenarioArg = args.indexOf('--scenario');
const rawScenario = scenarioArg < 0 ? '0' : args[scenarioArg + 1];
const scenario = Number(rawScenario);
if (!/^\d+$/.test(rawScenario || '') || !Number.isSafeInteger(scenario)) {
  console.error('Номер сценария должен быть неотрицательным целым числом.');
  process.exit(1);
}

const headed = args.includes('--headed');
const manualChallenge = args.includes('--manual-challenge');
if (manualChallenge && (!headed || !process.stdin.isTTY)) {
  console.error('Для ручной проверки нужны --headed и интерактивный терминал.');
  process.exit(1);
}

let browser;
try {
  const deviceName = deviceForScenario(scenario);
  const device = devices[deviceName];
  if (!device || !device.hasTouch || !device.isMobile || !['chromium', 'webkit'].includes(device.defaultBrowserType)) throw new Error('Профиль мобильного браузера недоступен.');
  const { defaultBrowserType, ...contextOptions } = device;
  const engine = defaultBrowserType === 'webkit' ? webkit : chromium;
  const executablePath = headed && defaultBrowserType === 'chromium' ? process.env.TENAKRYT_CHROMIUM_PATH : undefined;
  browser = await engine.launch({ headless: !headed, ...(executablePath ? { executablePath } : {}), ...(headed && defaultBrowserType === 'chromium' ? { chromiumSandbox: true } : {}) });
  const context = await browser.newContext({ ...contextOptions, locale: 'ru-RU', timezoneId: 'Europe/Moscow' });
  console.log(`Эмуляция устройства: ${deviceName} (${defaultBrowserType})`);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  // Pause only for a human when explicitly requested; do not solve challenges automatically.
  async function assertNoChallenge(allowManual = true) {
    const url = page.url();
    if (url.includes('/sorry/') || await page.locator('iframe[src*="recaptcha"], #captcha-form, input[name="captcha"]').count()) {
      if (args.includes('--diagnose-challenge')) {
        const current = new URL(url);
        console.log(`Страница проверки: ${current.origin}${current.pathname}`);
        console.log(`Заголовок: ${await page.title()}`);
        const text = await page.locator('body').innerText().catch(() => 'Текст страницы недоступен');
        console.log(`Текст проверки (может содержать IP):\n${text.slice(0, 1500)}`);
        console.log(`iframe reCAPTCHA: ${await page.locator('iframe[src*="recaptcha"]').count()}`);
      }
      if (manualChallenge && allowManual) {
        console.log('Google запросил проверку. Пройдите её вручную в открытом браузере, затем нажмите Enter здесь. Ожидание до 3 минут.');
        const input = createInterface({ input: process.stdin, output: process.stdout });
        try { await input.question('После проверки нажмите Enter: ', { signal: AbortSignal.timeout(180000) }); }
        catch { throw new Error('Ожидание ручной проверки завершилось.'); }
        finally { input.close(); }
        await page.waitForLoadState('domcontentloaded');
        const current = new URL(page.url());
        if (current.protocol !== 'https:' || current.hostname !== 'www.google.com') throw new Error('Неожиданный адрес после проверки. Сценарий остановлен.');
        return assertNoChallenge(false);
      }
      throw new Error('Google запросил проверку. Сценарий остановлен; CAPTCHA автоматически не решается.');
    }
    if (new URL(url).hostname === 'consent.google.com') throw new Error('Google запросил согласие. Сценарий остановлен.');
  }
  await page.goto('https://www.google.com/', { waitUntil: 'domcontentloaded' });
  await assertNoChallenge();
  const search = page.locator('textarea[name="q"], input[name="q"]').first();
  if (!(await search.count())) throw new Error('Поле поиска Google не найдено (возможно, требуется согласие).');
  await page.waitForTimeout(randomBetween(1200, 3000));
  await search.tap();
  await search.pressSequentially(query, { delay: randomBetween(60, 160) });
  await page.waitForTimeout(randomBetween(600, 1800));
  await search.press('Enter');
  await page.waitForLoadState('domcontentloaded');
  await assertNoChallenge();
  // Restrict matches to result headings; skip known ad indicators and require the exact host.
  const candidates = page.locator('a:has(h3)');
  let target = null;
  for (let i = 0; i < await candidates.count(); i++) {
    const link = candidates.nth(i);
    const href = await link.getAttribute('href');
    const adContainer = link.locator('xpath=ancestor::*[@data-text-ad or @data-ad-slot or @data-dtld]');
    if (await adContainer.count()) continue;
    if (href && targetFromResult(href, page.url())) { target = link; break; }
  }
  if (!target) {
    const error = new Error(`Результат для ${TARGET_HOST} на первой странице не найден; других сайтов не открываем.`);
    error.code = 'NOT_FOUND';
    throw error;
  }
  await page.waitForTimeout(randomBetween(1500, 4000));
  await assertNoChallenge();
  await target.tap();
  await page.waitForLoadState('domcontentloaded');
  const destination = new URL(page.url());
  if (destination.protocol !== 'https:' || destination.hostname !== TARGET_HOST) throw new Error('Переход ушёл на неожиданный адрес; остановка.');
  if (await page.locator('html[data-blocked]').count()) throw new Error('Сайт заблокировал этот переход; возможно, поисковик не передал referrer.');
  console.log(`Открыт ${destination.origin}${destination.pathname}`);
  // Only same-page category anchors; no call, form, purchase or external navigation.
  await page.waitForTimeout(randomBetween(1800, 4000));
  await page.evaluate(distance => window.scrollBy({ top: distance, behavior: 'smooth' }), randomBetween(180, 420));
  const links = page.locator('a.chip[href^="#"]');
  const available = await links.count();
  const path = categoryPath(available, scenario);
  for (const index of path) {
    const link = links.nth(index);
    await page.waitForTimeout(randomBetween(2500, 6000));
    await link.scrollIntoViewIfNeeded();
    await link.tap();
    console.log(`Открыт раздел: ${await link.innerText()}`);
    await page.waitForTimeout(randomBetween(2000, 5000));
    await page.evaluate(distance => window.scrollBy({ top: distance, behavior: 'smooth' }), randomBetween(100, 320));
  }
  if (!path.length) console.log('Категории не найдены на открытой странице.');
  await context.close();
} catch (error) {
  console.error(`Остановлено: ${error.message}`);
  process.exitCode = error.code === 'NOT_FOUND' ? 2 : 1;
} finally {
  if (browser) await browser.close();
}
