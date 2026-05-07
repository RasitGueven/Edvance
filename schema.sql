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
