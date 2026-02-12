alter table public.observations
add column if not exists taken_at timestamptz null;

create index if not exists observations_taken_at_idx
on public.observations (taken_at);
