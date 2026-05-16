-- Profiles (erweitert Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null check (role in ('student','parent','coach','admin')),
  full_name text,
  created_at timestamptz default now()
);

-- Schülerdetails
create table students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  class_level integer check (class_level between 5 and 13),
  school_name text,
  school_type text check (school_type in ('Gymnasium','Gesamtschule','Realschule','Hauptschule'))
);

-- Eltern-Kind Verknüpfung
create table parent_student (
  parent_id uuid references profiles(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  primary key (parent_id, student_id)
);

-- Fächer
create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name in ('Mathematik','Deutsch','Englisch'))
);

-- Schüler-Fächer Verknüpfung
create table student_subjects (
  student_id uuid references students(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  primary key (student_id, subject_id)
);

-- Helper: Rolle ohne RLS lesen (verhindert Endlosrekursion in Policies)
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = auth.uid() limit 1;
$$;

-- RLS aktivieren
alter table profiles enable row level security;
alter table students enable row level security;
alter table parent_student enable row level security;
alter table student_subjects enable row level security;

-- Policies: jeder User darf das EIGENE Profil lesen (für Login/Role-Lookup)
create policy "users_see_own_profile" on profiles
  for select using (auth.uid() = id);

-- Policy: Coaches und Admins sehen alle Profile
create policy "coaches_admins_see_all_profiles" on profiles
  for select using (
    public.get_my_role() in ('coach','admin')
  );

-- Policy: Eltern sehen ihre Kinder
create policy "parents_see_own_children" on profiles
  for select using (
    exists (select 1 from parent_student ps where ps.parent_id = auth.uid() and ps.student_id = id)
  );

-- Fächer vorbefüllen
insert into subjects (name) values ('Mathematik'), ('Deutsch'), ('Englisch');

-- ============================================================================
-- Migration 011 – RLS-Fix students / student_subjects / parent_student
-- (siehe migrations/011_students_rls_fix.sql – hier zur Doku des realen
--  DB-Stands gespiegelt; Ausfuehrung manuell im Supabase SQL Editor)
-- ============================================================================

-- Security-Definer-Helper (nicht-rekursiv, programmweit genutzt)
create or replace function public.get_my_student_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from students where profile_id = auth.uid() limit 1;
$$;

create or replace function public.is_parent_of_student(p_student_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from parent_student ps
    where ps.parent_id = auth.uid()
      and ps.student_id in (
        select profile_id from students where id = p_student_id
      )
  );
$$;

-- students: eigenes Profil, Eltern des Kindes, Coach/Admin alles
create policy "students_select_own" on students
  for select using (profile_id = auth.uid());
create policy "students_parents_read" on students
  for select using (public.is_parent_of_student(id));
create policy "students_coach_admin_all" on students
  for all
  using (public.get_my_role() in ('coach', 'admin'))
  with check (public.get_my_role() in ('coach', 'admin'));

-- parent_student: Elternteil/Schueler sehen eigene Verknuepfung, Coach/Admin alles
create policy "parent_student_parent_read" on parent_student
  for select using (parent_id = auth.uid());
create policy "parent_student_student_read" on parent_student
  for select using (student_id = auth.uid());
create policy "parent_student_coach_admin_all" on parent_student
  for all
  using (public.get_my_role() in ('coach', 'admin'))
  with check (public.get_my_role() in ('coach', 'admin'));

-- student_subjects: eigene, Eltern des Kindes, Coach/Admin alles
create policy "student_subjects_select_own" on student_subjects
  for select using (student_id = public.get_my_student_id());
create policy "student_subjects_parents_read" on student_subjects
  for select using (public.is_parent_of_student(student_id));
create policy "student_subjects_coach_admin_all" on student_subjects
  for all
  using (public.get_my_role() in ('coach', 'admin'))
  with check (public.get_my_role() in ('coach', 'admin'));

-- ============================================================================
-- Migration 012 – leads  (siehe migrations/012_leads.sql)
-- ============================================================================
create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  full_name text not null,
  contact_email text,
  contact_phone text,
  class_level integer check (class_level between 5 and 13),
  school_type text check (
    school_type in ('Gymnasium','Gesamtschule','Realschule','Hauptschule')
  ),
  school_name text,
  subjects text[] default '{}',
  goal text check (goal in ('IMPROVE_GRADES','CLOSE_GAPS','EXAM_PREP','GENERAL')),
  known_weak_topics text[] default '{}',
  source text,
  status text not null default 'new' check (
    status in ('new','contacted','onboarding_scheduled','converted','rejected')
  ),
  owner_id uuid references profiles (id) on delete set null,
  notes text,
  converted_student_id uuid references students (id) on delete set null,
  contacted_at timestamptz,
  onboarding_scheduled_at timestamptz
);
create index leads_status_idx on leads (status);
create index leads_owner_idx on leads (owner_id);
alter table leads enable row level security;
create policy "leads_coach_admin_all" on leads
  for all
  using (public.get_my_role() in ('coach','admin'))
  with check (public.get_my_role() in ('coach','admin'));

-- ============================================================================
-- Migration 013 – intake_sessions  (siehe migrations/013_intake_sessions.sql)
-- ============================================================================
create table intake_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  student_id uuid not null references students (id) on delete cascade,
  lead_id uuid references leads (id) on delete set null,
  coach_id uuid references profiles (id) on delete set null,
  conducted_at timestamptz,
  goals text,
  motivation text,
  learning_history text,
  parent_expectations text,
  known_weak_topics text[] default '{}',
  agreed_next_steps text,
  notes text,
  status text not null default 'draft' check (status in ('draft','final'))
);
create index intake_sessions_student_idx on intake_sessions (student_id);
alter table intake_sessions enable row level security;
create policy "intake_sessions_coach_admin_all" on intake_sessions
  for all
  using (public.get_my_role() in ('coach','admin'))
  with check (public.get_my_role() in ('coach','admin'));
create policy "intake_sessions_parent_read" on intake_sessions
  for select using (public.is_parent_of_student(student_id));

-- ============================================================================
-- Migration 014 – screening_tests + screening_ratings
--                  + behavior_snapshots.screening_test_id
-- (siehe migrations/014_screening.sql)
-- ============================================================================
create table screening_tests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  student_id uuid not null references students (id) on delete cascade,
  subject text not null,
  status text not null default 'in_progress' check (
    status in ('in_progress','completed','aborted')
  ),
  coach_id uuid references profiles (id) on delete set null,
  coach_note text,
  generated_test jsonb,
  generated_test_version smallint not null default 1,
  result_summary jsonb,
  estimated_total_minutes integer,
  started_at timestamptz,
  completed_at timestamptz
);
create index screening_tests_student_idx on screening_tests (student_id);
create index screening_tests_status_idx on screening_tests (status);
create unique index screening_tests_active_unique
  on screening_tests (student_id, subject)
  where status = 'in_progress';
alter table screening_tests enable row level security;
create policy "screening_tests_select_own" on screening_tests
  for select using (student_id = public.get_my_student_id());
create policy "screening_tests_parent_read" on screening_tests
  for select using (public.is_parent_of_student(student_id));
create policy "screening_tests_coach_admin_all" on screening_tests
  for all
  using (public.get_my_role() in ('coach','admin'))
  with check (public.get_my_role() in ('coach','admin'));

create table screening_ratings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  behavior_snapshot_id uuid not null
    references behavior_snapshots (id) on delete cascade,
  screening_test_id uuid not null
    references screening_tests (id) on delete cascade,
  rating smallint not null check (rating in (1,2,3,4)),
  coach_id uuid references profiles (id) on delete set null
);
create index screening_ratings_snapshot_idx
  on screening_ratings (behavior_snapshot_id);
create index screening_ratings_test_idx
  on screening_ratings (screening_test_id);
alter table screening_ratings enable row level security;
-- append-only: KEIN update-, KEIN delete-Policy
create policy "screening_ratings_coach_insert" on screening_ratings
  for insert with check (public.get_my_role() in ('coach','admin'));
create policy "screening_ratings_coach_admin_read" on screening_ratings
  for select using (public.get_my_role() in ('coach','admin'));
create policy "screening_ratings_student_read" on screening_ratings
  for select using (
    screening_test_id in (
      select id from screening_tests
      where student_id = public.get_my_student_id()
    )
  );
create policy "screening_ratings_parent_read" on screening_ratings
  for select using (
    screening_test_id in (
      select id from screening_tests
      where public.is_parent_of_student(student_id)
    )
  );

alter table behavior_snapshots
  add column screening_test_id uuid
    references screening_tests (id) on delete cascade;
create index behavior_snapshots_screening_idx
  on behavior_snapshots (screening_test_id);

-- ============================================================================
-- Migration 015 – tiers + student_subscriptions  (siehe migrations/015_*.sql)
-- ============================================================================
create table tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price_cents integer not null,
  features jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  active boolean not null default true
);
insert into tiers (name, price_cents, features, sort_order) values
  ('Basic', 8900,
   '["2 Sessions/Woche","Basis-Lernpfad","Monatlicher Eltern-Report"]'::jsonb, 1),
  ('Standard', 12900,
   '["3 Sessions/Woche","KI-Lernpfad","2x Eltern-Report/Monat","Coach-Chat"]'::jsonb, 2),
  ('Premium', 16900,
   '["Unbegrenzte Sessions","Voller KI-Lernpfad","Woechentlicher Report","Prioritaets-Coach","Fachwechsel flexibel"]'::jsonb, 3);
alter table tiers enable row level security;
create policy "tiers_authenticated_read" on tiers
  for select using (auth.role() = 'authenticated');
create policy "tiers_admin_write" on tiers
  for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

create table student_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  student_id uuid not null references students (id) on delete cascade,
  tier_id uuid not null references tiers (id),
  status text not null default 'active' check (
    status in ('active','paused','cancelled')
  ),
  started_at timestamptz default now(),
  ended_at timestamptz
);
create index student_subscriptions_student_idx
  on student_subscriptions (student_id);
alter table student_subscriptions enable row level security;
create policy "student_subscriptions_select_own" on student_subscriptions
  for select using (student_id = public.get_my_student_id());
create policy "student_subscriptions_parent_read" on student_subscriptions
  for select using (public.is_parent_of_student(student_id));
create policy "student_subscriptions_coach_admin_all" on student_subscriptions
  for all
  using (public.get_my_role() in ('coach','admin'))
  with check (public.get_my_role() in ('coach','admin'));

-- ============================================================================
-- Migration 016 – student_coach  (siehe migrations/016_student_coach.sql)
-- ============================================================================
create table student_coach (
  student_id uuid not null references students (id) on delete cascade,
  coach_id uuid not null references profiles (id) on delete cascade,
  assigned_at timestamptz default now(),
  active boolean not null default true,
  primary key (student_id, coach_id)
);
create index student_coach_coach_idx on student_coach (coach_id);
alter table student_coach enable row level security;
create policy "student_coach_select_own" on student_coach
  for select using (student_id = public.get_my_student_id());
create policy "student_coach_parent_read" on student_coach
  for select using (public.is_parent_of_student(student_id));
create policy "student_coach_coach_read" on student_coach
  for select using (coach_id = auth.uid());
create policy "student_coach_admin_all" on student_coach
  for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- ============================================================================
-- Migration 018 – student_task_progress  (siehe migrations/018_*.sql)
-- ============================================================================
create table student_task_progress (
  student_id uuid not null references students (id) on delete cascade,
  task_id uuid not null references tasks (id) on delete cascade,
  completed_at timestamptz default now(),
  primary key (student_id, task_id)
);
create index student_task_progress_student_idx
  on student_task_progress (student_id);
alter table student_task_progress enable row level security;
create policy "student_task_progress_own_rw" on student_task_progress
  for all
  using (student_id = public.get_my_student_id())
  with check (student_id = public.get_my_student_id());
create policy "student_task_progress_parent_read" on student_task_progress
  for select using (public.is_parent_of_student(student_id));
create policy "student_task_progress_coach_admin_read" on student_task_progress
  for select using (public.get_my_role() in ('coach','admin'));
