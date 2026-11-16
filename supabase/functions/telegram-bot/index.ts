const SHOP = "АЛКО МСК";
const PHONE = "+7 (495) 095-95-99";
const ADDRESS = "Москва, Мещанская ул., 18";
const MAP_URL = "https://maps.app.goo.gl/zo4fhsFT8XFBEB9m9";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN") || "";
const SB_URL = (Deno.env.get("SUPABASE_URL") || "https://mpkctofplipddhtcqncz.supabase.co").replace(/\/+$/, "");
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") || "";
const ADMIN_SUB_CODE = Deno.env.get("ADMIN_SUB_CODE") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "";

// Настраиваемые file_id стикеров (либо подбираются автоматически из официальных наборов Telegram)
const ENV_WELCOME_STICKER = Deno.env.get("WELCOME_STICKER_ID") || "";
const ENV_SUCCESS_STICKER = Deno.env.get("SUCCESS_STICKER_ID") || "";

let cachedWelcomeSticker: string | null = ENV_WELCOME_STICKER || null;
let cachedSuccessSticker: string | null = ENV_SUCCESS_STICKER || null;
let stickersLoaded = Boolean(cachedWelcomeSticker && cachedSuccessSticker);

const ALCO_RE =
  /алког|водк|виски|вино|вина|пиво|пива|коньяк|джин|ликёр|ликер|шампанск|игрист|вермут|текил|самогон|цен|наличи|ассортимент|каталог|доставк/i;

function esc(s?: string | number | null): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function prettyPhone(p: string): string {
  const m = p.match(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (m) return `+7 (${m[1]}) ${m[2]}-${m[3]}-${m[4]}`;
  return p;
}

function normUsername(u?: string | null): string {
  return (u || "").trim().replace(/^@+/, "").toLowerCase();
}

function sbHeaders(prefer = "return=representation"): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    Prefer: prefer,
  };
}

async function tg(method: string, payload: Record<string, unknown> = {}) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({ ok: false, status: res.status }));
  if (!res.ok || !data.ok) {
    throw new Error(`Telegram ${method}: ${JSON.stringify(data)}`);
  }
  return data.result;
}

async function ensureStickers() {
  if (stickersLoaded) return;
  stickersLoaded = true;
  try {
    const set = await tg("getStickerSet", { name: "UtyaDuck" });
    const list: Array<{ emoji?: string; file_id: string }> = set?.stickers || [];
    if (!cachedWelcomeSticker && list.length > 0) {
      const pick =
        list.find((s) => ["😎", "🥂", "🍸", "🍹", "👋", "🔥", "🎩"].includes(s.emoji || "")) ||
        list[0];
      cachedWelcomeSticker = pick.file_id;
    }
    if (!cachedSuccessSticker && list.length > 0) {
      const pick =
        list.find((s) => ["👍", "✅", "🚀", "🎉", "🥳", "❤️", "👌"].includes(s.emoji || "")) ||
        list[Math.min(1, list.length - 1)];
      cachedSuccessSticker = pick.file_id;
    }
  } catch (err) {
    console.error("ensureStickers error:", err);
  }
}

async function sendStickerSafe(chatId: number | string, fileId: string | null) {
  if (!fileId) return;
  try {
    await tg("sendSticker", { chat_id: chatId, sticker: fileId });
  } catch (err) {
    console.error("sendSticker error:", err);
  }
}

function mainKb() {
  return {
    keyboard: [
      [{ text: "📲 Перезвоните мне", request_contact: true }],
      [{ text: "📞 Позвонить" }, { text: "📍 Адрес • 24/7" }],
    ],
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: "Или напишите ваш номер…",
  };
}

function siteKb() {
  if (!SITE_URL) return undefined;
  return {
    inline_keyboard: [[{ text: "🌐 Открыть витрину", url: SITE_URL }]],
  };
}

function mapKb() {
  const rows: Array<Array<{ text: string; url: string }>> = [
    [{ text: "🗺 Открыть в Google Картах", url: MAP_URL }],
  ];
  if (SITE_URL) {
    rows.push([{ text: "🌐 Открыть витрину", url: SITE_URL }]);
  }
  return { inline_keyboard: rows };
}

async function sendHtml(chatId: number | string, html: string, replyMarkup?: unknown) {
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text: html,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return await tg("sendMessage", payload);
}

async function sendPlain(chatId: number | string, text: string, replyMarkup?: unknown) {
  const payload: Record<string, unknown> = { chat_id: chatId, text };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return await tg("sendMessage", payload);
}

function normContactPhone(raw?: string | null): string | null {
  const d = (raw || "").replace(/\D/g, "");
  if (d.length === 11 && (d[0] === "7" || d[0] === "8")) return "+7" + d.slice(1);
  if (d.length === 10) return "+7" + d;
  if (d.length >= 8 && d.length <= 15) return "+" + d;
  return null;
}

function normTextPhone(text?: string | null): string | null {
  const s = (text || "").trim();
  if (!s) return null;

  const onlyDigits = s.replace(/\D/g, "");
  if (/^[+\d\s\-()]+$/.test(s)) {
    if (onlyDigits.length === 11 && (onlyDigits[0] === "7" || onlyDigits[0] === "8")) {
      return "+7" + onlyDigits.slice(1);
    }
    if (onlyDigits.length === 10) {
      return "+7" + onlyDigits;
    }
    if (s.startsWith("+") && onlyDigits.length >= 8 && onlyDigits.length <= 15) {
      return "+" + onlyDigits;
    }
  }

  const ruMatch = s.match(
    /(?:^|[^\d+])((?:\+7|8|7)[\s\-()]*\d{3}[\s\-()]*\d{3}[\s\-()]*\d{2}[\s\-()]*\d{2}|\b9\d{2}[\s\-()]*\d{3}[\s\-()]*\d{2}[\s\-()]*\d{2})(?:\D|$)/,
  );
  if (ruMatch) {
    const d = ruMatch[1].replace(/\D/g, "");
    if (d.length === 11 && (d[0] === "7" || d[0] === "8")) return "+7" + d.slice(1);
    if (d.length === 10) return "+7" + d;
  }

  const intlMatch = s.match(/(?:^|\s)\+(\d[\d\s\-()]{7,18}\d)(?:\D|$)/);
  if (intlMatch) {
    const d = intlMatch[1].replace(/\D/g, "");
    if (d.length >= 8 && d.length <= 15) return "+" + d;
  }

  return null;
}

async function isWhitelistedUsername(username: string): Promise<boolean> {
  const u = normUsername(username);
  if (!u) return false;

  const envUsers = (Deno.env.get("ADMIN_USERNAMES") || "")
    .split(",")
    .map(normUsername)
    .filter(Boolean);
  if (envUsers.includes(u)) return true;

  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/bot_admin_usernames?select=username&username=eq.${encodeURIComponent(u)}&limit=1`,
      { headers: sbHeaders("return=minimal") },
    );
    if (res.ok) {
      const rows = await res.json();
      return Array.isArray(rows) && rows.length > 0;
    }
  } catch (err) {
    console.error("isWhitelistedUsername error:", err);
  }
  return false;
}

// deno-lint-ignore no-explicit-any
async function ensureAutoAdmin(msg: any): Promise<boolean> {
  if (msg.chat?.type && msg.chat.type !== "private") return false;
  const chatId = msg.chat?.id;
  const username = normUsername(msg.from?.username);
  if (!chatId || !username) return false;

  try {
    const existingRes = await fetch(
      `${SB_URL}/rest/v1/bot_admins?select=chat_id,active&chat_id=eq.${encodeURIComponent(String(chatId))}&limit=1`,
      { headers: sbHeaders("return=minimal") },
    );
    if (existingRes.ok) {
      const existing = await existingRes.json();
      if (Array.isArray(existing) && existing.length > 0) {
        return false;
      }
    }

    if (!(await isWhitelistedUsername(username))) return false;

    const fullName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") || null;
    const insRes = await fetch(`${SB_URL}/rest/v1/bot_admins?on_conflict=chat_id`, {
      method: "POST",
      headers: sbHeaders("resolution=merge-duplicates,return=minimal"),
      body: JSON.stringify({
        chat_id: chatId,
        tg_username: username,
        name: fullName,
        active: true,
      }),
    });
    return insRes.ok;
  } catch (err) {
    console.error("ensureAutoAdmin error:", err);
    return false;
  }
}

async function getAdminChatIds(): Promise<string[]> {
  const envIds = (Deno.env.get("ADMIN_CHAT_ID") || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  let dbIds: string[] = [];
  try {
    const res = await fetch(`${SB_URL}/rest/v1/bot_admins?select=chat_id&active=eq.true`, {
      headers: sbHeaders("return=minimal"),
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        dbIds = rows.map((r: { chat_id: number | string }) => String(r.chat_id));
      }
    }
  } catch (err) {
    console.error("getAdminChatIds error:", err);
  }

  return Array.from(new Set([...envIds, ...dbIds]));
}

async function notifyAdmins(html: string, replyMarkup?: unknown) {
  const admins = await getAdminChatIds();
  await Promise.all(
    admins.map(async (adminId) => {
      try {
        await sendHtml(adminId, html, replyMarkup);
      } catch (err) {
        console.error(`Failed to notify admin ${adminId}:`, err);
      }
    }),
  );
}

async function hasRecentDuplicate(tgUserId: number | null, phone: string): Promise<boolean> {
  try {
    const since = new Date(Date.now() - 120_000).toISOString();
    const ors: string[] = [`phone.eq.${encodeURIComponent(phone)}`];
    if (tgUserId) ors.push(`tg_user_id.eq.${tgUserId}`);
    const url =
      `${SB_URL}/rest/v1/callback_requests?select=id` +
      `&created_at=gte.${encodeURIComponent(since)}` +
      `&or=(${ors.join(",")})&limit=1`;
    const res = await fetch(url, { headers: sbHeaders("return=minimal") });
    if (!res.ok) return false;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

async function saveRequest(row: {
  phone: string;
  name: string | null;
  tg_user_id: number | null;
  tg_username: string | null;
  comment: string | null;
}): Promise<number | null> {
  const res = await fetch(`${SB_URL}/rest/v1/callback_requests`, {
    method: "POST",
    headers: sbHeaders("return=representation"),
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Supabase ${res.status}: ${errBody}`);
  }
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) && rows[0]?.id ? Number(rows[0].id) : null;
}

async function welcome(chatId: number) {
  await ensureStickers();
  await sendStickerSafe(chatId, cachedWelcomeSticker);

  const text = [
    `🥃 <b>${SHOP}</b>  •  <i>24/7</i>`,
    ``,
    `Быстро привезём ваш заказ`,
    `прямо домой по Москве.`,
    ``,
    `<blockquote>✦ <b>Круглосуточно 24/7</b>`,
    `✦ <b>Заказ за 1 минуту</b>`,
    `✦ <b>Большой выбор на полках</b></blockquote>`,
    ``,
    `📲 Жмите <b>«Перезвоните мне»</b> —`,
    `мы сразу наберём вас сами.`,
    ``,
    `📞 Или звоните напрямую:`,
    `<b>${PHONE}</b>`,
  ].join("\n");

  await sendHtml(chatId, text, mainKb());

  const skb = siteKb();
  if (skb) {
    await sendHtml(chatId, "✨ <b>Наша витрина онлайн:</b>", skb);
  }
}

async function sendAdminActivatedNotice(chatId: number, username: string) {
  const text = [
    `👑 <b>Админ-панель активна</b>`,
    `Аккаунт: @${esc(username)}`,
    ``,
    `<blockquote>Сюда приходят все новые`,
    `заявки на обратный звонок.</blockquote>`,
    ``,
    `<b>Команды:</b>`,
    `• /requests — последние заявки`,
    `• /admins — список админов`,
    `• /addadmin — добавить админа`,
    `• /unsub — пауза уведомлений`,
  ].join("\n");
  await sendHtml(chatId, text, mainKb());
}

// deno-lint-ignore no-explicit-any
async function takeRequest(msg: any, phone: string, name?: string | null, comment?: string | null) {
  const chatId = msg.chat.id as number;
  const who = msg.from || {};
  const tgUserId = typeof who.id === "number" ? who.id : null;
  const tgUsername = typeof who.username === "string" ? who.username : null;

  if (await hasRecentDuplicate(tgUserId, phone)) {
    const dupText = [
      `⏳ <b>Заявка уже в работе</b>`,
      ``,
      `<blockquote>Мы получили ваш номер`,
      `и уже набираем вас.</blockquote>`,
      ``,
      `Если вопрос срочный:`,
      `📞 <b>${PHONE}</b>`,
    ].join("\n");
    await sendHtml(chatId, dupText, mainKb());
    return;
  }

  let reqId: number | null = null;
  try {
    reqId = await saveRequest({
      phone,
      name: name || null,
      tg_user_id: tgUserId,
      tg_username: tgUsername,
      comment: comment || null,
    });
  } catch (err) {
    console.error("Supabase save error:", err);
    await notifyAdmins(
      `⚠️ <b>Сбой записи в БД</b>\n📱 ${esc(prettyPhone(phone))}\n👤 ${esc(name || "без имени")} (${
        tgUsername ? "@" + esc(tgUsername) : "id " + (tgUserId ?? chatId)
      })`,
    );
    const errText = [
      `⚠️ <b>Техническая заминка</b>`,
      ``,
      `Не удалось сохранить заявку`,
      `автоматически.`,
      ``,
      `Пожалуйста, наберите нас:`,
      `📞 <b>${PHONE}</b>`,
    ].join("\n");
    await sendHtml(chatId, errText, mainKb());
    return;
  }

  const tgLabel = tgUsername ? `@${esc(tgUsername)}` : `id ${tgUserId ?? chatId}`;
  const adminLines = [
    `🔔 <b>Новая заявка${reqId ? ` #${reqId}` : ""}</b>`,
    ``,
    `📱 <b>${esc(prettyPhone(phone))}</b>`,
    `👤 Имя: ${esc(name || "не указано")}`,
    `💬 Telegram: ${tgLabel}`,
  ];
  if (comment) {
    adminLines.push(`📝 <i>${esc(comment)}</i>`);
  }

  const adminKb = reqId
    ? {
      inline_keyboard: [[
        { text: "🟡 В работу", callback_data: `st:${reqId}:in_progress` },
        { text: "🟢 Выполнено", callback_data: `st:${reqId}:done` },
      ]],
    }
    : undefined;

  await notifyAdmins(adminLines.join("\n"), adminKb);

  await ensureStickers();
  await sendStickerSafe(chatId, cachedSuccessSticker);

  const okText = [
    `✅ <b>Заявка принята!</b>`,
    ``,
    `<blockquote>📱 <b>${esc(prettyPhone(phone))}</b>`,
    `⚡ Свяжемся за пару минут</blockquote>`,
    ``,
    `Уже передали ваш контакт —`,
    `скоро наберём и всё оформим.`,
    ``,
    `Если нужно прямо сейчас:`,
    `📞 <b>${PHONE}</b>`,
  ].join("\n");
  await sendHtml(chatId, okText, mainKb());
}

// deno-lint-ignore no-explicit-any
async function handleAdminCommands(msg: any, text: string): Promise<boolean> {
  const chatId = msg.chat.id as number;
  const who = msg.from || {};
  const callerUsername = normUsername(who.username);

  if (text === "/myid") {
    await sendHtml(chatId, `🆔 Ваш Telegram ID:\n<code>${chatId}</code>`, mainKb());
    return true;
  }

  const subMatch = text.match(/^\/(?:admin|sub)(?:\s+(.+))?$/i);
  if (subMatch) {
    const code = (subMatch[1] || "").trim();
    const whitelisted = callerUsername ? await isWhitelistedUsername(callerUsername) : false;
    if (!whitelisted && (!ADMIN_SUB_CODE || code !== ADMIN_SUB_CODE)) {
      await sendHtml(chatId, "⛔️ <b>Неверный код доступа.</b>", mainKb());
      return true;
    }
    const fullName = [who.first_name, who.last_name].filter(Boolean).join(" ") || null;
    const res = await fetch(`${SB_URL}/rest/v1/bot_admins?on_conflict=chat_id`, {
      method: "POST",
      headers: sbHeaders("resolution=merge-duplicates,return=minimal"),
      body: JSON.stringify({
        chat_id: chatId,
        tg_username: callerUsername || null,
        name: fullName,
        active: true,
      }),
    });
    if (!res.ok) {
      await sendPlain(chatId, "Ошибка сохранения в базе.", mainKb());
      return true;
    }
    await sendHtml(
      chatId,
      [
        `✅ <b>Уведомления включены!</b>`,
        ``,
        `Все новые заявки приходят сюда.`,
        ``,
        `• /requests — список заявок`,
        `• /admins — список админов`,
        `• /unsub — пауза`,
      ].join("\n"),
      mainKb(),
    );
    return true;
  }

  if (text === "/unsub") {
    await fetch(
      `${SB_URL}/rest/v1/bot_admins?chat_id=eq.${encodeURIComponent(String(chatId))}`,
      {
        method: "PATCH",
        headers: sbHeaders("return=minimal"),
        body: JSON.stringify({ active: false }),
      },
    );
    await sendHtml(
      chatId,
      "🔕 <b>Уведомления на паузе.</b>\nВключить обратно: /sub",
      mainKb(),
    );
    return true;
  }

  const admins = await getAdminChatIds();
  const isAdmin = admins.includes(String(chatId));
  if (!isAdmin) return false;

  const addMatch = text.match(/^\/addadmin(?:\s+(.+))?$/i);
  if (addMatch) {
    const target = normUsername(addMatch[1]);
    if (!target || !/^[a-z0-9_]{3,32}$/i.test(target)) {
      await sendHtml(chatId, "Формат:\n<code>/addadmin @username</code>");
      return true;
    }
    await fetch(`${SB_URL}/rest/v1/bot_admin_usernames?on_conflict=username`, {
      method: "POST",
      headers: sbHeaders("resolution=merge-duplicates,return=minimal"),
      body: JSON.stringify({ username: target }),
    });
    await fetch(
      `${SB_URL}/rest/v1/bot_admins?tg_username=eq.${encodeURIComponent(target)}`,
      {
        method: "PATCH",
        headers: sbHeaders("return=minimal"),
        body: JSON.stringify({ active: true }),
      },
    );
    await sendHtml(
      chatId,
      `✅ <b>@${esc(target)}</b> добавлен в админы.\nПусть нажмёт /start в боте.`,
    );
    return true;
  }

  const delMatch = text.match(/^\/deladmin(?:\s+(.+))?$/i);
  if (delMatch) {
    const target = normUsername(delMatch[1]);
    if (!target) {
      await sendHtml(chatId, "Формат:\n<code>/deladmin @username</code>");
      return true;
    }
    await fetch(
      `${SB_URL}/rest/v1/bot_admin_usernames?username=eq.${encodeURIComponent(target)}`,
      { method: "DELETE", headers: sbHeaders("return=minimal") },
    );
    await fetch(
      `${SB_URL}/rest/v1/bot_admins?tg_username=eq.${encodeURIComponent(target)}`,
      {
        method: "PATCH",
        headers: sbHeaders("return=minimal"),
        body: JSON.stringify({ active: false }),
      },
    );
    await sendHtml(chatId, `🗑 <b>@${esc(target)}</b> отключён от уведомлений.`);
    return true;
  }

  if (text === "/admins") {
    const [actRes, wlRes] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/bot_admins?select=chat_id,tg_username,name,active&active=eq.true`, {
        headers: sbHeaders("return=minimal"),
      }),
      fetch(`${SB_URL}/rest/v1/bot_admin_usernames?select=username`, {
        headers: sbHeaders("return=minimal"),
      }),
    ]);
    const actRows = actRes.ok ? await actRes.json() : [];
    const wlRows = wlRes.ok ? await wlRes.json() : [];
    const activeSet = new Set(
      (Array.isArray(actRows) ? actRows : [])
        .map((r: { tg_username?: string }) => normUsername(r.tg_username))
        .filter(Boolean),
    );
    const activeLines = (Array.isArray(actRows) ? actRows : []).map(
      (r: { chat_id: number; tg_username?: string; name?: string }) =>
        `🟢 ${r.tg_username ? "@" + esc(r.tg_username) : "id " + r.chat_id}${r.name ? ` (${esc(r.name)})` : ""}`,
    );
    const pendingLines = (Array.isArray(wlRows) ? wlRows : [])
      .map((r: { username: string }) => normUsername(r.username))
      .filter((u: string) => u && !activeSet.has(u))
      .map((u: string) => `⏳ @${esc(u)} — ждёт /start`);

    const msgLines = [
      `👑 <b>Администраторы</b>`,
      ``,
      ...(activeLines.length ? activeLines : ["Пока никто не нажал /start"]),
      ...(pendingLines.length ? ["", ...pendingLines] : []),
    ];
    await sendHtml(chatId, msgLines.join("\n"));
    return true;
  }

  if (text === "/requests") {
    const res = await fetch(
      `${SB_URL}/rest/v1/callback_requests?select=id,created_at,phone,name,tg_username,status&order=created_at.desc&limit=10`,
      { headers: sbHeaders("return=minimal") },
    );
    if (!res.ok) {
      await sendPlain(chatId, "Не удалось загрузить список заявок.");
      return true;
    }
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      await sendHtml(chatId, "📭 <b>Заявок пока нет.</b>");
      return true;
    }
    const statusIcon: Record<string, string> = {
      new: "🆕",
      in_progress: "🟡",
      done: "🟢",
      cancelled: "⚪",
    };
    const out = rows.map((r) => {
      const dt = new Date(r.created_at).toLocaleString("ru-RU", {
        timeZone: "Europe/Moscow",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const icon = statusIcon[r.status] || "•";
      const u = r.tg_username ? ` • @${esc(r.tg_username)}` : "";
      return `${icon} <b>#${r.id}</b> · ${dt}\n${esc(prettyPhone(r.phone))}${u}`;
    });
    await sendHtml(chatId, `📋 <b>Последние заявки:</b>\n\n` + out.join("\n\n"));
    return true;
  }

  return false;
}

// deno-lint-ignore no-explicit-any
async function onMessage(msg: any) {
  const chatId = msg.chat?.id;
  if (!chatId) return;

  const justActivatedAdmin = await ensureAutoAdmin(msg);
  const callerUsername = normUsername(msg.from?.username);

  const text = String(msg.text || "").trim();
  const contact = msg.contact;

  if (contact) {
    if (justActivatedAdmin && callerUsername) {
      await sendAdminActivatedNotice(chatId, callerUsername);
    }
    if (contact.user_id != null && contact.user_id !== msg.from?.id) {
      const wrongContact = [
        `⚠️ <b>Нужен ваш личный номер</b>`,
        ``,
        `Нажмите кнопку внизу экрана:`,
        `<b>«📲 Перезвоните мне»</b>`,
        ``,
        `Или напишите свой номер`,
        `обычным сообщением в чат.`,
      ].join("\n");
      await sendHtml(chatId, wrongContact, mainKb());
      return;
    }
    const phone = normContactPhone(contact.phone_number);
    if (!phone) {
      const badPhone = [
        `⚠️ <b>Номер не распознан</b>`,
        ``,
        `Напишите его текстом в чат,`,
        `например:`,
        `<code>+7 900 123-45-67</code>`,
      ].join("\n");
      await sendHtml(chatId, badPhone, mainKb());
      return;
    }
    await takeRequest(msg, phone, contact.first_name || msg.from?.first_name, null);
    return;
  }

  if (text.startsWith("/") && (await handleAdminCommands(msg, text))) {
    return;
  }

  if (text === "/start" || text === "/help" || text.startsWith("/start ")) {
    await welcome(chatId);
    if (justActivatedAdmin && callerUsername) {
      await sendAdminActivatedNotice(chatId, callerUsername);
    }
    return;
  }

  if (justActivatedAdmin && callerUsername) {
    await sendAdminActivatedNotice(chatId, callerUsername);
  }

  if (/(?:^|\s)Позвонить(?:\s+в\s+магазин)?$/i.test(text)) {
    const callCard = [
      `📞 <b>Прямая линия • 24/7</b>`,
      ``,
      `Нажмите на номер для вызова:`,
      `<b>${PHONE}</b>`,
      ``,
      `<blockquote>Подскажем цены и наличие,`,
      `сразу оформим ваш заказ.</blockquote>`,
      ``,
      `Или жмите кнопку внизу 👇`,
      `<b>«📲 Перезвоните мне»</b>`,
    ].join("\n");
    await sendHtml(chatId, callCard, mainKb());
    return;
  }

  if (/(?:Адрес\s*[•·и]\s*(?:24\/7|часы)|📍\s*Адрес)/i.test(text)) {
    const addrCard = [
      `📍 <b>${SHOP}</b>`,
      ``,
      `<blockquote>🏠 <b>Адрес</b>`,
      `<code>${ADDRESS}</code>`,
      ``,
      `🕒 <b>Режим работы</b>`,
      `Круглосуточно • 24/7`,
      ``,
      `📞 <b>Телефон</b>`,
      `${PHONE}</blockquote>`,
      ``,
      `<i>Нажмите на адрес, чтобы`,
      `скопировать его.</i>`,
    ].join("\n");
    await sendHtml(chatId, addrCard, mapKb());
    return;
  }

  const phone = normTextPhone(text);
  if (phone) {
    const cleanCheck = text.replace(/[\d+\s\-()]/g, "").trim();
    const comment = cleanCheck.length > 0 ? text.slice(0, 500) : null;
    await takeRequest(msg, phone, msg.from?.first_name || null, comment);
    return;
  }

  if (ALCO_RE.test(text)) {
    const alcoCard = [
      `🥃 <b>Подскажем за минуту!</b>`,
      ``,
      `<blockquote>Уточним наличие и цену,`,
      `сразу оформим ваш заказ.</blockquote>`,
      ``,
      `📲 Жмите <b>«Перезвоните мне»</b>`,
      `или напишите номер в чат.`,
      ``,
      `📞 Или наберите нас:`,
      `<b>${PHONE}</b>`,
    ].join("\n");
    await sendHtml(chatId, alcoCard, mainKb());
    return;
  }

  const promptCard = [
    `✨ <b>Мы на связи 24/7!</b>`,
    ``,
    `Оставьте номер — перезвоним`,
    `и быстро всё оформим:`,
    ``,
    `<blockquote>📲 Кнопка <b>«Перезвоните мне»</b>`,
    `✍️ Или напишите номер в чат</blockquote>`,
    ``,
    `📞 Прямой телефон:`,
    `<b>${PHONE}</b>`,
  ].join("\n");
  await sendHtml(chatId, promptCard, mainKb());
}

// deno-lint-ignore no-explicit-any
async function onCallbackQuery(cbq: any) {
  const data = String(cbq.data || "");
  const m = data.match(/^st:(\d+):(in_progress|done)$/);
  if (!m) {
    await tg("answerCallbackQuery", { callback_query_id: cbq.id });
    return;
  }
  const [, reqId, newStatus] = m;
  const chatId = String(cbq.message?.chat?.id || "");
  const admins = await getAdminChatIds();
  if (!admins.includes(chatId)) {
    await tg("answerCallbackQuery", {
      callback_query_id: cbq.id,
      text: "Нет доступа",
      show_alert: true,
    });
    return;
  }

  await fetch(`${SB_URL}/rest/v1/callback_requests?id=eq.${encodeURIComponent(reqId)}`, {
    method: "PATCH",
    headers: sbHeaders("return=minimal"),
    body: JSON.stringify({ status: newStatus }),
  });

  const actor = cbq.from?.username
    ? `@${cbq.from.username}`
    : (cbq.from?.first_name || "админ");
  const label = newStatus === "done"
    ? `🟢 Выполнено (${actor})`
    : `🟡 В работе (${actor})`;

  const origPlain = String(cbq.message?.text || "").replace(/\n\n?Статус: .+$/s, "");
  const styledOrig = esc(origPlain)
    .replace(/^(🔔 Новая заявка(?: #\d+)?)/, "<b>$1</b>")
    .replace(/^(📱 .+)$/m, "<b>$1</b>");
  const nextKb = newStatus === "in_progress"
    ? { inline_keyboard: [[{ text: "🟢 Выполнено", callback_data: `st:${reqId}:done` }]] }
    : undefined;

  try {
    await tg("editMessageText", {
      chat_id: cbq.message.chat.id,
      message_id: cbq.message.message_id,
      text: `${styledOrig}\n\n<b>Статус:</b> ${esc(label)}`,
      parse_mode: "HTML",
      ...(nextKb ? { reply_markup: nextKb } : {}),
    });
  } catch (err) {
    console.error("editMessageText error:", err);
  }

  await tg("answerCallbackQuery", {
    callback_query_id: cbq.id,
    text: label,
  });
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const key = url.searchParams.get("setup");
    if (!WEBHOOK_SECRET || key !== WEBHOOK_SECRET) {
      return new Response("OK", { status: 200 });
    }
    try {
      const packParam = url.searchParams.get("packs");
      if (packParam) {
        const names = packParam.split(",").map((s) => s.trim()).filter(Boolean);
        const packs: Record<string, unknown> = {};
        for (const name of names) {
          try {
            const set = await tg("getStickerSet", { name });
            packs[name] = {
              title: set.title,
              count: set.stickers?.length,
              items: (set.stickers || []).map((st: { emoji?: string; file_id: string; is_animated?: boolean; is_video?: boolean }, idx: number) => ({
                idx,
                emoji: st.emoji,
                file_id: st.file_id,
                anim: st.is_animated,
                vid: st.is_video,
              })),
            };
          } catch (e) {
            packs[name] = { error: String(e) };
          }
        }
        return Response.json({ ok: true, packs });
      }

      const me = await tg("getMe");
      const webhookUrl = `${SB_URL}/functions/v1/telegram-bot`;
      const setRes = await tg("setWebhook", {
        url: webhookUrl,
        secret_token: WEBHOOK_SECRET,
        allowed_updates: ["message", "callback_query"],
      });
      await tg("setMyCommands", {
        commands: [{ command: "start", description: "Главное меню • Заказать звонок" }],
      });
      await tg("setMyDescription", {
        description: [
          `🥃 ${SHOP} • 24/7`,
          ``,
          `Быстро привезём ваш заказ`,
          `прямо домой по Москве.`,
          ``,
          `✦ Круглосуточно 24/7`,
          `✦ Заказ за 1 минуту`,
          `✦ Большой выбор на полках`,
          ``,
          `Нажмите «Начать» 👇`,
        ].join("\n"),
      });
      await tg("setMyShortDescription", {
        short_description: `🥃 ${SHOP} • Круглосуточно 24/7 • ${PHONE}`,
      });
      await ensureStickers();
      const info = await tg("getWebhookInfo");
      const admins = await getAdminChatIds();
      return Response.json({
        ok: true,
        bot: me,
        webhookSet: setRes,
        webhookInfo: info,
        adminsCount: admins.length,
        welcomeSticker: Boolean(cachedWelcomeSticker),
        successSticker: Boolean(cachedSuccessSticker),
      });
    } catch (err) {
      return Response.json({ ok: false, error: String(err) }, { status: 500 });
    }
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (WEBHOOK_SECRET) {
    const headerSecret = req.headers.get("x-telegram-bot-api-secret-token") || "";
    if (headerSecret !== WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const update = await req.json();
    if (update.message) {
      await onMessage(update.message);
    } else if (update.callback_query) {
      await onCallbackQuery(update.callback_query);
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
  }

  return Response.json({ ok: true });
});
