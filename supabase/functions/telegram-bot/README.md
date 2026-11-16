# Telegram bot Edge Function

`index.ts` содержит исходный код функции. Таблицы описаны в корневом `schema.sql`.

Деплой через Supabase CLI из корня репозитория после авторизации:

```bash
supabase functions deploy telegram-bot --project-ref mpkctofplipddhtcqncz --no-verify-jwt
```

После деплоя можно обновить webhook и команды через защищённый setup endpoint. Каталог использует изображения из `img/` и таблицу `product_photos` для кэширования Telegram file_id.
