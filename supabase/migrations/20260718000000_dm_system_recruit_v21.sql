-- DM System Recruit 2.1 — richer job data and publication hub
alter table public.jobs add column if not exists requirements text;
alter table public.jobs add column if not exists location text;
alter table public.jobs add column if not exists employment_type text default 'full_time';
alter table public.jobs add column if not exists work_model text default 'hybrid';
alter table public.jobs add column if not exists salary_range text;

create table if not exists public.job_publications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  portal text not null,
  status text not null default 'draft' check (status in ('draft','ready','published','paused','error')),
  external_url text,
  external_id text,
  published_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, portal)
);
alter table public.job_publications enable row level security;
drop trigger if exists set_updated_at on public.job_publications;
create trigger set_updated_at before update on public.job_publications for each row execute function public.set_updated_at();
create index if not exists job_publications_job_idx on public.job_publications(job_id);
