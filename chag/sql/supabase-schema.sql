-- CHAG shared backend schema for Supabase (PostgreSQL)
-- Run in Supabase SQL Editor after enabling Supabase Auth.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'student' check (role in ('student','teacher','admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name',''), 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.prevent_self_role_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and (new.role is distinct from old.role or new.is_active is distinct from old.is_active) and not public.is_admin() then
    raise exception 'Only an administrator can change account roles';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role before update on public.profiles
for each row execute procedure public.prevent_self_role_change();

create table if not exists public.teacher_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  application_data jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_availability (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  starts_on date not null,
  ends_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  check (ends_on is null or ends_on >= starts_on)
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id),
  student_id uuid references public.profiles(id),
  recurring_rule_id uuid references public.recurring_availability(id) on delete set null,
  class_date date not null,
  start_time time not null,
  end_time time not null,
  title text not null default '',
  description text not null default '',
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete set null,
  teacher_id uuid not null references public.profiles(id),
  student_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (class_id, teacher_id, student_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.is_active) $$;

alter table public.profiles enable row level security;
alter table public.teacher_applications enable row level security;
alter table public.recurring_availability enable row level security;
alter table public.classes enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "profiles read self or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles update self or admin" on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "applications create own" on public.teacher_applications for insert with check (user_id = auth.uid());
create policy "applications read owner or admin" on public.teacher_applications for select using (user_id = auth.uid() or public.is_admin());
create policy "applications review admin" on public.teacher_applications for update using (public.is_admin()) with check (public.is_admin());
create policy "availability teacher or admin" on public.recurring_availability for all using (teacher_id = auth.uid() or public.is_admin()) with check (teacher_id = auth.uid() or public.is_admin());
create policy "classes participant or admin read" on public.classes for select using (teacher_id = auth.uid() or student_id = auth.uid() or public.is_admin());
create policy "teacher or admin manage classes" on public.classes for all using (teacher_id = auth.uid() or public.is_admin()) with check (teacher_id = auth.uid() or public.is_admin());
create policy "student creates own booking" on public.classes for insert with check (student_id = auth.uid());
create policy "conversation participant or admin" on public.conversations for select using (teacher_id = auth.uid() or student_id = auth.uid() or public.is_admin());
create policy "participants create conversation" on public.conversations for insert with check (teacher_id = auth.uid() or student_id = auth.uid() or public.is_admin());
create policy "messages read participants" on public.messages for select using (exists(select 1 from public.conversations c where c.id = conversation_id and (c.teacher_id = auth.uid() or c.student_id = auth.uid() or public.is_admin())));
create policy "messages send as self" on public.messages for insert with check (sender_id = auth.uid() and exists(select 1 from public.conversations c where c.id = conversation_id and (c.teacher_id = auth.uid() or c.student_id = auth.uid())));
create policy "messages mark read participants" on public.messages for update using (exists(select 1 from public.conversations c where c.id = conversation_id and (c.teacher_id = auth.uid() or c.student_id = auth.uid() or public.is_admin()))) with check (exists(select 1 from public.conversations c where c.id = conversation_id and (c.teacher_id = auth.uid() or c.student_id = auth.uid() or public.is_admin())));

-- Admin role must be assigned manually to a trusted account from the SQL editor.
-- Never expose the Supabase service_role key in frontend code.
