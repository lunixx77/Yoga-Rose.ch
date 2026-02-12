-- Yogaschule Rosemarie Fischlin – Datenbank-Schema für Supabase
-- In Supabase: SQL Editor → New query → dieses Skript einfügen → Run

-- Angebote (Admin: Angebote)
create table if not exists public.services (
  id text primary key,
  created_date timestamptz not null default now(),
  name text not null,
  description text,
  duration_minutes int not null default 60,
  price numeric,
  type text not null default 'gruppenkurs',
  max_participants int,
  active boolean not null default true,
  use_fixed_times boolean not null default false
);

-- Normale Zeiten (Lektionsplan) nur für Angebote mit use_fixed_times = true
alter table public.services add column if not exists use_fixed_times boolean not null default false;

-- Anfragen (Anfrage-Formular + Admin: Anfragen)
create table if not exists public.bookings (
  id text primary key,
  created_date timestamptz not null default now(),
  service_id text,
  service_name text,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  number_of_days int default 1,
  number_of_participants int default 1,
  preferred_time text,
  is_trial boolean default false,
  message text,
  status text not null default 'neu'
);

-- Bewertungen (Seite Bewertungen + Admin)
create table if not exists public.reviews (
  id text primary key,
  created_date timestamptz not null default now(),
  customer_name text not null,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text,
  booking_id text,
  approved boolean not null default true,
  verified boolean not null default false,
  service_ids jsonb default '[]'
);

-- Neue Spalten für Bewertungen (falls Tabelle schon existiert)
alter table public.reviews add column if not exists verified boolean not null default false;
alter table public.reviews add column if not exists service_ids jsonb default '[]';

-- Blog & Events (Admin: Blog)
create table if not exists public.blog_posts (
  id text primary key,
  created_date timestamptz not null default now(),
  title text not null,
  content text,
  image_url text,
  category text not null default 'news',
  published boolean not null default false,
  price numeric,
  location text,
  max_participants int,
  dates jsonb default '[]',
  bookable boolean not null default false
);

-- Event-Buchungen (Admin: Events)
create table if not exists public.event_bookings (
  id text primary key,
  created_date timestamptz not null default now(),
  event_title text,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  selected_date timestamptz,
  selected_dates jsonb default '[]',
  number_of_participants int default 1,
  status text not null default 'neu'
);

-- Startseiten-Karten (Admin: Startseite)
create table if not exists public.home_cards (
  id text primary key,
  created_date timestamptz not null default now(),
  title text not null,
  description text,
  icon text default '🧘‍♀️',
  bg_color text,
  cta_label text default 'Anfragen',
  cta_page text default 'Booking',
  visible boolean not null default true,
  order_index int not null default 0
);

-- Lese-/Schreibzugriff für anonyme und authentifizierte Clients (für Vite-App)
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.blog_posts enable row level security;
alter table public.event_bookings enable row level security;
alter table public.home_cards enable row level security;

-- Policies: zuerst entfernen, dann anlegen (Skript kann mehrfach ausgeführt werden)
drop policy if exists "Allow all for services" on public.services;
create policy "Allow all for services" on public.services for all using (true) with check (true);

drop policy if exists "Allow all for bookings" on public.bookings;
create policy "Allow all for bookings" on public.bookings for all using (true) with check (true);

drop policy if exists "Allow all for reviews" on public.reviews;
create policy "Allow all for reviews" on public.reviews for all using (true) with check (true);

drop policy if exists "Allow all for blog_posts" on public.blog_posts;
create policy "Allow all for blog_posts" on public.blog_posts for all using (true) with check (true);

drop policy if exists "Allow all for event_bookings" on public.event_bookings;
create policy "Allow all for event_bookings" on public.event_bookings for all using (true) with check (true);

drop policy if exists "Allow all for home_cards" on public.home_cards;
create policy "Allow all for home_cards" on public.home_cards for all using (true) with check (true);
