-- ============================================================================
-- Edvance Content Schema (Aufgaben / Cluster / Microskills)
--
-- Manueller Schritt: Diese Datei im Supabase SQL Editor ausfuehren.
--
-- ⚠️  KONFLIKT MIT schema.sql:
-- Die Tabelle `subjects` existiert bereits aus schema.sql mit der Form
--   (id uuid, name text CHECK (name in ('Mathematik','Deutsch','Englisch')))
-- und ist mit Werten vorbefuellt. Diese Datei definiert `subjects` neu ohne
-- CHECK-Constraint.
--
-- Wenn schema.sql bereits ausgefuehrt wurde, statt der `create table subjects`
-- Anweisung unten den folgenden additiven Block ausfuehren:
--
--   alter table subjects drop constraint if exists subjects_name_check;
--
-- Danach die `create table subjects (...)` Anweisung unten ueberspringen.
-- ============================================================================

-- Fach (Mathematik, Deutsch, Englisch)
create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

-- Themencluster (z.B. "Terme & Gleichungen", "Rationale Zahlen")
create table skill_clusters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete cascade,
  name text not null,
  class_level_min integer not null check (class_level_min between 5 and 13),
  class_level_max integer not null check (class_level_max between 5 and 13),
  sort_order integer default 0
);

-- Mikroskills (z.B. "M8.TG.01 - Terme vereinfachen")
create table microskills (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid references skill_clusters(id) on delete cascade,
  code text not null unique,
  name text not null,
  description text,
  class_level integer not null check (class_level between 5 and 13),
  prerequisite_ids uuid[] default '{}',
  sort_order integer default 0
);

-- Aufgaben (manuell erstellt oder aus externer Quelle importiert)
create table tasks (
  id uuid primary key default gen_random_uuid(),
  microskill_id uuid references microskills(id) on delete set null,
  cluster_id uuid references skill_clusters(id) on delete set null,
  content_type text not null check (
    content_type in ('exercise','exercise_group','article','video','course')
  ),
  title text,
  question text,
  solution text,
  hint text,
  common_errors text,
  coach_note text,
  difficulty integer check (difficulty between 1 and 5),
  estimated_minutes integer default 3,
  class_level integer check (class_level between 5 and 13),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Coach-Hinweise pro Aufgabe (erweiterbar)
create table task_coach_metadata (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  typical_errors text,
  observation_hints text,
  intervention_triggers text,
  updated_at timestamptz default now()
);

-- RLS aktivieren
alter table subjects enable row level security;
alter table skill_clusters enable row level security;
alter table microskills enable row level security;
alter table tasks enable row level security;
alter table task_coach_metadata enable row level security;

-- Policies: Lesen fuer alle eingeloggten User
create policy "authenticated_read_subjects"
  on subjects for select using (auth.role() = 'authenticated');

create policy "authenticated_read_clusters"
  on skill_clusters for select using (auth.role() = 'authenticated');

create policy "authenticated_read_microskills"
  on microskills for select using (auth.role() = 'authenticated');

create policy "authenticated_read_tasks"
  on tasks for select using (auth.role() = 'authenticated');

create policy "coaches_read_task_metadata"
  on task_coach_metadata for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('coach','admin')
    )
  );

-- Schreiben nur fuer Admins
create policy "admin_write_tasks"
  on tasks for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
