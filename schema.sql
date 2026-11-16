-- Схема базы данных АЛКО МСК в Supabase

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

create index if not exists callback_requests_dedup_idx
  on public.callback_requests (created_at desc, tg_user_id, phone);

alter table public.callback_requests enable row level security;
revoke all on public.callback_requests from anon, authenticated;

-- Активные получатели уведомлений (Telegram chat_id)
create table if not exists public.bot_admins (
  chat_id      bigint primary key,
  created_at   timestamptz not null default now(),
  tg_username  text,
  name         text,
  active       boolean not null default true
);

alter table public.bot_admins enable row level security;
revoke all on public.bot_admins from anon, authenticated;

-- Белый список @username админов (автоподключение при первом сообщении боту)
create table if not exists public.bot_admin_usernames (
  username     text primary key,
  created_at   timestamptz not null default now()
);

alter table public.bot_admin_usernames enable row level security;
revoke all on public.bot_admin_usernames from anon, authenticated;
