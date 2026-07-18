-- DM People: complete Supabase schema. Run once in Supabase SQL Editor.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table if not exists departments (
  id uuid primary key default gen_random_uuid(), name text not null unique, description text,
  parent_id uuid references departments(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists employees (
  id uuid primary key default gen_random_uuid(), name text not null, job_title text not null,
  department_id uuid references departments(id) on delete set null, email text unique not null,
  phone text, birth_date date, hire_date date not null, photo_url text, status text not null default 'active' check(status in ('active','inactive')),
  manager_id uuid references employees(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table employees add column if not exists birth_date date;

create table if not exists onboarding_templates (
  id uuid primary key default gen_random_uuid(), name text not null, description text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists onboarding_template_tasks (
  id uuid primary key default gen_random_uuid(), template_id uuid not null references onboarding_templates(id) on delete cascade,
  title text not null, phase text not null check(phase in ('preboarding','week1','day30','day60','day90')), position int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists onboardings (
  id uuid primary key default gen_random_uuid(), employee_id uuid not null references employees(id) on delete cascade,
  template_id uuid references onboarding_templates(id) on delete set null, start_date date not null, status text not null default 'active' check(status in ('active','completed','paused')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists onboarding_tasks (
  id uuid primary key default gen_random_uuid(), onboarding_id uuid not null references onboardings(id) on delete cascade,
  title text not null, phase text not null, due_date date, completed boolean not null default false, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists review_cycles (
  id uuid primary key default gen_random_uuid(), name text not null, start_date date not null, end_date date not null,
  status text not null default 'draft' check(status in ('draft','active','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists review_questions (
  id uuid primary key default gen_random_uuid(), cycle_id uuid not null references review_cycles(id) on delete cascade,
  prompt text not null, question_type text not null default 'scale' check(question_type in ('scale','text')), position int default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(), cycle_id uuid not null references review_cycles(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade, reviewer_id uuid references employees(id) on delete set null,
  review_type text not null check(review_type in ('self','peer','manager')), status text not null default 'pending' check(status in ('pending','submitted')),
  responses jsonb not null default '{}'::jsonb, ai_summary text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(), name text not null, start_time time not null, end_time time not null, color text default '#5B5FEF',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists shift_assignments (
  id uuid primary key default gen_random_uuid(), employee_id uuid not null references employees(id) on delete cascade,
  shift_id uuid not null references shifts(id) on delete cascade, shift_date date not null, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(employee_id, shift_id, shift_date)
);
create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(), employee_id uuid not null references employees(id) on delete cascade,
  leave_type text not null check(leave_type in ('vacation','day_off','sick','other')), start_date date not null, end_date date not null,
  reason text, status text not null default 'pending' check(status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(), title text not null, description text not null,
  department_id uuid references departments(id) on delete set null, status text not null default 'open' check(status in ('open','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists candidates (
  id uuid primary key default gen_random_uuid(), name text not null, email text not null, phone text,
  resume_url text, resume_path text, ai_summary text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists applications (
  id uuid primary key default gen_random_uuid(), candidate_id uuid not null references candidates(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  stage text not null default 'screening' check(stage in ('screening','interview','offer','hired','rejected')),
  match_score int check(match_score between 0 and 100), match_reason text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(candidate_id, job_id)
);
create table if not exists interviews (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references applications(id) on delete cascade,
  scheduled_at timestamptz not null, interviewer_id uuid references employees(id) on delete set null,
  meeting_link text, notes text, status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists trainings (
  id uuid primary key default gen_random_uuid(), name text not null, category text not null, mandatory boolean not null default false,
  validity_days int, description text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists training_enrollments (
  id uuid primary key default gen_random_uuid(), training_id uuid not null references trainings(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade, assigned_at date not null default current_date,
  due_date date, completed_at date, expires_at date, status text not null default 'pending' check(status in ('pending','in_progress','completed','expired')),
  certificate_url text, certificate_path text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(training_id, employee_id)
);

create index if not exists employees_department_idx on employees(department_id);
create index if not exists applications_stage_idx on applications(stage);
create index if not exists interviews_scheduled_idx on interviews(scheduled_at);
create index if not exists enrollments_due_idx on training_enrollments(due_date);

-- The application uses the server-side service role only. Deny direct browser access.
alter table departments enable row level security;
alter table employees enable row level security;
alter table onboarding_templates enable row level security;
alter table onboarding_template_tasks enable row level security;
alter table onboardings enable row level security;
alter table onboarding_tasks enable row level security;
alter table review_cycles enable row level security;
alter table review_questions enable row level security;
alter table reviews enable row level security;
alter table shifts enable row level security;
alter table shift_assignments enable row level security;
alter table leave_requests enable row level security;
alter table jobs enable row level security;
alter table candidates enable row level security;
alter table applications enable row level security;
alter table interviews enable row level security;
alter table trainings enable row level security;
alter table training_enrollments enable row level security;

-- Keep updated_at consistent.
do $$ declare t text; begin
  foreach t in array array['departments','employees','onboarding_templates','onboarding_template_tasks','onboardings','onboarding_tasks','review_cycles','review_questions','reviews','shifts','shift_assignments','leave_requests','jobs','candidates','applications','interviews','trainings','training_enrollments'] loop
    execute format('drop trigger if exists set_updated_at on %I', t);
    execute format('create trigger set_updated_at before update on %I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hr-files','hr-files',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=10485760;

-- Version 2.0: owner profile, visual identity and configurable access.
create table if not exists public.app_profile (
  id uuid primary key,
  display_name text not null default 'DM Recruiter', job_title text not null default 'Especialista em Pessoas & Recrutamento',
  bio text not null default '', professional_email text not null default 'dmmsb19@gmail.com', phone text not null default '',
  linkedin_url text not null default '', instagram_url text not null default '', website_url text not null default '',
  avatar_url text not null default '', logo_url text not null default '', accent_color text not null default '#695cff',
  theme text not null default 'light' check (theme in ('light','dark','system')),
  timezone text not null default 'America/Sao_Paulo', language text not null default 'pt' check (language in ('pt','en')),
  login_email text not null default 'dmmsb19@gmail.com', password_hash text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.app_profile enable row level security;
drop trigger if exists set_updated_at on public.app_profile;
create trigger set_updated_at before update on public.app_profile for each row execute function public.set_updated_at();
insert into public.app_profile (id) values ('00000000-0000-0000-0000-000000000001') on conflict (id) do nothing;
