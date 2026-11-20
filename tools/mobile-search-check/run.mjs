import { chromium, devices } from 'playwright';
import { TARGET_HOST, targetFromResult, validateQuery } from './logic.mjs';

const args = process.argv.slice(2);
if (!args.includes('--live')) {
  console.log('Реальный запрос не запущен. Локальная проверка: npm test. Для запуска см. README.md.');
  process.exit(0);
}
const pos = args.indexOf('--query');
let query;
try { query = validateQuery(pos < 0 ? '' : args[pos + 1]); }
catch (error) { console.error(error.message); process.exit(1); }

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...devices['Pixel 7'], locale: 'ru-RU' });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  // Stop when Google asks for verification; never solve or bypass a challenge.
  async function assertNoChallenge() {
    const url = page.url();
    if (url.includes('/sorry/') || await page.locator('iframe[src*="recaptcha"], #captcha-form, input[name="captcha"]').count()) {
      throw new Error('Google запросил проверку. Сценарий остановлен; CAPTCHA не обходится.');
    }
    if (new URL(url).hostname === 'consent.google.com') throw new Error('Google запросил согласие. Сценарий остановлен.');
  }
  await page.goto('https://www.google.com/', { waitUntil: 'domcontentloaded' });
  await assertNoChallenge();
  const search = page.locator('textarea[name="q"], input[name="q"]').first();
  if (!(await search.count())) throw new Error('Поле поиска Google не найдено (возможно, требуется согласие).');
  await search.fill(query);
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
  await target.click();
  await page.waitForLoadState('domcontentloaded');
  const destination = new URL(page.url());
  if (destination.protocol !== 'https:' || destination.hostname !== TARGET_HOST) throw new Error('Переход ушёл на неожиданный адрес; остановка.');
  if (await page.locator('html[data-blocked]').count()) throw new Error('Сайт заблокировал этот переход; возможно, поисковик не передал referrer.');
  console.log(`Открыт ${destination.origin}${destination.pathname}`);
  // Only same-page category anchors; no call, form, purchase or external navigation.
  const links = page.locator('a.chip[href^="#"]');
  const available = await links.count();
  const count = Math.min(available, 3);
  const scenarioArg = args.indexOf('--scenario');
  const rawScenario = scenarioArg < 0 ? '0' : args[scenarioArg + 1];
  if (!/^\d+$/.test(rawScenario || '')) throw new Error('Номер сценария должен быть неотрицательным целым числом.');
  const offset = Number(rawScenario) % Math.max(available, 1);
  for (let i = 0; i < count; i++) {
    const link = links.nth((offset + i) % available);
    await link.scrollIntoViewIfNeeded();
    await link.click();
    console.log(`Открыт раздел: ${await link.innerText()}`);
  }
  if (!count) console.log('Категории не найдены на открытой странице.');
  await context.close();
} catch (error) {
  console.error(`Остановлено: ${error.message}`);
  process.exitCode = error.code === 'NOT_FOUND' ? 2 : 1;
} finally {
  if (browser) await browser.close();
}
