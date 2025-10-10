-- Create qa_checks table to persist neutrality and bias audit results
create table if not exists qa_checks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  neutrality_score int not null,
  bias_counts jsonb not null,
  created_at timestamptz not null default now()
);

