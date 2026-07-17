-- ============================================================
-- Kamay Aral — Supabase Schema
-- Run this in the Supabase SQL editor to set up the database.
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- is_admin() helper — reads role from the JWT, no table access.
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql stable
as $$
  select coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false);
$$;

-- ============================================================
-- current_student_section_id() / current_student_teacher_id()
-- SECURITY DEFINER so the lookup runs as the function owner and
-- bypasses RLS internally. Required because "Students: view own
-- section" (on sections) and "Students: view own teacher" (on
-- teachers) need to read the student's own students row, but
-- "Teachers: manage students" (on students) reads sections — a
-- plain subquery on students from a sections/teachers policy
-- creates a students <-> sections RLS cycle that Postgres detects
-- as infinite recursion (error 42P17) on EVERY query against
-- students, not just the section/teacher lookups.
-- ============================================================
create or replace function public.current_student_section_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select section_id from public.students where id = auth.uid();
$$;

create or replace function public.current_student_teacher_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select sec.teacher_id
  from public.students s
  join public.sections sec on sec.id = s.section_id
  where s.id = auth.uid();
$$;

-- ============================================================
-- TEACHERS
-- Uses Supabase Auth (auth.users) for credentials.
-- One auth.user = one teacher profile.
-- ============================================================
create table public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  first_name text,
  last_name text,
  -- Deactivation (not deletion) is the only way to remove access from the
  -- app UI — see deactivateTeacherAction/reactivateTeacherAction, which also
  -- ban/unban the auth.users row so a deactivated account can't sign in at
  -- all. This column is just for display/filtering; the ban is the real gate.
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.teachers enable row level security;

-- Teachers can only read/update their own profile
create policy "Teachers: own profile" on public.teachers
  for all using (auth.uid() = id);

-- Admin: full access
create policy "Admin: full access teachers" on public.teachers
  for all using (public.is_admin());

-- Students: read their own section's teacher (for the Profile page's
-- "Class" card — name only, via the "own profile" columns above).
create policy "Students: view own teacher" on public.teachers
  for select using (id = public.current_student_teacher_id());

-- ============================================================
-- SECTIONS
-- A teacher's class group (e.g. "Apple", "Banana").
-- ============================================================
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.sections enable row level security;

create policy "Sections: teacher owns" on public.sections
  for all using (teacher_id = auth.uid());

-- Admin: full access (can create sections for any teacher)
create policy "Admin: full access sections" on public.sections
  for all using (public.is_admin());

-- Students: read their own section (for the Profile page's "Class" card)
create policy "Students: view own section" on public.sections
  for select using (id = public.current_student_section_id());

-- ============================================================
-- STUDENTS
-- Accounts created by teachers or admin. Auth also via auth.users.
-- section_id is nullable: NULL means the student is unassigned
-- (removed from a section, or created without one by admin).
-- ============================================================
create table public.students (
  id uuid primary key references auth.users(id) on delete cascade,
  section_id uuid references public.sections(id) on delete set null,
  full_name text not null,
  first_name text,
  last_name text,
  email text,
  -- Deactivation (not deletion) is the only way to remove access from the
  -- app UI — see deactivateStudentAction/reactivateStudentAction, which also
  -- ban/unban the auth.users row so a deactivated account can't sign in at
  -- all. This column is just for display/filtering; the ban is the real gate.
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.students enable row level security;

-- Students read their own row
create policy "Students: own row" on public.students
  for select using (auth.uid() = id);

-- Teachers read/write students in their sections
-- USING governs which existing rows a teacher can touch (must currently be
-- in one of their own sections). WITH CHECK governs what the row is allowed
-- to become afterward — either still one of their own sections, or NULL
-- (unassigned), since "remove student from section" sets section_id to NULL
-- and would otherwise fail the same condition it's using to become valid.
create policy "Teachers: manage students" on public.students
  for all using (
    section_id in (
      select id from public.sections where teacher_id = auth.uid()
    )
  )
  with check (
    section_id is null
    or section_id in (
      select id from public.sections where teacher_id = auth.uid()
    )
  );

-- Teachers can view unassigned students (to add them to a section)
create policy "Teachers: view unassigned students" on public.students
  for select using (
    section_id is null
    and exists (select 1 from public.teachers t where t.id = auth.uid())
  );

-- Teachers can claim an unassigned student into one of their own sections.
-- Separate from "Teachers: manage students" because that policy's USING
-- clause only matches rows already in one of the teacher's sections — an
-- unassigned (section_id is null) row never matches it, so without this,
-- the UPDATE in addExistingStudentToSectionAction silently affects zero
-- rows under RLS instead of erroring, making it look like it "succeeded".
create policy "Teachers: claim unassigned students" on public.students
  for update using (
    section_id is null
    and exists (select 1 from public.teachers t where t.id = auth.uid())
  )
  with check (
    section_id in (
      select id from public.sections where teacher_id = auth.uid()
    )
  );

-- Admin: full access
create policy "Admin: full access students" on public.students
  for all using (public.is_admin());

-- ============================================================
-- LEARN PROGRESS
-- Tracks which items a student has viewed in Learn Mode.
-- ============================================================
create table public.learn_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  module_id text not null,
  submodule_id text not null,
  item_id text not null,
  viewed_at timestamptz not null default now(),
  unique (student_id, module_id, submodule_id, item_id)
);
alter table public.learn_progress enable row level security;

create policy "LearnProgress: own" on public.learn_progress
  for all using (student_id = auth.uid());

create policy "LearnProgress: teacher view" on public.learn_progress
  for select using (
    student_id in (
      select s.id from public.students s
      join public.sections sec on s.section_id = sec.id
      where sec.teacher_id = auth.uid()
    )
  );

-- Admin: full access
create policy "Admin: full access learn_progress" on public.learn_progress
  for all using (public.is_admin());

-- ============================================================
-- QUIZ SETTINGS
-- Teachers enable/disable quiz per sub-module per section.
-- ============================================================
create table public.quiz_settings (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  submodule_id text not null,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (section_id, submodule_id)
);
alter table public.quiz_settings enable row level security;

create policy "QuizSettings: teacher manages" on public.quiz_settings
  for all using (
    section_id in (
      select id from public.sections where teacher_id = auth.uid()
    )
  );

-- Students can read quiz settings for their section
create policy "QuizSettings: student reads" on public.quiz_settings
  for select using (
    section_id in (
      select section_id from public.students where id = auth.uid()
    )
  );

-- Admin: full access
create policy "Admin: full access quiz_settings" on public.quiz_settings
  for all using (public.is_admin());

-- ============================================================
-- QUIZ ATTEMPTS
-- One attempt per student per sub-module (unless reset).
-- ============================================================
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  submodule_id text not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score integer,
  total integer,
  unique (student_id, submodule_id)
);
alter table public.quiz_attempts enable row level security;

create policy "QuizAttempts: own" on public.quiz_attempts
  for all using (student_id = auth.uid());

create policy "QuizAttempts: teacher view" on public.quiz_attempts
  for select using (
    student_id in (
      select s.id from public.students s
      join public.sections sec on s.section_id = sec.id
      where sec.teacher_id = auth.uid()
    )
  );

-- Teachers can delete (reset) an attempt
create policy "QuizAttempts: teacher reset" on public.quiz_attempts
  for delete using (
    student_id in (
      select s.id from public.students s
      join public.sections sec on s.section_id = sec.id
      where sec.teacher_id = auth.uid()
    )
  );

-- Admin: full access
create policy "Admin: full access quiz_attempts" on public.quiz_attempts
  for all using (public.is_admin());

-- ============================================================
-- QUIZ ANSWERS
-- Per-question results within an attempt.
-- ============================================================
create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  activity_type text not null,
  item_id text not null,
  answer_given text,
  is_correct boolean not null
);
alter table public.quiz_answers enable row level security;

create policy "QuizAnswers: via attempt" on public.quiz_answers
  for all using (
    attempt_id in (
      select id from public.quiz_attempts where student_id = auth.uid()
    )
  );

create policy "QuizAnswers: teacher view" on public.quiz_answers
  for select using (
    attempt_id in (
      select qa.id from public.quiz_attempts qa
      join public.students s on qa.student_id = s.id
      join public.sections sec on s.section_id = sec.id
      where sec.teacher_id = auth.uid()
    )
  );

-- Admin: full access
create policy "Admin: full access quiz_answers" on public.quiz_answers
  for all using (public.is_admin());

-- ============================================================
-- AUDIT LOGS
-- Records account/management actions by admins, teachers, and
-- students. actor_id is intentionally NOT a foreign key so log
-- rows survive account deletion; actor_name/actor_role are
-- denormalized for the same reason. Only inserted via the
-- service-role client (app/actions/audit.ts) — there is no
-- insert policy for `authenticated`, so client sessions can
-- never write (or forge) a log entry directly.
-- ============================================================
-- section_id/section_name are populated only for teacher-initiated,
-- section-scoped actions (create/delete section, toggle quiz, reset
-- attempt, add/remove student) — captured at write time since a section
-- can later be deleted or a student moved, making it undiscoverable
-- afterward. Same non-FK denormalization reasoning as actor_id/actor_name.
-- Currently unused by any UI (admin's audit log view is not
-- section-scoped) — recorded for potential future use.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_name text not null,
  actor_role text not null,
  action text not null,
  description text not null,
  section_id uuid,
  section_name text,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;

-- Admin only. No insert/update/delete policy for `authenticated`
-- at all — writes only ever happen via the service-role client,
-- which bypasses RLS. Teachers and students have no read access.
create policy "Admin: read audit logs" on public.audit_logs
  for select using (public.is_admin());

-- ============================================================
-- USER ROLES VIEW
-- Helper to determine if an auth.user is a teacher or student.
-- ============================================================
create or replace view public.user_roles as
  select id, 'teacher' as role from public.teachers
  union all
  select id, 'student' as role from public.students;

-- ============================================================
-- TEACHER AUTO-INSERT TRIGGER
-- Legacy safety net: if any auth user is ever created with
-- role='teacher' in user_metadata via supabase.auth.signUp()
-- (not used by the current app — teachers are admin-invited),
-- auto-insert a row into public.teachers.
-- ============================================================
create or replace function public.handle_teacher_signup()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (new.raw_user_meta_data ->> 'role') = 'teacher' then
    insert into public.teachers (id, full_name)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', 'Teacher')
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_teacher_signup();

-- ============================================================
-- INDEXES
-- Foreign-key columns queried by RLS policies and app pages on
-- every navigation. Marginal at classroom scale today, but free
-- and keeps queries flat as data grows.
-- ============================================================
create index if not exists idx_students_section_id on public.students (section_id);
create index if not exists idx_sections_teacher_id on public.sections (teacher_id);
create index if not exists idx_quiz_attempts_student_id on public.quiz_attempts (student_id);
create index if not exists idx_learn_progress_student_id on public.learn_progress (student_id);
create index if not exists idx_quiz_answers_attempt_id on public.quiz_answers (attempt_id);
create index if not exists idx_quiz_settings_section_id on public.quiz_settings (section_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);

-- ============================================================
-- GRANTS
-- Required because tables created via SQL editor are not
-- automatically accessible to the `authenticated`, `anon`, or
-- `service_role` roles. `service_role` needs these too — it's
-- what the admin server actions (app/actions/admin.ts) use, and
-- while it bypasses RLS, it still needs the base table grant.
-- ============================================================
grant usage on schema public to authenticated, anon, service_role;
grant select, insert, update, delete on public.teachers to authenticated, service_role;
grant select, insert, update, delete on public.sections to authenticated, service_role;
grant select, insert, update, delete on public.students to authenticated, service_role;
grant select, insert, update, delete on public.learn_progress to authenticated, service_role;
grant select, insert, update, delete on public.quiz_settings to authenticated, service_role;
grant select, insert, update, delete on public.quiz_attempts to authenticated, service_role;
grant select, insert, update, delete on public.quiz_answers to authenticated, service_role;
grant select on public.user_roles to authenticated, service_role;
-- audit_logs: authenticated only ever needs to read (admin UI); all writes
-- go through the service-role client in app/actions/audit.ts.
grant select on public.audit_logs to authenticated;
grant select, insert, update, delete on public.audit_logs to service_role;
