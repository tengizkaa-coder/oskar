# Проект «АЛКО МСК»: контекст для продолжения работы

Продолжаем начатую в другом чате работу. Ниже всё, что уже сделано, принятые решения и что осталось. Прикреплённые файлы: `index.html`, `test.html` (сайт), `bot.py`, `config.json`, `schema.sql` (бот и база).

## 1. О проекте
Друзья открыли магазин «АЛКО МСК» (Москва, Мещанская ул., 18, 129090). Телефон: +7 (495) 095-95-99 (верный). Часы: круглосуточно, алкоголь с 08:00 до 23:00. Карта: https://maps.app.goo.gl/zo4fhsFT8XFBEB9m9 (координаты 55.7774025, 37.628121; на картах место названо «Алкомаркет Доставка»).

**Важное ограничение.** Алкоголь не доставляется: дистанционная продажа алкоголя в РФ запрещена (171-ФЗ). Доставка есть только у соков. Сайт и бот только информируют, оплата и выдача алкоголя только в магазине. Не предлагать и не оформлять доставку алкоголя, не писать на сайте, что он есть «с доставкой». Название «Доставка» на картах и в домене лучше заменить на честное (например, «доставка соков»), домен выбирать нейтральный (например `alkomsk`), а не `alkodostavkamsk`.

## 2. Сайт (`index.html`, `test.html`)
Один статичный HTML-файл без сборки, русский язык, тёмная и светлая тема, шрифты Google Fonts. Дизайн: барная полка с подсветкой, бутылки нарисованы в SVG, под ними ценники «Цена по звонку».
- Разделы: шапка с телефоном, герой «Выберите дома, заберите в магазине», факты (адрес, часы, телефон), каталог «На полках» по 10 категориям (виски, водка, джин, коньяк, ликёр, вермут, вино белое, вино красное, игристое, пиво), «Как забрать» в три шага, «Где мы» (карта Google, кнопка «Открыть в Google Картах»), футер с предупреждением и пометкой, что дистанционной продажи нет.
- Возрастной шлюз 18+ (запоминается в localStorage).
- Телефонная версия: нижняя панель «Позвонить» и «Как добраться», крупные кнопки, прилипающие чипы категорий, проверено без горизонтальной прокрутки на 360 и 390 px.
- **Ограничение доступа (JS в странице, не серверная защита).** Сайт открывается только с телефона и только при переходе из Google или Яндекса (в том числе из их карт); роботы Googlebot и Яндекса пропускаются. После первого входа допуск запоминается на вкладку (sessionStorage). Адрес `/test` (файл `test.html`) открывает сайт на любом устройстве и запоминается в localStorage (`vip-ok`). Остальные видят заглушку.
- Товары хранятся в массиве `ITEMS`: `[категория, название, объём, ссылка_на_фото]`. Фото сейчас стоят у четырёх виски (Jameson, Jack Daniel's, William Lawson's, Chivas Regal 12 лет). Они взяты с чужого сайта «Красное&Белое», это риск по авторским правам: заменить своими фото в папке `img`. Если фото не грузится, показывается нарисованная бутылка. Подпись внизу каталога: «Рисунки условные и не повторяют вид товара…» убрать, когда фото будут у всех.
- Заглушки метро и реквизитов (ООО/ИП, ИНН, лицензия) удалены. Реквизиты нужно будет добавить, когда будут данные.
- Для поиска добавлены `<title>` и `meta description`, `robots index,follow`.

## 3. Хостинг и домен (планы)
- Хостинг: GitHub Pages. Загрузить в корень репозитория `index.html` и `test.html` (GitHub отдаст `test.html` по адресу `/test`). Репозиторий на бесплатном тарифе публичный.
- Домен: нужен кастомный. Чтобы не проходить Госуслуги, брать не `.ru`, `.рф`, `.su`, а международную зону (`.com`, `.online` и т.п.). Платить нужно по СБП или российской картой, подтверждённого регистратора пока нет. Пользователь написал в поддержку Telegram-бота 1REG и ждёт ответа (спросил про DNS A/CNAME, на кого оформляется домен, регистратора, Госуслуги).
- DNS для GitHub Pages: четыре A-записи 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 и CNAME для `www` на `<логин>.github.io` (адреса сверить с документацией GitHub). В Settings → Pages указать домен и включить Enforce HTTPS.
- Когда домен выберут: подготовить файл `CNAME`, `robots.txt`, `sitemap.xml`; добавить сайт в Google Search Console и Яндекс Вебмастер; поправить название на картах.

## 4. Telegram-бот и база (Supabase)
Сценарий: человек пишет боту, бот предлагает позвонить в магазин или нажать «Перезвоните мне» (отправка номера), либо написать номер текстом. Номер записывается в Supabase, а заявка приходит в Telegram нескольким людям из `notify_chat_ids` (и/или переменной `ADMIN_CHAT_ID` через запятую). Каждый получатель должен хотя бы раз нажать «Старт» у бота. Есть кнопка на сайт (в `config.json` поле `site_url`, пользователь вставит ссылку позже). Про алкоголь бот не отвечает по сути, а отправляет в магазин. Защита от дублей на 2 минуты, отказ от чужого контакта, при сбое базы клиенту выдаётся номер магазина, а получателям приходит предупреждение.

Запуск: `BOT_TOKEN=... SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_KEY=... ADMIN_CHAT_ID=... python3 bot.py`. Токен и ключ service_role в чат не слать, на сайт не класть. Боту нужен постоянный сервер (VPS). Токена бота у меня не было. Фраза «Али Джи: Кто я?» была случайной вставкой.

Не сделано: согласие на обработку персональных данных (телефоны) в боте и на сайте, инструкция запуска бота как службы.

### `schema.sql`
```sql
-- Выполните целиком в Supabase: SQL Editor -> New query -> Run

create table if not exists public.callback_requests (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  phone        text        not null,
  name         text,
  tg_user_id   bigint,
  tg_username  text,
  source       text        not null default 'telegram',
  status       text        not null default 'new'
               check (status in ('new','in_progress','done','cancelled')),
  comment      text
);

create index if not exists callback_requests_status_created_idx
  on public.callback_requests (status, created_at desc);

-- Защита: RLS включён и политик нет, значит анонимный ключ (anon) ничего не видит и не пишет.
-- Бот пишет через service_role ключ, он обходит RLS. Сайт этот ключ получать не должен.
alter table public.callback_requests enable row level security;
revoke all on public.callback_requests from anon, authenticated;
```

### `config.json`
```json
{
  "shop": "АЛКО МСК",
  "phone": "+7 (495) 095-95-99",
  "address": "Москва, Мещанская ул., 18",
  "hours": "Круглосуточно, алкоголь с 08:00 до 23:00",
  "site_url": "",
  "notify_chat_ids": []
}
```

### `bot.py`
```python
#!/usr/bin/env python3
"""Telegram-бот АЛКО МСК: клиент звонит сам или оставляет номер, номер попадает в Supabase.
Без внешних библиотек, Python 3.8+.
Запуск:
  BOT_TOKEN=...  SUPABASE_URL=https://xxxx.supabase.co  SUPABASE_SERVICE_KEY=...  ADMIN_CHAT_ID=... python3 bot.py
Тексты, телефон и ссылка на сайт: config.json."""
import json, os, re, sys, time, urllib.request

TOKEN = os.environ.get("BOT_TOKEN", "")
SB_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SB_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
CFG = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json"), encoding="utf-8"))
# кому слать заявки: список в config.json ("notify_chat_ids") и/или ADMIN_CHAT_ID через запятую
ADMINS = [str(x).strip() for x in list(CFG.get("notify_chat_ids", [])) + os.environ.get("ADMIN_CHAT_ID", "").split(",") if str(x).strip()]
ADMINS = list(dict.fromkeys(ADMINS))
ALCO = re.compile(r"алког|водк|виски|вино|вина|пиво|пива|коньяк|джин|ликёр|ликер|шампанск|игрист|вермут|текил|самогон", re.I)
LAST = {}  # защита от дублей: chat_id -> время последней заявки

def api(method, **p):
    req = urllib.request.Request(f"https://api.telegram.org/bot{TOKEN}/{method}", json.dumps(p).encode(), {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=70) as r:
        return json.load(r)

def send(chat, text, kb=None):
    p = {"chat_id": chat, "text": text}
    if kb: p["reply_markup"] = kb
    return api("sendMessage", **p)

def notify(text):
    """Шлёт сообщение каждому получателю. Ошибка у одного (например, не нажал /start) не мешает остальным."""
    for a in ADMINS:
        try: send(a, text)
        except Exception as e: print(f"не удалось отправить {a}: {e}", file=sys.stderr)

def save_request(row):
    """Записывает заявку в Supabase. Бросает исключение, если не получилось."""
    req = urllib.request.Request(f"{SB_URL}/rest/v1/callback_requests", json.dumps(row).encode(), {
        "Content-Type": "application/json", "apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}", "Prefer": "return=minimal"})
    with urllib.request.urlopen(req, timeout=20) as r:
        if r.status not in (200, 201, 204): raise RuntimeError(f"Supabase: {r.status}")

def norm_phone(t):
    d = re.sub(r"\D", "", t or "")
    if len(d) == 11 and d[0] in "78": d = "7" + d[1:]
    elif len(d) == 10: d = "7" + d
    return "+" + d if len(d) == 11 and d[0] == "7" else None

def main_kb():
    return {"keyboard": [[{"text": "📲 Перезвоните мне", "request_contact": True}], [{"text": "📞 Позвонить в магазин"}, {"text": "📍 Адрес и часы"}]], "resize_keyboard": True}

def site_kb():
    return {"inline_keyboard": [[{"text": "🌐 Посмотреть ассортимент на сайте", "url": CFG["site_url"]}]]} if CFG.get("site_url") else None

def welcome(chat):
    send(chat, f'Здравствуйте! Это {CFG["shop"]}.\n\nКак вам удобнее:\n• позвоните нам: {CFG["phone"]}\n• или нажмите «📲 Перезвоните мне», и мы сами вам позвоним и всё оформим.', main_kb())
    if site_kb(): send(chat, "Ассортимент можно посмотреть на сайте:", site_kb())

def take_request(m, phone, name):
    chat = m["chat"]["id"]; who = m.get("from", {})
    if time.time() - LAST.get(chat, 0) < 120:
        send(chat, "Заявка уже принята, мы вам позвоним. Если срочно, звоните: " + CFG["phone"], main_kb()); return
    row = {"phone": phone, "name": name or None, "tg_user_id": who.get("id"), "tg_username": who.get("username")}
    try:
        save_request(row)
    except Exception as e:
        print("ошибка записи в Supabase:", e, file=sys.stderr)
        notify(f"⚠️ Не удалось записать заявку в базу: {phone} ({name or 'без имени'}, @{who.get('username') or who.get('id')})")
        send(chat, f'Не получилось принять заявку. Позвоните нам: {CFG["phone"]}', main_kb()); return
    LAST[chat] = time.time()
    notify(f'📲 Просят перезвонить\n{phone}\nИмя: {name or "не указано"}\nTelegram: ' + (f'@{who["username"]}' if who.get("username") else f'id {who.get("id")}'))
    send(chat, "Спасибо! Мы скоро вам позвоним.", main_kb())

def on_message(m):
    chat = m["chat"]["id"]; text = (m.get("text") or "").strip()
    c = m.get("contact")
    if c:
        if c.get("user_id") not in (None, m.get("from", {}).get("id")):
            send(chat, "Нажмите кнопку «📲 Перезвоните мне», чтобы отправить свой номер.", main_kb()); return
        p = norm_phone(c.get("phone_number"))
        if not p: send(chat, "Не удалось распознать номер. Введите его текстом, например +7 900 123-45-67."); return
        take_request(m, p, c.get("first_name")); return
    if ALCO.search(text):
        send(chat, f'Алкоголь продаётся только в магазине: {CFG["address"]}. Если нужна помощь, позвоните: {CFG["phone"]}', main_kb()); return
    if text in ("/start", "/help"): welcome(chat); return
    if text.endswith("Позвонить в магазин"): send(chat, f'Звоните: {CFG["phone"]}'); return
    if text.endswith("Адрес и часы"): send(chat, f'{CFG["address"]}\n{CFG["hours"]}'); return
    p = norm_phone(text)
    if p: take_request(m, p, m.get("from", {}).get("first_name")); return
    send(chat, "Нажмите «📲 Перезвоните мне» или напишите номер телефона, и мы вам позвоним.", main_kb())

def main():
    miss = [n for n, v in (("BOT_TOKEN", TOKEN), ("SUPABASE_URL", SB_URL), ("SUPABASE_SERVICE_KEY", SB_KEY)) if not v]
    if miss: sys.exit("Не заданы переменные: " + ", ".join(miss))
    if not ADMINS: print("ВНИМАНИЕ: получатели не заданы (notify_chat_ids в config.json или ADMIN_CHAT_ID), уведомлений в Telegram не будет", file=sys.stderr)
    off = 0
    while True:
        try:
            for up in api("getUpdates", offset=off, timeout=50).get("result", []):
                off = up["update_id"] + 1
                if "message" in up: on_message(up["message"])
        except Exception as e:
            print("ошибка:", e, file=sys.stderr); time.sleep(5)

if __name__ == "__main__":
    main()
```

## 5. Что осталось
1. Выбрать и купить нейтральный домен в международной зоне, подключить к GitHub Pages.
2. Выложить сайт, добавить в поисковики.
3. Своими фотографиями заменить чужие, добавить фото остальным товарам, убрать подпись «Рисунки условные».
4. Добавить реквизиты (ООО/ИП, ИНН, лицензия) и, при желании, метро.
5. Запустить бота на сервере, создать таблицу в Supabase, вписать получателей и ссылку на сайт.
6. Добавить согласие на обработку персональных данных.
7. Поправить название на картах.

## 6. Как со мной работать
Пользователь пишет по-русски, коротко, без лишней формальности. Любую правку в сайте нужно проверять в эмуляции телефона (390 px) и на десктопе, а перед отправкой убеждаться, что нет горизонтальной прокрутки и что доступ по `/test` работает.
