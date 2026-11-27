# Проверки основного сайта

`python3 tools/main-site-check/static-check.py` проверяет ссылки и отсутствие номера и `tel:` в разметке главной, каталога и тестового дерева.

Для браузерной проверки нужен Playwright и запущенный из корня локальный сервер, например `python3 -m http.server 4189`. Затем выполните:

```sh
PLAYWRIGHT_PATH=/path/to/playwright-core CHROME_PATH=/path/to/chromium node tools/main-site-check/order-check.cjs
MOBILE=1 PLAYWRIGHT_PATH=/path/to/playwright-core CHROME_PATH=/path/to/chromium node tools/main-site-check/order-check.cjs
NOJS=1 PLAYWRIGHT_PATH=/path/to/playwright-core CHROME_PATH=/path/to/chromium node tools/main-site-check/order-check.cjs
```

При необходимости задайте `BASE_URL`. Проверка использует разрешение буфера обмена в браузере и запускает Chromium без песочницы для изолированной тестовой среды; не используйте этот режим для обычного браузера.
