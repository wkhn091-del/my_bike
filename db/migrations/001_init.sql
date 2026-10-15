-- RideWithYoav: orders, riders and leads. Personal data lives here only (PROJECT_BRIEF stage 2, section ו).

create table if not exists orders (
  id                      uuid primary key,
  status                  text not null check (status in ('held', 'paid', 'cancelled', 'refunded')),
  quantity                smallint not null check (quantity between 1 and 4),
  early_tickets           smallint not null default 0 check (early_tickets between 0 and 4),
  amount_agorot           integer not null check (amount_agorot >= 0),
  discount_kind           text not null check (discount_kind in ('none', 'early', 'friend', 'coupon')),
  coupon_code             text,
  pricing                 jsonb not null,
  full_name               text not null check (char_length(full_name) <= 80),
  phone                   text not null check (char_length(phone) <= 20),
  email                   text not null check (char_length(email) <= 120),
  riding_level            text not null check (riding_level in ('beginner', 'intermediate', 'advanced')),
  marketing_opt_in        boolean not null default false,
  wall_opt_in             boolean not null default false,
  hold_expires_at         timestamptz not null,
  cardcom_low_profile_id  text unique,
  cardcom_transaction_id  bigint,
  paid_at                 timestamptz,
  seat_start              smallint,
  bike_type               text check (char_length(bike_type) <= 60),
  details_submitted_at    timestamptz,
  created_at              timestamptz not null default now()
);

create index if not exists orders_active_idx on orders (status, hold_expires_at);
create index if not exists orders_coupon_idx on orders (coupon_code) where coupon_code is not null;

create table if not exists participants (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders(id) on delete cascade,
  position           smallint not null check (position between 1 and 4),
  full_name          text not null check (char_length(full_name) <= 80),
  phone              text check (char_length(phone) <= 20),
  birth_date         date not null,
  parent_name        text check (char_length(parent_name) <= 80),
  parent_phone       text check (char_length(parent_phone) <= 20),
  parent_email       text check (char_length(parent_email) <= 120),
  parent_consent_at  timestamptz,
  parent_signed_name text check (char_length(parent_signed_name) <= 80),
  created_at         timestamptz not null default now(),
  unique (order_id, position)
);

create table if not exists coaching_leads (
  id               uuid primary key default gen_random_uuid(),
  full_name        text not null check (char_length(full_name) <= 80),
  phone            text not null check (char_length(phone) <= 20),
  marketing_opt_in boolean not null default false,
  created_at       timestamptz not null default now()
);

create table if not exists waitlist (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null check (char_length(full_name) <= 80),
  phone      text not null check (char_length(phone) <= 20),
  email      text not null check (char_length(email) <= 120),
  quantity   smallint not null check (quantity between 1 and 4),
  created_at timestamptz not null default now()
);
