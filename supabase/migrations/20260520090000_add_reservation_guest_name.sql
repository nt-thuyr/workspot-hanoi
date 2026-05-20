alter table public.reservations
  add column if not exists guest_name text;
