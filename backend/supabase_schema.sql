-- Run this in Supabase SQL editor.

create table if not exists public.documents (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  columns jsonb not null default '[]'::jsonb,
  dtypes jsonb not null default '{}'::jsonb,
  preview jsonb not null default '[]'::jsonb,
  suggested_questions jsonb not null default '[]'::jsonb,
  storage_path text,
  created_at timestamptz not null default now()
);

alter table public.documents
add column if not exists storage_path text;

alter table public.documents
add column if not exists preview jsonb not null default '[]'::jsonb;

alter table public.documents
add column if not exists suggested_questions jsonb not null default '[]'::jsonb;

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.documents(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  chart text,
  is_error boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_user_created_at on public.documents(user_id, created_at desc);
create index if not exists idx_messages_user_session_created_at on public.messages(user_id, session_id, created_at asc);

alter table public.documents enable row level security;
alter table public.messages enable row level security;

drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own" on public.documents
for select using (auth.uid() = user_id);

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own" on public.documents
for insert with check (auth.uid() = user_id);

drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own" on public.messages
for select using (auth.uid() = user_id);

drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own" on public.messages
for insert with check (auth.uid() = user_id);
