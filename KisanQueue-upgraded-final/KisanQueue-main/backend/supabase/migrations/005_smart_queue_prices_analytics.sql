-- Kisan Queue upgrade: indexes and notification compatibility.
create index if not exists idx_prices_crop_mandi_date
  on prices(crop_id, mandi_id, effective_date desc);
create index if not exists idx_queue_tokens_booking_status
  on queue_tokens(booking_id, status);
alter table notifications
  add column if not exists read boolean not null default false;
update notifications set read = true where read_at is not null and read = false;
