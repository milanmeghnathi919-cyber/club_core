-- =============================================================================
-- 007_guardrails.sql
-- Zero double-booking guarantee (PDF: "two people must never end up on the
-- same court at the same time").
-- Depends on: 001_core.sql (bookings)
-- =============================================================================

-- btree_gist lets a GiST index enforce uuid equality AND time-range overlap
-- in a single constraint.
create extension if not exists btree_gist;

-- Defense in depth: the application already rejects overlaps (BR-02 -> HTTP 409
-- SLOT_TAKEN) and holds a per-slot lock, but two genuinely racing requests must
-- never be able to slip past that. With this constraint the database itself
-- refuses any second non-cancelled booking whose [start_at, end_at) range
-- overlaps an existing one on the same court (SQLSTATE 23P01, mapped to
-- 409 SLOT_TAKEN by the API error handler).
--
-- Matches the application rule exactly: only cancelled bookings are ignored.
-- The DROP first keeps the migration idempotent across reruns.
alter table public.bookings drop constraint if exists bookings_no_overlap;

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    court_id with =,
    tstzrange(start_at, end_at) with &&
  )
  where (status <> 'cancelled');
