export const resources = {
  departments: ['name','description','parent_id'],
  employees: ['name','job_title','department_id','email','phone','birth_date','hire_date','photo_url','status','manager_id'],
  onboarding_templates: ['name','description'],
  onboarding_template_tasks: ['template_id','title','phase','position'],
  onboardings: ['employee_id','template_id','start_date','status'],
  onboarding_tasks: ['onboarding_id','title','phase','due_date','completed','completed_at'],
  review_cycles: ['name','start_date','end_date','status'],
  review_questions: ['cycle_id','prompt','question_type','position'],
  reviews: ['cycle_id','employee_id','reviewer_id','review_type','status','responses','ai_summary'],
  shifts: ['name','start_time','end_time','color'],
  shift_assignments: ['employee_id','shift_id','shift_date','notes'],
  leave_requests: ['employee_id','leave_type','start_date','end_date','reason','status'],
  jobs: ['title','description','department_id','status'],
  candidates: ['name','email','phone','resume_url','resume_path','ai_summary'],
  applications: ['candidate_id','job_id','stage','match_score','match_reason','notes'],
  interviews: ['application_id','scheduled_at','interviewer_id','meeting_link','notes','status'],
  trainings: ['name','category','mandatory','validity_days','description'],
  training_enrollments: ['training_id','employee_id','assigned_at','due_date','completed_at','expires_at','status','certificate_url','certificate_path']
} as const
export type Resource = keyof typeof resources
export const isResource = (value: string): value is Resource => value in resources
