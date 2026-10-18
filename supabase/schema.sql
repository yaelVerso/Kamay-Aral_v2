-- ============================================================
-- Kamay-Aral — Supabase Schema
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
-- TEACHERS
-- Uses Supabase Auth (auth.users) for credentials.
-- One auth.user = one teacher profile.
-- ============================================================
create table public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  first_name text,
  last_name text,
  -- School-assigned ID number, typed in by admin at creation. Nullable so
  -- pre-existing rows aren't broken by this addition; also used as an
  -- alternate login identifier (see resolveLoginEmail in app/actions/auth.ts).
  id_number text,
  -- Deactivation (not deletion) is the only way to remove access from the
  -- app UI — see deactivateTeacherAction/reactivateTeacherAction, which also
  -- ban/unban the auth.users row so a deactivated account can't sign in at
  -- all. This column is just for display/filtering; the ban is the real gate.
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.teachers enable row level security;

create unique index teachers_id_number_key on public.teachers (id_number) where id_number is not null;

-- Teachers can only read/update their own profile
create policy "Teachers: own profile" on public.teachers
  for all using (auth.uid() = id);

-- Admin: full access
create policy "Admin: full access teachers" on public.teachers
  for all using (public.is_admin());

-- "Students: view own teacher" is added further below, once
-- current_student_teacher_id() exists — that function needs
-- students and sections, both created after this table.

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

-- "Students: view own section" is added further below, once
-- current_student_section_id() exists — that function needs the
-- students table, created after this one.

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
  -- School-assigned ID number, typed in by admin at creation. Nullable so
  -- pre-existing rows aren't broken by this addition; also used as an
  -- alternate login identifier (see resolveLoginEmail in app/actions/auth.ts).
  id_number text,
  -- Deactivation (not deletion) is the only way to remove access from the
  -- app UI — see deactivateStudentAction/reactivateStudentAction, which also
  -- ban/unban the auth.users row so a deactivated account can't sign in at
  -- all. This column is just for display/filtering; the ban is the real gate.
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.students enable row level security;

create unique index students_id_number_key on public.students (id_number) where id_number is not null;

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
-- Defined here (not up with is_admin()) because a LANGUAGE SQL
-- function's body is validated against the catalog at CREATE
-- time — both students and sections must already exist.
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

-- Deferred from the TEACHERS section above — needs current_student_teacher_id().
create policy "Students: view own teacher" on public.teachers
  for select using (id = public.current_student_teacher_id());

-- Deferred from the SECTIONS section above — needs current_student_section_id().
create policy "Students: view own section" on public.sections
  for select using (id = public.current_student_section_id());

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
-- Multiple attempts per student per sub-module are kept for
-- history (mastery scoring wants the trend, not just the latest
-- try). Only one attempt per (student, submodule) may be active
-- at a time — enforced by the partial unique index below, not a
-- table-wide constraint. "Reset" deactivates the current attempt
-- (is_active = false) instead of deleting it, which frees the
-- student to start a fresh active attempt while the old one's
-- score/answers stay queryable.
-- ============================================================
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  submodule_id text not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score integer,
  total integer,
  is_active boolean not null default true
);
create unique index quiz_attempts_active_uniq
  on public.quiz_attempts (student_id, submodule_id)
  where is_active;
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

-- Teachers can reset (deactivate, not delete) an attempt so the
-- student can retake — history is preserved for mastery scoring.
create policy "QuizAttempts: teacher reset" on public.quiz_attempts
  for update using (
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
-- Per-question results within an attempt. Saved as each question is
-- answered (not batched at submit) so an abandoned quiz can resume
-- where it left off — the unique constraint lets a changed answer
-- (quiz questions stay editable until submit) upsert in place
-- instead of accumulating duplicate rows for the same question.
-- occurrence (0, 1, 2…) distinguishes the same item asked as the same
-- question type more than once in one attempt — submodules with fewer
-- items than the fixed quiz shape needs (5 sign-to-picture, 4 spelling,
-- 2 drag-drop groups of 3) cycle their item pool, so e.g. the same item
-- can legitimately appear in both drag-drop groups. Without this column
-- those two distinct answers would collide on (attempt_id, item_id,
-- activity_type) alone.
-- ============================================================
create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  activity_type text not null,
  item_id text not null,
  answer_given text,
  is_correct boolean not null,
  occurrence integer not null default 0,
  unique (attempt_id, item_id, activity_type, occurrence)
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
-- PRACTICE ANSWERS
-- One row per scorable answer given in Activity (practice) mode.
-- Unlike quizzes, practice is freely repeatable — there's no
-- attempt/gating concept, so answers are logged directly as they're
-- submitted rather than grouped under a parent attempt row.
-- ============================================================
create table public.practice_answers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  submodule_id text not null,
  activity_type text not null,
  item_id text not null,
  answer_given text,
  is_correct boolean not null,
  answered_at timestamptz not null default now()
);
alter table public.practice_answers enable row level security;

create policy "PracticeAnswers: own" on public.practice_answers
  for all using (student_id = auth.uid());

create policy "PracticeAnswers: teacher view" on public.practice_answers
  for select using (
    student_id in (
      select s.id from public.students s
      join public.sections sec on s.section_id = sec.id
      where sec.teacher_id = auth.uid()
    )
  );

-- Admin: full access
create policy "Admin: full access practice_answers" on public.practice_answers
  for all using (public.is_admin());

-- ============================================================
-- CUSTOM MODULES (teacher-authored content)
-- Separate from admin_modules (admin-authored, universal) — purely
-- additive. A teacher creates modules/submodules/signs of their own and
-- chooses which of their own sections can see each module via
-- custom_module_sections (a module isn't visible school-wide by
-- default, only to sections it's explicitly assigned to).
-- ============================================================
create table public.custom_modules (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null,
  description text,
  icon text not null default '📚',
  color text not null default 'bg-[#BBE587] shadow-[0_4px_0_#82B740] hover:bg-[#A6E05F]',
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.custom_modules enable row level security;

-- is_teacher_of_custom_module() — SECURITY DEFINER, same recursion
-- fix as current_student_section_id() above. "CustomModules:
-- student reads assigned" (below) reads custom_module_sections, and
-- "CustomModuleSections: teacher manages own" reads custom_modules —
-- a plain subquery there creates a custom_modules <->
-- custom_module_sections RLS cycle (error 42P17). Must be defined
-- here, after custom_modules exists — Postgres rejected this
-- function at CREATE time (42P01) when it was placed earlier in
-- the file, before the table it references existed.
create or replace function public.is_teacher_of_custom_module(target_module_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.custom_modules
    where id = target_module_id and teacher_id = auth.uid()
  );
$$;

-- Which of a teacher's sections a custom module is visible to.
-- Created here (before the policies below) because "CustomModules:
-- student reads assigned" references it — a policy can't reference
-- a table that doesn't exist yet. A teacher can only link modules/
-- sections they themselves own — enforced by requiring both sides
-- of the pair to trace back to their own teacher_id.
create table public.custom_module_sections (
  module_id uuid not null references public.custom_modules(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (module_id, section_id)
);
alter table public.custom_module_sections enable row level security;

create policy "CustomModules: teacher owns" on public.custom_modules
  for all using (teacher_id = auth.uid());

create policy "CustomModules: student reads assigned" on public.custom_modules
  for select using (
    id in (
      select module_id from public.custom_module_sections
      where section_id = public.current_student_section_id()
    )
  );

create policy "Admin: full access custom_modules" on public.custom_modules
  for all using (public.is_admin());

create table public.custom_submodules (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.custom_modules(id) on delete cascade,
  title text not null,
  short_title text not null,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.custom_submodules enable row level security;

create policy "CustomSubmodules: teacher owns" on public.custom_submodules
  for all using (
    module_id in (select id from public.custom_modules where teacher_id = auth.uid())
  );

create policy "CustomSubmodules: student reads assigned" on public.custom_submodules
  for select using (
    module_id in (
      select module_id from public.custom_module_sections
      where section_id = public.current_student_section_id()
    )
  );

create policy "Admin: full access custom_submodules" on public.custom_submodules
  for all using (public.is_admin());

-- video_url accepts a YouTube link — parsed into an embeddable URL at
-- render time (see lib/videoEmbed.ts), not validated at the DB layer.

create table public.custom_signs (
  id uuid primary key default gen_random_uuid(),
  submodule_id uuid not null references public.custom_submodules(id) on delete cascade,
  label text not null,
  label_fil text,
  description text,
  video_url text not null,
  image_url text,
  accepted_answers text[] not null default '{}',
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.custom_signs enable row level security;

create policy "CustomSigns: teacher owns" on public.custom_signs
  for all using (
    submodule_id in (
      select cs.id from public.custom_submodules cs
      join public.custom_modules cm on cs.module_id = cm.id
      where cm.teacher_id = auth.uid()
    )
  );

create policy "CustomSigns: student reads assigned" on public.custom_signs
  for select using (
    submodule_id in (
      select cs.id from public.custom_submodules cs
      join public.custom_module_sections cms on cs.module_id = cms.module_id
      where cms.section_id = public.current_student_section_id()
    )
  );

create policy "Admin: full access custom_signs" on public.custom_signs
  for all using (public.is_admin());

-- ============================================================
-- CUSTOM SIGN VIDEOS
-- Extra video variations for a sign (e.g. a different signer or
-- regional variant) — purely additive. custom_signs.video_url stays
-- the primary/default video exactly as before; this table only holds
-- alternates, so existing signs need no migration and keep working
-- unchanged with zero rows here.
-- ============================================================
create table public.custom_sign_videos (
  id uuid primary key default gen_random_uuid(),
  sign_id uuid not null references public.custom_signs(id) on delete cascade,
  video_url text not null,
  label text,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.custom_sign_videos enable row level security;

create policy "CustomSignVideos: teacher owns" on public.custom_sign_videos
  for all using (
    sign_id in (
      select cs.id from public.custom_signs cs
      join public.custom_submodules csm on cs.submodule_id = csm.id
      join public.custom_modules cm on csm.module_id = cm.id
      where cm.teacher_id = auth.uid()
    )
  );

create policy "CustomSignVideos: student reads assigned" on public.custom_sign_videos
  for select using (
    sign_id in (
      select cs.id from public.custom_signs cs
      join public.custom_submodules csm on cs.submodule_id = csm.id
      join public.custom_module_sections cms on csm.module_id = cms.module_id
      where cms.section_id = public.current_student_section_id()
    )
  );

create policy "Admin: full access custom_sign_videos" on public.custom_sign_videos
  for all using (public.is_admin());

create policy "CustomModuleSections: teacher manages own" on public.custom_module_sections
  for all using (
    public.is_teacher_of_custom_module(module_id)
    and section_id in (select id from public.sections where teacher_id = auth.uid())
  );

create policy "CustomModuleSections: student reads own" on public.custom_module_sections
  for select using (section_id = public.current_student_section_id());

create policy "Admin: full access custom_module_sections" on public.custom_module_sections
  for all using (public.is_admin());

-- ============================================================
-- ADMIN MODULES (admin-authored, universal curriculum)
-- Separate from custom_modules (teacher-owned, section-scoped).
-- No section-assignment table like custom_module_sections: admin content
-- is visible to every student unconditionally. Mirrors
-- custom_modules/custom_submodules/custom_signs' shape closely on
-- purpose, so the two CSV formats stay interchangeable.
-- ============================================================
create table public.admin_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text not null default '📚',
  color text not null default 'bg-[#BBE587] shadow-[0_4px_0_#82B740] hover:bg-[#A6E05F]',
  "order" integer not null default 0,
  -- Archived (not deleted) content is hidden from students/teachers but the
  -- row stays intact, so quiz_settings/quiz_attempts/practice_answers that
  -- already reference it (via an unconstrained text submodule_id, not an FK)
  -- keep resolving instead of silently orphaning. Delete still exists
  -- alongside this for now, for cleaning up test data — archive is the
  -- intended path once real content/history exists.
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.admin_modules enable row level security;

create policy "AdminModules: admin owns" on public.admin_modules
  for all using (public.is_admin());

create policy "AdminModules: everyone reads" on public.admin_modules
  for select using (true);

create table public.admin_submodules (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.admin_modules(id) on delete cascade,
  title text not null,
  short_title text not null,
  "order" integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.admin_submodules enable row level security;

create policy "AdminSubmodules: admin owns" on public.admin_submodules
  for all using (public.is_admin());

create policy "AdminSubmodules: everyone reads" on public.admin_submodules
  for select using (true);

-- video_url accepts a YouTube link, same as custom_signs.
create table public.admin_signs (
  id uuid primary key default gen_random_uuid(),
  submodule_id uuid not null references public.admin_submodules(id) on delete cascade,
  label text not null,
  label_fil text,
  description text,
  video_url text not null,
  image_url text,
  accepted_answers text[] not null default '{}',
  "order" integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.admin_signs enable row level security;

create policy "AdminSigns: admin owns" on public.admin_signs
  for all using (public.is_admin());

create policy "AdminSigns: everyone reads" on public.admin_signs
  for select using (true);

-- ============================================================
-- ADMIN SIGN VIDEOS
-- Extra video variations for an admin sign (e.g. a different signer or
-- regional variant) — mirrors custom_sign_videos. admin_signs.video_url
-- stays the primary/default video; this table only holds alternates.
-- ============================================================
create table public.admin_sign_videos (
  id uuid primary key default gen_random_uuid(),
  sign_id uuid not null references public.admin_signs(id) on delete cascade,
  video_url text not null,
  label text,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.admin_sign_videos enable row level security;

create policy "AdminSignVideos: admin owns" on public.admin_sign_videos
  for all using (public.is_admin());

create policy "AdminSignVideos: everyone reads" on public.admin_sign_videos
  for select using (true);

-- ============================================================
-- ADMIN SIGN TEACHER OVERRIDES
-- A teacher can replace an admin sign's video with their own, scoped to
-- just their own students — the override becomes the primary video
-- everywhere (Learn, Practice, and Quiz) for that teacher's sections,
-- with admin's original demoted to a Learn-mode-only variation. Unlike
-- custom_sign_videos (Learn-mode-only extras on a teacher's own signs,
-- never affecting assessment), this one genuinely replaces what's used
-- for scoring — that's the point, letting a teacher substitute e.g. a
-- regional sign variant for their own students on shared/global content.
-- One override per (sign, teacher) — applies uniformly across every
-- section that teacher has, not settable per-section.
-- ============================================================
create table public.admin_sign_teacher_overrides (
  id uuid primary key default gen_random_uuid(),
  admin_sign_id uuid not null references public.admin_signs(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  video_url text not null,
  created_at timestamptz not null default now(),
  unique (admin_sign_id, teacher_id)
);
alter table public.admin_sign_teacher_overrides enable row level security;

create policy "AdminSignTeacherOverrides: teacher owns" on public.admin_sign_teacher_overrides
  for all using (teacher_id = auth.uid());

create policy "AdminSignTeacherOverrides: student reads own teacher's" on public.admin_sign_teacher_overrides
  for select using (teacher_id = public.current_student_teacher_id());

create policy "Admin: full access admin_sign_teacher_overrides" on public.admin_sign_teacher_overrides
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
-- APP SETTINGS
-- Singleton row for the admin branding CMS (system name, logo,
-- colors). id is a boolean check-constrained to `true` so the
-- table can never hold more than one row. Publicly readable
-- (anon included) because the login page needs it before auth;
-- only admin can write, via the plain policy (updates go through
-- the RLS-scoped client, not service-role, since is_admin() covers it).
-- ============================================================
create table public.app_settings (
  id boolean primary key default true check (id),
  system_name text,
  logo_url text,
  primary_color text,
  secondary_color text,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (true);

alter table public.app_settings enable row level security;

create policy "Everyone: read branding" on public.app_settings
  for select using (true);

create policy "Admin: manage branding" on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- BRANDING STORAGE BUCKET
-- Public bucket for the uploaded logo. Upload/replace goes through
-- the service-role client in a Server Action (see app/actions/branding.ts),
-- consistent with how every other admin write bypasses RLS — no
-- client-side storage policy is needed for writes. Reads are public
-- since the bucket itself is public (logo isn't sensitive).
-- ============================================================
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- ============================================================
-- SIGN IMAGES STORAGE BUCKET
-- Public bucket for uploaded sign images (admin_signs and custom_signs).
-- Upload/replace/delete goes through the service-role client in Server
-- Actions (see app/actions/signImages.ts) — no client-side storage
-- policy is needed for writes. Reads are public since sign images
-- aren't sensitive.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sign-images', 'sign-images', true, 3145728, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

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
create index if not exists idx_custom_modules_teacher_id on public.custom_modules (teacher_id);
create index if not exists idx_custom_submodules_module_id on public.custom_submodules (module_id);
create index if not exists idx_custom_signs_submodule_id on public.custom_signs (submodule_id);
create index if not exists idx_custom_sign_videos_sign_id on public.custom_sign_videos (sign_id);
create index if not exists idx_admin_submodules_module_id on public.admin_submodules (module_id);
create index if not exists idx_admin_signs_submodule_id on public.admin_signs (submodule_id);
create index if not exists idx_admin_sign_videos_sign_id on public.admin_sign_videos (sign_id);
create index if not exists idx_admin_sign_teacher_overrides_sign_id on public.admin_sign_teacher_overrides (admin_sign_id);
create index if not exists idx_admin_sign_teacher_overrides_teacher_id on public.admin_sign_teacher_overrides (teacher_id);
create index if not exists idx_custom_module_sections_section_id on public.custom_module_sections (section_id);

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
grant select, insert, update, delete on public.practice_answers to authenticated, service_role;
grant select, insert, update, delete on public.custom_modules to authenticated, service_role;
grant select, insert, update, delete on public.custom_submodules to authenticated, service_role;
grant select, insert, update, delete on public.custom_signs to authenticated, service_role;
grant select, insert, update, delete on public.custom_sign_videos to authenticated, service_role;
grant select, insert, update, delete on public.admin_modules to authenticated, service_role;
grant select, insert, update, delete on public.admin_submodules to authenticated, service_role;
grant select, insert, update, delete on public.admin_signs to authenticated, service_role;
grant select, insert, update, delete on public.admin_sign_videos to authenticated, service_role;
grant select, insert, update, delete on public.admin_sign_teacher_overrides to authenticated, service_role;
grant select, insert, update, delete on public.custom_module_sections to authenticated, service_role;
grant select on public.user_roles to authenticated, service_role;
grant select on public.app_settings to authenticated, anon;
grant select, insert, update on public.app_settings to service_role;
-- audit_logs: authenticated only ever needs to read (admin UI); all writes
-- go through the service-role client in app/actions/audit.ts.
grant select on public.audit_logs to authenticated;
grant select, insert, update, delete on public.audit_logs to service_role;
