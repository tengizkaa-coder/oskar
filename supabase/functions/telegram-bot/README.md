# Telegram bot Edge Function

- `index.ts` — основной исходник (редактировать только его).
- `bot.js` — собранная копия для деплоя через CDN-загрузчик.

Сборка после правок `index.ts`:

```bash
npx esbuild index.ts --loader:.ts=ts --format=esm --platform=neutral \
  --target=es2022 --bundle --minify --outfile=bot.js
```

Деплой в Supabase (проект `OSKAR`, slug `telegram-bot`, `verify_jwt: false`):
тело функции — одна строка с импортом `bot.js` по **фиксированному SHA коммита**
на `cdn.jsdelivr.net`, например:

```ts
import "https://cdn.jsdelivr.net/gh/tengizkaa-coder/oskar@<COMMIT_SHA>/supabase/functions/telegram-bot/bot.js";
```

После деплоя вызвать:
`GET /functions/v1/telegram-bot?setup=<TELEGRAM_WEBHOOK_SECRET>`
и `GET ...?setup=<SECRET>&photos=1` (прогрев кэша `product_photos`).

Фото товаров лежат в `/img/<slug>.jpg`, список `PRODUCTS` — в `index.ts`.
