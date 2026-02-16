# LockedIn – Ultra‑Detailed Build Specification (Next.js **16** + Supabase)

> This document is written as **executable instructions** for an AI coding agent.
>
> **Stack requirement:** Use the **latest stable Next.js 16** (not older versions), App Router + TypeScript + Tailwind + Supabase (Auth + Postgres + Realtime + Storage + Edge Functions). Next.js 16 is listed as the current LTS with active security support and recent stable releases.[web:106][web:103]

---

## 0) Goals

- Build LockedIn as a production‑grade PWA: mobile‑first, responsive desktop, fast, secure.
- Implement a robust **login → onboarding → dashboard** flow with **no zombie loops** and correct redirects.
- Store personalization and onboarding completion in the database (Supabase Postgres), not just local state.

---

## 1) Core route map

### Public / auth
- `/login` – login form + 18+ confirmation (required)
- `/signup` – signup form + 18+ confirmation (required)

### Onboarding wizard (protected; only for authenticated users whose profile is not completed)
- `/onboarding/welcome`
- `/onboarding/tier`
- `/onboarding/personality`
- `/onboarding/limits`
- `/onboarding/goals`
- `/onboarding/review`

### App (protected; only for authenticated + onboarded)
- `/home` – dashboard (timer + current task + stats)
- `/tasks`
- `/chat`
- `/calendar`
- `/settings` – includes **Reset onboarding** for testing

### Root behavior
- `/` should redirect to:
  - `/home` if authenticated + onboarded
  - `/onboarding/tier` if authenticated + not onboarded
  - `/login` if not authenticated

---

## 2) Non‑negotiable redirect rules

A single source of truth decides access:

- Auth state = presence of a Supabase session user (`auth.users`).
- Onboarding state = `profiles.onboarding_completed` boolean.

Routing rules:
1. If `user == null` → all protected routes redirect to `/login`.
2. If `user != null` and `profile == null` → **create stub profile** then treat as not onboarded.
3. If `user != null` and `profile.onboarding_completed == false` → any `/home|/tasks|/chat|/calendar|/settings` redirects to `/onboarding/tier`.
4. If `user != null` and `profile.onboarding_completed == true` → any `/onboarding/*` redirects to `/home`.

This is required to prevent the “spinning zombie loop” when profiles are deleted or local state is stale.

---

## 3) Supabase database design

### 3.1 Tables

#### `profiles` (critical)
**One row per auth user.** Stores onboarding + personalization.

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text,

  tier text check (tier in ('Newbie','Slave','Hardcore','Extreme','Destruction')),
  ai_personality text,

  hard_limits text[] not null default '{}',
  soft_limits text[] not null default '{}',
  interests text[] not null default '{}',

  initial_lock_goal_hours int,

  willpower_score int not null default 50 check (willpower_score between 0 and 100),
  compliance_streak int not null default 0,
  total_sessions int not null default 0,
  total_denial_hours bigint not null default 0,
  total_edges bigint not null default 0,

  onboarding_completed boolean not null default false,
  onboarding_step int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### `sessions`
Timer source of truth.

```sql
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null check (status in ('active','completed','emergency','failed')),
  start_time timestamptz not null default now(),
  scheduled_end_time timestamptz not null,
  actual_end_time timestamptz,

  tier text not null,
  ai_personality text not null,

  tasks_completed int not null default 0,
  violations int not null default 0,
  punishments_received int not null default 0,

  created_at timestamptz not null default now()
);
```

#### `tasks`

```sql
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,

  task_type text not null,
  genres text[] not null default '{}',
  title text not null,
  description text not null,
  duration_minutes int,
  difficulty int check (difficulty between 1 and 5),

  cage_status text not null check (cage_status in ('caged','uncaged','semi-caged')),

  verification_type text not null default 'self-report'
    check (verification_type in ('photo','video','audio','self-report')),
  verification_requirement text not null default '',

  punishment_type text,
  punishment_hours int,
  punishment_additional text,

  status text not null default 'pending'
    check (status in ('pending','active','completed','failed')),

  assigned_at timestamptz not null default now(),
  deadline timestamptz,
  completed_at timestamptz,

  ai_verification_passed boolean,
  ai_verification_reason text
);
```

#### `chat_messages`

```sql
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,

  sender text not null check (sender in ('ai','user')),
  content text not null,
  message_type text not null
    check (message_type in ('command','question','response','punishment','system')),

  created_at timestamptz not null default now()
);
```

#### `calendars`

```sql
create table if not exists calendars (
  user_id uuid primary key references profiles(id) on delete cascade,
  scheduled_release_date timestamptz,
  adjustment_log jsonb not null default '[]'::jsonb
);
```

### 3.2 Updated_at trigger

```sql
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
before update on profiles
for each row execute procedure set_updated_at();
```

### 3.3 RLS policies (minimum viable)
Enable RLS everywhere and restrict by user_id.

```sql
alter table profiles enable row level security;
alter table sessions enable row level security;
alter table tasks enable row level security;
alter table chat_messages enable row level security;
alter table calendars enable row level security;

create policy "profiles self" on profiles
for select using (auth.uid() = id);

create policy "profiles self update" on profiles
for update using (auth.uid() = id);

create policy "sessions self" on sessions
for select using (auth.uid() = user_id);

create policy "sessions self update" on sessions
for update using (auth.uid() = user_id);

create policy "tasks self" on tasks
for select using (auth.uid() = user_id);

create policy "tasks self update" on tasks
for update using (auth.uid() = user_id);

create policy "chat self select" on chat_messages
for select using (auth.uid() = user_id);

create policy "chat self insert" on chat_messages
for insert with check (auth.uid() = user_id);

create policy "calendar self" on calendars
for select using (auth.uid() = user_id);

create policy "calendar self update" on calendars
for update using (auth.uid() = user_id);
```

### 3.4 Realtime
Enable realtime on `chat_messages`, and optionally `tasks` + `sessions`.

---

## 4) Next.js 16 implementation requirements

### 4.1 Use official Supabase Next.js patterns
Use Supabase’s current Next.js quickstart and patterns for creating clients and environment variables.[web:97]

### 4.2 Environment variables
`.env.local`

- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`

(Use Supabase Connect dialog for the correct values.)[web:97]

### 4.3 Must not rely on stale local state for routing
- Routing decisions must be based on `AuthContext` derived from Supabase session + DB profile.
- LocalStorage onboarding store may exist, but must be cleared on logout and after onboarding completion.

---

## 5) AuthContext: exact behavior

### 5.1 Contract
`AuthContext` must expose:
- `user` (Supabase user or null)
- `profile` (row from `profiles` or null)
- `loading` boolean (true until BOTH auth + profile are resolved)

### 5.2 Startup algorithm
On app load:
1. Fetch Supabase user (`getUser` / session). Supabase supports retrieving a user and session via auth APIs.[web:97]
2. If no user:
   - set `user=null, profile=null, loading=false`
3. If user exists:
   - fetch profile by `id=user.id`
   - if missing: create stub profile row with `onboarding_completed=false`, then re-fetch
   - set `profile` and `loading=false`

**Important:** If profile fetch fails, show an error state (do NOT spin forever).

---

## 6) Route guarding

Create a single client `RouteGuard` component that wraps:
- all onboarding routes
- all dashboard routes

It must implement the redirect rules from section 2.

Use `router.replace` (not push) so users cannot back‑navigate into illegal screens.

---

## 7) Login / Signup requirements

### 7.1 UI
- Email + password
- 18+ checkbox required
- Error handling (invalid credentials, user exists, etc.)

### 7.2 After signup
1. Supabase signup
2. Upsert stub profile (email, username default)
3. Upsert stub calendar row
4. Redirect to `/onboarding/tier`

### 7.3 After login
1. Supabase login
2. Fetch profile
3. Redirect based on `onboarding_completed`

---

## 8) Onboarding requirements (must persist)

Each step writes local state; optionally patch DB each step. Final step **must** write everything.

### Steps
1. Tier
2. AI personality
3. Limits + interests
4. Goals (initial lock goal hours)
5. Review + Lock In

### Final “Lock In”
- Update `profiles` with all onboarding fields
- Set `onboarding_completed=true`, `onboarding_step=999`
- Create an `active session` row:
  - `scheduled_end_time = now + initial_lock_goal_hours`
  - status = active
- Redirect to `/home`

---

## 9) Dashboard personalization rules

Dashboard must read personalization ONLY from `profiles` and active `sessions`.

- Tier badge colors
- AI persona label in top bar + chat header
- Task generation inputs (later via Gemini): tier + persona + interests + limits

---

## 10) Testing + debugging: prevent zombie loops

### Required dev tools
- Settings page must include:
  - **Reset onboarding**: sets `onboarding_completed=false`, `onboarding_step=0`, clears local onboarding store, redirects to `/onboarding/tier`
  - **Sign out**: signs out from Supabase, clears all persisted stores, redirects `/login`

### Handling deleted users/profiles
If a developer deletes the profile row manually while the browser still has a session:
- App must detect missing profile
- Recreate stub profile
- Force onboarding

No indefinite spinners.

---

## 11) PWA requirement (Next.js)

Add manifest and service worker so the app is installable. Follow current Next.js PWA guidance (manifest, icons, service worker strategy). Guides exist for Next.js 14–16 era PWA setup.[web:88][web:93]

---

## 12) Definition of Done

- A fresh signup always leads to onboarding, then `/home`.
- A returning onboarded user always lands on `/home`.
- A returning not-onboarded user always lands on onboarding.
- Deleting a profile row does not break the app (it recreates profile and continues).
- Onboarding completion always redirects to `/home` with no spinners.
- Dashboard shows tier/persona pulled from DB.

---

## 13) Notes for AI coding agents

- Never store “logged in” state in localStorage; always trust Supabase session.
- Never block on profile fetch without timeout/error UI.
- Always clear persisted Zustand stores on logout.
- Avoid double redirects by waiting for `AuthContext.loading === false`.

---

**End of spec.**
