-- DM System Recruit 2.0 Beta — customizable owner profile and access settings
create table if not exists public.app_profile (
  id uuid primary key,
  display_name text not null default 'DM Recruiter',
  job_title text not null default 'Especialista em Pessoas & Recrutamento',
  bio text not null default '',
  professional_email text not null default 'dmmsb19@gmail.com',
  phone text not null default '',
  linkedin_url text not null default '',
  instagram_url text not null default '',
  website_url text not null default '',
  avatar_url text not null default '',
  logo_url text not null default '',
  accent_color text not null default '#695cff',
  theme text not null default 'light' check (theme in ('light','dark','system')),
  timezone text not null default 'America/Sao_Paulo',
  language text not null default 'pt' check (language in ('pt','en')),
  login_email text not null default 'dmmsb19@gmail.com',
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_profile enable row level security;
drop trigger if exists set_updated_at on public.app_profile;
create trigger set_updated_at before update on public.app_profile for each row execute function public.set_updated_at();

insert into public.app_profile (id)
values ('00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;
