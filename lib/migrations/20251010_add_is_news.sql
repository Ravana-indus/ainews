-- Add is_news flag to events for newsworthiness filtering
alter table if exists events add column if not exists is_news boolean default true;
create index if not exists idx_events_is_news on events(is_news);

