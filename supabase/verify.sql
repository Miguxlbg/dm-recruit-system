-- Run after schema.sql. Every query should succeed.
select 'employees' as resource, count(*) as records from public.employees
union all select 'departments', count(*) from public.departments
union all select 'onboardings', count(*) from public.onboardings
union all select 'onboarding_tasks', count(*) from public.onboarding_tasks
union all select 'jobs', count(*) from public.jobs
union all select 'candidates', count(*) from public.candidates
union all select 'applications', count(*) from public.applications
union all select 'interviews', count(*) from public.interviews
union all select 'trainings', count(*) from public.trainings
union all select 'training_enrollments', count(*) from public.training_enrollments;

select id, name, public, file_size_limit from storage.buckets where id = 'hr-files';
