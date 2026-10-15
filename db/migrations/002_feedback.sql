-- Script 2 module A (approved 14.10.2026): lead source for coaching, and post-event feedback.

alter table coaching_leads
  add column if not exists source text not null default 'home' check (source in ('home', 'thank_you'));

alter table orders
  add column if not exists feedback_requested_at timestamptz;

-- One feedback per order. Personal data stays here; only what Yoav copies to Studio (with consent) is ever public.
create table if not exists feedback (
  order_id          uuid primary key references orders(id) on delete cascade,
  rating            smallint not null check (rating between 1 and 5),
  message           text not null check (char_length(message) between 1 and 600),
  publish_consent   boolean not null default false,
  status            text not null default 'pending' check (status in ('pending', 'published', 'archived')),
  created_at        timestamptz not null default now()
);

create index if not exists orders_feedback_due_idx on orders (status, feedback_requested_at) where status = 'paid';
